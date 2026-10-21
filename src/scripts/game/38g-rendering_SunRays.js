// -- src/rendering/SunRays.js --
// ATLAS A13 · Hélio — o sol vem da praia (leste). De dia, a luz atravessa o ar entre os prédios em feixes
// (volumetria): o ar iluminado fica dourado e, atrás de cada prédio, fica a "sombra no ar", que se apaga com a
// distância. Feito numa camada pequena (¼ da tela), suavizada ao ampliar e somada à imagem com "screen".
// Some ao anoitecer, com neblina forte e com chuva.
const PZ_SUN=Object.freeze({dir:(()=>{const x=-1,y=.22,l=Math.hypot(x,y);return[x/l,y/l];})(),warm:'255,206,140',hot:'255,226,178'});
const _pzSunState={cv:null,cx:null,motes:null,t:0,last:0};

function pzSunDay(env){
  const dark=env?.dark||0,fog=env?.fog||0,wet=env?.wet||0;
  return Math.max(0,(1-smoothstep(.06,.42,dark))*(1-.6*fog)*(1-.65*wet));
}
// Envoltória convexa (cadeia monótona) — sombra do retângulo do prédio arrastado na direção do sol.
function pzHull(p){
  p=p.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[],up=[];
  for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}
  for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}
  return lo.slice(0,-1).concat(up.slice(0,-1));
}

function pzSunRays(ctx,viewport,run,camera,env,quality){
  const day=pzSunDay(env);if(day<.03||!camera||quality==='low')return; // qualidade baixa: sem feixes (economia no celular)
  const S=_pzSunState,now=performance.now()/1000;S.t+=Math.min(.1,Math.max(0,now-(S.last||now)));S.last=now;
  const sc=quality==='high'?.3:.22,W=Math.max(8,Math.ceil(viewport.width*sc)),H=Math.max(8,Math.ceil(viewport.height*sc));
  if(!S.cv||S.cv.width!==W||S.cv.height!==H){S.cv=document.createElement('canvas');S.cv.width=W;S.cv.height=H;S.cx=S.cv.getContext('2d');}
  const c=S.cx,[dx,dy]=PZ_SUN.dir;
  c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.globalAlpha=1;c.clearRect(0,0,W,H);
  c.setTransform(sc,0,0,sc,0,0);camera.apply(c);
  const z=camera.zoom,vw=viewport.width/z,vh=viewport.height/z,x0=camera.x-vw/2,y0=camera.y-vh/2;
  // ar iluminado: mais quente do lado da praia
  const g=c.createLinearGradient(x0,y0,x0+vw,y0+vh*.25);
  g.addColorStop(0,`rgba(${PZ_SUN.warm},.30)`);g.addColorStop(1,`rgba(${PZ_SUN.hot},.62)`);
  c.fillStyle=g;c.fillRect(x0-20,y0-20,vw+40,vh+40);
  // feixes: faixas na direção do sol, com intensidade que respira devagar
  const nx=-dy,ny=dx,span=vw+vh;c.globalCompositeOperation='lighter';
  const camP=camera.x*nx+camera.y*ny,SP=70;
  for(let k=Math.floor((camP-span/2)/SP);k<=Math.ceil((camP+span/2)/SP);k++){
    const h=Math.abs(Math.sin(k*12.9898)*43758.5453)%1;if(h<.35)continue; // nem toda faixa tem feixe
    const off=k*SP+h*SP*.6-camP,wob=Math.sin(S.t*.35+k*1.7)*.5+.5;
    const cx=camera.x+nx*off,cy=camera.y+ny*off,wd=6+h*22;
    c.globalAlpha=.10+.20*wob*h;c.fillStyle=`rgb(${PZ_SUN.hot})`;
    c.beginPath();c.moveTo(cx-dx*span+nx*wd,cy-dy*span+ny*wd);c.lineTo(cx+dx*span+nx*wd,cy+dy*span+ny*wd);
    c.lineTo(cx+dx*span-nx*wd,cy+dy*span-ny*wd);c.lineTo(cx-dx*span-nx*wd,cy-dy*span-ny*wd);c.closePath();c.fill();
  }
  c.globalAlpha=1;
  // sombra no ar atrás de cada prédio (do lado oposto ao sol), que se dissolve com a distância
  c.globalCompositeOperation='destination-out';
  if(typeof PZ_TALL!=='undefined')for(const b of PZ_TALL.list){
    const L=240+b.H*2.4;
    const rx=b.x,ry=b.y-b.H,rw=b.w,rh=b.h+b.H;
    if(rx+rw<x0-20||ry>y0+vh+20)continue;
    if(rx+dx*L>x0+vw+20&&rx>x0+vw+20)continue;
    if(ry+rh+Math.max(0,dy*L)<y0-20)continue;
    const pts=[[rx,ry],[rx+rw,ry],[rx+rw,ry+rh],[rx,ry+rh]];
    const hull=pzHull(pts.concat(pts.map(([px,py])=>[px+dx*L,py+dy*L])));
    const mx=rx+rw/2,my=ry+rh/2,sg=c.createLinearGradient(mx,my,mx+dx*L,my+dy*L);
    sg.addColorStop(0,'rgba(0,0,0,.96)');sg.addColorStop(.45,'rgba(0,0,0,.7)');sg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=sg;c.beginPath();c.moveTo(hull[0][0],hull[0][1]);for(let i=1;i<hull.length;i++)c.lineTo(hull[i][0],hull[i][1]);c.closePath();c.fill();
  }
  c.globalCompositeOperation='source-over';
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.min(1,day*.56);
  ctx.drawImage(S.cv,0,0,viewport.width,viewport.height);
  // poeira dourada flutuando nos feixes
  if(quality!=='low'&&!window.__projectZGame?.save?.settings?.reducedMotion){
    if(!S.motes){const r=mulberry32(4242);S.motes=Array.from({length:46},()=>({x:r()*600-300,y:r()*600-300,ph:r()*6.28}));}
    ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgb(${PZ_SUN.hot})`;
    const px=run?.player?.x??camera.x,py=run?.player?.y??camera.y;
    for(const m of S.motes){
      const wx=px+((m.x+S.t*6*dx*-1+Math.sin(S.t*.4+m.ph)*8+300)%600+600)%600-300;
      const wy=py+((m.y+Math.cos(S.t*.3+m.ph)*8+300)%600+600)%600-300;
      const s=camera.worldToScreen(wx,wy);
      if(s.x<0||s.y<0||s.x>viewport.width||s.y>viewport.height)continue;
      ctx.globalAlpha=day*(.18+.18*Math.sin(S.t*1.3+m.ph));
      ctx.fillRect(s.x,s.y,1.6*z,1.6*z);
    }
  }
  ctx.restore();
}

const _pzSunDrawAfter=PzLightMap.prototype.drawAfter;
PzLightMap.prototype.drawAfter=function(ctx,viewport,run,camera){
  if(!(window.__PZ_DIAG&&!window.__PZ_DIAG.light)){
    const env=this.env||Q04_ENVIRONMENT.get(run.elapsed||0,true);
    try{pzSunRays(ctx,viewport,run,camera,env,this.quality());}catch(e){if(!window.__pzSunErr){window.__pzSunErr=1;console.warn('sol',e);}}
  }
  return _pzSunDrawAfter.call(this,ctx,viewport,run,camera);
};
