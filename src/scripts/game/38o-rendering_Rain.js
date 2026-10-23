// -- src/rendering/Rain.js --
// R37 · Poseidon + Hélio — chuva de verdade.
// Antes a chuva era uma grade de risquinhos iguais na tela. Agora cada gota existe no mundo, com altura:
//  • cai de verdade (altura z diminuindo) na mesma câmera 3D dos prédios (29g): gotas altas (perto da câmera) são
//    maiores, mais rápidas na tela e mais borradas; gotas baixas (perto do chão) são finas e curtas. Todas apontam
//    para o ponto de fuga, como chuva vista de cima;
//  • o vento (PZ_WIND, 38b) inclina e empurra as gotas, com rajadas;
//  • onde a gota cai, abre um respingo (coroa com gotinhas) no chão;
//  • cortinas de chuva: faixas de chuva mais forte que passam com o vento;
//  • em chuva forte, relâmpago (clarão duplo, sem tremer a tela) junto com o trovão.
const PZ_RAIN={drops:[],crowns:[],flash:0,flashT:0,lastT:0,init:false,cam:null};
function pzRainQuality(){
  const s=window.__projectZGame?.save?.settings||{};const q=s.weatherQuality||s.particlesQuality||'medium';
  return q==='low'?220:q==='high'?800:480;
}
function pzRainSpawn(d,camera,viewport,top){
  // escolhe um ponto da tela e uma altura e acha o lugar do mundo que cai ali
  const zoom=camera.zoom||1,vw=viewport.width/zoom/2+40,vh=viewport.height/zoom/2+40;
  d.z=top?260+Math.random()*180:Math.random()*440;
  const k=1+PZ_3D.a*d.z,sx=camera.x+(Math.random()*2-1)*vw,sy=camera.y+(Math.random()*2-1)*vh;
  d.x=PZ_3D.vx+(sx-PZ_3D.vx)/k;d.y=PZ_3D.vy+(sy-PZ_3D.vy)/k;
  d.v=430+Math.random()*160;d.len=.04+Math.random()*.025;d.seed=Math.random();
  return d;
}
function pzRainUpdate(dt,camera,viewport,env){
  const want=Math.round(pzRainQuality()*Math.min(1,(env.wet-.08)/.6));
  const D=PZ_RAIN.drops;
  if(!PZ_RAIN.init||Math.abs((PZ_RAIN.cam?.x??0)-camera.x)>900||Math.abs((PZ_RAIN.cam?.y??0)-camera.y)>900){D.length=0;PZ_RAIN.init=true;}
  PZ_RAIN.cam={x:camera.x,y:camera.y};
  while(D.length<want)D.push(pzRainSpawn({},camera,viewport,false));
  if(D.length>want)D.length=want;
  const gust=PZ_WIND.strength,wx=PZ_WIND.x*95*gust,wy=PZ_WIND.y*95*gust;
  const zoom=camera.zoom||1,vw=viewport.width/zoom/2+60,vh=viewport.height/zoom/2+60;
  for(const d of D){
    d.z-=d.v*dt;d.x+=wx*dt;d.y+=wy*dt;
    if(d.z<=0){
      // respingo onde a gota bateu (só dentro da tela)
      if(PZ_RAIN.crowns.length<160&&Math.abs(d.x-camera.x)<vw&&Math.abs(d.y-camera.y)<vh&&d.seed<.55)
        PZ_RAIN.crowns.push({x:d.x,y:d.y,t:0,life:.32+d.seed*.12,big:d.seed<.12});
      pzRainSpawn(d,camera,viewport,true);continue;
    }
    const p=pz3dP(d.x,d.y,d.z);
    if(Math.abs(p.x-camera.x)>vw+80||Math.abs(p.y-camera.y)>vh+80)pzRainSpawn(d,camera,viewport,false);
  }
  let n=0;const C=PZ_RAIN.crowns;for(const c of C){c.t+=dt;if(c.t<c.life)C[n++]=c;}C.length=n;
  // relâmpago: o clarão some rápido, com uma segunda piscada
  if(PZ_RAIN.flashT>0){PZ_RAIN.flashT-=dt;const t=.55-PZ_RAIN.flashT;PZ_RAIN.flash=t<0?0:t<.07?1:t<.13?.25:t<.2?.75:Math.max(0,.75*(1-(t-.2)/.35));}
  else PZ_RAIN.flash=0;
}
function pzRainDraw(ctx,viewport,run,camera,env,weatherMul){
  if(!camera)return false;
  pz3dCamera(camera,viewport);
  const now=run.elapsed||0;let dt=now-PZ_RAIN.lastT;PZ_RAIN.lastT=now;
  if(!(dt>0&&dt<.1))dt=dt>=.1?.1:0;
  pzRainUpdate(dt,camera,viewport,env);
  const wet=env.wet,w=viewport.width,h=viewport.height,zoom=camera.zoom||1;
  PZ_RAIN.lastWet=wet;PZ_RAIN.lastDraw=performance.now();
  ctx.save();
  // leve escurecida e tom azul-acinzentado do tempo fechado
  ctx.fillStyle=`rgba(60,74,92,${(.10*wet).toFixed(3)})`;ctx.fillRect(0,0,w,h);
  // cortinas de chuva passando com o vento
  {const t=performance.now()*.001,ang=Math.atan2(1,PZ_WIND.x*.45);
   ctx.save();ctx.translate(w/2,h/2);ctx.rotate(ang-Math.PI/2);
   for(let i=0;i<3;i++){const L=Math.hypot(w,h),off=((t*(60+i*25)*(.5+PZ_WIND.strength)+i*L/3)%(L*1.4))-L*.7,bw=L*(.18+.08*i);
     const g=ctx.createLinearGradient(off-bw,0,off+bw,0);g.addColorStop(0,'rgba(200,214,228,0)');g.addColorStop(.5,`rgba(200,214,228,${(.05*wet*weatherMul).toFixed(3)})`);g.addColorStop(1,'rgba(200,214,228,0)');
     ctx.fillStyle=g;ctx.fillRect(off-bw,-L,bw*2,L*2);}
   ctx.restore();}
  // gotas: do mundo para a tela; agrupadas em 3 camadas pela altura (espessura/brilho)
  const S=(p)=>({x:(p.x-camera.x)*zoom+w/2,y:(p.y-camera.y)*zoom+h/2});
  const gust=PZ_WIND.strength,wx=PZ_WIND.x*95*gust,wy=PZ_WIND.y*95*gust;
  const layers=[[],[],[]];
  for(const d of PZ_RAIN.drops){layers[d.z<120?0:d.z<280?1:2].push(d);}
  const style=[[.7,.34],[1.05,.28],[1.6,.2]];
  ctx.lineCap='round';
  for(let li=0;li<3;li++){
    ctx.lineWidth=style[li][0]*Math.max(.8,zoom*.8);
    ctx.strokeStyle=`rgba(205,220,234,${(style[li][1]+.25*wet).toFixed(3)})`;
    ctx.beginPath();
    for(const d of layers[li]){
      // a cauda é onde a gota estava um instante antes (mais alta e contra o vento)
      const a=S(pz3dP(d.x,d.y,d.z)),b=S(pz3dP(d.x-wx*d.len,d.y-wy*d.len,d.z+d.v*d.len));
      ctx.moveTo(b.x,b.y);ctx.lineTo(a.x,a.y);
    }
    ctx.stroke();
  }
  // cabeça das gotas mais próximas brilha um pouco
  ctx.fillStyle=`rgba(235,243,250,${(.25+.3*wet).toFixed(3)})`;
  for(const d of layers[2]){const a=S(pz3dP(d.x,d.y,d.z));ctx.fillRect(a.x-.8,a.y-.8,1.6,1.6);}
  // respingos: anel que abre + gotinhas que pulam
  ctx.lineWidth=Math.max(.7,zoom*.6);
  for(const c of PZ_RAIN.crowns){
    const k=c.t/c.life,p=S(c),r=(1.2+k*(c.big?7:4.5))*zoom;
    ctx.globalAlpha=(1-k)*.75*wet;ctx.strokeStyle='rgba(215,228,240,1)';
    ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.5,0,0,Math.PI*2);ctx.stroke();
    if(k<.6){const up=Math.sin(k/.6*Math.PI)*(c.big?5:3)*zoom;ctx.fillStyle='rgba(225,236,246,1)';
      for(let i=0;i<(c.big?5:3);i++){const an=i/(c.big?5:3)*Math.PI*2+c.x;ctx.fillRect(p.x+Math.cos(an)*r*.8-.6,p.y+Math.sin(an)*r*.4-up-.6,1.2,1.2);}}
  }
  ctx.globalAlpha=1;ctx.restore();
  return true;
}
// Clarão do relâmpago por cima de tudo (depois da escuridão da noite), sem tremer a tela.
function pzRainFlashDraw(ctx,viewport){
  if(!(PZ_RAIN.flash>0))return;
  ctx.save();ctx.globalCompositeOperation='screen';
  ctx.fillStyle=`rgba(200,214,240,${(.62*PZ_RAIN.flash).toFixed(3)})`;ctx.fillRect(0,0,viewport.width,viewport.height);
  ctx.restore();
}
{const _l=Q04_LIGHTING.draw;Q04_LIGHTING.draw=function(ctx,viewport){const r=_l.apply(this,arguments);pzRainFlashDraw(ctx,viewport);return r;};}
// O trovão do som (AudioSystem) puxa o relâmpago junto.
{const P=AudioSystem.prototype,_u=P.updateEnvironment;
 if(_u)P.updateEnvironment=function(dt,weather){const before=this.thunderCooldown;const r=_u.apply(this,arguments);
   /* R42: relâmpago só com chuva de verdade caindo na tela */if(this.thunderCooldown>before+1&&!window.__projectZGame?.save?.settings?.reducedMotion&&(PZ_RAIN.lastWet||0)>.55&&performance.now()-(PZ_RAIN.lastDraw||0)<1000&&PZ_RAIN.drops.length>40)PZ_RAIN.flashT=.55;return r;};}
// Ferramenta de teste: window.__PZ_RAIN_FORCE=0..1 força a intensidade da chuva.
{const _g=Q04_ENVIRONMENT.get.bind(Q04_ENVIRONMENT);Q04_ENVIRONMENT.get=function(t,p){const e=_g(t,p);const f=window.__PZ_RAIN_FORCE;if(typeof f==='number'&&e)e.wet=f;return e;};}
