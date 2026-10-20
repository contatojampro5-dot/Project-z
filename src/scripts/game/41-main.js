// -- src/main.js --
(async()=>{

const game = new Game({
  canvas: document.querySelector('#game-canvas'),
  interfaceRoot: document.querySelector('#interface'),
  loader: document.querySelector('#loader'),
  progressBar: document.querySelector('#boot-progress-bar'),
});

try {
  await game.init();
} catch (error) {
  console.error('Falha ao iniciar PROJECT Z', error);
  const loader = document.querySelector('#loader');
  loader.innerHTML = `<div class="boot-mark">!</div><p>Falha ao carregar a zona.</p><p class="boot-error">Verifique o console do navegador e execute o jogo via servidor local.</p>`;
}


})();

// G318_VISUALS: 8-directions x 4-frame enemy atlases, occluded north-pointing guns.
