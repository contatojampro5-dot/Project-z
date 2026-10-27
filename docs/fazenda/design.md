# MODO FAZENDA — documento de design

> Pedido do Theo (27/10/2026): um modo de **construção** dentro da Fazenda do Seu João (R54, Morro do Cruzeiro).
> Cortar árvores, juntar madeira, levantar cerca que evolui, segurar as ondas, produzir, achar sobreviventes com
> habilidades e treinar cada um (arco e flecha, arma de fogo…). A cidade vira lugar de **expedição**: mercado para
> suprimentos, hospital quando alguém fica doente. Este documento junta a pesquisa, o desenho do modo, como o
> código fica separado e a ordem das fases.

---

## 1. Pesquisa — jogos de referência e o que tirar de cada um

| Jogo | O que ele faz bem | O que a gente pega |
|---|---|---|
| **They Are Billions** | Colônia steampunk cercada por hordas; muro de madeira → pedra → ferro; torres; ondas anunciadas com relógio; uma brecha derruba tudo. Jogadores dizem que madeira só "compra tempo" e pedra é o mínimo antes dos especiais. | Relógio da próxima horda, muro em **níveis**, horda que procura o ponto fraco, camadas duplas de cerca. |
| **7 Days to Die** | Bloco evolui em etapas (moldura de madeira → madeira → pedra → concreto → aço), cada etapa pede o material do próximo nível; a "lua de sangue" a cada 7 dias; corredor da morte para os zumbis virem numa fila só. | Evolução por **etapas com material diferente**, horda grande marcada, cerca que **guia** os zumbis para um funil. |
| **State of Decay 2** | Base com vagas de instalação (enfermaria, oficina, horta, torre), cada uma com upgrade e exigência de habilidade; sobreviventes com 4 habilidades básicas + 1 especial (cozinha, jardinagem…); postos avançados dão recurso diário; saída para buscar suprimento. | **Vagas** de construção na fazenda, sobrevivente com **habilidade própria**, **expedições** à cidade, postos que produzem sozinhos. |
| **Kingdom Two Crowns** | Você recruta andarilhos e dá profissão (construtor, arqueiro, fazendeiro); arqueiros sobem nas torres; o ataque vem à noite. Simples, só com uma moeda. | Recrutar e **dar profissão** a cada pessoa com um toque; arqueiro na torre; controle bem simples (bom para o celular). |
| **RimWorld** | Cada colono tem nível e **paixão** por habilidade (paixão = aprende mais rápido e fica feliz); prioridades de trabalho; ataques de saqueadores. | Habilidade com nível + **talento** (aprende rápido); fila de trabalho automática; humor/fome leves. |
| **Days Gone** | Acampamentos com **confiança** (3 níveis): entregar carne, ervas e orelhas de infectado sobe a confiança e libera loja. | Moral/confiança da fazenda sobe com entregas e libera coisas novas. |
| **Project Zomboid** | Carpintaria por nível: parede de madeira nível 1/2/3 pede mais carpintaria e dá mais resistência; plantar, regar e colher. | **Quem constrói melhor** faz cerca mais forte; horta com ciclo de plantio. |
| **Last Day on Earth** | Coleta (madeira, pedra, metal) → craftar → base com paredes madeira/pedra/metal; saídas para zonas perigosas. | Loop curto de coletar → construir, ótimo para o celular. |
| **Frostpunk** | Centro da cidade (gerador) que precisa ser mantido; leis; esperança e descontentamento. | A **casa sede** como coração da base (se cair, perde a partida); escolhas de "regras" da fazenda mais tarde. |

Fontes: [They Are Billions – fórum Steam](https://steamcommunity.com/app/644930/discussions/0/1485487749772797291),
[7 Days to Die – guia de construção](https://xgamingserver.com/blog/7-days-to-die-base-building-guide/),
[7DTD – lua de sangue](https://xgamingserver.com/blog/the-blood-moon-horde-in-7-days-to-die-strategies-and-overview/),
[State of Decay 2 – base](https://www.shacknews.com/article/104971/how-to-build-a-base-in-state-of-decay-2),
[State of Decay – comunidade](https://www.stateofdecay.com/?p=43396),
[Kingdom Two Crowns – Wikipedia](https://en.wikipedia.org/wiki/Kingdom_Two_Crowns),
[RimWorld wiki – Basics](https://www.rimworldwiki.com/wiki/Basics),
[Days Gone – níveis de confiança](https://daysgone.fandom.com/wiki/Trust_Level),
[Project Zomboid – parede de madeira](https://pzfans.com/how-to-build-a-wooden-wall-in-project-zomboid),
[Last Day on Earth – construção](https://www.bluestacks.com/ru/blog/game-guides/last-day-on-earth-survival/last-day-on-earth-survival-base-building.html),
[Frostpunk – Wikipedia](https://Www.wikipedia.org/wiki/Frostpunk).

---

## 2. A ideia em uma frase

**De dia você junta e constrói; quando o relógio zera, a horda sobe o morro e testa a sua cerca.**
Com o tempo chegam pessoas, cada uma com um jeito de ajudar, e a cidade lá embaixo vira o lugar das saídas
perigosas para buscar o que a fazenda não produz.

### Pilares
1. **Tudo que você constrói apanha.** A cerca não é enfeite: zumbi bate, quebra, você conserta ou evolui.
2. **Pouco botão.** Um botão de AÇÃO faz a coisa certa conforme o que está perto (árvore = corta, cerca = conserta/evolui). Um botão CONSTRUIR abre a peça. Funciona igual no teclado, controle e celular.
3. **Cada pessoa importa.** Sobrevivente tem nome, habilidade e talento; perder alguém dói.
4. **A cidade é risco e recompensa.** Mercado, hospital, delegacia e faculdade viram expedições curtas.

---

## 3. O ciclo de jogo

```
 ┌──────────── PREPARAÇÃO (relógio) ────────────┐
 │ cortar árvores · pegar pedra/sucata           │
 │ construir/evoluir cerca · produzir · treinar  │
 └──────────────┬────────────────────────────────┘
                ▼
        HORDA SOBE O MORRO  ── zumbis batem na cerca, procuram a brecha
                ▼
        CONSERTAR · CURAR · CONTAR PERDAS
                ▼
   (a cada 3 ondas) EXPEDIÇÃO À CIDADE ── mercado, hospital, delegacia...
                ▼
            volta à preparação (horda seguinte maior)
```

---

## 4. Sistemas

### 4.1 Recursos
| Recurso | De onde vem | Para que serve |
|---|---|---|
| **Madeira** | cortar árvores do morro (cada árvore 3–7, conforme o tamanho) | cercas, torres, oficina, flechas |
| **Pedra** | pedras de granito do morro (fase 2) | muro de pedra, poço, forno |
| **Sucata** | carros da cidade, trator velho (fase 2/4) | cerca de chapa, armadilhas, armas |
| **Comida** | horta, galinheiro, curral, mercado | manter sobreviventes (fome) |
| **Remédio** | hospital, farmácia, ervas da horta | curar doente/ferido |
| **Munição** | delegacia, zumbi policial, oficina | armas de fogo dos atiradores |

### 4.2 Cercas e defesas (níveis)
| Nível | Nome | Custo | Vida | Extra |
|---|---|---|---|---|
| 1 | **Cerca de estaca** | 3 madeira | 140 | rápida de pôr |
| 2 | **Paliçada de tábuas** | +6 madeira | 360 | — |
| 3 | **Paliçada de ponta** | +10 madeira | 700 | machuca quem bate |
| 4 | **Cerca de chapa** (fase 2) | +6 sucata | 1100 | zumbi comum desiste mais rápido |
| 5 | **Muro de pedra** (fase 2) | +12 pedra | 1800 | só o Colosso derruba rápido |

Outras peças (fases 2–3): **porteira** (você e os seus passam, zumbi não), **torre de vigia** (arqueiro/atirador
sobe), **espeto no chão**, **fogueira** (luz + afasta corredor), **armadilha de sucata**.

Regras: você **pula a cerca** (zumbi não); zumbi encostado na cerca bate nela até quebrar; quem constrói
com mais habilidade faz a cerca nascer com mais vida (fase 3).

### 4.3 Ondas
- **Decisão do Theo (27/10, R56):** onda de **10 minutos**, depois **5 minutos para construir**; cortar e construir só nesse tempo e só na área da fazenda. Machado pego uma vez no cepo do lado da casa; segurar E por 3 s corta a árvore.
- A horda nasce **fora da tela, na mata** e sobe o morro; a cada 5 ondas, uma horda grande (tipo lua de sangue).
- Fase 2: zumbis escolhem o lado mais fraco da cerca; Colosso mira a cerca; Berrador chama reforço.

### 4.4 Produção (fase 2)
Vagas fixas da fazenda já desenhadas no R54: **horta** (comida), **galinheiro** (ovo), **curral**, **poço** (água),
**paiol** (estoque), **casa sede** (cama/enfermaria). Cada vaga tem 3 níveis e pode ter um sobrevivente cuidando.

### 4.5 Sobreviventes, profissões e treino (fase 3)
- Sobreviventes aparecem em **expedições** ou chegam pela estrada pedindo ajuda (evento).
- Cada um tem: **profissão inicial**, 4 habilidades (Luta, Tiro, Construção, Cuidado) com nível 1–5 e um **talento** (aprende 2× mais rápido).
- **Profissões:** Arqueiro (torre, silencioso, flecha de madeira), Atirador (arma, gasta munição, faz barulho), Lenhador, Construtor, Horteiro, Enfermeiro(a), Batedor (vai junto nas expedições).
- **Treino:** alvo de palha (tiro/arco), saco de pancada (luta – o San ensina), bancada (construção). Treinar custa tempo de preparação.
- Seu João (dono da fazenda, docs/historia.md item 27) vira o primeiro morador: ensina horta e conserta ferramentas.

### 4.6 Expedições à cidade (fase 4)
O mapa da cidade continua o mesmo do modo Sobrevivência. Da porteira você escolhe um destino:
| Destino | O que tem | Risco |
|---|---|---|
| **Mercado do Antônio** | comida, garrafas, ferramentas | médio |
| **Hospital Municipal São Crispim** | remédio, kit de cirurgia (cura doente) | alto (muitos infectados) |
| **Delegacia / viaturas** | munição, colete, armas | alto |
| **Oficina / carros** | sucata, gasolina | baixo |
| **Faculdade Integrada do Pari** | livros (treino mais rápido), química (Hanna) | médio |

Volta antes do relógio zerar ou a fazenda segura a horda sozinha com quem ficou.
Doença: mordida/febre deixa sobrevivente **doente**; sem remédio em X ondas, piora (fase 4).

### 4.7 Fim de partida
Perde quando o jogador morre **ou** a casa sede cai (fase 2). Placar: ondas, pessoas salvas, nível da fazenda.

---

## 5. Como o código fica separado

O modo roda **dentro do jogo do navegador** (mesmo mapa, mesmos zumbis, mesma arma), mas mora numa pasta própria
para não misturar com o modo Sobrevivência:

```
src/scripts/fazenda/
  F00-fazenda_Core.js      modo, estado da base (run.fz), recursos, relógio de preparação, botão do menu
  F01-fazenda_Arvores.js   cortar árvore (vida, queda, toco, madeira)
  F02-fazenda_Cercas.js    peças, níveis, colisão só para zumbis, dano, conserto, desenho
  F03-fazenda_Hud.js       painel de recursos, dicas, botões AÇÃO/CONSTRUIR no celular
  (fase 2+) F04-fazenda_Producao.js · F05-fazenda_Pessoas.js · F06-fazenda_Expedicao.js
src/styles/37-fazenda.css
docs/fazenda/design.md     este documento
```

- Entra no `src/manifest.json` **depois** do `38z-world_Morro.js` (usa as árvores e a fazenda dele) e antes do `39-ui`.
- Só liga quando o jogador escolhe **MODO FAZENDA** na tela de dificuldade (`game.pzMode==='fazenda'`). O modo
  Sobrevivência fica igualzinho (o teste Hera continua 26/26).
- Tudo prefixado `FZ`/`fz` (`FZ_FENCE_TIERS`, `run.fz`) para achar fácil. `window.__PZ_NO_FAZENDA=true` desliga o modo.
- Continua no `main` como o resto (regra do Theo: toda atualização vai para o GitHub). Se um dia o modo crescer
  muito, dá para virar um jogo à parte reaproveitando a mesma pasta.

---

## 6. Fases (roteiro)

| Fase | Versão | Conteúdo | Pronto quando |
|---|---|---|---|
| **1 — Primeira cerca** | R55 | Modo Fazenda no menu; começa na varanda da casa sede; relógio de preparação; **cortar árvores** (toco + madeira); **cerca em 3 níveis** de madeira (pôr, evoluir, consertar); zumbis batem e quebram a cerca; você pula a cerca; painel de madeira; botões no celular. | dá para cercar a casa e segurar 3 ondas |
| **2 — Base de verdade** | R56–R57 | pedra e sucata; níveis 4–5; porteira, torre, espeto, fogueira; casa sede com vida (perde se cair); horta/galinheiro/poço produzindo; chamar horda mais cedo; horda grande a cada 5. | base com produção e 5 tipos de peça |
| **3 — Gente** | R58–R59 | sobreviventes chegando, profissões (arqueiro, atirador, lenhador, construtor, horteiro, enfermeiro), habilidades + talento, treino (alvo, saco de pancada), Seu João morador, falas novas. | 4 pessoas trabalhando sozinhas na base |
| **4 — Expedições** | R60+ | saída pela porteira para mercado/hospital/delegacia/oficina/faculdade; doença e remédio; volta com mochila; a base aguenta sem você. | ciclo base ↔ cidade completo |
| **5 — História** | depois | modo história começa na fazenda (docs/historia.md), cutscenes, missões por pessoa. | — |

---

## 7. Decisões tomadas sem resposta do Theo (dá para mudar)
- O modo fica **no mesmo jogo do navegador**, numa pasta separada (não num projeto/plataforma novo): reaproveita mapa, zumbis 3D, armas, luz e chuva já prontos.
- O jogador **pula** a própria cerca (zumbi não) — evita ficar preso e dispensa porteira na fase 1.
- Cerca **não segura tiro** (dá para atirar por cima).
- ~~Primeira preparação de 40 s; as seguintes de 30 s.~~ Trocado pelo ciclo do Theo (10 min de onda / 5 min de construção, R56).
