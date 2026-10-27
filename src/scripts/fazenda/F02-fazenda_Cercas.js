// -- src/fazenda/Cercas.js --
// R55 · cercas do modo Fazenda (3 níveis de madeira; pedra e chapa vêm na fase 2, ver docs/fazenda/design.md).
//  • peça de 48 px, posta na frente do jogador no modo construção (T), deitada ou em pé conforme o lado que ele olha;
//  • segura só os infectados: o jogador pula a própria cerca e o tiro passa por cima (fica fora do buckets do 31,
//    entra só no canOccupy, que é o que move e faz nascer os infectados);
//  • infectado encostado bate na cerca até quebrar (FZ_FENCE_DPS); a paliçada de ponta machuca quem bate;
//  • infectado do outro lado da cerca não morde (Enemy.update devolve 0 se a cerca está no meio);
//  • E no modo construção evolui a peça mirada; fora dele, E perto de cerca batida conserta (1 madeira = 35%).
const FZ_FENCE_TIERS=[null,
  {name:'CERCA DE ESTACA',cost:3,hp:140,h:20,pw:3.4,gap:2.4,c:['#5a4028','#7a5a3a','#a07a50'],band:'#c8b080'},
  {name:'PALIÇADA DE TÁBUAS',cost:6,hp:360,h:26,pw:6,gap:.6,c:['#6a4c30','#94704a','#b89064'],band:'#4a3420'},
  {name:'PALIÇADA DE PONTA',cost:10,hp:700,h:32,pw:7,gap:.4,c:['#4e3620','#7a5634','#a07a4e'],band:'#3a2a18',point:1,thorns:7},
];
const FZ_FENCE_DPS={normal:8,runner:6,tank:38,bomber:14,spitter:5,summoner:6,midnight:10};
const FZ_FL=48,FZ_FT=10,FZ_SNAP=24,FZ_GC=64;
const FZ_LIVE={list:[],grid:new Map(),ignore:false};
function fzFencesClearColliders(){FZ_LIVE.list=[];FZ_LIVE.grid=new Map();FZ_LIVE.ignore=false;}
function fzGridKeys(f){const out=[];for(let gy=Math.floor(f.y/FZ_GC);gy<=Math.floor((f.y+f.h)/FZ_GC);gy++)for(let gx=Math.floor(f.x/FZ_GC);gx<=Math.floor((f.x+f.w)/FZ_GC);gx++)out.push(gx+','+gy);return out;}
function fzFencesNear(x0,y0,x1,y1){
  const out=[],seen=new Set();
  for(let gy=Math.floor(y0/FZ_GC);gy<=Math.floor(y1/FZ_GC);gy++)for(let gx=Math.floor(x0/FZ_GC);gx<=Math.floor(x1/FZ_GC);gx++)
    for(const f of FZ_LIVE.grid.get(gx+','+gy)||[])if(!seen.has(f)){seen.add(f);out.push(f);}
  return out;
}
function fzFenceBetween(ax,ay,bx,by){
  if(!FZ_LIVE.list.length)return false;
  return fzFencesNear(Math.min(ax,bx),Math.min(ay,by),Math.max(ax,bx),Math.max(ay,by)).some(f=>segmentRectHit(ax,ay,bx,by,f));
}
// colisão só para quem não é o jogador
{const _co=canOccupy;
 canOccupy=function(x,y,r,obstacles,world){
   if(!_co(x,y,r,obstacles,world))return false;
   if(FZ_LIVE.list.length&&!FZ_LIVE.ignore&&(obstacles===undefined||obstacles===OBSTACLES)){
     for(const f of fzFencesNear(x-r,y-r,x+r,y+r))if(circleIntersectsRect(x,y,r,f))return false;
   }
   return true;
 };}
{const _move=Player.prototype.move;
 Player.prototype.move=function(...a){FZ_LIVE.ignore=true;try{return _move.apply(this,a);}finally{FZ_LIVE.ignore=false;}};}
{const _eu=Enemy.prototype.update;
 Enemy.prototype.update=function(dt,player,others,context){
   const dmg=_eu.call(this,dt,player,others,context);
   if(dmg&&player&&fzFenceBetween(this.x,this.y,player.x,player.y))return 0;
   return dmg;
 };}

function fzFenceRect(cx,cy,horiz){return horiz?{x:cx-FZ_FL/2,y:cy-FZ_FT/2,w:FZ_FL,h:FZ_FT}:{x:cx-FZ_FT/2,y:cy-FZ_FL/2,w:FZ_FT,h:FZ_FL};}
function fzRectsOverlap(a,b,pad=0){return a.x+pad<b.x+b.w&&b.x+pad<a.x+a.w&&a.y+pad<b.y+b.h&&b.y+pad<a.y+a.h;}
function fzAddFence(fz,cx,cy,horiz,tier=1){
  const T=FZ_FENCE_TIERS[tier],f=Object.assign(fzFenceRect(cx,cy,horiz),{id:++fz.id,cx,cy,horiz,tier,hp:T.hp,max:T.hp,hitT:0,seed:(cx*31+cy*17)%97});
  fz.fences.push(f);FZ_LIVE.list=fz.fences;FZ_LIVE.grid=fz.grid;
  for(const k of fzGridKeys(f)){let b=fz.grid.get(k);if(!b)fz.grid.set(k,b=[]);b.push(f);}
  return f;
}
function fzRemoveFence(fz,f){
  const i=fz.fences.indexOf(f);if(i>=0)fz.fences.splice(i,1);
  for(const k of fzGridKeys(f)){const b=fz.grid.get(k);if(b){const j=b.indexOf(f);if(j>=0)b.splice(j,1);}}
}
// peça fantasma: 34 px na frente do jogador, presa na grade de 24
function fzGhost(run){
  const p=run.player,fz=run.fz,a=p.facing??Math.PI/2,horiz=Math.abs(Math.sin(a))>=Math.abs(Math.cos(a));
  const tx=p.x+Math.cos(a)*36,ty=p.y+Math.sin(a)*36;
  const cx=Math.round(tx/FZ_SNAP)*FZ_SNAP,cy=Math.round(ty/FZ_SNAP)*FZ_SNAP,rect=fzFenceRect(cx,cy,horiz);
  const near=fzFencesNear(rect.x-4,rect.y-4,rect.x+rect.w+4,rect.y+rect.h+4);
  let target=near.find(f=>f.cx===cx&&f.cy===cy&&f.horiz===horiz)||near.find(f=>tx>=f.x-3&&tx<=f.x+f.w+3&&ty>=f.y-3&&ty<=f.y+f.h+3)||null;
  let reason='';
  if(!target){
    const W=GAME.map;
    if(rect.x<4||rect.y<4||rect.x+rect.w>W.width-4||rect.y+rect.h>W.height-4)reason='FORA DO MAPA';
    else if(near.some(f=>fzRectsOverlap(f,rect,1)))reason='JÁ TEM CERCA AQUI';
    else if(nearbyObstacles(rect.x,rect.y,rect.x+rect.w,rect.y+rect.h).some(o=>!o.destroyed&&(o.carShape?circleIntersectsRect(cx,cy,FZ_FT,o):fzRectsOverlap(o,rect,1))))reason='TEM ALGO NO CAMINHO';
  }
  return {cx,cy,horiz,rect,target,reason};
}
function fzBuildAction(scene){
  const r=scene.run,fz=r.fz,g=fz.ghost||fzGhost(r);
  if(g.target){
    const f=g.target;
    if(f.tier<FZ_FENCE_TIERS.length-1){
      const T=FZ_FENCE_TIERS[f.tier+1];
      if(fz.wood<T.cost){scene.notify(`FALTA MADEIRA · ${T.name} CUSTA ${T.cost}`,1.5);return false;}
      fz.wood-=T.cost;f.tier++;f.max=T.hp;f.hp=T.hp;f.hitT=.2;
      r.effects.emit(f.cx,f.cy-10,'wood',6);scene.game.audio.effect('upgrade');
      scene.notify(`EVOLUIU · ${T.name}`,1.4);return true;
    }
    if(f.hp<f.max)return fzRepair(scene,f);
    scene.notify('ESSA CERCA JÁ ESTÁ NO NÍVEL MÁXIMO DE MADEIRA',1.5);return false;
  }
  if(g.reason){scene.notify(g.reason,1.2);return false;}
  const T=FZ_FENCE_TIERS[1];
  if(fz.wood<T.cost){scene.notify(`FALTA MADEIRA · CERCA CUSTA ${T.cost} · CORTE ÁRVORES`,1.6);return false;}
  fz.wood-=T.cost;fz.built++;
  const f=fzAddFence(fz,g.cx,g.cy,g.horiz,1);f.hitT=.2;
  r.effects.emit(g.cx,g.cy-8,'wood',5);scene.game.audio.effect('reload');
  return true;
}
function fzRepair(scene,f){
  const fz=scene.run.fz;
  if(fz.wood<1){scene.notify('FALTA MADEIRA PARA CONSERTAR',1.3);return false;}
  fz.wood--;f.hp=Math.min(f.max,f.hp+f.max*.35);f.hitT=.15;
  scene.run.effects.emit(f.cx,f.cy-8,'wood',3);scene.game.audio.effect('reload');
  scene.notify(`CERCA CONSERTADA · ${Math.round(f.hp/f.max*100)}%`,1);return true;
}
function fzTryRepair(scene){
  const r=scene.run,p=r.player,R=p.radius+26;
  let best=null,bd=1e9;
  for(const f of fzFencesNear(p.x-R,p.y-R,p.x+R,p.y+R)){if(f.hp>=f.max)continue;const d=Math.hypot(f.cx-p.x,f.cy-p.y);if(d<bd){bd=d;best=f;}}
  return best?fzRepair(scene,best):false;
}
function fzFencesUpdate(scene,dt){
  const r=scene.run,fz=r.fz;
  FZ_LIVE.list=fz.fences;FZ_LIVE.grid=fz.grid;
  fz.ghost=fz.build?fzGhost(r):null;
  if(!fz.fences.length||dt<=0)return;
  for(const f of fz.fences)f.hitT=Math.max(0,f.hitT-dt);
  // infectados encostados batem na cerca
  for(const e of r.enemies){
    if(!e.alive)continue;const R=e.radius+5;
    const f=fzFencesNear(e.x-R,e.y-R,e.x+R,e.y+R).find(f=>circleIntersectsRect(e.x,e.y,R,f));
    if(!f)continue;
    const dps=e.isBoss?60:(FZ_FENCE_DPS[e.kind]??8);
    f.hp-=dps*dt;f.hitT=Math.max(f.hitT,.1);
    e.__fzBang=(e.__fzBang||0)+dt;
    if(e.__fzBang>.8){e.__fzBang=0;scene.game.audio.effect('zombieAttack',{x:f.cx,y:f.cy});
      const T=FZ_FENCE_TIERS[f.tier];
      if(T.thorns&&!e.isBoss){const nx=e.x-f.cx,ny=e.y-f.cy,l=Math.hypot(nx,ny)||1;
        const died=e.hit(T.thorns,{dx:nx/l,dy:ny/l,zone:null,knock:false,shotId:-1});
        r.effects.emit(e.x,e.y,died?'kill':'hit',died?3:2);if(died)scene.creditKill(e,died);}}
    if(f.hp<=0){
      fzRemoveFence(fz,f);r.effects.emit(f.cx,f.cy-8,'wood',12);scene.game.audio.effect('hit',{x:f.cx,y:f.cy});
      if((fz.breakT||0)<r.elapsed){fz.breakT=r.elapsed+3;scene.notify('UMA CERCA QUEBROU!',1.4);}
    }
  }
}

// ---------- desenho ----------
function fzPaintPost(ctx,x,base,w,h,T,f,k){
  const [d,m,l]=T.c,jit=((f.seed+k*7)%5)-2;h+=jit*.6;
  ctx.fillStyle=m;ctx.fillRect(x,base-h,w,h);
  ctx.fillStyle=l;ctx.fillRect(x,base-h,Math.max(1,w*.35),h);   // lado do sol (leste fica à direita? luz da esquerda no desenho)
  ctx.fillStyle=d;ctx.fillRect(x+w-1,base-h,1,h);
  if(T.point){ctx.fillStyle=m;ctx.beginPath();ctx.moveTo(x,base-h);ctx.lineTo(x+w/2,base-h-6);ctx.lineTo(x+w,base-h);ctx.closePath();ctx.fill();
    ctx.fillStyle=l;ctx.beginPath();ctx.moveTo(x,base-h);ctx.lineTo(x+w/2,base-h-6);ctx.lineTo(x+w*.5,base-h);ctx.closePath();ctx.fill();}
  else{ctx.fillStyle=d;ctx.fillRect(x,base-h,w,1);}
}
function fzFenceDamage(ctx,f,x0,y0,w,h){
  const u=1-f.hp/f.max;if(u<.35)return;
  ctx.fillStyle=`rgba(20,12,6,${(u*.45).toFixed(2)})`;ctx.fillRect(x0,y0,w,h);
  ctx.strokeStyle='rgba(20,12,6,.7)';ctx.lineWidth=.8;ctx.beginPath();
  for(let k=0;k<3;k++){const sx=x0+((f.seed*(k+3))%Math.max(1,w|0));ctx.moveTo(sx,y0+h*.2);ctx.lineTo(sx+3,y0+h*.55);ctx.lineTo(sx-1,y0+h*.8);}ctx.stroke();
}
function fzHpBar(ctx,f,x,y){
  if(f.hp>=f.max)return;const u=Math.max(0,f.hp/f.max),w=28;
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-w/2-1,y-1,w+2,5);
  ctx.fillStyle=u>.6?'#9ad06a':u>.3?'#e8c050':'#e05a48';ctx.fillRect(x-w/2,y,w*u,3);
}
function fzFenceDrawables(run){
  const out=[],fz=run.fz;
  for(const f of fz.fences){
    const T=FZ_FENCE_TIERS[f.tier];
    if(f.horiz){
      const base=f.y+f.h;
      out.push({x:f.cx,y:base,__tall:1,lean:1,draw(ctx){
        const sh=f.hitT>0?Math.sin(performance.now()*.08)*1.2:0;
        ctx.save();ctx.translate(sh,0);
        ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(f.x-2,base-3,f.w+4,5);
        if(T.thorns){ctx.strokeStyle=T.c[0];ctx.lineWidth=2;ctx.beginPath();for(let x=f.x+4;x<f.x+f.w;x+=9){ctx.moveTo(x,base);ctx.lineTo(x-4,base+6);ctx.moveTo(x+3,base-2);ctx.lineTo(x+7,base-9);}ctx.stroke();}
        let k=0;for(let x=f.x;x<f.x+f.w-1;x+=T.pw+T.gap,k++){if(f.hp/f.max<.3&&k%4===2)continue;fzPaintPost(ctx,x,base,Math.min(T.pw,f.x+f.w-x),T.h,T,f,k);}
        ctx.fillStyle=T.band;for(const t of [.32,.72])ctx.fillRect(f.x,base-T.h*t,f.w,f.tier===1?1.4:2.6);
        fzFenceDamage(ctx,f,f.x,base-T.h,f.w,T.h);
        ctx.restore();fzHpBar(ctx,f,f.cx,base-T.h-12);}});
    }else{
      // cerca em pé (norte-sul): um pedaço por poste, cada um na sua profundidade
      const step=T.pw+T.gap+1.5,n=Math.max(2,Math.floor(f.h/step));
      for(let k=0;k<n;k++){const py=f.y+4+k*(f.h-4)/(n-1),last=k===n-1;
        out.push({x:f.cx,y:py,__tall:1,lean:1,draw(ctx){
          if(f.hp/f.max<.3&&k%4===2)return;
          const sh=f.hitT>0?Math.sin(performance.now()*.08)*1.2:0,w=T.pw+2,x=f.cx-w/2+sh;
          ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-1,py-1,w+3,3);
          if(T.thorns&&k%2===0){ctx.strokeStyle=T.c[0];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-1,py-3);ctx.lineTo(x-8,py-8);ctx.moveTo(x+w+1,py-3);ctx.lineTo(x+w+8,py-8);ctx.stroke();}
          fzPaintPost(ctx,x,py,w,T.h,T,f,k);
          ctx.fillStyle=T.band;for(const t of [.32,.72])ctx.fillRect(x,py-T.h*t,w,2);
          fzFenceDamage(ctx,f,x,py-T.h,w,T.h);
          if(last)fzHpBar(ctx,f,f.cx,f.y-T.h-6);}});
      }
    }
  }
  // peça fantasma do modo construção (por cima de tudo)
  const g=fz.ghost;
  if(g){
    out.push({x:g.cx,y:g.cy+1e5,__tall:1,draw(ctx){
      const t=g.target,ok=t?true:!g.reason,R=t||g.rect,nextT=t?FZ_FENCE_TIERS[Math.min(FZ_FENCE_TIERS.length-1,t.tier+1)]:FZ_FENCE_TIERS[1];
      const can=ok&&(t?(t.tier<FZ_FENCE_TIERS.length-1?fz.wood>=nextT.cost:t.hp<t.max&&fz.wood>=1):fz.wood>=nextT.cost);
      const col=can?'120,230,140':ok?'240,200,90':'240,90,80',pulse=.55+.25*Math.sin(performance.now()*.006);
      ctx.save();ctx.fillStyle=`rgba(${col},${(.18*pulse).toFixed(3)})`;ctx.fillRect(R.x,R.y,R.w,R.h);
      ctx.strokeStyle=`rgba(${col},${pulse.toFixed(2)})`;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.strokeRect(R.x-.5,R.y-.5,R.w+1,R.h+1);ctx.setLineDash([]);
      if(!t){ctx.fillStyle=`rgba(${col},.35)`;if(g.horiz)for(let x=R.x;x<R.x+R.w;x+=6)ctx.fillRect(x,R.y+R.h-20,3,20);else for(let y=R.y;y<R.y+R.h;y+=8)ctx.fillRect(g.cx-2,y-14,4,16);}
      const label=t?(t.tier<FZ_FENCE_TIERS.length-1?`EVOLUIR · ${nextT.cost} MADEIRA`:t.hp<t.max?'CONSERTAR · 1 MADEIRA':'NÍVEL MÁXIMO'):g.reason||`CERCA · ${nextT.cost} MADEIRA`;
      ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(10,10,10,.85)';
      const ly=(g.horiz?R.y:R.y)-26;ctx.strokeText(label,g.cx,ly);ctx.fillStyle=`rgb(${col})`;ctx.fillText(label,g.cx,ly);
      ctx.restore();}});
  }
  return out;
}
// tudo do modo Fazenda entra na mesma fila de profundidade dos objetos em pé (igual 38z)
{const _wd=pzWallDrawables;
 pzWallDrawables=function(camera){
   const out=_wd(camera),r=fzRun();
   if(!r)return out;
   for(const d of fzTreeDrawables(r))out.push(d);
   for(const d of fzFenceDrawables(r))out.push(d);
   for(const d of fzChipDrawables(r))out.push(d);
   return out;
 };}
