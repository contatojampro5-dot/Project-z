// -- src/fazenda/Core.js --
// R55 · MODO FAZENDA (fase 1) — Hefesto + Deméter. Pedido do Theo: construir na Fazenda do Seu João.
// Plano completo em docs/fazenda/design.md. Esta pasta (src/scripts/fazenda/) é só do modo Fazenda:
//  • liga quando o jogador escolhe MODO FAZENDA na tela de dificuldade (game.pzMode==='fazenda');
//  • o modo Sobrevivência continua igual (nada daqui roda sem o modo ligado);
//  • começa na varanda da casa sede; R56 (pedido do Theo): onda de 10 min, depois 5 min para cortar e construir,
//    e só dentro da área da fazenda (fzInZone); na cidade não dá;
//  • machado no cepo do lado da casa: E pega uma vez e fica com ele (F01);
//  • E / botão A / AÇÃO: SEGURAR 3 s perto da árvore corta; perto de cerca batida conserta (F01, F02);
//  • T / cruz ↓ / CONSTRUIR: liga o modo de construção (1/2/3 ou cruz ←→ escolhe a cerca; E põe ou evolui);
//  • estado da base em run.fz (madeira, cercas, tocos). window.__PZ_NO_FAZENDA=true desliga o modo.
const FZ={
  START:{x:3820,y:1345},   // na frente da varanda da casa sede
  WAVE:600,BUILD:300,      // R56 (pedido do Theo): 10 min de onda, depois 5 min para cortar e construir
  WOOD_START:0,
  AXE:{x:3972,y:1338},     // cepo com o machado, do lado leste da casa (junto da lenha)
  ZONE:{rx:640,ry:520,dy:40}, // área construível = em volta da fazenda (as árvores cortáveis ficam nela)
  SPAWN_RATE:.6,           // a horda de 10 min nasce no mesmo ritmo da Sobrevivência × 0,6
};
function fzOn(run){return !!run?.fz;}
function fzRun(){const s=window.__projectZGame?.scenes?.current;return s?.run?.fz?s.run:null;}
function fzTimes(){const f=window.__PZ_FZ_FAST;return f?{wave:f.wave||20,build:f.build||30}:{wave:FZ.WAVE,build:FZ.BUILD};}
function fzInZone(x,y){const F=PZ_MORRO.F,Z=FZ.ZONE;return ((x-F.x)/Z.rx)**2+((y-F.y-Z.dy)/Z.ry)**2<1;}
function fzBuildPhase(run){return run.waves.phase==='rest';}
// pode construir/cortar agora? devolve '' ou o motivo
function fzBuildBlock(run){
  if(!fzBuildPhase(run))return 'SÓ DEPOIS DA ONDA · AGUENTE A HORDA';
  if(!fzInZone(run.player.x,run.player.y))return 'SÓ DÁ PARA CONSTRUIR NA FAZENDA';
  return '';
}
// a onda dura FZ.WAVE e a construção FZ.BUILD (o WaveDirector usa 30–40 s e 4,5 s)
Object.defineProperty(WaveDirector.prototype,'phaseDuration',{configurable:true,get(){return this.phase==='rest'?(this.fzRestLen??WAVES.rest):(this.fzWaveLen??durationForWave(this.wave));}});
function fzStartWave(w){
  const T=fzTimes();w.fzWaveLen=T.wave;w.remaining=T.wave;w.spawned=0;
  w.budget=Math.round(spawnsForWave(w.wave,w.multiplier)*T.wave/durationForWave(w.wave)*FZ.SPAWN_RATE);
}

// ---------- entrada no modo ----------
{const _enter=CombatScene.prototype.enter;
 CombatScene.prototype.enter=function(){
   fzRestoreTrees();fzFencesClearColliders();
   _enter.call(this);
   const g=this.game,r=this.run;
   if(g.pzMode!=='fazenda'||window.__PZ_NO_FAZENDA||!r)return;
   r.fz={wood:FZ.WOOD_START,logs:0,pending:[],axe:false,fences:[],grid:new Map(),stumps:[],falling:[],chips:[],build:false,ghost:null,chop:null,
     sel:1,hintT:0,woodTotal:0,treesCut:0,built:0,id:0,padPrev:{},swingT:0};
   // começa na fazenda: tira o que o enter normal já pôs perto do centro da cidade
   r.enemies.length=0;r.loot.items.length=0;
   r.player.x=FZ.START.x;r.player.y=FZ.START.y;r.player.facing=Math.PI/2;
   r.district=districtAt(r.player.x,r.player.y);r.visited=new Set([r.district.id]);
   g.camera.jumpTo(r.player.x,r.player.y);
   r.loot.seedNear(r.player,g.camera);
   // a partida começa na onda 1 (10 min); quando ela acaba, 5 min de construção
   const w=r.waves;w.wave=1;w.phase='wave';fzStartWave(w);
   r.navigation?.update?.(r.player);
   document.querySelector('#app').dataset.mode='fazenda';
   this.notify('MODO FAZENDA · AGUENTE A ONDA · DEPOIS PEGUE O MACHADO DO LADO DA CASA',4.5);
   fzHudMount(this);
   g.ui.updateHUD(r);
 };}
{const _exit=CombatScene.prototype.exit;
 CombatScene.prototype.exit=function(){fzHudUnmount(this);document.querySelector('#app')?.removeAttribute('data-mode');return _exit.call(this);};}

// ---------- quadro a quadro ----------
{const _update=CombatScene.prototype.update;
 CombatScene.prototype.update=function(dt){
   const r=this.run;
   const before=r?.fz?r.waves.phase:null;
   _update.call(this,dt);
   if(!r?.fz||r.over||this.run!==r)return;
   const w=r.waves;
   if(before==='wave'&&w.phase==='rest'){
     const T=fzTimes();w.fzRestLen=T.build;w.remaining=T.build;
     this.notify(r.fz.axe?'ONDA CONTIDA · 5 MIN PARA CORTAR E CONSTRUIR':'ONDA CONTIDA · PEGUE O MACHADO DO LADO DA CASA',3);
   }
   if(before==='rest'&&w.phase==='wave'){
     fzStartWave(w);r.fz.build=false;r.fz.chop=null;
     this.notify(`ONDA ${String(w.wave).padStart(2,'0')} · ELES ESTÃO SUBINDO O MORRO`,2.6);
   }
   if(r.fz.build&&fzBuildBlock(r)){r.fz.build=false;this.notify(fzBuildBlock(r),1.6);}
   const slow=r.progress.selecting||r.discovery.selecting||r.backpackOpen;
   const fdt=r.backpackOpen?0:dt*(slow?.1:1);
   fzPadPoll(this);
   fzTreesUpdate(this,fdt);
   fzFencesUpdate(this,fdt);
   fzHudUpdate(this,dt);
 };}

// E / botão A: pega o machado, corta (segurando 3 s), põe/evolui cerca, conserta
{const _interact=CombatScene.prototype.interact;
 CombatScene.prototype.interact=function(){
   const r=this.run;
   if(!r?.fz||r.over||this.game.previewPaused||this.game.ui?.modal||r.progress.selecting||r.discovery.selecting||r.backpackOpen)return _interact.call(this);
   if(fzTryAxe(this))return true;
   if(r.fz.build)return fzBuildAction(this);
   const p=r.player;
   if(fzNearestTree(p,p.radius+FZ_CHOP.reach)){
     if(!r.fz.axe){this.notify('PEGUE O MACHADO NO CEPO DO LADO DA CASA',1.8);return false;}
     const why=fzBuildBlock(r);if(why){this.notify(why,1.6);return false;}
     return true; // o corte anda enquanto o E fica apertado (fzTreesUpdate)
   }
   if(!fzBuildBlock(r)&&fzTryRepair(this))return true;
   return _interact.call(this)||(this.notify(fzBuildBlock(r)||'NADA PERTO · APERTE T PARA CONSTRUIR',1.4),false);
 };}
CombatScene.prototype.toggleBuild=function(){
  const r=this.run;if(!r?.fz||r.over||this.game.previewPaused||this.game.ui?.modal)return false;
  if(!r.fz.build){const why=fzBuildBlock(r);if(why){this.notify(why,1.6);return false;}}
  r.fz.build=!r.fz.build;r.fz.chop=null;
  this.notify(r.fz.build?'CONSTRUÇÃO · 1 2 3 ESCOLHE A CERCA · E PÕE · T SAI':'CONSTRUÇÃO DESLIGADA',1.8);
  this.game.audio.feedback?.('select');fzHudUpdate(this,1);return true;
};
// segurar o E (teclado), o botão A (controle) ou AÇÃO (toque)
const FZ_HOLD={key:false,pad:false,touch:false};
function fzHeld(){return FZ_HOLD.key||FZ_HOLD.pad||FZ_HOLD.touch;}
window.addEventListener('keydown',e=>{if(e.code===keyFor('interact'))FZ_HOLD.key=true;});
window.addEventListener('keyup',e=>{if(e.code===keyFor('interact'))FZ_HOLD.key=false;});
window.addEventListener('blur',()=>{FZ_HOLD.key=FZ_HOLD.pad=FZ_HOLD.touch=false;});
// controle: cruz ↓ liga/desliga a construção; cruz ← → troca a cerca escolhida
function fzPadPoll(scene){
  const r=scene.run,pads=navigator.getGamepads?.()||[],bi=scene.game.save.settings.padbinds?.interact??0,now={};
  for(const p of pads){if(!p?.buttons)continue;for(const i of [13,14,15])if(p.buttons[i]?.pressed)now[i]=true;if(p.buttons[bi]?.pressed)now.a=true;}
  const edge=i=>now[i]&&!r.fz.padPrev[i];
  if(edge(13))scene.toggleBuild();
  if(r.fz.build&&edge(14))fzSelect(scene,r.fz.sel-1);
  if(r.fz.build&&edge(15))fzSelect(scene,r.fz.sel+1);
  FZ_HOLD.pad=!!now.a;r.fz.padPrev=now;
}
window.addEventListener('keydown',e=>{
  if(e.repeat||e.target?.closest?.('input,textarea,select'))return;
  const g=window.__projectZGame,s=g?.scenes?.current;if(g?.scenes?.name!=='field'||!s?.run?.fz||g.ui?.modal)return;
  if(e.code==='KeyT'){e.preventDefault();s.toggleBuild();return;}
  // no modo construção 1/2/3 escolhem a cerca (fora dele continuam trocando a arma)
  if(s.run.fz.build&&/^Digit[123]$/.test(e.code)&&!s.run.progress.selecting){e.preventDefault();e.stopImmediatePropagation();fzSelect(s,Number(e.code.at(-1)));}
},true);

// HUD da onda
{const _hud=UIManager.prototype.updateHUD;
 UIManager.prototype.updateHUD=function(run){
   _hud.call(this,run);
   if(!run?.fz)return;
   const el=this.root.querySelector('[data-phase]'),wv=this.root.querySelector('[data-wave]');
   if(run.waves.phase==='rest'){
     if(el)el.textContent='TEMPO DE CONSTRUIR · CORTE E CERQUE';
     if(wv)wv.textContent=`ONDA ${String(run.waves.wave+1).padStart(2,'0')} EM`;
   }else if(el)el.textContent='ONDA EM CURSO · AGUENTE';
 };}

// ---------- menu: botão MODO FAZENDA na tela de dificuldade ----------
{const _mm=UIManager.prototype.menuMarkup;
 UIManager.prototype.menuMarkup=function(){
   const html=_mm.call(this);
   if(this.menuStep==='characters'||window.__PZ_NO_FAZENDA)return html;
   const active=CRONOS_CHARACTERS.find(c=>c.id===this.game.save.settings.selectedCharacter)||CRONOS_CHARACTERS[0];
   if(!active.gameplay)return html;
   const btn=`<button class="pz-c6b-continue pz-cs-cta fz-cta" data-action="start-fazenda"><span>MODO FAZENDA <small>PRÉVIA · CONSTRUÇÃO</small></span><span class="pz-cs-cta-arrow">⌂</span></button>`;
   return html.replace(/(<button class="pz-c6b-continue pz-cs-cta" data-action="start-preview"[\s\S]*?<\/button>)/,`$1${btn}`);
 };}
{const _hc=UIManager.prototype.handleClick;
 UIManager.prototype.handleClick=function(event){
   const b=event.target?.closest?.('[data-action]'),a=b?.dataset.action;
   if(a==='start-fazenda'){this.game.pzMode='fazenda';this.game.showField();return;}
   if(a==='start-preview')this.game.pzMode=null; // "restart" mantém o modo da partida
   return _hc.call(this,event);
 };}
// voltar ao menu sai do modo (ENTER na tela de dificuldade inicia a Sobrevivência normal)
{const _sm=Game.prototype.showMenu;Game.prototype.showMenu=function(){this.pzMode=null;return _sm.call(this);};}
