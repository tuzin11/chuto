# Chutô

Jogo de palavras em português para navegador de computador. Abra `index.html` diretamente no Chrome, Edge ou Firefox. Não precisa instalar dependências.

- Chutô: uma palavra em seis tentativas. Chutô²: duas palavras em sete tentativas. Chutô⁴: quatro palavras em nove tentativas. Chutô⁸: oito palavras em treze tentativas.
- Nos modos paralelos, cada palpite vale para todas as palavras ainda não resolvidas. As faixas do teclado mostram as pistas de cada tabuleiro na ordem de leitura.
- Progresso e estatísticas de cada modo ficam salvos neste navegador, inclusive ao recarregar ou fechar a página.
- Verde: letra na posição correta; amarelo: letra em outra posição; preto: letra ausente.
- Letras repetidas respeitam a quantidade de ocorrências na resposta.
- Use o teclado físico ou os botões. Enter confirma e Backspace apaga.
- Acentos e cedilha são desconsiderados. O dicionário local em `dictionary.js` contém 11.905 palavras de cinco letras e funciona sem conexão.
- Um desafio fixo por dia em cada modo, igual para todos. A troca ocorre às 00:00 no horário de Brasília, inclusive com a página aberta. O botão Jogo do dia retoma a partida atual.

Layout responsivo: quatro tabuleiros lado a lado no desktop e em duas colunas no celular. Fontes do Google Fonts são opcionais; fontes locais são usadas se não houver conexão.

Execute `node --test game.test.js modes.test.js` para verificar as regras de avaliação.

## Publicar no GitHub Pages

Execute `powershell -ExecutionPolicy Bypass -File .\build-site.ps1` após alterar o jogo. O comando atualiza as versões dos endereços dos arquivos para evitar cache antigo e prepara `github-pages/` e `cinco-site.zip` com o jogo completo.

Envie o conteúdo de `github-pages/` (ou extraia o ZIP) para a pasta que o GitHub Pages publica. O `index.html`, `game.js`, `dictionary.js`, `style.css` e `favicon.svg` devem ficar juntos. Enviar apenas o HTML pode deixar as abas novas com um JavaScript antigo ou sem o dicionário. O ZIP precisa ser extraído; enviar apenas o ZIP não atualiza o site.

A pasta `cinco/dist` contém um protótipo antigo e não deve ser usada para publicar esta versão. Se publicar diretamente a raiz deste projeto, envie os arquivos da raiz juntos, incluindo o `index.html` atualizado pelo comando de preparação.

O vocabulário usa a lista https://github.com/pythonprobr/palavras (MPL-2.0, texto em `dicionario-LICENSE.txt`), filtrada para cinco letras, normalizada e complementada com palavras locais. A lista de respostas permanece separada do vocabulário aceito.

A ampliação inclui os arquivos `lexico` e `conjugações` de https://github.com/fserb/pt-br (MIT, texto em `dicionario-fserb-LICENSE.txt`). Cada entrada é normalizada para maiúsculas sem acentos e aceita apenas se contiver exatamente cinco letras de A a Z. A união preserva as palavras anteriores e remove duplicatas. Não são geradas conjugações automaticamente por sufixos.

- Após encerrar uma partida, qualquer letra no teclado físico ou virtual reabre as estatísticas até o próximo desafio diário.
- Compartilhar baixa um PNG com os palpites, as cores e todas as respostas do modo atual. No Chutô⁸, a imagem organiza os oito tabuleiros em duas fileiras.

## Revisao lexical

A lista original de 13.701 entradas foi cruzada com o VERO (portugues brasileiro), distribuido pelo LibreOffice: https://github.com/LibreOffice/dictionaries/tree/master/pt_BR. Foram mantidas 11.905 entradas e excluidas 1.796 sem respaldo nesta verificacao, incluindo nomes proprios, siglas e numerais romanos. A ausencia nesta base nao prova que um termo inexiste; este e um criterio conservador para o jogo, nao uma certificacao semantica individual.

A validacao considera verbetes originalmente em minusculas e flexoes autorizadas pelas regras Hunspell, com consulta ortografica antes de remover acentos e cedilha. Formas com acentos, plurais e conjugacoes continuam aceitas. As 555 respostas do sorteio passaram pelo mesmo filtro.

`dictionary-audit.json` registra todas as exclusoes e, para cada entrada mantida, uma grafia original e seu radical de origem. Os hashes das fontes tambem ficam no relatorio. As fontes VERO estao em `auditoria-fontes/`; seus creditos e termos LGPLv3/MPL estao em `dicionario-vero-LICENSE.txt`. Para repetir a auditoria, instale `spylls==0.1.7` em `.audit-tools` e execute `python audit-dictionary.py`.

As respostas diárias são calculadas pela data de Brasília. Palpites, letras em edição, resultado e estatísticas ficam no localStorage, separados por data e modo. Se o armazenamento for bloqueado ou apagado, o progresso deixa de persistir.
