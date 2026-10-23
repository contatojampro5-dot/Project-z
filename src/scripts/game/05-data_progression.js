// -- src/data/progression.js --
// GDD v0.5 — Entrega C: dados e regras de progressão, sem estado de interface.
const WAVES=Object.freeze({rest:4.5,maxAlive:85,spawnMin:225,spawnMax:390});
// Crescimento de densidade: o Hardcore recebe mais do dobro dos reforços anteriores.
// Um teto independente por dificuldade impede crescimento ilimitado em partidas longas.
const HORDE_BALANCE=Object.freeze({
  easy:{spawn:1.4,alive:1.4},
  medium:{spawn:2,alive:1.8},
  hardcore:{spawn:2.4,alive:2},
});
function maxAliveForWave(wave,density=1){
  return Math.min(Math.round(WAVES.maxAlive*density),Math.round((32+6*Math.max(1,wave))*density));
}

function durationForWave(wave){return wave===1?30:wave<=4?35:40;}
function spawnsForWave(wave,multiplier=1){return Math.round((8+4*Math.pow(wave,1.24))*multiplier);}
// G.3.1.5 — XP progressivo; primeiros níveis rápidos, intervalos cada vez maiores.
const XP_PER_LEVEL=Object.freeze([100,145,195,250,310,375,445,520,600,685,775,870,970,1075,1185,1300,1420,1545,1675]);
const XP_TOTAL=[0];
function xpNeedForLevel(level){
  const tier=Math.max(1,Math.floor(level));
  return tier<=XP_PER_LEVEL.length?XP_PER_LEVEL[tier-1]:1675+135*(tier-19)+4*Math.pow(tier-19,2);
}
function xpForLevel(level){
  const target=Math.max(1,Math.floor(level));
  while(XP_TOTAL.length<target){const tier=XP_TOTAL.length;XP_TOTAL.push(XP_TOTAL[tier-1]+xpNeedForLevel(tier));}
  return XP_TOTAL[target-1];
}
// R44: a trilha é escolhida logo no começo da partida (nível 1) e evolui nos níveis 5 e 10.
const SPECIAL_MILESTONES=Object.freeze([1,5,10]);
const SURVIVAL_TRACKS=Object.freeze({
  melee:[
    {id:'survival_melee_1',name:'FACA DE SOBREVIVÊNCIA',desc:'Ataque automático de emergência quando um infectado encosta. Rápido, alcance curto.',type:'special',branch:'melee',tier:1,max:1},
    {id:'survival_melee_2',name:'TACO DE BEISEBOL',desc:'Substitui a faca: golpe mais amplo, empurra até dois zumbis próximos.',type:'special',branch:'melee',tier:2,max:1},
    {id:'survival_melee_3',name:'MACHADO',desc:'Substitui o taco: golpe pesado em arco, até três infectados atingidos.',type:'special',branch:'melee',tier:3,max:1}
  ],
  traps:[
    {id:'survival_traps_1',name:'ARMADILHA DE PRESSÃO',desc:'Deixa uma pequena armadilha no chão. O infectado que passar sobre ela recebe dano.',type:'special',branch:'traps',tier:1,max:1},
    {id:'survival_traps_2',name:'CARGA EXPLOSIVA',desc:'Substitui a armadilha: detona ao detectar um infectado, atingindo um grupo.',type:'special',branch:'traps',tier:2,max:1},
    {id:'survival_traps_3',name:'CARGA DE CONTENÇÃO',desc:'Amplia a explosão e desacelera os sobreviventes para abrir uma rota de fuga.',type:'special',branch:'traps',tier:3,max:1}
  ],
  firearms:[
    {id:'survival_firearms_1',name:'CARREGADORES AMPLIADOS',desc:'+25% no pente principal e uma pequena redução no tempo de recarga.',type:'special',branch:'firearms',tier:1,max:1},
    {id:'survival_firearms_2',name:'ARMAMENTO AJUSTADO',desc:'Armas mais estáveis: disparos concentrados e recarga mais eficiente.',type:'special',branch:'firearms',tier:2,max:1},
    {id:'survival_firearms_3',name:'ARMEIRO DE CAMPO',desc:'Aprimoramento final: +10% de dano, +6% de cadência e recarga mais rápida.',type:'special',branch:'firearms',tier:3,max:1}
  ]
});
const SURVIVAL_SPECIALS=Object.freeze(Object.values(SURVIVAL_TRACKS).flat());
const SPECIAL_BY_ID=Object.freeze(Object.fromEntries(SURVIVAL_SPECIALS.map(x=>[x.id,x])));
// Q.03.5: arsenal de seis armas; estatísticas auditadas para balanceamento.
const WEAPONS=Object.freeze({
  // G.3.1.3: cada arma tem uma cadência, silhueta do projétil e papel distinto.
  // rate = disparos por segundo; E12 dispara os dois canos em um único acionamento, consome 1 unidade e cada chumbo tem dano próprio.
  pistol:{id:'pistol',name:'PISTOLA INICIAL',damage:16,rate:2.8,magazine:12,reserve:60,reload:1.1,speed:700,range:720,pellets:1,spread:.015,piercing:0},
  smg:{id:'smg',name:'SM9 · VESPA ALTERNADORA',damage:9,rate:10,magazine:30,reserve:120,reload:1.6,speed:685,range:620,pellets:1,spread:.10,piercing:0},
  rifle:{id:'rifle',name:'R98 · ESTACA DE CARVALHO',damage:21,rate:4.6,magazine:25,reserve:100,reload:1.8,speed:850,range:860,pellets:1,spread:.018,piercing:0},
  shotgun:{id:'shotgun',name:'E12 · FIQUE EM PAZ',damage:9,rate:1.15,magazine:2,reserve:40,reload:2.35,speed:625,range:400,pellets:14,spread:.37,piercing:0},
  revolver:{id:'revolver',name:'RM44 · JUÍZO FINAL',damage:58,rate:1.35,magazine:6,reserve:60,reload:2.6,speed:920,range:820,pellets:1,spread:.009,piercing:0},
  sniper:{id:'sniper',name:'.50 · CAÇADOR DE CABEÇAS',damage:115,rate:1/1.5,magazine:5,reserve:40,reload:3.5,speed:1450,range:1350,pellets:1,spread:.003,piercing:4},
});
// BLOCO 2 / HEFESTO + HÉSTIA: camada de acessórios por arma, sem mexer no arsenal original.
// Coleta, mochila e UI dos acessórios só serão integradas no Bloco 3.
const ACCESSORY_RARITIES=Object.freeze([
  {tier:1,name:'BRANCO',color:'#e6e7e9',value:.10},
  {tier:2,name:'AZUL',color:'#4e95f3',value:.19},
  {tier:3,name:'ROXO',color:'#b37aff',value:.30},
  {tier:4,name:'VERMELHO',color:'#f16b6b',value:.43},
  {tier:5,name:'OURO · ULTIMATE',color:'#f4c85d',value:.60},
]);
const ACCESSORY_SLOTS=Object.freeze({
 pistol:['mag','sight','barrel'],smg:['mag','stock','sight','barrel'],
 rifle:['mag','stock','sight','barrel'],shotgun:['stock','sight','barrel'],
 revolver:['sight','barrel'],sniper:['mag','stock','sight','barrel']
});
class WeaponAttachments {
 constructor(){this.byWeapon={};}
 slots(weapon){return ACCESSORY_SLOTS[weapon]?.slice()||[];}
 get(weapon,slot){return this.byWeapon[weapon]?.[slot]||0;}
 equip(weapon,slot,tier){
   if(!this.slots(weapon).includes(slot)||!Number.isInteger(tier)||tier<1||tier>5)return {ok:false,reason:'INCOMPATÍVEL'};
   const old=this.get(weapon,slot);
   (this.byWeapon[weapon]??={})[slot]=tier;
   return {ok:true,previous:old,weapon,slot,tier};
 }
 remove(weapon,slot){
   if(!this.slots(weapon).includes(slot))return {ok:false,reason:'INCOMPATÍVEL'};
   const old=this.get(weapon,slot);
   if(this.byWeapon[weapon])delete this.byWeapon[weapon][slot];
   return {ok:true,previous:old};
 }
 bonus(weapon,slot){const tier=this.get(weapon,slot);return tier?ACCESSORY_RARITIES[tier-1].value:0;}
 snapshot(weapon){return Object.freeze(Object.fromEntries(this.slots(weapon).map(slot=>[slot,this.get(weapon,slot)])));}
}


// BLOCO 3 / APOLO + AFRODITE: nomes neutros e compatibilidade clara, sem inventar novas armas.
const B3_ACCESSORY_NAMES=Object.freeze({mag:'EXTENSOR',stock:'CORONHA',sight:'MIRA',barrel:'CANO'});
function b3AccessoryType(slot,tier){return `att.${slot}.${tier}`;}
function b3ParseAccessory(type){
  const m=/^att\.(mag|stock|sight|barrel)\.([1-5])$/.exec(type||'');
  return m?{slot:m[1],tier:Number(m[2])}:null;
}
function b3RandomAccessoryTier(random=Math.random){
  const r=random()*100;
  return r<55?1:r<80?2:r<92?3:r<98?4:5;
}
const UPGRADES=Object.freeze([
  {id:'smg',name:'SM9 · VESPA ALTERNADORA',type:'weapon',desc:'Rajadas velozes · 10 tiros/s · projétil redondo',max:1,level:2},
  {id:'rifle',name:'R98 · ESTACA DE CARVALHO',type:'weapon',desc:'Projétil veloz · mais dano por tiro',max:1,level:2},
  {id:'shotgun',name:'E12 · FIQUE EM PAZ',type:'weapon',desc:'Dois canos juntos · 14 chumbos · um disparo = uma munição',max:1,level:2},
  {id:'revolver',name:'RM44 · JUÍZO FINAL',type:'weapon',desc:'Revólver pesado · 6 tiros · alto dano · cadência lenta',max:1,level:2},
  {id:'sniper',name:'.50 · CAÇADOR DE CABEÇAS',type:'weapon',desc:'Precisão pesada · até 5 alvos · recarga longa · dano decrescente',max:1,level:2},
  {id:'vest',name:'COLETE REFORÇADO',type:'equipment',desc:'+10 HP máximo e +10 HP atual',max:5,level:2},
  {id:'shoes',name:'TÊNIS DE CORRIDA',type:'equipment',desc:'+10% velocidade',max:3,level:2},
  {id:'gloves',name:'LUVAS TÁTICAS',type:'equipment',desc:'+8% cadência',max:4,level:2},
  {id:'backpack',name:'MOCHILA DE MUNIÇÃO',type:'equipment',desc:'+20% capacidade do pente',max:3,level:2},
  {id:'sight',name:'MIRA APRIMORADA',type:'equipment',desc:'+7% dano',max:4,level:2},
  {id:'piercing',name:'MUNIÇÃO PERFURANTE',type:'modifier',desc:'Atravessa +1 zumbi',max:2,level:4},
  {id:'concentrated',name:'BALAS REFORÇADAS',type:'modifier',desc:'+10% dano da arma',max:3,level:3},
  {id:'trigger',name:'GATILHO PRECISO',type:'modifier',desc:'+6% cadência',max:3,level:3},
]);
const UPGRADE_BY_ID=Object.freeze(Object.fromEntries(UPGRADES.map(x=>[x.id,x])));

