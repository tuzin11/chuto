'use strict';
const WORDS = typeof module !== "undefined" ? require("./dictionary.js") : globalThis.ChutoWords;
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const dictionary = new Set(normalize(WORDS).split(/\s+/).filter(word => /^[A-Z]{5}$/.test(word)));
const answers = 'AMIGO TERMO PRAIA LIVRO SONHO NUVEM FESTA VERDE BRISA CAMPO TIGRE PEDRA MUNDO CHAVE FRUTA NOITE TEMPO PONTE CALMA FLORA LEQUE FAROL AREIA FOLHA CANTO SORTE PIANO LUGAR SABOR MAGIA'.split(' ');
function scoreGuess(guess, answer) {
  const result = Array(5).fill('absent');
  const remaining = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct';
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] !== 'correct' && remaining[guess[i]] > 0) {
      result[i] = 'present'; remaining[guess[i]]--;
    }
  }
  return result;
}
function recordResult(stats, won, attempts) {
  const streak = won ? stats.streak + 1 : 0;
  const distribution = [...stats.distribution];
  distribution[won ? attempts - 1 : 6]++;
  return { games: stats.games + 1, wins: stats.wins + Number(won), streak, best: Math.max(stats.best, streak), distribution };
}
if (typeof module !== 'undefined') module.exports = { scoreGuess, normalize, dictionary, answers, recordResult };
if (typeof document !== 'undefined') {
  const board = document.getElementById('board');
  const keyboard = document.getElementById('keyboard');
  const message = document.getElementById('message');
  const dialog = document.getElementById('help-dialog');
  const statsDialog = document.getElementById('stats-dialog');
  let stats = { games: 0, wins: 0, streak: 0, best: 0, distribution: Array(7).fill(0) };
  let lastResult = null;
  function showStats() {
    document.getElementById('stats-games').textContent = stats.games;
    document.getElementById('stats-percent').textContent = `${stats.games ? Math.round(stats.wins / stats.games * 100) : 0}%`;
    document.getElementById('stats-streak').textContent = stats.streak;
    document.getElementById('stats-best').textContent = stats.best;
    const result = document.getElementById('stats-result');
    result.textContent = lastResult ? lastResult.won ? `Você acertou em ${lastResult.attempts} ${lastResult.attempts === 1 ? 'tentativa' : 'tentativas'}!` : `Não foi desta vez. A palavra certa era ${lastResult.answer}.` : 'Suas partidas concluídas aparecem aqui.';
    result.classList.toggle('success', Boolean(lastResult?.won));
    const distribution = document.getElementById('stats-distribution');
    distribution.replaceChildren();
    const maximum = Math.max(1, ...stats.distribution);
    stats.distribution.forEach((count, index) => {
      const row = document.createElement('div'); row.className = 'distribution-row';
      const label = document.createElement('span'); label.textContent = index === 6 ? '☠' : index + 1;
      const bar = document.createElement('div');
      bar.className = 'distribution-bar' + (count === 0 ? ' empty' : '') + (lastResult && index === (lastResult.won ? lastResult.attempts - 1 : 6) ? ' latest' : '');
      bar.style.width = `${Math.max(8, count / maximum * 100)}%`; bar.textContent = count;
      row.setAttribute('aria-label', index === 6 ? `Derrotas: ${count}` : `${index + 1} tentativas: ${count} vitórias`);
      row.append(label, bar); distribution.append(row);
    });
    if (dialog.open) dialog.close();
    if (!statsDialog.open) statsDialog.showModal();
  }
  let answer, guesses, current, cursor, finished, keyStates, revealing = false;
  const tiles = [];
  for (let i = 0; i < 30; i++) {
    const tile = document.createElement('button');
    tile.className = 'tile'; tile.type = 'button'; tile.tabIndex = -1;
    tile.addEventListener('click', () => {
      if (!finished && !revealing && Math.floor(i / 5) === guesses.length) { cursor = i % 5; render(); }
    });
    board.append(tile); tiles.push(tile);
  }
  for (const row of ['QWERTYUIOP', 'ASDFGHJKL', 'ENTER ZXCVBNM BACKSPACE']) {
    const line = document.createElement('div'); line.className = 'key-row';
    const keys = row.includes(' ') ? ['ENTER', ...'ZXCVBNM', 'BACKSPACE'] : [...row];
    for (const value of keys) {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'key' + (value.length > 1 ? ' wide' : '');
      button.textContent = value === 'BACKSPACE' ? '⌫' : value;
      button.dataset.key = value; button.setAttribute('aria-label', value === 'BACKSPACE' ? 'Apagar letra' : value === 'ENTER' ? 'Confirmar palavra' : value);
      button.addEventListener('click', () => input(value)); line.append(button);
    }
    keyboard.append(line);
  }
  function say(text, success = false) { message.textContent = text; message.classList.toggle('success', success); }
  function render() {
    tiles.forEach((tile, i) => {
      const row = Math.floor(i / 5), col = i % 5;
      const past = guesses[row];
      tile.textContent = past ? past.word[col] : row === guesses.length ? current[col] || '' : '';
      tile.className = 'tile' + (past ? ' ' + past.colors[col] : !finished && row === guesses.length ? ' active' + (col === Math.min(cursor, 4) ? ' selected' : '') : '');
      tile.setAttribute('aria-label', `Tentativa ${row + 1}, letra ${col + 1}: ${tile.textContent || 'vazia'}${past ? ', ' + ({ correct: 'posição correta', present: 'outra posição', absent: 'ausente' })[past.colors[col]] : ''}`);
    });
    keyboard.querySelectorAll('[data-key]').forEach(key => { key.className = 'key' + (key.dataset.key.length > 1 ? ' wide' : '') + (keyStates[key.dataset.key] ? ' ' + keyStates[key.dataset.key] : ''); });
    document.getElementById('attempt').innerHTML = `${String(Math.min(guesses.length + 1, 6)).padStart(2, '0')} <i>/ 06</i>`;
  }
  async function reveal(colors) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let col = 0; col < 5; col++) {
      const tile = tiles[guesses.length * 5 + col];
      tile.classList.remove('selected');
      if (!reducedMotion) {
        await tile.animate([
          { transform: 'perspective(600px) rotateX(0deg)' },
          { transform: 'perspective(600px) rotateX(90deg)' }
        ], { duration: 150, easing: 'ease-in', fill: 'forwards' }).finished;
      }
      tile.classList.remove('active');
      tile.classList.add(colors[col]);
      if (!reducedMotion) {
        const opening = tile.animate([
          { transform: 'perspective(600px) rotateX(-90deg)' },
          { transform: 'perspective(600px) rotateX(0deg)' }
        ], { duration: 150, easing: 'ease-out', fill: 'forwards' });
        await opening.finished;
        tile.getAnimations().forEach(animation => animation.cancel());
      }
    }
  }
  async function input(key) {
    if (finished || revealing || dialog.open || statsDialog.open) return;
    if (key === 'ENTER') {
      if (!/^[A-Z]{5}$/.test(current)) return say('Complete as cinco letras antes de confirmar.');
      if (!dictionary.has(current)) return say('Palavra fora do dicionário. Tente outra.');
      if (guesses.some(g => g.word === current)) return say('Você já tentou essa palavra. Experimente outra.');
      const colors = scoreGuess(current, answer);
      revealing = true;
      board.setAttribute('aria-busy', 'true');
      document.getElementById('restart').disabled = true;
      say('Revelando as letras…');
      await reveal(colors);
      guesses.push({ word: current, colors });
      const rank = { absent: 1, present: 2, correct: 3 };
      [...current].forEach((letter, i) => { if ((rank[keyStates[letter]] || 0) < rank[colors[i]]) keyStates[letter] = colors[i]; });
      if (current === answer) { finished = true; say(`Você acertou em ${guesses.length} ${guesses.length === 1 ? 'tentativa' : 'tentativas'}! Que tal outra palavra?`, true); }
      else if (guesses.length === 6) { finished = true; say(`A palavra era ${answer}. Uma nova palavra espera por você.`); }
      else say(`${6 - guesses.length} tentativas restantes. Siga as pistas!`);
      if (finished) {
        lastResult = { won: current === answer, attempts: guesses.length, answer };
        stats = recordResult(stats, lastResult.won, guesses.length);
      }
      current = '     '; cursor = 0;
      revealing = false;
      board.setAttribute('aria-busy', 'false');
      document.getElementById('restart').disabled = false;
    } else if (key === 'BACKSPACE') {
      if (current[cursor] === ' ' && cursor > 0) cursor--;
      current = current.slice(0, cursor) + ' ' + current.slice(cursor + 1);
      say('');
    } else if (key === 'ARROWLEFT') cursor = Math.max(0, cursor - 1);
    else if (key === 'ARROWRIGHT') cursor = Math.min(4, cursor + 1);
    else if (/^[A-Z]$/.test(key)) {
      current = current.slice(0, cursor) + key + current.slice(cursor + 1);
      cursor = Math.min(4, cursor + 1); say('');
    }
    render();
    if (finished) showStats();
  }
  function restart() {
    if (revealing) return;
    const options = answers.filter(word => word !== answer);
    answer = options[Math.floor(Math.random() * options.length)];
    guesses = []; current = '     '; cursor = 0; finished = false; keyStates = {};
    lastResult = null;
    say('Digite uma palavra para começar.'); render();
  }
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || dialog.open || statsDialog.open || event.target.closest('button:not(.tile):not(.key)') && ['Enter', ' '].includes(event.key)) return;
    const key = normalize(event.key);
    if (/^[A-Z]$/.test(key) || ['ENTER', 'BACKSPACE', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) { event.preventDefault(); input(key); }
  });
  document.getElementById('restart').addEventListener('click', restart);
  document.getElementById('show-stats').addEventListener('click', () => { if (!revealing) showStats(); });
  document.getElementById('close-stats').addEventListener('click', () => statsDialog.close());
  document.getElementById('stats-new-game').addEventListener('click', () => { statsDialog.close(); restart(); });
  document.getElementById('help').addEventListener('click', () => dialog.showModal());
  document.getElementById('close-help').addEventListener('click', () => dialog.close());
  document.getElementById('start-playing').addEventListener('click', () => dialog.close());
  restart();
}
