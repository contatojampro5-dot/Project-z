// -- R53 · ÚLTIMA CARTADA · zumbis 3D do Mixamo no jogo do navegador (Afrodite + Ares) --
// Os modelos que o Theo baixou do Mixamo (godot-preview/assets/mixamo) foram fotografados em 8 direções
// (laboratorio/src/mixamo_folhas: three.js + FBXLoader), na mesma célula 64×72 e nas mesmas linhas das folhas antigas:
// andar/correr (0), atacar (8), levar tiro (15), morrer (19) e rastejar sem pernas (28). Para cada um há também a folha
// sem o braço esquerdo e sem o direito. Comum: Prisoner, Warzombie, Copzombie, Parasite, Ch18 e Swat;
// corredor: Yaku e Zombiegirl. window.__PZ_OLD_ZOMBIES=true (antes de começar a partida) volta aos desenhos antigos.
const PZ_MIXAMO=Object.freeze({normal:['prisoner','warzombie','copzombie','parasite','ch18','swat'],runner:['yaku','zombiegirl']});
(function(){
  const cap=s=>'mx'+s[0].toUpperCase()+s.slice(1);
  for(const [kind,list] of Object.entries(PZ_MIXAMO)){
    const spec=PZ_SPRITES[kind],A=spec.anims;
    spec._old={variants:spec.variants,armless:spec.armless,legless:spec.legless};
    spec._new={variants:list.map(cap),legless:null,
      armless:{L:list.map(w=>cap(w)+'SemL'),R:list.map(w=>cap(w)+'SemR'),anims:{walk:A.walk,attack:A.attack,hit:A.hit,death:A.death,crawl:A.crawl}}};
  }
})();
function pzMixamoApply(){
  const old=!!window.__PZ_OLD_ZOMBIES;
  for(const kind of Object.keys(PZ_MIXAMO)){const s=PZ_SPRITES[kind],src=old?s._old:s._new;s.variants=src.variants;s.armless=src.armless;s.legless=src.legless;s.mixamo=!old;}
}
pzMixamoApply();
// partida nova: confere a chave e limpa os corpos (a escolha da folha de cada zumbi é feita no primeiro desenho)
{const _reset=pzResetCorpses;pzResetCorpses=function(){pzMixamoApply();return _reset();};}
// pedaços arrancados: as folhas novas usam as peças do comum/corredor (3 e 2 variações na folha de peças)
{const _part=pzPartVariant;pzPartVariant=function(enemy){
  const spec=enemy&&PZ_SPRITES[enemy.kind];
  if(spec?.mixamo){const v=enemy._sv!=null?enemy._sv:0;return spec.partsBase+(enemy.kind==='normal'?v%3:v%2);}
  return _part(enemy);};}

// ---------------- R53b · jogo mais leve e correções do Theo ----------------
// 1) Memória: as folhas que só servem às vezes (sem braço do Mixamo, desenhos antigos do comum/corredor) saem do
//    pré-carregamento e são baixadas na primeira vez que forem precisas. Antes eram ~36 folhas grandes decodificadas
//    de uma vez (no celular/PC fraco algumas falhavam e o zumbi virava um quadrado verde).
const PZ_LAZY={};
for(const k of Object.keys(ASSETS))if(/^(infComum|infCorredor)|^mx\w+Sem[LR]$/.test(k)){PZ_LAZY[k]=ASSETS[k];delete ASSETS[k];}
function pzLazyImg(assets,key){
  if(!assets||!key)return null;const im=assets.get(key);if(im)return im;
  const url=PZ_LAZY[key];if(!url)return null;
  assets._lazy??=new Map();
  if(!assets._lazy.has(key)){const i=new Image();i.decoding='async';i.onload=()=>assets.images.set(key,i);i.src=url;assets._lazy.set(key,i);}
  return null;
}
{const _sheetFor=pzSheetFor;pzSheetFor=function(spec,v,mut,assets){
  if((mut==='L'||mut==='R')&&spec.armless)pzLazyImg(assets,spec.armless[mut][v]);
  return _sheetFor(spec,v,mut,assets);};}
// folha que não carregou: usa outra variação já carregada em vez do desenho provisório
{const _sheet=pzSpriteSheet;pzSpriteSheet=function(enemy,assets){
  const S=_sheet(enemy,assets);if(S)return S;
  const spec=PZ_SPRITES[enemy.kind];if(!spec||!assets||enemy._sv==null)return null;
  pzLazyImg(assets,spec.variants[enemy._sv]);
  for(let i=0;i<spec.variants.length;i++){const im=assets.get(spec.variants[i]);if(im&&im.width){enemy._sv=i;return{spec,img:im};}}
  return null;};}
{const _du=CombatEffects.prototype.drawUnder;CombatEffects.prototype.drawUnder=function(ctx){
  const assets=window.__PZ_ASSETS__;
  if(assets)for(const c of PZ_CORPSES.list){const spec=PZ_SPRITES[c.kind];if(spec&&!assets.get(spec.variants[c.v]))pzLazyImg(assets,spec.variants[c.v]);}
  _du.call(this,ctx);
  // 2) poças (reflexo das luzes e do sol) agora no chão, por baixo dos personagens e dos carros
  const g=window.__projectZGame,r=g?.scenes?.current?.run;
  if(r?.worldFX&&g.camera&&!window.__PZ_PUDDLE_OVER){
    const flat=Object.create(g.camera);flat.apply=()=>{}; // a câmera já está aplicada aqui
    r.worldFX.__ground=true;try{r.worldFX.drawReflections(ctx,flat,g.world,r,PZ_LIGHTMAP.env?.dark||0,PZ_LIGHTMAP.flashOn||0);}finally{r.worldFX.__ground=false;}
  }
};}
{const _dr=WorldFX.prototype.drawReflections;WorldFX.prototype.drawReflections=function(...a){
  if(!this.__ground&&!window.__PZ_PUDDLE_OVER)return; // a chamada antiga (depois de todo mundo) não desenha mais
  return _dr.apply(this,a);};}
// 3) Sem noite por enquanto (pedido do Theo, 26/10): o ciclo passa só por manhã, dia e pôr do sol.
//    window.__PZ_NIGHT=true traz a noite de volta; a prévia de clima (__PROJECT_Z_CLIMATE_PREVIEW__) continua mostrando a noite.
{const _get=Q04_ENVIRONMENT.get;Q04_ENVIRONMENT.get=function(t,previewVisual=false){ // 38o/38u já trocaram o get da instância
  if(window.__PZ_NIGHT||(previewVisual&&window.__PROJECT_Z_CLIMATE_PREVIEW__))return _get.call(this,t,previewVisual);
  const cyc=(((t%320)+320)%320),solar=(380+cyc)%600; // 380→600 (manhã e dia) e 0→100 (pôr do sol)
  const keep=window.__PROJECT_Z_CLIMATE_PREVIEW__;
  try{window.__PROJECT_Z_CLIMATE_PREVIEW__={time:solar};return _get.call(this,t,true);}finally{window.__PROJECT_Z_CLIMATE_PREVIEW__=keep;}
};}
