// -- src/combat/WeaponFeel.js --
// CRONOS C2 · Ártemis + Héstia + Ares — "combate com peso", SEM tremor de câmera.
// Clarão direcional no cano + luz momentânea no ambiente, recuo visual do personagem,
// pausa de impacto em abates fortes, cápsulas ejetadas e separação física da horda.

// Assinatura de cada arma. light = raio da luz no ambiente (unidades do mapa);
// recoil = recuo visual do sprite; stop = pausa de impacto em abate (s);
// casing = 'brass' | 'shell' | null; eject = quando a cápsula sai ('fire' | 'reload').
const WEAPON_FEEL=Object.freeze({
  pistol:  {flashLen:13, flashWidth:6,  light:78,  lightColor:'255,206,128', recoil:2.2, stop:0,    casing:'brass', eject:'fire'},
  smg:     {flashLen:11, flashWidth:5,  light:66,  lightColor:'255,214,140', recoil:1.4, stop:0,    casing:'brass', eject:'fire'},
  rifle:   {flashLen:19, flashWidth:7,  light:96,  lightColor:'255,220,150', recoil:3.0, stop:0,    casing:'brass', eject:'fire'},
  shotgun: {flashLen:24, flashWidth:13, light:132, lightColor:'255,186,104', recoil:5.5, stop:.035, casing:'shell', eject:'reload'},
  revolver:{flashLen:18, flashWidth:10, light:112, lightColor:'255,198,120', recoil:4.6, stop:.045, casing:'brass', eject:'reload'},
  sniper:  {flashLen:32, flashWidth:12, light:168, lightColor:'255,232,176', recoil:7.0, stop:.065, casing:'brass', eject:'fire'},
});
const weaponFeel=id=>WEAPON_FEEL[id]||WEAPON_FEEL.pistol;

// Clarão direcional: núcleo quente + pétalas no sentido do disparo, com leve variação
// de forma a cada tiro (semente fixa por clarão, sem aleatoriedade por quadro).
function drawMuzzleFlash(ctx,f){
  const feel=weaponFeel(f.weapon),k=Math.max(0,Math.min(1,f.life/f.maxLife));
  const len=feel.flashLen*(.75+.25*k)*(f.scale||1),wid=feel.flashWidth*(.7+.3*k);
  ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle||0);
  ctx.globalCompositeOperation='lighter';
  const glow=ctx.createRadialGradient(len*.2,0,0,len*.2,0,len*1.15);
  glow.addColorStop(0,`rgba(255,236,190,${.55*k})`);glow.addColorStop(.45,`rgba(255,170,80,${.22*k})`);glow.addColorStop(1,'rgba(255,140,60,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(len*.2,0,len*1.15,0,Math.PI*2);ctx.fill();
  const s=f.seed||.5;
  ctx.fillStyle=`rgba(255,196,110,${.85*k})`;
  ctx.beginPath();ctx.moveTo(0,-wid*.5);ctx.lineTo(len*(.9+s*.2),0);ctx.lineTo(0,wid*.5);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len*(.35+s*.15),-wid*(.9+s*.3));ctx.lineTo(len*.18,0);ctx.lineTo(len*(.35+(1-s)*.15),wid*(.9+(1-s)*.3));ctx.closePath();ctx.fill();
  ctx.fillStyle=`rgba(255,250,232,${k})`;
  ctx.beginPath();ctx.ellipse(len*.12,0,len*.34,wid*.32,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// Luz do disparo no ambiente: mais visível à noite, discreta de dia.
function drawShotLights(ctx,flashes,dark=0){
  if(!flashes.length)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  const strength=.32+.68*Math.max(0,Math.min(1,dark));
  for(const f of flashes){
    const feel=weaponFeel(f.weapon),k=Math.max(0,Math.min(1,f.life/f.maxLife));
    const r=feel.light*(.65+.35*k),a=.44*k*strength;
    const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);
    g.addColorStop(0,`rgba(${feel.lightColor},${a})`);g.addColorStop(.4,`rgba(${feel.lightColor},${a*.4})`);g.addColorStop(1,`rgba(${feel.lightColor},0)`);
    ctx.fillStyle=g;ctx.fillRect(f.x-r,f.y-r,r*2,r*2);
  }
  ctx.restore();
}

// Cápsulas: saem pelo lado direito da arma, quicam, giram e ficam no chão.
class ShellCasings {
  constructor(max=90){this.max=max;this.items=[];}
  spawn(x,y,facing,type='brass',count=1){
    const scale=GRAPHIC_SCALE[graphicLevel(window.__projectZGame?.save?.settings?.particlesQuality)]||1;
    const cap=Math.max(20,Math.round(this.max*scale));
    for(let i=0;i<count;i++){
      const side=facing+Math.PI/2+(Math.random()-.5)*.7,back=facing+Math.PI;
      const speed=55+Math.random()*45;
      this.items.push({x,y,z:9,vx:Math.cos(side)*speed+Math.cos(back)*18,vy:Math.sin(side)*speed+Math.sin(back)*18,
        vz:55+Math.random()*35,angle:Math.random()*6.28,spin:(Math.random()-.5)*22,type,life:9,rest:false});
    }
    if(this.items.length>cap)this.items.splice(0,this.items.length-cap);
  }
  update(dt){
    for(const c of this.items){
      c.life-=dt;
      if(c.rest)continue;
      c.vz-=420*dt;c.z+=c.vz*dt;
      const p=slideCircle(c.x,c.y,c.vx*dt,c.vy*dt,1.5);c.x=p.x;c.y=p.y;
      c.angle+=c.spin*dt;
      if(c.z<=0){c.z=0;if(Math.abs(c.vz)>30){c.vz*=-.38;c.vx*=.55;c.vy*=.55;c.spin*=.6;}else{c.rest=true;}}
    }
    this.items=this.items.filter(c=>c.life>0);
  }
  draw(ctx){
    ctx.save();
    for(const c of this.items){
      const fade=Math.min(1,c.life/1.5);
      ctx.globalAlpha=fade;
      ctx.save();ctx.translate(Math.round(c.x),Math.round(c.y-c.z));ctx.rotate(c.angle);
      if(c.type==='mag'){ctx.fillStyle='#24272b';ctx.fillRect(-3.2,-1.8,6.4,3.6);ctx.fillStyle='#5b6066';ctx.fillRect(-3.2,-1.8,6.4,.9);}
      else if(c.type==='shell'){ctx.fillStyle='#a8322c';ctx.fillRect(-2.6,-1.2,4,2.4);ctx.fillStyle='#d9a845';ctx.fillRect(1.4,-1.2,1.4,2.4);}
      else{ctx.fillStyle='#c9963c';ctx.fillRect(-1.8,-.8,3.6,1.6);ctx.fillStyle='#f3d98a';ctx.fillRect(-1.8,-.8,3.6,.6);}
      ctx.restore();
    }
    ctx.restore();
  }
}

// Separação física da horda: empurra pares sobrepostos para fora, em qualquer estado
// (andando, atacando ou parado no jogador). Massa ~ raio², então o tanque empurra mais.
function separateCrowd(enemies,spatial,dt){
  const pad=3,rate=Math.min(1,dt*14);
  for(let i=0;i<enemies.length;i++)enemies[i]._sep=i;
  for(const a of enemies){
    if(!a.alive)continue;
    for(const b of spatial.query(a.x,a.y,a.radius+40)){
      if(b===a||!b.alive||!(b._sep>a._sep))continue; // cada par uma vez
      const dx=b.x-a.x,dy=b.y-a.y,min=a.radius+b.radius+pad,d2=dx*dx+dy*dy;
      if(d2>=min*min)continue;
      const d=Math.sqrt(d2),overlap=(min-d)*rate;
      const nx=d>.001?dx/d:Math.cos(a._sep*2.4),ny=d>.001?dy/d:Math.sin(a._sep*2.4);
      const ma=a.isBoss?1e5:a.radius*a.radius,mb=b.isBoss?1e5:b.radius*b.radius;
      const wa=mb/(ma+mb),wb=1-wa;
      const pa=slideCircle(a.x,a.y,-nx*overlap*wa,-ny*overlap*wa,a.radius);a.x=pa.x;a.y=pa.y;
      const pb=slideCircle(b.x,b.y,nx*overlap*wb,ny*overlap*wb,b.radius);b.x=pb.x;b.y=pb.y;
    }
  }
}
