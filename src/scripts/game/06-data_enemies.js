// -- src/data/enemies.js --
// Atributos centrais da Entrega E. Os chefes não participam do orçamento comum.
const ENEMY_TYPES=Object.freeze({
  normal:{name:'INFECTADO',hp:24,speed:59,radius:13,damage:10,xp:5,attackInterval:.9,sprite:'zombie',tint:'#91b998'},
  runner:{name:'CORREDOR',hp:16,speed:117,radius:11,damage:8,xp:8,attackInterval:1.05,sprite:'runner',tint:'#edbc78'},
  bomber:{name:'EXPLOSIVO',hp:28,speed:75,radius:14,damage:20,xp:12,attackInterval:2,sprite:'bomber',tint:'#f2897d'},
  spitter:{name:'CUSPIDOR',hp:35,speed:54,radius:13,damage:12,xp:14,attackInterval:2.6,sprite:'spitter',tint:'#b9a1de'},
  tank:{name:'TANQUE',hp:95,speed:43,radius:19,damage:18,xp:25,attackInterval:1.6,sprite:'tank',tint:'#84b1ad'},
  summoner:{name:'INVOCADOR',hp:50,speed:52,radius:14,damage:8,xp:30,attackInterval:6.5,sprite:'summoner',tint:'#be8ddd'},
});
const BOSS_TYPES=Object.freeze({
  colossus:{name:'O COLOSSO',hp:800,speed:39,radius:31,damage:24,xp:200,sprite:'colossus',color:'#e0a06d'},
  hive:{name:'A COLMEIA',hp:1200,speed:29,radius:32,damage:15,xp:350,sprite:'hive',color:'#b988dd'},
});
function enemyKindForWave(wave,random=Math.random()){
  // Novas classes entram gradualmente e ficam progressivamente mais presentes.
  const types=[{kind:'normal',weight:65}];
  if(wave>=2)types.push({kind:'runner',weight:wave<4?23:28});
  if(wave>=3)types.push({kind:'bomber',weight:wave<6?10:16});
  if(wave>=4)types.push({kind:'spitter',weight:wave<7?11:15});
  if(wave>=6)types.push({kind:'tank',weight:wave<9?8:14});
  if(wave>=8)types.push({kind:'summoner',weight:8});
  const total=types.reduce((s,v)=>s+v.weight,0);let roll=random*total;
  for(const item of types){roll-=item.weight;if(roll<0)return item.kind;}
  return types.at(-1).kind;
}
function bossKindForWave(wave){return wave%5===0?(Math.floor(wave/5)%2===1?'colossus':'hive'):null;}

