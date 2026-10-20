// -- src/entities/Boss.js --


class Boss {
  constructor(x,y,wave=5){
    this.wave=wave;this.kind=Math.floor(wave/5)%2===1?'colossus':'hive';
    this.template=BOSS_TYPES[this.kind];this.name=this.template.name;
    const tier=Math.floor((wave-5)/10);
    this.maxHp=Math.round(this.template.hp*Math.pow(1.3,Math.max(0,tier)));
    this.hp=this.maxHp;this.x=x;this.y=y;this.radius=this.template.radius;
    this.speed=this.template.speed;this.damage=this.template.damage;this.xp=this.template.xp;
    this.isBoss=true;this.attackCooldown=1.8;this.flinch=0;this.stride=0;
    this.state='chase';this.warning=0;this.direction={x:0,y:0};this.dashLeft=0;
    this.slamPulse=0;this.heading=0;this.dashTrail=[];
  }
  get alive(){return this.hp>0;}
  hit(damage){if(!this.alive)return false;this.hp=Math.max(0,this.hp-Math.max(0,damage));this.flinch=.1;return !this.alive;}
  update(dt,player,others=[],context={}){
    if(!this.alive)return 0;
    this.flinch=Math.max(0,this.flinch-dt);this.slamPulse=Math.max(0,this.slamPulse-dt);
    for(const trail of this.dashTrail)trail.life-=dt;
    this.dashTrail=this.dashTrail.filter(t=>t.life>0);
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    const dx=player.x-this.x,dy=player.y-this.y,dist=Math.hypot(dx,dy)||1;
    this.stride+=dt*3.5;
    if(this.kind==='colossus'){
      if(this.state==='telegraph'){
        this.warning-=dt;
        if(this.warning<=0){this.state='dash';this.dashLeft=.48;context.sound?.('bossCharge',{x:this.x,y:this.y});}
        return 0;
      }
      if(this.state==='dash'){
        const step=this.speed*7.0*dt;
        const p=slideCircle(this.x,this.y,this.direction.x*step,this.direction.y*step,this.radius);
        const blocked=p.x===this.x&&p.y===this.y;this.x=p.x;this.y=p.y;
        this.dashTrail.push({x:this.x,y:this.y,life:.24});
        if(this.dashTrail.length>12)this.dashTrail.shift();
        this.dashLeft-=dt;
        const near=Math.hypot(player.x-this.x,player.y-this.y)<this.radius+player.radius+5;
        if(near){this.state='recover';this.warning=.75;return this.damage;}
        if(this.dashLeft<=0||blocked){this.state='recover';this.warning=.6;}
        return 0;
      }
      if(this.state==='recover'){this.warning-=dt;if(this.warning<=0){this.state='chase';this.attackCooldown=2.7;}return 0;}
      if(this.attackCooldown===0&&dist<345){
        this.state='telegraph';this.warning=1.2;this.direction={x:dx/dist,y:dy/dist};
        context.warn?.('COLOSSO PREPARANDO INVESTIDA',1);
        context.sound?.('bossWarn',{x:this.x,y:this.y});return 0;
      }
    }else{
      if(this.state==='telegraph'){
        this.warning-=dt;
        if(this.warning<=0){
          this.state='chase';this.attackCooldown=4.3;
          context.summon?.(this.x,this.y,3,'runner');
          for(let i=0;i<6;i++){
            const a=i*Math.PI/3+this.stride*.05;
            context.shoot?.(this.x,this.y,Math.cos(a),Math.sin(a),130,13,'#d0a3fc');
          }
          context.sound?.('bossCast',{x:this.x,y:this.y});this.slamPulse=.45;
        }
        return 0;
      }
      if(this.attackCooldown===0){this.state='telegraph';this.warning=1.1;context.warn?.('COLMEIA: ENXAME IMINENTE',1);context.sound?.('bossWarn',{x:this.x,y:this.y});return 0;}
    }
    if(dist>this.radius+player.radius+9){
      const dir=context.navigation?.steer(this,player)||{x:dx/dist,y:dy/dist};
      const p=slideCircle(this.x,this.y,dir.x*this.speed*dt,dir.y*this.speed*dt,this.radius);
      this.x=p.x;this.y=p.y;this.heading=Math.atan2(dir.y,dir.x);
    }
    if(dist<this.radius+player.radius+3&&this.attackCooldown<=0){this.attackCooldown=1.8;return this.damage;}
    return 0;
  }
  draw(ctx,assets){
    const img=assets.get(this.template.sprite);
    const atlas=assets.get(this.template.sprite+'Atlas');
    ctx.save();ctx.translate(Math.round(this.x),Math.round(this.y));
    for(const mark of this.dashTrail){ctx.globalAlpha=mark.life*.5;ctx.fillStyle='#f4a773';ctx.fillRect(mark.x-this.x-23,mark.y-this.y-20,46,40);}
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba(8,11,24,.65)';ctx.beginPath();ctx.ellipse(0,24,37,15,0,0,Math.PI*2);ctx.fill();
    if(this.state==='telegraph'){
      ctx.strokeStyle=this.kind==='colossus'?'#ff9e68':'#e0b0ff';ctx.lineWidth=4;
      ctx.globalAlpha=.65+Math.sin(this.warning*26)*.22;
      if(this.kind==='colossus'){
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(this.direction.x*270,this.direction.y*270);ctx.stroke();
        ctx.setLineDash([9,7]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,48,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      }else{ctx.beginPath();ctx.arc(0,0,116,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;
    }
    if(this.state==='dash'){
      ctx.shadowColor='#ffbd7d';ctx.shadowBlur=26;
    }
    if(this.flinch>0)ctx.filter='brightness(2)';
    const bob=Math.sin(this.stride)*(this.kind==='colossus'?2.4:3.2);
    ctx.save();
    if(atlas){
      const direction=((Math.round(this.heading/(Math.PI/4))%8)+8)%8;
      const frame=Math.floor(this.stride*.7)%4;
      const previous=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(atlas,direction*48,frame*56,48,56,-43,-49+bob,86,91);
      ctx.imageSmoothingEnabled=previous;
    }else if(img)ctx.drawImage(img,-43,-49+bob,86,91);
    else{ctx.fillStyle=this.template.color;ctx.fillRect(-30,-35,60,70);}
    ctx.restore();ctx.filter='none';ctx.shadowBlur=0;
    if(this.slamPulse>0){ctx.strokeStyle='#d0a3fc';ctx.lineWidth=3;ctx.globalAlpha=this.slamPulse/.45;ctx.beginPath();ctx.arc(0,0,110*(1-this.slamPulse/.45),0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
}

