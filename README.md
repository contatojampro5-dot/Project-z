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
