// -- src/data/loot.js --
// Entrega D: todo o balanceamento de recursos e granadas fica fora das cenas.
const LOOT = Object.freeze({
  collectionRadius: 22, maxWorldPickups: 28,
  minimumDistance: 82, maximumDistance: 350,
  lifetime: 115,
  ammo: {interval: [12, 20], max: 5, restoreMagazines: 2, color: '#f3bf72', label: 'MUNIÇÃO'},
  heart: {interval: [28, 42], max: 4, heal: 30, color: '#e78392', label: 'CURA +30'},
  grenade: {interval: [35, 55], max: 3, color: '#b7dd92', label: 'GRANADA +1'},
  fullHeart: {interval: [95, 145], max: 1, unlockWave: 3, color: '#ff8d9d', label: 'VIDA COMPLETA'},
});
const GRENADE = Object.freeze({
  starting: 2, capacity: 3, range: 335, radius: 110,
  damage: 55, fuse: .7, knockback: 95,
  lifetime: .43, throwCooldown: .35,
});

