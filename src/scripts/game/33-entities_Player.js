// -- src/entities/Player.js --


// Q.05.4 — inventário de sobrevivência, pilhas de até duas unidades.
class SurvivalBackpack {
  constructor(capacity=2){this.capacity=Math.max(2,Math.min(7,capacity|0));this.slots=Array.from({length:this.capacity},()=>null);}
  count(type){return this.slots.reduce((n,s)=>n+(s?.type===type?s.qty:0),0);}
  canAdd(type){return this.slots.some(s=>s===null||(s.type===type&&s.qty<2));}
  add(type,qty=1){let added=0;for(let i=0;i<qty;i++){let slot=this.slots.find(s=>s?.type===type&&s.qty<2);if(!slot){const idx=this.slots.indexOf(null);if(idx<0)break;slot={type,qty:0};this.slots[idx]=slot;}slot.qty++;added++;}return added;}
  remove(type,qty=1){if(this.count(type)<qty)return false;for(let i=0;i<qty;i++){for(let k=this.slots.length-1;k>=0;k--){const slot=this.slots[k];if(slot?.type===type){slot.qty--;if(!slot.qty)this.slots[k]=null;break;}}}return true;}
  resize(capacity){
    capacity=Math.max(2,Math.min(7,capacity|0));
    // Reorganizar itens antes de reduzir. Nenhuma unidade é destruída.
    // Consolidar pilhas parciais antes de verificar se uma mochila menor comporta tudo.
    // A contagem por tipo é preservada, sem perda nem duplicação de unidades.
    const totals=new Map();
    for(const slot of this.slots){if(slot)totals.set(slot.type,(totals.get(slot.type)||0)+slot.qty);}
    const needed=[...totals.values()].reduce((n,qty)=>n+Math.ceil(qty/2),0);
    if(needed>capacity)return false;
    const compact=[];
    for(const [type,total] of totals){for(let left=total;left>0;left-=2)compact.push({type,qty:Math.min(2,left)});}
    this.capacity=capacity;this.slots=Array.from({length:capacity},(_,i)=>compact[i]||null);return true;
  }
  moveSlot(from,to){
    if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=this.capacity||to>=this.capacity)return false;
    if(from===to)return true;
    const a=this.slots[from],b=this.slots[to];
    if(a&&b&&a.type===b.type){
      const moved=Math.min(a.qty,2-b.qty);
      if(moved>0){b.qty+=moved;a.qty-=moved;if(a.qty===0)this.slots[from]=null;}
    } else [this.slots[from],this.slots[to]]=[b,a];
    return true;
  }
}
class Player {
  constructor(maxHp,progression=null){
    this.progression=progression;
    this.x=592;this.y=575;this.radius=COMBAT.player.radius;
    this.hp=maxHp;this.maxHp=maxHp;this.invulnerable=0;this.facing=-Math.PI/2;
    // Q.05: colete branco inicial (1 barra de 25% do HP); HUD exibe 5 posições.
    this.armorTier=1;this.shieldBars=1;this.shieldMaxBars=1;this.shieldUnit=this.maxHp*.25;this.shield=this.shieldUnit;this.maxShield=this.shieldUnit;this.shieldCharge=0;this.backpack=new SurvivalBackpack(2);this.medkitCharge=0;this.selectedConsumable="shield";this.lastDamageReport=null;this.defenseFX={shield:0,break:0,health:0,heal:0,cell:0};
    this.walkTime=0;this.idleTime=0;this.motion=0;this.stepDust=0;this.specialRemaining=0;this.specialCooldown=0;
  }
  get medkits(){return this.backpack.count('medkit');}
  set medkits(n){this.setSupplyCount('medkit',n);}
  get shieldCells(){return this.backpack.count('shieldCell');}
  set shieldCells(n){this.setSupplyCount('shieldCell',Math.min(5,Math.max(0,n|0)));}
  setSupplyCount(type,n){const current=this.backpack.count(type);if(n>current)this.backpack.add(type,n-current);else if(n<current)this.backpack.remove(type,current-n);}
  get alive(){return this.hp>0;}
  get speed(){return Math.min(260,COMBAT.player.speed*(1+.1*(this.progression?.levelOf('shoes')||0)))*(this.specialRemaining>0&&(this.charId||'antonio')==='antonio'?1.4:1)*(this.speedMul||1);}
  addVest(){this.maxHp+=10;this.hp=Math.min(this.maxHp,this.hp+10);this.shieldUnit=this.maxHp*.25;this.maxShield=this.shieldUnit*this.armorTier;}
  heal(amount){
    if(!this.alive||!Number.isFinite(amount)||amount<=0)return 0;
    const before=this.hp;this.hp=Math.min(this.maxHp,this.hp+amount);return this.hp-before;
  }
  move(axis,dt){
    this.idleTime+=dt;
    const length=Math.hypot(axis.x,axis.y);
    const power=Math.min(1,length);
    if(power>.001){
      const dx=axis.x/length*this.speed*power*dt;
      const dy=axis.y/length*this.speed*power*dt;
      const pos=slideCircle(this.x,this.y,dx,dy,this.radius);
      this.x=pos.x;this.y=pos.y;this.walkTime+=dt*10*power;this.motion=Math.min(1,power);
    } else this.motion=0;
    this.invulnerable=Math.max(0,this.invulnerable-dt);
  }
  equipArmor(tier=1){
    // Coletes níveis 1–5: uma barra de 25% do HP máximo por nível; troca inferior permitida.
    this.armorTier=Math.max(1,Math.min(5,Math.floor(tier)));
    this.shieldMaxBars=this.armorTier;this.shieldBars=this.armorTier;
    this.shieldUnit=this.maxHp*.25;this.maxShield=this.shieldMaxBars*this.shieldUnit;
    this.shield=this.maxShield;this.shieldCharge=0;
  }
  restoreShieldCell(){
    if(!this.alive||this.shield>=this.maxShield)return 0;
    const before=this.shield;
    this.shield=Math.min(this.maxShield,this.shield+this.shieldUnit);
    return this.shield-before;
  }
  startShieldCharge(){
    if(!this.alive||this.shieldCells<=0||this.shield>=this.maxShield||this.shieldCharge>0||this.medkitCharge>0)return false;
    this.shieldCharge=3;return true;
  }
  updateShieldCharge(dt){
    if(this.shieldCharge<=0)return false;
    this.shieldCharge=Math.max(0,this.shieldCharge-dt);if(this.shieldCharge<1e-6)this.shieldCharge=0;
    if(this.shieldCharge===0&&this.shieldCells>0&&this.alive){
      this.backpack.remove('shieldCell');this.restoreShieldCell();this.defenseFX.cell=0.9;return true;
    }
    return false;
  }
  startMedkit(){
    if(!this.alive||this.medkits<=0||this.hp>=this.maxHp||this.medkitCharge>0||this.shieldCharge>0)return false;
    this.medkitCharge=3;return true;
  }
  updateMedkit(dt){
    if(this.medkitCharge<=0)return false;
    this.medkitCharge=Math.max(0,this.medkitCharge-dt);if(this.medkitCharge<1e-6)this.medkitCharge=0;
    if(this.medkitCharge===0&&this.medkits>0&&this.alive){
      this.backpack.remove('medkit');this.heal(this.maxHp*.5);this.defenseFX.heal=1.1;return true;
    }
    return false;
  }
  takeDamage(amount){
    if(!this.alive||this.invulnerable>0||!Number.isFinite(amount)||amount<=0)return false;
    const beforeShield=this.shield;
    const absorbed=Math.min(beforeShield,amount);
    this.shield=Math.max(0,beforeShield-absorbed);
    const healthDamage=Math.max(0,amount-absorbed);
    this.hp=Math.max(0,this.hp-healthDamage);
    this.lastDamageReport={absorbed,healthDamage,shieldBroken:beforeShield>0&&this.shield===0};
    window.__projectZGame?.haptics?.pulse('damage');
    if(absorbed>0)this.defenseFX.shield=.36;
    if(healthDamage>0)this.defenseFX.health=.42;
    if(beforeShield>0&&this.shield===0)this.defenseFX.break=.8;
    // Preserva apenas o intervalo de dano já existente; não adiciona imunidade ao romper o escudo.
    this.invulnerable=COMBAT.player.invulnerability;
    return true;
  }
  draw(ctx,assets){
    // G.3.1.7: Antônio em pixel art 8 direções x 6 poses, escolhidas pela mira.
    // Nenhuma rotação brusca da câmera: só o personagem e a arma giram.
    const spriteSheet=assets.get('survivorSheet');
    const fallback=assets.get('survivor');
    ctx.save();
    ctx.translate(Math.round(this.x),Math.round(this.y));
    if(this.invulnerable>0&&Math.floor(this.invulnerable*16)%2===0)ctx.globalAlpha=.43;
    // Sombra macia presa aos pés, não à orientação da arma.
    ctx.fillStyle='rgba(2,12,14,.40)';
    ctx.beginPath();ctx.ellipse(0,15,16,6,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(2,12,14,.22)';
    ctx.beginPath();ctx.ellipse(1,16,21,8,0,0,Math.PI*2);ctx.fill();
    const walking=this.motion>.08;
    const frame=walking?1+(Math.floor(this.walkTime*.85)%5):0;
    // 0 direita, 1 diagonal inferior direita, 2 baixo, 3 diagonal inf. esquerda,
    // 4 esquerda, 5 diag. superior esquerda, 6 cima, 7 diag. superior direita.
    const dir=((Math.round(this.facing/(Math.PI/4))%8)+8)%8;
    const bob=walking?(frame===2||frame===4?-.65:0):Math.sin(this.idleTime*2.1)*.35;
    // G.3.1.8 — camadas coerentes na visão superior:
    // mirando para o norte, o cano fica À FRENTE (para cima), enquanto
    // as mãos e a base da arma ficam encobertas pelo torso / ombros.
    // Para sul e laterais, a arma fica na camada frontal habitual.
    const aimingNorth=Math.sin(this.facing)<-.23;
    const model=this.progression?.weapon||'pistol';
    const tier=this.progression?.specialBranch==='firearms'?this.progression.specialTier:0;
    const paintGun=()=>{
      ctx.save();ctx.rotate(this.facing);
      // Mãos e arma giram juntas; o projétil parte da ponta correspondente.
      ctx.fillStyle='#34473d';ctx.fillRect(5,-6,10,7);
      ctx.fillStyle='#a98465';ctx.fillRect(12,-3,6,4);
      drawEquippedWeapon(ctx,model,tier);
      ctx.fillStyle='#a98666';ctx.fillRect(9,3,5,4);
      ctx.restore();
    };
    if(aimingNorth)paintGun();
    if(spriteSheet){
      const smoothing=ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(spriteSheet,dir*48,frame*56,48,56,-23,-33+bob,46,54);
      ctx.imageSmoothingEnabled=smoothing;
    }else if(fallback){
      ctx.drawImage(fallback,-23,-33+bob,46,54);
    }else{
      ctx.fillStyle='#657b67';ctx.fillRect(-12,-20,24,32);
    }
    if(!aimingNorth)paintGun();
    ctx.restore();
  }
}

// -- G.3.1.4: quatro armas desenhadas em camadas vetoriais, sem imagens externas. --
// Coordenadas locais (64x48); boca do cano aponta para +X. O mesmo desenho
// alimenta o personagem, a HUD e as opções de evolução.
const WEAPON_VISUALS=Object.freeze({
  pistol:{scale:.72, y:-22, layers:[
    ['M6 20 L14 20 L14 18 L24 18 L24 20 L29 20 L29 29 L20 29 L20 27 L16 27 L16 30 L12 30 L12 27 L7 27 Z','#131d22'],
    ['M9 20 L18 20 L18 25 L10 25 Z','#52626a'],
    ['M17 17 L30 17 L32 19 L32 23 L18 23 Z','#202d35'],
    ['M17 17 L30 17 L29 19 L18 19 Z','#9aaeb0'],
    ['M29 18 L34 18 L34 22 L29 22 Z','#65757a'],
    ['M10 26 L17 26 L15 35 L11 35 Z','#20272b'],
    ['M12 28 L15 28 L14 33 L12 33 Z','#76655a'],
    ['M22 18 L23 18 L23 22 L22 22 Z','#cad2c6']
  ]},
  smg:{scale:.63,y:-23,layers:[
    ['M3 21 L10 21 L10 19 L18 19 L18 17 L34 17 L34 20 L39 20 L39 26 L31 26 L31 29 L17 29 L17 26 L8 26 L8 30 L3 30 Z','#172227'],
    ['M5 23 L11 23 L11 27 L5 27 Z','#475257'],
    ['M15 18 L36 18 L36 23 L15 23 Z','#333e45'],
    ['M18 18 L31 18 L31 20 L18 20 Z','#a1a9a4'],
    ['M24 24 L31 24 L31 28 L24 28 Z','#6e7370'],
    ['M28 28 L34 28 L30 39 L24 39 Z','#1f292e'],
    ['M10 28 L16 28 L18 34 L13 35 Z','#252d30'],
    ['M35 21 L46 21 L46 24 L35 24 Z','#6d7a7f'],
    ['M43 20 L49 20 L49 25 L43 25 Z','#263539'],
    ['M21 21 L24 21 L24 23 L21 23 Z','#d6bd84'],
  ]},
  rifle:{scale:.57,y:-23,layers:[
    ['M1 22 L9 19 L15 20 L17 17 L37 17 L37 19 L49 19 L49 25 L36 25 L36 28 L17 28 L12 26 L8 30 L2 30 Z','#131c22'],
    ['M3 25 L11 21 L14 22 L10 27 L4 28 Z','#5c6b70'],
    ['M17 18 L37 18 L37 26 L17 26 Z','#323f44'],
    ['M18 18 L33 18 L33 20 L18 20 Z','#83989c'],
    ['M25 15 L35 15 L35 17 L25 17 Z','#17282b'],
    ['M28 13 L33 13 L33 15 L28 15 Z','#778989'],
    ['M23 28 L32 28 L30 41 L25 42 Z','#243038'],
    ['M25 30 L29 30 L28 37 L25 38 Z','#687e7d'],
    ['M11 27 L17 27 L20 33 L15 34 Z','#262c32'],
    ['M36 19 L54 19 L54 25 L36 25 Z','#38484f'],
    ['M38 20 L51 20 L51 21 L38 21 Z','#879b9e'],
    ['M49 18 L56 18 L56 26 L49 26 Z','#1e2c33'],
    ['M56 21 L64 21 L64 23 L56 23 Z','#768c90'],
    ['M20 23 L23 23 L23 24 L20 24 Z','#d7c08a']
  ]},
  sniper:{scale:.58,y:-23,layers:[
    ['M1 21 L12 19 L16 18 L42 18 L42 21 L83 21 L83 24 L42 24 L42 28 L16 28 L11 25 L2 26 Z','#17242a'],
    ['M15 19 L44 19 L44 26 L15 26 Z','#45575c'],
    ['M27 16 L46 16 L46 19 L27 19 Z','#161f25'],
    ['M31 13 L48 13 L48 16 L31 16 Z','#7e999c'],
    ['M38 27 L44 27 L41 39 L34 39 Z','#27363a'],
    ['M43 20 L78 20 L78 25 L43 25 Z','#677e82'],
    ['M78 19 L86 19 L86 26 L78 26 Z','#263238'],
    ['M4 20 L14 20 L11 26 L3 26 Z','#63777a']
  ]},
  revolver:{scale:.63,y:-24,layers:[
    ['M4 21 L23 21 L23 17 L39 17 L39 20 L64 20 L64 26 L39 26 L39 29 L23 29 L23 26 L4 26 Z','#323c42'],
    ['M37 21 L63 21 L63 23 L37 23 Z','#aab4ae'],
    ['M21 18 L40 18 L40 29 L21 29 Z','#53656b'],
    ['M24 19 L36 19 L36 28 L24 28 Z','#869a9a'],
    ['M8 23 L21 23 L21 27 L8 27 Z','#75604c'],
    ['M20 28 L30 28 L25 43 L18 43 L15 35 Z','#513b2f'],
    ['M18 34 L23 32 L22 40 L19 40 Z','#b28c65'],
    ['M31 29 L37 29 L33 35 L27 35 Z','#222d30'],
    ['M40 19 L61 19 L61 20 L40 20 Z','#d0c8a8']
  ]},
  shotgun:{scale:.57,y:-24,layers:[
    ['M2 23 L10 20 L19 20 L19 19 L33 19 L33 20 L53 20 L53 28 L32 28 L32 30 L16 30 L10 28 L5 31 L1 30 Z','#1d252a'],
    ['M3 26 L12 22 L17 23 L13 28 L5 29 Z','#78553e'],
    ['M7 25 L14 24 L14 26 L7 28 Z','#b78b59'],
    ['M16 21 L30 21 L30 27 L16 27 Z','#303d43'],
    ['M21 19 L31 19 L31 21 L21 21 Z','#a8aa9f'],
    ['M27 28 L36 28 L34 33 L28 33 Z','#342b29'],
    ['M34 21 L46 21 L46 27 L34 27 Z','#7c5942'],
    ['M35 22 L44 22 L44 23 L35 23 Z','#c09162'],
    ['M45 19 L62 19 L62 23 L45 23 Z','#6d8286'],
    ['M45 24 L62 24 L62 28 L45 28 Z','#3f555d'],
    ['M59 18 L64 18 L64 28 L59 28 Z','#1c3038'],
    ['M59 20 L64 20 L64 21 L59 21 Z','#a5b5b2'],
    ['M57 26 L64 26 L64 27 L57 27 Z','#718a8e'],
    ['M17 26 L18 26 L18 28 L17 28 Z','#d6b58a']
  ]}
});
const WEAPON_VECTOR_CACHE={};
function weaponSvg(id,slot='hud',tier=0){
  const item=WEAPON_VISUALS[id]||WEAPON_VISUALS.pistol;
  const layers=item.layers.map(([d,fill])=>`<path d="${d}" fill="${fill}" stroke="#091318" stroke-opacity=".45" stroke-width=".55" stroke-linejoin="round"/>`).join('')+
    (tier>=2?`<rect x="${id==='pistol'?19:27}" y="12" width="12" height="5" fill="#9faca7"/>`:'')+
    (tier>=3?`<rect x="${id==='pistol'?27:43}" y="20" width="8" height="3" fill="#6e7473"/>`:'');
  return `<svg class="pz-weapon-svg pz-weapon-svg-${slot}" viewBox="0 9 68 35" width="98" height="48" role="img" aria-label="${WEAPONS[id]?.name||'Arma'}" preserveAspectRatio="xMidYMid meet">${layers}</svg>`;
}
// Avanço em pixels até a boca do cano (mesma geometria usada no desenho).
const WEAPON_MUZZLE_LENGTH=Object.freeze({pistol:28,smg:34,rifle:40,shotgun:40,revolver:35,sniper:53});
function weaponMuzzleLength(id){return WEAPON_MUZZLE_LENGTH[id]||28;}
function drawEquippedWeapon(ctx,id,tier=0){
  const item=WEAPON_VISUALS[id]||WEAPON_VISUALS.pistol;
  if(!WEAPON_VECTOR_CACHE[id])WEAPON_VECTOR_CACHE[id]=item.layers.map(([d,fill])=>({path:new Path2D(d),fill}));
  ctx.save();
  // Avatar top-down de 40 px: arma maior, mas proporcional ao corpo.
  ctx.translate(3,item.y*item.scale);
  ctx.scale(item.scale,item.scale);
  for(const layer of WEAPON_VECTOR_CACHE[id]){
    ctx.fillStyle=layer.fill;ctx.fill(layer.path);
    ctx.strokeStyle='rgba(3,13,18,.65)';ctx.lineWidth=.75;ctx.stroke(layer.path);
  }
  if(tier>=2){
    ctx.fillStyle='#28383d';ctx.fillRect(id==='pistol'?19:27,12,12,5);
    ctx.fillStyle='#a4afa7';ctx.fillRect(id==='pistol'?23:31,11,4,2);
  }
  if(tier>=3){
    ctx.fillStyle='#6e7473';ctx.fillRect(id==='pistol'?27:43,20,8,3);
  }
  ctx.restore();
}

