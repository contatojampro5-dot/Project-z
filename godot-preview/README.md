# PROJECT Z — Prólogo "Dia Zero" (prévia em Godot)

Uma prévia curta, de 6 a 10 minutos, do **primeiro dia do surto** na Zona Leste, feita no **Godot 4.3**.
Ela segue a história oficial (`docs/historia.md`): a Hannah na faculdade, o Antônio no mercado, o
corredor atacando a Hadassa e a fuga para o morro. O jogo do navegador (`src/`, `jogo/`) não foi mexido.

- **Jogar no navegador:** https://contatojampro5-dot.github.io/Project-z/jogo-godot/
  (na primeira vez baixa uns 10 MB; clique na tela para o som começar)
- **Abrir no Godot:** veja o passo a passo abaixo.

## Como abrir no Godot (passo a passo)

1. Baixe o **Godot 4.3** (versão "Standard", não precisa da .NET): https://godotengine.org/download/archive/4.3-stable/
2. Descompacte e abra o programa. Não precisa instalar nada.
3. Na tela de projetos, clique em **Importar** e escolha o arquivo `godot-preview/project.godot`.
4. Clique em **Importar e editar**. Na primeira vez o Godot leva um tempinho preparando as imagens.
5. Aperte **F5** (ou o botão ▶ no canto de cima) para jogar.

## Controles

| Ação | Teclado | Controle |
| --- | --- | --- |
| Andar | WASD ou setas | analógico esquerdo |
| Correr | Shift | RB |
| Pular carros e barreiras | Espaço | A |
| Interagir / se soltar de um infectado | E (aperte várias vezes para se soltar) | X |
| Golpear (Antônio) | F ou clique | B |
| Pular fala | Enter | Y |
| Pausa (recomeçar ou pular capítulo) | Esc ou P | Start |

## O roteiro

| Parte | Quem | O que acontece |
| --- | --- | --- |
| Abertura | — | Suas fotos aéreas da cidade ao pôr do sol, com o rádio falando dos idosos internados e dos boatos sobre a vacina. |
| Capítulo 1 · Faculdade 17:40 | Hannah | Os professores não vieram. Ela carrega o celular e vê **14 chamadas perdidas da Hadassa**. Colegas comentam que parentes passaram mal. Um carro bate no ônibus, ela vai até o portão e a avenida vira um caos. Ela corre rumo ao hospital. |
| Capítulo 2 · Mercado 17:52 | Antônio | No depósito, ele vê pelas câmeras os infectados atacando as duas funcionárias. O coração dispara e você controla a respiração. Elas levantam transformadas. Ele baixa o portão, sobe no telhado e vê a cidade, a Hannah correndo para o hospital e a Hadassa indo direto para um grupo de infectados. Ele pega algo para se defender e enfrenta o **corredor**. |
| Capítulo 3 · Fuga 18:10 | Antônio + Hadassa | A caminho do hospital, um engavetamento com fogo e a horda fecham a V1. Eles fogem pela V2, passam pela multidão saindo do estádio, veem o helicóptero que não para e os jatos, e sobem a trilha até a casa no alto do morro. Final: a cidade queimando à noite e "continua...". |

### O que é cânone e o que é proposta minha

Segui o que está como **[Definido]** em `docs/historia.md`. Onde o documento deixa em aberto, eu fiz
uma proposta que **ainda precisa da sua decisão**, Theo:

1. **O objeto que o Antônio usa contra o corredor** (pendente no documento): o jogador escolhe entre
   **extintor, rodo ou pé de cabra**. Dá para ver de qual você gosta mais e fixar um.
2. **Como a condição cardíaca do Antônio afeta o gameplay** (pendente): batimentos na tela (bpm). Correr
   e ficar perto de infectados aceleram o coração; acima de 150 ele fica mais lento e o fôlego volta
   devagar. Na cena das câmeras tem um minijogo de respiração.
3. **Como o Antônio sabe que a Hannah foi para o hospital**: ele a vê do telhado, passando pela avenida
   (a mesma corrida do capítulo 1).
4. **O desencontro das irmãs**: a Hannah vai para o hospital pela calçada de cima da avenida, enquanto a
   Hadassa vem do hospital pelo outro lado procurando por ela.
5. **Ambiente de "Guerra Mundial Z"**: multidão saindo do estádio, helicóptero que não para e jatos
   passando. Fica só no fundo, sem explicar a origem do surto (que continua misteriosa).
6. **O San não aparece**, porque a entrada dele na história ainda está pendente. No final só aparece
   "San — ninguém sabe onde ele está".

## Regras do projeto que a prévia respeita

- Sem tremor de tela: as explosões usam clarão de luz.
- Marcas fictícias (só "HOSPITAL", "FACULDADE", "MERCADO", "ESTÁDIO").
- Prédios de 3 a 5 andares, translúcidos só quando o personagem passa atrás.
- Personagens e infectados 15% menores, e sobreviventes um pouco maiores que os zumbis.
- Leve: renderizador **Compatibility** (o mais leve do Godot, roda em PC fraco e no navegador), cidade e
  pessoas desenhadas por código e partículas na CPU.

## Arte e som reaproveitados do jogo

- Folhas de sprite em 8 direções de **Hannah, Antônio e Hadassa** (`*_pistol.webp`) e dos infectados
  **comum** (operário, executivo, paciente) e **corredor** (atleta), as mesmas do jogo web.
- Retratos nas falas: as fotos que você mandou (a Hadassa enfermeira é a imagem nova) e os retratos do jogo.
- Sons: fogo, horda, gritos, explosões, infectados e as duas músicas do jogo. A sirene, o coração, o
  helicóptero, o portão de aço, o rádio e o celular foram gerados por código.
- Os sprites dos sobreviventes seguram pistola, porque são as folhas que existem. Uma folha sem arma (ou com
  o objeto improvisado) seria um trabalho para o laboratório depois.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `scripts/main.gd` | Diretor: monta a cidade e roda a abertura e os 3 capítulos (falas, objetivos, eventos) |
| `scripts/world.gd` | Chão da cidade (ruas, faixas, canteiro, estacionamentos, pátio, morro e trilha) e colisão |
| `scripts/building.gd` | Prédios em caixa pseudo-3D (fachada + telhado), estádio, placas |
| `scripts/interior.gd` | Dentro do mercado do Antônio (prateleiras, depósito, câmeras, portão, objetos) |
| `scripts/actor.gd` | Base de quem anda (sprite em 8 direções, colisão, movimento de cena) |
| `scripts/survivor.gd` | Hannah, Antônio e Hadassa (correr, pular, se soltar, golpear, coração) |
| `scripts/zombie.gd` | Infectados comum e corredor |
| `scripts/civilian.gd` | Pessoas da cidade em pânico (desenhadas por código), que podem ser mordidas e levantar |
| `scripts/car.gd` | Carros, viaturas, ambulâncias e ônibus: trânsito, batida, fogo e explosão |
| `scripts/fx.gd`, `shock_ring.gd` | Fogo, fumaça, faíscas, explosões e luzes |
| `scripts/aircraft.gd` | Helicóptero com holofote e jatos |
| `scripts/hud.gd` | Legendas com retrato, objetivo, celular, câmera de segurança, pausa e tela final |
| `scripts/audio.gd` | Sons com posição na cidade, loops e música |

## Testes (para o Claude ou quem mexer no código)

```
# o prólogo se joga sozinho do começo ao fim (deve terminar com "[autotest] OK")
godot --headless --path godot-preview -- --autotest

# confere se dá para andar entre todos os pontos do roteiro (deve dar "TUDO OK")
godot --headless --path godot-preview -- --rotas

# capturas de tela de cada momento (precisa de tela; no servidor use xvfb-run)
xvfb-run godot --path godot-preview --rendering-driver opengl3 -- --autotest --shots=/pasta/das/capturas

# gerar a versão Web em jogo-godot/ (precisa dos modelos de exportação Web do Godot 4.3)
godot --headless --path godot-preview --export-release "Web" ../jogo-godot/index.html
```
