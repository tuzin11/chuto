const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { dailyTargets } = require('./game.js');
const SINGLE = dailyTargets('2026-10-29', 1)[0];
const [DUET_FIRST, DUET_SECOND] = dailyTargets('2026-10-29', 2);

function setup({ storage = new Map(), clock = { now: Date.parse("2026-10-29T15:00:00Z") } } = {}) {
  class Element {
    constructor() { this.children = []; this.dataset = {}; this.style = {}; this.attributes = {}; this.listeners = {}; this.className = ''; this.textContent = ''; this.open = false; }
    get classList() { return { contains: name => this.className.split(' ').includes(name), add: name => { if (!this.classList.contains(name)) this.className += ' ' + name; }, remove: name => { this.className = this.className.split(' ').filter(x => x !== name).join(' '); }, toggle: (name, on) => on ? this.classList.add(name) : this.classList.remove(name) }; }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren() { this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    querySelectorAll(selector) { const nodes = this.children.flatMap(node => [node, ...node.querySelectorAll(selector)]); return nodes.filter(node => selector === '[data-key]' ? node.dataset.key : node.classList.contains(selector.slice(1))); }
    querySelector(selector) { return this.querySelectorAll(selector)[0]; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    blur() {}
  }
  const nodes = new Map();
  const get = key => { if (!nodes.has(key)) nodes.set(key, new Element()); return nodes.get(key); };
  const tabs = [1, 2, 4, 8].map(mode => { const tab = new Element(); tab.dataset.mode = String(mode); return tab; });
  const events = {};
  const document = { body: new Element(), getElementById: get, createElement: () => new Element(), querySelector: get, querySelectorAll: () => tabs, addEventListener(name, callback) { events[name] = callback; } };
  const math = Object.create(Math); math.random = () => 0;
  class FakeDate extends Date { constructor(...args) { super(...(args.length ? args : [clock.now])); } }
  const context = vm.createContext({ Date: FakeDate, document, Math: math, window: { localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }, matchMedia: () => ({ matches: true }) }, globalThis: { ChutoWords: require('./dictionary.js') } });
  vm.runInContext(fs.readFileSync('game.js', 'utf8'), context);
  return { get, tabs, events, board: () => get('board').children };
}
// Reach the handlers through the same virtual keys used by the player.
async function guess(app, word) {
  const keys = app.get('keyboard').querySelectorAll('[data-key]');
  for (const letter of word) await keys.find(key => key.dataset.key === letter).listeners.click();
  await keys.find(key => key.dataset.key === 'ENTER').listeners.click();
}
function row(panel, index) { const grid = panel.children.at(-1); return grid.children.slice(index * 5, index * 5 + 5).map(tile => tile.textContent).join(''); }

test('parallel boards, solved board freezes, mode switching preserves progress, victory stats', async () => {
  const app = setup();
  assert.equal(app.board().length, 1);
  app.tabs[1].listeners.click();
  assert.equal(app.board().length, 2);
  assert.equal(app.board()[0].children.at(-1).children.length, 35);
  // Each mode uses its fixed, disjoint daily answers.
  await guess(app, DUET_FIRST);
  assert.equal(row(app.board()[0], 0), DUET_FIRST);
  assert.ok(app.board()[0].classList.contains('solved'));
  assert.equal(row(app.board()[1], 0), DUET_FIRST);
  app.tabs[2].listeners.click();
  assert.equal(app.board().length, 4);
  assert.equal(app.board()[0].children.at(-1).children.length, 45);
  app.tabs[1].listeners.click();
  assert.equal(row(app.board()[1], 0), DUET_FIRST);
  await guess(app, DUET_SECOND);
  assert.equal(row(app.board()[0], 1), '');
  assert.equal(row(app.board()[1], 1), DUET_SECOND);
  assert.equal(app.get('stats-games').textContent, 1);
  assert.equal(app.get('stats-percent').textContent, '100%');
  assert.equal(app.get('stats-distribution').children.length, 8);
  app.get('stats-dialog').close();
  app.tabs[0].listeners.click();
  assert.equal(row(app.board()[0], 0), '     ');
  app.get('show-stats').listeners.click();
  assert.equal(app.get('stats-games').textContent, 0);
});

test('quartet accepts nine guesses and records defeat in the final distribution row', async () => {
  const app = setup(); app.tabs[2].listeners.click();
  for (const word of ['NUVEM', 'FESTA', 'VERDE', 'BRISA', 'CAMPO', 'TIGRE', 'PEDRA', 'MUNDO', 'CHAVE']) await guess(app, word);
  assert.equal(app.get('stats-games').textContent, 1);
  assert.equal(app.get('stats-percent').textContent, '0%');
  assert.equal(app.get('stats-distribution').children.length, 10);
  assert.equal(app.get('stats-distribution').children[9].children[1].textContent, 1);
  app.get('close-stats').listeners.click();
  assert.equal(app.get('stats-dialog').open, false);
  assert.equal(row(app.board()[0], 0), 'NUVEM');
});

for (const [mode, tab, limit] of [[1, 0, 6], [2, 1, 7], [4, 2, 9], [8, 3, 13]]) {
  test(`mode ${mode}: finished game reopens stats on physical and virtual letters for the rest of the day`, async () => {
    const app = setup();
    if (tab) app.tabs[tab].listeners.click();
    const targets = require('./game.js').dailyTargets('2026-10-29', mode);
    assert.equal(app.board().length, mode);
    assert.equal(app.board()[0].children.at(-1).children.length, limit * 5);
    for (const word of targets) await guess(app, word);
    assert.equal(app.get('stats-dialog').open, true);
    assert.equal(app.get('stats-games').textContent, 1);
    assert.equal(app.get('stats-distribution').children.length, limit + 1);
    app.get('stats-dialog').close();
    const letter = app.get('keyboard').querySelectorAll('[data-key]').find(key => key.dataset.key === 'A');
    await letter.listeners.click();
    assert.equal(app.get('stats-dialog').open, true);
    app.get('stats-dialog').close();
    app.events.keydown({ key: 'z', target: { closest: () => false }, preventDefault() {} });
    assert.equal(app.get('stats-dialog').open, true);
    assert.equal(app.get('stats-games').textContent, 1);
    app.get('close-stats').listeners.click();
    await letter.listeners.click();
    assert.equal(app.get('stats-dialog').open, true);
    assert.equal(row(app.board()[0], 0), targets[0]);
  });
}

test('octet preserves progress across tabs and allows thirteen guesses before defeat', async () => {
  const app = setup(); app.tabs[3].listeners.click();
  await guess(app, 'CAMPO');
  app.tabs[0].listeners.click(); app.tabs[3].listeners.click();
  assert.equal(row(app.board()[7], 0), 'CAMPO');
  for (const word of ['TIGRE', 'PEDRA', 'MUNDO', 'CHAVE', 'FRUTA', 'NOITE', 'TEMPO', 'PONTE', 'CALMA', 'FLORA', 'LEQUE']) await guess(app, word);
  assert.equal(app.get('stats-dialog').open, false);
  await guess(app, 'FAROL');
  assert.equal(app.get('stats-dialog').open, true);
  assert.equal(app.get('stats-percent').textContent, '0%');
  assert.equal(app.get('stats-distribution').children[13].children[1].textContent, 1);
});

for (const [mode, tab] of [[1, 0], [2, 1], [4, 2], [8, 3]]) {
  test(`mode ${mode}: typing skips filled cells and permits explicit edits`, async () => {
    const app = setup();
    if (tab) app.tabs[tab].listeners.click();
    const tiles = app.board()[0].children.at(-1).children;
    const press = key => app.get('keyboard').querySelectorAll('[data-key]').find(button => button.dataset.key === key).listeners.click();
    tiles[1].listeners.click(); await press('M');
    tiles[3].listeners.click(); await press('G');
    tiles[0].listeners.click(); await press('A');
    assert.ok(tiles[2].classList.contains('selected'));
    await press('I');
    assert.ok(tiles[4].classList.contains('selected'));
    await press('O');
    assert.equal(row(app.board()[0], 0), 'AMIGO');
    tiles[1].listeners.click(); await press('R');
    assert.equal(row(app.board()[0], 0), 'ARIGO');
    tiles[2].listeners.click(); await press('BACKSPACE');
    assert.equal(row(app.board()[0], 0), 'AR GO');
    tiles[0].listeners.click(); await press('A');
    assert.ok(tiles[2].classList.contains('selected'));
    await press('I');
    assert.equal(row(app.board()[0], 0), 'ARIGO');
  });
}

test('finished game reopens stats on any tile, board space or virtual control without changing result', async () => {
  const app = setup(); await guess(app, SINGLE);
  const tiles = app.board()[0].children.at(-1).children;
  const keys = app.get('keyboard').querySelectorAll('[data-key]');
  const actions = [
    () => tiles[0].listeners.click(),
    () => tiles[29].listeners.click(),
    () => app.get('board').listeners.click(),
    () => app.get('keyboard').listeners.click(),
    () => keys.find(key => key.dataset.key === 'ENTER').listeners.click(),
    () => keys.find(key => key.dataset.key === 'BACKSPACE').listeners.click()
  ];
  for (const action of actions) {
    app.get('stats-dialog').close(); await action();
    assert.equal(app.get('stats-dialog').open, true);
    assert.equal(app.get('stats-games').textContent, 1);
    assert.equal(row(app.board()[0], 0), SINGLE);
  }
});

for (const [mode, tab] of [[1, 0], [2, 1], [4, 2], [8, 3]]) {
  test(`mode ${mode}: only current rows of unsolved boards are enabled`, async () => {
    const app = setup();
    if (tab) app.tabs[tab].listeners.click();
    const check = (attempt, solved = []) => app.board().forEach((panel, n) => {
      panel.children.at(-1).children.forEach((tile, i) => {
        assert.equal(tile.disabled, solved.includes(n) || Math.floor(i / 5) !== attempt);
      });
    });
    check(0);
    await guess(app, 'ZZZZZ'); // Rejected guesses must not unlock the next row.
    check(0);
    for (let i = 0; i < 5; i++) await app.get('keyboard').querySelectorAll('[data-key]').find(key => key.dataset.key === 'BACKSPACE').listeners.click();
    const pending = guess(app, DUET_FIRST);
    await pending;
    check(1, mode === 2 ? [0] : []);
  });
}


test('daily progress and completed result survive reload without counting twice', async () => {
  const storage = new Map();
  let app = setup({ storage });
  await guess(app, DUET_FIRST);
  app = setup({ storage });
  assert.equal(row(app.board()[0], 0), DUET_FIRST);
  await guess(app, SINGLE);
  app = setup({ storage });
  assert.equal(app.get('stats-games').textContent, 1);
  assert.equal(app.get('stats-dialog').open, true);
  app.get('close-stats').listeners.click();
  assert.equal(app.get('stats-games').textContent, 1);
  assert.equal(row(app.board()[0], 1), SINGLE);
});

test('midnight in Brasilia resets all modes and keeps statistics', async () => {
  const storage = new Map(), clock = { now: Date.parse('2026-10-30T02:59:59Z') };
  const app = setup({ storage, clock });
  await guess(app, SINGLE);
  app.get('stats-dialog').close();
  app.tabs[1].listeners.click();
  await guess(app, DUET_FIRST);
  clock.now = Date.parse('2026-10-30T03:00:00Z');
  app.events.visibilitychange();
  assert.equal(row(app.board()[0], 0), '     ');
  app.tabs[0].listeners.click();
  assert.equal(row(app.board()[0], 0), '     ');
  app.get('show-stats').listeners.click();
  assert.equal(app.get('stats-games').textContent, 1);
  assert.ok(storage.has('chuto-daily-v2:2026-10-29'));
});


test('all users get the same daily word, regardless of random or browser history', async () => {
  const first = setup(), second = setup({ storage: new Map([['chuto-word-history-v1', JSON.stringify({ used: [SINGLE], recent: [SINGLE] })]]) });
  for (const app of [first, second]) {
    await guess(app, SINGLE);
    assert.equal(app.get('stats-percent').textContent, '100%');
    assert.equal(app.get('keyboard').hidden, true);
    assert.equal(app.get('share-result').hidden, false);
    assert.equal(app.get('restart').listeners.click, undefined);
    assert.equal(app.get('stats-new-game').listeners.click, undefined);
  }
});

test('completed game stays locked and shareable in a new browser session', async () => {
  const storage = new Map();
  let app = setup({ storage });
  assert.equal(app.get('share-result').hidden, true);
  await guess(app, SINGLE);
  app = setup({ storage });
  assert.equal(row(app.board()[0], 0), SINGLE);
  assert.equal(app.get('keyboard').hidden, true);
  assert.equal(app.get('share-result').hidden, false);
  app.get('close-stats').listeners.click();
  await guess(app, DUET_FIRST);
  assert.equal(row(app.board()[0], 0), SINGLE);
  assert.equal(app.get('stats-games').textContent, 1);
});


test('reload resumes the selected mode and its completed daily game', async () => {
  const storage = new Map();
  let app = setup({ storage });
  app.tabs[1].listeners.click();
  await guess(app, DUET_FIRST);
  app = setup({ storage });
  assert.equal(app.board().length, 2);
  assert.equal(row(app.board()[1], 0), DUET_FIRST);
  await guess(app, DUET_SECOND);
  app = setup({ storage });
  assert.equal(app.board().length, 2);
  assert.equal(row(app.board()[1], 1), DUET_SECOND);
  assert.equal(app.get('stats-dialog').open, true);
  assert.equal(app.get('keyboard').hidden, true);
  assert.equal(app.get('share-result').hidden, false);
  assert.equal(app.get('stats-games').textContent, 1);
});


test('explicit daily reset ignores old daily games while preserving statistics', async () => {
  const storage = new Map([
    ['chuto-daily-v1:2026-10-29', JSON.stringify([[1, { targets: ['AMIGO'], finished: true, guesses: [{ word: 'AMIGO' }] }]])],
    ['chuto-stats-v1:1', JSON.stringify({ games: 3, wins: 2, streak: 1, best: 2, distribution: [1, 1, 0, 0, 0, 0, 1] })]
  ]);
  let app = setup({ storage });
  assert.equal(row(app.board()[0], 0), '     ');
  assert.equal(app.get('keyboard').hidden, false);
  assert.notEqual(SINGLE, 'AMIGO');
  await guess(app, SINGLE);
  assert.equal(app.get('stats-games').textContent, 4);
  app = setup({ storage });
  assert.equal(row(app.board()[0], 0), SINGLE);
  assert.equal(app.get('stats-games').textContent, 4);
});
