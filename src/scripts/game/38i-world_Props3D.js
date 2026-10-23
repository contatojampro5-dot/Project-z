// -- src/world/Props3D.js --
// R33 · Deméter + Hefesto — o resto do cenário entra na mesma câmera 3D dos prédios (29g):
//  • postes de luz, postes de concreto, orelhões, bancas, pontos e placas se inclinam a partir do pé,
//    para longe do ponto de fuga (a fiação acompanha o topo dos postes);
//  • carros, ambulâncias, contêineres, caixas e barreiras de concreto ganham volume (camadas empilhadas:
//    laterais escuras embaixo, teto em cima, tudo em perspectiva);
//  • o muro de quarentena vira um muro de verdade, com topo, face e concertina, em perspectiva.
// Colisão e jogabilidade não mudam. window.__PZ_FLAT3D=true volta ao visual antigo.

// Inclina um desenho "em pé" (feito na vista antiga, altura = -y) a partir do pé (fx,fy).
function pz3dLean(ctx,fx,fy){
  const A=PZ_3D.a;
  ctx.translate(fx,fy);ctx.transform(1,0,-(fx-PZ_3D.vx)*A,(PZ_3D.vy-fy)*A,0,0);ctx.translate(-fx,-fy);
}
// Ponto a uma altura h acima de (x,y): na vista 3D ou na antiga.
function pz3dTop(x,y,h){return pz3dOn()?pz3dP(x,y,h):{x,y:y-h};}
function pz3dLampHead(l){const h=l.y-l.hy,p=pz3dP(l.hx,l.y,h);return Object.assign({},l,{hx:p.x,hy:p.y});}

// ---------- postes de luz ----------
// Antes eram pintados no chão do mapa; agora o chão só recebe a sombra e o poste vira objeto em pé.
const PZ_POLES={list:[],keys:new Set(),spr:{}};
const _pzPoleFlat=streetlightPole;
streetlightPole=function(ctx,x,y){
  const key=Math.round(x)+':'+Math.round(y);
  if(!PZ_POLES.keys.has(key)){PZ_POLES.keys.add(key);PZ_POLES.list.push({x,y,d:pzLampDir(x,y)});}
  ctx.save();ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.moveTo(x-1,y+15);ctx.lineTo(x+22,y+24);ctx.lineTo(x+24,y+21);ctx.lineTo(x+2,y+12);ctx.closePath();ctx.fill();ctx.restore();
};
function pzPoleSprite(){
  if(PZ_POLES.spr.c)return PZ_POLES.spr.c;
  const RES=3,W=48,H=60,ox=22,oy=42;
  const c=document.createElement('canvas');c.width=W*RES;c.height=H*RES;const x=c.getContext('2d');x.scale(RES,RES);
  // mesmo desenho do poste original (virado para a direita; o outro lado é espelhado), sem a sombra:
  // o primeiro fill() do desenho original é a sombra no chão, que fica pintada no mapa.
  let first=true;x.fill=function(...a){if(first){first=false;return;}return CanvasRenderingContext2D.prototype.fill.apply(this,a);};
  PZ_POLES.force=1;try{_pzPoleFlat(x,ox,oy);}finally{PZ_POLES.force=0;delete x.fill;}
  return PZ_POLES.spr.c={canvas:c,W,H,ox,oy};
}
{const _dir=pzLampDir;pzLampDir=function(x,y){return PZ_POLES.force||_dir(x,y);};}
function pzPoleDrawables(camera,player){
  const out=[],vw=camera.viewport.width/camera.zoom/2+80,vh=camera.viewport.height/camera.zoom/2+120;
  for(const p of PZ_POLES.list){
    if(Math.abs(p.x-camera.x)>vw||Math.abs(p.y-camera.y)>vh)continue;
    out.push({x:p.x,y:p.y+14,__tall:1,lean:1,draw(ctx){
      const s=pzPoleSprite(),a=pzOccludes(p,p.x,p.y+14,30,50,player);
      if(a<.99)ctx.globalAlpha=a;
      if(p.d<0){ctx.save();ctx.translate(p.x,0);ctx.scale(-1,1);ctx.drawImage(s.canvas,-s.ox,p.y-s.oy,s.W,s.H);ctx.restore();}
      else ctx.drawImage(s.canvas,p.x-s.ox,p.y-s.oy,s.W,s.H);
      ctx.globalAlpha=1;}});
  }
  return out;
}
// ---------- veículos, contêineres, caixas e barreiras com volume ----------
function pz3dPropHeight(o){
  if(o.kind==='vehicle')return o.visual?.kind==='emergency'?14:o.visual?.kind==='district'?14:11;
  if(o.kind==='barrier')return 9;
  if(o.kind==='crate')return o.visual?.kind==='district'?18:9;
  return 0;
}
function pz3dPropTex(wd,o,assets){
  if(o.__t3)return o.__t3;
  const p=o.rect,S=Math.ceil(Math.hypot(p.w,p.h)+48),R=2,cx=p.x+p.w/2,cy=p.y+p.h/2;
  const mk=()=>{const c=document.createElement('canvas');c.width=c.height=S*R;return c;};
  const top=mk(),t=top.getContext('2d');t.scale(R,R);t.translate(S/2-cx,S/2-cy);t.imageSmoothingEnabled=true;
  wd.__pz3dPaint=true;try{wd.paintOriginalObject(t,o,assets);}finally{wd.__pz3dPaint=false;}
  const dark=mk(),d=dark.getContext('2d');d.drawImage(top,0,0);d.globalCompositeOperation='source-atop';d.fillStyle='rgba(8,9,12,.62)';d.fillRect(0,0,dark.width,dark.height);
  return o.__t3={top,dark,S,cx,cy};
}
function pz3dStack(ctx,T,Hz,step){
  const base=ctx.getTransform(),vx=PZ_3D.vx,vy=PZ_3D.vy,n=Math.max(2,Math.round(Hz/step));
  for(let i=0;i<=n;i++){
    const z=Hz*i/n,k=1+PZ_3D.a*z;
    ctx.setTransform(base);ctx.translate(vx,vy);ctx.scale(k,k);ctx.translate(-vx,-vy);
    ctx.drawImage(i<n?T.dark:T.top,T.cx-T.S/2,T.cy-T.S/2,T.S,T.S);
  }
  ctx.setTransform(base);
}
{const _paint=WorldDestruction.prototype.paintOriginalObject;
 WorldDestruction.prototype.paintOriginalObject=function(target,o,assets){
   const Hz=pz3dPropHeight(o);
   if(this.__pz3dPaint||!this.__pz3dCtx||target!==this.__pz3dCtx||!Hz||!pz3dOn())return _paint.call(this,target,o,assets);
   pz3dStack(target,pz3dPropTex(this,o,assets),Hz,2);
 };
 const _draw=WorldDestruction.prototype.draw;
 WorldDestruction.prototype.draw=function(ctx,assets,camera){
   if(camera)pz3dCamera(camera,camera.viewport);
   this.__pz3dCtx=ctx;try{return _draw.call(this,ctx,assets,camera);}finally{this.__pz3dCtx=null;}
 };}

// ---------- muro de quarentena ----------
// O muro era pintado inclinado dentro das faixas da borda. Agora cada trecho é pintado num canvas próprio
// (mesmo desenho, mesma sequência aleatória) e desenhado como caixa 3D: topo + face + concertina.
const PZ_WALLS=[];
{const _run=WorldBorder.prototype.wallRun;
 WorldBorder.prototype.wallRun=function(ctx,side,a,b,rand){
   const R=1,H=this.H;let w;
   if(side==='left'){
     // vista de cima: x de -60 a -2
     const c=document.createElement('canvas');c.width=58*R;c.height=Math.ceil((b-a)*R);const x=c.getContext('2d');x.scale(R,R);x.translate(60,-a);
     _run.call(this,x,side,a,b,rand);
     // face de concreto para a lateral (outra semente, não mexe na sequência do mapa)
     const f=document.createElement('canvas');f.width=Math.ceil(b-a);f.height=56;const fx=f.getContext('2d');fx.translate(-a,66);
     _run.call(this,fx,'top',a,b,mulberry32(Math.round(a*13+b)));
     w={side,a,b,tex:c,face:f};
   }else{
     const y0=side==='top'?-66:H+4;
     const c=document.createElement('canvas');c.width=Math.ceil(b-a);c.height=56;const x=c.getContext('2d');x.translate(-a,-y0);
     _run.call(this,x,side,a,b,rand);
     // contato com o chão continua pintado no mapa (sombra), sem o muro
     if(side==='top'){const g=ctx.createLinearGradient(0,-10,0,30);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(a,-10,b-a,40);}
     else{const g=ctx.createLinearGradient(0,H+60,0,H+80);g.addColorStop(0,'rgba(0,0,0,.45)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(a,H+60,b-a,20);}
     w={side,a,b,tex:c,y0};
   }
   PZ_WALLS.push(w);
   if(side==='left'){ // sombra no chão do lado de dentro
     const g=ctx.createLinearGradient(-32,0,-2,0);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(-32,a,30,b-a);}
 };}
function pz3dDrawWall(ctx,w){
  const on=pz3dOn(),base=ctx.getTransform();
  ctx.save();ctx.imageSmoothingEnabled=true;
  if(w.side==='left'){
    if(!on){ctx.drawImage(w.tex,-60,w.a,58,w.b-w.a);ctx.restore();return;}
    // pé do T (no chão) e depois a caixa: face leste + topo
    ctx.drawImage(w.tex,28,0,30,w.tex.height,-32,w.a,30,w.b-w.a);
    const len=w.b-w.a,H=46;
    ctx.restore();ctx.save();
    // a face do muro esquerdo é desenhada em pé ao longo de y (coluna = posição ao longo do muro)
    pz3dWallAlong(ctx,base,w.face,-32,w.a,w.b,H);
    pz3dQuad(ctx,-32,w.a,-32,w.b,H,'rgba(0,0,0,.18)');
    const r0=pz3dP(-54,w.a,H),r1=pz3dP(-32,w.b,H);
    ctx.drawImage(w.tex,6,0,22,w.tex.height,r0.x,r0.y,r1.x-r0.x,r1.y-r0.y);
    ctx.restore();return;
  }
  if(!on){ctx.drawImage(w.tex,w.a,w.y0);ctx.restore();return;}
  const yb=w.y0+56,H=46;
  if(PZ_3D.vy>yb)pz3dWall(ctx,base,w.tex,0,10,w.tex.width,46,w.a,yb,w.b,yb,H,6);
  const r0=pz3dP(w.a,yb-10,H),r1=pz3dP(w.b,yb,H);
  ctx.drawImage(w.tex,0,0,w.tex.width,10,r0.x,r0.y,r1.x-r0.x,r1.y-r0.y);
  ctx.restore();
}
// Parede paralela ao eixo y em x=X, de y=a até y=b, textura com a face (largura = comprimento, altura 46+10).
function pz3dWallAlong(ctx,base,img,X,a,b,H){pz3dWall(ctx,base,img,0,10,img.width,46,X,a,X,b,H,6);}
function pzWallDrawables(camera){
  const out=[],vw=camera.viewport.width/camera.zoom/2+120,vh=camera.viewport.height/camera.zoom/2+120;
  for(const w of PZ_WALLS){
    if(w.side==='left'){if(Math.abs(-40-camera.x)>vw||w.b<camera.y-vh||w.a>camera.y+vh)continue;out.push({y:w.b,__tall:1,draw(ctx){pz3dDrawWall(ctx,w);}});}
    else if(w.side==='top'){if(camera.y-vh>0||w.b<camera.x-vw||w.a>camera.x+vw)continue;out.push({y:w.y0+56,__tall:1,draw(ctx){pz3dDrawWall(ctx,w);}});}
  }
  return out;
}
// O muro de baixo fica atrás de quem está do lado de fora (multidão): é desenhado antes dela.
{const _crowd=ExternalBarricadeCrowd.prototype.draw;
 ExternalBarricadeCrowd.prototype.draw=function(ctx,assets,bounds,ext,still){
   const cam=window.__projectZGame?.camera;
   if(cam){pz3dCamera(cam,cam.viewport);for(const w of PZ_WALLS)if(w.side==='bottom'&&bounds.y1>w.y0-120&&w.b>bounds.x0&&w.a<bounds.x1)pz3dDrawWall(ctx,w);}
   return _crowd.call(this,ctx,assets,bounds,ext,still);
 };}
// Fora da partida (menu ao fundo), postes e muros aparecem na vista antiga.
{const _wd=World.prototype.draw;
 World.prototype.draw=function(ctx,camera,ext){
   const r=_wd.call(this,ctx,camera,ext);
   if(document.querySelector('#app')?.dataset.scene!=='field'){
     ctx.save();camera.apply(ctx);const was=window.__PZ_FLAT3D;window.__PZ_FLAT3D=true;
     const items=[...pzPoleDrawables(camera,null),...pzWallDrawables(camera)].sort((a,b)=>a.y-b.y);
     for(const it of items)it.draw(ctx);
     window.__PZ_FLAT3D=was;ctx.restore();
   }
   return r;
 };}
