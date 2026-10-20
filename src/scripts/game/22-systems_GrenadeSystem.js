// -- src/systems/GrenadeSystem.js --


// O alvo é a concentração visível que mais inimigos atingiria. Empates
// favorecem a menor distância; não lança nem consome granadas sem alvo válido.
function chooseGrenadeTarget(player,enemies,camera,obstacles=OBSTACLES){
  if(!player?.alive)return null;
  const candidates=enemies.filter(e=>e.alive&&Math.hypot(e.x-player.x,e.y-player.y)<=GRENADE.range);
  let best=null,score=-1,distBest=Infinity;
  for(const candidate of candidates){
    const {x,y}=candidate,dist=Math.hypot(x-player.x,y-player.y);
    if(!canOccupy(x,y,3,obstacles))continue;
    if(obstacles===OBSTACLES?segmentHitsWall(player.x,player.y,x,y):obstacles.some(rect=>segmentRectHit(player.x,player.y,x,y,rect)))continue;
    if(camera){
      const p=camera.worldToScreen(x,y);
      if(p.x<4||p.y<4||p.x>camera.viewport.width-4||p.y>camera.viewport.height-4)continue;
    }
    const hits=candidates.reduce((n,e)=>n+(Math.hypot(e.x-x,e.y-y)<=GRENADE.radius?1:0),0);
    if(hits>score||(hits===score&&dist<distBest)){
      best={x,y,hits};score=hits;distBest=dist;
    }
  }
  return best;
}
class GrenadeSystem {
  constructor(){this.count=GRENADE.starting;this.capacity=GRENADE.capacity;this.active=[];this.blasts=[];this.cooldown=0;this.time=0;}
  add(amount=1){const before=this.count;this.count=Math.min(this.capacity,this.count+Math.max(0,amount));return this.count-before;}
  throw(player,enemies,camera){
    if(this.count<=0)return {ok:false,reason:'SEM GRANADAS'};
    if(this.cooldown>0)return {ok:false,reason:'AGUARDE'};
    const target=chooseGrenadeTarget(player,enemies,camera);
    if(!target)return {ok:false,reason:'SEM ALVO NO ALCANCE'};
    this.count--;
    this.cooldown=GRENADE.throwCooldown;
    this.active.push({x:player.x,y:player.y,targetX:target.x,targetY:target.y,remaining:GRENADE.fuse,age:0});
    return {ok:true,target};
  }
  update(dt,enemies,onHit=()=>{},onBlast=()=>{}){
    if(dt<=0)return;
    this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    const alive=[];
    for(const grenade of this.active){
      grenade.age+=dt;grenade.remaining-=dt;
      if(grenade.remaining>0){alive.push(grenade);continue;}
      const x=grenade.targetX,y=grenade.targetY;
      this.blasts.push({x,y,life:GRENADE.lifetime});
      for(const enemy of enemies){
        if(!enemy.alive)continue;
        const dx=enemy.x-x,dy=enemy.y-y,dist=Math.hypot(dx,dy);
        if(dist>GRENADE.radius+enemy.radius)continue;
        // Distância influenciará o dano, mas o centro sempre atinge 55 HP.
        const fraction=Math.max(.38,1-dist/(GRENADE.radius+enemy.radius)*.68);
        const died=enemy.hit(GRENADE.damage*fraction);
        if(!died){
          const length=dist||1;
          const amount=GRENADE.knockback*(1-Math.min(1,dist/GRENADE.radius)*.42);
          // Deslocamento em passos para não atravessar uma parede fina.
          for(let step=0;step<8;step++){
            const pos=slideCircle(enemy.x,enemy.y,dx/length*amount/8,dy/length*amount/8,enemy.radius);
            enemy.x=pos.x;enemy.y=pos.y;
          }
          enemy.attackCooldown=Math.max(enemy.attackCooldown,.32);
        }
        onHit(enemy,died);
      }
      onBlast({x,y});
    }
    this.active=alive;
    for(const blast of this.blasts)blast.life-=dt;
    this.blasts=this.blasts.filter(b=>b.life>0);
  }
  draw(ctx){
    ctx.save();
    for(const item of this.active){
      const progress=Math.min(1,item.age/GRENADE.fuse);
      const x=item.x+(item.targetX-item.x)*progress,y=item.y+(item.targetY-item.y)*progress;
      const arc=Math.sin(progress*Math.PI)*22;
      ctx.fillStyle='#ffdda0';ctx.shadowColor='#edaf65';ctx.shadowBlur=12;
      ctx.fillRect(Math.round(x)-5,Math.round(y-arc)-5,10,10);
      ctx.shadowBlur=0;ctx.strokeStyle='#f5b975';ctx.globalAlpha=.42;
      ctx.beginPath();ctx.arc(item.targetX,item.targetY,GRENADE.radius,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
    for(const b of this.blasts){
      const t=1-b.life/GRENADE.lifetime;
      ctx.globalAlpha=Math.max(0,1-t);
      ctx.fillStyle='rgba(240,161,102,.17)';ctx.beginPath();ctx.arc(b.x,b.y,GRENADE.radius*(.28+.72*t),0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffe1a1';ctx.lineWidth=6*(1-t)+1;ctx.shadowColor='#f8aa6a';ctx.shadowBlur=18;
      ctx.beginPath();ctx.arc(b.x,b.y,GRENADE.radius*(.28+.72*t),0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
      for(let i=0;i<15;i++){
        const a=(i*2.3999632297)+b.x*.01,dist=GRENADE.radius*t*(.3+(i%5)*.14);
        ctx.fillStyle=i%3===0?'#fff0c2':'#f09b70';ctx.fillRect(Math.round(b.x+Math.cos(a)*dist),Math.round(b.y+Math.sin(a)*dist),5,5);
      }
    }
    ctx.restore();
  }
}

