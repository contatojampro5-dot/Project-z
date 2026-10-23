// -- src/rendering/Sirens.js --
// R41 · Hélio + Eco — sirenes das viaturas, ambulâncias e caminhão de bombeiros.
// 1) Luz: o giroflex no teto pisca (polícia: vermelho/azul; SAMU: vermelho/branco; bombeiros: vermelho),
//    com halo no ar e a luz colorida batendo no chão em volta. À noite brilha bem mais. Também tinge o lado
//    dos zumbis/objetos virado para a viatura (luz direcional da R34).
// 2) Som: chegando perto (≈ 330 px), a sirene toca de verdade (WebAudio, sem arquivo): polícia faz o
//    "uóóó-uóóó" subindo e descendo, SAMU faz o "dó-dá" de dois tons, bombeiros um uivo mais lento.
//    Fica mais alta quanto mais perto, vem do lado certo (esquerda/direita) e some quando você se afasta.
// Carro explodido perde a sirene. window.__PZ_NO_SIRENS=true desliga tudo.

const PZ_SIREN={list:null,run:null,snd:null,hear:330};
const c3=c=>c[0]>230&&c[1]>230&&c[2]>230; // lâmpada branca
const PZ_SIREN_COLORS={police:[[255,40,48],[40,110,255]],ambulance:[[255,36,40],[255,250,245]],fire:[[255,46,34],[255,150,60]]};

// Monta a lista de veículos de emergência da partida (posição do giroflex em coordenadas locais).
function pzSirenBuild(run){
  const out=[],D=run.destructibles;if(!D)return out;
  for(const o of D.objects){
    if(o.kind!=='vehicle')continue;const v=o.visual;
    if(v.kind==='emergency'){
      out.push({o,type:v.type,x:v.x,y:v.y,a:v.rotation||0,s:v.scale||1,ly:-9,lx:6,z:15});
    }else if(v.kind==='district'&&v.prop?.type==='vehicle'&&(v.prop.x===982||v.prop.x===2185)){
      const amb=v.prop.x===982;
      out.push({o,type:amb?'ambulance':'fire',x:amb?979:2184,y:amb?1644:2106,a:Math.PI/2,s:amb?1.58:1.66,ly:-9,lx:6,z:15});
    }else if(v.kind==='civilian'||v.kind==='spriteCar'){
      const p=typeof pzCar3DParams==='function'?pzCar3DParams(o):null;if(!p)continue;
      const rand=mulberry32(Math.round(p.x*131+p.y*71)+p.kind.length*7),variant=pzCarVariant(p.kind,rand);
      if(variant!=='policia'&&variant!=='samu')continue;
      const [w,h]=PZ_CAR3D_DIMS[p.kind]||PZ_CAR3D_DIMS.sedan,S=pzCar3DShape(p.kind,variant,w,h);
      const ly=variant==='samu'?S.t0+5:(S.t0+S.t1)/2;
      out.push({o,type:variant==='samu'?'ambulance':'police',x:p.x,y:p.y,a:p.angle,s:1,ly,lx:w*.2,z:(S.zt||16)+1.6});
    }
  }
  return out;
}
function pzSirenList(run){
  if(PZ_SIREN.run!==run||!PZ_SIREN.list){PZ_SIREN.run=run;PZ_SIREN.list=pzSirenBuild(run);}
  return PZ_SIREN.list;
}
// Duas lâmpadas que se alternam, cada uma com piscada dupla (estroboscópio).
function pzSirenPhase(v,t){
  const per=v.type==='ambulance'?.62:v.type==='fire'?.9:.76,off=(v.x*.013+v.y*.007)%1;
  const u=((t/per+off)%1+1)%1,side=u<.5?0:1,w=(u%.5)/.5;
  const strobe=(w<.32?1:w<.44?.12:w<.76?1:.1);
  return [side===0?strobe:.06,side===1?strobe:.06];
}
function pzSirenWorld(v,lx){
  const c=Math.cos(v.a),s=Math.sin(v.a),X=lx*v.s,Y=v.ly*v.s;
  return [v.x+X*c-Y*s,v.y+X*s+Y*c];
}

// ---------- luz ----------
function pzSirensDraw(ctx,viewport,run,camera,env){
  if(window.__PZ_NO_SIRENS||!camera)return;
  const list=pzSirenList(run);if(!list.length)return;
  const t=performance.now()/1000,z=camera.zoom,night=smoothstep(.05,.7,env?.dark||0);
  const vw=viewport.width/z/2+160,vh=viewport.height/z/2+160;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';
  for(const v of list){
    if(!v.o.alive||Math.abs(v.x-camera.x)>vw||Math.abs(v.y-camera.y)>vh)continue;
    const k=pzSirenPhase(v,t),cols=PZ_SIREN_COLORS[v.type]||PZ_SIREN_COLORS.police;
    // luz batendo no chão dos dois lados do carro (fora da lataria, para não pintar o carro todo)
    for(let i=0;i<2;i++){
      const side=i?1:-1,c=Math.cos(v.a),sn=Math.sin(v.a),off=(v.lx+16)*v.s*side+side*14;
      const gs=camera.worldToScreen(v.x+off*c,v.y+off*sn);
      const white=c3(cols[i]),R=(46+50*night)*z,a=(.06+.17*night)*k[i]*(white?.45:1),col=cols[i];if(a<.01)continue;
      const g=ctx.createRadialGradient(gs.x,gs.y,0,gs.x,gs.y,R);
      g.addColorStop(0,`rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`);g.addColorStop(.5,`rgba(${col[0]},${col[1]},${col[2]},${(a*.3).toFixed(3)})`);g.addColorStop(1,`rgba(${col[0]},${col[1]},${col[2]},0)`);
      ctx.fillStyle=g;ctx.fillRect(gs.x-R,gs.y-R,R*2,R*2);
    }
    // giroflex no teto: lâmpada + halo no ar
    for(let i=0;i<2;i++){
      const [wx,wy]=pzSirenWorld(v,i?v.lx:-v.lx),top=pz3dTop(wx,wy,v.z),sp=camera.worldToScreen(top.x,top.y);
      const c=cols[i],kk=k[i];
      // lâmpada (sempre visível, mesmo apagada fica a cor do vidro)
      ctx.globalAlpha=1;ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${(.35+.65*kk).toFixed(3)})`;
      const lw=Math.max(3,4.6*z*v.s),lh=Math.max(2,2.8*z*v.s);ctx.fillRect(sp.x-lw/2,sp.y-lh/2,lw,lh);
      if(kk<.2)continue;
      const R=(15+18*night)*z*kk,a=(.55+.25*night)*kk*(c3(c)?.7:1);
      const g=ctx.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,R);
      g.addColorStop(0,`rgba(255,255,255,${Math.min(1,a*.8).toFixed(3)})`);g.addColorStop(.22,`rgba(${c[0]},${c[1]},${c[2]},${(a*.85).toFixed(3)})`);g.addColorStop(1,`rgba(${c[0]},${c[1]},${c[2]},0)`);
      ctx.fillStyle=g;ctx.fillRect(sp.x-R,sp.y-R,R*2,R*2);
      // risco horizontal (flare de lente) à noite
      if(night>.2){ctx.globalAlpha=.22*night*kk;ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.fillRect(sp.x-R*1.6,sp.y-.6,R*3.2,1.2);ctx.globalAlpha=1;}
    }
  }
  ctx.restore();
}
{const _da=PZ_LIGHTMAP.drawAfter.bind(PZ_LIGHTMAP);
 PZ_LIGHTMAP.drawAfter=function(ctx,viewport,run,camera){
   const r=_da(ctx,viewport,run,camera);
   try{pzSirensDraw(ctx,viewport,run,camera,PZ_LIGHTMAP.env||Q04_ENVIRONMENT.get(run.elapsed||0,true));}
   catch(e){if(!window.__pzSirenErr){window.__pzSirenErr=1;console.warn('sirene',e);}}
   return r;
 };}
// luz direcional: a sirene tinge o lado das coisas virado para ela
if(typeof pzDLCollect==='function'){
  const _pzSirenDL=pzDLCollect;
  pzDLCollect=function(run,world,camera){
    const r=_pzSirenDL.apply(this,arguments);
    try{
      if(window.__PZ_NO_SIRENS)return r;
      const t=performance.now()/1000,vw=camera.viewport.width/camera.zoom/2+260,vh=camera.viewport.height/camera.zoom/2+260;
      for(const v of pzSirenList(run)){
        if(!v.o.alive||Math.abs(v.x-camera.x)>vw||Math.abs(v.y-camera.y)>vh)continue;
        const k=pzSirenPhase(v,t),cols=PZ_SIREN_COLORS[v.type]||PZ_SIREN_COLORS.police,i=k[0]>=k[1]?0:1;
        if(k[i]>.3&&!c3(cols[i]))PZ_DL.lights.push({x:v.x,y:v.y,R:200,I:.5*k[i],rgb:cols[i],soft:1});
      }
    }catch(e){}
    return r;
  };
}

// ---------- som ----------
function pzSirenSoundSetup(a){
  if(PZ_SIREN.snd||!a.ctx)return PZ_SIREN.snd;
  const c=a.ctx,o=c.createOscillator();o.type='sawtooth';o.frequency.value=700;
  const o2=c.createOscillator();o2.type='square';o2.frequency.value=700;o2.detune.value=-1200;const g2=c.createGain();g2.gain.value=.25;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;lp.Q.value=1.2;
  const bp=c.createBiquadFilter();bp.type='peaking';bp.frequency.value=1100;bp.gain.value=6;
  const g=c.createGain();g.gain.value=0;
  const pan=c.createStereoPanner?c.createStereoPanner():null;
  o.connect(lp);o2.connect(g2).connect(lp);lp.connect(bp).connect(g);
  (pan?(g.connect(pan),pan):g).connect(a.bus?.environment||a.fxGain);
  o.start();o2.start();
  PZ_SIREN.snd={o,o2,lp,g,pan,t:0,cur:null};
  return PZ_SIREN.snd;
}
function pzSirenFreq(type,t){
  if(type==='ambulance')return (t%1.1)<.55?960:720;                         // dois tons (SAMU)
  if(type==='fire'){const u=(t%5)/5;return 520+680*Math.sin(Math.PI*u);}     // uivo lento
  const u=(t%3.4)/3.4;return 620+780*(u<.55?Math.sin(u/.55*Math.PI/2):Math.cos((u-.55)/.45*Math.PI/2)); // polícia: sobe e desce
}
{const P=AudioSystem.prototype,_ue=P.updateEnvironment;
 P.updateEnvironment=function(dt,environment,opts={}){
   const r=_ue.apply(this,arguments);
   try{
     if(!this.ctx||this.ctx.state!=='running')return r;
     const S=pzSirenSoundSetup(this);if(!S)return r;
     const now=this.ctx.currentTime,s=this.settings||{};
     const run=window.__projectZGame?.scenes?.current?.run,p=run?.player;
     let best=null,bd=Infinity;
     if(run&&p&&!run.over&&!opts.paused&&this.mode!=='menu'&&s.soundEnabled!==false&&!window.__PZ_NO_SIRENS&&!document.hidden){
       for(const v of pzSirenList(run)){if(!v.o.alive)continue;const d=Math.hypot(v.x-p.x,v.y-p.y);if(d<bd){bd=d;best=v;}}
     }
     const R=PZ_SIREN.hear,near=best&&bd<R?1-bd/R:0;
     S.t+=Math.max(0,dt||0);
     if(best&&near>0){
       const f=pzSirenFreq(best.type,S.t+(best.x%7));
       S.o.frequency.setTargetAtTime(f,now,best.type==='ambulance'?.012:.03);
       S.o2.frequency.setTargetAtTime(f,now,best.type==='ambulance'?.012:.03);
       S.lp.frequency.setTargetAtTime(900+1600*near,now,.2); // longe fica abafado
       if(S.pan)S.pan.pan.setTargetAtTime(Math.max(-.85,Math.min(.85,(best.x-p.x)/(R*.7))),now,.15);
     }
     S.g.gain.setTargetAtTime(.075*near*near,now,.25);
   }catch(e){}
   return r;
 };}
