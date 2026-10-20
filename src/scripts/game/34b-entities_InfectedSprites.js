// -- src/entities/InfectedSprites.js --
// ATLAS A5 · etapa 1 · Afrodite + Ares + Hefesto
// Liga as folhas do laboratório ao jogo. Cada folha: 8 colunas (direção 0=leste, 2=sul, 4=oeste, 6=norte),
// uma linha por quadro, célula 64×72 com o chão na linha 60. Tipos sem folha continuam com o desenho antigo.
const PZ_SPRITES=Object.freeze({
  normal:{
    cell:{w:64,h:72,ground:60,cx:32},
    variants:['infComumOperario','infComumExecutivo','infComumPaciente'],
    anims:{idle:{row:0,frames:6},walk:{row:6,frames:8},attack:{row:14,frames:7},hit:{row:21,frames:4},death:{row:25,frames:9,fps:10},crawl:{row:34,frames:8}},
    corpseLife:9,
  },
});
const PZ_CORPSES={list:[],skip:0,max:40};
const pzDir8=h=>((Math.round((h||0)/(Math.PI/4))%8)+8)%8;
const pzHash=(a,b)=>{let h=(Math.imul((a*73856093)^(b*19349663),2654435761)>>>0);return h;};

function pzSpriteSheet(enemy,assets){
  const spec=PZ_SPRITES[enemy.kind];if(!spec||!assets)return null;
  if(enemy._sv==null)enemy._sv=pzHash(Math.round(enemy.x*7),Math.round(enemy.y*13)+(enemy.stride*1000|0))%spec.variants.length;
  const img=assets.get(spec.variants[enemy._sv]);
  return img&&img.width?{spec,img}:null;
}
function pzBlit(ctx,img,spec,anim,frame,dir,x,y,alpha=1){
  const c=spec.cell,a=spec.anims[anim];const row=a.row+Math.min(a.frames-1,Math.max(0,frame));
  if(alpha<1)ctx.globalAlpha=alpha;
  ctx.drawImage(img,dir*c.w,row*c.h,c.w,c.h,Math.round(x-c.cx),Math.round(y+24-c.ground),c.w,c.h);
  if(alpha<1)ctx.globalAlpha=1;
}

// Desenho do inimigo com folha nova: escolhe animação e quadro a partir do estado que o jogo já calcula.
const _pzEnemyDraw=Enemy.prototype.draw;
Enemy.prototype.draw=function(ctx,assets){
  const S=pzSpriteSheet(this,assets);
  if(!S)return _pzEnemyDraw.call(this,ctx,assets);
  const{spec,img}=S;const TAU=Math.PI*2;
  let anim='walk',frame=0;
  if(this.crawling){anim='crawl';frame=Math.floor(this.stride/TAU*spec.anims.crawl.frames)%spec.anims.crawl.frames;}
  else if(this.flinch>0||this.hitStun>0){anim='hit';const k=this.flinch>0?1-this.flinch/.15:.6;frame=Math.floor(k*spec.anims.hit.frames);}
  else if(this.animation==='attack'){anim='attack';frame=Math.floor(this.stride*1.1)%spec.anims.attack.frames;}
  else{frame=Math.floor(this.stride/TAU*spec.anims.walk.frames)%spec.anims.walk.frames;}
  const dir=pzDir8(this.heading);
  ctx.save();
  if(this.flinch>0)ctx.filter='brightness(1.7)';
  // A folha já traz sombra, rosto, olhos e mãos; o recuo do tiro continua vindo do jogo.
  const reaction=this.flinch>0?Math.sin((this.flinch/.15)*Math.PI):0;
  pzBlit(ctx,img,spec,anim,frame,dir,this.x+this.hitDirX*reaction*2,this.y+this.hitDirY*reaction*2);
  ctx.filter='none';ctx.restore();
};

// Morte: guarda o corpo com a animação de queda e evita o cadáver genérico antigo para esse inimigo.
const _pzEnemyHit=Enemy.prototype.hit;
Enemy.prototype.hit=function(damage,impact){
  const wasAlive=this.alive;const died=_pzEnemyHit.call(this,damage,impact);
  if(wasAlive&&!this.alive&&PZ_SPRITES[this.kind]&&this._sv!=null&&!this.deadByExplosion){
    const spec=PZ_SPRITES[this.kind];
    if(PZ_CORPSES.list.length>=PZ_CORPSES.max)PZ_CORPSES.list.shift();
    PZ_CORPSES.list.push({x:this.x,y:this.y,kind:this.kind,v:this._sv,dir:pzDir8(this.heading),t:0,life:spec.corpseLife});
    PZ_CORPSES.skip++;
  }
  return died;
};
const _pzFxEmit=CombatEffects.prototype.emit;
CombatEffects.prototype.emit=function(x,y,type='hit',amount=6){
  const before=this.corpses.length;_pzFxEmit.call(this,x,y,type,amount);
  if(type==='kill'&&PZ_CORPSES.skip>0&&this.corpses.length>before){this.corpses.pop();PZ_CORPSES.skip--;}
};
const _pzFxUpdate=CombatEffects.prototype.update;
CombatEffects.prototype.update=function(dt){
  _pzFxUpdate.call(this,dt);PZ_CORPSES.skip=0;
  let n=0;const L=PZ_CORPSES.list;for(const c of L){c.t+=dt;if(c.t<c.life)L[n++]=c;}L.length=n;
};
const _pzFxDrawUnder=CombatEffects.prototype.drawUnder;
CombatEffects.prototype.drawUnder=function(ctx){
  _pzFxDrawUnder.call(this,ctx);
  const assets=window.__PZ_ASSETS__;if(!assets)return;
  for(const c of PZ_CORPSES.list){const spec=PZ_SPRITES[c.kind];const img=assets.get(spec.variants[c.v]);if(!img||!img.width)continue;
    const a=spec.anims.death;const f=Math.min(a.frames-1,Math.floor(c.t*(a.fps||10)));const fade=Math.min(1,(c.life-c.t)/1.2);
    pzBlit(ctx,img,spec,'death',f,c.dir,c.x,c.y,fade);}
};
// Partida nova: limpa os corpos da anterior.
function pzResetCorpses(){PZ_CORPSES.list.length=0;PZ_CORPSES.skip=0;}

// ---------- Peças do corpo (cabeça, braço, perna) em volume ----------
// Folha 'infComumPecas': linha = variação*3 + peça (0 cabeça, 1 braço, 2 perna), 12 quadros de giro em 3D, célula 48.
const PZ_PARTS={cell:48,frames:12,row:{head:0,arm:1,leg:2}};
function pzPartVariant(enemy){
  if(enemy&&enemy._sv!=null)return enemy._sv;
  return enemy?pzHash(Math.round(enemy.x),Math.round(enemy.y))%3:0;
}
function pzTagNewParts(fx,from,enemy,mode){
  const v=pzPartVariant(enemy);
  for(let i=from;i<fx.severedParts.length;i++){const p=fx.severedParts[i];if(p._pz)continue;
    p._pz=1;p.v=v;p.yaw=Math.atan2(p.vy,p.vx)+(Math.random()-.5)*.8;p.tumble=Math.random()*6.283;
    if(mode==='fall'){// membro que só se solta do corpo: cai perto, quica pouco
      p.vx*=.32;p.vy*=.32;p.vz=40+Math.random()*30;p.z=Math.max(p.z,10);p.spin*=.45;}
  }
}
const _pzEmitSevered=CombatEffects.prototype.emitSevered;
CombatEffects.prototype.emitSevered=function(enemy,dx=1,dy=0,damage=0,force=false){
  const from=this.severedParts.length;
  const blownApart=!!force&&(Number(damage)||0)>=48;
  _pzEmitSevered.call(this,enemy,dx,dy,damage,force);
  if(!blownApart){// tiro comum: não arranca a cabeça de um corpo que cai inteiro
    for(let i=this.severedParts.length-1;i>=from;i--)if(this.severedParts[i].part==='head')this.severedParts.splice(i,1);}
  else if(enemy&&PZ_SPRITES[enemy.kind]){// explosão: o corpo inteiro se desfaz, sem cadáver inteiro no chão
    const L=PZ_CORPSES.list;for(let i=L.length-1;i>=0;i--){const c=L[i];if(Math.hypot(c.x-enemy.x,c.y-enemy.y)<6&&c.t<.2){L.splice(i,1);break;}}}
  pzTagNewParts(this,Math.min(from,this.severedParts.length),enemy,'fly');
};
const _pzEmitAmputated=CombatEffects.prototype.emitAmputatedLeg;
CombatEffects.prototype.emitAmputatedLeg=function(enemy,dx=1,dy=0,part='leg'){
  const from=this.severedParts.length;_pzEmitAmputated.call(this,enemy,dx,dy,part);pzTagNewParts(this,from,enemy,'fall');
};
const _pzFxDrawOver=CombatEffects.prototype.drawOver;
CombatEffects.prototype.drawOver=function(ctx){
  const assets=window.__PZ_ASSETS__,img=assets&&assets.get('infComumPecas');
  if(!img||!img.width)return _pzFxDrawOver.call(this,ctx);
  const parts=this.severedParts;this.severedParts=[];
  try{_pzFxDrawOver.call(this,ctx);}finally{this.severedParts=parts;}
  const C=PZ_PARTS.cell,N=PZ_PARTS.frames,TAU=Math.PI*2;
  for(const p of parts){
    const row=(p.v||0)*3+(PZ_PARTS.row[p.part]??1);
    // o giro em 3D acompanha o ângulo que a física já acumula no ar; no chão a peça para no último quadro
    const ang=(p.angle||0)+(p.tumble||0);const f=((Math.floor(((ang%TAU)+TAU)%TAU/TAU*N))%N+N)%N;
    const a=Math.min(1,p.life/.55),h=Math.max(0,p.z||0);
    ctx.save();ctx.globalAlpha=a*Math.max(.25,.45-h/120);ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(p.x,p.y+3,9*(1-Math.min(.5,h/80)),3.4*(1-Math.min(.5,h/80)),0,0,TAU);ctx.fill();
    ctx.globalAlpha=a;ctx.translate(Math.round(p.x),Math.round(p.y-h));ctx.rotate((p.yaw||0)*.35);
    ctx.drawImage(img,f*C,row*C,C,C,-C/2,-C/2,C,C);ctx.restore();
  }
};
