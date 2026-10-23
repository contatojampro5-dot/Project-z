# PROJECT Z — projeto-fonte (Fase Cronos C1–C6 · Fase Atlas A1, A2, A4, A7)

O jogo continua sendo entregue como **um único `index.html`**. A diferença é que agora ele é *montado* a partir desta pasta organizada, em vez de ser editado como um arquivo gigante.

## Como gerar o jogo

```
python3 build.py
```

Gera `dist/index.html`, que é o arquivo que se publica no Netlify ou no Cloudflare Pages. Precisa só de Python 3.8 ou mais novo, sem instalar nada.

## Onde fica cada coisa

| Pasta | Conteúdo |
| --- | --- |
| `src/index.html` | Esqueleto da página: metadados e marcação do corpo |
| `src/styles/` | 26 folhas de estilo, na ordem em que valem (ordem no `manifest.json`) |
| `src/scripts/` | Scripts de dados de áudio e música |
| `src/scripts/game/` | Os 42 módulos do jogo (motor, câmera, armas, inimigos, interface…) |
| `assets/audio/`, `assets/images/` | Mídias como arquivos de verdade; o build as embute no HTML |
| `src/manifest.json` | Ordem de montagem de estilos e scripts |
| `tests/hera.js` | Roteiro de testes da Hera |

Para trocar um som ou uma imagem, substitua o arquivo em `assets/` mantendo o nome e rode o build. Para adicionar um estilo novo, crie o arquivo em `src/styles/` e inclua-o no fim da lista `styles` do `manifest.json`.

## Testes (Hera)

```
npm i playwright
node tests/hera.js dist/index.html
```

Verifica menu, seleção, navegação por teclado e Esc, início da partida, seleção de texto, erros de JavaScript e layout no celular em pé e deitado. As capturas e o relatório ficam em `tests/capturas/`.

## Mudanças do bloco C1

- Os 3 documentos HTML aninhados viraram um só, e os 27 blocos de estilo viraram uma única folha. A duplicata exata e a cópia do invólucro do ChatGPT foram removidas.
- O código, o CSS e as mídias são idênticos ao da versão anterior; o build foi verificado byte a byte.
- **Esc** na tela de dificuldade agora volta para a seleção, e na seleção volta para o menu. Antes, a tecla de pausa engolia o Esc no menu.
- Arrastar o mouse ou segurar o dedo não seleciona mais textos da interface.
- O selo de versão passou de "R13-C5" para "R13-C6B · CRONOS C1".

## Mudanças do bloco C2 — Combate com peso (sem tremor de tela)

Novo módulo `src/scripts/game/36a-combat_WeaponFeel.js`, com a tabela `WEAPON_FEEL` de cada arma.

- **Câmera (Hefesto):** segue o jogador com suavização e antecipa até 48 unidades na direção da mira manual. Com a mira automática, não antecipa. A tela nunca treme.
- **Clarão de cano (Ártemis):** direcional, com núcleo quente e pétalas, em tamanho próprio por arma. Ilumina o ambiente em volta, com mais força à noite.
- **Recuo visual:** o sprite do personagem recua alguns pixels a cada tiro, mais na escopeta, no revólver e na .50. A posição real e a câmera não mudam.
- **Pausa de impacto:** abates com escopeta, revólver e .50 congelam o mundo por 35–65 ms, no máximo uma vez a cada 0,3 s. Fica desligada com "Reduzir movimento".
- **Cápsulas (Héstia):** pistola, SMG, rifle e .50 ejetam cápsulas a cada tiro. A escopeta solta 2 cartuchos vermelhos e o revólver 6 cápsulas ao recarregar. Elas quicam, ficam no chão por 9 s e respeitam a qualidade de partículas.
- **Horda (Ares):** zumbis sobrepostos são empurrados para fora, inclusive parados junto ao jogador. O tanque e os chefes empurram mais do que são empurrados.

Para ajustar a sensação de uma arma, edite a linha dela em `WEAPON_FEEL` e rode o build.

## Mudanças do bloco C3 — Noite de verdade

Novo módulo `src/scripts/game/38a-rendering_LightMap.js`, com os ajustes principais em `PZ_LIGHT_CFG`.

- **Mapa de luz (Apolo):** à noite a cena escurece até 80%, num azul profundo. A escuridão é recortada pela luz pessoal do jogador, por postes, luzes do mapa, fogo (que tremula), clarões de tiro e explosões de granadas e barris.
- **Lanterna:** cone com o mesmo alcance e ângulo da regra que queima as criaturas noturnas, então agora dá para ver o que ela atinge. Acende sozinha conforme escurece.
- **Sombras:** prédios e carros projetam sombra a partir da lanterna. Em qualidade alta, os inimigos dentro do feixe também projetam sombra alongada.
- **Volumétricos:** o feixe tem névoa luminosa e poeira em suspensão, e uma camada de neblina em movimento aparece onde há luz.
- **Cor:** gradação por período (dourado quente, noite azulada, amanhecer rosado), vinheta única que fecha à noite e granulação de filme leve.
- **Qualidade de iluminação:** baixa (sem sombras, poeira, neblina e grão, em resolução menor), média (padrão) e alta (mais resolução e sombras de inimigos).

## Mudanças do bloco C4 — Mundo vivo

Novo módulo `src/scripts/game/38b-world_WorldFX.js`. Tudo é só visual: colisão, dano, ondas e IA não mudam.

- **Explosões (Héstia):** onda de choque, clarão que acende a área à noite, fumaça que sobe e fica, brasas e marca de queimado no chão por cerca de 1 minuto. Vale para granada, barril, carro, explosivo e equipamentos.
- **Fogo:** os focos de incêndio do mapa soltam fumaça e brasas que seguem o vento.
- **Chuva (Poseidon):** gotas mais visíveis e inclinadas pelo vento, com respingos no chão. As poças enchem com a chuva e secam devagar. De dia refletem o céu; à noite refletem postes, fogo e a lanterna, com ondulações.
- **Vento:** muda de direção e força com o tempo e leva papéis e folhas pela rua.
- **Marcas de batalha:** tiros no cenário deixam buraco e faísca, o sangue escurece e seca com o tempo, e pisar numa poça deixa pegadas molhadas.
- **Rua legível (Deméter):** nomes de rua pintados no chão ficaram menores e mais gastos, e os grafites mais discretos.
- **Marcas fictícias:** Itaú → Banco Paulista, Banespa → Banco Tietê, Casas Bahia → Casas do Brás, Carrefour → Hiper Leste, Extra → Mercadão 24h, Droga Raia → Drogaria Sé, Oxxo → Parada 24h, Ragazzo → Cantina Bixiga, Swift → Frigorífico Vila.

## Correção C4.1 — Tela de dificuldade

- **Redesenho (Hermes):** a tela segue o mesmo sistema visual da seleção de personagens. O sobrevivente escolhido fica no palco e as 3 dificuldades aparecem num painel com vida, dano recebido, quantidade de inimigos e de recursos, o que antes não se via.
- **Layout:** o botão "Iniciar sobrevivência" fica sempre visível sem rolar, em 1366×768 e no celular em pé e deitado. Antes ele ficava cortado.
- **Teclado:** as setas trocam a dificuldade e o Enter inicia a partida.
- **Testes (Hera):** a bateria ganhou o notebook 1366×768 e as telas de dificuldade, com 25 verificações.
- Novo estilo em `src/styles/27-c4b-difficulty-screen.css`; a marcação está em `menuMarkup()` de `39-ui_UIManager.js`.

## Mudanças do bloco C5 — Interface e som

- **HUD compacto (Hermes):** no computador, os painéis ficaram cerca de 20% menores e o botão "Tiro auto", que é do toque, saiu. Em 1280×720 o HUD passou de 17,6% para 8,4% da tela. O celular não muda (`src/styles/28-c5-hud-compact.css`).
- **Dicas e mira:** as dicas de controle somem depois de 30 s de partida, e o mouse vira uma mira própria (anel com ponto vermelho).
- **Ameaças fora de vista:** setas na borda da tela apontam até 10 zumbis próximos fora do quadro. Chefes aparecem em vermelho e maiores.
- **Recarga legível (Ártemis):** anel de progresso e "RECARREGANDO" sobre o personagem. Pistola, SMG, rifle e .50 deixam o pente vazio cair no chão, e o nome da arma aparece ao trocar.
- **Áudio com corpo (Dionísio):** reverberação de rua (eco dos prédios e cauda) em armas, criaturas e ambiente, e uma camada grave sintetizada sob cada tiro e explosão, proporcional ao peso da arma (`15a-systems_AudioDepth.js`, tabela `AUDIO_BODY`). Os arquivos de som continuam os de demonstração; sons gravados de verdade ficam pendentes.
- **Retorno de combate:** números de dano, "CRÍTICO" e combo já existiam. Agora há a opção "Números de dano" nas Configurações para ligar ou desligar.
- **Guia de estilo (Afrodite):** nova aba "Guia de estilo" no documento do roteiro, com cores, tipografia, formas, luz, movimento e layout.

## Mudanças do bloco C6 — Ritmo e desempenho (+ ajustes pedidos)

Novo módulo `src/scripts/game/38c-core_RhythmPerf.js` e estilo `src/styles/29-c6-post-and-rhythm.css`.

- **Ajuste — fumaça:** saíram os discos escuros e redondos perto do fogo e das explosões. A fumaça agora é clara e difusa, feita com um sprite pré-renderizado, que também é mais leve.
- **Ajuste — recarga:** o anel e o texto "RECARREGANDO" viraram uma barra fina sob os pés do personagem.
- **Desempenho (Hefesto):** gradação de cor, vinheta e granulação saíram do canvas e viraram camadas compostas pela placa de vídeo. São cinco pinturas de tela inteira a menos por quadro.
- **Qualidade automática:** mede o tempo real de quadro durante a partida e, se ficar abaixo de ~45 fps, reduz um degrau por vez (luz, clima, partículas, sombras; primeiro tudo para média, depois para baixa), avisando na tela. Nunca sobe sozinha. Liga e desliga em Configurações, e desliga sozinha se o jogador ajustar a qualidade à mão.
- **Avisos de ataque (Ares):** zumbis de corpo a corpo mostram um arco vermelho pouco antes do golpe. O cuspidor carrega uma esfera roxa com a linha do disparo, e o explosivo mostra o raio real da explosão enquanto o pavio queima.
- **Fases do chefe:** aura vermelha abaixo de 50% de vida, mais forte e pulsando rápido abaixo de 25%.
- **Primeiro minuto (Atena):** objetivo exibido aos 9 s e dica no primeiro intervalo. O cartão de nova ameaça só abre numa pausa natural (início da partida, intervalo ou sem inimigo a menos de 280 unidades); antes disso aparece só um aviso discreto. A primeira onda é 20% mais branda no fácil e no médio; o hardcore não muda.
- **Aviso na tela:** o aviso lateral no computador saía cortado pela metade na borda esquerda (bug antigo); agora aparece inteiro.

## Fase Atlas · A1 — Desempenho

A sua medição (36 FPS no PC, com lógica + desenho em ~7 ms) mostrou que o gargalo estava na composição da página, não no código do jogo.

- **Diagnóstico de desempenho (F9 ou Configurações → Diagnóstico):** congela a partida e mede o FPS ligando e desligando cada camada (cor, luz, efeitos, ambiente, vidro desfocado), mostrando uma tabela para print.
- **Camadas de cor sem modo de mistura:** as camadas do C6 usavam `soft-light` e `overlay`, com granulação animada, e custavam quase metade do FPS. Agora são tintas normais, e a granulação, estática, só aparece na qualidade alta. Na máquina de teste: de 27 para ~50 FPS.
- **Sem vidro desfocado no HUD durante a partida:** 8 painéis refaziam o desfoque a cada quadro. Os fundos já eram quase opacos.
- **Neblina mais barata:** usa mistura normal e só é desenhada quando aparece de verdade (noite ou neblina forte) ou na qualidade alta.

## Fase Atlas · A4 — Hadassa, San e Hanna jogáveis

Novo módulo `src/scripts/game/38d-core_Survivors.js`, com as tabelas `SURVIVOR_KITS`, `SAN_PUNCH` e `HANNA_MINE`.

- **Atributos:** a vida e a velocidade da ficha valem como porcentagem sobre o Antônio. Hadassa tem 70% de vida e 115% de velocidade, San 130% e 85%, Hanna 100% e 100%.
- **Hadassa — Sobrevida (Espaço):** vida máxima +20% por 10 s; ao acabar, a vida volta na mesma proporção. Recarga de 60 s. **Passiva:** depois de 40 s sem levar dano, recupera a vida toda em 10 s, com aura verde.
- **San — Punhos de Ferro:** soco automático a cada 1,2 s no zumbi mais próximo ao alcance, com 2× o dano normal e empurrão forte. Pode socar e atirar ao mesmo tempo. **Ativa:** socos 4× mais fortes e mais rápidos por 5 s, recarga de 20 s.
- **Hanna — Minas Improvisadas:** cada toque no Espaço coloca uma mina, até 5 por lote. Elas armam em 1,5 s, detonam por proximidade e em cadeia a cada 0,25 s, e não ferem a Hanna. O lote recarrega em 30 s.
- **HUD:** o botão de habilidade mostra o ícone e o estado de cada sobrevivente (✚, ✊, ◎ e "MINAS 3/5", por exemplo).
- **Identidade provisória:** os três usam o sprite do Antônio com um anel na cor própria sob os pés, até os sprites definitivos (A5). As falas do Antônio ficam desligadas para eles até terem as próprias (A6).
- **Modo teste:** em Configurações, "Modo teste · liberar sobreviventes" desbloqueia os três sem cumprir as metas e sem alterar o progresso salvo.

## Fase Atlas · A7 — Transições, prédios e asfalto

- **Altura dos prédios (Deméter):** todo prédio do mapa, nas quatro zonas, ganhou uma fachada sul com janelas, algumas acesas. Ela dá a sensação de altura na vista de cima, sem mudar a colisão (`building()` em `29-world_World.js`).
- **Variação de asfalto:** as ruas do centro e das bordas ganharam marcas de pneu nas faixas, remendos novos e velhos com emenda, emendas longas e bueiros. É determinístico, pintado uma vez, e não pesa no FPS (`asphaltVariation()`).
- **Transições (Hermes):** ao começar a partida, o cenário surge do escuro. A interface não tem animação de entrada, porque é redesenhada a cada clique e piscaria.
- **Microanimações:** todo botão escurece ao ser pressionado, um brilho atravessa o botão principal ao passar o mouse e o selo do cartão de dificuldade "salta" ao ser escolhido. Na tela de dificuldade, o palco não reanima ao trocar de cartão.
- Estilo em `src/styles/31-atlas-a7-transitions.css`; tudo respeita "Reduzir movimento".

## Fase Atlas · A2 — Arte do Antônio

- A arte enviada (PNG de 2,7 MB) virou WebP de 62 KB em `assets/images/game/antonio.webp` e entrou em `PZ_CHAR_ART`.
- Agora os quatro sobreviventes usam arte própria no palco e nos retratos da seleção e na tela de dificuldade, com bordas esfumaçadas, respiração, anel de luz e brasas. A silhueta desenhada fica só como reserva.

## Estrutura do repositório

- `jogo/index.html` — a versão jogável atual (abra no navegador).
- `src/`, `assets/`, `build.py` — código-fonte do jogo. `python3 build.py` gera `dist/index.html`.
- `tests/` — verificações da Hera (`NODE_PATH=$(npm root -g) node tests/hera.js dist/index.html <pasta>`).
- `laboratorio/estudo-infectado.html` — estudo dos sprites novos (Atlas A5), ainda não aplicado.
- `laboratorio/folhas/` — folhas de sprite WebP por tipo + `infectados.json`.
- `laboratorio/src/` — motor de pintura e página do laboratório (`python3 laboratorio/src/build.py`).

## Atlas A5.1 · Infectado comum no jogo
- As folhas novas do Infectado comum (Operário, Executivo, Paciente) substituem o sprite antigo.
- Animações ligadas ao estado do jogo: andar, atacar, levar tiro, rastejar (sem pernas) e morrer.
- O corpo cai com a animação de morte e fica no chão ~9 s antes de sumir.
- Os outros tipos continuam com o desenho antigo até as próximas etapas.
- Módulo: `src/scripts/game/34b-entities_InfectedSprites.js` (tabela `PZ_SPRITES` recebe os próximos tipos).

## Jogar online
https://contatojampro5-dot.github.io/Project-z/ (atualiza alguns minutos depois de cada envio)

## Atlas A5.1b · Peças do corpo em volume
- Cabeça, braço e perna arrancados agora são peças pintadas em volume (mesmo motor dos sprites), girando em 3D no ar (12 quadros) com coto de carne e osso.
- Tiro forte: braços e pernas voam; a cabeça só sai em explosão (o corpo inteiro se desfaz e não fica cadáver inteiro).
- Membro perdido com o zumbi vivo apenas se solta e cai perto dele.
- Folha: `assets/images/game/infectados/comum-pecas.webp` (34 KB).

## Atlas A5.1c · Zumbis mutilados
- Perdeu um braço: troca para a folha sem aquele braço (andar, atacar, levar tiro, morrer), com o coto sangrando no ombro. Se perder os dois, usa a folha sem o direito.
- Perdeu as duas pernas: rasteja sem as pernas, com os cotos nos joelhos.
- O cadáver também cai sem o braço perdido.
- 7 folhas novas (~1,35 MB). O jogo passou de 8,2 para 10 MB; a redução de peso fica para a etapa 5.

## Atlas A5.2 · Corredor, Explosivo e Cuspidor
- Corredor (Atleta, Ciclista): corrida inclinada e bote no contato.
- Explosivo (Inchado, Mecânico): a animação "Inflar" acompanha o pavio de 0,85 s; explode sem deixar cadáver inteiro.
- Cuspidor (Moletom, Garçonete): a animação de cuspir dispara junto com o projétil e vira para o alvo.
- Peças do corpo agora existem para as 9 variações (`pecas.webp`).
- Todas as folhas do jogo recomprimidas (4,6 → 3,2 MB). Jogo: 11,2 MB.

## Atlas A5.3 · Tanque, Invocador e Notívago
- Tanque (Pedreiro, Segurança): célula maior (88×92), pisada pesada e "Esmagar" no contato.
- Invocador (Profeta, Andarilho): a animação "Invocar" toca no instante em que ele chama a horda.
- Notívago (Sombrio, Cinzento): cada estado da IA tem animação própria — espreitar, preparar o salto, saltar, garra, recuperar, fugir da luz e queimar na lanterna (com brilho de brasa).
- Peças do corpo para as 15 variações. Jogo: 13,9 MB (otimização de peso na etapa 5).

## Atlas A5.4 · Chefes
- O Colosso: avança arrastando a clava; "preparar investida" acompanha o aviso de 1,2 s; investida em loop durante o dash; golpe de contato vira "esmagar"; tomba e fica no chão ao morrer.
- A Colmeia: arrasta o corpo com o enxame girando; "enxame iminente" acompanha o aviso de 1,1 s; ao fim do aviso, "liberar enxame" junto com os projéteis radiais.
- Linhas de aviso, rastro da investida e onda da Colmeia continuam iguais.
- Jogo: 16 MB — a etapa 5 cuida do peso.

## Atlas A5.5 · Peso e desempenho
- Folhas sem as linhas de animação que o jogo não usa (parado dos inimigos comuns, "levar tiro" dos chefes) e recomprimidas: sprites 6,7 → 4,5 MB.
- Duas versões geradas pelo `build.py`:
  - `python3 build.py --web jogo` → **versão do link** (GitHub Pages): `jogo/index.html` com 3,6 MB; sprites e músicas em `jogo/assets/`, baixados em paralelo e guardados no cache (a segunda visita abre quase na hora).
  - `python3 build.py` → `dist/index.html`, arquivo único de 13 MB que joga offline.
- FPS com 60 inimigos misturados (navegador de teste, sem GPU): 22,7 antes dos sprites novos → 23,6 agora. Os sprites novos não custaram desempenho.

## R18b · Correção dos chefes no iPhone
- As folhas dos chefes (1200×8250 px) passavam do limite de decodificação de imagem do Safari no iPhone; o jogo caía no desenho antigo. Agora cada animação é uma imagem separada (no máx. 1280×2040 px).

## Atlas A8 · Prédios de 3 a 5 andares
- A base (colisão) não muda; a fachada sobe 84–138 px e o telhado fica por cima da rua de trás.
- Fachada com andares, janelas (algumas acesas ou quebradas), ar-condicionado, térreo com portas de enrolar e marquise.
- O prédio é desenhado junto com os personagens, ordenado pela base: quem passa atrás some atrás dele.
- Quando o JOGADOR está atrás, o prédio fica translúcido e mostra quem estiver lá (inclusive zumbis).
- No chão fica a sombra do volume, projetada para o sudeste.
- Módulo: `src/scripts/game/29b-world_TallBuildings.js`.

## R19b · Poças d'água
- Contorno orgânico (borda irregular com lóbulos) no lugar das elipses perfeitas.
- Asfalto encharcado em volta, lâmina d'água escura e lisa, reflexo suave do céu, margem escura e um brilho especular fino.
- Com chuva, gotas abrem anéis na água. Reflexos de postes, fogo e lanterna seguem o novo contorno.
- Removidas as 5 "poças" retangulares pintadas no mapa central.

## R19c · Pisando na poça
- A cada passo do personagem dentro de uma poça: onda dupla abrindo a partir do pé, gotas que sobem e caem (com sombra) e anéis menores onde elas pousam.
- Correndo (Acelerar), passos mais rápidos, ondas maiores e mais gotas.
- Som procedural de pé na água (chiado filtrado + "ploc" grave), sem arquivo novo.
- Continuam as pegadas molhadas por alguns segundos depois de sair da poça.

## R20 · Faróis dos carros (luz volumétrica)
- Cerca de 1 em cada 3 carros abandonados ainda tem bateria: faróis acesos à noite e no anoitecer. Alguns piscam, alguns têm um farol quebrado.
- Cada farol abre um cone na escuridão (ilumina o chão e quem estiver na frente) e desenha o feixe no ar: mais forte com neblina e chuva, com núcleo mais denso, brilho da lâmpada e gotas/poeira acesas dentro do feixe.
- Carro destruído apaga os faróis. Só os carros perto da câmera são calculados.

## R21 · Luz real (ATLAS A9, parte 1) e placas de rua
- Noite refeita como mapa de luz multiplicado sobre a cena: luar azul + soma de luzes coloridas com queda física (inverso do quadrado suavizado), mais um ganho de exposição para o asfalto sob luz forte.
- Postes: luminária "cabeça de cobra" com braço sobre a pista; mistura de sódio (laranja) e LED (branco-frio). A luz cai no chão abaixo da luminária e projeta sombras de prédios e carros (calculadas uma vez por poste). Cone de luz no ar, chuva atravessando o cone, lâmpada com bloom e halo na neblina; lâmpadas velhas falham com apagões curtos.
- Prédios: janelas acesas emitem luz própria (incandescente, fluorescente ou TV azulada, algumas com cortina/persiana), lojas abertas iluminam a calçada e as janelas baixas jogam luz na rua.
- Letreiros, fogo, tiros e explosões entram na mesma luz colorida. Postes das bordas do mapa também acendem.
- Faróis: pegada de luz no chão (xenônio branco ou halógeno amarelado), feixe no ar só quando há chuva/neblina, e lanternas traseiras vermelhas.
- Lanterna do jogador entra como luz levemente azulada com as mesmas sombras de antes.
- Placas: nomes de rua não ficam mais pintados no chão (nem o nome do distrito). Esquinas dos 4 cruzamentos têm poste com as duas placas azuis paulistanas (bairro + CEP + nome). As placas de sentido viraram placas indicativas em dois postes na calçada. Todas refletem a lanterna e os faróis à noite.
- Se o navegador falhar na luz nova, o jogo volta sozinho para a iluminação antiga.

## R21b · Bordas do mapa: muro de quarentena e praia (ATLAS A9, parte 2)
- Muros: a fileira de módulos (contêineres, cavaletes em X, caixotes) virou um muro contínuo de placas de concreto pré-moldado: topo, face com luz do céu e sujeira no pé, juntas, olhais de içamento com ferrugem escorrendo, manchas de chuva, limo, lascas, pichações, cartazes de desaparecidos, numeração em estêncil, faixas de alerta e a pintura "ZONA DE QUARENTENA". Concertina (arame laminado em espiral) com suportes em Y e farrapos presos.
- Pilares com faixa zebrada nas bocas das avenidas (os bloqueios pesados continuam). Zumbis de fora ficam atrás do muro.
- Torres de refletor treliçadas atrás do muro: à noite iluminam a faixa interna da zona com luz branca, com cone visível na chuva/neblina.
- Praia: calçadão de pedra portuguesa em ondas, meio-fio de granito, areia com grão, marcas de vento, restinga, linha da maré com algas e conchas, areia molhada com brilho, pegadas e marcas de pneu. Mar com degradê de profundidade, ondulação, cáusticas no raso e cristas lá fora. Arrebentação animada: lâmina d'água subindo e descendo na areia e espuma rendada.
- Palmeiras com tronco curvo anelado, folhas com folíolos, folhas secas, cocos e sombra; guarda-sóis sombreados com canga e cadeiras; chinelos, isopores e coisas largadas na fuga; quiosques com telhado de telha; molhe de pedras; píer com estacas e tábuas faltando; barcos com motor de popa (na água e encalhados); postos de salvamento.
- Divisa da praia: barreiras de concreto tipo new jersey com concertina e placas "PRAIA FECHADA". Postes do calçadão acendem à noite.

## R22 · Avenida beira-mar, pichações políticas, celular e tela cheia (ATLAS A9, parte 3)
- Avenida beira-mar entre a cidade e o calçadão: mão dupla com faixa amarela dupla, meio-fio, bueiros, rachaduras, manchas de óleo, faixas de pedestre onde as ruas descem para a praia, carros abandonados/batidos e um ônibus atravessado. Postes do calçadão ficam no meio-fio e iluminam a avenida à noite.
- Pichações e cartazes: frases políticas dos dois lados ("FORA LULA", "FASCISTAS NÃO PASSARÃO", "FORA BOLSONARO", "DITADURA NUNCA MAIS", "SEM ANISTIA", "INTERVENÇÃO JÁ", "O GOVERNO SABIA", "CADÊ O EXÉRCITO?"…) em spray com escorrido; pixo paulistano no alto dos prédios; lambe-lambes sobrepostos (santinhos de candidatos inventados, desaparecidos, toque de recolher da prefeitura, "COMPRO OURO", cartomante, "O FIM CHEGOU"). No muro de quarentena e no térreo dos prédios.
- Celular deitado (com a barra do navegador): coluna de botões da direita compacta, escolhas de consumível lado a lado, tela de evolução e de morte cabendo sem rolar. Em pé: controles não saem mais da tela. A página não rola mais (a etiqueta de versão ficava embaixo do jogo).
- Tela cheia no iPhone: o jogo virou app instalável (manifesto, ícone, modo tela cheia). O botão de tela cheia no iPhone mostra o passo a passo de "Adicionar à Tela de Início" (Safari ou Chrome).
- Noite um pouco mais clara (luar e exposição).

## R22b · Mochila no celular deitado
- A mochila cabia só pela metade com a barra do navegador. Agora, deitado: cabeçalho compacto, retrato menor, carga e acessórios em uma linha cada, espaços da mochila e rodapé visíveis sem cortar (e, se faltar espaço, o painel rola por dentro).

## R23 · São Paulo de verdade: frota, rua e prédios (ATLAS A10)
Baseado na pesquisa de referência visual da Zona Leste (Brás, Mooca, Belém, Pari). Marcas e órgãos com nomes fictícios ou sem logotipo.
- Carros: frota paulistana com as mesmas medidas/colisões — hatch popular quadradão, hatch moderno, Fusca desbotado, sedã compacto e médio, táxi branco com luminoso, viatura da polícia (branca com recortes vermelho/cinza/preto e giroflex), picape pequena com caçamba carregada (entulho, botijões, caixas, lona), Kombi (às vezes "saia e blusa" e bagageiro), furgão de entregas e ambulância SAMU 192. Cores pela frota real (muito branco, preto, prata e cinza), placa Mercosul nos novos e cinza nos antigos, sujeira, ferrugem e vidro trincado. Os carros-sprite antigos do Centro também viraram carros paulistanos.
- Ônibus municipal vermelho (cor da Zona Leste) atravessado nos bloqueios das avenidas.
- Chão: calçada "mapa de SP" preto e branco no Centro, concreto remendado nos bairros, faixa exclusiva "ÔNIBUS" na Rangel Pestana, ciclofaixa vermelha com tachões, lombadas, bueiros, caçambas de entulho, motos caídas com baú de entrega, carroças de catador com papelão, mesas e cadeiras plásticas de boteco, lonas de camelô, sacos de lixo e sofás largados.
- Em pé: postes de concreto com cruzeta, transformador, rolos de fio e "gatos"; orelhões laranja e azuis; bancas de jornal; papeleiras verdes; pontos de ônibus. No ar: emaranhado de fios entre os postes e a rede do trólebus sobre a Rangel Pestana.
- Prédios: fachadas de tijolo aparente (galpões industriais), de pastilhas ou de concreto; letreiros de comércio (ATACADO, LOJA 1,99, FARMÁCIA, PADARIA, CONFECÇÕES…); caixas d'água azuis, caixa de concreto, antenas e chaminés com fuligem nos telhados.
- Noite: a maioria dos postes agora é LED branco (como São Paulo hoje); alguns de sódio laranja sobreviveram.

## R23b · Fios mais altos, transparências e personagens menores
- Postes de concreto com o dobro da altura; a fiação e a rede do trólebus passam bem acima da rua e ficam quase invisíveis perto do jogador.
- Postes, orelhões, bancas, pontos de ônibus e placas de rua ficam transparentes quando o jogador passa atrás deles.
- Personagens e infectados (inclusive os corpos caindo) desenhados 15% menores, para dar mais escala à cidade. A colisão e o alcance não mudaram.

## Laboratório · Estudo do Antônio (não aplicado ainda)
- Página `laboratorio/estudo-antonio.html`: o Antônio no mesmo motor dos infectados, versão estilizada (cores mais vivas, contorno escuro, cabeça e mãos maiores), baseado na arte dele (boné bordado, barba, camisa com manga dobrada, calça cargo, cinto com mosquetão, relógio, tênis).
- 9 animações × 8 direções × 2 tipos de arma (curta e longa): parado, mirando, andar mirando, correr, atirar com recuo, recarregar, levar dano, morrer e a habilidade Acelerar. Seis expressões de rosto. Prévia no tamanho do jogo e folha de sprites.

## R24 · Rosto do Antônio reagindo ao jogo
- Seis expressões feitas a partir da arte do Antônio (neutro, foco, raiva, medo, dor, grito).
- Painel de vida: retrato que muda sozinho — foco ao atirar, raiva com 3+ infectados perto, medo com horda grande ou chefe perto, dor ao levar dano ou com pouca vida, grito ao usar Acelerar.
- Caixa de fala: o rosto aparece ao lado da frase, com a expressão da situação (dor ao ser ferido, medo quando o chefe surge…).
- Só para o Antônio por enquanto; os outros sobreviventes ganham quando tiverem as artes.

## R25 · Sobreviventes novos com as armas na mão (ATLAS A12)
- Antônio, Hadassa, San e Hanna refeitos no motor do laboratório, versão estilizada, a partir das artes de cada um: boné, barba e camisa de trabalho (Antônio); trança, lenço, jaqueta com arnês, cinto de explosivos caseiros, rádio, joelheiras e coturnos (Hadassa); camisa 13 de futebol americano, faixas nas mãos, corrente e moletom (San); cabelo ruivo curto, sardas, moletom com capuz, mochila com saco de dormir, jeans rasgado e coturnos (Hanna).
- As seis armas do jogo modeladas em 3D e seguradas de verdade (cabo na mão direita, guarda-mão ou apoio na esquerda, coronha no ombro nas armas longas): pistola, revólver RM44, SM9 Vespa, fuzil R98, espingarda E12 de dois canos e a .50 com luneta e bipé.
- 9 animações × 8 direções para cada personagem e arma: parado, mirando, andar mirando, correr (andando sem atirar), atirar com recuo, recarregar (tira o carregador do cinto, encaixa e puxa o ferrolho), levar dano, morrer e a habilidade: Antônio bate no peito e arranca, Hadassa aplica a seringa na coxa com brilho verde, San solta jab–direto–gancho (também nos socos automáticos), Hanna agacha e crava a mina.
- O clarão do tiro sai da boca da arma desenhada. Folhas carregadas só para o personagem e a arma em uso.
- Laboratório: `laboratorio/estudo-sobreviventes.html` com os quatro, as seis armas, todas as animações e a prévia no tamanho do jogo.

## R25b · Botão da habilidade embaixo da vida
- O botão da habilidade (Acelerar, Sobrevida, Punhos, Mina) fica logo abaixo do painel de vida, alinhado à direita dele (em pé, abaixo da barra de munição).

## R25c · Sobreviventes 20% mais lentos
- Velocidade base de todos os sobreviventes de 165 para 132 (−20%); o limite com tênis subiu proporcionalmente de 260 para 208. As diferenças entre personagens, o Acelerar (+40%) e os tênis continuam valendo por cima.

## R25d · Infectados 20% mais lentos
- Todos os infectados, chefes e o Notívago 20% mais lentos, acompanhando os sobreviventes: comum 74→59, corredor 146→117, explosivo 94→75, cuspidor 68→54, tanque 54→43, invocador 65→52, Colosso 49→39, Colmeia 36→29, Notívago 173→138 (salto 470→376). A investida do Colosso diminui junto.

## R25e · Rostos da Hadassa, do San e da Hanna
- As seis expressões (neutro, foco, raiva, medo, dor, grito) dos três entram no painel de vida e mudam com a partida, como as do Antônio. O escudo de liga real na camisa do San foi borrado (o jogo usa marcas fictícias).

## R26 · ATLAS A13 — falas individuais sobreviventes
- Hadassa (durona), Hanna (sarcástica) e San (brincalhão) agora falam, com as mesmas 80 situações do Antônio (`src/scripts/game/38e-core_SurvivorLines.js`).
- A caixa de fala mostra o rosto de cada um, com a expressão certa.
- R26b: falas reescritas por personagem (irmãs Hadassa e Hanna procurando uma à outra; San, atleta que questiona as medalhas).

## R27 · ATLAS A13 — sol da praia, calçadas e fogo lá fora
- Sol vindo da praia (leste): feixes de luz dourada atravessando o ar entre os prédios, com a "sombra no ar" atrás de cada prédio se dissolvendo com a distância, poeira brilhando no sol (`38g-rendering_SunRays.js`). Some à noite, na chuva e na neblina forte; desligado na qualidade baixa.
- Sombras dos prédios no chão e o lado iluminado das fachadas viraram para combinar com o sol do leste.
- Calçadas: o piso vai do meio-fio até a fachada, sem buracos; meio-fio de granito; material por rua (piso paulista na Rangel Pestana e na Mooca, placas de concreto nas outras), sem emenda ao trocar de bairro.
- Cidade lá fora: mais focos de incêndio, numa camada mais ao fundo e alguns isolados.

## R28 · ATLAS A13 — vozes (ElevenLabs)
- As falas agora têm voz: Antônio (80 de 80, voz "Thiago") e Hadassa (28 de 80, voz "Lucinda"). Hanna e San ainda sem voz — a geração parou porque o ElevenLabs bloqueou o plano gratuito da conta.
- Cada fala é um arquivo em `assets/audio/voices/<personagem>/<id>.mp3` (silêncio cortado, volume nivelado); a lista é gerada por `laboratorio/src/gerar_dados_vozes.py`.
- A voz toca junto com a legenda, a legenda dura o tempo do áudio, pausar o jogo pausa a voz. Fala sem arquivo continua só com legenda.
- Novo controle "VOZES" nas configurações.

## Mudanças do R29 — Antônio em 3D

- As 6 folhas do Antônio (pistola, revólver, SMG, fuzil, escopeta e .50) agora vêm do modelo 3D do Tripo com animações do Mixamo, renderizado nas mesmas 8 direções e no mesmo tamanho de célula (75 px).
- As armas são peças simples montadas no render, porque o modelo veio sem arma. A morte é uma queda feita a partir da animação de impacto, e o especial (Aceleração) usa o salto com fuzil.
- Os pontos de saída do clarão de cada arma foram recalculados a partir da ponta do cano no render.
- O estudo comparando o modelo novo com o antigo continua em `laboratorio/estudo-sobrevivente-3d.html`.

## Mudanças do R30 — Multidão lá fora com os infectados novos

- Os zumbis amontoados do lado de fora das barricadas agora usam as mesmas folhas dos infectados comuns da cidade (operário, executivo e paciente), no mesmo tamanho.
- A fileira da frente arranha a barricada com a animação de ataque; as de trás andam no lugar, empurrando. Os braços desenhados à mão do modelo antigo saíram.

## Mudanças do R31 — Arquivo de infectados com o visual novo

- O cartão "Nova ameaça identificada" e o arquivo de infectados (lista e ficha) agora mostram cada infectado e chefe com o visual das folhas novas, de frente, em vez do desenho pixelado antigo.
- Os retratos ficam em `assets/images/game/bestiario/`, um por tipo.

## R31b — mais vozes da Hadassa
- Hadassa agora tem 71 de 80 falas com voz (faltam 56, 57, 60, 68, 69, 70, 75, 76, 77). Hanna e San continuam só com legenda.

## R32 · ATLAS A14 — cenário em 3D
- Os prédios agora são caixas 3D vistas por uma câmera alta, em perspectiva: o telhado fica mais perto da câmera, os prédios se inclinam para longe do centro da tela e mudam de ângulo conforme o jogador anda (paralaxe de verdade).
- Aparecem as paredes laterais (empenas) dos prédios que estão à esquerda ou à direita: a maioria é parede cega de reboco manchado com pixo, algumas têm janelas. A face leste pega o sol da praia, a oeste fica na sombra.
- As janelas acesas à noite seguem a mesma perspectiva da fachada.
- A colisão, o chão e a jogabilidade não mudaram; o prédio continua translúcido só quando o jogador passa atrás dele.
- Feito em `src/scripts/game/29g-world_Buildings3D.js`, sem trocar o motor (continua canvas 2D, sem WebGL).

## R33 · ATLAS A15 — postes, carros e muros em 3D
- Postes de luz, postes de concreto, placas de rua, orelhões, bancas e pontos de ônibus agora se inclinam na mesma perspectiva dos prédios; a fiação e a rede do trólebus acompanham o topo dos postes, e a luz da luminária sai do lugar certo.
- Carros, ambulâncias, caminhões, contêineres, caixas e barreiras de concreto ganharam volume: laterais escuras embaixo e o teto em cima, em perspectiva.
- O muro de quarentena virou um muro de verdade, com topo, face pichada e concertina, visto de lado conforme o jogador anda.
- Colisão e jogabilidade iguais. `window.__PZ_FLAT3D=true` no console volta ao visual antigo.

## R33c — tela de História preenchida
- O botão HISTÓRIA do menu agora mostra a história oficial do jogo (de `docs/historia.md`): os quatro sobreviventes com retrato, idade e um resumo, a cronologia em 7 capítulos (das irmãs até a fuga para a fazenda do Seu João) e o mistério da origem do surto.
- Só entram fatos já definidos pelo Theo. O modo história completo e as cutscenes vêm depois.
- Feito em `src/scripts/game/39c-ui_StoryScreen.js` e `src/styles/33-r33c-story.css`. Jogabilidade igual.

## R34 · ATLAS A16 — iluminação com direção e distância
- Toda luz agora pega nos objetos só do lado virado para ela: fogueiras, carros pegando fogo, explosões de barril e granada, clarão do tiro, faróis dos carros, lanterna, postes (à noite) e o sol da praia (de dia, só fora da sombra dos prédios).
- Quanto mais perto da luz, mais forte; longe, não pega. Em cima do fogo, o personagem ou o zumbi fica todo tingido da cor do fogo. O lado de trás fica mais escuro, dando volume.
- Vale para o seu personagem (roupa inclusive), zumbis, carros, contêineres e as paredes dos prédios (só a face virada para o fogo ou o farol acende).
- Correção: a R33 tinha um erro que travava as luzes dos postes e a fiação à noite (corrigido na R33b). A Hera agora também testa a noite.

## R35 · ATLAS A17 — carros de verdade e colisão do tamanho do desenho
- Os carros deixaram de ser o desenho de cima "esticado". Agora têm lataria com laterais, quatro rodas com pneu e calota, para-choque, faróis e grade na frente, lanternas e placa atrás, capô, para-brisa, cabine com vidros e colunas, e teto. Sedã, hatch, picape e Kombi têm alturas e formas diferentes.
- Revisão das colisões do mapa (zumbi passando por cima, personagem travando do nada):
  - carros do centro usavam a mesma caixa para sedã, picape e Kombi; agora cada um tem a do seu tamanho;
  - carros comuns tinham colisão 3 px maior de cada lado (travava em vão que dava para passar);
  - 2 caixas pequenas e as 3 caixas de madeira grandes não tinham colisão (zumbi e jogador atravessavam);
  - uma colisão antiga de caixa, fora do lugar e maior que o desenho, foi removida;
  - ambulância, caminhão de bombeiros e viatura agora usam o contorno do próprio desenho.
- Depois da revisão, o mapa de caminhos dos zumbis é refeito, então eles contornam os carros em vez de atravessar.
- Ferramenta: `window.__PZ_HITBOX_DEBUG=true` mostra as colisões na tela.

## R35b — carro translúcido quando você passa atrás
- O carro agora é desenhado na ordem certa: se você está na frente, aparece por cima dele; se passa por trás, o carro fica por cima e fica meio transparente (igual aos prédios), então dá para ver o personagem e não parece mais que você está em cima do carro.
- Ajuste de colisão: ambulância e caminhão de bombeiros tinham a colisão mais comprida que o desenho; agora é do tamanho do veículo.

## R36 · ATLAS A18 — itens em 3D girando
- Todos os itens que dá para pegar no mapa agora são objetos 3D de verdade, girando sem parar como a moedinha do Mario e flutuando um pouco acima do chão.
- Cada um tem frente, verso e espessura, com as laterais iluminadas, borda lapidada e um reflexo que passa pela face enquanto gira: coração (e o coração dourado de vida completa), caixa de munição com o número de balas, kit médico com alça, célula de escudo hexagonal, granada redonda com alavanca e argola, mochila, colete com o nível e peça de arma (engrenagem na cor da raridade).
- Itens raros (vida completa, célula de escudo, peças e coletes de nível alto) soltam faíscas. Com "reduzir movimento" ligado, o giro fica mais lento.

## R36b — limpeza do chão
- Os quadrados verdes que apareciam no asfalto eram um corpo provisório antigo (feito de retângulos) que o jogo ainda desenhava quando o zumbi morria. O corpo de verdade já aparece, então esses quadrados saíram.
- A bolinha roxa é o cuspe do **Cuspidor** (o infectado que ataca de longe). Agora ela parece uma bolha de gosma tremendo, com rastro de gotas, brilho e sombra no chão, para dar para ver o que é e desviar.

## R36c — muro de baixo invisível
- O muro de quarentena do lado de baixo do mapa aparecia como uma laje grande deitada por cima da tela. Agora ele fica invisível na partida (continua bloqueando a passagem e a sombra no chão marca onde ele está). A barricada com arame continua aparecendo.

## R36d — muro de baixo transparente só quando você passa atrás
- Correção da R36c: o muro de baixo volta a aparecer normal e fica meio transparente só quando você passa atrás dele, igual aos carros e prédios.

## R37 · ATLAS A19 — chuva realista
- A chuva deixou de ser uma grade de risquinhos iguais. Agora cada gota cai de verdade, com altura, na mesma câmera 3D dos prédios: as gotas altas (perto da câmera) são maiores e mais borradas, as de perto do chão são finas, e todas caem na direção certa da perspectiva.
- O vento inclina e empurra a chuva, com rajadas. Onde a gota bate no chão abre um respingo com gotinhas pulando.
- Passam "cortinas" de chuva mais forte com o vento, o tempo fica mais fechado e, na chuva forte, o relâmpago clareia a tela junto com o trovão (sem tremer a tela).

## R38 · ATLAS A20 — visual de cinema (parte 1)
- **Cor de cinema:** cada hora do dia tem a sua cor mais marcada (pôr do sol alaranjado, noite azul, amanhecer rosado, dia um pouco mais frio), com o céu mais frio em cima e o chão mais quente embaixo, vinheta escura nas bordas com a cor da hora e um granulado de filme leve que se mexe.
- **Brilho nas luzes:** fogo, faróis, lanterna, explosões e clarão do tiro agora soltam um halo que "vaza" na tela, e as luzes fortes fazem um risco de lente, como em filme.
- **Neblina em camadas:** duas camadas de névoa andando com o vento em velocidades diferentes, mais fortes com neblina ou chuva.
- Sem tremor de tela (regra do jogo). Tudo feito para não pesar: as cores são camadas que a placa de vídeo junta.

## R39 · ATLAS A21 — visual de cinema (parte 2): câmera viva e partículas
- **Câmera viva (sem tremer a tela):** quando um chefe aparece, a câmera dá um zoom leve e volta devagar. Quando cai o último zumbi da horda, o tempo fica em câmera lenta por um instante.
- **Partículas no ar:** cinzas da cidade em chamas caindo com o vento (mais perto do muro e à noite, algumas ainda em brasa), poeira brilhando no sol de dia e faíscas subindo das fogueiras e dos carros pegando fogo.
- Com "reduzir movimento" ligado, não tem câmera lenta.

## R40 · ATLAS A22 — som de cinema
- **Trilha que cresce com a horda:** por baixo da música entra uma camada de tensão: um grave que vai abrindo e um pulso, tipo batida de coração, que acelera conforme chegam mais zumbis. Com chefe na área entra uma nota mais aguda, e a música sobe um pouco no aperto.
- **Cidade ao longe:** de tempos em tempos toca uma sirene distante, com eco, vindo de um lado ou do outro, e um rádio chiando com vozes picotadas e o bipe de fim de mensagem. Tudo baixinho, como se fosse longe.
- Segue os botões de som e música das configurações.

## R41 · ATLAS A22 — timer da chuva, sol nas poças e sirenes
- **Timer da chuva:** embaixo do botão CLIMA aparece quanto falta para começar a chover ("CHUVA EM 1:20 · FORTE/FRACA") ou para a chuva parar ("CHUVA · PARA EM 0:45"), com uma barrinha da força da chuva. Fica amarelo quando falta pouco e azul enquanto chove.
- **Sol nas poças:** depois da chuva, com o céu aberto, as poças refletem o sol que vem da praia: brilho quente do lado do sol, faíscas piscando na água, ondinhas de luz e um reflexo dourado no fim da tarde. Some na chuva forte, na neblina e à noite.
- **Sirenes:** viaturas, ambulâncias (SAMU) e o caminhão de bombeiros piscam o giroflex (polícia vermelho/azul, SAMU vermelho/branco, bombeiros vermelho), com brilho no ar e luz colorida no chão em volta; à noite brilha mais e tinge os zumbis perto. Chegando perto, a sirene toca: polícia sobe e desce, SAMU faz os dois tons, bombeiros um uivo mais lento. Fica mais alta quanto mais perto e vem do lado certo. Carro explodido perde a sirene.

## R42 · ATLAS A23 — cuspe que cai no chão, clima novo, bala dos zumbis e mochila
- **Cuspe do Cuspidor:** agora ele é jogado em arco, sobe e desce, e a sombra no chão mostra onde vai cair. Ao bater no chão estoura e deixa uma **poça roxa** de gosma por alguns segundos. Quem pisa nela leva dano, e se cair em cima de você o estouro também machuca.
- **Raio só na chuva:** o relâmpago só acontece quando está chovendo de verdade na tela.
- **Clima novo:** a partida começa chovendo, com as poças já cheias. A chuva para em pouco mais de 1 minuto, e o sol do fim da tarde deixa as poças brilhando enquanto elas secam. A noite fica escura e sem chuva, e no amanhecer volta a chover. Depois o sol da manhã seca tudo de novo. O timer da chuva acompanha esse ciclo.
- **Bala dos zumbis:** todo zumbi que morre solta uma bala 3D girando (menor que os outros itens). Cada uma dá **5 balas** e fica no mapa até você pegar.
- **Mochila:** cada espaço com item tem um botão **✕** para jogar fora, no computador e no celular. No primeiro toque ele pergunta "JOGAR FORA?" e no segundo descarta, para não perder item sem querer.
