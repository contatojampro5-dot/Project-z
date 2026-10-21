// -- src/data/combat.js --
// Entrega B: parâmetros isolados para balancear a arena de treinamento.
const COMBAT = Object.freeze({
  player: { speed:132, radius:12, invulnerability:0.6 },
  pistol: { damage:14, fireInterval:0.4, magazine:12, reserve:60, reload:1.1, bulletSpeed:650, range:700 },
  zombie: { hp:24, speed:59, radius:13, damage:10, attackInterval:0.9 },
  skirmish: { initialEnemies:3, spawnEvery:2.5, maximumEnemies:18, spawnDistanceMin:225, spawnDistanceMax:390 },
});

