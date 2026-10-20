// -- src/entities/Enemy.js --


// BLOCO 2 / ÁRTEMIS: regiões anatômicas aproximadas no sprite top-down.
// O alvo atingido é determinado pela linha real da bala, não por assistência de mira.
function pickWoundZone(bullet,target){
 const side=Math.abs((target.x-bullet.x)*bullet.vy-(target.y-bullet.y)*bullet.vx);
 const outer=Math.max(0,Math.min(1,side/Math.max(1,target.radius+3)));
 const right=((target.x*7+target.y*11+bullet.shotId)%2)<1;
 if(outer>.58)return right?'rightArm':'leftArm';
 if(outer>.29)return right?'rightLeg':'leftLeg';
 return 'torso';
}

const DAMAGE_POPUPS=[];
class Enemy {
  constructor(x,y,seed=0,kind='normal'){
    const template=ENEMY_TYPES[kind]||ENEMY_TYPES.normal;
    this.kind=kind in ENEMY_TYPES?kind:'normal';this.template=template;
    this.x=x;this.y=y;this.radius=template.radius;this.maxHp=template.hp;this.hp=this.maxHp;
    this.speed=template.speed*(.93+(seed%5)*.028);
    this.damage=template.damage;this.xp=template.xp;
    this.attackCooldown=this.kind==='spitter'?1.3:this.kind==='summoner'?3.2:0;
    this.flinch=0;this.stride=seed;this.evadeSide=seed%2?1:-1;
    // Reação a tiros: curto stagger + impulso amortecido, sem mexer na câmera.
    this.hitStun=0;this.hitVX=0;this.hitVY=0;this.hitDirX=0;this.hitDirY=0;
    // Q.02.3: amputação persistente; somente infectados comuns/corredores sobreviventes.
    this.crawling=false;this.amputationEvents=[];
    this.limbs={leftLeg:0,rightLeg:0,leftArm:0,rightArm:0};
    this.lostLimbs=new Set();
    this.fuse=-1;this.deadByExplosion=false;this.heading=0;this.animation='walk';this.lunge=0;this.avoidTimer=0;this.stuckTime=0;
  }
  get alive(){return this.hp>0;}
  update(dt,player,others=[],context={}){
    if(!this.alive)return 0;
    this.attackCooldown=Math.max(0,this.attackCooldown-dt);
    const staggered=this.hitStun>0;
    this.hitStun=Math.max(0,this.hitStun-dt);
    this.flinch=Math.max(0,this.flinch-dt);
    // Integra impulso exponencialmente: mesma distância de recuo em 30/60/120 FPS.
    // slideCircle impede atravessar paredes ou carros durante o recuo.
    if(Math.abs(this.hitVX)+Math.abs(this.hitVY)>.15){
      const friction=this.kind==='tank'?21:16;
      const decay=Math.exp(-dt*friction);
      const distance=(1-decay)/friction;
      const p=slideCircle(this.x,this.y,this.hitVX*distance,this.hitVY*distance,this.radius);
      this.x=p.x;this.y=p.y;
      this.hitVX*=decay;this.hitVY*=decay;
    }
    const dx=player.x-this.x,dy=player.y-this.y,dist=Math.hypot(dx,dy)||1;
    const contact=this.radius+player.radius+2;
    if(this.kind==='bomber'){
      if(this.fuse>=0){
        this.fuse-=dt;
        if(this.fuse<=0){
          this.hp=0;this.deadByExplosion=true;
          context.bomberExplosion?.(this.x,this.y,this);
          return 0; // dano do jogador e dos infectados é resolvido UMA vez em área
        }
        return 0;
      }
      if(dist<61){this.fuse=.85;context.warn?.('EXPLOSIVO!',.7);context.sound?.('bomberGrowl',{x:this.x,y:this.y});return 0;}
    }
    if(this.kind==='spitter'&&dist<345&&dist>78&&this.attackCooldown===0){
      this.attackCooldown=this.template.attackInterval;
      context.shoot?.(this.x,this.y,dx/dist,dy/dist,190,this.damage,'#c99cff');
      context.sound?.('spitterGrowl',{x:this.x,y:this.y});
    }
    if(this.kind==='summoner'&&dist<410&&this.attackCooldown===0){
      this.attackCooldown=this.template.attackInterval;
      context.summon?.(this.x,this.y,2,'normal');
      context.sound?.('summonerGrowl',{x:this.x,y:this.y});
    }
    const keepDistance=this.kind==='spitter'&&dist<175;
    const shouldMove=this.kind==='spitter'?dist>250||keepDistance:dist>contact-2;
    if(shouldMove&&this.fuse<0&&!staggered){
      let vx=keepDistance?-dx/dist:dx/dist,vy=keepDistance?-dy/dist:dy/dist;
      // Corredores tentam flanquear o personagem antes do ataque.
      if(this.kind==='runner'&&dist>73&&dist<270){
        const side=this.evadeSide*(.30+Math.sin(this.stride*.32)*.13);
        vx+=-dy/dist*side;vy+=dx/dist*side;
      }
      // Zumbis compartilham o campo de fluxo; nenhum A* individual por frame.
      const path=context.navigation?.steer(this,player,{x:vx,y:vy});
      if(path){vx=path.x;vy=path.y;}
      // Separação consulta apenas vizinhos próximos via hash espacial.
      const nearby=context.nearby?.(this.x,this.y,this.radius*3)||others;
      for(const other of nearby){
        if(other===this||!other.alive)continue;
        const ox=this.x-other.x,oy=this.y-other.y,dd=Math.hypot(ox,oy);
        if(dd>0&&dd<this.radius+other.radius+2){const strength=this.kind==='tank'?.18:.38;vx+=ox/dd*strength;vy+=oy/dd*strength;}
      }
      const hurtLegs=Number(this.limbs.leftLeg>0)+Number(this.limbs.rightLeg>0);
      const locomotion=this.crawling?.34:Math.max(.46,1-hurtLegs*.20);
      const len=Math.hypot(vx,vy)||1,sx=vx/len*this.speed*locomotion*dt,sy=vy/len*this.speed*locomotion*dt;
      const next=slideCircle(this.x,this.y,sx,sy,this.radius);
      if(Math.hypot(next.x-this.x,next.y-this.y)<this.speed*dt*.12){
        this.stuckTime+=dt;
        const sign=this.evadeSide,detour=slideCircle(this.x,this.y,-vy*sign*this.speed*dt,vx*sign*this.speed*dt,this.radius);
        if(detour.x===this.x&&detour.y===this.y&&this.stuckTime>.3){this.evadeSide*=-1;this.stuckTime=0;}
        this.x=detour.x;this.y=detour.y;
      }else{this.x=next.x;this.y=next.y;this.stuckTime=0;}
      this.heading=Math.atan2(vy,vx);
    }
    this.animation=this.fuse>=0?'charge':this.flinch>0?'hurt':dist<contact?'attack':'walk';
    this.stride+=dt*(this.crawling?5:this.kind==='runner'?15:this.kind==='tank'?4:7);
    if(dist<contact&&this.attackCooldown===0&&this.kind!=='spitter'&&!staggered){
      this.attackCooldown=this.template.attackInterval;
      return this.damage*(this.crawling?.65:1)*Math.max(.3,1-(Number(this.limbs.leftArm>0)+Number(this.limbs.rightArm>0))*.28);
    }
    return 0;
  }
  hit(damage,impact=null){
    if(!this.alive)return false;
    const oldHp=this.hp;
    this.hp=Math.max(0,this.hp-Math.max(0,damage));
    // Q.02.5 R1: cada acerto gera seu próprio número, baseado na perda REAL de HP.
    const actualDamage=oldHp-this.hp;
    if(actualDamage>0){
      const n=DAMAGE_POPUPS.length;
      DAMAGE_POPUPS.push({amount:actualDamage,headshot:!!impact?.headshot,x:this.x,y:this.y,at:performance.now(),offset:(n%5-2)*9+(Math.random()-.5)*5});
      if(DAMAGE_POPUPS.length>110)DAMAGE_POPUPS.splice(0,DAMAGE_POPUPS.length-110);
    }
    this.flinch=.15;
    // Ferimentos localizados: afetam braços/pernas mesmo se o zumbi sobreviver.
    // Chefes nunca recebem amputação funcional: regras da FIX.1 intactas.
    const zone=impact?.zone;
    if(this.hp>0 && zone in this.limbs && actualDamage>=3){
      this.limbs[zone]+=actualDamage;
      const threshold=this.maxHp*(zone.endsWith('Leg')?.23:.30);
      if(this.limbs[zone]>=threshold && !this.lostLimbs.has(zone)){
        this.lostLimbs.add(zone);
        this.amputationEvents.push(zone);
        this.hitStun=Math.max(this.hitStun,.19);
        if(zone.endsWith('Leg')&&this.lostLimbs.has('leftLeg')&&this.lostLimbs.has('rightLeg')){
          this.crawling=true;this.radius=Math.max(9,this.radius*.78);
        }
      }
    }
    if(impact&&this.alive&&Number.isFinite(impact.dx)&&Number.isFinite(impact.dy)){
      const mag=Math.hypot(impact.dx,impact.dy)||1;
      const dx=impact.dx/mag,dy=impact.dy/mag;
      // Q.02.1 — impulso proporcional à força do acerto, limitado por classe.
      // Dano efetivo, direção e resistência definem a reação sem teleportar
      // inimigos, atravessar obstáculos ou travar hordas com tiros repetidos.
      const heavy=this.kind==='tank';
      const effectiveDamage=Math.min(Math.max(0,Number(damage)||0),80);
      const intensity=Math.min(1.6,Math.max(.65,.65+effectiveDamage/70));
      const baseForce=heavy?65:this.kind==='runner'?142:this.kind==='bomber'?112:126;
      const force=baseForce*intensity;
      const limit=heavy?140:245;
      this.hitVX=Math.max(-limit,Math.min(limit,this.hitVX+dx*force));
      this.hitVY=Math.max(-limit,Math.min(limit,this.hitVY+dy*force));
      this.hitDirX=dx;this.hitDirY=dy;
      const stun=heavy?.035:Math.min(.115,.052+effectiveDamage*.0008);
      this.hitStun=Math.max(this.hitStun,stun);
      this.flinch=Math.max(this.flinch,heavy?.105:Math.min(.21,.12+effectiveDamage*.001));
      this.attackCooldown=Math.max(this.attackCooldown,heavy?.025:.055);
    }
    return !this.alive;
  }
  draw(ctx,assets){
    const atlas=assets.get(this.template.sprite+'Atlas');
    const img=assets.get(this.template.sprite)||assets.get('zombie');
    const radius=this.radius,scale=this.kind==='tank'?1.4:this.kind==='runner'?.88:1;
    ctx.save();ctx.translate(Math.round(this.x),Math.round(this.y));
    ctx.fillStyle='rgba(7,16,18,.56)';ctx.beginPath();ctx.ellipse(0,radius*.75,radius*1.02,radius*.48,0,0,Math.PI*2);ctx.fill();
    if(this.kind==='bomber'&&this.fuse>=0){
      const flicker=Math.sin(this.fuse*30)>0;
      ctx.fillStyle=`rgba(244,116,86,${flicker?.22:.10})`;
      ctx.beginPath();ctx.arc(0,0,69,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ff9a7d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,69,0,Math.PI*2);ctx.stroke();
    }
    if(this.flinch>0)ctx.filter='brightness(2.15)';
    // A sprite, não a câmera, recua e inclina por alguns frames.
    const reaction=this.flinch>0?Math.sin((this.flinch/.15)*Math.PI)*1:0;
    const tilt=(this.hitDirX>=0?1:-1)*reaction*(this.kind==='tank'?.045:.11);
    ctx.translate(this.hitDirX*reaction*2.1,this.hitDirY*reaction*2.1);
    ctx.rotate(tilt);
    const bounce=this.animation==='walk'?Math.sin(this.stride)*.85:0;
    const lean=this.animation==='attack'?Math.sin(this.stride*3)*1.5:0;
    // Direções genuínas; evitar inverter o mesmo sprite (que mostrava o rosto nas costas).
    const direction=((Math.round(this.heading/(Math.PI/4))%8)+8)%8;
    const frame=this.hitStun>0?0:Math.floor(this.stride*.52)%4;
    const size=this.kind==='tank'?1.23:this.kind==='runner'?.84:this.kind==='bomber'?1.02:1;
    if(this.crawling){
      // Q.02.3 R1: silhueta rastejante dedicada, vista superior, sem comprimir o sprite em pé.
      // A cabeça aponta para a direção do movimento; os braços se alternam a cada passada.
      const phase=this.stride*1.35, pull=Math.sin(phase)*3.2;
      const forward=Math.sin(phase*2)*1.2;
      ctx.save();
      ctx.rotate(this.heading);
      ctx.translate(forward,0);
      ctx.imageSmoothingEnabled=false;
      // Rastro discreto fica sob o corpo, não sobre o personagem.
      ctx.fillStyle='rgba(87,21,26,.43)';
      ctx.fillRect(-23,-5,14,3);ctx.fillRect(-29,2,10,2);
      // Pernas quebradas e assimétricas atrás do tronco.
      ctx.fillStyle='#35433c';
      ctx.fillRect(-19,-9,13,6);
      ctx.fillStyle='#5b3532';
      ctx.fillRect(-23,-9,6,5);
      ctx.fillStyle='#29342f';
      ctx.fillRect(-16,4,8,6);
      // Braços apoiados no asfalto, alternando o movimento.
      ctx.fillStyle='#667b6a';
      ctx.fillRect(-4,-15+pull,16,6);
      ctx.fillRect(-4,9-pull,16,6);
      ctx.fillStyle='#9a8574';
      ctx.fillRect(9,-15+pull,5,6);
      ctx.fillRect(9,9-pull,5,6);
      // Tronco horizontal com contraste suficiente para ler no asfalto.
      ctx.fillStyle='#253a35';ctx.fillRect(-11,-10,22,20);
      ctx.fillStyle='#547467';ctx.fillRect(-8,-8,17,15);
      ctx.fillStyle='#26332d';ctx.fillRect(-6,-5,12,4);
      // Cabeça voltada para frente, sem pernas de sprite em pé.
      ctx.fillStyle='#202b27';ctx.fillRect(9,-8,13,16);
      ctx.fillStyle='#a18b78';ctx.fillRect(11,-7,10,13);
      ctx.fillStyle='#342e2c';ctx.fillRect(18,-4,3,3);
      ctx.fillStyle='#8b3438';ctx.fillRect(18,3,3,3);
      ctx.restore();
    } else if(atlas){
      const previous=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(atlas,direction*48,frame*56,48,56,-23*size+lean,-30*size+bounce,46*size,54*size);
      ctx.imageSmoothingEnabled=previous;
    }else if(img)ctx.drawImage(img,-18*scale+lean,-21*scale+bounce,36*scale,40*scale);
    else{ctx.fillStyle=this.template.tint;ctx.fillRect(-radius,-radius,radius*2,radius*2);}
    ctx.filter='none';
    if(this.kind!=='normal'&&this.kind!=='runner'&&this.hp<this.maxHp){
      ctx.fillStyle='rgba(15,24,28,.8)';ctx.fillRect(-16,-radius-16,32,4);
      ctx.fillStyle=this.template.tint;ctx.fillRect(-16,-radius-16,32*this.hp/this.maxHp,4);
    }
    ctx.restore();
  }
}

