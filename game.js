'use strict';
const WORDS = typeof module !== "undefined" ? require("./dictionary.js") : globalThis.ChutoWords;
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const dictionary = new Set(normalize(WORDS).split(/\s+/).filter(word => /^[A-Z]{5}$/.test(word)));
const answers = 'AMIGO TERMO PRAIA LIVRO SONHO NUVEM FESTA VERDE BRISA CAMPO TIGRE PEDRA MUNDO CHAVE FRUTA NOITE TEMPO PONTE CALMA FLORA LEQUE FAROL AREIA FOLHA CANTO SORTE PIANO LUGAR SABOR MAGIA'.split(' ');
// Keep answers curated: the larger dictionary also contains uncommon inflections.
answers.push(...'ABRIL ACASO ACENO ACIMA ACRES ADEUS AFETO AGORA AGUDO AINDA AJUDA ALBUM ALGUM ALUNO AMADO AMBOS AMPLO ANDAR ANEXO ANIMO ANJOS ANTES APOIO ARAME ARCAR ARDOR ASTRO ATIVO ATLAS ATRAS ATUAL AUDIO AUTOR AVIAO AVISO BAIXO BALAO BALDE BANCO BANHO BARCO BARRA BARRO BASTA BATOM BEIJO BEIRA BELOS BICHO BOLSA BOMBA BORDA BRACO BRAVO BREVE BRILHO BROTO BRUTO BUSCA CABER CABRA CACAU CAIXA CALDO CALOR CANAL CAPAZ CAPIM CARGA CARNE CARRO CARTA CASAL CASCA CAUSA CEDER CENSO CERCA CERTO CESTA CICLO CINCO CINTO CINZA CLARO CLIMA CLUBE COBRA COFRE COISA COLAR COMER CONTO CORAL CORDA CORPO CORTE COSTA COURO CRAVO CRIME CRISE CRUEL CULPA CURSO CURTO CURVA DADOS DANCA DEIXA DENTE DESDE DEVER DIABO DIGNO DISCO DIZER DOBRO DOIDO DONOS DOUTO DRAMA DUPLA DUQUE DURAR DUVIDA EIXOS ELITE ENFIM ENTRE ENVIO ERROS ESCOL ESTAR ETAPA EXATO EXITO EXTRA FACIL FALHA FALTA FALSO FARTO FATAL FAUNA FEBRE FEIRA FEITO FELIZ FERAS FERRO FICAR FILHO FILME FINAL FIRME FISICO FITAS FIXAR FOGAO FOLIA FONTE FORCA FORMA FORNO FORTE FORUM FOSSO FREIO FRENTE FRITO FUGAZ FUNDO FURIA FUSAO GARRA GASTO GEADA GELAR GEMAS GENIO GENTE GESTO GIRAR GLOBO GOLPE GORDO GOSTO GOZAR GRAMA GRATO GRAVE GRILO GRUPO GUIAR HAVER HEROI HONRA HOTEL HUMOR IDEAL IDOSO IGUAL ILHAS IMPAR INDIO IRMAO JANTA JARRA JOGAR JOVEM JULHO JUNHO JUSTO LABIO LACOS LADOS LAGOA LAPIS LARGO LASER LATIM LAZER LEGAL LEMAS LENTE LENTO LESAO LEVAR LIDAR LIMAO LIMPO LINDA LINHA LISTA LIXAR LOBOS LOCAL LOIRA LONGE LOUCO LOUSA LUCRO LUGAR LUNAR LUTAR MACIO MADRE MAIOR MALHA MAMAE MANGA MANHA MANSO MANTO MARCA MARCO MARES MASSA MATAR MEDIA MEDIR MEIGO MENOR MENOS MENTE MESMO METAL METRO MEXER MILHO MINHA MIOLO MOEDA MOLDE MOLHO MONTE MORAL MORAR MORNO MORTE MOTOR MOVER MUITO MURAL MUSGO NADAR NARIZ NATAL NAVAL NAVIO NEGAR NEGRO NENEM NESTE NETOS NIVEL NOBRE NORTE NOSSA NOTAR NOVOS NUNCA OBTER OESTE OLHAR ONTEM OPCAO ORDEM ORGAO OSSOS OUVIR OVALO OVELHA PADRE PAGAR PALCO PALHA PALMA PAPAI PAPEL PARAR PARDO PARTE PASSO PASTA PATIO PAUSA PEITO PEIXE PELAS PENAS PENSO PERDA PERTO PESAR PIANO PICAR PILHA PINHO PINTO PIRES PISTA PLACA PLANO PLENO PODER POEMA POETA POLVO POMAR POMBO PONTO PORCO PORTA PORTO POSSE POSTE PRADO PRAGA PRAZO PRECO PREGO PRESA PRETO PRIMA PRIMO PROSA PROVA PUDIM PULAR PULGA PULSO PUNHO QUASE QUEDA QUEIJO QUERO QUINA QUOTA RADIO RAIVA RAMOS RAPAZ RASGO RASTO RAZAO REBANHO RECUO REDES REGRA REINO RENDA RENTE RESTO RETAS REVER RIMAR RITMO RIVAL ROCHA RODAR ROLHA ROSAS ROSTO ROUPA SABER SACAR SACOS SAGAZ SAIDA SALAO SALDO SALSA SALTO SALVA SANTO SAUDE SECAR SEDAS SEGUE SEIVA SELVA SENSO SERIO SERRA SERVE SETOR SIGLA SINAL SINTO SITIO SOBRA SOBRE SOCIO SOGRA SOLAR SOLTO SOMAR SONDA SOPRO SORO SOTAO SUAVE SUBIR SUCOS SUJAR SUPER SURDO SURFE SURTO SUSTO TABUA TANGA TANTO TARDE TAXAS TECER TECLA TELAS TEMER TENDA TENIS TENRO TENSO TERRA TESTA TEXTO TINTA TIRAR TOCAR TODAS TOMAR TONTO TORRE TORTA TOTAL TOUCA TOURO TRACO TRAJE TRAMA TREMO TRENO TREVO TRIBO TRIGO TRILHA TROCA TRONO TRUCO TURMA TURNO UNIAO UNICO UNIDO URUBU USADO USINA UTENS UVAIS VAGAO VAGAS VALER VALOR VAPOR VARAL VASOS VASTO VAZIO VELAS VELHO VELOZ VENDA VENTO VERAO VERBO VERSO VESTE VEZES VIDEO VIDRO VIGIA VILAO VINHO VINTE VIOLA VIRAR VIRUS VISAR VISTA VITAL VIUVA VIVER VOLTA VOTAR VULTO XAMPU ZEBRA ZELAR'.split(' ').filter(word => dictionary.has(word) && !answers.includes(word)));
const answerPool = [...new Set(answers)];
function createWordDraw({ storage, random = Math.random, pool = answerPool } = {}) {
  const key = 'chuto-word-history-v1';
  const words = [...new Set(pool)];
  let used = [], recent = [];
  try {
    const saved = JSON.parse(storage.getItem(key));
    if (Array.isArray(saved?.used) && Array.isArray(saved?.recent)) {
      used = [...new Set(saved.used.filter(word => words.includes(word)))];
      recent = saved.recent.filter(word => words.includes(word)).slice(-8);
    }
  } catch (_) { /* Storage can be unavailable in private or local-file contexts. */ }
  return function draw(count) {
    if (!Number.isInteger(count) || count < 1 || count > words.length) throw new RangeError('Invalid word count');
    const selected = [];
    while (selected.length < count) {
      let available = words.filter(word => !used.includes(word) && !selected.includes(word));
      if (!available.length) {
        used = [];
        available = words.filter(word => !selected.includes(word) && !recent.includes(word));
        if (!available.length) available = words.filter(word => !selected.includes(word));
      }
      const word = available[Math.floor(random() * available.length)];
      selected.push(word); used.push(word);
      recent = [...recent, word].slice(-8);
    }
    try { storage.setItem(key, JSON.stringify({ used, recent })); } catch (_) {}
    return selected;
  };
}
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
  distribution[won ? attempts - 1 : distribution.length - 1]++;
  return { games: stats.games + 1, wins: stats.wins + Number(won), streak, best: Math.max(stats.best, streak), distribution };
}
function drawGameImage(canvas, { mode, limit, targets, guesses, current, finished }) {
  const size = 52, gap = 6, panelWidth = 5 * size + 4 * gap, panelGap = 28, padding = 40;
  const columns = Math.min(mode, 4), rows = Math.ceil(mode / columns);
  const panelHeight = 100 + limit * (size + gap);
  const width = padding * 2 + columns * panelWidth + (columns - 1) * panelGap;
  const height = 220 + rows * panelHeight;
  canvas.width = width * 2; canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.scale(2, 2);
  ctx.fillStyle = '#161918'; ctx.fillRect(0, 0, width, height);
  const text = (value, x, y, font, color = '#f0f1e9') => {
    ctx.font = font; ctx.fillStyle = color; ctx.fillText(value, x, y);
  };
  text(mode === 1 ? 'Chutô' : mode === 2 ? 'Chutô²' : mode === 4 ? 'Chutô⁴' : 'Chutô⁸', padding, 65, 'bold 36px sans-serif', '#84b487');
  text('Cada letra conta.', padding, 100, '16px sans-serif', '#8f9791');
  const won = targets.every((target, n) => guesses.some(guess => guess.colors[n] && guess.word === target));
  text(`${guesses.length}/${limit} tentativas · ${finished ? won ? 'Vitória' : 'Fim de jogo' : 'Em andamento'}`, padding, 140, '15px sans-serif');
  const palette = { correct: '#84b487', present: '#c5a657', absent: '#0b0e0d' };
  targets.forEach((target, n) => {
    const x = padding + (n % columns) * (panelWidth + panelGap);
    const offsetY = Math.floor(n / columns) * panelHeight;
    text(`PALAVRA ${n + 1}`, x, offsetY + 184, 'bold 12px sans-serif', '#8f9791');
    const solved = guesses.some(guess => guess.colors[n] && guess.word === target);
    for (let row = 0; row < limit; row++) {
      const past = guesses[row];
      const colors = past?.colors[n];
      const word = colors ? past.word : !finished && !solved && row === guesses.length ? current : '';
      for (let col = 0; col < 5; col++) {
        const left = x + col * (size + gap), top = offsetY + 202 + row * (size + gap);
        const state = colors?.[col];
        ctx.fillStyle = palette[state] || '#202622';
        ctx.beginPath(); ctx.roundRect(left, top, size, size, 6); ctx.fill();
        ctx.strokeStyle = state ? palette[state] : '#343d36'; ctx.lineWidth = 2; ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        text(word[col] || '', left + size / 2, top + size / 2 + 1, 'bold 28px sans-serif', state === 'correct' ? '#102117' : state === 'present' ? '#241e10' : '#f0f1e9');
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }
    text(`Resposta: ${target}`, x, offsetY + 232 + limit * (size + gap), 'bold 18px sans-serif', '#84b487');
  });
  text('Verde: posição certa  ·  Amarelo: outra posição', padding, height - 28, '12px sans-serif', '#8f9791');
  return canvas;
}
if (typeof module !== 'undefined') module.exports = { scoreGuess, normalize, dictionary, answers, recordResult, drawGameImage, createWordDraw };
if (typeof document !== 'undefined') {
  const board = document.getElementById('board');
  const keyboard = document.getElementById('keyboard');
  const message = document.getElementById('message');
  const dialog = document.getElementById('help-dialog');
  const statsDialog = document.getElementById('stats-dialog');
  let mode = 1, limit = 6, targets = [], solved = [], boardKeys = [];
  const sessions = new Map();
  let wordStorage;
  try { wordStorage = window.localStorage; } catch (_) {}
  const drawWords = createWordDraw({ storage: wordStorage });
  let stats = { games: 0, wins: 0, streak: 0, best: 0, distribution: Array(7).fill(0) };
  let lastResult = null;
  function showStats() {
    document.getElementById('share-status').textContent = '';
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
      const label = document.createElement('span'); label.textContent = index === limit ? '☠' : index + 1;
      const bar = document.createElement('div');
      bar.className = 'distribution-bar' + (count === 0 ? ' empty' : '') + (lastResult && index === (lastResult.won ? lastResult.attempts - 1 : limit) ? ' latest' : '');
      bar.style.width = `${Math.max(8, count / maximum * 100)}%`; bar.textContent = count;
      row.setAttribute('aria-label', index === limit ? `Derrotas: ${count}` : `${index + 1} tentativas: ${count} vitórias`);
      row.append(label, bar); distribution.append(row);
    });
    if (dialog.open) dialog.close();
    if (!statsDialog.open) statsDialog.showModal();
  }
  let guesses, current, cursor, finished, revealing = false;
  let tiles = [];
  function buildBoards() {
    board.replaceChildren(); tiles = [];
    for (let n = 0; n < mode; n++) {
      const panel = document.createElement('section'); panel.className = 'word-panel';
      panel.setAttribute('aria-label', `Palavra ${n + 1}`);
      if (mode > 1) {
        const label = document.createElement('div'); label.className = 'word-label';
        label.textContent = `PALAVRA ${n + 1}`; panel.append(label);
      }
      const grid = document.createElement('div'); grid.className = 'word-grid';
      for (let i = 0; i < limit * 5; i++) {
        const tile = document.createElement('button');
        tile.className = 'tile'; tile.type = 'button'; tile.tabIndex = -1;
        tile.addEventListener('click', () => {
          if (reopenFinishedStats()) return;
          if (!finished && !revealing && !solved[n] && Math.floor(i / 5) === guesses.length) { cursor = i % 5; render(); }
        });
        grid.append(tile); tiles.push(tile);
      }
      panel.append(grid); board.append(panel);
    }
    board.setAttribute('aria-label', `${mode} ${mode === 1 ? 'palavra' : 'palavras'}, ${limit} tentativas`);
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
      const n = Math.floor(i / (limit * 5)), row = Math.floor((i % (limit * 5)) / 5), col = i % 5;
      const entry = guesses[row];
      const past = entry && entry.colors[n] ? { word: entry.word, colors: entry.colors[n] } : null;
      tile.textContent = past ? past.word[col] : !solved[n] && row === guesses.length ? current[col] || '' : '';
      tile.className = 'tile' + (past ? ' ' + past.colors[col] : !finished && !solved[n] && row === guesses.length ? ' active' + (col === Math.min(cursor, 4) ? ' selected' : '') : '');
      tile.setAttribute('aria-label', `Palavra ${n + 1}, tentativa ${row + 1}, letra ${col + 1}: ${tile.textContent || 'vazia'}${past ? ', ' + ({ correct: 'posição correta', present: 'outra posição', absent: 'ausente' })[past.colors[col]] : ''}`);
    });
    keyboard.querySelectorAll('[data-key]').forEach(key => {
      key.className = 'key' + (key.dataset.key.length > 1 ? ' wide' : '');
      key.style.background = ''; key.style.color = '';
      if (mode === 1) { if (boardKeys[0][key.dataset.key]) key.classList.add(boardKeys[0][key.dataset.key]); }
      else if (key.dataset.key.length === 1) {
        const palette = { correct: 'var(--green)', present: 'var(--yellow)', absent: 'var(--black)' };
        const segments = boardKeys.map((states, n) => `${palette[states[key.dataset.key]] || '#303832'} ${n / mode * 100}% ${(n + 1) / mode * 100}%`);
        key.style.background = `linear-gradient(to right, ${segments.join(',')})`;
        key.style.color = '#fff';
      }
    });
    board.querySelectorAll('.word-panel').forEach((panel, n) => {
      panel.classList.toggle('solved', solved[n]);
      const label = panel.querySelector('.word-label');
      if (label) label.textContent = `PALAVRA ${n + 1}${solved[n] ? ' ✓' : ''}`;
    });
    document.getElementById('attempt').innerHTML = `${String(Math.min(guesses.length + 1, limit)).padStart(2, '0')} <i>/ ${String(limit).padStart(2, '0')}</i>`;
  }
  async function reveal(colors) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let col = 0; col < 5; col++) {
      await Promise.all(colors.map(async (result, n) => {
        if (!result) return;
        const tile = tiles[n * limit * 5 + guesses.length * 5 + col];
        tile.classList.remove('selected');
        if (!reducedMotion) await tile.animate([{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(90deg)' }], { duration: 150 }).finished;
        tile.classList.remove('active'); tile.classList.add(result[col]);
        if (!reducedMotion) await tile.animate([{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(0deg)' }], { duration: 150 }).finished;
      }));
    }
  }

  function reopenFinishedStats() {
    if (!finished || revealing || dialog.open) return false;
    if (!statsDialog.open) showStats();
    return true;
  }
  board.addEventListener('click', reopenFinishedStats);
  keyboard.addEventListener('click', reopenFinishedStats);

  async function input(key) {
    if (revealing || dialog.open || statsDialog.open) return;
    if (reopenFinishedStats()) return;
    if (key === 'ENTER') {
      if (!/^[A-Z]{5}$/.test(current)) return say('Complete as cinco letras antes de confirmar.');
      if (!dictionary.has(current)) return say('Palavra fora do dicionário. Tente outra.');
      if (guesses.some(g => g.word === current)) return say('Você já tentou essa palavra. Experimente outra.');
      const colors = targets.map((target, n) => solved[n] ? null : scoreGuess(current, target));
      revealing = true;
      board.setAttribute('aria-busy', 'true');
      document.getElementById('restart').disabled = true;
      say('Revelando as letras…');
      await reveal(colors);
      guesses.push({ word: current, colors });
      const rank = { absent: 1, present: 2, correct: 3 };
      colors.forEach((result, n) => {
        if (!result) return;
        [...current].forEach((letter, i) => { if ((rank[boardKeys[n][letter]] || 0) < rank[result[i]]) boardKeys[n][letter] = result[i]; });
        if (current === targets[n]) solved[n] = true;
      });
      const won = solved.every(Boolean);
      finished = won || guesses.length === limit;
      if (won) say(`Você acertou ${mode === 1 ? 'a palavra' : 'todas as palavras'} em ${guesses.length} tentativas!`, true);
      else if (finished) say(`Respostas: ${targets.join(', ')}.`);
      else say(`${limit - guesses.length} tentativas restantes.${mode > 1 ? ` ${solved.filter(Boolean).length}/${mode} palavras resolvidas.` : ' Siga as pistas!'}`);
      if (finished) {
        lastResult = { won, attempts: guesses.length, answer: targets.join(', ') };
        stats = recordResult(stats, won, guesses.length);
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
      const nextEmpty = current.indexOf(' ', cursor + 1);
      const firstEmpty = current.indexOf(' ');
      if (nextEmpty !== -1) cursor = nextEmpty;
      else if (firstEmpty !== -1) cursor = firstEmpty;
      say('');
    }
    render();
    if (finished) showStats();
  }
  function restart() {
    if (revealing) return;
    targets = drawWords(mode);
    solved = Array(mode).fill(false); boardKeys = Array.from({ length: mode }, () => ({}));
    guesses = []; current = '     '; cursor = 0; finished = false;
    lastResult = null;
    buildBoards();
    say('Digite uma palavra para começar.'); render();
  }
  function switchMode(next) {
    if (revealing || next === mode) return;
    sessions.set(mode, { targets, solved, boardKeys, guesses, current, cursor, finished, stats, lastResult, text: message.textContent, success: message.classList.contains('success') });
    mode = next; limit = mode === 1 ? 6 : mode === 2 ? 7 : mode === 4 ? 9 : 13;
    document.body.dataset.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(tab => {
      const selected = Number(tab.dataset.mode) === mode;
      tab.classList.toggle('selected', selected); tab.setAttribute('aria-pressed', selected);
    });
    document.querySelector('.intro p').textContent = `${mode === 1 ? 'Uma palavra' : mode === 2 ? 'Duas palavras' : mode === 4 ? 'Quatro palavras' : 'Oito palavras'} de cinco letras. ${limit} chances de descobrir.`;
    document.querySelector('.board-heading > span').textContent = mode === 1 ? 'ENCONTRE A PALAVRA' : `ENCONTRE AS ${mode} PALAVRAS`;
    document.getElementById('help-title').textContent = `Descubra em ${limit} tentativas.`;
    document.getElementById('mode-help').textContent = mode === 1 ? 'Encontre uma palavra em até seis tentativas.' : `Cada palpite vale para as ${mode} palavras ao mesmo tempo. As cores são independentes em cada tabuleiro e nas faixas do teclado, da esquerda para a direita. Palavras resolvidas param de receber palpites. Você tem ${limit} tentativas para resolver todas.`;
    document.querySelector('#restart span').textContent = mode === 1 ? 'Nova palavra' : 'Novas palavras';
    const saved = sessions.get(mode);
    if (saved) {
      ({ targets, solved, boardKeys, guesses, current, cursor, finished, stats, lastResult } = saved);
      buildBoards(); say(saved.text, saved.success); render();
    } else {
      stats = { games: 0, wins: 0, streak: 0, best: 0, distribution: Array(limit + 1).fill(0) };
      restart();
    }
  }
  document.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => { switchMode(Number(tab.dataset.mode)); tab.blur(); }));
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || dialog.open || statsDialog.open || event.target.closest('button:not(.tile):not(.key)') && ['Enter', ' '].includes(event.key)) return;
    const key = normalize(event.key);
    if (/^[A-Z]$/.test(key) || ['ENTER', 'BACKSPACE', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) { event.preventDefault(); input(key); }
  });
  document.getElementById('restart').addEventListener('click', restart);
  document.getElementById('stats-share').addEventListener('click', async () => {
    const button = document.getElementById('stats-share');
    const status = document.getElementById('share-status');
    if (button.disabled || revealing) return;
    button.disabled = true; status.textContent = 'Gerando imagem…';
    try {
      const canvas = drawGameImage(document.createElement('canvas'), { mode, limit, targets, guesses, current, finished });
      const filename = `chuto${mode === 1 ? '' : '-' + mode}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Imagem vazia')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = filename;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = 'Download iniciado! A imagem inclui os palpites e as respostas.';
    } catch (error) {
      status.textContent = 'Não foi possível gerar a imagem. Tente novamente.';
    } finally { button.disabled = false; }
  });
  document.getElementById('show-stats').addEventListener('click', () => { if (!revealing) showStats(); });
  document.getElementById('close-stats').addEventListener('click', () => statsDialog.close());
  document.getElementById('stats-new-game').addEventListener('click', () => { statsDialog.close(); restart(); });
  document.getElementById('help').addEventListener('click', () => dialog.showModal());
  document.getElementById('close-help').addEventListener('click', () => dialog.close());
  document.getElementById('start-playing').addEventListener('click', () => dialog.close());
  restart();
}
