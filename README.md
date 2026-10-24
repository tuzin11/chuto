# Chutô

Jogo de palavras em português para navegador de computador. Abra `index.html` diretamente no Chrome, Edge ou Firefox. Não precisa instalar dependências.

- Descubra uma palavra de cinco letras em seis tentativas.
- Verde: letra na posição correta; amarelo: letra em outra posição; preto: letra ausente.
- Letras repetidas respeitam a quantidade de ocorrências na resposta.
- Use o teclado físico ou os botões. Enter confirma e Backspace apaga.
- Acentos e cedilha são desconsiderados. O dicionário local em `dictionary.js` contém 13.701 palavras de cinco letras e funciona sem conexão.
- “Nova palavra” inicia outra partida. O progresso fica apenas na sessão atual.

Layout pensado para desktop, com largura mínima de 1000 px. Fontes do Google Fonts são opcionais; fontes locais são usadas se não houver conexão.

Execute `node --test game.test.js` para verificar as regras de avaliação.

O vocabulário usa a lista https://github.com/pythonprobr/palavras (MPL-2.0, texto em `dicionario-LICENSE.txt`), filtrada para cinco letras, normalizada e complementada com palavras locais. A lista de respostas permanece separada do vocabulário aceito.

A ampliação inclui os arquivos `lexico` e `conjugações` de https://github.com/fserb/pt-br (MIT, texto em `dicionario-fserb-LICENSE.txt`). Cada entrada é normalizada para maiúsculas sem acentos e aceita apenas se contiver exatamente cinco letras de A a Z. A união preserva as palavras anteriores e remove duplicatas. Não são geradas conjugações automaticamente por sufixos.
