const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scoreGuess, normalize, dictionary, answers } = require('./game.js');
const { recordResult } = require('./game.js');
const { drawGameImage } = require('./game.js');

for (const mode of [1, 2, 4, 8]) {
  test(`imagem do modo ${mode} inclui palpites, cores e todas as respostas`, () => {
    const labels = [], fills = [];
    const ctx = {
      scale() {}, fillRect() {}, beginPath() {}, roundRect() {}, stroke() {},
      fill() { fills.push(this.fillStyle); },
      fillText(text) { labels.push(text); }
    };
    const canvas = { getContext: () => ctx };
    const targets = ['TERMO', 'PRAIA', 'NUVEM', 'FESTA', 'VERDE', 'BRISA', 'CAMPO', 'TIGRE'].slice(0, mode);
    const limit = mode === 1 ? 6 : mode === 2 ? 7 : mode === 4 ? 9 : 13;
    const guesses = [
      { word: 'TERMO', colors: targets.map(target => scoreGuess('TERMO', target)) },
      { word: 'PRAIA', colors: targets.map((target, n) => n === 0 ? null : scoreGuess('PRAIA', target)) }
    ];
    drawGameImage(canvas, { mode, limit, targets, guesses, current: '     ', finished: true });
    for (const target of targets) assert.ok(labels.includes(`Resposta: ${target}`));
    assert.ok(labels.includes(`2/${limit} tentativas · ${mode < 4 ? 'Vitória' : 'Fim de jogo'}`));
    assert.equal(fills.length, mode * limit * 5);
    assert.ok(fills.includes('#84b487'));
    // The solved first board must not receive PRAIA on its second row.
    const letters = labels.filter(text => /^[A-Z]$/.test(text));
    assert.equal(letters.slice(0, 5).join(''), 'TERMO');
    assert.equal(letters.length, 5 + (mode - 1) * 10);
    assert.ok(canvas.width > 0 && canvas.height > 0);
  });
}
test('estatísticas contam vitórias, derrota, sequências e distribuição', () => {
  const initial = { games: 0, wins: 0, streak: 0, best: 0, distribution: Array(7).fill(0) };
  let stats = recordResult(initial, true, 2);
  stats = recordResult(stats, true, 6);
  assert.equal(stats.streak, 2);
  stats = recordResult(stats, false, 6);
  assert.deepEqual(stats, { games: 3, wins: 2, streak: 0, best: 2, distribution: [0, 1, 0, 0, 0, 1, 1] });
  stats = recordResult(stats, true, 1);
  assert.equal(stats.streak, 1);
  assert.equal(stats.best, 2);
  assert.equal(initial.games, 0);
  assert.deepEqual(initial.distribution, Array(7).fill(0));
});
test('verde para a resposta correta', () => assert.deepEqual(scoreGuess('TERMO', 'TERMO'), Array(5).fill('correct')));
test('letras ausentes ficam pretas', () => assert.deepEqual(scoreGuess('NUVEM', 'PASTA'), Array(5).fill('absent')));
test('letra deslocada fica amarela', () => assert.deepEqual(scoreGuess('RAMOS', 'TERMO'), ['present', 'absent', 'present', 'present', 'absent']));
test('prioriza posições corretas e limita repetições', () => assert.deepEqual(scoreGuess('ARARA', 'AMORA'), ['correct', 'absent', 'absent', 'correct', 'correct']));
test('normaliza acentos e cedilha', () => assert.equal(normalize('maçãs'), 'MACAS'));
test('todas as respostas são aceitas no dicionário', () => answers.forEach(word => assert.ok(dictionary.has(word), word)));
test('dicionário amplo aceita palavras comuns, flexões e acentos', () => {
  assert.ok(dictionary.size > 10000);
  for (const word of ['abrir', 'balde', 'cinto', 'filme', 'homem', 'nariz', 'pizza', 'rosto', 'susto', 'sonho', 'falou', 'casou', 'ações', 'órfão', 'maçãs']) {
    assert.ok(dictionary.has(normalize(word)), word);
  }
  assert.ok([...dictionary].every(word => /^[A-Z]{5}$/.test(word)));
  assert.ok(!dictionary.has('ZZZZZ'));
});
test('ampliação inclui flexões verificadas no corpus', () => {
  assert.ok(dictionary.size >= 11000);
  for (const word of ['abane', 'abate', 'abono', 'achou', 'amola', 'assou', 'bebam', 'bebas', 'coube', 'cozeu', 'criem', 'doíam', 'freia', 'giram', 'houve', 'mexeu', 'nasce', 'ouçam', 'pediu', 'rezou', 'tosse', 'traze', 'usava', 'zomba']) {
    assert.ok(dictionary.has(normalize(word)), word);
  }
  assert.equal(dictionary.has('casa'), false);
  assert.equal(dictionary.has('banana'), false);
  assert.equal(dictionary.has('A-B-C'), false);
});
const { createWordDraw } = require('./game.js');
test('sorteio esgota respostas sem repetir, inclusive entre modos e recargas', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  let draw = createWordDraw({ storage, random: () => 0 });
  const seen = [...draw(1), ...draw(2), ...draw(4), ...draw(8)];
  draw = createWordDraw({ storage, random: () => 0 });
  while (seen.length < answers.length) seen.push(...draw(Math.min(8, answers.length - seen.length)));
  assert.equal(new Set(seen).size, answers.length);
  const next = draw(8);
  assert.equal(new Set(next).size, 8);
  assert.ok(next.every(word => !seen.slice(-8).includes(word)));
});
test('sorteio tolera armazenamento bloqueado e dados corrompidos', () => {
  for (const storage of [undefined, { getItem() { return '{'; }, setItem() { throw Error('blocked'); } }, { getItem() { return JSON.stringify({ used: [null, 'XXXXX'], recent: [] }); }, setItem() {} }]) {
    const draw = createWordDraw({ storage });
    const result = [...draw(8), ...draw(8)];
    assert.equal(new Set(result).size, 16);
    assert.ok(result.every(word => dictionary.has(word)));
  }
});
test('sorteio atravessa ciclos sem duplicar palavras na mesma partida', () => {
  const pool = answers.slice(0, 10);
  const draw = createWordDraw({ pool, random: () => 0 });
  for (let i = 0; i < 20; i++) assert.equal(new Set(draw(8)).size, 8);
});

test('dicionario corresponde integralmente a auditoria lexical e exclui ruido', () => {
  const audit = require('./dictionary-audit.json');
  assert.deepEqual([...dictionary].sort(), Object.keys(audit.retained).sort());
  assert.equal(dictionary.size, audit.retained_count);
  for (const word of ['ABGLT', 'ASCII', 'AARAO', 'ABNER', 'ALICE', 'ADOLF', 'XVIII', 'XXIII', 'XCIII']) assert.equal(dictionary.has(word), false, word);
  for (const word of audit.removed) assert.equal(dictionary.has(word), false, word);
  for (const entry of Object.values(audit.retained)) {
    assert.equal(entry.spelling, entry.spelling.toLowerCase());
    assert.ok(dictionary.has(normalize(entry.spelling)));
  }
});

const { dailyDate, dailyTargets } = require('./game.js');
test('desafio muda somente a meia-noite de Brasilia e independe do navegador', () => {
  assert.equal(dailyDate(new Date('2026-10-30T02:59:59Z')), '2026-10-29');
  assert.equal(dailyDate(new Date('2026-10-30T03:00:00Z')), '2026-10-30');
  for (const mode of [1, 2, 4, 8]) {
    const today = dailyTargets('2026-10-29', mode);
    assert.equal(new Set(today).size, mode);
    assert.deepEqual(today, dailyTargets('2026-10-29', mode));
    assert.notDeepEqual(today, dailyTargets('2026-10-30', mode));
    assert.ok(today.every(word => dictionary.has(word)));
  }
});
