const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Inspect real JSX and rendered markup without opening a transport or browser.
function loadComponents() {
  const cache = new Map();
  const hooks = {
    ...React,
    useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect() {},
    useRef: initial => ({ current: initial }),
    useCallback: fn => fn,
  };
  function load(filename) {
    filename = path.resolve(filename);
    if (cache.has(filename)) return cache.get(filename);
    const source = fs.readFileSync(filename, 'utf8').replace('import.meta.env.VITE_WS_URL', '"wss://example.test/ws"');
    const compiled = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const exports = {};
    cache.set(filename, exports);
    vm.runInNewContext(compiled, {
      exports,
      sessionStorage: { getItem: () => 'Otávio' },
      localStorage: { getItem: () => 'light' },
      require(specifier) {
        if (specifier === 'react') return hooks;
        if (!specifier.startsWith('.')) return require(specifier);
        const base = path.resolve(path.dirname(filename), specifier);
        return load([base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate)));
      },
    });
    return exports;
  }
  return load;
}

test('chat siblings have unique keys and there is exactly one message list and composer', () => {
  const load = loadComponents();
  const App = load('src/App.tsx').default;
  const found = [];
  function visit(element) {
    if (!React.isValidElement(element)) return;
    found.push(element);
    const children = [element.props.children].flat(Infinity).filter(React.isValidElement);
    const keys = children.filter(child => child.key !== null).map(child => child.key);
    assert.equal(new Set(keys).size, keys.length, 'Sibling keys must be unique; duplicates can leave old chat DOM behind');
    children.forEach(visit);
  }
  visit(App());
  assert.equal(found.filter(element => element.type.name === 'MessageList').length, 1);
  assert.equal(found.filter(element => element.type.name === 'MessageInput').length, 1);
});

test('each room renders one empty state, and its first message removes that state', () => {
  const load = loadComponents();
  const { MessageList } = load('src/components/MessageList.tsx');
  const { CHAT_ROOMS } = load('src/config/chatRooms.ts');
  for (const room of CHAT_ROOMS) {
    const props = { roomId: room.id, roomName: room.name, currentUsername: 'Otávio' };
    const empty = renderToStaticMarkup(React.createElement(MessageList, { ...props, messages: [] }));
    assert.equal((empty.match(/class="empty-state"/g) ?? []).length, 1);
    assert.equal((empty.match(/role="log"/g) ?? []).length, 1);
    const messages = [
      { sender: 'Otávio', content: `Mensagem ${room.id}`, roomId: room.id, timestamp: '2026-09-08T18:30:00Z' },
      { sender: 'João', content: 'Resposta', roomId: room.id, timestamp: '2026-09-08T18:31:00Z' },
    ];
    const filled = renderToStaticMarkup(React.createElement(MessageList, { ...props, messages }));
    assert.equal(filled.includes('empty-state'), false);
    assert.equal((filled.match(/role="log"/g) ?? []).length, 1);
    assert.ok(filled.includes('own-message'));
    assert.ok(filled.includes('other-message'));
  }
});
