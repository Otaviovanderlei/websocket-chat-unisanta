const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the hook with a deterministic hook lifecycle and WebSocket transport.
// No browser or running backend is required; server broadcast is simulated.
const source = fs.readFileSync('src/hooks/useWebSocket.ts', 'utf8')
  .replace('import.meta.env.VITE_WS_URL', '"wss://example.test/ws?token=test&roomId=old"')
  .replace('import.meta.env.VITE_API_URL', '"https://example.test"');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText;
const messageUtils = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/messages.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText, messageUtils);

function environment() {
  const sockets = [];
  const requests = [];
  function fetch(url, { signal }) {
    return new Promise((resolve, reject) => requests.push({
      url, signal, reject,
      // Deliberately permit resolving after abort to test the stale-result guard.
      resolve: (data, status = 200) => resolve({ ok: status === 200, status, json: async () => data }),
    }));
  }
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
    const context = { exports: {}, require: name => name === 'react' ? hooks : messageUtils.exports, URL, AbortController, fetch, WebSocket: Socket, console: { error() {} } };
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
  return { client, sockets, requests };
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

const settle = () => new Promise(resolve => setImmediate(resolve));
const persisted = (content, roomId = 'frontend', timestamp = '2026-09-08T18:00:00Z') => ({ sender: 'Otávio', content, roomId, timestamp });

test('history merges with live messages in either arrival order and survives a fresh client', async () => {
  const { client, sockets, requests } = environment();
  const a = client('frontend');
  sockets[0].open();
  assert.equal(a.render().isHistoryLoading, true);
  assert.equal(requests[0].url.pathname, '/api/messages');
  assert.equal(requests[0].url.searchParams.get('roomId'), 'frontend');
  assert.equal(requests[0].url.searchParams.get('limit'), '50');
  const live = persisted('Live', 'frontend', '2026-09-08T19:00:00Z');
  sockets[0].receive(live);
  requests[0].resolve([live, persisted('Teste SQLite 5000'), persisted('Wrong room', 'backend')]);
  await settle();
  assert.equal(a.render().messages.map(m => m.content).join('|'), 'Teste SQLite 5000|Live');
  sockets[0].receive(live);
  assert.equal(a.render().messages.length, 2);
  assert.equal(a.render().isHistoryLoading, false);
  a.unmount();
  const b = client('frontend');
  requests[1].resolve([persisted('Teste SQLite 5000'), live]);
  await settle();
  assert.equal(b.render().messages.length, 2);
  b.unmount();
});

test('aborted history cannot overwrite state after rapid room changes or a return to the same room', async () => {
  const { client, requests } = environment();
  const a = client('geral');
  a.render('frontend');
  a.render('backend');
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests[1].signal.aborted, true);
  requests[0].resolve([persisted('Geral', 'geral')]);
  requests[1].resolve([persisted('Stale')]);
  requests[2].resolve([persisted('Backend', 'backend')]);
  await settle();
  assert.equal(a.render().messages.map(m => m.content).join('|'), 'Backend');
  a.render('frontend');
  assert.equal(a.render().isHistoryLoading, true);
  assert.equal(a.render().messages.length, 0);
  requests[3].resolve([persisted('Fresh')]);
  await settle();
  assert.equal(a.render().messages.map(m => m.content).join('|'), 'Fresh');
  a.unmount();
  assert.equal(requests[3].signal.aborted, true);
});

test('REST failures leave WebSocket send and receive working', async () => {
  for (const failure of ['network', 'http', 'invalid']) {
    const { client, sockets, requests } = environment();
    const a = client('frontend');
    sockets[0].open();
    if (failure === 'network') requests[0].reject(new Error('Offline'));
    else if (failure === 'http') requests[0].resolve([], 500);
    else requests[0].resolve({ unexpected: true });
    await settle();
    assert.equal(a.render().isHistoryLoading, false);
    assert.ok(a.render().historyError);
    assert.equal(a.render().isConnected, true);
    assert.equal(a.render().sendMessage('Otávio', 'Still online'), true);
    assert.equal(a.render().messages.length, 1);
    a.unmount();
  }
});

test('merge uses all message fields and sorts without mutating inputs', () => {
  const first = persisted('Same');
  const later = persisted('Same', 'frontend', '2026-09-08T19:00:00Z');
  const current = [later];
  const merged = messageUtils.exports.mergeMessages(current, [first, first, { ...first, sender: 'João' }, { ...first, roomId: 'backend' }]);
  assert.equal(merged.length, 4);
  assert.equal(merged.at(-1).timestamp, later.timestamp);
  assert.equal(current.length, 1);
});
