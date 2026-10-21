// -- src/rendering/RealLight.js --
// ATLAS A9 · Apolo — luz de verdade.
// Antes a noite era uma camada escura "furada" pelas luzes: tudo ficava cinza-azulado e as luzes eram só buracos.
// Agora a noite é um MAPA DE LUZ multiplicado sobre a cena, como num motor de jogo:
//   cena × (luar azul + soma das luzes coloridas)
// Cada luz tem cor e queda física (inverso do quadrado, suavizada): postes de sódio alaranjados, postes de LED
// brancos-frios, janelas com lâmpada quente ou fluorescente, letreiros, fogo, faróis de xenônio ou halógenos,
// lanterna levemente azulada. Postes projetam sombras dos prédios e carros (calculadas uma vez e guardadas).
// Depois da multiplicação entram só os brilhos que a câmera vê no ar: lâmpada estourando (bloom), cone de luz
// do poste com chuva atravessando, halos na neblina, lanternas traseiras dos carros.

const PZ_LUX=Object.freeze({
  moon:[20,28,52],                 // cor do luar (o que sobra da cena sem nenhuma luz)
  sodium:[255,146,58],led:[205,222,255],tungsten:[255,182,104],fluo:[206,232,255],tv:[120,160,255],
  fire:[255,118,42],flash:[228,238,255],xenon:[222,232,255],halogen:[255,216,150],tail:[255,24,18],muzzle:[255,196,120],
});
const PZ_LUX_CACHE=new Map();

// Sprite de luz: queda física 1/(1+(d/r0)²) com janela suave até zero na borda.
function pzLuxSprite(rgb,r0=.2,gain=1){
  const key='s'+rgb.join(',')+':'+r0+':'+gain;let c=PZ_LUX_CACHE.get(key);if(c)return c;
  const S=96;c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData(S,S),d=img.data;
  const norm=gain;
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){
    const dx=(i+.5)/S*2-1,dy=(j+.5)/S*2-1,r=Math.hypot(dx,dy);const k=(j*S+i)*4;
    if(r>=1){d[k+3]=0;continue;}
    const w=(1-r*r);const I=Math.min(1,norm/(1+(r/r0)*(r/r0))*w*w);
    d[k]=rgb[0];d[k+1]=rgb[1];d[k+2]=rgb[2];d[k+3]=Math.round(I*255);
  }
  x.putImageData(img,0,0);PZ_LUX_CACHE.set(key,c);return c;
}
// Pegada do farol no chão (aponta para +x): cone com bordas macias, mais forte a ~25% do alcance.
function pzBeamSprite(rgb){
  const key='b'+rgb.join(',');let c=PZ_LUX_CACHE.get(key);if(c)return c;
  const W=160,H=96;c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),img=x.createImageData(W,H),d=img.data;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const u=(i+.5)/W,v=((j+.5)/H-.5)*2;const k=(j*W+i)*4;
    const ang=Math.abs(Math.atan2(v*.6,u+.02));
    const side=Math.max(0,Math.min(1,(.46-ang)/.22));
    const along=Math.min(1,u/.12)*Math.pow(1-u,1.5)*1.25+Math.max(0,.35-u)*1.4;
    const I=Math.min(1,side*side*(3-2*side)*along);
    d[k]=rgb[0];d[k+1]=rgb[1];d[k+2]=rgb[2];d[k+3]=Math.round(I*255);
  }
  x.putImageData(img,0,0);PZ_LUX_CACHE.set(key,c);return c;
}

// Lista fixa de luzes do cenário (postes do mapa + postes e refletores das bordas + letreiros).
function pzLuxStatic(world){
  if(world.__lux)return world.__lux;
  const out=[];
  const lamp=(x,y,radius,flicker,phase,seedTag)=>{
    const h=pzLampHead(x,y),rnd=mulberry32(Math.round(x*17+y*29+(seedTag||0)));
    const kind=rnd()<.82?'led':'sodium'; // A10: SP trocou ~90% do parque por LED; sobram alguns de sódio
    out.push({type:'lamp',x:h.gx,y:h.gy,hx:h.x,hy:h.y,R:Math.max(120,(radius||84)*1.75),rgb:PZ_LUX[kind],kind,flicker:flicker||0,phase:phase||0,p:kind==='led'?1.05:1.15,shadow:true});
  };
  for(const l of world.lampLights||[])lamp(l.x,l.y,l.radius,l.flicker,l.phase);
  for(const l of world.border?.lamps||[])lamp(l.x,l.y,84,l.flicker||0,l.phase||0,7);
  for(const f of world.border?.floods||[])out.push({type:'flood',x:f.gx,y:f.gy,hx:f.x,hy:f.y,R:f.R||210,rgb:PZ_LUX.led,kind:'led',flicker:f.flicker||0,phase:f.phase||0,p:1.1,shadow:false});
  for(const l of world.lights||[]){const rgb=pzLuxHex(l.color);out.push({type:'sign',x:l.x,y:l.y+18,R:(l.radius||140)*1.05,rgb,flicker:l.flicker||0,phase:l.phase||0,p:.75,shadow:false});}
  world.__lux=out;return out;
}
function pzLuxHex(hex){const v=String(hex||'#ffffff').replace('#','');return [parseInt(v.slice(0,2),16),parseInt(v.slice(2,4),16),parseInt(v.slice(4,6),16)];}
// Falha de lâmpada velha: quase sempre acesa, com apagões curtos e zumbido.
function pzLuxFlicker(l,t){
  if(!l.flicker)return 1;
  const a=Math.sin(t*l.flicker*.37+l.phase)+Math.sin(t*l.flicker*.91+l.phase*2.3)*.6;
  if(a>1.25)return .06;
  return .9+.1*Math.sin(t*60+l.phase);
}
// Poste com sombras: luz desenhada uma vez num canvas próprio, com os obstáculos recortando sombras.
function pzLuxBake(l){
  if(l.bake!==undefined)return l.bake;
  const res=.5,R=l.R,S=Math.ceil(R*2*res);const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  x.drawImage(pzLuxSprite(l.rgb,.45,2.2),0,0,S,S);
  if(l.shadow&&typeof nearbyObstacles==='function'){
    x.save();x.scale(res,res);x.translate(R-l.x,R-l.y);x.globalCompositeOperation='destination-out';
    try{x.filter='blur(1.5px)';}catch(e){}
    for(const o of nearbyObstacles(l.x-R,l.y-R,l.x+R,l.y+R)){
      if(o.barrel)continue;
      if(l.x>o.x-2&&l.x<o.x+o.w+2&&l.y>o.y-2&&l.y<o.y+o.h+2)continue;
      const big=o.w*o.h>5200,pts=[[o.x,o.y],[o.x+o.w,o.y],[o.x+o.w,o.y+o.h],[o.x,o.y+o.h]];
      x.fillStyle=big?'rgba(0,0,0,.92)':'rgba(0,0,0,.7)';x.beginPath();
      for(let i=0;i<4;i++){
        const a=pts[i],b=pts[(i+1)%4],nx=b[1]-a[1],ny=a[0]-b[0],mx=(a[0]+b[0])/2-l.x,my=(a[1]+b[1])/2-l.y;
        if(nx*mx+ny*my<=0)continue;
        const da=Math.hypot(a[0]-l.x,a[1]-l.y)||1,db=Math.hypot(b[0]-l.x,b[1]-l.y)||1;
        const La=big?R*2:Math.min(80,da*.45),Lb=big?R*2:Math.min(80,db*.45);
        x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);x.lineTo(b[0]+(b[0]-l.x)/db*Lb,b[1]+(b[1]-l.y)/db*Lb);x.lineTo(a[0]+(a[0]-l.x)/da*La,a[1]+(a[1]-l.y)/da*La);x.closePath();
      }
      x.fill();
    }
    x.restore();
  }
  l.bake=c;return c;
}

// Faróis e lanternas traseiras dos carros abandonados que ainda têm bateria.
PzLightMap.prototype.carLights=function(run,camera){
  const out=[],objs=run.destructibles?.objects||[];const t=this.time;
  const vw=camera.viewport.width/camera.zoom/2+260,vh=camera.viewport.height/camera.zoom/2+260;
  for(const o of objs){
    if(o.visual?.kind!=='civilian'||!o.alive||o.exploded)continue;const v=o.visual.v;
    if(Math.abs(v.x-camera.x)>vw||Math.abs(v.y-camera.y)>vh)continue;
    const r=mulberry32(Math.round(v.x*13+v.y*7));if(r()>.36)continue;
    const flicker=r()<.3,brokenSide=r()<.35?(r()<.5?-1:1):0,xen=r()<.45;
    let k=1;if(flicker){const f=Math.sin(t*17+v.x)+Math.sin(t*5.3+v.y*.1);k=f>1.4?.12:(.85+.15*Math.sin(t*40+v.x));}
    const w=v.kind==='van'?47:v.kind==='pickup'?43:v.kind==='hatch'?36:37,h=v.kind==='van'?89:v.kind==='pickup'?82:v.kind==='hatch'?60:70;
    const a=v.angle,ca=Math.cos(a),sa=Math.sin(a),face=Math.atan2(-ca,sa);
    const P=(lx,ly)=>({x:v.x+lx*ca-ly*sa,y:v.y+lx*sa+ly*ca});
    for(const side of[-1,1]){
      if(side!==brokenSide){const q=P(side*(w/2-7),-h/2+1);out.push({x:q.x,y:q.y,face:face+side*.04,k,rgb:xen?PZ_LUX.xenon:PZ_LUX.halogen,head:1});}
      const q2=P(side*(w/2-6),h/2-2);out.push({x:q2.x,y:q2.y,face:face+Math.PI,k:k*.9,rgb:PZ_LUX.tail,head:0});
    }
  }
  return out;
};
PzLightMap.prototype.headlights=function(run,camera){return (this.carLights(run,camera)).filter(c=>c.head).map(c=>({x:c.x,y:c.y,face:c.face,k:c.k,warm:c.rgb===PZ_LUX.halogen}));};

const _pzLuxOldDraw=PzLightMap.prototype.draw;
PzLightMap.prototype.draw=function(ctx,viewport,run,camera,world){
  if(window.__PZ_OLD_LIGHT)return _pzLuxOldDraw.call(this,ctx,viewport,run,camera,world);
  try{return this.drawLux(ctx,viewport,run,camera,world);}
  catch(e){console.warn('[PROJECT Z] luz nova falhou, voltando à antiga',e);window.__PZ_OLD_LIGHT=1;return _pzLuxOldDraw.call(this,ctx,viewport,run,camera,world);}
};
PzLightMap.prototype.drawLux=function(ctx,viewport,run,camera,world){
  const now=performance.now()/1000;this.time+=Math.min(.1,Math.max(0,now-(this.last||now)));this.last=now;
  const env=Q04_ENVIRONMENT.get(run.elapsed||0,true);
  const quality=this.quality(),w=viewport.width,h=viewport.height,t=this.time;
  this.env=env;this.flashOn=0;this.vis=null;
  if(window.__PZ_DIAG&&!window.__PZ_DIAG.light)return;
  if(quality==='high'||(quality!=='low'&&Math.max(env.fog||0,env.dark*.55)>.28))this.drawFog(ctx,viewport,camera,env);
  const A=PZ_LIGHT_CFG.nightDarkness*smoothstep(.05,.95,env.dark);
  this.cars=[];
  if(A<.02)return;
  const scale=quality==='high'?.6:quality==='low'?.35:.5;
  this.ensure(w,h,scale);
  const L=this.lc,p=run.player,M=PZ_LUX.moon;
  // 1) luar: o que a cena recebe sem nenhuma luz
  L.setTransform(1,0,0,1,0,0);L.globalCompositeOperation='source-over';L.globalAlpha=1;
  const amb=M.map(c=>Math.round(255*(1-A)+c*A));
  L.fillStyle=`rgb(${amb[0]},${amb[1]},${amb[2]})`;L.fillRect(0,0,this.L.width,this.L.height);
  this.apply(L,camera,scale);
  L.globalCompositeOperation='lighter';
  const s=smoothstep(.05,.7,env.dark);
  const vw=camera.viewport.width/camera.zoom/2,vh=camera.viewport.height/camera.zoom/2;
  const inView=(x,y,R)=>Math.abs(x-camera.x)<vw+R&&Math.abs(y-camera.y)<vh+R;
  const put=(spr,x,y,R,a)=>{if(a<=.003)return;L.globalAlpha=Math.min(1,a);L.drawImage(spr,x-R,y-R,R*2,R*2);};
  // 2) luzes fixas (postes com sombras assadas, refletores, letreiros)
  const vis=[];
  for(const l of pzLuxStatic(world)){
    if(!inView(l.x,l.y,l.R))continue;
    const k=pzLuxFlicker(l,t);vis.push({l,k});
    if(l.type==='lamp')put(pzLuxBake(l),l.x,l.y,l.R,l.p*k*s);
    else if(l.type==='flood'){put(pzLuxSprite(l.rgb,.45,1.6),l.x,l.y,l.R,l.p*k*s);}
    else{const pulse=.9+.1*Math.sin(t*2.8+l.phase);put(pzLuxSprite(l.rgb,.16),l.x,l.y,l.R,l.p*k*pulse*s);}
  }
  this.vis=vis;
  // 3) prédios: janelas acesas brilham e jogam luz na calçada
  this.tall=[];
  for(const b of PZ_TALL.list){
    if(!inView(b.x+b.w/2,b.y-b.H/2,b.w/2+b.H+40))continue;
    const c=pzTallCache(b);this.tall.push(b);
    if(c.emis){L.globalAlpha=Math.min(1,(.55+.45*b.alpha)*s);L.drawImage(c.emis,b.x-c.pad,b.y-b.H-c.pad,b.w+c.pad*2,b.h+b.H+c.pad*2);}
    for(const q of c.spill||[])put(pzLuxSprite(q.rgb,.35,1.3),b.x+q.x,b.y+b.h+q.y,q.R,q.p*s);
  }
  // 4) fogo, tiros, explosões
  for(const f of world.fireLights||[]){if(!inView(f.x,f.y,200))continue;const fl=.82+Math.sin(t*13+f.x)*.1+Math.sin(t*23+f.y)*.08;put(pzLuxSprite(PZ_LUX.fire,.3,1.4),f.x,f.y,(f.radius||90)*1.6*fl,1.05*fl*s);}
  const extFires=world.border?.fires;if(extFires)for(const f of extFires){if(f.x==null||!inView(f.x,f.y,150))continue;const fl=.8+Math.sin(t*11+f.p)*.12;put(pzLuxSprite(PZ_LUX.fire,.2),f.x,f.y,110*(f.s||1)*fl,.9*fl*s);}
  for(const f of run.gun?.flashes||[]){const k=Math.max(0,f.life/f.maxLife);put(pzLuxSprite(PZ_LUX.muzzle,.18),f.x,f.y,weaponFeel(f.weapon).light*1.9,1.1*k);}
  for(const b of run.barrels?.blasts||[])put(pzLuxSprite(PZ_LUX.fire,.25),b.x,b.y,300,Math.min(1,b.life*2.4)*1.3);
  for(const b of run.grenades?.blasts||[])put(pzLuxSprite(PZ_LUX.muzzle,.25),b.x,b.y,280,Math.min(1,b.life*2.4)*1.3);
  for(const q of run.worldFX?.shock||[])put(pzLuxSprite(PZ_LUX.muzzle,.25),q.x,q.y,q.r*2.4,Math.min(1,q.life/q.total*1.6));
  // 5) faróis (pegada no chão) e lanternas traseiras
  const cars=this.carLights(run,camera);this.cars=cars.filter(c=>c.head).map(c=>({x:c.x,y:c.y,face:c.face,k:c.k,warm:c.rgb===PZ_LUX.halogen}));this.carAll=cars;
  for(const c of cars){
    if(c.head){const spr=pzBeamSprite(c.rgb);L.save();L.translate(c.x,c.y);L.rotate(c.face);L.globalAlpha=Math.min(1,1.15*c.k*s);L.drawImage(spr,-8,-62,250,124);L.restore();
      put(pzLuxSprite(c.rgb,.2),c.x,c.y,30,.8*c.k*s);}
    else put(pzLuxSprite(c.rgb,.18),c.x+Math.cos(c.face)*6,c.y+Math.sin(c.face)*6,34,.55*c.k*s);
  }
  // 6) jogador: um pouco de luz própria (reflexo do equipamento) e a lanterna com sombras
  put(pzLuxSprite(PZ_LUX.flash,.3),p.x,p.y,PZ_LIGHT_CFG.personal.radius*1.25,.42);
  const fl=PZ_LIGHT_CFG.flashlight,flashOn=smoothstep(.25,.75,env.dark)*(p.alive!==false?1:0);
  this.flashOn=flashOn;
  if(flashOn>.01){
    const T=this.tc,half=Math.acos(fl.cos),face=p.facing||0;
    T.setTransform(1,0,0,1,0,0);T.globalCompositeOperation='source-over';T.globalAlpha=1;T.clearRect(0,0,this.T.width,this.T.height);
    this.apply(T,camera,scale);
    const C=PZ_LUX.flash,g=T.createRadialGradient(p.x,p.y,6,p.x,p.y,fl.range);
    g.addColorStop(0,`rgba(${C},${fl.power*flashOn})`);g.addColorStop(.18,`rgba(${C},${.95*flashOn})`);g.addColorStop(.6,`rgba(${C},${.55*flashOn})`);g.addColorStop(1,`rgba(${C},0)`);
    T.fillStyle=g;
    for(const [kk,a] of [[1.2,.3],[1,.5],[.75,.85],[.4,1]]){T.globalAlpha=a;T.beginPath();T.moveTo(p.x,p.y);T.arc(p.x,p.y,fl.range,face-half*kk,face+half*kk);T.closePath();T.fill();}
    T.globalAlpha=1;
    if(quality!=='low'){T.globalCompositeOperation='destination-out';this.castShadows(T,p.x,p.y,fl.range,run.enemies,quality);}
    L.setTransform(1,0,0,1,0,0);L.globalAlpha=1;L.drawImage(this.T,0,0);
  }
  L.globalAlpha=1;L.globalCompositeOperation='source-over';
  // 7) a cena é multiplicada pelo mapa de luz
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalCompositeOperation='multiply';
  ctx.drawImage(this.L,0,0,w,h);
  // exposição: superfícies escuras (asfalto) sob luz forte ficam claras como numa foto noturna
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.34*smoothstep(.1,.8,env.dark);
  ctx.drawImage(this.L,0,0,w,h);
  ctx.restore();
};

// Depois da multiplicação: o que se vê no ar.
const _pzLuxOldAfter=PzLightMap.prototype.drawAfter;
PzLightMap.prototype.drawAfter=function(ctx,viewport,run,camera){
  if(window.__PZ_OLD_LIGHT)return _pzLuxOldAfter.call(this,ctx,viewport,run,camera);
  const env=this.env||Q04_ENVIRONMENT.get(run.elapsed||0,true),quality=this.quality(),p=run.player;
  const reduced=window.__projectZGame?.save?.settings?.reducedMotion;
  if(window.__PZ_DIAG&&!window.__PZ_DIAG.light){PZ_POST.update(env,quality,reduced);return;}
  const s=smoothstep(.12,.7,env.dark),t=this.time;
  ctx.save();camera.apply(ctx);
  if(s>.01){
    const air=Math.min(1.6,.6+(env.fog||0)*.8+(env.wet||0)*.5); // quanto o ar espalha a luz
    ctx.globalCompositeOperation='lighter';
    // lanterna: leve véu no ar + poeira/chuva no feixe
    if(this.flashOn>.01){
      const fl=PZ_LIGHT_CFG.flashlight,half=Math.acos(fl.cos),face=p.facing||0;
      const g=ctx.createRadialGradient(p.x,p.y,4,p.x,p.y,fl.range);
      g.addColorStop(0,`rgba(200,214,240,${.10*this.flashOn*air})`);g.addColorStop(.5,`rgba(170,190,230,${.035*this.flashOn*air})`);g.addColorStop(1,'rgba(170,190,230,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,fl.range,face-half*.85,face+half*.85);ctx.closePath();ctx.fill();
      if(quality!=='low')this.drawDust(ctx,p,face,half,fl.range,reduced);
    }
    // postes: cone de luz descendo da luminária, chuva atravessando e a lâmpada estourando
    for(const {l,k} of this.vis||[]){
      if(l.type==='sign')continue;const a=k*s,C=l.rgb.join(',');
      if(l.hx!=null){
        if(quality!=='low'){
          const top=l.hy+2,bot=l.y,wTop=4,wBot=l.type==='flood'?70:46;
          const g=ctx.createLinearGradient(0,top,0,bot);g.addColorStop(0,`rgba(${C},${.16*a*air})`);g.addColorStop(1,`rgba(${C},0)`);
          ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(l.hx-wTop,top);ctx.lineTo(l.hx+wTop,top);ctx.lineTo(l.x+wBot,bot);ctx.lineTo(l.x-wBot,bot);ctx.closePath();ctx.fill();
          if((env.wet||0)>.15&&!reduced){ctx.fillStyle=`rgba(${C},${.5*a})`;
            for(let i=0;i<9;i++){const ph=(t*1.9+i*.311+l.x*.013)%1,yy=top+ph*(bot-top),spread=wTop+(wBot-wTop)*ph,xx=l.hx+(l.x-l.hx)*ph+(((i*73+Math.floor(t*1.9+i*.311))%97)/97-.5)*2*spread*.8;
              ctx.globalAlpha=(1-ph)*.7*(env.wet||0);ctx.fillRect(xx,yy,.8,5);}
            ctx.globalAlpha=1;}
        }
        ctx.drawImage(pzLuxSprite(l.rgb,.12),l.hx-26,l.hy-26,52,52);ctx.globalAlpha=1;
        const hg=ctx.createRadialGradient(l.hx,l.hy,0,l.hx,l.hy,7);hg.addColorStop(0,`rgba(255,255,248,${.95*a})`);hg.addColorStop(1,`rgba(${C},0)`);
        ctx.fillStyle=hg;ctx.fillRect(l.hx-7,l.hy-7,14,14);
        ctx.globalAlpha=Math.min(1,.16*a*air);ctx.drawImage(pzLuxSprite(l.rgb,.3),l.hx-70,l.hy-70,140,140);ctx.globalAlpha=1;
      }
    }
    // faróis: feixe que só aparece onde há chuva/neblina, mais o brilho das lâmpadas e lanternas traseiras
    for(const c of this.carAll||[]){
      const C=c.rgb.join(','),a=c.k*s;
      if(c.head){
        const vol=.45*air*a,g=ctx.createRadialGradient(c.x,c.y,2,c.x,c.y,210);g.addColorStop(0,`rgba(${C},${.16*vol})`);g.addColorStop(.4,`rgba(${C},${.06*vol})`);g.addColorStop(1,`rgba(${C},0)`);
        ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.arc(c.x,c.y,210,c.face-.3,c.face+.3);ctx.closePath();ctx.fill();
        ctx.globalAlpha=Math.min(1,.9*a);ctx.drawImage(pzLuxSprite(c.rgb,.1),c.x-16,c.y-16,32,32);
        ctx.globalAlpha=Math.min(1,.1*a*air);ctx.drawImage(pzLuxSprite(c.rgb,.3),c.x-50,c.y-50,100,100);ctx.globalAlpha=1;
        if(quality!=='low'&&!reduced){ctx.fillStyle=`rgb(${C})`;
          for(let i=0;i<12;i++){const ph=(t*.6+i*.137+c.x*.01)%1,d=20+((i*53)%170),off=(((i*37)%100)/100-.5)*.5;
            const x=c.x+Math.cos(c.face+off)*d+Math.sin(t*2+i)*3,y=c.y+Math.sin(c.face+off)*d+ph*14-7;ctx.globalAlpha=(1-d/200)*.45*a*air*.6;ctx.fillRect(x,y,1.1,1.1+((env.wet||0)>.2?3:0));}
          ctx.globalAlpha=1;}
      }else{ctx.globalAlpha=Math.min(1,.8*a);ctx.drawImage(pzLuxSprite(c.rgb,.12),c.x-9,c.y-9,18,18);ctx.globalAlpha=1;}
    }
    if(typeof pzSignsGlint==='function')pzSignsGlint(ctx,p,this.flashOn,this.cars);
    // janelas acesas: um leve brilho em volta (a luz "vaza" na câmera)
    if(quality!=='low')for(const b of this.tall||[]){const c=b.cache;if(!c?.glow)continue;ctx.globalAlpha=.55*s*b.alpha;ctx.drawImage(c.glow,b.x-c.pad,b.y-b.H-c.pad,b.w+c.pad*2,b.h+b.H+c.pad*2);ctx.globalAlpha=1;}
    ctx.globalCompositeOperation='source-over';
  }
  if(env.dark>.15)for(const f of run.gun?.flashes||[])drawMuzzleFlash(ctx,f);
  ctx.restore();
  PZ_POST.update(env,quality,reduced);
};

// O brilho colorido antigo (tela) foi substituído pela luz física acima.
if(typeof Q04NightLights!=='undefined'){const _q=Q04NightLights.prototype.draw;Q04NightLights.prototype.draw=function(...a){if(window.__PZ_OLD_LIGHT)return _q.apply(this,a);};}
