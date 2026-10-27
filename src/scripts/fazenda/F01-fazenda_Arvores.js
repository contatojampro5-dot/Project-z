// -- src/fazenda/Arvores.js --
// R55 · cortar árvore no modo Fazenda: E perto do tronco começa a cortar; o machado bate sozinho a cada
// FZ_CHOP.swing s enquanto o jogador fica parado perto. Árvore cai para o lado oposto ao jogador, vira toco
// e dá madeira conforme o tamanho. O tronco deixa de colidir (o.destroyed, igual barril que explode).
// As árvores são as do Morro (PZ_MORRO.trees, 38z); só as que ficam dentro do mapa podem ser cortadas.
const FZ_CHOP={swing:.42,reach:30,fall:1.25};
PALETTE.wood=['#d8b07a','#8a6a44','#f0dcb0'];
function fzTreeHp(t){const K=PZ_TREE_KINDS[t.kind];return Math.max(3,Math.round(K.R*t.sc/9)+1);}
function fzTreeWood(t){const K=PZ_TREE_KINDS[t.kind];return Math.max(3,Math.round(K.R*t.sc/6.5));}
function fzNearestTree(p,max){
  const M=PZ_MORRO;let best=null,bd=max;
  const gx0=Math.floor((p.x-max)/M.GC),gx1=Math.floor((p.x+max)/M.GC),gy0=Math.floor((p.y-max)/M.GC),gy1=Math.floor((p.y+max)/M.GC);
  for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++)for(const t of M.grid.get(gx+','+gy)||[]){
    if(!t.inMap||t.cut)continue;const d=Math.hypot(t.x-p.x,t.y-p.y)-6*t.sc;if(d<bd){bd=d;best=t;}
  }
  return best;
}
function fzTryChop(scene){
  const r=scene.run,p=r.player,t=fzNearestTree(p,p.radius+FZ_CHOP.reach);
  if(!t)return false;
  t.fzHp??=fzTreeHp(t);
  r.fz.chop={t,x:p.x,y:p.y};r.fz.swing=0; // o primeiro golpe sai na hora
  return true;
}
// colisor do tronco (pzMorroBlock não guarda referência na árvore: acha pelo retângulo)
function fzTreeCollider(t){
  if(t.fzCol!==undefined)return t.fzCol;
  const x=t.x-6*t.sc,y=t.y-5;
  t.fzCol=nearbyObstacles(x-2,y-2,x+14,y+11).find(o=>o.morro&&Math.abs(o.x-x)<.6&&Math.abs(o.y-y)<.6)||null;
  return t.fzCol;
}
// as árvores do Morro são do mapa (globais): cada partida nova replanta as que foram cortadas
const FZ_CUT_TREES=[];
function fzRestoreTrees(){
  const M=PZ_MORRO;
  for(const t of FZ_CUT_TREES){
    t.cut=false;t.fzHp=undefined;if(t.fzCol)t.fzCol.destroyed=false;
    const key=Math.floor(t.x/M.GC)+','+Math.floor(t.y/M.GC);let b=M.grid.get(key);if(!b)M.grid.set(key,b=[]);if(!b.includes(t))b.push(t);
  }
  FZ_CUT_TREES.length=0;
}
function fzFellTree(scene,t){
  const r=scene.run,fz=r.fz,M=PZ_MORRO,p=r.player;
  t.cut=true;FZ_CUT_TREES.push(t);
  const b=M.grid.get(Math.floor(t.x/M.GC)+','+Math.floor(t.y/M.GC));if(b){const i=b.indexOf(t);if(i>=0)b.splice(i,1);}
  const col=fzTreeCollider(t);if(col)col.destroyed=true;
  const wood=fzTreeWood(t);fz.wood+=wood;fz.woodTotal+=wood;fz.treesCut++;
  fz.falling.push({x:t.x,y:t.y,kind:t.kind,sc:t.sc,flip:t.flip,dir:p.x<=t.x?1:-1,t:0});
  fz.stumps.push({x:t.x,y:t.y,sc:t.sc});
  r.effects.emit(t.x,t.y-14,'wood',9);
  scene.game.audio.effect('pickup',{x:t.x,y:t.y});
  scene.notify(`+${wood} MADEIRA · ÁRVORE NO CHÃO`,1.4);
  fz.chop=null;
}
function fzTreesUpdate(scene,dt){
  const r=scene.run,fz=r.fz,p=r.player;
  // golpes do machado
  const c=fz.chop;
  if(c){
    const moved=Math.hypot(p.x-c.x,p.y-c.y)>6,far=Math.hypot(c.t.x-p.x,c.t.y-p.y)-6*c.t.sc>p.radius+FZ_CHOP.reach+6;
    if(moved||far||c.t.cut||fz.build)fz.chop=null;
    else{
      p.facing=Math.atan2(c.t.y-8-p.y,c.t.x-p.x);
      fz.swing-=dt;
      if(fz.swing<=0){
        fz.swing=FZ_CHOP.swing;c.t.fzHp--;c.hitAt=performance.now();
        r.effects.emit(c.t.x+(p.x<c.t.x?-5:5),c.t.y-10,'wood',4);
        fz.chips.push({x:c.t.x,y:c.t.y,t:0});
        scene.game.audio.effect('hit',{x:c.t.x,y:c.t.y});
        if(c.t.fzHp<=0)fzFellTree(scene,c.t);
      }
    }
  }
  for(let i=fz.falling.length-1;i>=0;i--){const f=fz.falling[i];f.t+=dt;if(f.t>FZ_CHOP.fall+.6)fz.falling.splice(i,1);}
  for(let i=fz.chips.length-1;i>=0;i--){fz.chips[i].t+=dt;if(fz.chips[i].t>.25)fz.chips.splice(i,1);}
}
// desenhos: árvore caindo (gira no pé), toco e tremida do tronco no golpe
function fzTreeDrawables(run){
  const fz=run.fz,out=[];
  for(const s of fz.stumps)out.push({x:s.x,y:s.y-3,__tall:1,draw(ctx){
    const k=s.sc;ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(s.x,s.y+1,9*k,3.4*k,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4a3424';ctx.fillRect(s.x-5*k,s.y-6*k,10*k,6*k);
    ctx.fillStyle='#c8a070';ctx.beginPath();ctx.ellipse(s.x,s.y-6*k,5*k,2.2*k,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(120,80,40,.7)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(s.x,s.y-6*k,2.6*k,1.1*k,0,0,Math.PI*2);ctx.stroke();}});
  for(const f of fz.falling)out.push({x:f.x,y:f.y,__tall:1,draw(ctx){
    const s=pzTreeSprite(f.kind),sc=f.sc,u=Math.min(1,f.t/FZ_CHOP.fall),ang=f.dir*(u*u)*Math.PI*.48;
    const a=f.t>FZ_CHOP.fall?Math.max(0,1-(f.t-FZ_CHOP.fall)/.6):1;
    ctx.save();ctx.globalAlpha=a;ctx.translate(f.x,f.y);ctx.rotate(ang);if(f.flip)ctx.scale(-1,1);
    ctx.drawImage(s.canvas,-s.ox*sc,-s.oy*sc,s.W*sc,s.H*sc);ctx.restore();}});
  return out;
}
// tremida da copa no golpe: a árvore de 38z não sabe tremer, então o golpe desenha lascas voando
function fzChipDrawables(run){
  const out=[];
  for(const c of run.fz.chips)out.push({x:c.x,y:c.y+.5,__tall:1,draw(ctx){
    const u=c.t/.25;ctx.fillStyle=`rgba(232,208,160,${(1-u).toFixed(2)})`;
    for(let k=0;k<5;k++){const a=k*1.3+.4;ctx.fillRect(c.x+Math.cos(a)*u*16,c.y-10+Math.sin(a)*u*9-u*6,2,2);}}});
  return out;
}
