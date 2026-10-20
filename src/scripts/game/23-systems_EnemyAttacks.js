// -- src/systems/EnemyAttacks.js --


class EnemyAttacks {
  constructor(){this.projectiles=[];this.flashes=[];}
  shoot(x,y,dx,dy,speed,damage,color='#c99cff'){
    this.projectiles.push({x,y,dx,dy,speed,damage,color,life:3.0});
    if(this.projectiles.length>72)this.projectiles.shift();
  }
  blast(x,y,radius=69,color='#ed8c75'){
    this.flashes.push({x,y,radius,color,life:.32,full:.32});
  }
  update(dt,player,onDamage){
    const remaining=[];
    for(const p of this.projectiles){
      const nx=p.x+p.dx*p.speed*dt,ny=p.y+p.dy*p.speed*dt;
      p.life-=dt;
      if(segmentHitsWall(p.x,p.y,nx,ny,3))continue;
      if(segmentCircleHit(p.x,p.y,nx,ny,player.x,player.y,player.radius+4)){
        onDamage(p.damage);continue;
      }
      if(p.life>0&&nx>0&&ny>0&&nx<GAME.map.width&&ny<GAME.map.height){p.x=nx;p.y=ny;remaining.push(p);}
    }
    this.projectiles=remaining;
    for(const f of this.flashes)f.life-=dt;
    this.flashes=this.flashes.filter(f=>f.life>0);
  }
  draw(ctx){
    ctx.save();
    for(const p of this.projectiles){ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
    for(const f of this.flashes){const ratio=f.life/f.full;ctx.globalAlpha=ratio;ctx.strokeStyle=f.color;ctx.lineWidth=3+ratio*4;ctx.beginPath();ctx.arc(f.x,f.y,f.radius*(1-ratio*.3),0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
}

