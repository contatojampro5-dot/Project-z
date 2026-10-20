// -- src/systems/CombatEffects.js --
// Pooled, short-lived world-space pixel particles; no images or allocations per frame.
const PALETTE={hit:['#ffe1a1','#f09a6e','#e5f1d5'],kill:['#e67986','#b9dd9e','#e9c17b'],shot:['#ffe5a9','#ffbd6e'],boss:['#d7a7fa','#f6b477']};
// Pequenos respingos escuros: sem flashes, sem shader, sem tremor de câmera.
const BLOOD_COLORS=['#802b2b','#a03c37','#632623','#8d4433','#522927'];
class CombatEffects {
  constructor(max=180){this.max=max;this.particles=[];this.corpses=[];this.bloodSpots=[];this.shake=0;this.time=0;this.severedParts=[];this.debris=[];}
  // Uma gota ocupa ~1–2 unidades do mapa. A direção do impacto influencia a
  // dispersão, mas nunca cria jatos grandes ou partículas exageradas.
  // Q.02.2 R3 — gotas aéreas pixeladas + respingos persistentes no asfalto.
  addBloodDecal(x,y,scale=1){
    if(this.bloodSpots.length>=Math.round(230*GRAPHIC_SCALE[graphicLevel(window.__projectZGame?.save?.settings?.particlesQuality)]))this.bloodSpots.shift();
    this.bloodSpots.push({x,y,rx:(1.5+Math.random()*2.5)*scale,
      ry:(.8+Math.random()*1.8)*scale,color:BLOOD_COLORS[Math.floor(Math.random()*BLOOD_COLORS.length)],
      angle:Math.random()*Math.PI,life:75+Math.random()*45,total:120});
  }
  emitBlood(x,y,dirX=1,dirY=0,killed=false){
    const mag=Math.hypot(dirX,dirY)||1;dirX/=mag;dirY/=mag;
    const count=Math.max(5,Math.round((killed?25:12)*GRAPHIC_SCALE[graphicLevel(window.__projectZGame?.save?.settings?.particlesQuality)])),sideX=-dirY,sideY=dirX;
    for(let i=0;i<count;i++){
      const speed=65+Math.random()*(killed?165:110);
      const spread=(Math.random()-.5)*1.6;
      const vx=dirX*speed+sideX*speed*spread;
      const vy=dirY*speed+sideY*speed*spread;
      const size=.9+Math.random()*1.8,life=.28+Math.random()*.47;
      if(this.particles.length>=this.max)this.particles.shift();
      this.particles.push({x:x+(Math.random()-.5)*6,y:y+(Math.random()-.5)*6,
        vx,vy,life,total:life,size,color:BLOOD_COLORS[Math.floor(Math.random()*BLOOD_COLORS.length)],
        blood:true,rx:size,ry:size*(1.1+Math.random()*.6),angle:Math.atan2(vy,vx),
        stainOnDeath:true});
    }
    const stains=Math.max(2,Math.round((killed?12:4)*GRAPHIC_SCALE[graphicLevel(window.__projectZGame?.save?.settings?.particlesQuality)]));
    for(let i=0;i<stains;i++){
      const distance=Math.random()*(killed?28:15),side=(Math.random()-.5)*(killed?32:18);
      this.addBloodDecal(x+dirX*distance+sideX*side,y+dirY*distance+sideY*side,killed?1.25:1);
    }
  }
  // Q.02.2r2: fragmentos visíveis e cabeça garantida em mortes por disparo. Fragmentos de membros em mortes violentas. Efeito limitado para
  // hordas densas; cada peça tem velocidade, gravidade, rotação e repouso.
  emitAmputatedLeg(enemy,dx=1,dy=0,part='leg'){
    const length=Math.hypot(dx,dy)||1,angle=Math.atan2(dy,dx)+(Math.random()-.5)*.65;
    const speed=145+Math.random()*65,life=4.1+Math.random()*.7;
    this.severedParts.push({x:enemy.x,y:enemy.y+7,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      z:5,vz:105+Math.random()*65,angle:Math.random()*6.28,spin:(Math.random()-.5)*10,
      part,color:'#647c65',life,total:life});
    if(this.severedParts.length>42)this.severedParts.splice(0,this.severedParts.length-42);
    for(let i=0;i<5;i++)this.addBloodDecal(enemy.x+(Math.random()-.5)*15,enemy.y+8+(Math.random()-.5)*12,1);
  }
  emitSevered(enemy,dx=1,dy=0,damage=0,force=false){
    if(!enemy || enemy.isBoss)return;
    const severity=Math.max(0,Number(damage)||0);
    if(!force && severity<22)return; // golpes fracos não geram fragmentos
    const length=Math.hypot(dx,dy)||1;dx/=length;dy/=length;
    const count=force&&severity>=115?5:force?3:severity>=48?3:severity>=32?2:1;
    const colors=['#647c65','#789078','#9d5957'];
    for(let i=0;i<count;i++){
      const part=i===0?'head':['arm','leg'][(i-1)%2]; // cabeça garantida em mortes com desmembramento
      const spread=(i-(count-1)/2)*.62+(Math.random()-.5)*.4;
      const angle=Math.atan2(dy,dx)+spread;
      const speed=165+Math.min(245,severity*1.7)+Math.random()*55;
      const life=3.8+Math.random()*1.2;
      this.severedParts.push({x:enemy.x,y:enemy.y-5,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        z:8+Math.random()*5,vz:95+Math.random()*90,angle:Math.random()*6.28,
        spin:(Math.random()-.5)*13,part,color:colors[i%colors.length],life,total:life});
    }
    if(this.severedParts.length>42)this.severedParts.splice(0,this.severedParts.length-42);
    // Mancha maior na origem da amputação.
    for(let i=0;i<9;i++)this.addBloodDecal(enemy.x+(Math.random()-.5)*26,enemy.y+(Math.random()-.5)*24,1.3);
  }
  emitDebris(x,y,energy=1){
    const count=Math.min(9,Math.max(4,Math.round(5*energy)));
    for(let i=0;i<count;i++){
      const angle=Math.PI*2*(i+.23*Math.random())/count;
      const force=(75+Math.random()*125)*energy;
      this.debris.push({x,y,vx:Math.cos(angle)*force,vy:Math.sin(angle)*force,
        z:4+Math.random()*6,vz:70+Math.random()*50,rot:Math.random()*7,spin:(Math.random()-.5)*9,
        life:3.4+Math.random()*2.2,color:i%2?'#63443a':'#4b5552'});
    }
    if(this.debris.length>55)this.debris.splice(0,this.debris.length-55);
  }
  emit(x,y,type='hit',amount=6){
    const colors=PALETTE[type]||PALETTE.hit;
    for(let i=0;i<amount;i++){
      const a=Math.random()*Math.PI*2,speed=(type==='kill'?42:65)+Math.random()*100;
      const p={x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.16+Math.random()*.28,total:0,size:2+Math.floor(Math.random()*3),color:colors[i%colors.length]};p.total=p.life;
      if(this.particles.length>=this.max)this.particles.shift();this.particles.push(p);
    }
    if(type==='kill'){
      // Q.02.4: queda curta em três estágios, depois corpo imóvel sob os atores.
      if(this.corpses.length>=38)this.corpses.shift();
      const total=5.4+Math.random()*1.8;
      this.corpses.push({x,y,life:total,total,angle:Math.random()*Math.PI*2,
        lean:(Math.random()<.5?-1:1),variant:Math.floor(Math.random()*3)});
    }
    // Sem tremor da tela ao atirar/eliminar: a vibração acumulada causava
    // desconforto nas hordas. Partículas e feedback de acerto continuam ativos.
  }
  update(dt){
    this.time+=dt;this.shake=Math.max(0,this.shake-25*dt);
    let target=0;for(let i=0;i<this.particles.length;i++){
      const p=this.particles[i];p.life-=dt;
      if(p.life<=0){if(p.stainOnDeath)this.addBloodDecal(p.x,p.y,.65);continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.blood)p.vy+=24*dt; // queda sutil, sem salpicos saltando pela tela
      const drag=Math.max(0,1-(p.blood?6.0:4.2)*dt);
      p.vx*=drag;p.vy*=drag;this.particles[target++]=p;
    }
    this.particles.length=target;
    let partCount=0;
    for(const part of this.severedParts){
      part.life-=dt;if(part.life<=0)continue;
      const step=Math.min(dt,.05);
      part.x+=part.vx*step;part.y+=part.vy*step;
      // Gotas finas deixam rastros enquanto membros ainda estão voando.
      if(part.z>3 && Math.random()<Math.min(.8,step*13) && this.particles.length<this.max){
        const life=.22+Math.random()*.22,size=.8+Math.random()*1.1;
        this.particles.push({x:part.x,y:part.y-part.z,vx:(Math.random()-.5)*45,
          vy:30+Math.random()*55,life,total:life,size,rx:size,ry:size,
          angle:0,color:BLOOD_COLORS[Math.floor(Math.random()*BLOOD_COLORS.length)],blood:true});
        this.addBloodDecal(part.x+(Math.random()-.5)*6,part.y+(Math.random()-.5)*6,.65);
      }
      part.vx*=Math.exp(-3*step);part.vy*=Math.exp(-3*step);
      if(part.z>0 || part.vz>0){
        part.z+=part.vz*step;part.vz-=390*step;
        if(part.z<0){part.z=0;part.vz=Math.abs(part.vz)>65?-part.vz*.19:0;}
        part.angle+=part.spin*step;
      }
      this.severedParts[partCount++]=part;
    }
    this.severedParts.length=partCount;
    this.debris=this.debris.filter(p=>{
      p.life-=dt;if(p.life<=0)return false;
      const step=Math.min(.05,dt);
      p.x+=p.vx*step;p.y+=p.vy*step;p.vx*=Math.exp(-4*step);p.vy*=Math.exp(-4*step);
      p.z+=p.vz*step;p.vz-=280*step;
      if(p.z<0){p.z=0;p.vz=p.vz< -50?-p.vz*.16:0;}
      p.rot+=p.spin*step;
      return true;
    });
    this.corpses=this.corpses.filter(p=>(p.life-=dt)>0);
    let visible=0;
    for(const spot of this.bloodSpots){spot.life-=dt;if(spot.life>0)this.bloodSpots[visible++]=spot;}
    this.bloodSpots.length=visible;
  }
  drawUnder(ctx){
    for(const c of this.corpses){
      const elapsed=c.total-c.life,fall=Math.min(1,elapsed/.34);
      const ease=1-Math.pow(1-fall,3);
      ctx.save();ctx.translate(Math.round(c.x),Math.round(c.y));
      ctx.rotate(c.angle+c.lean*ease*.42);
      ctx.globalAlpha=Math.min(1,c.life/.8)*.85;
      // Sombra fica no solo; silhueta perde altura enquanto cai.
      ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(-12,-5,24,13);
      ctx.scale(1+.12*ease,1-.47*ease);
      ctx.fillStyle=c.variant===0?'#33473f':c.variant===1?'#4d4c40':'#3d4a47';
      ctx.fillRect(-10,-8,20,17);
      ctx.fillStyle='#60786b';ctx.fillRect(-7,-7,14,9);
      ctx.fillStyle='#a28a78';ctx.fillRect(8,-5,9,11);
      ctx.fillStyle='#28332f';ctx.fillRect(-17,-7,8,5);ctx.fillRect(-17,3,8,5);
      ctx.restore();
    }
    for(const spot of this.bloodSpots){
      ctx.globalAlpha=.68*Math.min(1,spot.life/8);
      ctx.fillStyle=spot.color;
      ctx.beginPath();ctx.ellipse(spot.x,spot.y,spot.rx,spot.ry,spot.angle||0,0,Math.PI*2);ctx.fill();
      // C4: o sangue escurece e seca com o tempo.
      const age=1-Math.max(0,Math.min(1,spot.life/(spot.total||120)));
      if(age>.05){ctx.fillStyle=`rgba(28,10,10,${(.6*age).toFixed(3)})`;ctx.fill();}
    }
    ctx.globalAlpha=1;
  }
  drawOver(ctx){
    for(const d of this.debris){
      ctx.save();ctx.globalAlpha=Math.min(1,d.life/.7);
      ctx.translate(Math.round(d.x),Math.round(d.y-d.z));ctx.rotate(d.rot);
      ctx.fillStyle=d.color;ctx.fillRect(-3,-2,6,4);ctx.restore();
    }
    // Silhuetas pixeladas de membros separados; sombra no solo mostra a altura.
    for(const p of this.severedParts){
      ctx.save();ctx.globalAlpha=Math.min(1,p.life/.55);
      ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(Math.round(p.x)-4,Math.round(p.y)+2,8,3);
      ctx.translate(Math.round(p.x),Math.round(p.y-p.z));ctx.rotate(p.angle);
      ctx.fillStyle=p.color;
      if(p.part==='head'){
        ctx.fillRect(-8,-8,16,16);ctx.fillStyle='#c6a69b';ctx.fillRect(-6,-6,12,9);
        ctx.fillStyle='#232a26';ctx.fillRect(-3,1,2,2);ctx.fillRect(2,1,2,2);
      }else if(p.part==='arm'){
        ctx.fillRect(-4,-11,8,22);ctx.fillStyle='#b49486';ctx.fillRect(-3,5,6,3);
      }else{
        ctx.fillRect(-5,-13,10,25);ctx.fillStyle='#2d3539';ctx.fillRect(-5,6,10,5);
      }
      ctx.restore();
    }
    for(const p of this.particles){
      ctx.globalAlpha=Math.min(1,p.life/p.total);
      ctx.fillStyle=p.color;
      if(p.blood){
        ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx,p.ry,p.angle,0,Math.PI*2);ctx.fill();
      }else ctx.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);
    }
    ctx.globalAlpha=1;
  }
  offset(reducedMotion=false){return {x:0,y:0};} // G3.1.0: tela estável inclusive durante explosões
}

