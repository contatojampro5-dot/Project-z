// -- src/rendering/PerfAir.js (38w) --
// R46 · Hefesto — desempenho no celular (iPhone 11) sem mudar o visual.
// As camadas "macias" do ar — as duas névoas do cinema, a névoa do mapa de luz e as cortinas da chuva —
// eram pintadas uma por uma na tela inteira, na resolução cheia (até 4 telas cheias por quadro, só de névoa).
// Como são manchas e degradês bem suaves, dá no mesmo pintar todas numa tela pequena (40% do tamanho) e
// colar essa tela uma vez só, ampliada e suavizada. Resultado visual igual; custo de 1 tela em vez de 4.
// window.__PZ_NO_AIRBUF=true volta ao jeito antigo (para comparar).
const PZ_AIR={cv:null,cx:null,s:.4,dirty:false,lightFog:false};
function pzAirCtx(viewport){
  if(window.__PZ_NO_AIRBUF)return null;
  const s=PZ_AIR.s,W=Math.max(8,Math.ceil(viewport.width*s)),H=Math.max(8,Math.ceil(viewport.height*s));
  if(!PZ_AIR.cv||PZ_AIR.cv.width!==W||PZ_AIR.cv.height!==H){
    PZ_AIR.cv=document.createElement('canvas');PZ_AIR.cv.width=W;PZ_AIR.cv.height=H;PZ_AIR.cx=PZ_AIR.cv.getContext('2d');PZ_AIR.dirty=false;
  }
  const c=PZ_AIR.cx;
  if(!PZ_AIR.dirty){c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.clearRect(0,0,W,H);PZ_AIR.dirty=true;}
  c.setTransform(s,0,0,s,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  return c;
}
function pzAirFlush(ctx,viewport){
  if(!PZ_AIR.dirty)return;PZ_AIR.dirty=false;
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=true;
  try{ctx.imageSmoothingQuality='low';}catch(e){}
  ctx.drawImage(PZ_AIR.cv,0,0,viewport.width,viewport.height);
  ctx.restore();
}

// névoa do cinema (38p) + névoa do mapa de luz (38a) vão para a tela pequena; a cortina da chuva (38o) já foi.
{
  const _cineFog=pzCinemaFog,_lightFog=PzLightMap.prototype.drawFog;
  pzCinemaFog=function(ctx,viewport,run,camera,env){
    const air=pzAirCtx(viewport);
    if(!air){return _cineFog(ctx,viewport,run,camera,env);}
    try{
      _cineFog(air,viewport,run,camera,env);
      // a névoa do mapa de luz, com a mesma regra de quando ela aparece (38f drawLux)
      PZ_AIR.lightFog=false;
      const LM=PZ_LIGHTMAP,q=LM.quality(),e=Q04_ENVIRONMENT.get(run.elapsed||0,true);
      if(!(window.__PZ_DIAG&&!window.__PZ_DIAG.light)&&!window.__PZ_OLD_LIGHT&&(q==='high'||(q!=='low'&&Math.max(e.fog||0,e.dark*.55)>.28))){
        air.save();_lightFog.call(LM,air,viewport,camera,e);air.restore();PZ_AIR.lightFog=true;
      }
    }finally{pzAirFlush(ctx,viewport);}
  };
  PzLightMap.prototype.drawFog=function(ctx,viewport,camera,env){
    if(PZ_AIR.lightFog){PZ_AIR.lightFog=false;return;} // já foi junto com a névoa do cinema
    return _lightFog.call(this,ctx,viewport,camera,env);
  };
}

// ---------- camadas da placa de vídeo (CSS) ----------
// Antes: tinta, divisão de tom e vinheta eram 3 camadas de tela cheia por cima do jogo, e o degradê de cima/baixo era
// pintado no canvas a cada quadro. Agora as quatro são fundos de UMA camada só (mesma ordem, mesmas cores).
// O grão do filme passa a andar com "transform" (a placa só desloca a imagem) em vez de repintar 8 vezes por segundo.
(function(){
  const st=document.createElement('style');
  st.textContent=`.pz-post.pz-merged{background:
  radial-gradient(ellipse at center,transparent 42%,rgba(var(--pz-vig-rgb,0,0,0),var(--pz-vig,.3)) 100%),
  linear-gradient(180deg,var(--pz-split-top,transparent) 0%,transparent 46%,transparent 58%,var(--pz-split-bot,transparent) 100%),
  linear-gradient(var(--pz-tint,transparent),var(--pz-tint,transparent)),
  linear-gradient(180deg,rgba(3,17,25,.26) 0%,rgba(3,17,25,0) 38%,rgba(3,17,25,.12) 100%)}
.pz-post.pz-merged.pz-nocine{--pz-split-top:transparent;--pz-split-bot:transparent}
.pz-post.pz-merged>.pz-post-grade,.pz-post.pz-merged>.pz-post-split,.pz-post.pz-merged>.pz-post-vignette{display:none!important}
.pz-post.pz-merged>.pz-post-grain{inset:-64px;animation:pzGrainT .5s steps(4) infinite;will-change:transform}
@keyframes pzGrainT{0%{transform:translate(0,0)}25%{transform:translate(-37px,21px)}50%{transform:translate(53px,-44px)}75%{transform:translate(-18px,-63px)}100%{transform:translate(0,0)}}
@media (prefers-reduced-motion:reduce){.pz-post.pz-merged>.pz-post-grain{animation:none}}
.app[data-scene="field"] #game-canvas{animation-fill-mode:backwards!important}`;
  document.head.appendChild(st);
})();
function pzEdgeOnPost(){
  const el=typeof PZ_POST!=='undefined'&&PZ_POST.el;
  return !!(el&&el.isConnected&&el.classList.contains('pz-merged')&&el.style.display!=='none'&&!window.__PZ_NO_AIRBUF);
}
{const _up=PzPost.prototype.update;
 PzPost.prototype.update=function(env,quality,reduced){
   const r=_up.call(this,env,quality,reduced);
   if(this.el){this.el.classList.toggle('pz-merged',!window.__PZ_NO_AIRBUF);this.el.classList.toggle('pz-nocine',!!window.__PZ_NO_CINEMA);}
   return r;
 };}

// ---------- sem engasgo ao andar pelo mapa ----------
// A cor da lataria de cada carro 3D era medida (leitura de pixel do canvas) na primeira vez que o carro aparecia.
// No iPhone essa leitura trava o quadro. Agora todas as medidas são feitas no começo da partida, de uma vez.
if(typeof pzCarDrawables==='function'&&typeof pzCar3DSprite==='function'){
  const _pzCarDrw=pzCarDrawables;
  pzCarDrawables=function(){
    const run=window.__projectZGame?.scenes?.current?.run;
    if(run&&!run.__pzCarsWarm&&run.destructibles){
      run.__pzCarsWarm=true;
      for(const o of run.destructibles.objects){if(o.kind!=='vehicle')continue;const p=pzCar3DParams(o);if(p)try{pzCar3DSprite(p);}catch(e){}}
    }
    return _pzCarDrw.apply(this,arguments);
  };
}
