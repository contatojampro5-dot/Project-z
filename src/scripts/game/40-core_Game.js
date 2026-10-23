// -- src/core/Game.js --














class CinematicMenuV3 {
  constructor(game){
    this.game=game;
    this.host=game.fullscreen.host;
    this.nativeScreen=false;
    this.wrapper=document.createElement('div');
    this.wrapper.className='pz-v3-overlay';
    this.wrapper.id='pz-v3-overlay';
    this.wrapper.setAttribute('aria-label','Menu principal PROJECT Z');
    this.iframe=document.createElement('iframe');
    this.iframe.className='pz-v3-frame';
    this.iframe.title='Menu principal PROJECT Z';
    this.iframe.setAttribute('allow','autoplay');
    this.iframe.srcdoc=PROJECT_Z_CINEMATIC_MENU_HTML;
    this.wrapper.appendChild(this.iframe);
    this.fullscreenBtn=document.createElement('button');
    this.fullscreenBtn.type='button';
    this.fullscreenBtn.className='pz-v3-fullscreen';
    this.fullscreenBtn.textContent='⛶ TELA CHEIA';
    this.fullscreenBtn.setAttribute('aria-label','Alternar tela cheia');
    this.fullscreenBtn.addEventListener('click',()=>{void this.game.toggleFullscreen();});
    this.wrapper.appendChild(this.fullscreenBtn);
    this.back=document.createElement('button');
    this.back.type='button';
    this.back.className='pz-v3-return';
    this.back.textContent='← MENU PRINCIPAL';
    this.back.addEventListener('click',()=>this.show());
    this.host.appendChild(this.back);
    this.host.appendChild(this.wrapper);
    this.onMessage=(event)=>{
      if(event.source!==this.iframe.contentWindow||event.data?.channel!=='project-z-menu-v3')return;
      this.navigate(event.data.action);
    };
    window.addEventListener('message',this.onMessage);
    this.sync();
  }
  navigate(action){
    if(this.game.scenes.name!=='menu')return;
    void this.game.audio.unlock();
    this.game.audio.feedback('select');
    if(action==='play'){
      this.nativeScreen=true;
      this.game.ui.menuStep='characters';
      this.game.ui.previewCharacter=this.game.save.settings.selectedCharacter||'antonio';
      this.game.ui.render();
      this.sync();
      return;
    }
    const modal={story:'story',records:'records',arsenal:'arsenal',settings:'settings',credits:'about'}[action];
    if(modal){
      this.nativeScreen=false;
      this.game.ui.showModal(modal);
      this.sync();
    }
  }
  show(){
    this.nativeScreen=false;
    this.game.ui?.showModal(null);
    this.sync();
  }
  sync(){
    const cinematic=this.game.scenes?.name==='menu'
      &&this.game.ui?.view==='menu'
      &&!this.game.ui.modal
      &&!this.nativeScreen;
    const native=this.game.scenes?.name==='menu'
      &&this.game.ui?.view==='menu'
      &&!this.game.ui.modal
      &&this.nativeScreen;
    this.wrapper.hidden=!cinematic;
    this.back.hidden=!native;
    this.iframe.tabIndex=cinematic?0:-1;
    this.wrapper.setAttribute('aria-hidden',String(!cinematic));
  }
  dispose(){
    window.removeEventListener('message',this.onMessage);
    this.wrapper.remove();
    this.back.remove();
  }
}
class MenuScene {
  enter(_params,game) {
    document.querySelector('#app').dataset.scene='menu';
    game.camera.resize(game.renderer.width,game.renderer.height,'menu');
    game.camera.jumpTo(603,559);
    game.audio.setMode('menu');
    game.previewPaused=false;
    game.canvas.classList.remove('is-interactive');
    game.ui?.setView('menu');
    game.menuV3?.show();
  }
  update(dt) {
    const game=this.game;
    if(!game.save.settings.reducedMotion) game.camera.setTarget(603+Math.sin(game.ambience.time*.19)*16,559+Math.cos(game.ambience.time*.21)*13);
    game.camera.update(dt,1);
  }
  render(ctx, viewport) {this.game.renderWorld(ctx,viewport,'menu');}
  constructor(game){this.game=game;}
}
class FullscreenController {
  constructor(game) {
    this.game=game;
    this.host=document.querySelector('#app');
    this.boundUpdate=()=>this.sync();
    document.addEventListener('fullscreenchange',this.boundUpdate);
    document.addEventListener('webkitfullscreenchange',this.boundUpdate);
    this.noticeTimer=null;
  }
  active(){
    return document.fullscreenElement===this.host || document.webkitFullscreenElement===this.host;
  }
  sync(){
    const active=this.active();
    this.host.classList.toggle('fullscreen-active',active);
    document.querySelectorAll('.fullscreen-control').forEach(button=>{
      button.innerHTML=icon(active?'collapse':'expand');
      button.setAttribute('aria-label',active?'Sair da tela cheia':'Ativar tela cheia');
      button.setAttribute('title',active?'Sair da tela cheia':'Tela cheia');
      button.setAttribute('aria-pressed',String(active));
    });
    this.game.onResize();
  }
  notify(message){
    let notice=document.querySelector('#fullscreen-notice');
    if(!notice){
      notice=document.createElement('div');
      notice.id='fullscreen-notice';
      notice.className='fullscreen-notice';
      notice.setAttribute('role','status');
      this.host.appendChild(notice);
    }
    notice.textContent=message;
    notice.classList.add('is-visible');
    clearTimeout(this.noticeTimer);
    this.noticeTimer=setTimeout(()=>notice.classList.remove('is-visible'),6500);
  }
  async toggle(){
    const host=this.host;
    if(this.active()){
      try {
        if(document.exitFullscreen) await document.exitFullscreen();
        else if(document.webkitExitFullscreen) await document.webkitExitFullscreen();
      } catch(error) {
        this.notify('Não foi possível sair da tela cheia neste navegador.');
      }
      this.sync();
      return;
    }
    const request=host.requestFullscreen||host.webkitRequestFullscreen;
    if(!request) {pzShowInstallHint();return;}
    try {
      // Must be invoked directly during the button's user gesture.
      await request.call(host);
      // Orientation locking is optional. Unsupported iOS browsers simply retain their orientation.
      // A orientação vertical ou horizontal é escolhida pelo jogador (Cronos Parte 3).
      this.sync();
    } catch(error) {
      pzShowInstallHint();
    }
  }
  dispose(){
    document.removeEventListener('fullscreenchange',this.boundUpdate);
    document.removeEventListener('webkitfullscreenchange',this.boundUpdate);
    clearTimeout(this.noticeTimer);
  }
}

class PhysicalGamepad {
  constructor(game){
    this.game=game;this.previous=[];this.lastNavigation=0;this.selection=0;
    this.lastAxes={move:{x:0,y:0},aim:{x:0,y:0,active:false}};
    this.active=false;this.stopped=false;this.tick=this.tick.bind(this);
    this.frame=requestAnimationFrame(this.tick);
  }
  read(){
    // R45: controle Bluetooth genérico (mapping '' em alguns navegadores) também vale; os botões
    // diferentes podem ser trocados em Controles > Gamepad.
    try{
      const pads=[...(navigator.getGamepads?.()||[])].filter(p=>p&&p.connected);
      return pads.find(p=>p.mapping==='standard')||pads.find(p=>(p.axes?.length||0)>=2&&(p.buttons?.length||0)>=8)||null;
    }catch{return null;}
  }
  axes(){return this.lastAxes;}
  tick(){
    if(this.stopped)return;
    const pad=this.read();this.active=!!pad;
    if(pad){
      const dead=v=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;
      let mx=dead(pad.axes?.[0]||0),my=dead(pad.axes?.[1]||0);
      if(pad.buttons?.[14]?.pressed)mx=-1;
      if(pad.buttons?.[15]?.pressed)mx=1;
      if(pad.buttons?.[12]?.pressed)my=-1;
      if(pad.buttons?.[13]?.pressed)my=1;
      const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
      const ax=dead(pad.axes?.[2]||0),ay=dead(pad.axes?.[3]||0);
      const aL=Math.hypot(ax,ay);const trigger=(pad.buttons?.[7]?.value||0)>.25;
      const running=this.game.scenes?.name==='field'&&!this.game.previewPaused&&!this.game.ui?.modal;
      const previousAim=this.lastAxes.aim;
      const direction=aL>.2?{x:ax/aL,y:ay/aL}:previousAim.active?{x:previousAim.x,y:previousAim.y}:null;
      const fallback=this.game.scenes?.current?.run?.player?.facing??-Math.PI/2;
      this.lastAxes={move:{x:mx,y:my},aim:running&&(aL>.2||trigger)?{
        x:direction?.x??Math.cos(fallback),y:direction?.y??Math.sin(fallback),active:true
      }:{x:0,y:0,active:false}};
      const pressed=pad.buttons.map(b=>!!b.pressed);
      const edge=index=>pressed[index]&&!this.previous[index];
      const confirmConsumed=edge(0)&&(!!this.game.ui?.modal||this.game.previewPaused);
      if(edge(9)){this.game.togglePauseFromPhysical();}
      if(confirmConsumed&&this.game.ui?.modal){this.game.ui.showModal(null);}
      else if(confirmConsumed&&this.game.previewPaused){this.game.resumePreview();}
      if(edge(1)){
        if(this.game.ui.modal)this.game.ui.showModal(null);
        else if(this.game.previewPaused)this.game.resumePreview();
        else if(this.game.scenes.name==='menu'&&this.game.menuV3?.nativeScreen){
          if(this.game.ui.menuStep==='difficulty'){this.game.ui.menuStep='characters';this.game.ui.render();}
          else this.game.menuV3.show();
        }
      }
      if(this.game.scenes.name==='field'&&!this.game.previewPaused&&!this.game.ui.modal){
        if(edge(5))this.game.scenes.current?.useGrenade();
        if(edge(2))this.game.reloadFromPhysical();
        if(edge(0)&&!confirmConsumed){
          const r=this.game.scenes.current?.run;
          if(r?.discovery.selecting)this.game.scenes.current.closeDiscovery();
          else if(r?.progress.selecting)this.game.scenes.current.chooseUpgrade(r.progress.offers?.[this.selection%r.progress.offers.length]?.id);
          else if(r?.over)this.game.showField();
        }
      }
      // Debounced D-pad / stick browsing to avoid repeated selection while held.
      const navDirection=(pressed[13]||my>.6||pressed[15]||mx>.65)?1:(pressed[12]||my<-.6||pressed[14]||mx<-.65)?-1:0;
      const now=performance.now();
      const selecting=this.game.scenes.name==='field'&&!!this.game.scenes.current?.run?.progress.selecting;
      if(navDirection&&now-this.lastNavigation>220){
        this.lastNavigation=now;
        if(selecting){const offers=this.game.scenes.current?.run?.progress.offers||[];if(offers.length){this.selection=(this.selection+navDirection+offers.length)%offers.length;this.focusChoice('.upgrade-option',this.selection);}}
        else if(this.game.scenes.name==='menu'&&!this.game.ui?.modal){
          if(this.game.menuV3?.nativeScreen){
            if(this.game.ui.menuStep==='characters'){
              const chars=CRONOS_CHARACTERS;
              const index=chars.findIndex(c=>c.id===this.game.ui.previewCharacter);
              this.game.ui.previewCharacter=chars[(index+navDirection+chars.length)%chars.length].id;
              this.game.ui.render();this.focusChoice('[data-action="char-pick"]',(index+navDirection+chars.length)%chars.length);
            }else{
              const ds=Object.keys(DIFFICULTIES);const index=ds.indexOf(this.game.save.settings.difficulty);
              this.game.chooseDifficulty(ds[(index+navDirection+ds.length)%ds.length]);
            }
          }
          else{this.selection=(this.selection+navDirection+6)%6;this.focusCinema(this.selection);}
        }
      }
      if(edge(0)&&!confirmConsumed&&this.game.scenes.name==='menu'&&!this.game.ui?.modal){
        if(this.game.menuV3?.nativeScreen){
          if(this.game.ui.menuStep==='characters')this.game.ui.advanceCharacter();
          else this.game.showField();
        }
        else this.game.menuV3?.navigate(['play','story','records','arsenal','settings','credits'][this.selection%6]);
      }
      this.previous=pressed;
    }else{
      this.previous=[];
      this.lastAxes={move:{x:0,y:0},aim:{x:0,y:0,active:false}};
    }
    this.frame=requestAnimationFrame(this.tick);
  }
  focusChoice(selector,index){
    document.querySelectorAll(selector).forEach((el,i)=>{
      el.classList.toggle('gamepad-selected',i===index);
      if(i===index)el.focus({preventScroll:true});
    });
  }
  focusCinema(index){
    const iframe=this.game.menuV3?.iframe;
    try{iframe?.contentDocument?.querySelectorAll('.menu .item').forEach((el,i)=>{
      el.style.outline=i===index?'2px solid #c499ff':'';
      el.style.outlineOffset=i===index?'3px':'';
    });}catch(_){}
  }
  dispose(){this.stopped=true;cancelAnimationFrame(this.frame);}
}

// -- G.3.1.2 / Monitor de desempenho. Não realiza requisições de rede. --
class PerformanceMonitor {
  constructor(game){
    this.game=game;this.enabled=false;this.samples=[];this.previous=0;this.lastPaint=0;
    this.fps=0;this.logicMs=0;this.renderMs=0;this.lowFps=0;this.badFrames=0;
    this.node=document.createElement('aside');
    this.node.id='pz-performance-monitor';
    this.node.className='pz-performance-monitor';
    this.node.hidden=true;
    this.node.setAttribute('aria-label','Diagnóstico de desempenho do jogo');
    this.node.innerHTML=`<div class="perf-title"><span class="perf-indicator"></span><b>DESEMPENHO</b><span class="perf-build">G.3.1.13</span><button type="button" class="perf-close" aria-label="Desativar monitor de desempenho" title="Desativar monitor">×</button></div>
      <div class="perf-numbers"><div class="perf-fps"><strong data-perf-fps>--</strong><small>FPS</small></div><div class="perf-timings"><span>Quadro <b data-perf-frame>--</b> ms</span><span>Log. <b data-perf-logic>--</b> · Des. <b data-perf-render>--</b> ms</span></div></div>
      <div class="perf-bars" aria-hidden="true"><div data-perf-bar></div></div>
      <div class="perf-stat-row"><span>Zumbis <b data-perf-enemies>0</b></span><span>Balas <b data-perf-bullets>0</b></span><span>FX <b data-perf-particles>0</b></span></div>
      <div class="perf-stat-row"><span>RAM JS <b data-perf-heap>—</b></span><span>Escala <b data-perf-dpr>1×</b></span></div>
      <div class="perf-network" data-perf-network>Rede: verificando…</div>`;
    this.node.querySelector('.perf-close').addEventListener('click',()=>this.game.applySettings({showPerformance:false}));
    document.body.appendChild(this.node);
    this.items={};
    for(const key of ['fps','frame','logic','render','enemies','bullets','particles','heap','dpr','network','bar'])this.items[key]=this.node.querySelector(`[data-perf-${key}]`);
    this.onOnline=()=>this.updateNetwork();
    window.addEventListener('online',this.onOnline);
    window.addEventListener('offline',this.onOnline);
    this.connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
    this.connection?.addEventListener?.('change',this.onOnline);
    this.updateNetwork();
  }
  setEnabled(enabled){
    this.enabled=Boolean(enabled);
    this.game.loop.onFrame=this.enabled?sample=>this.frame(sample):null;
    this.previous=0;this.lastPaint=0;this.samples.length=0;
    this.updateVisibility();
    if(this.enabled)this.paint(true);
  }
  updateVisibility(){
    this.node.hidden=!this.enabled||this.game.scenes.name!=='field'||!!this.game.ui?.modal;
  }
  updateNetwork(){
    if(!this.node?.isConnected)return;
    // navigator.onLine é apenas uma indicação de conectividade, não teste de Internet.
    const browserOnline=navigator.onLine;
    let label=`Rede: ${browserOnline?'aparentemente online':'offline'} · jogo local`;
    if(browserOnline&&this.connection){
      const type=this.connection.effectiveType;
      if(type)label+=` · ${type}`;
      if(Number.isFinite(this.connection.rtt)&&this.connection.rtt>0)label+=` · RTT estim. ${Math.round(this.connection.rtt)} ms`;
    }
    this.items.network.textContent=label;
  }
  frame(sample){
    if(!this.enabled)return;
    this.updateVisibility();
    if(this.node.hidden){this.previous=0;this.samples.length=0;return;}
    const stamp=sample.timestamp;
    if(this.previous>0){
      const elapsed=stamp-this.previous;
      if(elapsed>0&&elapsed<1500){
        this.samples.push({dt:elapsed,logic:sample.logicMs,render:sample.renderMs});
        if(this.samples.length>120)this.samples.shift();
      }
    }
    this.previous=stamp;
    if(!this.lastPaint||stamp-this.lastPaint>=700){this.paint(sample.paused);this.lastPaint=stamp;}
  }
  paint(paused=false){
    if(!this.enabled)return;
    const rows=this.samples;
    const mean=rows.length?rows.reduce((a,s)=>a+s.dt,0)/rows.length:0;
    const fps=mean?1000/mean:0;
    const ms=key=>rows.length?rows.reduce((a,s)=>a+s[key],0)/rows.length:0;
    const bottleneck=rows.length?rows.filter(s=>s.dt>34).length:0;
    const stats=this.game.scenes.current?.run;
    const enemies=stats?.enemies?.filter(e=>e.alive)?.length||0;
    const bullets=(stats?.gun?.projectiles?.length||0)+(stats?.enemyAttacks?.projectiles?.length||0);
    const particles=(stats?.effects?.particles?.length||0)+(stats?.effects?.bloodSpots?.length||0);
    this.fps=fps;
    this.items.fps.textContent=rows.length>=4?Math.round(fps):'--';
    this.items.frame.textContent=mean?mean.toFixed(1):'--';
    this.items.logic.textContent=rows.length?ms('logic').toFixed(1):'--';
    this.items.render.textContent=rows.length?ms('render').toFixed(1):'--';
    this.items.enemies.textContent=enemies;
    this.items.bullets.textContent=bullets;
    this.items.particles.textContent=particles;
    this.items.dpr.textContent=`${this.game.renderer.dpr.toFixed(1)}×`;
    const mem=performance.memory?.usedJSHeapSize;
    this.items.heap.textContent=Number.isFinite(mem)?`${(mem/1048576).toFixed(0)} MB`:'N/D';
    this.items.bar.style.width=`${Math.min(100,Math.max(0,(fps/60)*100))}%`;
    this.items.bar.className=fps<30?'is-slow':fps<50?'is-medium':'';
    this.node.classList.toggle('is-paused',Boolean(paused));
    this.node.dataset.slowFrames=String(bottleneck);
    this.updateNetwork();
  }
  snapshot(){return {enabled:this.enabled,visible:!this.node.hidden,fps:this.fps,frameCount:this.samples.length,zombies:Number(this.items.enemies.textContent),bullets:Number(this.items.bullets.textContent),particles:Number(this.items.particles.textContent),network:this.items.network.textContent};}
  destroy(){
    this.game.loop.onFrame=null;
    window.removeEventListener('online',this.onOnline);
    window.removeEventListener('offline',this.onOnline);
    this.connection?.removeEventListener?.('change',this.onOnline);
    this.node.remove();
  }
}

class Game {
  constructor({canvas,interfaceRoot,loader,progressBar}) {
    this.canvas=canvas;this.root=interfaceRoot;this.loader=loader;this.progressBar=progressBar;
    this.events=new EventBus();
    this.notchFX=null;
    this.save=new SaveSystem();
    this.assets=new AssetManager(ASSETS);
    this.audio=new AudioSystem(this.save.settings);
    this.renderer=new Renderer(canvas);
    this.fullscreen=new FullscreenController(this);
    this.notchFX=new ProjectZNotchFX(this);
    this.camera=new Camera(GAME.map.width,GAME.map.height);
    this.ambience=new Ambience(this.assets);
    this.world=null;this.previewPaused=false;
    this.scenes=new SceneManager(this);
    this.ui=null;this.loop=null;
    this.gamepad=new PhysicalGamepad(this);
    window.__projectZGame=this;
    this.resizeObserver=new ResizeObserver(()=>this.onResize());
    this.resizeObserver.observe(canvas);
    this.onVisibility=()=>{
      if(document.hidden){this.loop?.setPaused(true);this.audio.stopMusic();this.audio.stopEffects();}
      else{this.loop?.setPaused(this.previewPaused||Boolean(this.ui?.modal));this.audio.applySettings(this.save.settings);}
    };
    this.onKeyDown=(e)=>{
      if(this.ui?.rebindAction){
        e.preventDefault();e.stopImmediatePropagation();
        const action=this.ui.rebindAction,code=e.code;
        this.ui.rebindAction=null;
        const original=this.save.settings.keybinds||KEYBIND_DEFAULTS;
        if(!/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Escape|ShiftLeft|ShiftRight|ControlLeft|ControlRight)$/.test(code)){
          this.ui.render();return;
        }
        const next={...original};
        for(const key of Object.keys(next))if(key!==action&&next[key]===code)next[key]=null;
        next[action]=code;
        this.applySettings({keybinds:next});
        return;
      }
      if(e.target.closest?.('input,textarea,select,[contenteditable]'))return;
      if(this.scenes.name==='field'&&e.code.startsWith('Key')){this.controlMode='mouse';this.root.closest('.app')?.classList.remove('pz-pad-mode');}
      if(e.repeat)return;
      const code=e.code;
      if(code==='KeyF'&&!this.ui?.modal&&!Object.values(this.save.settings.keybinds).includes(code)){e.preventDefault();void this.toggleFullscreen();return;}
      if(code==='KeyC'&&!this.ui?.modal&&!Object.values(this.save.settings.keybinds).includes(code)){e.preventDefault();this.ui?.showModal('controls');return;}
      if(code==='F8'){e.preventDefault();this.applySettings({showPerformance:!this.save.settings.showPerformance});return;}
      if(code==='F9'){e.preventDefault();void pzRunDiagnostic(this);return;}
      // C1/Hermes: no menu o Esc segue para a navegação (voltar uma tela); pausa só vale em campo ou com janela aberta.
      if(code===keyFor('pause')&&(this.ui?.modal||this.scenes.name==='field')){e.preventDefault();this.togglePauseFromPhysical();return;}
      if(this.scenes.name==='field'&&!this.ui?.modal){
        if(code===keyFor('backpack')||code===keyFor('backpackAlt')){e.preventDefault();this.scenes.current?.toggleBackpack();}
        if(code===keyFor('consumable')){e.preventDefault();this.scenes.current?.useShieldCell();}
        if(code===keyFor('medkit')){e.preventDefault();this.scenes.current?.useMedkit();}
        if(code==='KeyB'){e.preventDefault();this.scenes.current?.selectConsumable('shield');}
        if(code===keyFor('grenade')){e.preventDefault();this.scenes.current?.useGrenade();}
        if(code===keyFor('skill')){e.preventDefault();this.scenes.current?.activateSpecial();}
        if(code===keyFor('interact')){e.preventDefault();this.scenes.current?.interact();}
        if(code===keyFor('weapon1')){e.preventDefault();this.scenes.current?.selectWeapon(0);}
        if(code===keyFor('weapon2')){e.preventDefault();this.scenes.current?.selectWeapon(1);}
        if(code===keyFor('reload')){e.preventDefault();this.reloadFromPhysical();}
        if(/^Digit[123]$/.test(code)){
          const r=this.scenes.current?.run;
          if(r?.progress.selecting)this.scenes.current.chooseUpgrade(r.progress.offers?.[Number(code.at(-1))-1]?.id);
        }
        if(code==='Enter'){
          const r=this.scenes.current?.run;
          if(r?.discovery.selecting)this.scenes.current.closeDiscovery();
        }
      }
      if(this.scenes.name==='menu'&&this.menuV3?.nativeScreen&&!this.ui?.modal){
        if(code==='Escape'){
          e.preventDefault();
          if(this.ui.menuStep==='difficulty'){this.ui.menuStep='characters';this.ui.render();}
          else this.menuV3.show();
          return;
        }
        if(this.ui.menuStep==='characters'){
          if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(code)){
            e.preventDefault();
            const direction=['ArrowLeft','ArrowUp'].includes(code)?-1:1;
            const i=CRONOS_CHARACTERS.findIndex(c=>c.id===this.ui.previewCharacter);
            this.ui.previewCharacter=CRONOS_CHARACTERS[(i+direction+4)%4].id;
            this.ui.render();return;
          }
          if(code==='Enter'&&!this.ui.root.contains(document.activeElement)){
            e.preventDefault();this.ui.advanceCharacter();return;
          }
        }
        // C4.1: setas trocam a dificuldade; Enter inicia (se o personagem for jogável).
        if(this.ui.menuStep==='difficulty'){
          if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(code)){
            e.preventDefault();
            const ds=Object.keys(DIFFICULTIES),dir=['ArrowLeft','ArrowUp'].includes(code)?-1:1;
            const i=ds.indexOf(this.save.settings.difficulty);
            this.chooseDifficulty(ds[(i+dir+ds.length)%ds.length]);return;
          }
          if(code==='Enter'&&!this.ui.root.contains(document.activeElement)){
            const active=CRONOS_CHARACTERS.find(c=>c.id===this.save.settings.selectedCharacter)||CRONOS_CHARACTERS[0];
            if(active.gameplay){e.preventDefault();this.showField();}return;
          }
        }
      }
      if(e.key==='Escape'){
        if(this.scenes.name==='field'&&this.scenes.current?.run?.discovery?.selecting&&!this.ui?.modal){this.scenes.current.closeDiscovery();return;}
        if(this.ui?.modal){this.ui.showModal(null);return;}
        if(this.scenes.name==='field'&&!this.scenes.current?.run?.over)this.previewPaused?this.resumePreview():this.pausePreview();
      }
    };
    document.addEventListener('visibilitychange',this.onVisibility);
    window.addEventListener('keydown',this.onKeyDown);
  }
  async init(){
    await this.assets.preload(progress=>{this.progressBar.style.width=`${Math.round(progress*100)}%`;});
    this.world=new World(this.assets);
    this.ui=new UIManager(this.root,this);
    this.menuV3=new CinematicMenuV3(this);
    this.scenes.register('menu',new MenuScene(this));
    this.scenes.register('field',new CombatScene(this));
    this.scenes.go('menu');
    this.loop=new GameLoop({update:dt=>{this.ambience.update(dt);this.scenes.update(dt);},render:()=>{
      const ctx=this.renderer.begin();this.scenes.render(ctx,{width:this.renderer.width,height:this.renderer.height});
    },step:GAME.fixedStep,maxDelta:GAME.maxFrameDelta});
    this.performanceMonitor=new PerformanceMonitor(this);
    this.performanceMonitor.setEnabled(this.save.settings.showPerformance);
    this.loop.start();
    this.loader.classList.add('is-hidden');
    setTimeout(()=>this.loader.remove(),450);
    if(this.assets.failures.length)console.warn('Alguns sprites indisponíveis; placeholders ativos:',this.assets.failures);
    window.__projectZ={version:GAME.version,scene:()=>this.scenes.name,monitor:()=>this.performanceMonitor?.snapshot(),getDifficulty:()=>this.save.settings.difficulty,audioStatus:()=>({loaded:this.audio.loadedCount,missing:this.audio.missingCount,active:this.audio.active.size,mode:this.audio.mode}),assetsReady:()=>this.assets.images.size,getCamera:()=>({x:this.camera.x,y:this.camera.y,targetX:this.camera.targetX,targetY:this.camera.targetY}),failures:()=>this.assets.failures.map(x=>x.key),getRun:()=>{const r=this.scenes.current?.run;return r?{hp:r.player.hp,x:r.player.x,y:r.player.y,ammo:r.gun.ammo,reserve:r.gun.reserve,reloading:r.gun.reloadRemaining,enemyCount:r.enemies.length,kills:r.kills,elapsed:r.elapsed,over:r.over,wave:r.waves?.wave,phase:r.waves?.phase,remaining:r.waves?.remaining,level:r.progress?.level,xp:r.progress?.xp,pending:r.progress?.pending,selecting:r.progress?.selecting,grenades:r.grenades?.count,boss:r.boss?.alive?{name:r.boss.name,hp:r.boss.hp,maxHp:r.boss.maxHp,state:r.boss.state}:null,bossPending:r.bossPending,bossQueue:r.bossQueue?.slice()||[],district:r.district?.id,visited:[...r.visited],discovery:r.discovery.active,discoveryQueue:[...r.discovery.queue],enemiesByType:r.enemies.reduce((a,e)=>{a[e.kind]=(a[e.kind]||0)+1;return a;},{}),hostileShots:r.enemyAttacks?.projectiles?.length,pickups:r.loot?.items?.map(item=>({type:item.type,x:item.x,y:item.y})),activeGrenades:r.grenades?.active.length,offers:r.progress?.offers?.map(u=>u.id),weapon:r.gun.model,upgrades:r.progress?.levels}:null;}};
  }
  renderWorld(ctx, viewport, mode) {
    this.world.draw(ctx,this.camera);
    if(!this.save.settings.reducedMotion)this.ambience.draw(ctx,viewport,this.camera,this.world,mode);
    else {
      const img=this.assets.get('survivor');
      if(img){ctx.save();this.camera.apply(ctx);ctx.drawImage(img,568,540,48,56);ctx.restore();}
    }
    // Granulação sutil escurecendo as bordas, sempre atrás da interface HTML.
    const shadow=ctx.createLinearGradient(0,0,0,viewport.height);
    shadow.addColorStop(0,'rgba(5,16,23,.17)');shadow.addColorStop(.5,'rgba(5,16,23,0)');shadow.addColorStop(1,'rgba(5,16,23,.20)');
    ctx.fillStyle=shadow;ctx.fillRect(0,0,viewport.width,viewport.height);
  }
  toggleFullscreen(){return this.fullscreen.toggle();}
  onResize(){
    this.renderer.resize();
    this.camera.resize(this.renderer.width,this.renderer.height,this.scenes.name||'menu');
  }
  chooseDifficulty(id){
    if(!DIFFICULTIES[id])return;
    this.save.setSettings({difficulty:id});this.ui.render();
    this.events.emit('difficulty:changed',id);
  }
  applySettings(patch,activateAudio=false,redraw=true){
    this.save.setSettings(patch);
    this.audio.applySettings(this.save.settings);
    if('showPerformance' in patch)this.performanceMonitor?.setEnabled(this.save.settings.showPerformance);
    if(redraw)this.ui.render();
    if(activateAudio)void this.audio.unlock();
  }
  togglePauseFromPhysical(){
    if(this.ui?.modal){this.ui.showModal(null);return;}
    if(this.scenes.name!=='field'||this.scenes.current?.run?.over)return;
    if(this.scenes.current?.run?.discovery?.selecting){this.scenes.current.closeDiscovery();return;}
    this.previewPaused?this.resumePreview():this.pausePreview();
  }
  reloadFromPhysical(){
    const run=this.scenes.current?.run;
    if(this.scenes.name!=='field'||this.previewPaused||this.ui?.modal||!run||run.over||run.progress.selecting||run.discovery.selecting)return false;
    const gun=run.gun;if(!gun||gun.reloadRemaining>0||gun.ammo>=gun.magazine||gun.reserve<=0)return false;
    gun.reloadRemaining=gun.config.reload;
    this.audio.effect('reload');this.ui.updateHUD(run);return true;
  }
  showMenu(){this.notchFX?.clear();this.resumePreview(false);this.scenes.go('menu');}
  showField(){
    // C6B apresenta e persiste todos os personagens. O combate especial é da C6C.
    // A4: todos os sobreviventes desbloqueados são jogáveis (o bloqueio por metas segue na seleção).
    this.notchFX?.clear();this.audio.unlock().then(()=>this.audio.applySettings(this.save.settings));
    this.previewPaused=false;
    this.loop?.setPaused(false);
    this.scenes.go('field');
  }
  pausePreview(){if(this.scenes.name!=='field'||this.scenes.current?.run?.over)return;this.audio.pauseWeather?.();this.notchFX?.clear();this.previewPaused=true;this.scenes.current?.input?.clear();this.loop?.setPaused(true);this.ui.render();}
  resumePreview(redraw=true){this.previewPaused=false;this.loop?.setPaused(false);if(redraw&&this.ui)this.ui.render();}
  resetCamera(){const p=this.scenes.current?.run?.player;this.camera.setTarget(p?.x??592,p?.y??575);}
  destroy(){
    this.loop?.stop();this.scenes.dispose();this.ui?.destroy();this.audio.dispose();this.resizeObserver.disconnect();this.fullscreen.dispose();this.menuV3?.dispose();this.gamepad.dispose();if(window.__projectZGame===this)delete window.__projectZGame;
    this.performanceMonitor?.destroy();this.notchFX?.destroy();
    document.removeEventListener('visibilitychange',this.onVisibility);window.removeEventListener('keydown',this.onKeyDown);this.events.clear();
  }
}

// PROJECT Z — CRONOS PARTE 3: controles. Preserva sprites, fases e iluminação R13-C4F.
class CronosHaptics {
  constructor(game){this.game=game;this.last={};}
  pulse(kind){
    if(!this.game.save?.settings?.vibration?.[kind])return;
    const now=performance.now(),min=kind==='shots'?90:kind==='damage'?180:200;
    if(now-(this.last[kind]||0)<min)return;this.last[kind]=now;
    const duration=kind==='shots'?13:kind==='damage'?80:130;
    try{if(typeof navigator.vibrate==='function')navigator.vibrate(duration);}catch(_err){}
    try{
      const pad=this.game.gamepad?.read();const act=pad?.vibrationActuator||pad?.hapticActuators?.[0];
      if(act?.playEffect)act.playEffect('dual-rumble',{duration,strongMagnitude:kind==='shots'?.13:.45,weakMagnitude:kind==='shots'?.1:.36}).catch(()=>{});
      else if(act?.pulse)Promise.resolve(act.pulse(kind==='shots'?.12:.38,duration)).catch(()=>{});
    }catch(_err){}
  }
}
const PZ_C3_STICK_DEFAULT={move:{x:24,y:84},aim:{x:72,y:84}};
function pzTouchLayout(game){return game.save.settings.touchLayout||PZ_C3_STICK_DEFAULT;}
function pzStickAllowed(layout,area){
  for(const k of ['move','aim']){
    const p=layout[k];if(!p||p.x<10||p.x>90||p.y<50||p.y>92)return false;
    // Keep right-hand combat action rail accessible.
    if(p.x>81&&p.y<83)return false;
  }
  const width=area?.width||window.innerWidth||800,height=area?.height||window.innerHeight||500;
  const dist=Math.hypot((layout.move.x-layout.aim.x)*width/100,(layout.move.y-layout.aim.y)*height/100);
  return dist>=98;
}
function pzActiveField(game){
 const r=game.scenes.current?.run;
 return game.scenes.name==='field'&&r&&!r.over&&!r.backpackOpen&&!r.progress.selecting&&!r.discovery.selecting&&!game.previewPaused&&!game.ui?.modal;
}
function pzPadName(n){
 if(n===null||n===undefined)return 'SEM BOTÃO';
 const names={0:'A / CRUZ',1:'B / CÍRCULO',2:'X / QUADRADO',3:'Y / TRIÂNGULO',4:'LB / L1',5:'RB / R1',6:'LT / L2',7:'RT / R2',8:'SELECT / VIEW',9:'START / OPTIONS',10:'L3',11:'R3',12:'D-PAD ↑',13:'D-PAD ↓',14:'D-PAD ←',15:'D-PAD →',16:'HOME'};
 return names[n]||`BOTÃO ${n}`;
}
// Real independent sensitivities and dead zones for both analog sticks.
const _pzOldStick=DualStickInput.prototype.updateStick;
DualStickInput.prototype.updateStick=function(type,clientX,clientY){
  _pzOldStick.call(this,type,clientX,clientY);
  const c=window.__projectZGame?.save?.settings?.axisTuning;
  if(!c)return;
  const sensitivity=c[type==='move'?'moveSensitivity':'aimSensitivity']??1;
  const dead=c[type==='move'?'moveDead':'aimDead']??.15;
  const a=this.state[type],norm=Math.hypot(a.x,a.y),m=norm<=dead?0:Math.min(1,(norm-dead)/(1-dead)*sensitivity);
  if(norm>0){a.x=a.x/norm*m;a.y=a.y/norm*m;}
  if(type==='aim')a.active=m>.025;
  this.drawKnob(type,a.x,a.y);
};
const _pzOldDown=DualStickInput.prototype.pointerDown;
DualStickInput.prototype.pointerDown=function(e){
  if(e.target.closest?.('[data-stick]')){
    const g=window.__projectZGame;if(g){g.controlMode='touch';g.root.closest('.app')?.classList.remove('pz-pad-mode');}
  }
  return _pzOldDown.call(this,e);
};
const _pzOldInputAxes=DualStickInput.prototype.getAxes;
DualStickInput.prototype.getAxes=function(camera,player){
 const axes=_pzOldInputAxes.call(this,camera,player);
 const pad=window.__projectZGame?.gamepad;
 if(window.__projectZGame?.controlMode==='pad'&&pad?.active){
   axes.move=pad.axes().move;
   const aim=pad.axes().aim;
   axes.aim=aim.active?{...aim,fire:pad.axes().firing}:{x:0,y:0,active:false};
 }
 return axes;
};
const _pzOldUIRender=UIManager.prototype.render;
UIManager.prototype.render=function(){
 _pzOldUIRender.call(this);
 this.game.root.closest('.app')?.classList.toggle('pz-pad-mode',this.game.controlMode==='pad');
 this.root.querySelectorAll('[data-stick]').forEach(zone=>{
   const p=pzTouchLayout(this.game)[zone.dataset.stick];
   zone.style.setProperty('--pz-stick-x',`${p.x}%`);
   zone.style.setProperty('--pz-stick-y',`${p.y}%`);
 });
};
const _pzOldModalMarkup=UIManager.prototype.modalMarkup;
UIManager.prototype.modalMarkup=function(){
 if(this.modal==='layout'){
   const l=this.layoutPending||structuredClone(pzTouchLayout(this.game));
   return `<div class="modal-layer" role="presentation"><div class="modal-scrim" data-action="close-modal"></div><section class="modal-card pz-layout-panel" role="dialog" aria-modal="true" aria-label="Personalizar analógicos"><h2>POSIÇÃO DOS ANALÓGICOS</h2><p>Arraste cada analógico. Não é possível sobrepor botões ou áreas reservadas. O tamanho e a transparência não mudam.</p><div class="pz-layout-stage" data-layout-stage aria-label="Prévia da tela do jogo"><div class="pz-layout-hud">HUD · ÁREA RESERVADA</div><div class="pz-layout-actions">AÇÕES<br>DO JOGO</div><button type="button" class="pz-layout-stick" data-layout-stick="move" style="left:${l.move.x}%;top:${l.move.y}%">MOVER</button><button type="button" class="pz-layout-stick" data-layout-stick="aim" style="left:${l.aim.x}%;top:${l.aim.y}%">MIRAR</button></div><p data-layout-error aria-live="polite">Posições válidas são salvas por dispositivo; mudanças grandes no formato da tela restauram o padrão.</p><div class="pz-layout-buttons"><button data-action="layout-reset" type="button">RESTAURAR PADRÃO</button><button data-action="layout-save" type="button">SALVAR POSIÇÕES</button><button data-action="layout-cancel" type="button">CANCELAR</button></div></section></div>`;
 }
 let html=_pzOldModalMarkup.call(this);
 if(this.modal==='controls'){
  const st=this.game.save.settings,t=st.axisTuning,v=st.vibration;
  const padRows=Object.entries(PAD_BIND_NAMES).map(([key,label])=>`<div class="b5-keyrow"><span>${label}</span><button data-action="padbind-set" data-binding="${key}" type="button">${pzPadName(st.padbinds?.[key])}</button></div>`).join('');
  const ranges=[['moveSensitivity','SENSIBILIDADE MOVIMENTAÇÃO',.45,1.6,.05],['aimSensitivity','SENSIBILIDADE MIRA',.45,1.6,.05],['moveDead','ZONA MORTA MOVIMENTO',.05,.32,.01],['aimDead','ZONA MORTA MIRA',.05,.32,.01]].map(([k,label,min,max,step])=>`<label class="pz-tuning"><span>${label}</span><input type="range" data-pz-tuning="${k}" min="${min}" max="${max}" step="${step}" value="${t[k]}"><b>${Math.round(t[k]*100)}%</b></label>`).join('');
  const haptics=[['shots','TIROS'],['damage','DANO'],['explosions','EXPLOSÕES']].map(([key,label])=>`<label class="pz-haptic"><input type="checkbox" data-pz-haptic="${key}" ${v[key]?'checked':''}><span>VIBRAÇÃO · ${label}</span></label>`).join('');
  const insert=`<div class="b5-section pz-c3-section"><h3>GAMEPAD · BOTÕES PERSONALIZÁVEIS</h3><p>Pressione um botão para remapear. Conflitos substituem a ação anterior, que ficará sem comando.</p><div class="b5-keygrid">${padRows}</div><button type="button" class="b5-restore" data-action="padbind-reset">RESTAURAR GAMEPAD PADRÃO</button></div><div class="b5-section pz-c3-section"><h3>ANALÓGICOS DO CELULAR</h3><button type="button" data-action="layout-edit" class="b5-restore">PERSONALIZAR POSIÇÕES</button><div class="pz-c3-tunings">${ranges}</div></div><div class="b5-section pz-c3-section"><h3>VIBRAÇÃO IMERSIVA</h3><p>Ativada por padrão; a vibração depende do suporte do navegador e dispositivo.</p>${haptics}</div>`;
  html=html.replace('<button class="modal-done"',insert+'<button class="modal-done"');
 }
 return html;
};
const _pzOldUIClick=UIManager.prototype.handleClick;
UIManager.prototype.handleClick=function(event){
 const btn=event.target.closest?.('[data-action]');if(!btn||!this.root.contains(btn))return;
 const act=btn.dataset.action,g=this.game;
 if(act==='layout-edit'){this.layoutPending=structuredClone(pzTouchLayout(g));this.showModal('layout');return;}
 if(act==='layout-reset'){this.layoutPending=structuredClone(PZ_C3_STICK_DEFAULT);this.showModal('layout');return;}
 if(act==='layout-save'){const layout=this.layoutPending||PZ_C3_STICK_DEFAULT;if(pzStickAllowed(layout)){g.applySettings({touchLayout:layout});this.layoutPending=null;this.showModal('controls');}return;}
 if(act==='layout-cancel'){this.layoutPending=null;this.showModal('controls');return;}
 if(act==='padbind-set'){this.rebindPadAction=btn.dataset.binding;btn.textContent='PRESSIONE NO CONTROLE';return;}
 if(act==='padbind-reset'){this.rebindPadAction=null;g.applySettings({padbinds:{...PAD_BIND_DEFAULTS}});return;}
 return _pzOldUIClick.call(this,event);
};
const _pzOldUIInput=UIManager.prototype.handleInput;
UIManager.prototype.handleInput=function(event){
 const el=event.target,g=this.game;
 if(el.matches?.('[data-pz-tuning]')){
  const k=el.dataset.pzTuning;
  g.applySettings({axisTuning:{...g.save.settings.axisTuning,[k]:Number(el.value)}},false,false);
  const v=el.closest('.pz-tuning')?.querySelector('b');if(v)v.textContent=`${Math.round(Number(el.value)*100)}%`;
  return;
 }
 if(el.matches?.('[data-pz-haptic]')){
  const k=el.dataset.pzHaptic;
  g.applySettings({vibration:{...g.save.settings.vibration,[k]:el.checked}},false,false);return;
 }
 return _pzOldUIInput.call(this,event);
};
// Pointer-only layout editor, operative exclusively inside Controles > Personalizar.
(function(){
 let selected=null;
 document.addEventListener('pointerdown',e=>{
   const el=e.target.closest?.('[data-layout-stick]');if(!el)return;
   selected={el,id:e.pointerId,key:el.dataset.layoutStick};
   e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_e){}
 });
 document.addEventListener('pointermove',e=>{
   if(!selected||selected.id!==e.pointerId)return;
   const g=window.__projectZGame,ui=g?.ui,stage=selected.el.closest('[data-layout-stage]');if(!ui||!stage)return;
   const rect=stage.getBoundingClientRect(),x=Math.max(10,Math.min(90,((e.clientX-rect.left)/rect.width)*100)),y=Math.max(50,Math.min(92,((e.clientY-rect.top)/rect.height)*100));
   const candidate={...(ui.layoutPending||PZ_C3_STICK_DEFAULT),[selected.key]:{x,y}};
   const valid=pzStickAllowed(candidate,{width:rect.width,height:rect.height});
   if(valid){ui.layoutPending=candidate;selected.el.style.left=x+'%';selected.el.style.top=y+'%';}
   const err=stage.parentNode.querySelector('[data-layout-error]');if(err)err.textContent=valid?'POSIÇÃO VÁLIDA':'ÁREA RESERVADA OU SOBREPOSIÇÃO: ESCOLHA OUTRO LOCAL';
 });
 for(const k of ['pointerup','pointercancel'])document.addEventListener(k,e=>{if(selected?.id===e.pointerId)selected=null;});
})();
// Restore layout when rotating the phone or changing resolution significantly.
const _pzOldResize=Game.prototype.onResize;
Game.prototype.onResize=function(){
 const current={w:window.innerWidth||1,h:window.innerHeight||1};
 const old=this._pzScreenSize;
 this._pzScreenSize=current;
 if(old&&this.save.settings.touchLayout){
   const rotated=(old.w>old.h)!==(current.w>current.h);
   const changed=Math.abs(current.w/old.w-1)>.35||Math.abs(current.h/old.h-1)>.35;
   if(rotated||changed){this.save.setSettings({touchLayout:null});this.ui?.render();}
 }
 return _pzOldResize.call(this);
};
// Add a per-game vibration controller without touching the audio system.
const _pzOldGameInit=Game.prototype.init;
Game.prototype.init=async function(){
 this.haptics=new CronosHaptics(this);this.controlMode='touch';
 return _pzOldGameInit.call(this);
};
// Mouse wheel switches between equipped weapon slots, only during combat.
const _pzC3InitWithHaptics=Game.prototype.init;
Game.prototype.init=async function(){
  const result=await _pzC3InitWithHaptics.call(this);
  this._pzWheelLast=0;
  this._pzWheel=e=>{
    if(!pzActiveField(this))return;
    e.preventDefault();
    const now=performance.now();if(now-this._pzWheelLast<125)return;
    this._pzWheelLast=now;
    this.controlMode='mouse';this.root.closest('.app')?.classList.remove('pz-pad-mode');
    this.scenes.current.swapWeapon();
  };
  this.canvas.addEventListener('wheel',this._pzWheel,{passive:false});
  return result;
};
const _pzC3Destroy=Game.prototype.destroy;
Game.prototype.destroy=function(){if(this._pzWheel)this.canvas.removeEventListener('wheel',this._pzWheel);return _pzC3Destroy.call(this);};
// Switching back from gamepad to touch must work even when virtual sticks are hidden.
document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  const game=window.__projectZGame;
  if(game&&game.scenes.name==='field'){
    game.controlMode='touch';game.root.closest('.app')?.classList.remove('pz-pad-mode');
  }
},true);
// Standard Gamepad API: separate aim from RT/R2 fire; mapped actions and menu navigation.
PhysicalGamepad.prototype.tick=function(){
 if(this.stopped)return;
 const game=this.game,pad=this.read(),prevActive=this.active;
 this.active=!!pad;
 if(!pad){
   if(prevActive&&game.controlMode==='pad'&&pzActiveField(game)){
     game.pausePreview();this.disconnectedPause=true;
     if(game.scenes.current?.run)game.scenes.current.notify('CONTROLE DESCONECTADO · RECONEXÃO OU TOQUE',3);
   }
   this.previous=[];this.lastAxes={move:{x:0,y:0},aim:{x:0,y:0,active:false},firing:false};
   if(game.controlMode==='pad'){game.controlMode='touch';game.root.closest('.app')?.classList.remove('pz-pad-mode');}
   this.frame=requestAnimationFrame(this.tick);return;
 }
 const b=game.save.settings.padbinds||PAD_BIND_DEFAULTS;
 const pressed=pad.buttons.map(x=>Boolean(x.pressed));
 const edge=n=>n!==null&&n!==undefined&&Boolean(pressed[n]&&!this.previous[n]);
 const held=n=>n!==null&&n!==undefined&&Boolean(pressed[n]||(pad.buttons[n]?.value||0)>.23);
 const tuning=game.save.settings.axisTuning||{};
 const dead=(v,threshold,sensitivity)=>{
   const a=Math.abs(v);return a<=threshold?0:Math.sign(v)*Math.min(1,(a-threshold)/(1-threshold)*(sensitivity||1));
 };
 let mx=dead(pad.axes?.[0]||0,tuning.moveDead??.14,tuning.moveSensitivity??1),my=dead(pad.axes?.[1]||0,tuning.moveDead??.14,tuning.moveSensitivity??1);
 const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
 let ax=dead(pad.axes?.[2]||0,tuning.aimDead??.16,tuning.aimSensitivity??1),ay=dead(pad.axes?.[3]||0,tuning.aimDead??.16,tuning.aimSensitivity??1);
 const al=Math.hypot(ax,ay);if(al>1){ax/=al;ay/=al;}
 const anyEdge=pressed.some((v,i)=>v&&!this.previous[i]);
 const using=anyEdge||Math.hypot(mx,my)>.18||Math.hypot(ax,ay)>.18;
 if(using&&game.controlMode!=='pad'){
   game.controlMode='pad';game.root.closest('.app')?.classList.add('pz-pad-mode');
   game.scenes.current?.input?.clear();
 }
 const running=pzActiveField(game),trigger=held(b.fire);
 const oldAim=this.lastAxes.aim;
 const face=game.scenes.current?.run?.player?.facing??-Math.PI/2;
 const look=al>.16?{x:ax/al,y:ay/al}:oldAim.active?oldAim:{x:Math.cos(face),y:Math.sin(face)};
 this.lastAxes={move:{x:mx,y:my},aim:running&&(al>.16||trigger)?{...look,active:true,fire:trigger,hold:al>.16}:{x:0,y:0,active:false},firing:running&&trigger};
 if(game.ui?.rebindPadAction){
   if(anyEdge){
     const index=pressed.findIndex((v,i)=>v&&!this.previous[i]);const action=game.ui.rebindPadAction;
     const next={...game.save.settings.padbinds};
     for(const key of Object.keys(next))if(key!==action&&next[key]===index)next[key]=null;
     next[action]=index;game.ui.rebindPadAction=null;game.applySettings({padbinds:next});
   }
   this.previous=pressed;this.frame=requestAnimationFrame(this.tick);return;
 }
 const r=game.scenes.current?.run;
 if(edge(b.pause)&&game.scenes.name==='field'){game.togglePauseFromPhysical();}
 else if(edge(b.inventory)&&game.scenes.name==='field'&&!game.ui?.modal&&!game.previewPaused){game.scenes.current?.toggleBackpack();}
 const overlay=game.ui?.modal||game.previewPaused||r?.backpackOpen||r?.progress.selecting||r?.discovery.selecting;
 if(overlay){
   if(edge(b.special)){if(game.ui.modal)game.ui.showModal(null);else if(r?.backpackOpen)game.scenes.current.toggleBackpack();else game.resumePreview();}
   if(edge(b.confirm)&&!edge(b.pause)&&!edge(b.inventory)){
     if(r?.progress.selecting){const offers=r.progress.offers||[];if(offers.length)game.scenes.current.chooseUpgrade(offers[this.selection%offers.length]?.id);}
     else if(r?.discovery.selecting)game.scenes.current.closeDiscovery();
     else {
     const selected=document.activeElement;
     if(selected?.matches?.('button:not([disabled])')&&game.root.contains(selected)){
       // R45: a mochila redesenha a cada clique; o cursor do controle volta para o mesmo botão.
       const key=selected.dataset.action?`[data-action="${selected.dataset.action}"]${selected.dataset.slot!=null?`[data-slot="${selected.dataset.slot}"]`:''}`:null;
       const slot=selected.dataset.slot;
       selected.click();
       if(key&&!selected.isConnected){
         const again=game.root.querySelector(key)||(slot!=null&&game.root.querySelector(`[data-slot="${slot}"]`));
         again?.focus({preventScroll:true});
       }
     }
     else if(game.ui?.modal)game.ui.showModal(null);
     else if(game.previewPaused)game.resumePreview();
     }
   }
   const dir=(pressed[13]||my>.58||pressed[15]||mx>.60)?1:(pressed[12]||my<-.58||pressed[14]||mx<-.60)?-1:0;
   const now=performance.now();
   if(dir&&now-this.lastNavigation>220){
     this.lastNavigation=now;
     if(r?.progress.selecting){const offers=r.progress.offers||[];if(offers.length){this.selection=(this.selection+dir+offers.length)%offers.length;this.focusChoice('.upgrade-option',this.selection);}}
     else if(r?.discovery.selecting){game.root.querySelector('[data-action="dismiss-discovery"]')?.focus({preventScroll:true});}
     const container=game.ui?.modal?game.root.querySelector('.modal-card'):game.previewPaused?game.root.querySelector('.pause-card'):game.root.querySelector('.q54-panel');
     const items=[...container?.querySelectorAll?.('button:not([disabled])')||[]].filter(el=>el.getClientRects().length>0);
     if(items.length){let index=items.indexOf(document.activeElement);index=(index+dir+items.length)%items.length;items[index].focus({preventScroll:true});}
   }
 }else if(game.scenes.name==='field'&&running){
   if(edge(b.grenade))game.scenes.current.useGrenade();
   if(edge(b.reload))game.reloadFromPhysical();
   if(edge(b.swap))game.scenes.current.swapWeapon();
   if(edge(b.heal))game.scenes.current.useMedkit();
   if(edge(b.shield))game.scenes.current.useShieldCell();
   if(edge(b.special))game.scenes.current.activateSpecial();
   if(edge(b.interact))game.scenes.current.interact();
   if(r?.discovery.selecting&&edge(b.interact))game.scenes.current.closeDiscovery();
 }else if(game.scenes.name==='menu'){
   const dir=(pressed[13]||my>.6||pressed[15]||mx>.6)?1:(pressed[12]||my<-.6||pressed[14]||mx<-.6)?-1:0;
   const now=performance.now();
   if(dir&&now-this.lastNavigation>220){this.lastNavigation=now;
     if(game.menuV3?.nativeScreen){
       if(game.ui?.menuStep==='characters'){
         const chars=CRONOS_CHARACTERS;
         const index=chars.findIndex(c=>c.id===game.ui.previewCharacter);
         const next=(index+dir+chars.length)%chars.length;
         game.ui.previewCharacter=chars[next].id;
         game.ui.render();this.focusChoice('[data-action="char-pick"]',next);
       }else{
         const ds=Object.keys(DIFFICULTIES);const index=ds.indexOf(game.save.settings.difficulty);
         game.chooseDifficulty(ds[(index+dir+ds.length)%ds.length]);
       }
     }else{this.selection=(this.selection+dir+6)%6;this.focusCinema(this.selection);}
   }
   if(edge(b.special)&&game.menuV3?.nativeScreen){
     if(game.ui?.menuStep==='difficulty'){game.ui.menuStep='characters';game.ui.render();}
     else game.menuV3.show();
   }
   if(edge(b.confirm)){
     if(game.menuV3?.nativeScreen){
       if(game.ui?.menuStep==='characters')game.ui.advanceCharacter();
       else game.showField();
     }else game.menuV3?.navigate(['play','story','records','arsenal','settings','credits'][this.selection%6]);
   }
 }
 this.previous=pressed;
 this.frame=requestAnimationFrame(this.tick);
};


// ATLAS A9: no iPhone nenhum navegador deixa uma página entrar em tela cheia. O jeito é instalar o jogo
// na Tela de Início: aberto pelo ícone, ele roda sem barra de endereço e sem barras do navegador.
function pzShowInstallHint(){
  if(document.querySelector('.pz-install-hint'))return;
  const standalone=window.navigator.standalone||matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches;
  const chrome=/CriOS/i.test(navigator.userAgent);
  const el=document.createElement('div');el.className='pz-install-hint';el.setAttribute('role','dialog');
  el.innerHTML=standalone?`<div><b>TELA CHEIA</b><p>O jogo já está aberto como app, sem barras do navegador. Se ainda aparecer a barra de cima, é a barra do iPhone (hora e bateria).</p><button type="button">ENTENDI</button></div>`
  :`<div><b>TELA CHEIA NO IPHONE</b><p>O iPhone não deixa páginas da internet ocuparem a tela toda. Instale o jogo como app (leva 10 segundos):</p><ol>${chrome
    ?'<li>Toque no ícone de <b>compartilhar</b> (quadrado com seta para cima) ao lado do endereço.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li>'
    :'<li>Toque em <b>Compartilhar</b> (quadrado com seta para cima) na barra do Safari.</li><li>Role e escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>.</li>'}<li>Abra o <b>PROJECT Z</b> pelo ícone novo: sem barra de endereço, tela inteira.</li></ol><button type="button">ENTENDI</button></div>`;
  el.addEventListener('click',e=>{if(e.target===el||e.target.tagName==='BUTTON')el.remove();});
  document.body.appendChild(el);
}
