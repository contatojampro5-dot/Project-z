// -- src/rendering/CinemaLife.js --
// R39 · Ártemis + Hélio — visual de cinema (parte 2): câmera viva e partículas no ar.
// Câmera (sem tremer a tela, regra do dono):
//  • quando um chefe aparece, a câmera dá um zoom leve e devagar (8%) e depois volta;
//  • quando cai o último zumbi da horda (onda acabou e não sobrou ninguém), o tempo fica em câmera lenta por
//    um instante e a câmera aproxima um pouquinho.
// Partículas (desenhadas na tela, poucas, sem pesar):
//  • cinzas caindo da cidade em chamas, levadas pelo vento (mais perto do muro e à noite);
//  • poeira brilhando no sol durante o dia;
//  • faíscas subindo das fogueiras e carros em chamas, brilhando por cima da escuridão.
// window.__PZ_NO_CINEMA=true desliga também esta parte.
const PZ_CLIFE={zoomK:0,zoomT:0,zoomPeak:0,slowT:0,lastBoss:null,lastAlive:0,lastKills:0,ash:[],dust:[],sparks:[],lastT:0};

// ---------- câmera ----------
{const _rs=Camera.prototype.resize;
 Camera.prototype.resize=function(){const r=_rs.apply(this,arguments);this.baseZoom=this.zoom;return r;};}
function pzCLifeZoom(dt){
  // sobe rápido e desce devagar (curva suave)
  if(PZ_CLIFE.zoomT>0){PZ_CLIFE.zoomT-=dt;PZ_CLIFE.zoomK+=(PZ_CLIFE.zoomPeak-PZ_CLIFE.zoomK)*Math.min(1,dt*2.2);}
  else PZ_CLIFE.zoomK+=(0-PZ_CLIFE.zoomK)*Math.min(1,dt*1.1);
  if(Math.abs(PZ_CLIFE.zoomK)<.0005)PZ_CLIFE.zoomK=0;
}
{const P=CombatScene.prototype,_u=P.update;
 P.update=function(dt){
   const r=this.run,cam=this.game?.camera;
   if(!r||r.over||window.__PZ_NO_CINEMA){if(cam&&cam.baseZoom)cam.zoom=cam.baseZoom;return _u.call(this,dt);}
   // câmera lenta do último zumbi: o mundo anda a 30% por ~0,9 s de tempo real
   let scale=1;if(PZ_CLIFE.slowT>0){PZ_CLIFE.slowT-=dt;scale=PZ_CLIFE.slowT>.25?.3:.3+.7*(1-PZ_CLIFE.slowT/.25);}
   const out=_u.call(this,dt*scale);
   // chefe novo na área
   if(r.boss&&r.boss!==PZ_CLIFE.lastBoss&&r.boss.alive){PZ_CLIFE.lastBoss=r.boss;PZ_CLIFE.zoomPeak=.08;PZ_CLIFE.zoomT=1.8;}
   // último zumbi da horda
   const alive=r.enemies.filter(e=>e.alive!==false).length;
   if(r.waves?.phase==='rest'&&PZ_CLIFE.lastAlive>0&&alive===0&&r.kills>PZ_CLIFE.lastKills&&!window.__projectZGame?.save?.settings?.reducedMotion){
     PZ_CLIFE.slowT=.9;PZ_CLIFE.zoomPeak=.05;PZ_CLIFE.zoomT=.7;}
   PZ_CLIFE.lastAlive=alive;PZ_CLIFE.lastKills=r.kills;
   pzCLifeZoom(dt);
   if(cam){if(!cam.baseZoom)cam.baseZoom=cam.zoom;cam.zoom=cam.baseZoom*(1+PZ_CLIFE.zoomK);}
   return out;
 };}

// ---------- partículas ----------
function pzCLifeStep(run,camera,viewport,env){
  const now=run.elapsed||0;let dt=now-PZ_CLIFE.lastT;PZ_CLIFE.lastT=now;if(!(dt>0&&dt<.1))dt=dt>=.1?.1:0;
  const q=typeof PZ_DL!=='undefined'?PZ_DL.quality:'medium',mul=q==='low'?.45:q==='high'?1.4:1;
  const w=viewport.width,h=viewport.height,z=camera.zoom||1,W=PZ_WIND,dark=env.dark||0;
  // cinzas: mais perto do muro (fogo lá fora) e à noite
  const edge=Math.min(1,Math.max(0,1-Math.min(camera.x,camera.y,GAME.map.width-camera.x,GAME.map.height-camera.y)/900));
  const wantAsh=Math.round((14+40*edge+16*dark)*mul);
  const A=PZ_CLIFE.ash;
  while(A.length<wantAsh)A.push({x:Math.random()*w,y:Math.random()*h,vx:0,vy:0,s:1.2+Math.random()*1.8,ph:Math.random()*6.3,hot:Math.random()<.22});
  if(A.length>wantAsh)A.length=wantAsh;
  for(const a of A){a.ph+=dt*(1.5+a.s);a.x+=(W.x*38*W.strength+Math.sin(a.ph)*9)*dt*z;a.y+=(W.y*38*W.strength+14+Math.cos(a.ph*.7)*6)*dt*z;
    if(a.x<-10)a.x+=w+20;if(a.x>w+10)a.x-=w+20;if(a.y<-10)a.y+=h+20;if(a.y>h+10)a.y-=h+20;}
  // poeira no sol: só de dia
  const day=Math.max(0,(env.solar||0)-dark*.8),wantDust=Math.round(26*mul*Math.min(1,day*2));
  const D=PZ_CLIFE.dust;
  while(D.length<wantDust)D.push({x:Math.random()*w,y:Math.random()*h,ph:Math.random()*6.3,s:.6+Math.random()*1.1});
  if(D.length>wantDust)D.length=wantDust;
  for(const d of D){d.ph+=dt*.8;d.x+=(Math.sin(d.ph)*6+W.x*5)*dt;d.y+=(Math.cos(d.ph*.8)*5-2)*dt;if(d.x<0)d.x+=w;if(d.x>w)d.x-=w;if(d.y<0)d.y+=h;if(d.y>h)d.y-=h;}
  // faíscas das luzes de fogo (mundo)
  const S=PZ_CLIFE.sparks,maxS=Math.round(70*mul);
  if(typeof PZ_DL!=='undefined')for(const l of PZ_DL.lights){if(!l.fire||S.length>=maxS)continue;
    if(Math.random()<dt*6*Math.min(1,l.I))S.push({x:l.x+(Math.random()-.5)*18,y:l.y+(Math.random()-.5)*10,z:6,vz:40+Math.random()*60,vx:(Math.random()-.5)*20,life:.9+Math.random()*1.1,t:0});}
  let n=0;for(const s of S){s.t+=dt;s.z+=s.vz*dt;s.vz*=.985;s.x+=(s.vx+W.x*40*W.strength)*dt;s.y+=W.y*40*W.strength*dt;if(s.t<s.life)S[n++]=s;}S.length=n;
}
function pzCLifeDrawAir(ctx,viewport,run,camera,env){
  if(window.__PZ_NO_CINEMA||!camera||!run)return;
  pzCLifeStep(run,camera,viewport,env);
  const dark=env.dark||0;
  ctx.save();
  // poeira no sol
  ctx.fillStyle='rgba(255,236,196,1)';
  for(const d of PZ_CLIFE.dust){ctx.globalAlpha=.18+.22*Math.sin(d.ph*2)**2;ctx.fillRect(d.x,d.y,d.s,d.s);}
  // cinzas (cinza claro; algumas ainda com brasa)
  for(const a of PZ_CLIFE.ash){if(a.hot)continue;
    ctx.globalAlpha=.35+.25*Math.sin(a.ph)**2;ctx.fillStyle=dark>.5?'#8d929a':'#b9b3aa';
    const sw=a.s*(.6+.4*Math.abs(Math.sin(a.ph)));ctx.fillRect(a.x,a.y,sw,a.s*.8);
  }
  ctx.restore();
}
function pzCLifeDrawSparks(ctx,viewport,run,camera){
  if(window.__PZ_NO_CINEMA||!camera)return;
  const z=camera.zoom||1,w=viewport.width,h=viewport.height;
  ctx.save();ctx.globalCompositeOperation='lighter';
  // cinzas ainda em brasa brilham por cima da escuridão
  ctx.fillStyle='#ff8a3a';
  for(const a of PZ_CLIFE.ash){if(!a.hot)continue;ctx.globalAlpha=.35+.45*Math.sin(a.ph*1.7)**2;ctx.fillRect(a.x,a.y,a.s*1.1,a.s*.9);}
  for(const s of PZ_CLIFE.sparks){
    const p=typeof pz3dP==='function'&&pz3dOn()?pz3dP(s.x,s.y,s.z):{x:s.x,y:s.y-s.z};
    const sx=(p.x-camera.x)*z+w/2,sy=(p.y-camera.y)*z+h/2;if(sx<-5||sy<-5||sx>w+5||sy>h+5)continue;
    const k=1-s.t/s.life,fl=.6+.4*Math.sin(s.t*40+s.x);
    ctx.globalAlpha=k*fl;ctx.fillStyle=k>.5?'#ffd27a':'#ff7a2a';
    ctx.fillRect(sx-.9*z,sy-.9*z,1.8*z,1.8*z);
    ctx.globalAlpha=k*.25;ctx.fillRect(sx-2.5*z,sy-2.5*z,5*z,5*z);
  }
  ctx.restore();
}
{const _ed=Q04_ENVIRONMENT.draw.bind(Q04_ENVIRONMENT);
 Q04_ENVIRONMENT.draw=function(ctx,viewport,run,camera,world){const r=_ed(ctx,viewport,run,camera,world);
   try{if(run)pzCLifeDrawAir(ctx,viewport,run,camera,Q04_ENVIRONMENT.get(run.elapsed||0,true));}catch(e){}return r;};}
{const _da=PZ_LIGHTMAP.drawAfter.bind(PZ_LIGHTMAP);
 PZ_LIGHTMAP.drawAfter=function(ctx,viewport,run,camera){const r=_da(ctx,viewport,run,camera);try{pzCLifeDrawSparks(ctx,viewport,run,camera);}catch(e){}return r;};}
