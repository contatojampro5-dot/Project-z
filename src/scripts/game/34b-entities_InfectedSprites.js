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
