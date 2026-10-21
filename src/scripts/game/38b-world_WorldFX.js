// -- src/world/WorldFX.js --
// CRONOS C4 · Héstia + Poseidon + Deméter — "Mundo vivo". Somente visual: não altera colisão,
// dano, ondas nem IA. Respeita a qualidade de partículas/clima e o "Reduzir movimento".

// Vento global: direção gira devagar, força sobe com a chuva. Usado por chuva, fumaça e papéis.
const PZ_WIND={x:1,y:.2,strength:.5,update(t,wet=0){
  const a=-.35+Math.sin(t/41)*.6+Math.sin(t/13)*.12;
  this.strength=.35+.3*(Math.sin(t/23)*.5+.5)+wet*.45;
  this.x=Math.cos(a)*this.strength;this.y=Math.sin(a)*this.strength;
}};

class WorldFX {
  constructor(){
    this.shock=[];this.smoke=[];this.embers=[];this.scorch=[];this.holes=[];this.prints=[];this.splashes=[];
    this.papers=[];this.fireClock=0;this.puddleLevel=0;this.wetFeet=0;this.stepClock=0;this.stepSide=1;this.time=0;
    this.puddles=this.makePuddles();
  }
  scale(){return GRAPHIC_SCALE[graphicLevel(window.__projectZGame?.save?.settings?.particlesQuality)]||1;}
  // Poças fixas no asfalto (semente fixa), fora de prédios e carros.
  makePuddles(){
    const rnd=mulberry32(4471),out=[];
    for(let i=0;i<900&&out.length<150;i++){
      const x=40+rnd()*(GAME.map.width-80),y=40+rnd()*(GAME.map.height-80),rx=12+rnd()*30,ry=rx*(.35+rnd()*.35);
      if(!canOccupy(x,y,rx+6))continue;
      // contorno orgânico: borda irregular com lóbulos, como água que se acumula nas falhas do asfalto
      const n=22,ph1=rnd()*6.28,ph2=rnd()*6.28,ph3=rnd()*6.28,k1=.12+rnd()*.14,k2=.06+rnd()*.08,pts=[];
      for(let j=0;j<n;j++){const t=j/n*Math.PI*2;const m=1+k1*Math.sin(2*t+ph1)+k2*Math.sin(3*t+ph2)+.05*Math.sin(5*t+ph3)+(rnd()-.5)*.06;pts.push([Math.cos(t)*rx*m,Math.sin(t)*ry*m]);}
      const path=new Path2D();const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let m0=mid(pts[n-1],pts[0]);path.moveTo(m0[0],m0[1]);
      for(let j=0;j<n;j++){const a=pts[j],b=pts[(j+1)%n],m=mid(a,b);path.quadraticCurveTo(a[0],a[1],m[0],m[1]);}
      out.push({x,y,rx,ry,a:(rnd()-.5)*.8,path,seed:rnd()*100});
    }
    return out;
  }
  explosion(x,y,radius=100){
    const s=this.scale();
    window.__projectZGame?.audio?.body?.('explosion',{x,y}); // C5 · Dionísio: grave da explosão
    this.shock.push({x,y,r:radius*1.25,life:.5,total:.5});
    for(let i=0;i<Math.round(14*s);i++){const a=Math.random()*6.28,d=Math.random()*radius*.45;
      this.smoke.push({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,vx:Math.cos(a)*18,vy:Math.sin(a)*18-6,r:10+Math.random()*10,grow:14+Math.random()*10,
        life:3+Math.random()*2.5,total:5.5,shade:40+Math.random()*30});}
    for(let i=0;i<Math.round(18*s);i++){const a=Math.random()*6.28,v=60+Math.random()*160;
      this.embers.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.8+Math.random()*1.2,total:2,ph:Math.random()*6});}
    this.scorch.push({x,y,r:radius*.62,life:70,total:70,seed:Math.random()});
    if(this.scorch.length>24)this.scorch.shift();
    this.cap();
  }
  bulletHole(x,y){
    this.holes.push({x,y,life:40,total:40,r:1.2+Math.random()*.8});
    if(this.holes.length>140)this.holes.shift();
  }
  cap(){
    const s=this.scale();
    if(this.smoke.length>220*s)this.smoke.splice(0,this.smoke.length-Math.round(220*s));
    if(this.embers.length>200*s)this.embers.splice(0,this.embers.length-Math.round(200*s));
  }
  inPuddle(x,y){
    for(const p of this.puddles){if(Math.abs(p.x-x)>p.rx||Math.abs(p.y-y)>p.rx)continue;
      const c=Math.cos(-p.a),s=Math.sin(-p.a),dx=x-p.x,dy=y-p.y,lx=dx*c-dy*s,ly=dx*s+dy*c;
      if((lx*lx)/(p.rx*p.rx)+(ly*ly)/(p.ry*p.ry)<1)return true;}
    return false;
  }
  update(dt,run,camera,world,env){
    if(dt<=0)return;
    this.time+=dt;this.dark=env.dark||0;this.wet=env.wet||0;
    PZ_WIND.update(this.time,env.wet||0);
    const w=PZ_WIND,s=this.scale();
    // Poças enchem com a chuva e secam devagar.
    this.puddleLevel=Math.max(0,Math.min(1,this.puddleLevel+(env.wet>.12?dt*.08*env.wet:-dt*.012)));
    for(const k of ['shock','scorch','holes','prints','splashes'])this[k]=this[k].filter(o=>(o.life-=dt)>0);
    for(const p of this.smoke){p.life-=dt;p.x+=(p.vx+w.x*16)*dt;p.y+=(p.vy+w.y*16)*dt;p.vx*=.97;p.vy*=.97;p.r+=p.grow*dt*(p.life/p.total);}
    this.smoke=this.smoke.filter(p=>p.life>0);
    for(const e of this.embers){e.life-=dt;e.x+=(e.vx+w.x*30)*dt;e.y+=(e.vy+w.y*30)*dt;e.vx*=.94;e.vy*=.94;e.ph+=dt*18;}
    this.embers=this.embers.filter(e=>e.life>0);
    // Fogo do mapa solta fumaça e brasas que seguem o vento (só perto da câmera).
    this.fireClock-=dt;
    if(this.fireClock<=0){
      this.fireClock=.22/Math.max(.3,s);
      const vw=camera.viewport.width/camera.zoom/2+120,vh=camera.viewport.height/camera.zoom/2+120;
      for(const f of world.fireLights||[]){
        if(Math.abs(f.x-camera.x)>vw||Math.abs(f.y-camera.y)>vh)continue;
        this.smoke.push({x:f.x+(Math.random()-.5)*14,y:f.y-6,vx:(Math.random()-.5)*6,vy:-10,r:6,grow:12,life:3.4,total:3.4,shade:30+Math.random()*20});
        if(Math.random()<.6)this.embers.push({x:f.x+(Math.random()-.5)*12,y:f.y-4,vx:(Math.random()-.5)*20,vy:-26-Math.random()*20,life:1.2+Math.random(),total:2.2,ph:Math.random()*6});
      }
      this.cap();
    }
    // Pegadas molhadas: depois de pisar numa poça (ou com chuva forte), por alguns segundos.
    const p=run.player,moving=Math.hypot(p.x-(this.lastX??p.x),p.y-(this.lastY??p.y))>.4;
    if(this.puddleLevel>.15&&this.inPuddle(p.x,p.y))this.wetFeet=2.2;else this.wetFeet=Math.max(env.wet>.6?.5:0,this.wetFeet-dt);
    this.stepClock-=dt;
    if(moving&&this.wetFeet>0&&this.stepClock<=0){
      this.stepClock=.3;this.stepSide*=-1;const f=p.facing||0,ox=Math.cos(f+Math.PI/2)*4*this.stepSide,oy=Math.sin(f+Math.PI/2)*4*this.stepSide;
      this.prints.push({x:p.x+ox,y:p.y+10+oy,a:Math.atan2(p.y-(this.lastY??p.y),p.x-(this.lastX??p.x)),life:7,total:7,k:Math.min(1,this.wetFeet/2.2)});
      if(this.prints.length>60)this.prints.shift();
    }
    this.lastX=p.x;this.lastY=p.y;
    // Respingos de chuva no chão visível.
    if(env.wet>.12){
      const n=Math.round(env.wet*55*s*dt*10),vw=camera.viewport.width/camera.zoom/2,vh=camera.viewport.height/camera.zoom/2;
      for(let i=0;i<n;i++)this.splashes.push({x:camera.x+(Math.random()*2-1)*vw,y:camera.y+(Math.random()*2-1)*vh,life:.28,total:.28});
      if(this.splashes.length>260)this.splashes.splice(0,this.splashes.length-260);
    }
    // Papéis e folhas levados pelo vento ao redor da câmera.
    const want=Math.round(12*s);
    while(this.papers.length<want)this.papers.push(this.newPaper(camera,true));
    const vw=camera.viewport.width/camera.zoom/2+60,vh=camera.viewport.height/camera.zoom/2+60;
    for(const q of this.papers){
      const gust=.6+.4*Math.sin(this.time*1.3+q.ph);
      q.x+=(w.x*62*gust+Math.sin(this.time*2+q.ph)*8)*dt;q.y+=(w.y*62*gust+Math.cos(this.time*1.7+q.ph)*8)*dt;
      q.spin+=dt*(2+w.strength*5);
      if(Math.abs(q.x-camera.x)>vw||Math.abs(q.y-camera.y)>vh)Object.assign(q,this.newPaper(camera,false));
    }
  }
  newPaper(camera,anywhere){
    const vw=camera.viewport.width/camera.zoom/2+50,vh=camera.viewport.height/camera.zoom/2+50;
    let x=camera.x+(Math.random()*2-1)*vw,y=camera.y+(Math.random()*2-1)*vh;
    if(!anywhere){if(Math.abs(PZ_WIND.x)>Math.abs(PZ_WIND.y))x=camera.x-Math.sign(PZ_WIND.x||1)*vw;else y=camera.y-Math.sign(PZ_WIND.y||1)*vh;}
    const leaf=Math.random()<.4;
    return {x,y,ph:Math.random()*6.28,spin:Math.random()*6,leaf,c:leaf?(Math.random()<.5?'#6b5a2e':'#4e5a2c'):(Math.random()<.5?'#d8d2c2':'#bfb6a1'),w:leaf?3:4+Math.random()*2,h:leaf?2:5+Math.random()*2};
  }
  // Camada do chão (antes das entidades): poças, marcas de queimado, buracos de bala, pegadas, respingos.
  drawGround(ctx,camera){
    const vw=camera.viewport.width/camera.zoom/2+60,vh=camera.viewport.height/camera.zoom/2+60;
    const vis=o=>Math.abs(o.x-camera.x)<vw&&Math.abs(o.y-camera.y)<vh;
    const L=this.puddleLevel;
    if(L>.02){const d=this.dark||0,rain=this.wet||0,t=this.time;
      for(const p of this.puddles){if(!vis(p))continue;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);const sc=.55+.45*L;ctx.scale(sc,sc);
        // 1) asfalto encharcado em volta: escurece sem borda dura
        ctx.save();ctx.scale(1.38,1.45);ctx.fillStyle=`rgba(4,5,7,${.2*L})`;ctx.fill(p.path);ctx.restore();
        ctx.save();ctx.scale(1.16,1.2);ctx.fillStyle=`rgba(4,5,7,${.22*L})`;ctx.fill(p.path);ctx.restore();
        // 2) lâmina d'água: escura e lisa, o asfalto some por baixo; reflete um céu frio e fraco de dia
        const g=ctx.createLinearGradient(0,-p.ry,0,p.ry);
        g.addColorStop(0,`rgba(${Math.round(34-24*d)},${Math.round(40-28*d)},${Math.round(48-32*d)},${(.8+.12*d)*L})`);
        g.addColorStop(1,`rgba(${Math.round(14-8*d)},${Math.round(16-9*d)},${Math.round(20-10*d)},${(.86+.1*d)*L})`);
        ctx.fillStyle=g;ctx.fill(p.path);
        ctx.save();ctx.clip(p.path);
        // 3) reflexo do céu em faixa diagonal suave (água parada), sem volume
        const sg=ctx.createLinearGradient(-p.rx,-p.ry,p.rx,p.ry);sg.addColorStop(.25,'rgba(150,170,190,0)');sg.addColorStop(.45,`rgba(150,170,190,${(.1-.07*d)*L})`);sg.addColorStop(.62,'rgba(150,170,190,0)');
        ctx.fillStyle=sg;ctx.fillRect(-p.rx*1.3,-p.ry*1.3,p.rx*2.6,p.ry*2.6);
        // 4) linha de margem: a água encosta no asfalto mais claro do lado de baixo
        ctx.strokeStyle=`rgba(0,0,0,${.45*L})`;ctx.lineWidth=2;ctx.stroke(p.path);
        // brilho especular fino: água lisa espelhando uma luz distante
        ctx.strokeStyle=`rgba(225,232,240,${(.22-.12*d)*L})`;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-p.rx*.5,-p.ry*.25);ctx.quadraticCurveTo(-p.rx*.1,-p.ry*.42,p.rx*.3,-p.ry*.3);ctx.stroke();
        // 5) gotas de chuva: anéis que abrem e somem
        if(rain>.15){ctx.lineWidth=.8;for(let i=0;i<3;i++){const ph=(t*1.3+p.seed*.37+i*.33)%1,rx2=2+ph*7;
          const ox=Math.sin(p.seed*7+i*2.1+Math.floor(t*1.3+p.seed*.37+i*.33)*1.7)*p.rx*.55,oy=Math.cos(p.seed*3+i*1.3+Math.floor(t*1.3+i*.33)*2.3)*p.ry*.45;
          ctx.strokeStyle=`rgba(210,222,235,${(1-ph)*.45*rain*L})`;ctx.beginPath();ctx.ellipse(ox,oy,rx2,rx2*.55,0,0,Math.PI*2);ctx.stroke();}}
        ctx.restore();
        ctx.restore();}}
    for(const s of this.scorch){if(!vis(s))continue;const k=Math.min(1,s.life/12);
      const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,`rgba(12,10,9,${.62*k})`);g.addColorStop(.6,`rgba(20,16,13,${.35*k})`);g.addColorStop(1,'rgba(20,16,13,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
    for(const h of this.holes){if(!vis(h))continue;const k=Math.min(1,h.life/6);
      ctx.fillStyle=`rgba(10,10,12,${.85*k})`;ctx.fillRect(h.x-h.r,h.y-h.r,h.r*2,h.r*2);
      ctx.fillStyle=`rgba(190,180,165,${.35*k})`;ctx.fillRect(h.x-h.r,h.y-h.r-1,h.r*2,1);}
    for(const f of this.prints){if(!vis(f))continue;const k=Math.min(1,f.life/3)*f.k;
      ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.fillStyle=`rgba(8,14,20,${.38*k})`;ctx.fillRect(-3,-1.6,6,3.2);ctx.restore();}
    if(this.splashes.length){ctx.strokeStyle='rgba(210,228,240,.7)';ctx.lineWidth=.8;
      for(const s of this.splashes){const k=1-s.life/s.total;ctx.globalAlpha=(1-k)*.8;ctx.beginPath();ctx.ellipse(s.x,s.y,1+k*4,(1+k*4)*.5,0,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;}
  }
  // Camada do ar (depois das entidades): fumaça, brasas, ondas de choque, papéis.
  drawAir(ctx,camera){
    const vw=camera.viewport.width/camera.zoom/2+80,vh=camera.viewport.height/camera.zoom/2+80;
    const vis=o=>Math.abs(o.x-camera.x)<vw&&Math.abs(o.y-camera.y)<vh;
    for(const q of this.papers){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.spin*.6);ctx.scale(1,Math.cos(q.spin));
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(-q.w/2+2,-q.h/2+3,q.w,q.h);ctx.fillStyle=q.c;ctx.fillRect(-q.w/2,-q.h/2,q.w,q.h);ctx.restore();}
    // C6: fumaça clara e difusa (sprite pré-renderizado), esticada levemente pelo vento.
    for(const p of this.smoke){if(!vis(p))continue;const k=p.life/p.total,a=Math.min(1,(1-k)*5)*k*.55;
      ctx.globalAlpha=a;const r=p.r*1.25;ctx.drawImage(PZ_SMOKE_SPRITE,p.x-r*1.15,p.y-r,r*2.3,r*2);}
    ctx.globalAlpha=1;
  }
  // Brilhos (depois da escuridão, para continuarem acesos à noite): brasas e ondas de choque.
  drawGlow(ctx,camera){
    const vw=camera.viewport.width/camera.zoom/2+80,vh=camera.viewport.height/camera.zoom/2+80;
    const vis=o=>Math.abs(o.x-camera.x)<vw&&Math.abs(o.y-camera.y)<vh;
    ctx.save();camera.apply(ctx);ctx.globalCompositeOperation='lighter';
    for(const e of this.embers){if(!vis(e))continue;const k=e.life/e.total;ctx.globalAlpha=Math.max(0,k*(.6+.4*Math.sin(e.ph)));
      ctx.fillStyle=k>.5?'#ffd27a':'#ff8a3c';ctx.fillRect(e.x,e.y,1.6,1.6);}
    for(const s of this.shock){const k=1-s.life/s.total;
      ctx.globalAlpha=Math.min(1,(1-k)*1.2);ctx.strokeStyle='#ffe2b0';ctx.lineWidth=Math.max(1.5,10*(1-k));
      ctx.beginPath();ctx.arc(s.x,s.y,s.r*(.15+.85*Math.pow(k,.6)),0,Math.PI*2);ctx.stroke();
      if(k<.35){ctx.globalAlpha=(1-k/.35)*.7;ctx.fillStyle='#fff1d0';ctx.beginPath();ctx.arc(s.x,s.y,s.r*.45,0,Math.PI*2);ctx.fill();}}
    ctx.restore();
  }
  // Depois da escuridão: reflexos de postes, fogo e lanterna nas poças.
  drawReflections(ctx,camera,world,run,dark,flashOn){
    const L=this.puddleLevel;if(L<.05)return;
    const lights=[...(world.lampLights||[]),...(world.lights||[]),...(world.fireLights||[])];
    const p=run.player,fl=PZ_LIGHT_CFG.flashlight;
    const vw=camera.viewport.width/camera.zoom/2+40,vh=camera.viewport.height/camera.zoom/2+40;
    ctx.save();camera.apply(ctx);ctx.globalCompositeOperation='screen';
    for(const q of this.puddles){
      if(Math.abs(q.x-camera.x)>vw||Math.abs(q.y-camera.y)>vh)continue;
      let best=null,bd=1e9;
      for(const l of lights){const d=Math.hypot(l.x-q.x,l.y-q.y);if(d<(l.radius||100)*1.6&&d<bd){bd=d;best=l;}}
      let strength=0,color='255,214,160';
      if(best){strength=(1-bd/((best.radius||100)*1.6))*(.25+.75*dark);color=String(best.color||'').toLowerCase().includes('ff7')?'255,150,80':'255,214,160';}
      if(flashOn>.05){const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);
        if(d<fl.range&&d>10&&(dx*Math.cos(p.facing)+dy*Math.sin(p.facing))/d>fl.cos){const f=(1-d/fl.range)*flashOn;if(f>strength){strength=f;color='215,232,255';}}}
      if(strength<.04)continue;
      ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);const sc=.55+.45*L;ctx.scale(sc,sc);
      if(q.path)ctx.clip(q.path);else{ctx.beginPath();ctx.ellipse(0,0,q.rx,q.ry,0,0,Math.PI*2);ctx.clip();}
      const g=ctx.createLinearGradient(0,-q.ry,0,q.ry);
      g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.5,`rgba(${color},${.55*strength*L})`);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(-q.rx*.35,-q.ry,q.rx*.7,q.ry*2);
      const t=this.time*3+q.x;ctx.strokeStyle=`rgba(${color},${.25*strength*L})`;ctx.lineWidth=.8;
      ctx.beginPath();ctx.ellipse(Math.sin(t)*q.rx*.3,Math.cos(t*.7)*q.ry*.3,2+((t*2)%6),1+((t*2)%6)*.5,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}

// C5 · Ártemis/Hermes — anel de recarga e nome da arma, desenhados no mundo sobre o personagem.
function pzDrawReloadAndSwap(ctx,run){
  const p=run.player,gun=run.gun;
  if(gun.reloadRemaining>0){
    // C6: barra fina sob os pés (substitui o anel), sem texto.
    const total=gun.reloadTime||gun.config.reload||1,k=Math.max(0,Math.min(1,1-gun.reloadRemaining/total));
    const w=26,x=Math.round(p.x-w/2),y=Math.round(p.y+19);
    ctx.save();ctx.fillStyle='rgba(8,8,10,.75)';ctx.fillRect(x-1,y-1,w+2,5);
    ctx.fillStyle='#f3d9a0';ctx.fillRect(x,y,Math.round(w*k),3);ctx.restore();
  }
  const s=run.swapLabel;
  if(s&&s.t>0){
    const a=Math.min(1,s.t/.4);ctx.save();ctx.globalAlpha=a;ctx.font='bold 8px monospace';ctx.textAlign='center';
    const w=ctx.measureText(s.text).width+12,y=p.y-38-(1.5-s.t)*6;
    ctx.fillStyle='rgba(10,9,12,.82)';ctx.fillRect(p.x-w/2,y-9,w,13);ctx.fillStyle='#e2555f';ctx.fillRect(p.x-w/2,y-9,2,13);
    ctx.fillStyle='#f6efe9';ctx.fillText(s.text,p.x+1,y);ctx.restore();
  }
}
// C5 · Hermes — setas na borda da tela apontando ameaças próximas fora de vista (chefes em destaque).
function pzDrawThreatIndicators(ctx,viewport,run,camera){
  const w=viewport.width,h=viewport.height,cx=w/2,cy=h/2,inset=30,list=[];
  for(const e of run.enemies){
    if(!e.alive)continue;const s=camera.worldToScreen(e.x,e.y);
    if(s.x>-10&&s.y>-10&&s.x<w+10&&s.y<h+10)continue;
    const d=Math.hypot(e.x-run.player.x,e.y-run.player.y);if(d>760&&!e.isBoss)continue;
    list.push({s,d,boss:!!e.isBoss});
  }
  list.sort((a,b)=>(b.boss-a.boss)||(a.d-b.d));
  ctx.save();
  for(const t of list.slice(0,10)){
    const dx=t.s.x-cx,dy=t.s.y-cy,ang=Math.atan2(dy,dx);
    const k=Math.min((cx-inset)/Math.abs(dx||1e-6),(cy-inset)/Math.abs(dy||1e-6));
    const x=cx+dx*k,y=cy+dy*k,near=Math.max(0,1-t.d/760),size=t.boss?11:7;
    ctx.save();ctx.globalAlpha=t.boss?.95:.35+.55*near;
    ctx.translate(x,y);ctx.rotate(ang);
    ctx.fillStyle='rgba(8,8,10,.7)';ctx.beginPath();ctx.moveTo(size+2,0);ctx.lineTo(-size,-size*.8-2);ctx.lineTo(-size*.4,0);ctx.lineTo(-size,size*.8+2);ctx.closePath();ctx.fill();
    ctx.fillStyle=t.boss?'#ff5a5f':'#f0b36a';ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(-size+1,-size*.75);ctx.lineTo(-size*.35,0);ctx.lineTo(-size+1,size*.75);ctx.closePath();ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
