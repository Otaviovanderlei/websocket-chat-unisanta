const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the hook with a deterministic hook lifecycle and WebSocket transport.
// No browser or running backend is required; server broadcast is simulated.
const source = fs.readFileSync('src/hooks/useWebSocket.ts', 'utf8')
  .replace('import.meta.env.VITE_WS_URL', '"wss://example.test/ws?token=test&roomId=old"');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText;

function environment() {
  const sockets = [];
  class Socket {
    static CONNECTING = 0;
    static OPEN = 1;
    readyState = 0;
    constructor(url) { this.url = new URL(url); sockets.push(this); }
    open() { this.readyState = 1; this.onopen?.(); }
    close() { this.readyState = 3; this.onclose?.(); }
    receive(message) { this.onmessage?.({ data: JSON.stringify(message) }); }
    send(payload) {
      this.lastPayload = JSON.parse(payload);
      const message = { ...this.lastPayload, roomId: this.url.searchParams.get('roomId'), timestamp: '2026-09-08T18:30:00Z' };
      sockets.filter(socket => socket.readyState === 1 && socket.url.searchParams.get('roomId') === message.roomId)
        .forEach(socket => socket.receive(message));
    }
  }
  function client(initialRoom) {
    const slots = [];
    let cursor, pending, currentRoom = initialRoom;
    const hooks = {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
      },
      useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
      useCallback(fn) { return fn; },
      useEffect(fn, deps) {
        const index = cursor++;
        if (!slots[index] || deps.some((dep, i) => dep !== slots[index].deps[i])) {
          pending.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; });
        }
      },
    };
    const context = { exports: {}, require: () => hooks, URL, WebSocket: Socket, console: { error() {} } };
    vm.runInNewContext(compiled, context);
    function render(room = currentRoom, commit = true) {
      currentRoom = room; cursor = 0; pending = [];
      const result = context.exports.useWebSocket(room);
      if (commit) pending.forEach(fn => fn());
      return result;
    }
    render();
    return { render, unmount: () => slots.forEach(slot => slot?.cleanup?.()) };
  }
  return { client, sockets };
}

test('broadcast stays in the selected room, history survives switching, payload stays unchanged', () => {
  const { client, sockets } = environment();
  const a = client('frontend'), b = client('frontend'), c = client('backend');
  sockets.forEach(socket => socket.open());
  assert.equal(a.render().sendMessage('Otávio', 'Teste Frontend'), true);
  assert.equal(a.render().messages.length, 1);
  assert.equal(b.render().messages.length, 1);
  assert.equal(c.render().messages.length, 0);
  assert.deepEqual(sockets[0].lastPayload, { sender: 'Otávio', content: 'Teste Frontend' });
  assert.equal(sockets[0].url.searchParams.get('token'), 'test');
  assert.deepEqual(sockets[0].url.searchParams.getAll('roomId'), ['frontend']);
  b.render('backend');
  assert.equal(sockets[1].readyState, 3);
  assert.equal(sockets[1].onmessage, null);
  assert.equal(b.render().isConnected, false);
  sockets.at(-1).open();
  c.render().sendMessage('Pedro', 'Teste Backend');
  assert.equal(b.render().messages[0].content, 'Teste Backend');
  b.render('frontend');
  assert.equal(b.render().messages[0].content, 'Teste Frontend');
  sockets.at(-1).open();
  a.render().sendMessage('Otávio', 'Outra mensagem');
  assert.equal(b.render().messages.length, 2);
  a.unmount(); b.unmount(); c.unmount();
  assert.equal(sockets.filter(socket => socket.readyState < 2).length, 0);
});

test('rapid changes block sends before effects, ignore stale events and clean connecting sockets', () => {
  const { client, sockets } = environment();
  const a = client('geral');
  sockets[0].open();
  const lateMessage = sockets[0].onmessage;
  const lateOpen = sockets[0].onopen;
  const switching = a.render('frontend', false);
  assert.equal(switching.isConnected, false);
  assert.equal(switching.sendMessage('Otávio', 'Não enviar na sala antiga'), false);
  a.render('frontend');
  a.render('backend');
  assert.equal(sockets[1].readyState, 3);
  lateMessage({ data: JSON.stringify({ sender: 'Old', content: 'late', roomId: 'geral', timestamp: '' }) });
  lateOpen();
  assert.equal(a.render().isConnected, false);
  sockets[2].open();
  sockets[2].receive({ sender: 'Wrong', content: 'wrong room', roomId: 'frontend', timestamp: '' });
  sockets[2].receive(null);
  assert.equal(a.render().messages.length, 0);
  assert.equal(a.render().sendMessage('Otávio', '  '), false);
  sockets[2].close();
  assert.equal(a.render().isConnected, false);
  assert.equal(a.render().sendMessage('Otávio', 'Offline'), false);
  a.unmount();
});

test('repeated room switches keep at most one active socket and detach every old handler', () => {
  const { client, sockets } = environment();
  const a = client('geral');
  for (const room of ['frontend', 'backend', 'frontend', 'geral', 'backend', 'geral']) {
    sockets.at(-1).open();
    a.render(room);
    assert.equal(sockets.filter(socket => socket.readyState < 2).length, 1);
    for (const old of sockets.slice(0, -1)) {
      assert.equal(old.readyState, 3);
      for (const handler of ['onopen', 'onmessage', 'onerror', 'onclose']) assert.equal(old[handler], null);
    }
  }
  a.unmount();
  assert.equal(sockets.filter(socket => socket.readyState < 2).length, 0);
});
