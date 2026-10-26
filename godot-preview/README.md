# PROJECT Z — Prólogo "Dia Zero" (Godot 4.7, cidade 3D)

O **primeiro dia do surto** na Zona Leste, feito no **Godot 4.7**: uma cidade 3D com câmera alta e inclinada
no estilo Project Zomboid, pôr do sol que vira noite, multidão em pânico, carros batendo e explodindo,
helicóptero com holofote e a fuga até a casa no alto do morro. Segue a história oficial (`docs/historia.md`).
O jogo do navegador (`src/`, `jogo/`) não foi mexido.

- **Jogar no navegador:** https://contatojampro5-dot.github.io/Project-z/jogo-godot/
  (na primeira vez baixa uns 15 MB; clique na tela para o som começar)
- **Abrir no Godot:** passo a passo abaixo.

## Como abrir no Godot (passo a passo)

1. Baixe o **Godot 4.7** (versão "Standard"): https://godotengine.org/download/archive/4.7.2-stable/
2. Descompacte e abra o programa (não precisa instalar).
3. Na tela de projetos, clique em **Importar** e escolha `godot-preview/project.godot`.
4. Clique em **Importar e editar**. Na primeira vez o Godot leva um tempinho preparando as imagens.
5. Aperte **F5** (ou o ▶ lá em cima) para jogar.

## Controles

| Ação | Teclado | Controle |
| --- | --- | --- |
| Andar | WASD ou setas | analógico esquerdo |
| Correr | Shift | RB |
| Pular carros e barreiras | Espaço | A |
| Interagir / se soltar de um infectado | E (aperte várias vezes para se soltar) | X |
| Golpear com o extintor (Antônio) | F ou clique | B |
| Pular fala | Enter | Y |
| Pausa (recomeçar ou pular capítulo) | Esc ou P | Start |

## O roteiro

| Parte | Quem | O que acontece |
| --- | --- | --- |
| Abertura | — | "Este é o dia em que tudo acabou." A sua foto aérea com o rádio falando dos idosos internados e dos boatos da vacina, e depois a mesma cidade em 3D, com um voo do céu até a faculdade. |
| Cap. 1 · Faculdade 17:40 | Hannah | Ela está **dentro da sala do TCC**, com o slide "Guerra, defesa e o desenvolvimento científico e tecnológico de um país". Os professores não vieram. Ela carrega o celular e vê 14 chamadas perdidas da Hadassa. Colegas no pátio falam dos parentes que passaram mal. Um carro bate no ônibus, ela vai até o portão e a avenida vira caos, com um helicóptero passando. Depois corre para o hospital, **entra no pronto-socorro** e descobre que a Hadassa saiu para buscá-la na faculdade. A Dona Cida, na maca, convulsiona e levanta, e o contágio começa ali dentro. Ela foge. |
| Cap. 2 · Mercado 17:52 | Antônio | Abre na fachada do mercado. No depósito, ele vê pela **câmera de segurança** só dois infectados entrando no estacionamento, e a cadeia do contágio: eles mordem as funcionárias e os clientes um atrás do outro, e cada mordido levanta infectado em 15 segundos (o contador da câmera mostra quantos foram mordidos e quantos já levantaram). O coração dispara (bpm) e ele se obriga a respirar. Elas levantam transformadas. Ele baixa a porta de aço, sobe no telhado e vê tudo: a Hannah indo para o hospital e a Hadassa indo para os infectados. Pega o **extintor** e enfrenta o corredor. |
| Cap. 3 · Fuga 18:10 | Antônio + Hadassa | O engavetamento com explosão e câmera lenta, mais a horda, fecham o caminho do hospital. Eles fogem pela avenida, a multidão sai do estádio com infectados no meio, o helicóptero ilumina e não para, jatos passam baixo e há bombardeios ao longe. Eles sobem a trilha. Final no topo: a cidade queimando à noite e "continua...". |

## Como foi feito

- **Zumbis 3D do Mixamo** (`scripts/zumbi3d.gd`): os infectados são modelos 3D animados de verdade, como no
  Project Zomboid. Seis personagens que o Theo baixou do Mixamo (`assets/mixamo/personagens/`: Parasite,
  Prisoner, Warzombie, Zombiegirl, Copzombie e Yaku) com 21 movimentos dos pacotes "Scary" e "Not So Scary
  Zombie" (`assets/mixamo/*.fbx`): andar, arrastar, correr, rastejar, morder, morder o pescoço, gritar, levar
  golpe, cair, morrer e levantar do chão. Quem vira infectado levanta com a animação do Mixamo; o policial vira o
  zumbi policial. As animações andam no lugar (o jogo move o corpo) e o ritmo acompanha a velocidade. Fora da tela
  a animação não é calculada. Sem os arquivos, o jogo monta um corpo feito por código nos mesmos ossos.
- **Contágio (a regra do Theo)**: quem é mordido ou agarrado vira infectado em **15 segundos**. A pessoa cai
  com a mordida, levanta e continua fugindo machucada (cada vez mais devagar, e a pele vai ficando
  cinza-esverdeada), nos últimos 3 segundos desaba tremendo e levanta infectada. O infectado morde e já larga:
  vai atrás do próximo mais perto e ignora quem já foi mordido. Dois infectados viram quatro, depois oito...
  (`scripts/civil.gd`, `scripts/infectado.gd`; limite de 120 infectados no mapa, para ficar leve).
- **Lugares com cara própria e com interior**:
  - **Arena Fúria** (do time fictício Fúria Leste F.C.): costelas de concreto inclinadas, vidro escuro com as lajes do saguão,
    faixa de LED vermelha, cobertura branca em balanço, arquibancada em dois anéis (torcida vermelha e preta e
    o setor visitante azul), camarotes acesos, telão e, no oeste, os portões com catracas, bilheterias,
    carrinhos de comida com guarda-sol, grades da polícia, bandeiras e faixas da torcida.
  - **Mercado do Antônio**: faixa vermelha e amarela nas fachadas, toldo listrado do hortifrúti com caixotes
    de fruta, cartazes de oferta escritos à mão, gaiola de botijão, galões de água, moto de entrega, carrinhos,
    mesinha de plástico, doca de mercadorias nos fundos, porta de aço que desenrola do rolo. Por dentro: piso
    quadriculado, gôndolas cheias, caixas, geladeira de bebidas acesa, açougue e o depósito.
  - **Hospital Municipal São Crispim**: o saguão do pronto-socorro é de verdade, com recepção, cadeiras de espera, boxes de triagem
    com cortina, macas, soro e cadeira de rodas.
  - **Faculdade Integrada do Pari**: a ala norte tem corredor com armários e mural e salas de aula com lousa e carteiras (dá
    para entrar pelas portas do pátio); a ala oeste tem a sala do TCC.
  - **Nomes inventados** (nada de nome real): Av. dos Tecelões, R. São Crispim, R. das Torcidas, R. do Cruzeiro,
    R. dos Armazéns e o Morro do Cruzeiro, com placas azuis nas esquinas.
  - Ao entrar, o prédio some e as paredes de dentro abaixam (como no Zomboid).

- **Cidade 3D por código** (`scripts/cidade.gd`, `scripts/predio.gd`): avenida com canteiro arborizado,
  faixas e semáforos, calçada "mapa de SP", prédios de 3 a 5 andares com fachada de reboco, pastilha ou
  tijolo à vista, janelas com grade, ar-condicionado, varal, lojas no térreo com porta de aço pichada,
  marquise e toldo, telhados com caixa d'água azul, postes de concreto com a fiação emaranhada, orelhões,
  bancas, pontos de ônibus, caçambas, casas de telha, estádio iluminado e o morro em relevo com mata.
- **Estilo Zomboid**: câmera alta na diagonal, os personagens vistos de cima a ~38°. Quando um prédio
  esconde o personagem, abre um **buraco de visão** só em volta dele. Quando ele entra num prédio (a sala
  do TCC, o mercado), o prédio some e as paredes internas abaixam.
- **Personagens**: gerados no motor do laboratório do jogo (`laboratorio/src/civis.js` +
  `laboratorio/src/export_civ.js`), com a mesma arte da Hannah e do Antônio. São 14 moradores (executivo,
  estudantes, idosos, pedreiro, motoboy, torcedores, enfermeiro, policial, as funcionárias do mercado),
  Hannah, Antônio e Hadassa sem arma, o Antônio com o extintor e os infectados comum e corredor. As poses
  são: parado olhando em volta, andar, correr, fugir com os braços para cima, se encolher, falar no
  celular, levar golpe e cair.
- **Texturas** geradas por `ferramentas/gerar_texturas.py`, com marcas fictícias (Casas do Brás, Drogaria
  Sé, Parada 24h, Banco Tietê...).
- **Efeitos** (`scripts/fx.gd`): fogo animado que ilumina as paredes, fumaça preta em coluna, brasas,
  explosão com bola de fogo, clarão, faíscas, destroços e onda de choque, vidro estilhaçando, sangue e
  queimado no chão, colunas de fumaça no horizonte e câmera lenta nos momentos grandes. **Sem tremor de
  tela** (regra do dono).
- **Luz**: sol baixo e dourado com sombra longa e sombra azulada, que vira noite. As janelas acendem, os
  postes acendem perto da câmera, há giroflex nas viaturas, refletores no estádio e o holofote do
  helicóptero.
- **Vozes (ElevenLabs)**: os 4 boletins do rádio (com filtro de rádio AM), 4 falas da Hannah e 1 do
  Antônio. O resto aparece só em legenda: o ElevenLabs bloqueou o plano gratuito por "atividade incomum"
  no meio da gravação. Para completar, é preciso uma conta com plano pago ativo. A lista das falas e dos
  ids está em `assets/audio/vozes/falas.json`; um arquivo `<id>.mp3` novo entra sozinho.

- **Letras**: Instrument Serif nos títulos de cinema (com uma faixa escura macia por trás), Syne espaçada nos
  rótulos (OBJETIVO, nomes de quem fala, FÔLEGO) e Manrope nas legendas e no HUD. Todas do Google Fonts (licença
  OFL), em `assets/fonts/`.
- **Proporção**: as pessoas têm o tamanho real ao lado de carros, portas e móveis (conferido com uma caixa de
  1,72 m e uma porta de 2,1 m). A câmera fica um pouco mais perto para compensar.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `scripts/main.gd` | Diretor: abertura, os 3 capítulos, câmeras de cena, eventos, falas e objetivos |
| `scripts/mapa.gd` | Planta da cidade em metros (ruas, lugares da história, morro e trilha) |
| `scripts/cidade.gd` | Monta a cidade 3D inteira |
| `scripts/predio.gd` | Prédio com fachada, telhado, marquise e o buraco de visão |
| `scripts/lote.gd` | Junta milhares de peças em poucas malhas (leve) |
| `scripts/colisao.gd` | Colisão leve no chão (prédios, carros, árvores, trilha do morro) |
| `scripts/ambiente.gd` | Céu, sol, neblina, cor de cinema, pôr do sol → noite |
| `scripts/camera.gd` | Câmera estilo Zomboid e os voos de cena |
| `scripts/pessoa.gd`, `sobrevivente.gd`, `civil.gd`, `infectado.gd` | Gente: sprites em 8 direções no 3D |
| `scripts/carro.gd` | Hatch, sedã, Kombi, ônibus, viatura e ambulância: trânsito, batida, fogo, explosão |
| `scripts/aeronave.gd` | Helicóptero com holofote e jatos |
| `scripts/fx.gd` | Fogo, fumaça, explosões, faíscas, vidro, manchas |
| `scripts/hud.gd`, `audio.gd` | Legendas com retrato e voz, objetivo, celular, câmera de segurança; sons 3D |
| `shaders/` | Fachada (atlas + janelas acesas + buraco de visão), chão do morro, sprite das pessoas |
| `vitrine.tscn` | Fotos da cidade de vários ângulos, incluindo os interiores (teste visual; `--so=nome1,nome2` tira só algumas) |

## Testes

```
# o prólogo se joga sozinho do começo ao fim (deve terminar com "[autotest] OK")
godot --headless --path godot-preview -- --autotest
# confere se dá para andar entre todos os pontos do roteiro (deve dar "TUDO OK")
godot --headless --path godot-preview -- --rotas
# fotos de cada momento (precisa de tela; no servidor use xvfb-run)
xvfb-run godot --path godot-preview --rendering-driver opengl3 -- --autotest --fotos=/pasta
# versão Web em jogo-godot/ (precisa dos modelos de exportação Web do Godot 4.7.2)
godot --headless --path godot-preview --export-release "Web" ../jogo-godot/index.html
```
