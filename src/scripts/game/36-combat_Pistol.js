// -- src/combat/Pistol.js --




// Curva de dano do cartucho: +50% nos primeiros 115 px; cai suavemente até
// 48% na borda do alcance. Outras armas mantêm o dano fixo por distância.
// Função pura para permitir testes numéricos sem executar a renderização.
function damageAtProjectileDistance(model,baseDamage,travelled){
  if(model!=='shotgun')return baseDamage;
  const near=115,far=370;
  if(travelled<=near)return baseDamage*1.5;
  if(travelled>=far)return baseDamage*.48;
  const factor=(travelled-near)/(far-near);
  return baseDamage*(1.5-(1.5-.48)*factor);
}

// Nome preservado por compatibilidade com a Entrega B. Agora representa uma arma principal evolutiva.
class Pistol {
  constructor(progression=null){
    this.progression=progression;this.model='pistol';this.attachments=new WeaponAttachments();
    this.ammo=WEAPONS.pistol.magazine;this.reserve=60;
    this.cooldown=0;this.reloadRemaining=0;this.projectiles=[];this.flashes=[];this.shots=0;
  }
  get config(){return WEAPONS[this.model];}
  get attachmentSlots(){return this.attachments.slots(this.model);}
  get magazine(){return Math.round(this.config.magazine*(1+.2*(this.progression?.levelOf('backpack')||0))*(this.progression?.specialBranch==='firearms'?1.25:1)*(1+this.attachments.bonus(this.model,'mag')));}
  get damage(){return this.config.damage*(1+.07*(this.progression?.levelOf('sight')||0)+.1*(this.progression?.levelOf('concentrated')||0)+(this.progression?.specialBranch==='firearms'&&this.progression.specialTier>=3?.10:0))*(1+this.attachments.bonus(this.model,'barrel')*.30);}
  get rate(){return Math.min(15,this.config.rate*(1+.08*(this.progression?.levelOf('gloves')||0)+.06*(this.progression?.levelOf('trigger')||0)+(this.progression?.specialBranch==='firearms'&&this.progression.specialTier>=3?.06:0)));}
  get reloadTime(){const tier=this.progression?.specialBranch==='firearms'?this.progression.specialTier:0;return this.config.reload*(tier>=3?.74:tier>=2?.82:tier>=1?.92:1);}
  get spreadFactor(){return (this.progression?.specialBranch==='firearms'&&this.progression.specialTier>=2?.68:1)*(1-this.attachments.bonus(this.model,'stock')*.48);}
  get headshotChance(){return this.attachments.bonus(this.model,'sight')*.29;}
  equipAttachment(slot,tier){
    const oldCapacity=this.magazine;const result=this.attachments.equip(this.model,slot,tier);
    if(result.ok&&slot==='mag')this.ammo=Math.min(this.magazine,this.ammo+Math.max(0,this.magazine-oldCapacity));
    return result;
  }
  get piercing(){return this.model==='sniper'?4:this.config.piercing+(this.progression?.levelOf('piercing')||0);}
  applyUpgrade(item){
    if(item.type==='weapon'&&WEAPONS[item.id]){
      const oldCap=this.magazine;
      const loadedRatio=this.ammo/Math.max(1,oldCap);
      this.model=item.id;this.ammo=Math.min(this.magazine,Math.round(loadedRatio*this.magazine));
      // Q.04: munição universal, troca de arma não altera a reserva.
      this.reserve=Math.min(300,Math.max(0,this.reserve));
      this.reloadRemaining=0;this.cooldown=0;
    }else if(item.id==='survival_firearms_1'){
      this.ammo=Math.min(this.magazine,this.ammo+Math.max(1,Math.round(this.config.magazine*.25)));
    }else if(item.id==='backpack'){
      // Configuração já tem o novo nível; ampliar pente sem criar recarga gratuita infinita.
      this.ammo=Math.min(this.magazine,this.ammo+Math.max(1,Math.round(this.config.magazine*.2)));
    }
  }
  fire(player,onShot,precision=false){
    const w=this.config,face=player.facing;
    const shotId=++this.shots;
    for(let i=0;i<w.pellets;i++){
      // Um cartucho = um disparo, apesar de conter vários chumbos.
      const cone=w.pellets===1?0:(i/(w.pellets-1)-.5)*w.spread*2;
      // E12: 7 chumbos por cano, duas bocas ligeiramente separadas, um gatilho.
      const barrelOffset=w.id==='shotgun'?(i<7?-3.5:3.5):0;
      const jitter=w.pellets===1&&!precision?(Math.random()-.5)*w.spread:0;
      const a=face+(cone+jitter)*this.spreadFactor,vx=Math.cos(a),vy=Math.sin(a);
      const muzzle=weaponMuzzleLength(w.id);
      this.projectiles.push({x:player.x+Math.cos(face)*muzzle-Math.sin(face)*barrelOffset,y:player.y+Math.sin(face)*muzzle+Math.cos(face)*barrelOffset,vx,vy,
        weapon:w.id,shotId,speed:w.speed,life:w.range/w.speed,travelled:0,
        damage:this.damage,penetration:this.piercing,headshotChance:this.headshotChance,hitIds:new Set()});
    }
    const muzzle=weaponMuzzleLength(w.id);
    for(const offset of (w.id==='shotgun'?[-4,4]:[0])){
      this.flashes.push({x:player.x+Math.cos(face)*muzzle-Math.sin(face)*offset,y:player.y+Math.sin(face)*muzzle+Math.cos(face)*offset,
        weapon:w.id,life:w.id==='shotgun'?.16:.085,maxLife:w.id==='shotgun'?.16:.085,angle:face,seed:Math.random()});
    }
    this.ammo--;this.cooldown=1/this.rate;onShot();
  }
  update(dt,player,aim,enemies,onShot=()=>{},onHit=()=>{},spatial=null,precision=false,barrels=null,onBarrelHit=()=>{},onSceneryImpact=null){
    this.cooldown=Math.max(0,this.cooldown-dt);
    if(this.reloadRemaining>0){this.reloadRemaining=Math.max(0,this.reloadRemaining-dt);if(this.reloadRemaining===0){const load=Math.min(this.magazine-this.ammo,this.reserve);this.ammo+=load;this.reserve-=load;}}
    if(aim.active&&Math.hypot(aim.x,aim.y)>.14&&player.alive){
      player.facing=Math.atan2(aim.y,aim.x);
      if(this.reloadRemaining===0&&aim.fire!==false&&this.cooldown===0&&this.ammo>0)this.fire(player,onShot,precision);
    }
    if(this.ammo===0&&this.reloadRemaining===0&&this.reserve>0)this.reloadRemaining=this.reloadTime;
    this.flashes=this.flashes.filter(f=>(f.life-=dt)>0);
    const remaining=[];
    for(const bullet of this.projectiles){
      const nx=bullet.x+bullet.vx*bullet.speed*dt,ny=bullet.y+bullet.vy*bullet.speed*dt;
      const travelled=bullet.travelled+Math.hypot(nx-bullet.x,ny-bullet.y);
      bullet.life-=dt;
      const struckBarrel=barrels?.findSegmentHit(bullet.x,bullet.y,nx,ny);
      if(struckBarrel){onBarrelHit(struckBarrel);continue;}
      // Distância/velocidade/dispersão originais permanecem intactas.
      if(onSceneryImpact ? onSceneryImpact(bullet.x,bullet.y,nx,ny,bullet) : segmentHitsWall(bullet.x,bullet.y,nx,ny,2))continue;
      let collided=false;
      const candidates=spatial?spatial.query((bullet.x+nx)/2,(bullet.y+ny)/2,Math.hypot(nx-bullet.x,ny-bullet.y)/2+38):enemies.slice();
      // Q.03.4: atravessamento em ordem física ao longo do segmento.
      if(bullet.weapon==='sniper')candidates.sort((a,b)=>
        ((a.x-bullet.x)*bullet.vx+(a.y-bullet.y)*bullet.vy)-
        ((b.x-bullet.x)*bullet.vx+(b.y-bullet.y)*bullet.vy));
      for(const target of candidates){
        if(!target.alive||bullet.hitIds.has(target))continue;
        if(!segmentCircleHit(bullet.x,bullet.y,nx,ny,target.x,target.y,target.radius+3))continue;
        bullet.hitIds.add(target);
        const actualDamage=damageAtProjectileDistance(bullet.weapon,bullet.damage,travelled);
        if(bullet.weapon==='sniper')bullet.damage*=.82; // perda de energia por corpo atravessado; máximo de 5 alvos
        // Disparos continuam seguindo a mira original. A mira acessória adiciona apenas
        // chance de crítico; não há aim assist nem alteração da trajetória.
        const headshot=!target.isBoss&&bullet.headshotChance>0&&Math.random()<bullet.headshotChance;
        const zone=target.isBoss?'torso':headshot?'head':pickWoundZone(bullet,target);
        const inflicted=headshot?actualDamage*1.6:actualDamage;
        const died=target.hit(inflicted,{dx:bullet.vx,dy:bullet.vy,zone,headshot});
        // Animação ligada ao ponto de entrada da bala, não ao centro do zumbi.
        onHit(target,died,{
          x:target.x-bullet.vx*Math.min(target.radius*.65,9),
          y:target.y-bullet.vy*Math.min(target.radius*.65,9),
          dx:bullet.vx,dy:bullet.vy,weapon:bullet.weapon,shotId:bullet.shotId,damage:inflicted,headshot,zone
        });
        if(bullet.penetration<=0){collided=true;break;}
        bullet.penetration--;
      }
      if(collided)continue;
      if(bullet.life>0&&nx>0&&ny>0&&nx<GAME.map.width&&ny<GAME.map.height){bullet.x=nx;bullet.y=ny;bullet.travelled=travelled;remaining.push(bullet);}
    }
    this.projectiles=remaining.length>200?remaining.slice(-200):remaining;
  }
  draw(ctx){
    // Quatro silhuetas distintas, legíveis mesmo no mapa pequeno:
    // pistola = traço FINO; SMG = bala REDONDA; rifle = traçante LONGO;
    // escopeta = nove pontinhos dispersos. Sem vibração de câmera.
    ctx.save();ctx.shadowBlur=5;ctx.shadowColor='#f7ce8e';
    for(const b of this.projectiles){
      const angle=Math.atan2(b.vy,b.vx);
      ctx.beginPath();
      switch(b.weapon){
        case 'smg':
          ctx.fillStyle='#ffd783';ctx.arc(b.x,b.y,2.75,0,Math.PI*2);ctx.fill();break;
        case 'rifle':
          ctx.strokeStyle='#fff1ae';ctx.lineWidth=2.4;ctx.lineCap='round';
          ctx.moveTo(b.x-b.vx*10,b.y-b.vy*10);ctx.lineTo(b.x+b.vx*3.5,b.y+b.vy*3.5);ctx.stroke();break;
        case 'shotgun':
          ctx.fillStyle='#f6b36d';ctx.arc(b.x,b.y,1.9,0,Math.PI*2);ctx.fill();break;
        case 'sniper':
          ctx.strokeStyle='#fff5ce';ctx.lineWidth=3.4;ctx.lineCap='round';
          ctx.moveTo(b.x-b.vx*25,b.y-b.vy*25);ctx.lineTo(b.x+b.vx*7,b.y+b.vy*7);ctx.stroke();break;
        case 'revolver':
          ctx.strokeStyle='#ffe7b0';ctx.lineWidth=3.1;ctx.lineCap='round';
          ctx.moveTo(b.x-b.vx*12,b.y-b.vy*12);ctx.lineTo(b.x+b.vx*4,b.y+b.vy*4);ctx.stroke();break;
        default:
          ctx.fillStyle='#fff3c2';ctx.ellipse(b.x,b.y,4.8,1.05,angle,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }
  // C2 · Ártemis: clarões desenhados por cima dos personagens (ver WeaponFeel.js).
  drawFlashes(ctx,dark=0){
    drawShotLights(ctx,this.flashes,dark);
    for(const f of this.flashes)drawMuzzleFlash(ctx,f);
  }
}

// -- G.3.1.6: barris explosivos pelo mapa, com colisão e detonação real. --
const BARREL_CONFIG=Object.freeze({radius:16, blastRadius:104, damage:92, visualLife:.48});
class ExplosiveBarrels {
  constructor(){
    this.barrels=[];this.blasts=[];this.totalExplosions=0;this.totalShotTriggers=0;
    const random=mulberry32(3162026);
    // 5 em cada distrito e dois pequenos pares adicionais, com posições estáveis entre partidas.
    const zones=[
      {x:42,y:42,w:1070,h:1070,count:5},
      {x:1190,y:38,w:1550,h:1075,count:5},
      {x:35,y:1200,w:1065,h:1530,count:5},
      {x:1190,y:1200,w:1550,h:1530,count:5}
    ];
    let id=0;
    for(const zone of zones){
      let count=0;
      for(let attempt=0;attempt<850&&count<zone.count;attempt++){
        const x=Math.round(zone.x+random()*zone.w),y=Math.round(zone.y+random()*zone.h);
        // Respeita prédios, carros e bloqueios já existentes; evita a área de spawn.
        if(!canOccupy(x,y,33,OBSTACLES)||Math.hypot(x-592,y-575)<170)continue;
        if(this.barrels.some(other=>Math.hypot(other.x-x,other.y-y)<175))continue;
        const barrel={id:++id,x,y,radius:BARREL_CONFIG.radius,alive:true,
          collider:{x:x-15,y:y-15,w:30,h:30,barrel:true}};
        this.barrels.push(barrel);count++;
      }
    }
    // Pequenos pares em áreas industriais permitem reações em cadeia naturais.
    for(const region of ['industry','highway']){
      const bases=this.barrels.filter(b=>districtAt(b.x,b.y).id===region);
      let paired=false;
      for(const base of bases){
        for(let k=0;k<24&&!paired;k++){
          const angle=k*Math.PI*2/24,distance=68+(k%3)*7;
          const x=Math.round(base.x+Math.cos(angle)*distance),y=Math.round(base.y+Math.sin(angle)*distance);
          if(districtAt(x,y).id!==region||!canOccupy(x,y,32,OBSTACLES))continue;
          if(this.barrels.some(other=>Math.hypot(other.x-x,other.y-y)<49))continue;
          const barrel={id:++id,x,y,radius:BARREL_CONFIG.radius,alive:true,
            collider:{x:x-15,y:y-15,w:30,h:30,barrel:true}};
          this.barrels.push(barrel);paired=true;
        }
        if(paired)break;
      }
    }
    this.syncCollision();
  }
  syncCollision(){ACTIVE_BARREL_OBSTACLES=this.barrels.filter(b=>b.alive).map(b=>b.collider);}
  // O projétil atinge a superfície circular, sem exigir que acerte o pixel central.
  findSegmentHit(ax,ay,bx,by){
    let best=null,bestT=2;
    const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
    for(const b of this.barrels){
      if(!b.alive)continue;
      const t=len>0?Math.max(0,Math.min(1,((b.x-ax)*dx+(b.y-ay)*dy)/len)):0;
      const px=ax+dx*t,py=ay+dy*t;
      if((px-b.x)**2+(py-b.y)**2>(b.radius+2)**2||t>=bestT)continue;
      // Não detona através de prédios ou veículos sólidos.
      if(segmentHitsStaticWall(ax,ay,px,py,2))continue;
      best=b;bestT=t;
    }
    return best;
  }
  detonate(initial,onBlast=()=>{}){
    if(!initial?.alive)return 0;
    this.totalShotTriggers++;
    const queue=[initial];let count=0;
    while(queue.length&&count<24){
      const barrel=queue.shift();if(!barrel?.alive)continue;
      barrel.alive=false;count++;this.totalExplosions++;
      this.syncCollision();
      this.blasts.push({x:barrel.x,y:barrel.y,radius:BARREL_CONFIG.blastRadius,
        life:BARREL_CONFIG.visualLife,full:BARREL_CONFIG.visualLife});
      if(this.blasts.length>20)this.blasts.shift();
      onBlast(barrel.x,barrel.y,BARREL_CONFIG.blastRadius,BARREL_CONFIG.damage);
      // DECISÃO 6/A: nenhuma reação em cadeia entre barris ou veículos.
    }
    return count;
  }
  update(dt){for(const b of this.blasts)b.life-=dt;this.blasts=this.blasts.filter(b=>b.life>0);}
  drawUnder(ctx,assets,camera){
    const sprite=assets.get('barrel');
    ctx.save();
    for(const b of this.barrels){
      if(!b.alive)continue;
      const at=camera.worldToScreen(b.x,b.y);
      if(at.x< -50||at.y< -50||at.x>camera.viewport.width+50||at.y>camera.viewport.height+50)continue;
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.beginPath();ctx.ellipse(b.x+2,b.y+10,17,8,0,0,Math.PI*2);ctx.fill();
      if(sprite)ctx.drawImage(sprite,b.x-18,b.y-20,36,36);
      else {ctx.fillStyle='#854a3b';ctx.fillRect(b.x-13,b.y-17,26,31);}
      ctx.fillStyle='#a55b40';ctx.fillRect(b.x-10,b.y-10,20,3);
      ctx.fillStyle='#d4a86e';ctx.fillRect(b.x-5,b.y-4,10,3);
      ctx.strokeStyle='#302b29';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.ellipse(b.x,b.y-15,12,4,0,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
  drawOver(ctx){
    ctx.save();
    for(const blast of this.blasts){
      const progress=1-blast.life/blast.full;
      ctx.globalAlpha=Math.max(0,1-progress);
      ctx.fillStyle='rgba(241,155,83,.22)';
      ctx.beginPath();ctx.arc(blast.x,blast.y,blast.radius*(.18+.82*progress),0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffcf86';ctx.lineWidth=5*(1-progress)+1;
      ctx.beginPath();ctx.arc(blast.x,blast.y,blast.radius*(.18+.82*progress),0,Math.PI*2);ctx.stroke();
      for(let i=0;i<12;i++){
        const a=i*2.4+blast.x*.006,dist=blast.radius*progress*(.3+(i%4)*.18);
        ctx.fillStyle=i%3?'#cf7951':'#ffe3a5';
        ctx.fillRect(blast.x+Math.cos(a)*dist,blast.y+Math.sin(a)*dist,3,3);
      }
    }
    ctx.restore();
  }
}

// R12: carros originalmente em chamas no mapa (posição e escala preservadas).
// Estes incêndios são ambientais/persistentes até que o veículo seja destruído;
// após um tiro fatal passa a valer SOMENTE a animação R11 de 8 segundos.
const B2_INITIAL_BURNING_VEHICLES=Object.freeze([
  Object.freeze({x:879,y:683,scale:1.15}),
  Object.freeze({x:697,y:304,scale:.92}),
  Object.freeze({x:1637,y:903,scale:1}),
  Object.freeze({x:979,y:1644,scale:1.06}),
  Object.freeze({x:2184,y:2106,scale:1}),
]);
// BLOCO 2 / HEFESTO: destruição baseada nos objetos já existentes da FIX.1.
// HÉSTIA: NÃO altera edifícios, objetos urbanos menores, chefes ou o desenho original.
const B2_CENTRAL_BARRIERS=Object.freeze([[315,315,60,21],[910,350,55,18],[58,1039,130,24],[918,1011,93,30]]);
const B2_CENTRAL_SMALL_CRATES=Object.freeze([[344,278],[779,270],[275,804],[782,1035],[748,747]]);
const B2_CENTRAL_SPRITE_CRATES=Object.freeze([[781,808],[309,775],[785,830]]);
const B2_CENTRAL_SPRITE_CARS=Object.freeze([
 ['carCoral',464,279,.06],['carTeal',697,304,-.18],['carAmber',490,853,.27],
 ['carTeal',690,962,-.2],['carCoral',879,683,Math.PI/2],['carAmber',269,653,Math.PI/2],
 ['carTeal',310,556,Math.PI/2],['carCoral',782,573,Math.PI/2]
]);
function b2SegmentEntry(ax,ay,bx,by,rect,padding=1){
  if(rect.carShape){
    const z=rect.carShape,c=Math.cos(z.angle),s=Math.sin(z.angle);
    const local=(x,y)=>{const dx=x-z.cx,dy=y-z.cy;return [dx*c+dy*s,-dx*s+dy*c];};
    const [x0,y0]=local(ax,ay),[x1,y1]=local(bx,by);
    return b2SegmentEntry(x0,y0,x1,y1,{x:-z.halfW,y:-z.halfH,w:2*z.halfW,h:2*z.halfH},padding);
  }
  let a=0,b=1;
  const dx=bx-ax,dy=by-ay;
  for(const [p,q] of [[-dx,ax-rect.x+padding],[dx,rect.x+rect.w+padding-ax],[-dy,ay-rect.y+padding],[dy,rect.y+rect.h+padding-ay]]){
    if(Math.abs(p)<1e-9){if(q<0)return null;continue;}
    const t=q/p;
    if(p<0){a=Math.max(a,t);if(a>b)return null;}
    else{b=Math.min(b,t);if(a>b)return null;}
  }
  return a;
}
class WorldDestruction {
  constructor(run){
    this.run=run;this.objects=[];this.byCollider=new Map();this.destructions=0;this.explodedCars=0;
    this.drops=0;this.rejected=0;
    const locate=(box)=>OBSTACLES.find(o=>o.x===box.x&&o.y===box.y&&o.w===box.w&&o.h===box.h)||null;
    const add=(kind,visual,rect,hp,collider=null)=>{
      const o={id:this.objects.length+1,kind,visual,rect,hp,maxHp:hp,collider,alive:true,exploded:false,damageFlash:0};
      if(collider){collider.destroyed=false;this.byCollider.set(collider,o);}
      this.objects.push(o);return o;
    };
    for(const [x,y,w,h] of B2_CENTRAL_BARRIERS){const rect={x,y,w,h};add('barrier',{kind:'centerBarrier'},rect,52,locate(rect));}
    for(const [x,y] of B2_CENTRAL_SMALL_CRATES){
      const rect={x,y,w:22,h:22};const collider=nearbyObstacles(x,y,x+22,y+22).find(c=>c.x<=x+4&&c.y<=y+4&&c.x+c.w>=x+18&&c.y+c.h>=y+18&&!this.byCollider.has(c));
      if(collider)collider.carShape=visibleCarFootprint(x+11,y+11,0,11,11);
      add('crate',{kind:'smallBox'},rect,24,collider||null);
    }
    for(const [x,y] of B2_CENTRAL_SPRITE_CRATES)add('crate',{kind:'spriteBox',x,y},{x:x-18,y:y-18,w:36,h:36},24,null);
    for(const p of DISTRICT_PROPS){if(p.type==='garden')continue;
      const rect={x:p.x,y:p.y,w:p.w,h:p.h};const kind=p.type==='container'?'crate':p.type==='barrier'?'barrier':'vehicle';
      add(kind,{kind:'district',prop:p},rect,kind==='vehicle'?142:kind==='barrier'?55:80,locate(rect));
    }
    for(let i=0;i<ABANDONED_VEHICLES.length;i++){
      const v=ABANDONED_VEHICLES[i],rect={x:v.x-v.w/2,y:v.y-v.h/2,w:v.w,h:v.h};
      add('vehicle',{kind:'civilian',v},rect,155,ABANDONED_CAR_OBSTACLES[i]);
    }
    for(const [sprite,x,y,angle] of B2_CENTRAL_SPRITE_CARS){
      // Reutiliza precisamente o obstáculo original de cada carro, sem criar colisões novas.
      const collider=OBSTACLES.filter(o=>!this.byCollider.has(o)&&o.w<=112&&o.h<=112)
        .filter(o=>Math.hypot(o.x+o.w/2-x,o.y+o.h/2-y)<22)
        .sort((a,b)=>Math.hypot(a.x+a.w/2-x,a.y+a.h/2-y)-Math.hypot(b.x+b.w/2-x,b.y+b.h/2-y))[0]||null;
      const shape=visibleCarFootprint(x,y,angle,20.5,42); // sprite alfa (24x50)*1.65, margem mínima
      if(collider)collider.carShape=shape;
      add('vehicle',{kind:'spriteCar',sprite,x,y,angle},{x:x-45,y:y-50,w:90,h:100},155,collider);

    }
    const police={x:523,y:694,w:96,h:59};
    add('vehicle',{kind:'emergency',type:'police',x:571,y:726,rotation:Math.PI/2,scale:1.58},police,155,locate(police));
    // R12: pontos originais de incêndio passam a usar EXATAMENTE o sistema R11.
    // Ligação com veículo evita fogo ambiental eterno depois da explosão.
    this.initialBurningCars=B2_INITIAL_BURNING_VEHICLES.map((site,i)=>{
      let vehicle=null,nearest=Infinity;
      for(const o of this.objects){
        if(o.kind!=='vehicle')continue;
        const cx=o.rect.x+o.rect.w/2,cy=o.rect.y+o.rect.h/2;
        const dist=Math.hypot(cx-site.x,cy-site.y);
        if(dist<nearest){nearest=dist;vehicle=o;}
      }
      if(nearest>95)vehicle=null;
      // Mesmo tamanho e as mesmas três posições relativas do incêndio R11.
      const w=vehicle?.rect.w||90,h=vehicle?.rect.h||100;
      return {x:site.x,y:site.y,scale:site.scale,vehicle,
        fires:vehicleFireSourcesR11(site.x,site.y,w,h,(i+1)*2.13,site.scale)};
    });
  }
  damage(o,amount,{explosive=false}={}){
    if(!o||!o.alive||amount<=0||!Number.isFinite(amount))return false;
    o.hp=Math.max(0,o.hp-amount);o.damageFlash=o.kind==='vehicle'?0:.17;
    if(o.hp>0)return false;
    o.alive=false;this.destructions++;
    if(o.kind==='vehicle'){
      o.exploded=true;this.explodedCars++;
      o.burnDuration=8;o.burnTime=8; // Fogo EXATAMENTE visual, sem dano extra.
      // Veículo vira carcaça: não remove o colisor e não abre passagem.
      this.run.effects.emitDebris(o.rect.x+o.rect.w/2,o.rect.y+o.rect.h/2,1.5);
      this.run.effects.emit(o.rect.x+o.rect.w/2,o.rect.y+o.rect.h/2,'boss',18);
      this.onVehicleBlast?.(o);
    }else{
      if(o.collider)o.collider.destroyed=true;
      this.run.effects.emitDebris(o.rect.x+o.rect.w/2,o.rect.y+o.rect.h/2,o.kind==='crate'?1:1.25);
      if(o.kind==='crate' && o.id%3===0){
        // Usa o loot original, com coleta original e sem gerar acessórios antecipadamente.
        const x=o.rect.x+o.rect.w/2,y=o.rect.y+o.rect.h/2;
        for(const [ox,oy] of [[0,0],[24,0],[-24,0],[0,24],[0,-24]]){
          if(this.run.loot.add((o.id%2)?'heart':'ammo',x+ox,y+oy)){this.drops++;break;}
        }
      }
      // Obstáculos destruídos deixam de bloquear imediatamente o sistema de navegação.
      if(this.run.navigation?.rebuild)this.run.navigation.rebuild(this.run.player);
    }
    return true;
  }
  projectile(ax,ay,bx,by,bullet){
    const minX=Math.min(ax,bx)-4,minY=Math.min(ay,by)-4,maxX=Math.max(ax,bx)+4,maxY=Math.max(ay,by)+4;
    let first=null,bestT=Infinity;
    for(const collider of nearbyObstacles(minX,minY,maxX,maxY)){
      if(collider.barrel)continue;
      const t=b2SegmentEntry(ax,ay,bx,by,collider,2);
      if(t!==null&&t<bestT){bestT=t;first=this.byCollider.get(collider)||null;}
    }
    // Caixas decorativas e carros ilustrados tinham apenas geometria visual.
    for(const o of this.objects){if(!o.alive||o.collider)continue;
      if(o.rect.x>maxX||o.rect.y>maxY||o.rect.x+o.rect.w<minX||o.rect.y+o.rect.h<minY)continue;
      const t=b2SegmentEntry(ax,ay,bx,by,o.rect,2);
      if(t!==null&&t<bestT){bestT=t;first=o;}
    }
    if(bestT===Infinity)return false;
    if(first)this.damage(first,Math.max(1,bullet.damage));
    return true;
  }
  blast(x,y,radius,damage){
    // DECISÃO 6/A: explosões destroem caixas e barricadas, MAS não detonam veículos nem barris.
    for(const o of this.objects){if(!o.alive||o.kind==='vehicle')continue;
      const px=Math.max(o.rect.x,Math.min(x,o.rect.x+o.rect.w)),py=Math.max(o.rect.y,Math.min(y,o.rect.y+o.rect.h));
      const dist=Math.hypot(x-px,y-py);
      if(dist>radius)continue;
      this.damage(o,damage*(1-.6*dist/Math.max(radius,1)),{explosive:true});
    }
  }
  update(dt){
    for(const o of this.objects){
      o.damageFlash=Math.max(0,o.damageFlash-dt);
      if(o.kind==='vehicle'&&o.exploded&&o.burnTime>0){const remaining=o.burnTime-dt;o.burnTime=remaining<1e-6?0:remaining;}
    }
  }
  drawBurningVehicle(ctx,o,camera){
    // R11: o mesmo fogo da área externa aparece SOBRE a carcaça por 8 segundos.
    // Sem colisões novas, dano contínuo ou efeitos sobre o restante do mapa.
    if(o.burnTime<=0)return;
    const p=o.rect,cx=p.x+p.w/2,cy=p.y+p.h/2;
    const visible=camera.worldToScreen(cx,cy);
    if(visible.x<-180||visible.y<-180||visible.x>camera.viewport.width+180||visible.y>camera.viewport.height+180)return;
    const t=this.run.elapsed;
    // R12: compartilha a composição, idêntica à aprovada na R11.
    const fires=vehicleFireSourcesR11(cx,cy,p.w,p.h,o.id*.73);
    // Dissipa apenas no último quarto de segundo; encerra EXATAMENTE ao completar 8s.
    const alpha=Math.min(1,o.burnTime/.25);
    ctx.save();ctx.globalAlpha*=alpha;
    drawWorldBorderFireFX(ctx,fires,t);
    ctx.restore();
  }
  paintOriginalObject(target,o,assets){
    const p=o.rect,v=o.visual;
      if(v.kind==='centerBarrier'){
        r(target,p.x+4,p.y+5,p.w,p.h,'#182930');r(target,p.x,p.y,p.w,p.h,'#a66b65');
        for(let q=8;q<p.w-8;q+=13)r(target,p.x+q,p.y+3,5,p.h-6,'#77494d');
        r(target,p.x,p.y,p.w,3,'#db8e79');
      }else if(v.kind==='smallBox'){
        r(target,p.x,p.y,22,22,'#a37856');r(target,p.x+3,p.y+3,16,16,'#be9266');
        line(target,[[p.x+3,p.y+3],[p.x+19,p.y+19]],'#755a47',2);
      }else if(v.kind==='spriteBox'){
        const img=assets.get('crate');if(img)target.drawImage(img,v.x-img.width/2,v.y-img.height/2,img.width*1.1,img.height*1.1);
      }else if(v.kind==='district'){
        const d=v.prop;
        r(target,p.x+6,p.y+8,p.w,p.h,'#111215');
        r(target,p.x,p.y,p.w,p.h,d.type==='container'?'#815352':d.type==='vehicle'?'#56636b':'#746969');
        r(target,p.x+5,p.y+5,p.w-10,5,d.type==='container'?'#ad7770':'#9b9491');
        for(let i=13;i<p.w-7;i+=16)r(target,p.x+i,p.y+7,3,p.h-14,'#272b31');
        if(d.type==='vehicle' && d.x===982)emergencyVehicle(target,979,1644,{type:'ambulance',rotation:Math.PI/2,scale:1.58});
        if(d.type==='vehicle' && d.x===2185)emergencyVehicle(target,2184,2106,{type:'fire',rotation:Math.PI/2,scale:1.66});
      }else if(v.kind==='civilian')civilianCar(target,v.v.x,v.v.y,v.v);
      else if(v.kind==='spriteCar')car(target,assets.get(v.sprite),v.x,v.y,v.angle,1.65);
      else if(v.kind==='emergency')emergencyVehicle(target,v.x,v.y,{type:v.type,rotation:v.rotation,scale:v.scale});
  }
  draw(ctx,assets,camera){
    ctx.save();
    for(const o of this.objects){
      const p=o.rect,cameraX=p.x+p.w/2,cameraY=p.y+p.h/2;
      const at=camera.worldToScreen(cameraX,cameraY);
      if(at.x<-130||at.x>camera.viewport.width+130||at.y<-130||at.y>camera.viewport.height+130)continue;
      if(!o.alive&&!o.exploded)continue;
      if(o.kind==='vehicle'&&o.exploded){
        // Texture queimado é gerada uma vez em canvas pequeno e reutilizada no mapa.
        // Evita filtros sobre o canvas inteiro (queda de FPS em certas GPUs).
        if(!o.burntTexture){
          const c=document.createElement('canvas');c.width=280;c.height=280;
          const t=c.getContext('2d');
          t.imageSmoothingEnabled=false;
          t.translate(140-p.x-p.w/2,140-p.y-p.h/2);
          t.filter='brightness(0.41) saturate(0.65) contrast(1.04)';
          this.paintOriginalObject(t,o,assets);
          o.burntTexture=c;
        }
        ctx.drawImage(o.burntTexture,p.x+p.w/2-140,p.y+p.h/2-140);
        if(o.burnTime>0)this.drawBurningVehicle(ctx,o,camera);
      }else{
        this.paintOriginalObject(ctx,o,assets);
      }
      // Sem flash retangular, caixa brilhante ou marca X nos carros.
      if(o.kind!=='vehicle'&&o.damageFlash>0){
        ctx.save();ctx.globalAlpha=o.damageFlash*.6;
        ctx.fillStyle='#ffe8b9';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.restore();
      }
    }
    // Ferramenta de QA: abra ?collision=1 para ver somente o encaixe dos hitboxes dos veículos.
    if(typeof location!=='undefined' && new URLSearchParams(location.search).has('collision')){
      ctx.save();ctx.strokeStyle='#5de6be';ctx.lineWidth=1.2;
      for(const o of this.objects){if(!o.collider?.carShape)continue;
        const a=o.collider.carShape;
        ctx.save();ctx.translate(a.cx,a.cy);ctx.rotate(a.angle);
        ctx.strokeRect(-a.halfW,-a.halfH,a.halfW*2,a.halfH*2);ctx.restore();
      }
      ctx.restore();
    }
    // R12: incêndios preexistentes agora são animados com o renderizador R11.
    // Ao destruir um desses carros, somente o seu fogo temporário de 8s aparece.
    const t=(this.run?.elapsed??performance.now()*.001);
    for(const site of this.initialBurningCars){
      if(site.vehicle?.exploded)continue;
      const pos=camera.worldToScreen(site.x,site.y);
      if(pos.x<-220||pos.y<-220||pos.x>camera.viewport.width+220||pos.y>camera.viewport.height+220)continue;
      drawWorldBorderFireFX(ctx,site.fires,t);
    }
    ctx.restore();
  }
  clear(){for(const o of this.objects)if(o.collider)delete o.collider.destroyed;}
}
// -- G.3.1.5: equipamentos reais, sem poderes. Três estágios, um ramo por partida. --
class SurvivalGear {
  constructor(progress){this.progress=progress;this.traps=[];this.placeTimer=2.3;this.meleeTimer=0;this.attackFX=[];this.blastFX=[];this.totalTriggers=0;this.totalMelee=0;}
  get tier(){return this.progress.specialTier||0;}
  get branch(){return this.progress.specialBranch;}
  onUpgrade(){this.placeTimer=Math.min(this.placeTimer,1.25);this.meleeTimer=Math.min(this.meleeTimer,.3);if(this.branch==='traps')this.traps=[];}
  update(dt,run,callbacks={}){
    if(dt<=0||!run?.player?.alive)return;
    const player=run.player,enemies=run.enemies;
    this.placeTimer=Math.max(0,this.placeTimer-dt);this.meleeTimer=Math.max(0,this.meleeTimer-dt);
    this.attackFX=this.attackFX.filter(x=>(x.life-=dt)>0);
    this.blastFX=this.blastFX.filter(x=>(x.life-=dt)>0);
    for(const trap of this.traps)trap.life-=dt;
    this.traps=this.traps.filter(t=>t.life>0);
    if(this.branch==='traps'&&this.tier>0){
      const cooldown=this.tier===1?5.8:this.tier===2?8.3:9;
      if(this.placeTimer<=0){
        const offset=27,x=player.x-Math.cos(player.facing)*offset,y=player.y-Math.sin(player.facing)*offset;
        if(canOccupy(x,y,12)){
          this.traps.push({x,y,life:this.tier===1?22:24,tier:this.tier,armed:0.25});
          if(this.traps.length>(this.tier===1?5:3))this.traps.shift();
          this.placeTimer=cooldown;
        }else this.placeTimer=.5;
      }
      for(const trap of this.traps){
        trap.armed-=dt;
        if(trap.armed>0||trap.life<=0)continue;
        const victim=enemies.find(e=>e.alive&&!e.isBoss&&Math.hypot(e.x-trap.x,e.y-trap.y)<e.radius+(trap.tier===1?13:23));
        if(!victim)continue;
        trap.life=0;this.totalTriggers++;
        if(trap.tier===1){
          const died=victim.hit(16,{dx:victim.x-trap.x||1,dy:victim.y-trap.y||0});
          victim.hitStun=Math.max(victim.hitStun,.18);
          callbacks.onHit?.(victim,died,'trap');
          this.blastFX.push({x:trap.x,y:trap.y,radius:18,life:.20,full:.20,kind:'small'});
        }else{
          const radius=trap.tier===2?74:103,damage=trap.tier===2?68:94;
          this.blastFX.push({x:trap.x,y:trap.y,radius,life:.42,full:.42,kind:'blast'});
          callbacks.onExplode?.(trap.x,trap.y,radius);
          for(const e of enemies){
            if(!e.alive)continue;
            const dist=Math.hypot(e.x-trap.x,e.y-trap.y);
            if(dist>radius+e.radius||segmentHitsWall(trap.x,trap.y,e.x,e.y,3))continue;
            const hitDamage=damage*(1-.37*Math.min(1,dist/Math.max(1,radius)));
            const died=e.hit(hitDamage,{dx:e.x-trap.x||1,dy:e.y-trap.y||0});
            if(trap.tier>=3&&!e.isBoss)e.hitStun=Math.max(e.hitStun,.21);
            callbacks.onHit?.(e,died,'explosive');
          }
        }
      }
      this.traps=this.traps.filter(t=>t.life>0);
    }
    if(this.branch==='melee'&&this.tier>0&&this.meleeTimer<=0){
      const range=this.tier===1?48:this.tier===2?73:78;
      const count=this.tier===1?1:this.tier===2?2:3;
      const candidates=enemies.filter(e=>e.alive&&!e.isBoss&&Math.hypot(e.x-player.x,e.y-player.y)<range+e.radius&&!segmentHitsWall(player.x,player.y,e.x,e.y,2))
        .sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));
      if(candidates.length){
        let hits=0;
        for(const e of candidates){
          const angle=Math.atan2(e.y-player.y,e.x-player.x);
          if(hits>0&&Math.cos(angle-player.facing)<-.16)continue;
          const died=e.hit(this.tier===1?17:this.tier===2?29:53,{dx:e.x-player.x,dy:e.y-player.y});
          if(this.tier>=2&&!e.isBoss)e.hitStun=Math.max(e.hitStun,.11);
          callbacks.onHit?.(e,died,'melee');hits++;
          if(hits>=count)break;
        }
        if(hits){
          this.totalMelee+=hits;
          this.meleeTimer=this.tier===1?.94:this.tier===2?1.25:1.52;
          this.attackFX.push({x:player.x,y:player.y,angle:Math.atan2(candidates[0].y-player.y,candidates[0].x-player.x),tier:this.tier,life:.22,full:.22});
          callbacks.onSwing?.(this.tier);
        }
      }
    }
  }
  drawUnder(ctx){
    for(const t of this.traps){
      ctx.save();ctx.translate(t.x,t.y);
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,6,14,7,0,0,Math.PI*2);ctx.fill();
      if(t.tier===1){
        ctx.fillStyle='#2e3434';ctx.fillRect(-11,-6,22,12);
        ctx.strokeStyle='#a0a19a';ctx.lineWidth=2;ctx.strokeRect(-10,-5,20,10);
        ctx.strokeStyle='#b36f4b';for(let i=-6;i<=6;i+=6){ctx.beginPath();ctx.moveTo(i,-3);ctx.lineTo(i+3,3);ctx.stroke();}
      }else{
        ctx.fillStyle='#22292c';ctx.fillRect(-12,-8,24,16);
        ctx.strokeStyle=t.tier===3?'#f0aa72':'#a4a5a1';ctx.lineWidth=2;ctx.strokeRect(-10,-6,20,12);
        ctx.fillStyle='#b65d52';ctx.fillRect(-3,-2,6,4);
        if(t.tier===3){ctx.strokeStyle='#e2bd7f';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.stroke();}
      }
      ctx.restore();
    }
  }
  drawOver(ctx){
    ctx.save();
    for(const a of this.attackFX){
      const alpha=Math.max(0,a.life/a.full);ctx.globalAlpha=alpha*.85;
      ctx.strokeStyle=a.tier===1?'#d3d3b9':a.tier===2?'#dbbd8e':'#f0d5a9';
      ctx.lineWidth=a.tier===1?3:a.tier===2?5:7;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(a.x,a.y,a.tier===1?30:a.tier===2?53:59,a.angle-.75,a.angle+.65);ctx.stroke();
      ctx.save();ctx.translate(a.x+Math.cos(a.angle)*20,a.y+Math.sin(a.angle)*20);ctx.rotate(a.angle);
      ctx.fillStyle='#795b3e';ctx.fillRect(0,-2,a.tier===1?12:a.tier===2?31:27,4);
      ctx.fillStyle='#9fabb0';ctx.fillRect(a.tier===1?12:a.tier===2?32:28,-(a.tier===3?8:4),a.tier===1?8:a.tier===2?4:13,a.tier===3?16:8);
      ctx.restore();
    }
    for(const b of this.blastFX){
      const ratio=b.life/b.full;
      ctx.globalAlpha=Math.max(0,ratio)*.65;
      ctx.strokeStyle=b.kind==='small'?'#b96e57':'#ffc58c';ctx.lineWidth=b.kind==='small'?2:5*ratio+1;
      ctx.beginPath();ctx.arc(b.x,b.y,b.radius*(1-ratio*.85),0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
}

