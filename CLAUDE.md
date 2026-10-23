# PROJECT Z — guia para o Claude (leia antes de mexer)

Jogo de sobrevivência zumbi no navegador, ambientado na Zona Leste de São Paulo (Brás, Mooca, Belém, Pari).
Dono: Theo (usuário GitHub `contatojampro5-dot`). Fala português; chama o assistente de **"Zeus"**, chefe da
agência **"Olimpo"** (agentes de setor com nomes de deuses gregos: Hera = testes, Hefesto = engenharia,
Deméter = cenário, Afrodite = arte, Ares = combate, Hélio = luz...). Responda sempre em português, simples e direto.

- Jogável (GitHub Pages): https://contatojampro5-dot.github.io/Project-z/  (P maiúsculo; a raiz redireciona para `jogo/`)
- Versão atual: **R38 · ATLAS A20** (selo no canto da tela, em `src/index.html`). Cada entrega sobe a versão
  (R32, R33...) e ganha uma seção no fim do `README.md`.

## Regras do dono (não quebrar)
- **Toda atualização vai para o GitHub** (commit + push em `main`). Não mandar links/arquivos no chat, só dizer o que mudou.
- Sem tremor de tela (screen shake). Clarões de tiro podem ficar.
- Marcas **fictícias** no mapa (nada de marcas/logos reais; ex.: escudo da NFL na camisa do San foi borrado).
- Prédios de 3–5 andares, translúcidos **só** quando o jogador passa atrás.
- Botão de clima é só visual.
- Personagens e zumbis 15% menores (`PZ_ENTITY_SCALE = .85`); sobreviventes um pouco maiores que zumbis (`PZ_SURV_SIZE`).
- Velocidades foram reduzidas 20% (jogador e zumbis).
- Theo é iniciante em GitHub: explicar passo a passo, devagar, quando ele precisar fazer algo.

## Como o projeto é montado
- Código-fonte em `src/` (scripts em `src/scripts/game/NN-*.js`, estilos em `src/styles/`, `src/index.html`).
  A ordem de carga está em `src/manifest.json` (arquivos novos precisam entrar lá, na posição certa).
- `python3 build.py` → `dist/index.html` (arquivo único offline, ~35 MB, tudo embutido em base64).
- `python3 build.py --web jogo` → `jogo/index.html` leve + assets externos (o que vai para o GitHub Pages).
  Pastas externas (copiadas, não embutidas): ver `EXTERNAL` no `build.py`
  (infectados, sobreviventes, música, **vozes**, PWA). Assets são referenciados no código como `@@ASSET:caminho@@`.
- Sempre rodar os dois builds antes do commit (`jogo/` e `dist/` são versionados).
- Testes: `NODE_PATH=$(npm root -g) node tests/hera.js jogo/index.html <pasta-saida>` → deve dar **26/26** (R34 incluiu o teste da noite).
  Precisa de Playwright/Chromium. Servidor local para testes manuais: `python3 -m http.server 8765` na raiz.
- Acesso no console do navegador: `window.__projectZGame` (cena atual em `.scenes.current`, partida em `.run`,
  personagem escolhido em `.save.settings.selectedCharacter`). Prévia de clima/noite:
  `window.__PROJECT_Z_CLIMATE_PREVIEW__={time:250}`.

## Mapa do código (principais)
- `29g-world_Buildings3D.js` (R32) prédios como caixas 3D em perspectiva (câmera alta ao sul da tela, paredes
  laterais, paralaxe); `window.__PZ_FLAT3D=true` volta ao visual antigo para comparar. Ajustes em `PZ_3D` (E, lean).
- `38i-world_Props3D.js` (R33) postes/placas/orelhões inclinados (`pz3dLean`), carros/contêineres/barreiras com
  volume (camadas empilhadas), muro de quarentena como caixa 3D; postes de luz deixaram de ser pintados no chão.
  R36d: o muro de baixo (sul) entra na ordem de profundidade e fica translúcido quando o jogador passa atrás (igual carros/prédios).
- `38j-rendering_DirLight.js` (R34) luz com direção nos objetos: fogo, explosões, tiro, faróis, lanterna, postes e sol
  tingem só o lado virado para a luz (mais forte perto; em cima do fogo fica todo tingido). `window.__PZ_NO_DIRLIGHT=true` desliga.
- `38k-world_Cars3D.js` (R35) carros em 3D de verdade: lataria com laterais, rodas, capô, para-brisa, cabine e teto.
  R35b: o carro entra na ordem de profundidade (`pzCarDrawables`) e fica translúcido quando o jogador passa atrás.
- `38l-world_Hitboxes.js` (R35) colisão do tamanho do desenho (carros, caixas, viaturas); `window.__PZ_HITBOX_DEBUG=true` mostra as colisões.
- `38m-world_Loot3D.js` (R36) itens do chão em 3D girando (moedinha do Mario): mini motor de prismas com arte na
  frente/verso, laterais iluminadas, flutuar e brilho. `window.__PZ_FLAT_LOOT=true` volta ao desenho antigo.
- `38n-world_GroundFix.js` (R36b) não desenha mais o corpo provisório antigo (quadrados verdes no chão) e deixa o
  cuspe do Cuspidor com cara de gosma (rastro, brilho, sombra).
- `38o-rendering_Rain.js` (R37) chuva no mundo 3D: gotas com altura caindo para o ponto de fuga (3 camadas), vento, respingos
  em coroa, cortinas de chuva e relâmpago junto do trovão. `window.__PZ_RAIN_FORCE=0..1` força a chuva para testar.
- `38p-rendering_Cinema.js` (R38) visual de cinema: cor por hora do dia (tinta, divisão de tom, vinheta colorida, grão animado
  nas camadas CSS do `PzPost`), halo/flare nas luzes (`PZ_DL.lights`) e neblina em 2 camadas. `window.__PZ_NO_CINEMA=true` desliga.
  Tremor de tela continua proibido (regra do dono), mesmo no pacote de cinema.
- `29-world_World.js` ruas (`PZ_ROADS`), postes; `29b` prédios altos; `29c` placas de rua; `29d` pichações/cartazes
  políticos; `29e` carros brasileiros; `29f` rua paulista (calçada "mapa de SP", ciclofaixa, fios, orelhão, banca).
- `30-world_WorldBorder.js` muro, praia (leste), cidade em chamas lá fora (`seedPerimeterInferno`), multidão nas barricadas.
- `33b-entities_SurvivorSprites.js` desenho dos sobreviventes pelas folhas (`08b-data_survivorSheets.js`, gerado).
- `38-core_CombatScene.js` partida, `DialogueDirector` (falas/legendas), `ANTONIO_LINES` (80 falas do Antônio).
- `38d-core_Survivors.js` setup do personagem/habilidades; `38e-core_SurvivorLines.js` falas próprias de
  Hadassa, Hanna e San (mesmos 80 ids/gatilhos do Antônio).
- `38f-rendering_RealLight.js` luz noturna; `38g-rendering_SunRays.js` feixes de sol vindos da praia (dia).
- `38h-core_Voices.js` toca a voz junto da legenda; `08c-data_voiceFiles.js` (gerado) lista os áudios.
- `39c-ui_StoryScreen.js` (R33c) tela HISTÓRIA do menu (textos em `PZ_STORY_CHAPTERS`/`PZ_STORY_PEOPLE`, tirados de
  `docs/historia.md`).
- `39-ui_UIManager.js` HUD/menus; `39b-ui_AntonioFaces.js` rostos com 6 expressões dos 4 personagens.
- `laboratorio/` estudos de arte (sprites procedurais, sobrevivente 3D Tripo+Mixamo, retratos) e scripts geradores
  (`laboratorio/src/gerar_dados_*.py`).

## Personagens
- **Antônio** (protagonista, nervoso/engraçado), **Hadassa** (durona, irmã mais velha), **Hanna** (sarcástica, irmã;
  as duas se procuram), **San/Sansão** (brincalhão, ex-lutador de boxe que questiona as medalhas e a vida).
- Cada um tem 80 falas próprias (não repetir piadas/apelidos do Antônio).
- **História oficial:** `docs/historia.md` (cronologia, fichas, origem do surto, tipos de infectados, fazenda do
  Seu João). Seguir ao escrever falas, cenas ou missões; itens *[Parcial]*/pendentes não são cânone ainda.

## Vozes (ElevenLabs)
- Arquivos: `assets/audio/voices/<personagem>/<id 3 dígitos>.mp3` (mono 64 kbps, silêncio cortado, `loudnorm`).
  Depois de adicionar áudios: `python3 laboratorio/src/gerar_dados_vozes.py` e rebuild.
- Vozes usadas: Antônio = `ELBrtmIkk40wCZ5YnlwM` (Thiago), Hadassa = `fs3nd19KF2GO2hLTzkBm` (Lucinda),
  Hanna = `HReOQZPV9tH5iTEnSbGo` (Bianca), San = `WFSxKvz27RguNRD3Phoq` (Wesley Bessa). Modelo `eleven_v4`, com
  tags de emoção em inglês no começo da fala (ex.: `[sarcastic]`, `[shouting]`).
- Situação: Antônio 80/80; Hadassa 71/80 (faltam 56, 57, 60, 68, 69, 70, 75, 76, 77); **Hanna 0/80; San 0/80**.
- Uma fala por geração (juntar várias num áudio e cortar depois deu errado).
- **Cuidado:** o ElevenLabs bloqueou o plano gratuito de duas contas por "atividade incomum" (muitas chamadas
  seguidas vindas de servidor/proxy). Só continuar numa conta com **plano pago ativo**, devagar (~1 fala a cada 30 s).
  Não usar conta secundária gratuita para contornar o bloqueio.

## Modos de jogo
- O modo atual (ondas/sobrevivência) é o foco: deixar redondinho antes de qualquer outro. Depois virão o modo
  história (com cutscenes) e modos livres. Decisão do Theo em 23/10/2026.

## Pendências
1. Terminar as vozes (Hadassa 9, Hanna 80, San 80) quando houver conta paga ativa.
2. Cartões dos inimigos: Theo vai gerar 8 imagens por IA (6 infectados + chefes Colosso e Colmeia), quadradas,
   fundo escuro liso; recortar e colocar no cartão "Nova ameaça identificada" e no arquivo de infectados
   (`assets/images/game/bestiario/`, estilos em `src/styles/15-base.css`).
3. Pré-seleção de habilidades antes da partida (ideia do Theo: ~10 habilidades com 2 evoluções cada). Antes de
   fazer, perguntar: (a) a escolha no meio da partida continua ou sai? (b) todas liberadas ou desbloqueio aos poucos?
   (c) as habilidades de personagem (Acelerar, Sobrevida, Punhos, Mina) continuam separadas e somam?
4. Ideias oferecidas e ainda sem resposta: clarear roupas de Hadassa/Hanna ou contorno no personagem controlado;
   trólebus completo; fábrica de tijolo estilo Cotonifício; estação de trem/metrô.

## Commits
Mensagem curta em português começando pela versão (ex.: `R32: ...`). Testar (Hera 26/26) e conferir em captura
de tela antes de subir.
