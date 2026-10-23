// -- src/world/SpitWeatherAmmo.js --
// R42 · Ares + Poseidon + Hefesto — pedidos do Theo (23/10):
// 1) Cuspe do Cuspidor arremessado: sai em arco (sobe e desce), com sombra no chão mostrando onde vai cair.
//    Ao bater no chão estoura e deixa uma poça roxa de gosma por alguns segundos; quem pisa leva dano.
//    Se cair em cima do jogador, o estouro também machuca. Os zumbis não sofrem com a poça.
// 2) Ciclo do clima: a partida começa chovendo (com as poças já cheias); a chuva para, o sol do fim da tarde
//    deixa as poças brilhando e vai secando; a noite fica escura e sem chuva; no amanhecer volta a chover e
//    depois o sol da manhã seca tudo de novo. (O timer da chuva da R41 usa a mesma conta, via pzWetAt.)
// 3) Bala dos zumbis: todo zumbi que morre solta uma bala 3D girando (menor que os outros itens). Ela dá
//    5 balas e fica no mapa até alguém pegar.

// ---------- 1) cuspe arremessado ----------
const PZ_SPIT={pools:[],speed:230,poolLife:6,poolR:24};
{const _shoot=EnemyAttacks.prototype.shoot;
 EnemyAttacks.prototype.shoot=function(x,y,dx,dy,speed,damage,color='#c99cff'){
   const pl=window.__projectZGame?.scenes?.current?.run?.player;
   if(color!=='#c99cff'||!pl)return _shoot.apply(this,arguments);
   // mira onde o jogador vai estar (um pouco à frente), com erro pequeno
   const d0=Math.hypot(pl.x-x,pl.y-y),flight=Math.max(.45,Math.min(1.25,d0/PZ_SPIT.speed));
   const vx=pl.vx||0,vy=pl.vy||0,err=(1-Math.random()*2)*14;
   const tx=pl.x+vx*flight*.5+(-dy)*err,ty=pl.y+vy*flight*.5+dx*err;
   this.projectiles.push({lob:1,x,y,x0:x,y0:y,tx,ty,t:0,T:flight,H:34+d0*.14,damage,color,dx,dy,life:flight+.1});
   if(this.projectiles.length>72)this.projectiles.shift();
 };}
{const _up=EnemyAttacks.prototype.update;
 EnemyAttacks.prototype.update=function(dt,player,onDamage){
   const lobs=this.projectiles.filter(p=>p.lob);this.projectiles=this.projectiles.filter(p=>!p.lob);
   _up.call(this,dt,player,onDamage);
   for(const p of lobs){
     p.t+=dt;const k=Math.min(1,p.t/p.T);
     const nx=p.x0+(p.tx-p.x0)*k,ny=p.y0+(p.ty-p.y0)*k;
     p.dx=nx-p.x;p.dy=ny-p.y;p.x=nx;p.y=ny;p.z=4*p.H*k*(1-k)+6*(1-k);
     if(k<1){this.projectiles.push(p);continue;}
     // estourou no chão
     if(Math.hypot(player.x-p.x,player.y-p.y)<player.radius+16)onDamage(p.damage);
     const free=typeof canOccupy!=='function'||canOccupy(p.x,p.y,6);
     if(free){PZ_SPIT.pools.push({x:p.x,y:p.y,t:0,life:PZ_SPIT.poolLife,r:PZ_SPIT.poolR*(.85+Math.random()*.3),dmg:p.damage*.32,tick:0,seed:Math.random()*100});
       if(PZ_SPIT.pools.length>14)PZ_SPIT.pools.shift();}
     this.splats=(this.splats||[]);this.splats.push({x:p.x,y:p.y,t:0});
   }
   // poça: dano a cada meio segundo enquanto o jogador está dentro
   let n=0;const P=PZ_SPIT.pools;
   for(const q of P){q.t+=dt;
     const inside=Math.hypot((player.x-q.x)/q.r,(player.y+6-q.y)/(q.r*.62))<1;
     if(inside&&q.t<q.life-.4){q.tick-=dt;if(q.tick<=0){q.tick=.5;onDamage(q.dmg);}}else q.tick=Math.min(q.tick,.15);
     if(q.t<q.life)P[n++]=q;}
   P.length=n;
   if(this.splats){let m=0;for(const s of this.splats){s.t+=dt;if(s.t<.45)this.splats[m++]=s;}this.splats.length=m;}
 };}
function pzSpitPool(ctx,q,time){
  const fadeIn=Math.min(1,q.t/.18),fadeOut=Math.min(1,(q.life-q.t)/1.2),a=fadeIn*fadeOut,r=q.r*(.55+.45*Math.min(1,q.t/.25));
  ctx.save();ctx.translate(q.x,q.y);ctx.globalAlpha=a;
  // contorno irregular da gosma
  const pts=[];for(let i=0;i<18;i++){const an=i/18*Math.PI*2,w=1+.16*Math.sin(an*3+q.seed)+.1*Math.sin(an*5+q.seed*2);pts.push([Math.cos(an)*r*w,Math.sin(an)*r*.62*w]);}
  const path=()=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();};
  ctx.fillStyle='rgba(40,10,60,.45)';ctx.save();ctx.translate(1.5,2);path();ctx.fill();ctx.restore();
  const g=ctx.createRadialGradient(-r*.25,-r*.2,0,0,0,r*1.1);g.addColorStop(0,'#e3b8ff');g.addColorStop(.35,'#a65ee6');g.addColorStop(1,'#4d1e78');
  ctx.fillStyle=g;path();ctx.fill();
  ctx.strokeStyle='rgba(235,200,255,.55)';ctx.lineWidth=.9;path();ctx.stroke();
  // bolhas que estouram
  for(let i=0;i<5;i++){const ph=(time*1.3+i*.37+q.seed)%1,bx=Math.sin(i*2.3+q.seed)*r*.55,by=Math.cos(i*1.7+q.seed)*r*.3,br=1+ph*2.6;
    ctx.globalAlpha=a*(1-ph)*.85;ctx.strokeStyle='#f1dcff';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.stroke();}
  // brilho molhado
  ctx.globalAlpha=a*.7;ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(-r*.3,-r*.18,r*.22,r*.07,-.3,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
{const _dr=EnemyAttacks.prototype.draw;
 EnemyAttacks.prototype.draw=function(ctx){
   const time=performance.now()*.001;
   for(const q of PZ_SPIT.pools)pzSpitPool(ctx,q,time);
   // respingo do estouro
   for(const s of this.splats||[]){const k=s.t/.45;ctx.save();ctx.globalAlpha=1-k;ctx.fillStyle='#c99cff';
     for(let i=0;i<8;i++){const an=i/8*Math.PI*2+s.x,d=4+k*20;ctx.beginPath();ctx.arc(s.x+Math.cos(an)*d,s.y+Math.sin(an)*d*.6-Math.sin(k*Math.PI)*8,2.2*(1-k)+.6,0,Math.PI*2);ctx.fill();}
     ctx.restore();}
   const lobs=this.projectiles.filter(p=>p.lob),rest=this.projectiles.filter(p=>!p.lob);
   // sombra no chão (mostra onde vai cair) e a bolha no alto
   for(const p of lobs){
     ctx.save();const k=Math.min(1,p.t/p.T);
     ctx.globalAlpha=.25+.35*k;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,p.y+2,4+3*k,2+1.4*k,0,0,Math.PI*2);ctx.fill();
     ctx.globalAlpha=.18+.25*k;ctx.strokeStyle='#c99cff';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.tx,p.ty+2,PZ_SPIT.poolR*.6,PZ_SPIT.poolR*.36,0,0,Math.PI*2);ctx.stroke();
     ctx.restore();
   }
   // a bolha é desenhada no alto (y menos a altura), com a direção do voo já contando a subida/descida
   const view=lobs.map(p=>{const k=Math.min(1,p.t/p.T),vz=4*p.H*(1-2*k)/p.T,sx=(p.tx-p.x0)/p.T,sy=(p.ty-p.y0)/p.T-vz,l=Math.hypot(sx,sy)||1;
     return {x:p.x,y:p.y-(p.z||0),dx:sx/l,dy:sy/l,color:p.color};});
   this.projectiles=[...rest,...view];
   try{_dr.call(this,ctx);}finally{this.projectiles=[...rest,...lobs];}
 };}

// ---------- 2) ciclo do clima ----------
function pzWeatherCurve(t){
  const s=x=>x<=0?0:x>=1?1:x*x*(3-2*x);
  const c=((t%600)+600)%600;let w=0;
  // começa chovendo forte e para por volta de 1 min
  if(t<95)w=.8*(1-s((t-55)/40));
  // chuva do amanhecer (todo ciclo): começa no fim da madrugada e para com o sol da manhã
  const up=s((c-330)/22),down=1-s((c-405)/28);w=Math.max(w,.74*Math.min(up,down));
  if(w>0)w*=.88+.12*Math.sin(t/6.3)*Math.sin(t/2.9+1);
  return Math.max(0,Math.min(1,w));
}
{const _g=Q04_ENVIRONMENT.get;
 Q04_ENVIRONMENT.get=function(t,p){const e=_g.call(this,t,p);
   if(e&&typeof window.__PZ_RAIN_FORCE!=='number'&&!window.__PZ_OLD_WEATHER)e.wet=pzWeatherCurve(t||0);
   return e;};}
// timer da chuva (R41) segue o novo ciclo
pzWetAt=function(t){return window.__PZ_OLD_WEATHER?Math.max(0,Math.min(1,(Math.sin(t/79+.7)+Math.sin(t/137+2.2)*.5-.35)*.9)):pzWeatherCurve(t);};
// poças: começam cheias; depois da chuva o sol seca (rápido de dia, devagar no fim da tarde, quase nada à noite)
{const _u=WorldFX.prototype.update;
 WorldFX.prototype.update=function(dt,run,camera,world,env){
   const before=this.puddleLevel;
   const r=_u.apply(this,arguments);
   if(!this.__pzStartWet){this.__pzStartWet=1;if((env?.wet||0)>.4)this.puddleLevel=.95;}
   else if(env&&(env.wet||0)<=.12&&dt>0){
     const sun=Math.max(0,(env.solar||0))*(1-(env.dark||0));
     this.puddleLevel=Math.max(0,before-dt*(.0025+.03*sun*sun*2));
   }
   return r;
 };}

// ---------- 3) bala dos zumbis ----------
const PZ_BULLET={give:5,max:90};
{const _add=LootSystem.prototype.add;
 LootSystem.prototype.add=function(type,x,y,options={}){
   if(type!=='bullet')return _add.apply(this,arguments);
   if(typeof canOccupy==='function'&&!canOccupy(x,y,6))return null;
   const item={id:++this.nextId,type,x,y,age:0,phase:this.random()*Math.PI*2,persistent:true,small:true};
   this.items.push(item);
   const bullets=this.items.filter(i=>i.type==='bullet');
   if(bullets.length>PZ_BULLET.max){const old=bullets[0];this.items.splice(this.items.indexOf(old),1);}
   return item;
 };
 const _collect=LootSystem.prototype.collect;
 LootSystem.prototype.collect=function(item,player,gun,grenades){
   if(item.type!=='bullet')return _collect.apply(this,arguments);
   const amount=Math.min(PZ_BULLET.give,Math.max(0,this.ammoCap-gun.reserve));
   if(amount<=0)return null;
   gun.reserve+=amount;return {label:`+${amount} BALAS`,type:'ammo'};
 };}
{const _ck=CombatScene.prototype.creditKill;
 CombatScene.prototype.creditKill=function(target,died){
   const out=_ck.apply(this,arguments);
   try{const r=this.run;
     if(r&&died&&target&&target.kind!=='midnight'&&!target.__pzDropped){target.__pzDropped=1;
       // cai perto do corpo, num lugar livre
       for(const [ox,oy] of [[0,6],[10,4],[-10,4],[0,16],[14,-6],[-14,-6]]){if(r.loot.add('bullet',target.x+ox,target.y+oy))break;}}
   }catch(e){}
   return out;
 };}
// morte por explosão também solta a bala (creditKill sai antes nesse caso)
{const P=CombatScene.prototype,_ae=P.areaExplosion;
 if(_ae)P.areaExplosion=function(){const r=this.run,before=r?r.enemies.filter(e=>e.alive!==false):[];const out=_ae.apply(this,arguments);
   try{for(const e of before)if(e.alive===false&&!e.__pzDropped&&e.kind!=='midnight'){e.__pzDropped=1;r.loot.add('bullet',e.x,e.y+6);}}catch(err){}
   return out;};}
// modelo 3D da bala: deitada na diagonal (para o giro aparecer), corpo de latão redondo feito em fatias,
// ponta de cobre e espoleta no fundo
{const _model=pzL3Model;
 pzL3Model=function(item){
   if(item.type!=='bullet')return _model(item);
   let m=PZ_LOOT3D.models.get('bullet');if(m)return m;
   const parts=[],R=2.6,tilt=-.62,ca=Math.cos(tilt),sa=Math.sin(tilt);
   // silhueta da bala de lado: u ao longo (ponta em u<0), v de lado
   const sil=(scale)=>{const o=[],hw=R*scale;
     // ponta ogival
     for(let i=0;i<=8;i++){const a=i/8*Math.PI/2;o.push([-6.5-5.5*Math.cos(a)*(1-.15*Math.sin(a)),-hw*Math.sin(a)]);}
     o.push([3.5,-hw]);o.push([4.2,-hw*1.08]);o.push([6.8,-hw*1.08]);o.push([6.8,hw*1.08]);o.push([4.2,hw*1.08]);o.push([3.5,hw]);
     for(let i=8;i>=0;i--){const a=i/8*Math.PI/2;o.push([-6.5-5.5*Math.cos(a)*(1-.15*Math.sin(a)),hw*Math.sin(a)]);}
     return o.map(([u,v])=>[u*ca-v*sa,u*sa+v*ca]);};
   const paint=(c)=>{c.save();c.rotate(tilt);
     const g=c.createLinearGradient(0,-R,0,R);g.addColorStop(0,'#fff3b0');g.addColorStop(.35,'#e2b546');g.addColorStop(1,'#7c5a17');
     c.fillStyle=g;c.fillRect(-12,-R*1.2,19,R*2.4);
     const t=c.createLinearGradient(0,-R,0,R);t.addColorStop(0,'#ffc8a0');t.addColorStop(.4,'#c8693a');t.addColorStop(1,'#6a2d14');
     c.fillStyle=t;c.fillRect(-13,-R*1.2,7,R*2.4);
     c.fillStyle='rgba(60,40,10,.6)';c.fillRect(3.4,-R*1.2,.8,R*2.4);c.fillStyle='#b88a2c';c.fillRect(6.2,-R*.5,.6,R);
     c.restore();};
   for(const [z,k] of [[-1.9,.62],[-1,.9],[0,1],[1,.9],[1.9,.62]]){
     const o=sil(k);parts.push({outline:o,depth:1.05,z,side:'#a07a24',tex:pzL3Texture(`bullet:${k}`,o,paint)});}
   for(const p of parts){let area=0;const o=p.outline;for(let i=0;i<o.length;i++){const a=o[i],b=o[(i+1)%o.length];area+=a[0]*b[1]-b[0]*a[1];}
     p.edges=o.map((a,i)=>{const b=o[(i+1)%o.length];let nx=b[1]-a[1],ny=-(b[0]-a[0]);const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;if(area<0){nx=-nx;ny=-ny;}return{a,b,nx,ny,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2};});
     p.rgb=pzL3RGB(p.side);}
   m={parts};PZ_LOOT3D.models.set('bullet',m);return m;
 };}
{const _shade=pzL3Shade;pzL3Shade=function(item){return item.type==='bullet'?'#f3bf72':_shade(item);};}
