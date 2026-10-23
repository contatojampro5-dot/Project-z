// -- src/rendering/Cinema.js --
// R38 · Hélio + Afrodite — visual de cinema (parte 1).
// 1) Cor de cinema: a tinta de cada hora do dia ficou mais marcada (pôr do sol alaranjado, noite azul, amanhecer
//    rosado, dia levemente frio nas sombras e quente nas luzes), com uma divisão de tom (céu frio em cima, chão quente
//    embaixo), vinheta com a cor da hora e granulado de filme que se mexe. Tudo em camadas CSS (placa de vídeo).
// 2) Halo nas luzes: fogo, faróis, lanterna, explosões e clarão do tiro "vazam" na tela (brilho somado), e as luzes
//    fortes soltam um risco horizontal de lente (flare). Usa a lista de luzes da R34 (PZ_DL.lights).
// 3) Neblina em camadas: duas camadas de névoa macia andando com o vento, em velocidades diferentes (paralaxe),
//    mais fortes quando o clima tem neblina ou chuva. Antes da escuridão da noite, então a noite também escurece a névoa.
// window.__PZ_NO_CINEMA=true desliga as três coisas para comparar.

// ---------- 1) cor de cinema ----------
(function(){
  const st=document.createElement('style');
  st.textContent=`.pz-post-split{background:linear-gradient(180deg,var(--pz-split-top,transparent) 0%,transparent 46%,transparent 58%,var(--pz-split-bot,transparent) 100%)}
.pz-post-vignette{background:radial-gradient(ellipse at center,transparent 42%,rgba(var(--pz-vig-rgb,0,0,0),var(--pz-vig,.3)) 100%)!important}
.pz-post.grain-on .pz-post-grain,.pz-post.grain-soft .pz-post-grain{display:block}
.pz-post.grain-soft .pz-post-grain{opacity:.028}
.pz-post-grain{animation:pzGrain .5s steps(4) infinite}
@keyframes pzGrain{0%{background-position:0 0}25%{background-position:-37px 21px}50%{background-position:53px -44px}75%{background-position:-18px -63px}100%{background-position:0 0}}
@media (prefers-reduced-motion:reduce){.pz-post-grain{animation:none}}`;
  document.head.appendChild(st);
})();
{const _ensure=PzPost.prototype.ensure;
 PzPost.prototype.ensure=function(){
   const ok=_ensure.call(this);
   if(ok&&!this.el.querySelector('.pz-post-split')){const i=document.createElement('i');i.className='pz-post-split';this.el.insertBefore(i,this.el.querySelector('.pz-post-vignette'));}
   return ok;
 };
 const _update=PzPost.prototype.update;
 PzPost.prototype.update=function(env,quality,reduced){
   if(window.__PZ_NO_CINEMA){if(this.el){this.el.querySelector('.pz-post-split')?.style.setProperty('display','none');this.el.style.removeProperty('--pz-vig-rgb');this.el.classList.remove('grain-soft');}return _update.call(this,env,quality,reduced);}
   if(!this.ensure())return;
   const golden=env.golden||0,dark=env.dark||0,wet=env.wet||0,dawn=env.phase==='dawn'?1-Math.abs(.5-dark)*2:0,day=Math.max(0,1-dark-golden);
   let r=0,g=0,b=0,a=0;const add=(cr,cg,cb,w)=>{r+=cr*w;g+=cg*w;b+=cb*w;a+=w;};
   add(255,150,70,.42*golden);add(34,70,150,.44*dark);add(255,128,150,.24*dawn);add(120,150,170,.12*day+.14*wet);
   const tint=a>.001?`rgba(${Math.round(r/a)},${Math.round(g/a)},${Math.round(b/a)},${Math.min(.17,a*.32).toFixed(3)})`:'transparent';
   // divisão de tom: em cima frio (céu), embaixo quente (chão/luzes); no pôr do sol, em cima quente também
   const top=`rgba(${golden>.3?'255,170,100':'40,70,120'},${(.06+.07*dark+.05*golden).toFixed(3)})`;
   const bot=`rgba(${dark>.5?'30,40,70':'150,95,50'},${(.05+.04*golden).toFixed(3)})`;
   const vigRGB=golden>.3?'40,14,4':dark>.4?'2,6,18':'6,8,10';
   const key=`${tint}|${top}|${bot}|${vigRGB}|${dark.toFixed(2)}|${quality}|${reduced}`;
   if(key===this.last)return;this.last=key;
   const s=this.el.style;
   s.setProperty('--pz-tint',tint);s.setProperty('--pz-split-top',top);s.setProperty('--pz-split-bot',bot);
   s.setProperty('--pz-vig-rgb',vigRGB);s.setProperty('--pz-vig',(.3+.22*dark+.06*golden).toFixed(3));
   this.el.querySelector('.pz-post-split')?.style.removeProperty('display');
   this.el.classList.toggle('grain-on',quality==='high');
   this.el.classList.toggle('grain-soft',quality==='medium');
 };}

// ---------- 2) halo nas luzes ----------
const PZ_CINEMA={halo:new Map(),fog:null};
function pzCinemaHaloSprite(rgb){
  const key=rgb.join(',');let c=PZ_CINEMA.halo.get(key);if(c)return c;
  c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,`rgba(255,248,236,.9)`);g.addColorStop(.12,`rgba(${key},.55)`);g.addColorStop(.4,`rgba(${key},.16)`);g.addColorStop(1,`rgba(${key},0)`);
  x.fillStyle=g;x.fillRect(0,0,128,128);PZ_CINEMA.halo.set(key,c);return c;
}
function pzCinemaHalos(ctx,viewport,run,camera){
  if(window.__PZ_NO_CINEMA||typeof PZ_DL==='undefined')return;
  const env=run.q04Environment||Q04_ENVIRONMENT.get(run.elapsed||0,true),dark=env.dark||0;
  const q=PZ_DL.quality,max=q==='low'?6:q==='high'?22:12;
  const list=PZ_DL.lights.filter(l=>!l.soft).sort((a,b)=>b.I-a.I).slice(0,max);
  if(!list.length)return;
  const z=camera.zoom||1,w=viewport.width,h=viewport.height,amb=.28+.72*dark;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const l of list){
    const sx=(l.x-camera.x)*z+w/2,sy=(l.y-camera.y)*z+h/2;
    // fogo: halo médio e um pouco acima da chama; farol/lanterna: ponto forte e pequeno; explosão: grande
    const blast=l.fire&&l.I>1.15,cone=l.face!=null;
    const R=(blast?150:l.fire?Math.min(120,l.R*.32):cone?46:70)*z;
    if(sx<-R||sy<-R||sx>w+R||sy>h+R)continue;
    const k=Math.min(1,l.I)*amb*(cone?.85:l.fire?.55:.6);
    ctx.globalAlpha=k;ctx.drawImage(pzCinemaHaloSprite(l.rgb),sx-R,sy-R-(l.fire?8*z:0),R*2,R*2);
    // risco de lente nas luzes fortes (faróis, explosões, lanterna)
    if((cone||blast)&&k>.25){
      const L=(blast?260:150)*z,g=ctx.createLinearGradient(sx-L,0,sx+L,0);
      g.addColorStop(0,`rgba(${l.rgb.join(',')},0)`);g.addColorStop(.5,`rgba(255,250,240,${(.32*k).toFixed(3)})`);g.addColorStop(1,`rgba(${l.rgb.join(',')},0)`);
      ctx.globalAlpha=1;ctx.fillStyle=g;ctx.fillRect(sx-L,sy-1.2*z,L*2,2.4*z);
    }
  }
  ctx.restore();
}
{const _da=PZ_LIGHTMAP.drawAfter.bind(PZ_LIGHTMAP);
 PZ_LIGHTMAP.drawAfter=function(ctx,viewport,run,camera){const r=_da(ctx,viewport,run,camera);try{pzCinemaHalos(ctx,viewport,run,camera);}catch(e){}return r;};}

// ---------- 3) neblina em camadas ----------
function pzCinemaFogTex(){
  if(PZ_CINEMA.fog)return PZ_CINEMA.fog;
  // textura que emenda nas bordas: manchas macias repetidas nos 9 vizinhos
  const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<46;i++){const px=rnd()*S,py=rnd()*S,r=18+rnd()*52,a=.05+rnd()*.09;
    for(const ox of [-S,0,S])for(const oy of [-S,0,S]){const g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(px+ox-r,py+oy-r,r*2,r*2);}}
  PZ_CINEMA.fog=c;return c;
}
function pzCinemaFog(ctx,viewport,run,camera,env){
  if(window.__PZ_NO_CINEMA||!camera)return;
  const fog=env.fog||0,wet=env.wet||0;
  const k=fog*.42+wet*.14;if(k<.03)return;
  const settings=window.__projectZGame?.save?.settings||{};if(graphicLevel(settings.weatherQuality)==='low')return;
  const tex=pzCinemaFogTex(),z=camera.zoom||1,w=viewport.width,h=viewport.height,t=run.elapsed||0;
  ctx.save();
  for(const [i,scale,par,spd,al] of [[0,3.2,.55,14,1],[1,2.1,.85,26,.7]]){
    const T=256*scale*z,ox=-(((camera.x*par+t*spd*(PZ_WIND.x||1))*z)%T+T)%T,oy=-(((camera.y*par+t*spd*.35*(PZ_WIND.y||.2))*z)%T+T)%T;
    ctx.globalAlpha=Math.min(.6,k*al);
    // névoa branca; a tinta da hora (camada CSS) e a escuridão da noite dão a cor
    for(let x=ox;x<w;x+=T)for(let y=oy;y<h;y+=T)ctx.drawImage(tex,x,y,T,T);
  }
  ctx.restore();
}
{const _ed=Q04_ENVIRONMENT.draw.bind(Q04_ENVIRONMENT);
 Q04_ENVIRONMENT.draw=function(ctx,viewport,run,camera,world){const r=_ed(ctx,viewport,run,camera,world);
   try{if(run)pzCinemaFog(ctx,viewport,run,camera,Q04_ENVIRONMENT.get(run.elapsed||0,true));}catch(e){}return r;};}
