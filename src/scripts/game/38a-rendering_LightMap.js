// -- src/rendering/LightMap.js --
// CRONOS C3 · Apolo — "Noite de verdade".
// Um mapa de luz em baixa resolução escurece a cena de verdade à noite e é recortado
// por lanterna (com sombras de prédios, carros e inimigos), postes, fogo, tiros e explosões.
// Depois vêm o feixe volumétrico com poeira, neblina, gradação de cor e granulação.
// Qualidade de iluminação: baixa = sem sombras/poeira/grão; média = padrão; alta = mais resolução.

const PZ_LIGHT_CFG=Object.freeze({
  nightDarkness:.80,          // opacidade máxima da escuridão (0–1)
  darkColor:'6,10,22',        // cor da escuridão (azul-noite)
  personal:{radius:62,power:.55},
  flashlight:{range:290,cos:.72,power:.96}, // mesmo cone da regra de jogo das criaturas noturnas
  shadowReach:620,
});

const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

class PzLightMap {
  constructor(){
    this.L=document.createElement('canvas');this.T=document.createElement('canvas');
    this.lc=this.L.getContext('2d');this.tc=this.T.getContext('2d');
    this.time=0;this.last=0;
    this.dust=Array.from({length:46},(_,i)=>({x:Math.random()*600-300,y:Math.random()*600-300,
      vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,ph:Math.random()*6.28,s:.7+Math.random()*1.3}));
    this.fog=null;this.grain=null;
  }
  quality(){return graphicLevel(window.__projectZGame?.save?.settings?.lightingQuality);}
  ensure(w,h,scale){
    const W=Math.max(1,Math.round(w*scale)),H=Math.max(1,Math.round(h*scale));
    for(const c of [this.L,this.T])if(c.width!==W||c.height!==H){c.width=W;c.height=H;}
  }
  apply(c,camera,scale){c.setTransform(scale,0,0,scale,0,0);camera.apply(c);}

  // Recortes da escuridão: cada luz é um gradiente que "apaga" a escuridão.
  cut(c,x,y,r,power){
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(0,0,0,${power})`);g.addColorStop(.55,`rgba(0,0,0,${power*.55})`);g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
  }
  lights(run,world){
    const out=[],t=this.time;
    for(const l of [...(world.lampLights||[]),...(world.lights||[])])out.push({x:l.x,y:l.y,r:(l.radius||100)*1.35,p:.88});
    for(const f of world.fireLights||[]){const fl=.88+Math.sin(t*13+f.x)*.06+Math.sin(t*23+f.y)*.04;out.push({x:f.x,y:f.y,r:(f.radius||90)*1.3*fl,p:.9});}
    for(const f of run.gun?.flashes||[]){const k=Math.max(0,f.life/f.maxLife);out.push({x:f.x,y:f.y,r:weaponFeel(f.weapon).light*1.7,p:.95*k});}
    for(const b of run.barrels?.blasts||[])out.push({x:b.x,y:b.y,r:260,p:Math.min(1,b.life*2.4)});
    for(const b of run.grenades?.blasts||[])out.push({x:b.x,y:b.y,r:240,p:Math.min(1,b.life*2.4)});
    // C4: toda explosão (bomber, veículo, barril, granada) acende a área por um instante.
    for(const s of run.worldFX?.shock||[])out.push({x:s.x,y:s.y,r:s.r*2.2,p:Math.min(1,s.life/s.total*1.6)});
    return out;
  }
  // Polígono de um obstáculo (retângulo ou carro girado), em sentido horário.
  corners(o){
    if(o.carShape){const z=o.carShape,c=Math.cos(z.angle),s=Math.sin(z.angle);
      return [[-z.halfW,-z.halfH],[z.halfW,-z.halfH],[z.halfW,z.halfH],[-z.halfW,z.halfH]].map(([lx,ly])=>[z.cx+lx*c-ly*s,z.cy+lx*s+ly*c]);}
    return [[o.x,o.y],[o.x+o.w,o.y],[o.x+o.w,o.y+o.h],[o.x,o.y+o.h]];
  }
  // Sombra projetada: para cada aresta de costas para a luz, um quadrilátero até o alcance.
  castShadows(c,lx,ly,range,enemies,quality){
    const R=PZ_LIGHT_CFG.shadowReach;
    c.fillStyle='#000';c.beginPath();
    for(const o of nearbyObstacles(lx-range,ly-range,lx+range,ly+range)){
      if(o.barrel)continue;
      const pts=this.corners(o);
      for(let i=0;i<4;i++){
        const a=pts.at(i),b=pts.at((i+1)%4),nx=b[1]-a[1],ny=a[0]-b[0];
        const mx=(a[0]+b[0])/2-lx,my=(a[1]+b[1])/2-ly;
        if(nx*mx+ny*my<=0)continue; // aresta voltada para a luz
        const pa=Math.hypot(a[0]-lx,a[1]-ly)||1,pb=Math.hypot(b[0]-lx,b[1]-ly)||1;
        c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);
        c.lineTo(b[0]+(b[0]-lx)/pb*R,b[1]+(b[1]-ly)/pb*R);c.lineTo(a[0]+(a[0]-lx)/pa*R,a[1]+(a[1]-ly)/pa*R);c.closePath();
      }
    }
    c.fill();
    if(quality==='high'){
      // Inimigos dentro do feixe projetam uma sombra alongada para trás.
      c.fillStyle='rgba(0,0,0,.75)';
      for(const e of enemies){
        if(!e.alive)continue;const dx=e.x-lx,dy=e.y-ly,d=Math.hypot(dx,dy);
        if(d<20||d>range)continue;
        const len=Math.min(90,26+d*.22),ang=Math.atan2(dy,dx);
        c.save();c.translate(e.x+dx/d*(e.radius+len*.5),e.y+dy/d*(e.radius+len*.5));c.rotate(ang);
        c.beginPath();c.ellipse(0,0,len*.5,e.radius*.85,0,0,Math.PI*2);c.fill();c.restore();
      }
    }
  }
  flashlightWedge(c,px,py,face,range,half,power){
    const g=c.createRadialGradient(px,py,6,px,py,range);
    g.addColorStop(0,`rgba(0,0,0,${power})`);g.addColorStop(.6,`rgba(0,0,0,${power*.75})`);g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g;
    // Bordas suaves: três cones sobrepostos, do mais largo/fraco ao mais estreito.
    for(const [k,a] of [[1.18,.35],[1,.55],[.8,1]]){
      c.globalAlpha=a;c.beginPath();c.moveTo(px,py);c.arc(px,py,range,face-half*k,face+half*k);c.closePath();c.fill();
    }
    c.globalAlpha=1;
  }

  draw(ctx,viewport,run,camera,world){
    const now=performance.now()/1000;this.time+=Math.min(.1,Math.max(0,now-(this.last||now)));this.last=now;
    const env=Q04_ENVIRONMENT.get(run.elapsed||0,true); // inclui a prévia de clima
    const quality=this.quality(),w=viewport.width,h=viewport.height;
    this.env=env;this.flashOn=0;
    if(window.__PZ_DIAG&&!window.__PZ_DIAG.light)return;
    // Neblina (antes da escuridão: só aparece onde há luz, como volume no ar).
    // Atlas A1: neblina só quando aparece de verdade (noite/neblina forte) ou na qualidade alta.
    if(quality==='high'||(quality!=='low'&&Math.max(env.fog||0,env.dark*.55)>.28))this.drawFog(ctx,viewport,camera,env);
    const A=PZ_LIGHT_CFG.nightDarkness*smoothstep(.05,.95,env.dark);
    if(A<.02)return;
    const scale=quality==='high'?.6:quality==='low'?.35:.5;
    this.ensure(w,h,scale);
    const L=this.lc,p=run.player;
    L.setTransform(1,0,0,1,0,0);L.globalCompositeOperation='source-over';L.globalAlpha=1;
    L.fillStyle=`rgb(${PZ_LIGHT_CFG.darkColor})`;L.fillRect(0,0,this.L.width,this.L.height);
    this.apply(L,camera,scale);
    L.globalCompositeOperation='destination-out';
    this.cut(L,p.x,p.y,PZ_LIGHT_CFG.personal.radius,PZ_LIGHT_CFG.personal.power);
    for(const l of this.lights(run,world))this.cut(L,l.x,l.y,l.r,l.p);
    // Lanterna com sombras, renderizada à parte e então subtraída da escuridão.
    const fl=PZ_LIGHT_CFG.flashlight,flashOn=smoothstep(.25,.75,env.dark)*(p.alive!==false?1:0);
    this.flashOn=flashOn;
    if(flashOn>.01){
      const T=this.tc,half=Math.acos(fl.cos);
      T.setTransform(1,0,0,1,0,0);T.globalCompositeOperation='source-over';T.clearRect(0,0,this.T.width,this.T.height);
      this.apply(T,camera,scale);
      this.flashlightWedge(T,p.x,p.y,p.facing||0,fl.range,half,fl.power*flashOn);
      if(quality!=='low'){T.globalCompositeOperation='destination-out';this.castShadows(T,p.x,p.y,fl.range,run.enemies,quality);}
      L.setTransform(1,0,0,1,0,0);L.drawImage(this.T,0,0);
    }
    L.globalCompositeOperation='source-over';
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.globalAlpha=A;
    ctx.drawImage(this.L,0,0,w,h);
    ctx.restore();
  }

  // Depois das luzes coloridas: feixe volumétrico, poeira, clarões, gradação, vinheta, grão.
  drawAfter(ctx,viewport,run,camera){
    const env=this.env||Q04_ENVIRONMENT.get(run.elapsed||0,true),quality=this.quality(),p=run.player;
    if(window.__PZ_DIAG&&!window.__PZ_DIAG.light){PZ_POST.update(env,quality,window.__projectZGame?.save?.settings?.reducedMotion);return;}
    const reduced=window.__projectZGame?.save?.settings?.reducedMotion;
    ctx.save();camera.apply(ctx);
    if(this.flashOn>.01){
      const fl=PZ_LIGHT_CFG.flashlight,half=Math.acos(fl.cos),face=p.facing||0;
      ctx.globalCompositeOperation='screen';
      const g=ctx.createRadialGradient(p.x,p.y,4,p.x,p.y,fl.range);
      g.addColorStop(0,`rgba(214,230,255,${.20*this.flashOn})`);g.addColorStop(.5,`rgba(190,210,245,${.08*this.flashOn})`);g.addColorStop(1,'rgba(180,200,240,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,fl.range,face-half*.9,face+half*.9);ctx.closePath();ctx.fill();
      if(quality!=='low')this.drawDust(ctx,p,face,half,fl.range,reduced);
    }
    // Clarões de cano por cima da escuridão, para não serem apagados por ela.
    if(env.dark>.15)for(const f of run.gun?.flashes||[])drawMuzzleFlash(ctx,f);
    ctx.restore();
    PZ_POST.update(env,quality,reduced); // C6: gradação, vinheta e grão viraram camadas da placa de vídeo
  }
  drawDust(ctx,p,face,half,range,reduced){
    const dt=reduced?0:1/60;
    ctx.fillStyle='#e8f0ff';
    for(const d of this.dust){
      d.ph+=dt*.8;d.x+=(d.vx+Math.sin(d.ph)*3)*dt;d.y+=(d.vy+Math.cos(d.ph*.7)*3)*dt;
      // a poeira "mora" ao redor do jogador: quem sai do quadrado volta pelo lado oposto
      if(d.x>300)d.x-=600;if(d.x<-300)d.x+=600;if(d.y>300)d.y-=600;if(d.y<-300)d.y+=600;
      const dist=Math.hypot(d.x,d.y);if(dist<18||dist>range)continue;
      const da=Math.atan2(d.y,d.x)-face,off=Math.abs(Math.atan2(Math.sin(da),Math.cos(da)));
      if(off>half)continue;
      const k=(1-dist/range)*(1-off/half)*this.flashOn*(.55+.45*Math.sin(d.ph*2.3));
      ctx.globalAlpha=Math.max(0,.75*k);ctx.fillRect(p.x+d.x,p.y+d.y,d.s,d.s);
    }
    ctx.globalAlpha=1;
  }
  drawFog(ctx,viewport,camera,env){
    const amount=Math.max(env.fog||0,env.dark*.55);
    if(amount<.08)return;
    if(!this.fog){
      const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
      for(let i=0;i<70;i++){const px=Math.random()*512,py=Math.random()*512,r=40+Math.random()*110;
        for(const [ox,oy] of [[0,0],[512,0],[-512,0],[0,512],[0,-512]]){
          const g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(1,'rgba(255,255,255,0)');
          x.fillStyle=g;x.fillRect(px+ox-r,py+oy-r,r*2,r*2);}}
      this.fog=c;
    }
    ctx.save();camera.apply(ctx);ctx.globalAlpha=Math.min(.32,amount*.3); // Atlas A1: mistura normal (screen custava caro)
    const pat=ctx.createPattern(this.fog,'repeat'),drift=this.time*7;
    pat.setTransform(new DOMMatrix([1.6,0,0,1.6,drift,drift*.4]));
    ctx.fillStyle=pat;
    const hw=viewport.width/camera.zoom/2+40,hh=viewport.height/camera.zoom/2+40;
    ctx.fillRect(camera.x-hw,camera.y-hh,hw*2,hh*2);
    ctx.restore();
  }
  grade(ctx,viewport,env,quality,reduced){
    const w=viewport.width,h=viewport.height;
    ctx.save();ctx.globalCompositeOperation='soft-light';
    const dawn=env.phase==='dawn'?1-Math.abs(.5-(env.dark||0))*2:0;
    if(env.golden>.02){ctx.fillStyle=`rgba(255,168,92,${.30*env.golden})`;ctx.fillRect(0,0,w,h);}
    if(env.dark>.02){ctx.fillStyle=`rgba(46,82,160,${.34*env.dark})`;ctx.fillRect(0,0,w,h);}
    if(dawn>.02){ctx.fillStyle=`rgba(255,140,160,${.18*dawn})`;ctx.fillRect(0,0,w,h);}
    ctx.globalCompositeOperation='source-over';
    // Vinheta única, mais fechada à noite.
    const v=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.75);
    v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,`rgba(0,0,0,${.28+.22*(env.dark||0)})`);
    ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
    if(quality!=='low'){
      if(!this.grain){const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d'),img=x.createImageData(160,160);
        for(let i=0;i<img.data.length;i+=4){const n=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=n;img.data[i+3]=255;}
        x.putImageData(img,0,0);this.grain=c;}
      ctx.globalCompositeOperation='overlay';ctx.globalAlpha=.045;
      const pat=ctx.createPattern(this.grain,'repeat');
      if(!reduced)pat.setTransform(new DOMMatrix([1,0,0,1,Math.random()*160,Math.random()*160]));
      ctx.fillStyle=pat;ctx.fillRect(0,0,w,h);
    }
    ctx.restore();
  }
}
const PZ_LIGHTMAP=new PzLightMap();
