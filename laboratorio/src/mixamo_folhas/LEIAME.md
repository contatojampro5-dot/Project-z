# Folhas dos zumbis do Mixamo (R53)
Fotografa os modelos de `godot-preview/assets/mixamo/personagens/` em 8 direções, no formato das folhas do jogo
(célula 64×72, chão na linha 60; linhas: andar/correr 0–7, atacar 8–14, levar tiro 15–18, morrer 19–27, rastejar sem pernas 28–35).

1. `npm i three@0.160.0` numa pasta de trabalho; crie `srv/` com `studio.html`, um link `mixamo` → `godot-preview/assets/mixamo`
   e um link `three` → `node_modules/three`; rode `python3 -m http.server 8899` dentro de `srv/`.
2. `node bake.js <personagem> <normal|runner> <saida.webp> [LeftArm|RightArm]` (o último esconde o braço: folhas semL/semR).
Saídas vão para `assets/images/game/infectados/mixamo-<personagem>[-semL|-semR].webp`.
