// -- R51 · ÚLTIMA CARTADA (Hermes = movimento, Ares = infectados) --
// Movimento: inércia curta (arranque e freada suaves, virada rápida), corrida com fôlego (SHIFT / L3 /
// analógico no talo) e esquiva com invencibilidade curta (Q / botão direito / R3 / botão ESQUIVA no celular),
// uma por personagem: Antônio rola, Hadassa dá um passo lateral, Hanna desliza, San esquiva de boxe e empurra.
// Infectados: cada um anda de um jeito (ritmo, cambaleio, tranco), o golpe tem preparo (dá para fugir ou
// esquivar), o corredor dá o bote (agacha, pula, se recupera) e tiro forte derruba (cai e levanta).
// Sem tremor de tela. window.__PZ_NO_ULTIMA=true volta ao jeito antigo (movimento e infectados).
const UC_DODGE=Object.freeze({
  antonio:{name:'ROLAMENTO',dist:104,time:.30,iframes:.26,cd:.55,cost:30,stamina:100,regen:24},
  hadassa:{name:'PASSO LATERAL',dist:90,time:.22,iframes:.21,cd:.40,cost:24,stamina:100,regen:30},
  hanna:{name:'DESLIZE',dist:122,time:.34,iframes:.27,cd:.60,cost:28,stamina:92,regen:27},
  san:{name:'ESQUIVA DE BOXE',dist:84,time:.24,iframes:.23,cd:.60,cost:30,stamina:120,regen:26,shove:true},
});
const UC_SPRINT=1.32,UC_SPRINT_DRAIN=21,UC_WIND=Object.freeze({normal:.30,runner:.17,tank:.42,summoner:.30});
const UC_KD=1.15; // derrubado: cai (0–.45), fica no chão (.45–.65), levanta (.65–1.15)
const ucOff=()=>!!window.__PZ_NO_ULTIMA;
const ucDust=[];

// ---------------- Jogador ----------------
function ucInit(p){
  const d=UC_DODGE[p.charId]||UC_DODGE.antonio;
  p._uc={vx:0,vy:0,stamina:d.stamina,staminaMax:d.stamina,rest:0,sprinting:false,tired:false,full:1,
    dodge:null,cd:0,iframes:0,req:0,fullPush:0,padIdle:0,ghosts:[],perfect:0,perfectShown:false,spec:d};
  return p._uc;
}
const _ucPlayerMove=Player.prototype.move;
Player.prototype.move=function(axis,dt){
  if(ucOff())return _ucPlayerMove.call(this,axis,dt);
  const u=this._uc&&this._uc.spec===(UC_DODGE[this.charId]||UC_DODGE.antonio)?this._uc:ucInit(this);
  this.idleTime+=dt;
  const len=Math.hypot(axis.x,axis.y),power=Math.min(1,len);
  const g=window.__projectZGame,r=g?.scenes?.current?.run;
  u.cd=Math.max(0,u.cd-dt);u.iframes=Math.max(0,u.iframes-dt);u.req=Math.max(0,u.req-dt);u.perfect=Math.max(0,u.perfect-dt);
  for(const gh of u.ghosts)gh.t-=dt;while(u.ghosts.length&&u.ghosts[0].t<=0)u.ghosts.shift();
  // pedido de esquiva guardado por 0,15 s (apertar um pouco antes ainda vale)
  if(u.req>0&&!u.dodge&&u.cd<=0&&u.stamina>=u.spec.cost*.5&&this.alive){
    let dx=len>.2?axis.x/len:Math.cos(this.facing),dy=len>.2?axis.y/len:Math.sin(this.facing);
    u.dodge={t:0,dx,dy,shoved:new Set()};u.req=0;u.cd=u.spec.cd+u.spec.time;u.iframes=u.spec.iframes;
    u.stamina=Math.max(0,u.stamina-u.spec.cost);u.rest=.7;u.perfectShown=false;
    g?.audio?.ucWhoosh?.(this.charId);
    for(let i=0;i<5;i++)ucDust.push({x:this.x-dx*6+(Math.random()-.5)*14,y:this.y+10+(Math.random()-.5)*6,vx:-dx*(30+Math.random()*40),vy:-dy*(30+Math.random()*40),t:0,life:.45+Math.random()*.25,s:5+Math.random()*5});
  }
  if(u.dodge){
    const D=u.dodge,T=u.spec.time,p0=Math.min(1,D.t/T);D.t+=dt;const p1=Math.min(1,D.t/T);
    const ease=p=>1-(1-p)*(1-p);
    const step=u.spec.dist*(ease(p1)-ease(p0));
    const pos=slideCircle(this.x,this.y,D.dx*step,D.dy*step,this.radius);
    this.x=pos.x;this.y=pos.y;this.walkTime+=dt*22;this.motion=1;
    if(Math.random()<dt*40)u.ghosts.push({x:this.x,y:this.y,t:.18,f:this.facing});
    if(Math.random()<dt*25)ucDust.push({x:this.x+(Math.random()-.5)*10,y:this.y+11,vx:-D.dx*20,vy:-D.dy*20,t:0,life:.35,s:4+Math.random()*3});
    if(p1>=1){const sp=this.speed*.55*Math.min(1,power+.4);u.vx=D.dx*sp;u.vy=D.dy*sp;u.dodge=null;}
  }else{
    // corrida: teclado (segurar), controle (L3 liga até parar), celular (analógico no talo por 0,25 s)
    const keys=g?.scenes?.current?.input?.keys;
    const touch=g?.controlMode==='touch';
    u.fullPush=power>.93?u.fullPush+dt:0;
    if(power<.2){u.padIdle+=dt;if(u.padIdle>.45)this.padSprint=false;}else u.padIdle=0;
    const want=!!(keys&&keys.has(keyFor('sprint')))||(touch&&u.fullPush>.25)||(!!this.padSprint&&g?.controlMode==='pad');
    const shooting=(r?.aimHold||0)>0;
    if(u.stamina<=0)u.tired=true;else if(u.stamina>u.staminaMax*.3)u.tired=false;
    u.sprinting=want&&power>.35&&!shooting&&!u.tired&&this.medkitCharge<=0&&this.shieldCharge<=0;
    const top=this.speed*(u.sprinting?UC_SPRINT:1)*power;
    const tx=len>.001?axis.x/len*top:0,ty=len>.001?axis.y/len*top:0;
    // arranque rápido, freada um pouco mais longa, virada para trás quase na hora
    const cur=Math.hypot(u.vx,u.vy),dot=cur>1&&top>1?(u.vx*tx+u.vy*ty)/(cur*top):1;
    const k=dot<-.2?34:top>cur?20:15;
    const a=1-Math.exp(-k*dt);u.vx+=(tx-u.vx)*a;u.vy+=(ty-u.vy)*a;
    if(Math.hypot(u.vx,u.vy)<2&&top===0){u.vx=0;u.vy=0;}
    if(u.vx||u.vy){
      const ox=this.x,oy=this.y,pos=slideCircle(this.x,this.y,u.vx*dt,u.vy*dt,this.radius);
      this.x=pos.x;this.y=pos.y;
      if(dt>0){u.vx=(this.x-ox)/dt;u.vy=(this.y-oy)/dt;}// bateu na parede: perde a velocidade daquele lado
    }
    const v=Math.hypot(u.vx,u.vy),base=Math.max(1,this.speed);
    this.motion=Math.min(1,v/base);
    if(this.motion>.02)this.walkTime+=dt*10*Math.min(1.45,v/base);else this.motion=0;
    if(u.sprinting&&v>base*.6){u.stamina=Math.max(0,u.stamina-UC_SPRINT_DRAIN*dt);u.rest=.6;}
  }
  u.rest=Math.max(0,u.rest-dt);
  if(u.rest<=0&&!u.dodge)u.stamina=Math.min(u.staminaMax,u.stamina+u.spec.regen*dt);
  u.full=u.stamina>=u.staminaMax?Math.max(0,u.full-dt):1;
  this._ucVX=u.vx;this._ucVY=u.vy;
  this.invulnerable=Math.max(0,this.invulnerable-dt);
};
const _ucPlayerDraw=Player.prototype.draw;
Player.prototype.draw=function(ctx,assets){
  const u=this._uc;
  if(ucOff()||!u||ctx.__ucGhost)return _ucPlayerDraw.call(this,ctx,assets);
  // rastro da esquiva: cópias do próprio desenho, transparentes, nos lugares por onde passou
  if(u.ghosts.length){
    const ox=this.x,oy=this.y,inv=this.invulnerable;this.invulnerable=0;ctx.__ucGhost=true;
    try{for(const gh of u.ghosts){ctx.save();ctx.globalAlpha*=Math.max(0,gh.t/.18)*.32;
      const dx=gh.x-ox,dy=gh.y-oy;ctx.translate(dx,dy);_ucPlayerDraw.call(this,ctx,assets);ctx.restore();}}
    finally{ctx.__ucGhost=false;this.invulnerable=inv;}
  }
  const D=u.dodge;
  if(D){
    // corpo abaixa e inclina para o lado da esquiva (o rolamento achata mais)
    const p=Math.min(1,D.t/u.spec.time),k=Math.sin(p*Math.PI);
    const fy=this.y+14;const squash=this.charId==='antonio'?.22:this.charId==='hanna'?.28:.12;
    ctx.save();ctx.translate(this.x,fy);ctx.transform(1,0,D.dx*.35*k,1,0,0);ctx.scale(1+squash*.4*k,1-squash*k);ctx.translate(-this.x,-fy);
    _ucPlayerDraw.call(this,ctx,assets);ctx.restore();
  }else _ucPlayerDraw.call(this,ctx,assets);
  // fôlego: arco fino nos pés, some quando está cheio
  if(u.full>0&&this.alive){
    const f=u.stamina/u.staminaMax,alpha=Math.min(1,u.full/.5)*.85;
    ctx.save();ctx.globalAlpha*=alpha;ctx.lineCap='round';
    ctx.strokeStyle='rgba(8,14,16,.55)';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(this.x,this.y+15,19,8,0,Math.PI*.15,Math.PI*.85);ctx.stroke();
    ctx.strokeStyle=u.tired?'#e0705a':f<.35?'#e7b75a':'#9fe0b4';ctx.lineWidth=2.4;
    ctx.beginPath();ctx.ellipse(this.x,this.y+15,19,8,0,Math.PI*.85-Math.PI*.7*f,Math.PI*.85);ctx.stroke();ctx.restore();
  }
  if(u.perfect>0){
    const a=Math.min(1,u.perfect/.3);ctx.save();ctx.globalAlpha*=a;ctx.font='700 11px Manrope,system-ui,sans-serif';ctx.textAlign='center';
    ctx.lineWidth=3;ctx.strokeStyle='rgba(5,10,12,.8)';const y=this.y-46-(1-u.perfect/.8)*10;
    ctx.strokeText('ESQUIVOU!',this.x,y);ctx.fillStyle='#bff3cf';ctx.fillText('ESQUIVOU!',this.x,y);ctx.restore();
  }
};

// poeira da esquiva no chão (desenhada por baixo de todo mundo)
const _ucDrawUnder=CombatEffects.prototype.drawUnder;
CombatEffects.prototype.drawUnder=function(ctx){
  _ucDrawUnder.call(this,ctx);if(!ucDust.length)return;
  ctx.save();
  for(const d of ucDust){const k=d.t/d.life;ctx.globalAlpha=(1-k)*.35;ctx.fillStyle='#b9ad98';ctx.beginPath();ctx.ellipse(d.x,d.y,d.s*(1+k*1.6),d.s*.55*(1+k*1.6),0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
};
const _ucFxUpdate=CombatEffects.prototype.update;
CombatEffects.prototype.update=function(dt){
  _ucFxUpdate.call(this,dt);
  let n=0;for(const d of ucDust){d.t+=dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=Math.exp(-dt*5);d.vy*=Math.exp(-dt*5);if(d.t<d.life)ucDust[n++]=d;}ucDust.length=Math.min(n,60);
};

// som da esquiva: sopro curto de ar (ruído filtrado), sem arquivo
AudioSystem.prototype.ucWhoosh=function(id){
  if(!this.ctx||!this.settings.soundEnabled||this.ctx.state!=='running')return;
  const ctx=this.ctx,now=ctx.currentTime;
  if(!this._ucWhooshBuf){const len=Math.floor(ctx.sampleRate*.32);const b=ctx.createBuffer(1,len,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++){const t=i/len;d[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)*Math.pow(1-t,.6);}this._ucWhooshBuf=b;}
  const src=ctx.createBufferSource();src.buffer=this._ucWhooshBuf;src.playbackRate.value=id==='hadassa'?1.25:id==='san'?1.1:.95;
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.1;bp.frequency.setValueAtTime(500,now);bp.frequency.exponentialRampToValueAtTime(1900,now+.18);
  const gn=ctx.createGain();gn.gain.value=.22;src.connect(bp);bp.connect(gn);gn.connect(this.bus?.fx||ctx.destination);src.start(now);
};

// ---------------- Cena ----------------
CombatScene.prototype.requestDodge=function(){
  const r=this.run;if(!r||r.over||this.game.previewPaused||this.game.ui?.modal||r.backpackOpen||r.progress.selecting||r.discovery.selecting||ucOff())return false;
  if(!r.player._uc)ucInit(r.player);r.player._uc.req=.15;return true;
};
const _ucHurt=CombatScene.prototype.hurtPlayer;
CombatScene.prototype.hurtPlayer=function(amount,slow=false,killer=null){
  const p=this.run?.player,u=p?._uc;
  if(!ucOff()&&u&&u.iframes>0&&amount>0&&!this.run.over){
    // esquiva no tempo certo: o golpe passa, devolve um pouco de fôlego
    if(!u.perfectShown){u.perfectShown=true;u.perfect=.8;u.stamina=Math.min(u.staminaMax,u.stamina+12);this.run.ucPerfect=(this.run.ucPerfect||0)+1;}
    return false;
  }
  return _ucHurt.call(this,amount,slow,killer);
};
const _ucSceneUpdate=CombatScene.prototype.update;
CombatScene.prototype.update=function(dt){
  const out=_ucSceneUpdate.call(this,dt);
  const r=this.run;if(!r||ucOff())return out;
  const p=r.player,u=p._uc;
  // corrida: passos mais rápidos
  if(u?.sprinting&&p.motion>.5)r.stepAudio=(r.stepAudio||0)+dt*.4;
  // San: a esquiva de boxe empurra e derruba quem estiver no caminho
  if(u?.dodge&&u.spec.shove&&r.spatial){
    for(const e of r.spatial.query(p.x,p.y,p.radius+34)){
      if(!e.alive||u.dodge.shoved.has(e)||e.isBoss)continue;
      if(Math.hypot(e.x-p.x,e.y-p.y)>e.radius+p.radius+8)continue;
      u.dodge.shoved.add(e);
      const nx=e.x-p.x,ny=e.y-p.y,l=Math.hypot(nx,ny)||1;
      const died=e.hit(5,{dx:nx/l+u.dodge.dx*.5,dy:ny/l+u.dodge.dy*.5,zone:null,knock:true,shotId:-1});
      r.effects.emit(e.x,e.y,died?'kill':'hit',died?3:2);this.game.audio.effect(died?'kill':'hit');this.creditKill(e,died);
    }
  }
  // celular: botão ESQUIVA ao lado do analógico de andar
  r._ucBtnT=(r._ucBtnT||0)-dt;
  if(r._ucBtnT<=0){r._ucBtnT=.5;ucTouchButton(this);}
  return out;
};
function ucTouchButton(scene){
  const root=scene.game?.root;if(!root)return;
  const sticks=root.querySelector('.combat-sticks'),move=sticks?.querySelector('.stick-move');
  const coarse=window.matchMedia?.('(pointer:coarse)').matches;
  let btn=root.querySelector('.uc-dodge-button');
  if(!sticks||!move||!coarse){btn?.remove();return;}
  if(!btn||btn.parentNode!==sticks){
    btn?.remove();btn=document.createElement('button');btn.type='button';btn.className='uc-dodge-button';
    btn.setAttribute('aria-label','Esquivar');btn.innerHTML='<strong>»</strong><small>ESQUIVA</small>';
    btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();scene.game.scenes.current?.requestDodge?.();});
    sticks.appendChild(btn);
  }
  const a=move.getBoundingClientRect(),b=sticks.getBoundingClientRect();
  if(a.width>0){btn.style.left=Math.round(a.right-b.left+6)+'px';btn.style.top=Math.round(a.top-b.top-8)+'px';}
  const u=scene.run?.player?._uc;btn.classList.toggle('uc-wait',!!u&&(u.cd>0||u.stamina<u.spec.cost*.5));
}
// botão direito do mouse também esquiva
window.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.button!==2)return;const g=window.__projectZGame;
  if(g?.scenes?.name!=='field'||!(e.target instanceof HTMLCanvasElement))return;
  e.preventDefault();g.scenes.current?.requestDodge?.();
},true);
window.addEventListener('contextmenu',e=>{if(window.__projectZGame?.scenes?.name==='field'&&e.target instanceof HTMLCanvasElement)e.preventDefault();},true);

// ---------------- Infectados ----------------
function ucPersona(e){
  let h=pzHash((e.stride*131)|0,(e.radius*977+(e.kind.length*31))|0)||1;
  const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return (h%10000)/10000;};
  let mul=1,sway=.15,lurch=.2;
  if(e.kind==='normal'){mul=.84+rnd()*.32;if(rnd()<.12)mul=1.28;sway=.05+rnd()*.35;lurch=.12+rnd()*.30;}
  else if(e.kind==='runner'){mul=.94+rnd()*.14;sway=.03+rnd()*.08;lurch=.05+rnd()*.10;}
  else if(e.kind==='tank'){mul=.95+rnd()*.10;sway=.05;lurch=.35+rnd()*.12;}
  else{mul=.95+rnd()*.10;sway=.08+rnd()*.15;lurch=.14+rnd()*.16;}
  e._uc={mul,sway,lurch,off:rnd()*6.28,kd:0,kdImmune:0,wind:0,windT:0,windDmg:0,ps:null,pt:0,pcd:1.5+rnd()*2.5,lastShot:null,shotDmg:0};
  return e._uc;
}
function ucPounce(e,u,dt,player,context){
  const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;
  if(!u.ps){
    u.pcd=Math.max(0,u.pcd-dt);
    if(e.crawling||e.hitStun>0||u.pcd>0||d<95||d>185||Math.random()>dt*1.6)return null;
    if(typeof segmentHitsStaticWall==='function'&&segmentHitsStaticWall(e.x,e.y,player.x,player.y,4))return null;
    u.ps='crouch';u.pt=.38;e.heading=Math.atan2(dy,dx);context.sound?.('runnerGrowl',{x:e.x,y:e.y});return 0;
  }
  e.attackCooldown=Math.max(0,e.attackCooldown-dt);e.flinch=Math.max(0,e.flinch-dt);e.hitStun=Math.max(0,e.hitStun-dt);
  u.pt-=dt;
  if(u.ps==='crouch'){
    e.heading=Math.atan2(dy,dx);e.animation='attack';
    if(u.pt<=0){const lx=player.x+(player._ucVX||0)*.2-e.x,ly=player.y+(player._ucVY||0)*.2-e.y,l=Math.hypot(lx,ly)||1;
      u.pdx=lx/l;u.pdy=ly/l;u.psp=Math.min(e.speed*4.2,(l+14)/.32);u.ps='leap';u.pt=.32;u.phit=false;e.heading=Math.atan2(ly,lx);}
    return 0;
  }
  if(u.ps==='leap'){
    const sp=u.psp||e.speed*3.1,p=slideCircle(e.x,e.y,u.pdx*sp*dt,u.pdy*sp*dt,e.radius);e.x=p.x;e.y=p.y;e.stride+=dt*12;e.animation='attack';
    let dmg=0;
    if(!u.phit&&Math.hypot(player.x-e.x,player.y-e.y)<e.radius+player.radius+6){u.phit=true;dmg=e.damage*1.25;e.attackCooldown=e.template.attackInterval;}
    if(u.pt<=0){u.ps='recover';u.pt=.5;}
    return dmg;
  }
  // recuperação: tropeça e demora a voltar a correr (janela para revidar)
  e.animation='hurt';
  if(u.pt<=0){u.ps=null;u.pcd=3.2+Math.random()*2.8;}
  return 0;
}
const _ucEnemyUpdate=Enemy.prototype.update;
Enemy.prototype.update=function(dt,player,others,context={}){
  if(!this.alive||ucOff()||this.kind==='midnight')return _ucEnemyUpdate.call(this,dt,player,others,context);
  const u=this._uc||ucPersona(this);
  u.kdImmune=Math.max(0,u.kdImmune-dt);
  if(u.kd>0){
    u.kd-=dt;this.flinch=Math.max(0,this.flinch-dt);this.hitStun=Math.max(0,this.hitStun-dt);
    if(Math.abs(this.hitVX)+Math.abs(this.hitVY)>.15){const decay=Math.exp(-dt*12),dist=(1-decay)/12;
      const p=slideCircle(this.x,this.y,this.hitVX*dist,this.hitVY*dist,this.radius);this.x=p.x;this.y=p.y;this.hitVX*=decay;this.hitVY*=decay;}
    this.animation='down';this.attackCooldown=Math.max(this.attackCooldown,.25);
    if(u.kd<=0){u.kd=0;u.kdImmune=1.6;}
    return 0;
  }
  if(this.kind==='runner'&&!this.crawling){const pr=ucPounce(this,u,dt,player,context);if(pr!==null)return pr;}
  const px=this.x,py=this.y,s0=this.stride;
  let dmg=_ucEnemyUpdate.call(this,dt,player,others,context);
  if(!this.alive)return dmg;
  // jeito de andar: tranco a cada passo e cambaleio de lado, presos ao passo da animação
  const mx=this.x-px,my=this.y-py;
  if(Math.abs(mx)+Math.abs(my)>.01&&this.hitStun<=0&&u.wind<=0&&this.fuse<0){
    const ph=this.stride*2,surge=u.mul*(1+u.lurch*Math.sin(ph))-1,sway=u.sway*Math.sin(ph*.5+u.off);
    const p=slideCircle(this.x,this.y,mx*surge-my*sway,my*surge+mx*sway,this.radius);this.x=p.x;this.y=p.y;
  }
  this.stride=s0+(this.stride-s0)*u.mul;
  // golpe com preparo: o braço sobe antes; se o jogador saiu do alcance, erra
  if(dmg>0&&UC_WIND[this.kind]){u.wind=u.windT=UC_WIND[this.kind];u.windDmg=dmg;dmg=0;}
  if(u.wind>0){
    this.x=px+(this.x-px)*.35;this.y=py+(this.y-py)*.35;this.animation='attack';
    u.wind-=dt;
    if(u.wind<=0){u.wind=0;if(Math.hypot(player.x-this.x,player.y-this.y)<=this.radius+player.radius+12)dmg=u.windDmg;}
  }
  return dmg;
};
const _ucEnemyHit=Enemy.prototype.hit;
Enemy.prototype.hit=function(damage,impact=null){
  const died=_ucEnemyHit.call(this,damage,impact);
  if(died||!this.alive||ucOff()||(this.kind!=='normal'&&this.kind!=='runner')||this.crawling)return died;
  const u=this._uc||ucPersona(this);
  const sid=impact?.shotId;
  if(sid!=null&&sid===u.lastShot)u.shotDmg+=damage;else{u.lastShot=sid;u.shotDmg=damage;}
  // tiro forte (escopeta de perto, revólver, rifle em quem já está fraco) ou empurrão do San derruba
  if(u.kd<=0&&u.kdImmune<=0&&(impact?.knock||(u.shotDmg>=this.maxHp*.45&&u.shotDmg>=12&&Math.random()<.6))){
    u.kd=UC_KD;u.wind=0;u.ps=null;
  }
  return died;
};
const _ucEnemyDraw=Enemy.prototype.draw;
Enemy.prototype.draw=function(ctx,assets){
  const u=this._uc;
  if(!u||ucOff())return _ucEnemyDraw.call(this,ctx,assets);
  if(u.kd>0&&!this.crawling){
    const S=pzSpriteSheet(this,assets);
    if(S){
      const t=UC_KD-u.kd,a=S.spec.anims.death,top=Math.min(a.frames-2,6);
      const f=t<.45?Math.floor(t/.45*top):t<.65?top:Math.max(0,Math.floor((1-(t-.65)/.5)*top));
      const m=pzMutation(this),alt=pzSheetFor(S.spec,this._sv,m,assets);
      ctx.save();pzBlit(ctx,alt?alt.img:S.img,S.spec,'death',f,pzDir8(this.heading),this.x,this.y,1,alt?alt.anims:null);ctx.restore();
      return;
    }
  }
  if(u.ps==='leap'||u.ps==='crouch'){
    const fy=this.y+this.radius*.9;ctx.save();
    if(u.ps==='leap'){const k=Math.max(0,Math.min(1,1-u.pt/.32));ctx.translate(0,-Math.sin(k*Math.PI)*15);}
    else{const k=Math.min(1,(.38-u.pt)/.2);ctx.translate(this.x,fy);ctx.scale(1+.08*k,1-.13*k);ctx.translate(-this.x,-fy);}
    const st=this.stride;if(u.ps==='crouch')this.stride=.1;
    try{_ucEnemyDraw.call(this,ctx,assets);}finally{this.stride=st;ctx.restore();}
    return;
  }
  if(u.wind>0&&this.animation==='attack'){
    // quadro do ataque segue o preparo (sobe devagar, desce no golpe) em vez de girar em loop
    const S=pzSpriteSheet(this,assets),n=S?S.spec.anims.attack.frames:7,k=1-u.wind/u.windT;
    const want=Math.min(n-1,Math.floor(k*k*(n-1)));const st=this.stride;
    this.stride=(want+.5)/(this.kind==='runner'?.5:1.1);
    try{return _ucEnemyDraw.call(this,ctx,assets);}finally{this.stride=st;}
  }
  return _ucEnemyDraw.call(this,ctx,assets);
};
