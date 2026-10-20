// -- src/data/audioAssets.js --
// Catálogo único de áudio. Troque arquivos mantendo os caminhos para usar WAV gravados.
// O pacote de demonstração incluído é ORIGINAL e SINTETIZADO: não são disparos reais.
// source: arquivos públicos sob public/audio; standalone: data URIs geradas no build.
const SOUND_EVENTS = Object.freeze({
  shot: {group:'weapons', variants:['weapons/pistol_01.wav','weapons/pistol_02.wav','weapons/pistol_03.wav'], gain:.88, cooldown:.055},
  rifleShot: {group:'weapons', variants:['weapons/rifle_01.wav','weapons/rifle_02.wav','weapons/rifle_03.wav'], gain:.85, cooldown:.055},
  shotgun: {group:'weapons', variants:['weapons/shotgun_01.wav','weapons/shotgun_02.wav'], gain:1.1, cooldown:.14},
  reload: {group:'weapons', variants:['weapons/reload_01.wav'], gain:.53,cooldown:.35},
  dryFire: {group:'weapons', variants:['weapons/dry_01.wav'],gain:.42,cooldown:.4},
  hit: {group:'environment', variants:['fx/impact_01.wav','fx/impact_02.wav'], gain:.25,cooldown:.07},
  kill: {group:'environment', variants:['fx/kill_01.wav'], gain:.33,cooldown:.11},
  hurt: {group:'ui', variants:['fx/hurt_01.wav'],gain:.8,cooldown:.25},
  death: {group:'ui', variants:['fx/death_01.wav'],gain:.95,cooldown:1},
  level: {group:'ui', variants:['fx/level_01.wav'],gain:.78,cooldown:.2},
  upgrade: {group:'ui', variants:['fx/upgrade_01.wav'],gain:.7,cooldown:.12},
  wave: {group:'ui', variants:['fx/wave_01.wav'],gain:.7,cooldown:.6},
  pickup: {group:'ui', variants:['fx/pickup_01.wav'],gain:.6,cooldown:.12},
  ammo: {group:'ui', variants:['fx/ammo_01.wav'],gain:.56,cooldown:.12},
  grenadeThrow: {group:'weapons', variants:['fx/grenade_throw_01.wav'],gain:.65,cooldown:.2},
  explosion: {group:'environment', variants:['fx/explosion_01.wav','fx/explosion_02.wav'],gain:1,cooldown:.17},
  bossSpawn: {group:'ui', variants:['bosses/boss_intro_01.wav'],gain:.9,cooldown:1},
  bossWarn: {group:'ui', variants:['bosses/boss_warn_01.wav'],gain:.6,cooldown:.55},
  bossCharge: {group:'creatures', variants:['bosses/colossus_charge_01.wav'],gain:1,cooldown:.5},
  bossCast: {group:'creatures', variants:['bosses/hive_cast_01.wav'],gain:1,cooldown:.5},
  bossDown: {group:'ui', variants:['bosses/boss_down_01.wav'],gain:.9,cooldown:.8},
  step: {group:'environment', variants:['environment/footstep_01.wav','environment/footstep_02.wav'],gain:.18,cooldown:.18},
  zombieAttack: {group:'creatures',variants:['infected/attack_01.wav','infected/attack_02.wav'],gain:.45,cooldown:.25},
  zombieDeath: {group:'creatures',variants:['infected/death_01.wav','infected/death_02.wav'],gain:.42,cooldown:.15},
  zombieGrowl: {group:'creatures',variants:['infected/normal_01.wav','infected/normal_02.wav'],gain:.55,cooldown:.3},
  runnerGrowl: {group:'creatures',variants:['infected/runner_01.wav'],gain:.66,cooldown:.5},
  bomberGrowl: {group:'creatures',variants:['infected/bomber_01.wav'],gain:.76,cooldown:.6},
  spitterGrowl: {group:'creatures',variants:['infected/spitter_01.wav'],gain:.58,cooldown:.6},
  tankGrowl: {group:'creatures',variants:['infected/tank_01.wav'],gain:.7,cooldown:.7},
  summonerGrowl: {group:'creatures',variants:['infected/summoner_01.wav'],gain:.78,cooldown:.8},
  colossusGrowl: {group:'creatures',variants:['bosses/colossus_roar_01.wav'],gain:1.1,cooldown:2.2},
  hiveGrowl: {group:'creatures',variants:['bosses/hive_roar_01.wav'],gain:.95,cooldown:2.2},
});
const ZOMBIE_VOICE = Object.freeze({normal:'zombieGrowl',runner:'runnerGrowl',bomber:'bomberGrowl',spitter:'spitterGrowl',tank:'tankGrowl',summoner:'summonerGrowl',colossus:'colossusGrowl',hive:'hiveGrowl'});
const SOUND_FILES = Object.freeze([...new Set(Object.values(SOUND_EVENTS).flatMap(e=>e.variants))]);
const SOUND_LIMITS = Object.freeze({total:22,weapons:10,creatures:5,environment:6,ui:4});
// Context-independent spatial attenuation; used in unit tests and by the engine.
function spatialMix(source,listener,maxDistance=610){
  if(!source||!listener)return {gain:1,pan:0};
  const dx=source.x-listener.x,dy=source.y-listener.y;
  const distance=Math.hypot(dx,dy);
  if(distance>=maxDistance)return {gain:0,pan:0};
  return {gain:Math.pow(1-distance/maxDistance,1.7),pan:Math.max(-.85,Math.min(.85,dx/330))};
}
function chooseVoice(candidates,listener,random=Math.random){
  const near=candidates.filter(e=>e.alive&&e.kind&&listener&&Math.hypot(e.x-listener.x,e.y-listener.y)<470);
  if(!near.length)return null;
  // Random weighted towards the closest dangerous threat. Bosses have extra priority.
  const weighted=near.map(e=>({e,w:(e.isBoss?4:1)/Math.max(32,Math.hypot(e.x-listener.x,e.y-listener.y))}));
  const sum=weighted.reduce((a,v)=>a+v.w,0);
  let roll=Math.max(0,Math.min(.999999,random()))*sum;
  for(const item of weighted){roll-=item.w;if(roll<=0)return item.e;}
  return weighted.at(-1).e;
}

