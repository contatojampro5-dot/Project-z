// -- src/fazenda/Core.js --
// R55 · MODO FAZENDA (fase 1) — Hefesto + Deméter. Pedido do Theo: construir na Fazenda do Seu João.
// Plano completo em docs/fazenda/design.md. Esta pasta (src/scripts/fazenda/) é só do modo Fazenda:
//  • liga quando o jogador escolhe MODO FAZENDA na tela de dificuldade (game.pzMode==='fazenda');
//  • o modo Sobrevivência continua igual (nada daqui roda sem o modo ligado);
//  • começa na varanda da casa sede, com relógio de PREPARAÇÃO antes de cada horda;
//  • E / botão A / AÇÃO: corta a árvore perto, conserta a cerca perto (F01, F02);
//  • T / cruz ↓ / CONSTRUIR: liga o modo de construção (peça fantasma na frente; E põe ou evolui);
//  • estado da base em run.fz (madeira, cercas, tocos). window.__PZ_NO_FAZENDA=true desliga o modo.
const FZ={
  START:{x:3820,y:1345},  // na frente da varanda da casa sede
  PREP_FIRST:40,PREP:30,   // segundos de preparação (primeira horda / seguintes)
  WOOD_START:6,
};
function fzOn(run){return !!run?.fz;}
function fzRun(){const s=window.__projectZGame?.scenes?.current;return s?.run?.fz?s.run:null;}

// relógio de preparação: a fase "rest" do WaveDirector vira PREPARAÇÃO (mais longa) no modo Fazenda
Object.defineProperty(WaveDirector.prototype,'phaseDuration',{configurable:true,get(){return this.phase==='rest'?(this.fzRestLen??WAVES.rest):durationForWave(this.wave);}});

// ---------- entrada no modo ----------
{const _enter=CombatScene.prototype.enter;
 CombatScene.prototype.enter=function(){
   fzRestoreTrees();fzFencesClearColliders();
   _enter.call(this);
   const g=this.game,r=this.run;
   if(g.pzMode!=='fazenda'||window.__PZ_NO_FAZENDA||!r)return;
   r.fz={wood:FZ.WOOD_START,fences:[],grid:new Map(),stumps:[],falling:[],chips:[],build:false,ghost:null,chop:null,
     swing:0,hintT:0,woodTotal:0,treesCut:0,built:0,id:0,padPrev:false};
   // começa na fazenda: tira o que o enter normal já pôs perto do centro da cidade
   r.enemies.length=0;r.loot.items.length=0;
   r.player.x=FZ.START.x;r.player.y=FZ.START.y;r.player.facing=Math.PI/2;
   r.district=districtAt(r.player.x,r.player.y);r.visited=new Set([r.district.id]);
   g.camera.jumpTo(r.player.x,r.player.y);
   r.loot.seedNear(r.player,g.camera);
   // onda 0 = preparação; quando zera, vem a onda 1
   const w=r.waves;w.wave=0;w.phase='rest';w.fzRestLen=FZ.PREP_FIRST;w.remaining=FZ.PREP_FIRST;w.spawned=0;w.budget=0;
   r.navigation?.update?.(r.player);
   document.querySelector('#app').dataset.mode='fazenda';
   this.notify('MODO FAZENDA · CORTE ÁRVORES (E) E CONSTRUA A CERCA (T)',4);
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
   // depois de cada horda, preparação de 30 s (o WaveDirector põe 4,5 s)
   if(before==='wave'&&w.phase==='rest'){w.fzRestLen=FZ.PREP;w.remaining=FZ.PREP;this.notify('HORDA CONTIDA · CONSERTE E REFORCE A CERCA',2.6);}
   if(before==='rest'&&w.phase==='wave')this.notify(`ONDA ${String(w.wave).padStart(2,'0')} · ELES ESTÃO SUBINDO O MORRO`,2.4);
   const slow=r.progress.selecting||r.discovery.selecting||r.backpackOpen;
   const fdt=r.backpackOpen?0:dt*(slow?.1:1);
   fzPadPoll(this);
   fzTreesUpdate(this,fdt);
   fzFencesUpdate(this,fdt);
   fzHudUpdate(this,dt);
 };}

// E / botão A: faz a coisa certa conforme o que está perto
{const _interact=CombatScene.prototype.interact;
 CombatScene.prototype.interact=function(){
   const r=this.run;
   if(!r?.fz||r.over||this.game.previewPaused||this.game.ui?.modal||r.progress.selecting||r.discovery.selecting||r.backpackOpen)return _interact.call(this);
   if(r.fz.build)return fzBuildAction(this);
   if(fzTryChop(this))return true;
   if(fzTryRepair(this))return true;
   return _interact.call(this)||(this.notify('NADA PERTO · APERTE T PARA CONSTRUIR',1.4),false);
 };}
CombatScene.prototype.toggleBuild=function(){
  const r=this.run;if(!r?.fz||r.over||this.game.previewPaused||this.game.ui?.modal)return false;
  r.fz.build=!r.fz.build;r.fz.chop=null;
  this.notify(r.fz.build?'CONSTRUÇÃO · E PÕE A CERCA NA SUA FRENTE · T SAI':'CONSTRUÇÃO DESLIGADA',1.6);
  this.game.audio.feedback?.('select');fzHudUpdate(this,1);return true;
};
// controle: cruz ↓ liga/desliga a construção (a cruz ↑ já é o empurrão)
function fzPadPoll(scene){
  const r=scene.run,pads=navigator.getGamepads?.()||[];let down=false;
  for(const p of pads)if(p?.buttons?.[13]?.pressed)down=true;
  if(down&&!r.fz.padPrev)scene.toggleBuild();
  r.fz.padPrev=down;
}
window.addEventListener('keydown',e=>{
  if(e.code!=='KeyT'||e.repeat||e.target?.closest?.('input,textarea,select'))return;
  const g=window.__projectZGame;if(g?.scenes?.name!=='field'||!g.scenes.current?.run?.fz)return;
  e.preventDefault();g.scenes.current.toggleBuild();
});

// HUD da onda: na preparação o texto muda
{const _hud=UIManager.prototype.updateHUD;
 UIManager.prototype.updateHUD=function(run){
   _hud.call(this,run);
   if(!run?.fz)return;
   const el=this.root.querySelector('[data-phase]');
   if(el&&run.waves.phase==='rest')el.textContent=run.waves.wave===0?'PREPARAÇÃO · A PRIMEIRA HORDA VEM AÍ':'PREPARAÇÃO · PRÓXIMA HORDA';
   const wv=this.root.querySelector('[data-wave]');
   if(wv&&run.waves.phase==='rest')wv.textContent=`HORDA ${String(run.waves.wave+1).padStart(2,'0')} EM`;
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
