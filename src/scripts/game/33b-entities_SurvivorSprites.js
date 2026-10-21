// -- src/entities/SurvivorSprites.js --
// ATLAS A12 · Afrodite + Ares + Hefesto — Antônio, Hadassa, San e Hanna com as folhas do laboratório.
// Uma folha por personagem e arma (6 armas), 9 animações × 8 direções, carregada só quando a arma é usada.
// Estados → animações: parado/mirando, andar mirando (atirando enquanto anda), correr (andando sem atirar),
// atirar (recuo), recarregar, levar dano, morrer e a habilidade de cada um.
const PZ_SURV_IMG=new Map();
function pzSurvImg(key){
  const S=PZ_SURV_SHEETS[key];if(!S)return null;let im=PZ_SURV_IMG.get(key);
  if(!im){im=new Image();im.decoding='async';im.src=S.url;PZ_SURV_IMG.set(key,im);}
  return im.complete&&im.naturalWidth?im:null;
}
// pré-carrega a pistola de quem foi escolhido, para não aparecer o boneco antigo no começo
function pzSurvPreload(id){pzSurvImg(id+'_pistol');}
const PZ_SURV_FOOT=15,PZ_SURV_SIZE=1.12; // sobreviventes um pouco maiores que os infectados: o jogador se destaca
function pzSurvState(p){
  const now=performance.now()/1000,s=p._pa||(p._pa={hp:p.hp,inv:0,shotT:-9,spT:-9,spSeen:0,mines:null,deadT:null,punchT:-9,lastPunch:null});
  if(p.invulnerable>s.inv+.05&&p.alive)s.hitT=now;s.inv=p.invulnerable;
  const sp=p.specialRemaining||0;if(sp>0&&s.spSeen<=0)s.spT=now;s.spSeen=sp;
  if(p.minesLeft!=null){if(s.mines!=null&&p.minesLeft<s.mines)s.spT=now;s.mines=p.minesLeft;}
  if(!p.alive&&s.deadT==null)s.deadT=now;if(p.alive)s.deadT=null;
  return s;
}
const _pzPlayerDraw=Player.prototype.draw;
Player.prototype.draw=function(ctx,assets){
  const run0=window.__projectZGame?.scenes?.current?.run;const id=this.charId||'antonio',w=run0?.gun?.model||this.progression?.weapon||'pistol';
  let key=id+'_'+w,img=pzSurvImg(key);
  if(!img){key=id+'_pistol';img=pzSurvImg(key);}
  if(!img)return _pzPlayerDraw.call(this,ctx,assets);
  const S=PZ_SURV_SHEETS[key],A=S.anims,c=S.cell,now=performance.now()/1000,st=pzSurvState(this);
  const run=window.__projectZGame?.scenes?.current?.run,gun=run?.gun;
  if(gun&&(gun.flashes||[]).length)st.shotT=now;
  if(id==='san'&&run?.punchFX&&run.punchFX!==st.lastPunch){st.lastPunch=run.punchFX;st.punchT=now;}
  const dir=((Math.round((this.facing||0)/(Math.PI/4))%8)+8)%8;
  const once=(name,t0,sp=1)=>{const a=A[name];const f=Math.floor((now-t0)*a.fps*sp);return f<a.frames?[name,f]:null;};
  let pick=null;
  if(!this.alive){const a=A.death;pick=['death',Math.min(a.frames-1,Math.floor((now-(st.deadT||now))*a.fps))];}
  if(!pick&&now-st.spT<1.25)pick=once('special',st.spT);
  if(!pick&&id==='san'&&now-st.punchT<.32){const a=A.special;pick=['special',Math.min(a.frames-1,1+Math.floor((now-st.punchT)*a.fps*1.4))];}
  if(!pick&&st.hitT&&now-st.hitT<.34)pick=once('hit',st.hitT);
  if(!pick&&gun&&gun.reloadRemaining>0){const a=A.reload,k=1-gun.reloadRemaining/Math.max(.1,gun.reloadTime||1);pick=['reload',Math.min(a.frames-1,Math.floor(k*a.frames))];}
  const moving=this.motion>.08,firing=now-st.shotT<1.4;
  if(!pick&&gun&&(gun.flashes||[]).length&&!moving){const f=gun.flashes[0];const k=1-Math.max(0,f.life/f.maxLife);pick=['shoot',Math.min(A.shoot.frames-1,Math.floor(k*A.shoot.frames))];}
  if(!pick&&moving){const fast=(this.specialRemaining>0&&id==='antonio')||!firing;
    pick=fast?['run',Math.floor(this.walkTime*1.25)%A.run.frames]:['walk',Math.floor(this.walkTime)%A.walk.frames];}
  if(!pick){const n=firing?'aim':'idle';pick=[n,Math.floor(now*A[n].fps)%A[n].frames];}
  const row=A[pick[0]].row+pick[1];
  ctx.save();
  if(this.invulnerable>0&&this.alive&&Math.floor(this.invulnerable*16)%2===0)ctx.globalAlpha=.55;
  ctx.imageSmoothingEnabled=true;
  const k=PZ_SURV_SIZE;ctx.drawImage(img,dir*c.w,row*c.h,c.w,c.h,this.x-c.cx*k,this.y+PZ_SURV_FOOT-c.ground*k,c.w*k,c.h*k);
  ctx.restore();
};
// clarão do tiro sai da boca da arma desenhada (só o desenho; o projétil continua igual)
const _pzPistolFire=Pistol.prototype.fire;
Pistol.prototype.fire=function(player,onShot,precision){
  const n0=this.flashes.length;const r=_pzPistolFire.call(this,player,onShot,precision);
  const id=player.charId||'antonio',sk=id+'_'+(this.model||'pistol'),S=PZ_SURV_SHEETS[sk];
  if(S&&PZ_SURV_IMG.get(sk)?.complete){
    const dir=((Math.round((player.facing||0)/(Math.PI/4))%8)+8)%8,m=S.muzzle[dir],k=PZ_ENTITY_SCALE;
    const fy=player.y+player.radius*.9;
    for(let i=n0;i<this.flashes.length;i++){const f=this.flashes[i];const ox=f.x-(player.x+Math.cos(f.angle)*weaponMuzzleLength(f.weapon));const oy=f.y-(player.y+Math.sin(f.angle)*weaponMuzzleLength(f.weapon));
      f.x=player.x+m[0]*k*PZ_SURV_SIZE+ox;f.y=fy+(player.y+PZ_SURV_FOOT+m[1]*PZ_SURV_SIZE-fy)*k+oy;f.scale=(f.scale||1)*.8;}
  }
  return r;
};
