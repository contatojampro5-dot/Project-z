// -- src/fazenda/Arvores.js --
// Machado e corte de árvore do modo Fazenda.
// R56 (pedido do Theo): o machado fica num cepo do lado da casa (FZ.AXE); E pega uma vez e ele fica com o jogador.
// Com o machado, no tempo de construir e dentro da área da fazenda, SEGURAR E por 3 s perto do tronco corta a árvore:
// o machado bate a cada FZ_CHOP.swing s (lasca + toc), a árvore treme, cai girando no pé para o lado oposto ao
// jogador e vira toco. Aparece "1 ÁRVORE COLETADA" (contador de árvores) e, logo depois, a árvore vira madeira.
// Só as árvores dentro da área construível (fzInZone) podem ser cortadas; o tronco deixa de colidir (o.destroyed).
const FZ_CHOP={hold:3,swing:.5,reach:30,fall:1.3,logToWood:1.1};
PALETTE.wood=['#d8b07a','#8a6a44','#f0dcb0'];
function fzTreeWood(t){const K=PZ_TREE_KINDS[t.kind];return Math.max(3,Math.round(K.R*t.sc/6.5));}
function fzNearestTree(p,max){
  const M=PZ_MORRO;let best=null,bd=max;
  const gx0=Math.floor((p.x-max)/M.GC),gx1=Math.floor((p.x+max)/M.GC),gy0=Math.floor((p.y-max)/M.GC),gy1=Math.floor((p.y+max)/M.GC);
  for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++)for(const t of M.grid.get(gx+','+gy)||[]){
    if(!t.inMap||t.cut||!fzInZone(t.x,t.y))continue;const d=Math.hypot(t.x-p.x,t.y-p.y)-6*t.sc;if(d<bd){bd=d;best=t;}
  }
  return best;
}
// ---------- machado ----------
function fzNearAxe(run){return !run.fz.axe&&Math.hypot(run.player.x-FZ.AXE.x,run.player.y-FZ.AXE.y)<run.player.radius+34;}
function fzTryAxe(scene){
  const r=scene.run;if(!fzNearAxe(r))return false;
  r.fz.axe=true;r.effects.emit(FZ.AXE.x,FZ.AXE.y-10,'wood',6);scene.game.audio.effect('pickup');
  scene.notify(fzBuildPhase(r)?'VOCÊ PEGOU O MACHADO · SEGURE E PERTO DE UMA ÁRVORE':'VOCÊ PEGOU O MACHADO · CORTE QUANDO A ONDA ACABAR',2.4);
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
    t.cut=false;if(t.fzCol)t.fzCol.destroyed=false;
    const key=Math.floor(t.x/M.GC)+','+Math.floor(t.y/M.GC);let b=M.grid.get(key);if(!b)M.grid.set(key,b=[]);if(!b.includes(t))b.push(t);
  }
  FZ_CUT_TREES.length=0;
}
function fzFellTree(scene,t){
  const r=scene.run,fz=r.fz,M=PZ_MORRO,p=r.player;
  t.cut=true;FZ_CUT_TREES.push(t);
  const b=M.grid.get(Math.floor(t.x/M.GC)+','+Math.floor(t.y/M.GC));if(b){const i=b.indexOf(t);if(i>=0)b.splice(i,1);}
  const col=fzTreeCollider(t);if(col)col.destroyed=true;
  fz.logs++;fz.treesCut++;
  fz.pending.push({wood:fzTreeWood(t),t:0});
  fz.falling.push({x:t.x,y:t.y,kind:t.kind,sc:t.sc,flip:t.flip,dir:p.x<=t.x?1:-1,t:0,landed:false});
  fz.stumps.push({x:t.x,y:t.y,sc:t.sc});
  r.effects.emit(t.x,t.y-14,'wood',9);
  scene.game.audio.effect('hit',{x:t.x,y:t.y});
  scene.notify('🌳 1 ÁRVORE COLETADA',1.4);
  fz.chop=null;
}
function fzTreesUpdate(scene,dt){
  const r=scene.run,fz=r.fz,p=r.player;
  // segurando E perto da árvore (com machado, na hora e no lugar certos) o corte anda; soltou, recomeça
  const t=fz.axe&&!fz.build&&fzHeld()&&!fzBuildBlock(r)?fzNearestTree(p,p.radius+FZ_CHOP.reach):null;
  if(!t)fz.chop=null;
  else{
    if(fz.chop?.t!==t){fz.chop={t,prog:0};fz.swingT=0;}
    const c=fz.chop;c.prog+=dt;
    p.facing=Math.atan2(t.y-8-p.y,t.x-p.x);
    fz.swingT-=dt;
    if(fz.swingT<=0){
      fz.swingT=FZ_CHOP.swing;c.hitAt=performance.now();t.fzShake=performance.now();
      r.effects.emit(t.x+(p.x<t.x?-5:5),t.y-10,'wood',4);
      fz.chips.push({x:t.x,y:t.y,t:0});
      scene.game.audio.effect('hit',{x:t.x,y:t.y});
    }
    if(c.prog>=FZ_CHOP.hold)fzFellTree(scene,t);
  }
  // a árvore coletada vira madeira
  for(let i=fz.pending.length-1;i>=0;i--){const q=fz.pending[i];q.t+=dt;
    if(q.t>=FZ_CHOP.logToWood){fz.pending.splice(i,1);fz.wood+=q.wood;fz.woodTotal+=q.wood;
      scene.notify(`🌳 → 🪵 A ÁRVORE VIROU ${q.wood} MADEIRAS`,1.6);scene.game.audio.effect('pickup');fz.woodFlash=1;}}
  fz.woodFlash=Math.max(0,(fz.woodFlash||0)-dt);
  for(let i=fz.falling.length-1;i>=0;i--){const f=fz.falling[i];f.t+=dt;
    if(!f.landed&&f.t>=FZ_CHOP.fall){f.landed=true;r.effects.emit(f.x+f.dir*40,f.y,'wood',10);scene.game.audio.effect('hit',{x:f.x,y:f.y});}
    if(f.t>FZ_CHOP.fall+.9)fz.falling.splice(i,1);}
  for(let i=fz.chips.length-1;i>=0;i--){fz.chips[i].t+=dt;if(fz.chips[i].t>.3)fz.chips.splice(i,1);}
}
// ---------- desenho ----------
function fzDrawAxe(ctx,x,y,ang,s=1){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(s,s);
  ctx.fillStyle='#6a4a2c';ctx.fillRect(-1.3,-15,2.6,17);ctx.fillStyle='#8a6440';ctx.fillRect(-1.3,-15,1,17);
  ctx.fillStyle='#9aa2a8';ctx.beginPath();ctx.moveTo(1,-15);ctx.lineTo(8,-17);ctx.quadraticCurveTo(10,-12,8,-7);ctx.lineTo(1,-10);ctx.closePath();ctx.fill();
  ctx.fillStyle='#d8e0e4';ctx.beginPath();ctx.moveTo(8,-17);ctx.quadraticCurveTo(10,-12,8,-7);ctx.lineTo(7,-8);ctx.quadraticCurveTo(8.6,-12,7,-16);ctx.closePath();ctx.fill();
  ctx.restore();
}
function fzTreeDrawables(run){
  const fz=run.fz,out=[],now=performance.now();
  for(const s of fz.stumps)out.push({x:s.x,y:s.y-3,__tall:1,draw(ctx){
    const k=s.sc;ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(s.x,s.y+1,9*k,3.4*k,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4a3424';ctx.fillRect(s.x-5*k,s.y-6*k,10*k,6*k);
    ctx.fillStyle='#c8a070';ctx.beginPath();ctx.ellipse(s.x,s.y-6*k,5*k,2.2*k,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(120,80,40,.7)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(s.x,s.y-6*k,2.6*k,1.1*k,0,0,Math.PI*2);ctx.stroke();}});
  // árvore caindo: gira no pé, acelerando, quica de leve no chão e some
  for(const f of fz.falling)out.push({x:f.x,y:f.y,__tall:1,draw(ctx){
    const s=pzTreeSprite(f.kind),sc=f.sc,u=Math.min(1,f.t/FZ_CHOP.fall),bounce=f.t>FZ_CHOP.fall?Math.sin(Math.min(1,(f.t-FZ_CHOP.fall)/.25)*Math.PI)*.05:0;
    const ang=f.dir*((u*u*u)*Math.PI*.5-bounce),a=f.t>FZ_CHOP.fall+.3?Math.max(0,1-(f.t-FZ_CHOP.fall-.3)/.6):1;
    ctx.save();ctx.globalAlpha=a;ctx.translate(f.x,f.y);ctx.rotate(ang);if(f.flip)ctx.scale(-1,1);
    ctx.drawImage(s.canvas,-s.ox*sc,-s.oy*sc,s.W*sc,s.H*sc);ctx.restore();}});
  // cepo com o machado (até o jogador pegar)
  const A=FZ.AXE;
  out.push({x:A.x,y:A.y,__tall:1,lean:1,draw(ctx){
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(A.x,A.y+1,13,4.5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5a3e28';ctx.fillRect(A.x-10,A.y-11,20,11);ctx.fillStyle='#6e4e32';ctx.fillRect(A.x-10,A.y-11,6,11);
    ctx.fillStyle='#c8a070';ctx.beginPath();ctx.ellipse(A.x,A.y-11,10,3.6,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(120,80,40,.7)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(A.x,A.y-11,5.5,1.8,0,0,Math.PI*2);ctx.stroke();
    if(!fz.axe){
      fzDrawAxe(ctx,A.x-2,A.y-9,-.5,1.15);
      const pulse=.5+.5*Math.sin(now*.005);
      ctx.fillStyle=`rgba(255,230,150,${(.25+.35*pulse).toFixed(2)})`;ctx.beginPath();ctx.arc(A.x+6,A.y-26,2+pulse*1.5,0,Math.PI*2);ctx.fill();
      if(Math.hypot(run.player.x-A.x,run.player.y-A.y)<160){
        const label=fzNearAxe(run)?'E · PEGAR MACHADO':'MACHADO';
        ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(10,10,10,.85)';ctx.strokeText(label,A.x,A.y-36);ctx.fillStyle='#ffe3a0';ctx.fillText(label,A.x,A.y-36);}
    }}});
  // machado na mão do jogador (balança quando corta)
  if(fz.axe){const p=run.player;
    out.push({x:p.x,y:p.y+.6,__tall:1,draw(ctx){
      const c=fz.chop,f=p.facing??Math.PI/2,side=Math.cos(f)>=0?1:-1,hx=p.x+Math.cos(f)*7+side*3,hy=p.y-11+Math.sin(f)*3;
      let ang=side*.9;
      if(c){const ph=((FZ_CHOP.swing-fz.swingT)/FZ_CHOP.swing);ang=side*(ph<.35?(-1.3+ph/.35*2.6):1.3-(ph-.35)/.65*1.9);}
      fzDrawAxe(ctx,hx,hy,ang,.9);}});
    // anel de progresso sobre a árvore enquanto segura o E
    const c=fz.chop;
    if(c)out.push({x:c.t.x,y:c.t.y+2e4,__tall:1,draw(ctx){
      const u=Math.min(1,c.prog/FZ_CHOP.hold),x=c.t.x,y=c.t.y-PZ_TREE_KINDS[c.t.kind].T*c.t.sc-14;
      ctx.lineWidth=4;ctx.strokeStyle='rgba(10,10,10,.6)';ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#ffd166';ctx.beginPath();ctx.arc(x,y,11,-Math.PI/2,-Math.PI/2+u*Math.PI*2);ctx.stroke();
      ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle='#fff3d0';ctx.fillText(Math.max(0,FZ_CHOP.hold-c.prog).toFixed(1),x,y+3);}});
    // marca na árvore cortável mais perto (tempo de construir)
    else if(!fz.build&&!fzBuildBlock(run)){const t=fzNearestTree(run.player,run.player.radius+FZ_CHOP.reach);
      if(t)out.push({x:t.x,y:t.y+2e4,__tall:1,draw(ctx){const y=t.y-PZ_TREE_KINDS[t.kind].T*t.sc-14;
        ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(10,10,10,.85)';ctx.strokeText('SEGURE E',t.x,y);ctx.fillStyle='#ffe3a0';ctx.fillText('SEGURE E',t.x,y);}});}
  }
  return out;
}
// lascas voando a cada golpe e tremida do tronco (desenha um tronco por cima que balança)
function fzChipDrawables(run){
  const out=[],now=performance.now(),c=run.fz.chop;
  for(const ch of run.fz.chips)out.push({x:ch.x,y:ch.y+.5,__tall:1,draw(ctx){
    const u=ch.t/.3;ctx.fillStyle=`rgba(232,208,160,${(1-u).toFixed(2)})`;
    for(let k=0;k<6;k++){const a=k*1.3+.4;ctx.fillRect(ch.x+Math.cos(a)*u*18,ch.y-10+Math.sin(a)*u*9-u*8,2,2);}}});
  if(c&&c.hitAt&&now-c.hitAt<160){const t=c.t,sh=Math.sin((now-c.hitAt)*.09)*1.6*(1-(now-c.hitAt)/160);
    out.push({x:t.x,y:t.y+.4,__tall:1,draw(ctx){ctx.fillStyle='#e8c890';ctx.fillRect(t.x-3+sh,t.y-14,6,3);ctx.fillStyle='rgba(60,40,20,.6)';ctx.fillRect(t.x-3+sh,t.y-11,6,1);}});}
  return out;
}
