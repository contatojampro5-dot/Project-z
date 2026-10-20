// -- src/ui/UIManager.js --




const ICONS = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  speaker: '<path d="M11 5 6 9H3v6h3l5 4V5Zm5 4a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12"/>',
  muted: '<path d="M11 5 6 9H3v6h3l5 4V5ZM17 9l5 6m0-6-5 6"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/>',
  collapse: '<path d="M3 9h6V3M21 9h-6V3M21 15h-6v6M3 15h6v6"/>',
  settings: '<path d="M9.09 4.98 L10.16 4.63 L10.26 2.15 L13.74 2.15 L13.84 4.63 L14.91 4.98 L14.91 4.98 L15.91 5.49 L17.74 3.81 L20.19 6.26 L18.51 8.09 L19.02 9.09 L19.02 9.09 L19.37 10.16 L21.85 10.26 L21.85 13.74 L19.37 13.84 L19.02 14.91 L19.02 14.91 L18.51 15.91 L20.19 17.74 L17.74 20.19 L15.91 18.51 L14.91 19.02 L14.91 19.02 L13.84 19.37 L13.74 21.85 L10.26 21.85 L10.16 19.37 L9.09 19.02 L9.09 19.02 L8.09 18.51 L6.26 20.19 L3.81 17.74 L5.49 15.91 L4.98 14.91 L4.98 14.91 L4.63 13.84 L2.15 13.74 L2.15 10.26 L4.63 10.16 L4.98 9.09 L4.98 9.09 L5.49 8.09 L3.81 6.26 L6.26 3.81 L8.09 5.49 L9.09 4.98 Z"/><circle cx="12" cy="12" r="3.1"/>',
  scan: '<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/><path d="M8 12h8M12 8v8"/>',
  close: '<path d="M5 5l14 14M19 5 5 19"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  record: '<path d="M8 21h8M12 17v4M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H4v4a3 3 0 0 0 3 3m10-7h3v4a3 3 0 0 1-3 3"/>',
  chevron: '<path d="m15 18-6-6 6-6"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 2.6-6.4M3 3v5h5"/>',
  grenade: '<path d="M10 6V3h4v3m2-2 3-2m-2 7a7 7 0 1 1-10 0h10ZM9 12h6m-3-3v6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.2"/>',
};
function icon(name, size=20) { return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.info}</svg>`; }


function b3InventoryMarkup(r){
  const gun=r.gun,bag=r.player.backpack;
  const colors=ACCESSORY_RARITIES;
  const equipment=gun.attachmentSlots.map(slot=>{
    const tier=gun.attachments.get(gun.model,slot),rarity=tier?colors[tier-1]:null;
    return `<div class="b3-equip-chip" style="--quality:${rarity?.color||'#657381'}">
      <span>${B3_ACCESSORY_NAMES[slot]}</span><b>${tier?'NÍVEL '+tier:'VAZIO'}</b>
      ${tier?`<button type="button" data-action="remove-attachment" data-slot="${slot}" aria-label="Retirar ${B3_ACCESSORY_NAMES[slot]}">RETIRAR</button>`:''}
    </div>`;
  }).join('');
  const items=bag.slots.map((item,i)=>{
    const att=b3ParseAccessory(item?.type),rare=att?colors[att.tier-1]:null;
    const itemName=att?B3_ACCESSORY_NAMES[att.slot]:item?.type==='medkit'?'KIT MÉDICO':item?.type==='shieldCell'?'CÉLULA DE ESCUDO':'';
    const canEquip=att?gun.attachmentSlots.includes(att.slot):false;
    return `<div class="q54-slot ${item?'filled':''} ${r.bagSelectedSlot===i?'selected':''} ${att?'b3-accessory-slot':''}" style="--quality:${rare?.color||'#77c8ff'}">
      <button type="button" class="b3-slot-main" data-action="bag-slot" data-slot="${i}" aria-label="Espaço ${i+1}: ${item?itemName+' quantidade '+item.qty:'vazio'}">
        <small>${String(i+1).padStart(2,'0')}</small>
        ${item?`<strong>${att?'⌖':item.type==='medkit'?'✚':'◈'}</strong><span>${itemName}</span><b>×${item.qty}</b>${rare?`<i>${rare.name}</i>`:''}`:'<em>VAZIO</em>'}
      </button>
      ${att?`<button type="button" class="b3-equip-button" data-action="equip-attachment" data-bag-index="${i}" ${canEquip?'':'disabled'} aria-label="Instalar ${itemName}">${canEquip?'INSTALAR':'INCOMPATÍVEL'}</button>`:''}
    </div>`;
  }).join('');
  return `<div class="q54-backdrop"><section class="q54-panel" role="dialog" aria-modal="true" aria-label="Mochila e equipamentos">
    <header><div><small>PROJECT Z / EQUIPAMENTO DE SOBREVIVÊNCIA</small><h2>MOCHILA <span>${bag.slots.filter(Boolean).length} / ${bag.capacity} ESPAÇOS</span></h2><p class="b3-header-copy">Gerencie cura, escudo e acessórios sem perder a leitura rápida da partida.</p></div><button type="button" data-action="backpack-toggle" aria-label="Fechar mochila">✕</button></header>
    <div class="b3-inventory-grid">
      <div class="b3-portrait-area"><div class="b3-portrait-badge">OPERADOR ATIVO</div><canvas class="b3-antoniocanvas" data-b3-portrait width="184" height="196" role="img" aria-label="Antônio com seu equipamento original"></canvas><b>ANTÔNIO</b><small>SOBREVIVENTE · EQUIPADO</small></div>
      <div class="b3-equipment"><div class="b3-section-title">LEITURA RÁPIDA DA CARGA</div><div class="b3-overview">
        <div><small>COLETE ATUAL</small><b style="color:${colors[r.player.armorTier-1]?.color}">NÍVEL ${r.player.armorTier}</b><span>${Math.ceil(r.player.shield)} / ${r.player.maxShield} ESCUDO</span></div>
        <div><small>ARMA ATUAL</small><b>${gun.config.name}</b><span>${gun.ammo} NO PENTE · ${gun.reserve} RESERVA</span></div>
      </div><div class="b3-equipped-title">ACESSÓRIOS INSTALADOS</div><div class="b3-equipped-grid">${equipment||'<span>ARMA SEM ESPAÇOS DISPONÍVEIS</span>'}</div></div>
    </div>
    <div class="b3-slots-head"><span>ITENS NA MOCHILA</span><small>2 UNIDADES POR ESPAÇO · CLIQUE EM DOIS ESPAÇOS PARA TROCAR</small></div>
    <div class="q54-slots">${items}</div>
    <footer>JOGO PAUSADO ENQUANTO A MOCHILA ESTIVER ABERTA · TECLA I PARA FECHAR</footer>
  </section></div>`;
}
class UIManager {
  constructor(root, game) {
    this.root=root;this.game=game;this.view='menu';this.modal=null;this.selectedDossier=null;this.rebindAction=null;this.menuStep='characters';this.previewCharacter='antonio';
    this.boundClick=(event)=>this.handleClick(event);
    this.boundInput=(event)=>this.handleInput(event);
    root.addEventListener('click',this.boundClick);
    root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button][data-action]')){e.preventDefault();e.target.click();}});
    root.addEventListener('input',this.boundInput);
    this.render();
  }
  handleClick(event) {
    const button=event.target.closest('[data-action]');
    if(!button||!this.root.contains(button))return;
    const action=button.dataset.action;
    if(action==='climate-cycle'){
      cycleProjectZClimatePreview();
      this.updateClimatePreviewButton();
      return;
    }
    if(action==='fullscreen-toggle') {
      void this.game.toggleFullscreen();
      return;
    }
    if(action==='volume-step'||action==='test-effects'||action==='sound-toggle'||action==='music-toggle')void this.game.audio.unlock();
    if(action!=='music-toggle')this.game.audio.feedback(action==='go-menu'?'back':'select');
    if(action==='volume-step'){
      const key=button.dataset.setting;
      const old=this.game.save.settings[key]??1;
      const next=Math.max(0,Math.min(1,Math.round(old*100+Number(button.dataset.delta))/100));
      this.game.applySettings({[key]:next},true,false);
      const row=button.closest('.range-row');
      if(row){row.querySelector('input').value=Math.round(next*100);row.querySelector('.range-value').textContent=`${Math.round(next*100)}%`;}
      if(key==='effectsVolume'&&next>0)this.game.audio.feedback('select');
    }
    if(action==='test-effects'){
      this.game.applySettings({soundEnabled:true,effectsVolume:Math.max(.65,this.game.save.settings.effectsVolume??0)},true,false);
      const testButton=this.root.querySelector('[data-action="test-effects"]');
      if(testButton)testButton.textContent='CARREGANDO EFEITOS…';
      this.game.audio.unlock().then(async ok=>{
        if(ok)await this.game.audio.preloadSamples();
        const audible=ok&&this.game.audio.playSample('shot');
        const button=this.root.querySelector('[data-action="test-effects"]');
        if(button)button.textContent=`ÁUDIO ${this.game.audio.ctx?.state||'indisponível'} · ${this.game.audio.loadedCount}/43 WAV · ${this.game.audio.missingCount} falhas · disparo ${audible?'acionado':'falhou'}`;
      }).catch(err=>{
        const button=this.root.querySelector('[data-action="test-effects"]');
        if(button)button.textContent='ERRO DE ÁUDIO: '+String(err).slice(0,60);
      });
    }
    if(action==='keybind-set'){
      this.rebindAction=button.dataset.binding;
      const all=this.root.querySelectorAll('[data-action="keybind-set"]');
      all.forEach(el=>{el.textContent=el===button?'PRESSIONE UMA TECLA':pzKeyName(this.game.save.settings.keybinds?.[el.dataset.binding]);});
    }
    if(action==='keybind-reset'){this.rebindAction=null;this.game.applySettings({keybinds:{...KEYBIND_DEFAULTS}});}
    if(action==='graphics-preset'){
      const level=graphicLevel(button.dataset.level);
      this.game.applySettings({graphicsQuality:level,shadowsQuality:level,particlesQuality:level,lightingQuality:level,weatherQuality:level,autoQuality:false});
    }
    if(action==='char-pick'){
      const target=CRONOS_CHARACTERS.find(c=>c.id===button.dataset.character);
      if(target){this.previewCharacter=target.id;this.render();}
    }
    if(action==='char-to-difficulty')this.advanceCharacter();
    if(action==='char-to-menu')this.game.menuV3?.show();
    if(action==='difficulty-to-characters'){this.menuStep='characters';this.render();}
    if(action==='difficulty')this.game.chooseDifficulty(button.dataset.difficulty);
    if(action==='choose-upgrade')this.game.scenes.current?.chooseUpgrade(button.dataset.upgrade);
    if(action==='shield-cell')this.game.scenes.current?.useShieldCell();
    if(action==='consumable-select')this.game.scenes.current?.selectConsumable(button.dataset.item);
    if(action==='consumable-use')this.game.scenes.current?.useSelectedConsumable();
    if(action==='backpack-toggle')this.game.scenes.current?.toggleBackpack();
    if(action==='bag-slot')this.game.scenes.current?.selectBagSlot(button.dataset.slot);
    if(action==='equip-attachment')this.game.scenes.current?.equipBagAttachment(button.dataset.bagIndex);
    if(action==='remove-attachment')this.game.scenes.current?.removeGunAttachment(button.dataset.slot);
    if(action==='throw-grenade')this.game.scenes.current?.useGrenade();
    if(action==='activate-special')this.game.scenes.current?.activateSpecial();
    if(action==='auto-fire-toggle')this.game.scenes.current?.toggleAutoFire();
    if(action==='start-preview'||action==='restart')this.game.showField();
    if(action==='go-menu')this.game.showMenu();
    if(action==='settings')this.showModal('settings');
    if(action==='controls')this.showModal('controls');
    if(action==='records')this.showModal('records');
    if(action==='bestiary'){this.selectedDossier=null;this.showModal('bestiary');}
    if(action==='bestiary-detail'&&this.game.save.hasDiscovered(button.dataset.infected)){this.selectedDossier=button.dataset.infected;this.render();}
    if(action==='bestiary-list'){this.selectedDossier=null;this.render();}
    if(action==='dismiss-discovery')this.game.scenes.current?.closeDiscovery();
    if(action==='about')this.showModal('about');
    if(action==='close-modal')this.showModal(null);
    if(action==='music-toggle')this.game.applySettings({musicEnabled:!this.game.save.settings.musicEnabled},true);
    if(action==='sound-toggle')this.game.applySettings({soundEnabled:!this.game.save.settings.soundEnabled});
    if(action==='motion-toggle')this.game.applySettings({reducedMotion:!this.game.save.settings.reducedMotion});
    if(action==='dev-unlock-toggle')this.game.applySettings({devUnlockAll:!this.game.save.settings.devUnlockAll});
    if(action==='perf-diagnostic'){void pzRunDiagnostic(this.game);return;}
    if(action==='auto-quality-toggle')this.game.applySettings({autoQuality:this.game.save.settings.autoQuality===false});
    if(action==='damage-numbers-toggle')this.game.applySettings({damageNumbers:this.game.save.settings.damageNumbers===false});
    if(action==='performance-toggle')this.game.applySettings({showPerformance:!this.game.save.settings.showPerformance});
    if(action==='pause')this.game.pausePreview();
    if(action==='resume')this.game.resumePreview();
    if(action==='reset-camera')this.game.resetCamera();
  }
  handleInput(event){
    const name=event.target.dataset.setting;
    if(Object.hasOwn(GRAPHIC_DEFAULTS,name)){
      const value=graphicLevel(event.target.value);
      const options={[name]:value,autoQuality:false};
      // Custom advanced tuning is saved alongside the preset.
      this.game.applySettings(options,false,false);
      return;
    }
    if(['masterVolume','menuMusicVolume','gameMusicVolume','effectsVolume'].includes(name)){
      this.game.applySettings({[name]:Number(event.target.value)/100},false,false);
      void this.game.audio.unlock();
      const v=event.target.closest('.range-row')?.querySelector('.range-value');
      if(v)v.textContent=`${event.target.value}%`;
    }
  }
  updateClimatePreviewButton(){
    const button=this.root.querySelector('[data-action="climate-cycle"]');
    if(!button)return;
    const state=window.__PROJECT_Z_CLIMATE_PREVIEW__;
    const icon=button.querySelector('[data-climate-icon]');
    const label=button.querySelector('[data-climate-label]');
    if(icon)icon.textContent=state?.icon||'◷';
    if(label)label.textContent=state?.label||'AUTO';
    button.classList.toggle('pz-climate-preview-active',!!state);
    button.setAttribute('aria-label',state?'Clima de prévia: '+state.label+'. Clique para próximo clima':'Clima automático: clique para prévia de anoitecer');
    button.title=state?'Prévia visual: '+state.label+' (ondas e sobrevivência não mudam)':'Iluminação automática pelo relógio real da partida';
  }
  setView(view) {this.view=view;this.modal=null;this.render();}
  showModal(name) {this.rebindAction=null;this.modal=name;if(this.game.scenes.name==='field'){this.game.scenes.current?.input?.clear();this.game.loop?.setPaused(Boolean(name)||this.game.previewPaused);}this.render();if(!name&&this.game.scenes.name==='field')this.game.canvas.focus({preventScroll:true});}
  render(){
    this.root.innerHTML=this.view==='menu'?this.menuMarkup():this.fieldMarkup();
    if(this.modal)this.root.insertAdjacentHTML('beforeend',this.modalMarkup());
    this.game.fullscreen.sync();
    this.game.menuV3?.sync();
    this.updateAutoFireButton(this.game.scenes.current);
    this.updateClimatePreviewButton();
    this.drawBackpackCharacter();
    if(this.view==='field'&&this.game.scenes.current?.run)this.updateHUD(this.game.scenes.current.run);
  }

  drawBackpackCharacter(){
    const canvas=this.root.querySelector('[data-b3-portrait]');
    const player=this.game.scenes.current?.run?.player;
    if(!canvas||!player||!this.game.assets)return;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='rgba(5,15,21,.5)';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(canvas.width/2,canvas.height*.66);ctx.scale(2.3,2.3);ctx.translate(-player.x,-player.y);
    // Visual original da Q.04-FIX.1, desenhado pelo próprio Player.
    const original={x:player.facing,motion:player.motion,invuln:player.invulnerable};
    player.facing=Math.PI/2;player.motion=0;player.invulnerable=0;
    try{player.draw(ctx,this.game.assets);}finally{player.facing=original.x;player.motion=original.motion;player.invulnerable=original.invuln;ctx.restore();}
  }
  topbar(inField=false){
    const music=this.game.save.settings.musicEnabled;
    return `<header class="topbar">
      <button class="brand" data-action="${inField?'go-menu':'about'}" aria-label="${inField?'Voltar ao menu':'Sobre PROJECT Z'}"><span class="brand-symbol">Z<span class="brand-dot">.</span></span><span class="brand-text">PROJECT Z<span class="brand-sub">SURVIVOR PROTOCOL</span></span></button>
      <div class="topbar-right"><span class="protocol-tag"><i class="pulse"></i> BLACKOUT</span><span class="build-tag">BLOCO 5 <b>/</b> OLIMPO</span><span class="topbar-divider"></span>
      <button class="icon-button fullscreen-control" type="button" data-action="fullscreen-toggle" aria-label="Ativar tela cheia" title="Tela cheia" aria-pressed="false">${icon('expand')}</button>
      <button class="icon-button" data-action="music-toggle" aria-label="${music?'Desligar música':'Ligar música'}" title="${music?'Desligar música':'Ligar música'}">${icon(music?'speaker':'muted')}</button>
      <button class="icon-button" data-action="settings" aria-label="Configurações" title="Configurações">${icon('settings')}</button></div>
    </header>`;
  }
  // C6B: confirmação respeita desbloqueio persistido. O gameplay de Hadassa, San e Hanna
  // entra somente na entrega C6C — esta fase cria navegação, vitrine e progresso real.
  advanceCharacter(){
    const character=CRONOS_CHARACTERS.find(c=>c.id===this.previewCharacter);
    if(!cronosIsCharacterUnlocked(character,this.game.save))return false;
    this.game.save.setSettings({selectedCharacter:character.id});
    this.menuStep='difficulty';this.render();
    return true;
  }
  characterMarkup(){
    // R13-C6B.1 — Seleção redesenhada (palco + ficha + elenco). Ações e ordem de navegação preservadas.
    const progress=cronosCharacterProgress(this.game.save);
    const selected=CRONOS_CHARACTERS.find(c=>c.id===this.previewCharacter)||CRONOS_CHARACTERS[0];
    const unlocked=cronosIsCharacterUnlocked(selected,this.game.save);
    const idx=CRONOS_CHARACTERS.indexOf(selected)+1;
    const pct=(v,max)=>Math.max(4,Math.min(100,v/max*100));
    const bar=(label,value,shown)=>`<div class="pz-cs-stat"><div class="pz-cs-stat-row"><span>${label}</span><b>${shown}</b></div><div class="pz-cs-bar"><i style="width:${pct(value,150)}%"></i></div></div>`;
    const lockIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/></svg>';
    const abilityIcon={
      antonio:'<path d="M13 2 5 14h6l-2 8 8-12h-6z"/>',
      hadassa:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
      san:'<path d="M6 9a3 3 0 0 1 3-3h7a4 4 0 0 1 4 4v4a6 6 0 0 1-6 6h-3a5 5 0 0 1-5-5zM6 11h9"/>',
      hanna:'<path d="M9 2h6v2h-1v5l5 9a2 2 0 0 1-2 3H7a2 2 0 0 1-2-3l5-9V4H9z"/>'
    }[selected.id]||'';
    const progOf=c=>c.unlockType==='wave'?progress.bestWave:progress.kills;
    const card=(c,i)=>{
      const open=cronosIsCharacterUnlocked(c,this.game.save),sel=c.id===selected.id;
      return `<button type="button" class="pz-c6b-char pz-cs-tile ${sel?'is-selected':''} ${open?'is-unlocked':'is-locked'}" data-action="char-pick" data-character="${c.id}" aria-pressed="${sel}" aria-label="${c.name}, ${open?'desbloqueado':'bloqueado'}" style="--char-color:${c.tint}">
         <span class="pz-cs-tile-art">${pzCharVisual(c,'bust','-t')}</span>
         <span class="pz-cs-tile-no">0${i+1}</span>
         ${open?'':`<span class="pz-cs-tile-lock">${lockIcon}</span>`}
         <span class="pz-cs-tile-name">${c.name}</span>
         ${open?'':`<span class="pz-cs-tile-prog"><i style="width:${Math.max(0,Math.min(100,progOf(c)/c.unlock*100))}%"></i></span>`}
      </button>`;
    };
    const current=progOf(selected);
    const targetLabel=selected.unlockType==='wave'?`ONDA ${Math.min(current,selected.unlock)} / ${selected.unlock}`:`${Math.min(current,selected.unlock).toLocaleString('pt-BR')} / ${selected.unlock.toLocaleString('pt-BR')}`;
    const requirement=selected.unlockType==='wave'?`Alcance a onda ${selected.unlock}`:`Elimine ${selected.unlock.toLocaleString('pt-BR')} infectados`;
    const status=!unlocked
      ?`<div class="pz-cs-unlock"><div class="pz-cs-unlock-row"><span>${lockIcon} ${requirement}</span><b>${targetLabel}</b></div><div class="pz-cs-unlock-bar"><i style="width:${Math.min(100,current/selected.unlock*100)}%"></i></div></div>`
      :selected.gameplay?`<div class="pz-cs-badge is-ready">● PRONTO PARA JOGAR</div>`:`<div class="pz-cs-badge is-soon">◆ HABILIDADES CHEGAM NA PRÓXIMA ATUALIZAÇÃO</div>`;
    return `${this.topbar()}
     <main class="pz-c6b-screen pz-cs ${unlocked?'is-unlocked':'is-locked'} ${PZ_CHAR_ART[selected.id]?'has-art':''} ${this.game.save.settings.reducedMotion?'is-calm':''}" id="main-content" style="--char-color:${selected.tint}">
       <div class="pz-cs-bg" aria-hidden="true"><span class="pz-cs-watermark">${selected.name}</span></div>
       <div class="pz-cs-layout">
         <header class="pz-cs-head">
           <div><small>SELEÇÃO DE PERSONAGEM</small><h1>ESCOLHA SEU <em>SOBREVIVENTE</em></h1></div>
           <button type="button" class="pz-c6b-back" data-action="char-to-menu">← MENU</button>
         </header>
         <section class="pz-cs-stage" aria-hidden="true" data-key="${selected.id}">
           <div class="pz-cs-beam"></div><div class="pz-cs-ring"></div><div class="pz-cs-embers"><i style="--x:49%;--s:2px;--d:7.0s;--w:-0.5s;--dx:28px"></i><i style="--x:20%;--s:3px;--d:7.9s;--w:-9.1s;--dx:-13px"></i><i style="--x:12%;--s:2px;--d:7.2s;--w:-0.7s;--dx:-29px"></i><i style="--x:78%;--s:3px;--d:5.3s;--w:-5.7s;--dx:-12px"></i><i style="--x:88%;--s:4px;--d:9.7s;--w:-5.8s;--dx:10px"></i><i style="--x:14%;--s:2px;--d:5.2s;--w:-8.6s;--dx:-3px"></i><i style="--x:61%;--s:2px;--d:7.7s;--w:-5.7s;--dx:31px"></i><i style="--x:31%;--s:2px;--d:7.9s;--w:-6.4s;--dx:7px"></i><i style="--x:20%;--s:4px;--d:8.6s;--w:-5.6s;--dx:39px"></i><i style="--x:34%;--s:3px;--d:8.4s;--w:-4.3s;--dx:0px"></i><i style="--x:67%;--s:4px;--d:9.6s;--w:-3.6s;--dx:-9px"></i><i style="--x:31%;--s:2px;--d:5.4s;--w:-3.0s;--dx:23px"></i><i style="--x:51%;--s:3px;--d:6.4s;--w:-9.8s;--dx:-25px"></i><i style="--x:73%;--s:3px;--d:5.8s;--w:-3.4s;--dx:22px"></i></div>
           <div class="pz-cs-hero">${pzCharVisual(selected,'full','-h')}</div>
           ${unlocked?'':`<div class="pz-cs-lockbadge">${lockIcon}<span>BLOQUEADO</span></div>`}
         </section>
         <article class="pz-cs-info" data-key="${selected.id}">
           <div class="pz-cs-meta"><span class="pz-cs-idx">0${idx}<i> / 0${CRONOS_CHARACTERS.length}</i></span><span class="pz-cs-class">${selected.type}</span></div>
           <h2 class="pz-cs-name">${selected.name}</h2>
           <p class="pz-cs-title">${selected.title}</p>
           <div class="pz-cs-stats">${bar('VIDA',selected.hp,selected.hp)}${bar('VELOCIDADE',selected.speed,selected.speed+'%')}</div>
           <div class="pz-cs-ability">
             <div class="pz-cs-ab-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${abilityIcon}</svg></div>
             <div><small>HABILIDADE ESPECIAL</small><h3>${selected.primary}</h3><p>${selected.detail}</p></div>
           </div>
           ${selected.passive?`<div class="pz-cs-passive"><small>PASSIVA</small><p>${selected.passive}</p></div>`:''}
           <div class="pz-cs-action">
             ${status}
             <button class="pz-c6b-continue pz-cs-cta" data-action="char-to-difficulty" ${unlocked?'':'disabled'}><span>${unlocked?'CONTINUAR COM '+selected.name:'PERSONAGEM BLOQUEADO'}</span><span class="pz-cs-cta-arrow">${unlocked?'→':lockIcon}</span></button>
           </div>
         </article>
         <nav class="pz-c6b-list pz-cs-roster" role="group" aria-label="Seleção de personagens">${CRONOS_CHARACTERS.map(card).join('')}</nav>
         <footer class="pz-cs-foot"><span>ELIMINAÇÕES <b>${progress.kills.toLocaleString('pt-BR')}</b></span><span>MAIOR ONDA <b>${String(progress.bestWave).padStart(2,'0')}</b></span><span class="pz-cs-keys"><kbd>◀ ▶</kbd> ESCOLHER <kbd>ENTER</kbd> CONFIRMAR <kbd>ESC</kbd> VOLTAR</span></footer>
       </div>
     </main>`;
  }
  menuMarkup(){
    if(this.menuStep==='characters')return this.characterMarkup();
    // C4.1 · Hermes — tela de dificuldade no mesmo sistema visual da seleção (palco + ficha).
    const difficulty=this.game.save.settings.difficulty;
    const current=DIFFICULTIES[difficulty]||DIFFICULTIES.medium;
    const active=CRONOS_CHARACTERS.find(c=>c.id===this.game.save.settings.selectedCharacter)||CRONOS_CHARACTERS[0];
    const calm=this.game.save.settings.reducedMotion?'is-calm':'';
    const mult=v=>'×'+String(v).replace('.',',');
    const tone={easy:'#8fd3a7',medium:'#e3b47c',hardcore:'#e2555f'};
    const card=(d,i)=>{const sel=d.id===difficulty;
      return `<button type="button" class="pz-ds-card ${sel?'is-selected':''}" data-action="difficulty" data-difficulty="${d.id}" aria-pressed="${sel}" style="--d-color:${tone[d.id]||'#e3b47c'}">
        <span class="pz-ds-card-top"><span class="pz-ds-no">0${i+1}</span><span class="pz-ds-name">${d.name}</span><span class="pz-ds-check" aria-hidden="true">${sel?'✓':''}</span></span>
        <span class="pz-ds-chip">${d.tag}</span>
        <span class="pz-ds-label">${d.label} ${d.hint}</span>
        <span class="pz-ds-stats"><span><i>VIDA</i><b>${d.hp}</b></span><span title="Dano recebido"><i>DANO</i><b>${mult(d.damage)}</b></span><span><i>INIMIGOS</i><b>${mult(d.enemies)}</b></span><span><i>RECURSOS</i><b>${mult(d.resources)}</b></span></span>
      </button>`;};
    return `${this.topbar()}
     <main class="pz-c6b-screen pz-cs pz-ds is-unlocked ${PZ_CHAR_ART[active.id]?'has-art':''} ${calm}" id="main-content" style="--char-color:${active.tint}">
       <div class="pz-cs-bg" aria-hidden="true"><span class="pz-cs-watermark">${current.name}</span></div>
       <div class="pz-cs-layout">
         <header class="pz-cs-head">
           <div><small>PASSO 2 DE 2</small><h1>ESCOLHA A <em>DIFICULDADE</em></h1></div>
           <button type="button" class="pz-c6b-back" data-action="difficulty-to-characters">← PERSONAGEM</button>
         </header>
         <section class="pz-cs-stage" aria-hidden="true">
           <div class="pz-cs-beam"></div><div class="pz-cs-ring"></div>
           <div class="pz-cs-hero">${pzCharVisual(active,'full','-d')}</div>
           <div class="pz-ds-tag"><span>SOBREVIVENTE</span><b>${active.name}</b><small>${active.title}</small></div>
           <p class="pz-ds-quote">O mundo acabou.<br><em>A luta não.</em></p>
         </section>
         <article class="pz-cs-info pz-ds-panel">
           <div class="pz-ds-list" role="group" aria-label="Selecionar dificuldade">${Object.values(DIFFICULTIES).map(card).join('')}</div>
           <div class="pz-cs-action">
             ${active.gameplay?'':`<div class="pz-cs-badge is-soon">◆ HABILIDADES DE ${active.name} CHEGAM NA PRÓXIMA ATUALIZAÇÃO</div>`}
             <button class="pz-c6b-continue pz-cs-cta" data-action="start-preview" ${active.gameplay?'':'disabled aria-disabled="true"'}><span>${active.gameplay?'INICIAR SOBREVIVÊNCIA':'EM BREVE'}</span><span class="pz-cs-cta-arrow">→</span></button>
             <nav class="pz-ds-links" aria-label="Mais opções"><button type="button" data-action="records">RECORDES</button><button type="button" data-action="bestiary">INFECTADOS</button><button type="button" data-action="controls">CONTROLES</button><button type="button" data-action="about">SOBRE</button></nav>
           </div>
         </article>
         <footer class="pz-cs-foot"><span>DIFICULDADE <b>${current.name}</b></span><span>VIDA INICIAL <b>${current.hp} HP</b></span><span class="pz-cs-keys"><kbd>◀ ▶</kbd> ESCOLHER <kbd>ENTER</kbd> INICIAR <kbd>ESC</kbd> VOLTAR</span></footer>
       </div>
     </main>`;
  }
  fieldMarkup(){
    const r=this.game.scenes.current?.run;
    if(!r)return '';
    const paused=this.game.previewPaused,over=r.over,choosing=r.progress.selecting,discovering=r.discovery.selecting;
    const w=r.waves,p=r.progress;
    const phase=w.phase==='rest'?'INTERVALO':'ONDA EM CURSO';
    return `${this.topbar(true)}
      <button type="button" class="pz-climate-cycle" data-action="climate-cycle" aria-label="Alternar prévia de clima" title="Clique para alternar os horários; não altera o tempo de sobrevivência"><span data-climate-icon>◷</span><span>CLIMA</span><small data-climate-label>AUTO</small></button>
      <main class="combat-ui" aria-label="Interface de combate">
        <div class="combat-hud">
          <div class="hud-health"><div class="hud-shield-row"><span>COLETE · ESCUDO <b data-armor-tier>I</b></span><b data-shield>100 / 100</b></div><div class="shield-segments" data-shield-segments aria-label="Cinco barras de escudo">${Array.from({length:5},(_,i)=>`<span class="shield-segment" data-shield-segment="${i}" style="--segment-fill:100%"></span>`).join('')}</div><div class="hud-health-row"><span>SAÚDE / SOBREVIVENTE</span><b data-hp>${Math.ceil(r.player.hp)} / ${r.player.maxHp}</b></div><div class="health-track"><div data-health-fill style="width:${r.player.hp/r.player.maxHp*100}%"></div></div>
          <div class="hud-xp-row"><span data-level>NÍVEL ${p.level}</span><span data-xp>${p.xp-p.currentLevelXP} / ${p.threshold-p.currentLevelXP} XP</span></div><div class="xp-track"><div data-xp-fill style="width:${p.progress*100}%"></div></div><span class="hud-area"><span data-area>ZONA 01 // CENTRO ABANDONADO</span><span class="hud-special" data-special>TRILHA · DISPONÍVEL NO NÍVEL 5</span></span></div>
          <div class="hud-center-stack"><div class="hud-center"><span data-wave>ONDA ${String(w.wave).padStart(2,'0')}</span><b data-time>${formatTime(w.remaining)}</b><small data-phase>${phase}</small></div><div class="boss-hud" data-boss-hud hidden><div class="boss-header"><span class="boss-symbol">☣</span><b data-boss-name>O COLOSSO</b><span data-boss-hp>800 / 800</span></div><div class="boss-track"><div data-boss-fill></div></div></div><div class="boss-alert" data-boss-alert aria-live="polite"></div></div>
          <button class="hud-pause" data-action="pause" aria-label="Pausar combate">${icon('pause',18)}</button>
        </div>

        <button type="button" class="q54-bag-button" data-action="backpack-toggle" aria-label="Abrir mochila">▣ MOCHILA <small>I</small></button>
        <div class="antonio-caption" data-antonio-caption role="status" aria-live="off" aria-label="Fala de Antônio"><span class="antonio-name">ANTÔNIO</span><span class="antonio-words" data-antonio-text></span></div>
        <div class="hud-combat-stats"><span class="nearby-supplies">SUPRIMENTOS <b data-nearby>0</b></span><span>ABATES <b data-kills>${r.kills}</b></span><span class="hud-weapon-identity"><span class="hud-weapon-art" data-weapon-art>${weaponSvg(r.gun.model,'hud',p.specialBranch==='firearms'?p.specialTier:0)}</span><span class="hud-weapon-name" data-weapon>${r.gun.config.name}</span></span><span class="hud-ammo">MUNIÇÃO <b data-ammo>${r.gun.ammo} / ${r.gun.reserve}</b></span><small data-reload></small></div>
        ${!paused&&!over&&!choosing&&!discovering?`<div class="combat-sticks">
          <div class="stick-zone stick-move" data-stick="move" role="group" aria-label="Joystick de movimentação"><span class="stick-ring"></span><span class="stick-cross">✣</span><span class="stick-knob" data-knob="move"></span><span class="stick-label">MOVER</span></div>
          <div class="stick-zone stick-aim" data-stick="aim" role="group" aria-label="Joystick de mira e disparo"><span class="stick-ring"></span><span class="stick-cross">✦</span><span class="stick-knob" data-knob="aim"></span><span class="stick-label">MIRAR / ATIRAR</span></div>
          <button type="button" class="pz-skill-button" data-action="activate-special" aria-label="Habilidade especial: ${(SURVIVOR_KITS[r.player.charId||'antonio']||SURVIVOR_KITS.antonio).title}" title="${(SURVIVOR_KITS[r.player.charId||'antonio']||SURVIVOR_KITS.antonio).title}"><strong>${(SURVIVOR_KITS[r.player.charId||'antonio']||SURVIVOR_KITS.antonio).icon}</strong><small data-skill-time>HABILIDADE</small></button>
          <button type="button" class="auto-fire-button" data-action="auto-fire-toggle" aria-label="Ativar tiro automático" aria-pressed="false" title="Tiro automático: mire no zumbi mais próximo"><span class="auto-fire-symbol" aria-hidden="true">⌖</span><span class="auto-fire-name">TIRO AUTO</span><span class="auto-fire-status" data-auto-fire-status>DESLIGADO</span></button>
          <button type="button" class="grenade-button" data-action="throw-grenade" aria-label="Lançar granada automaticamente no grupo de zumbis" ${r.grenades.count<=0?'disabled':''}><span class="grenade-icon">${icon('grenade',26)}</span><span class="grenade-quantity" data-grenades>× ${r.grenades.count}</span><span class="grenade-caption">GRANADA · G</span></button>
          <div class="q53-consumables" aria-label="Consumíveis de sobrevivência">
            <button type="button" class="q53-toggle" data-action="consumable-use" aria-label="Usar consumível selecionado"><span class="q53-plus">+</span><b data-consumable-name>ESCUDO</b><small data-consumable-progress>USAR · V</small><span class="q57-charge-track"><span data-q57-charge-fill></span></span></button>
            <div class="q53-choices"><button type="button" data-action="consumable-select" data-item="shield" aria-label="Selecionar célula de escudo">◈ <b data-shield-cells>× ${r.player.shieldCells}</b></button><button type="button" data-action="consumable-select" data-item="medkit" aria-label="Selecionar kit médico">✚ <b data-medkits>× ${r.player.medkits}</b></button></div>
          </div>
        </div>`:''}
        <div class="pz-pad-tip" aria-live="polite">CONTROLE CONECTADO · RT DISPARA · RB GRANADA · B HABILIDADE</div>
        <div class="control-hint"><b>WASD</b> MOVER &nbsp;·&nbsp; <b>MOUSE</b> ATIRAR · <b>ESPAÇO</b> ACELERAR &nbsp;·&nbsp; <b>G</b> GRANADA &nbsp;·&nbsp; <b>H</b> CURA &nbsp;·&nbsp; <b>V</b> USAR &nbsp;·&nbsp; <b>ESC</b> PAUSAR &nbsp;·&nbsp; <b>C</b> CONTROLES</div>
        <div class="loot-toast" data-loot-toast aria-live="polite" style="opacity:${r.lootToastTime>0?1:0}">${r.lootToastTime>0?r.lootToast:''}</div>
        ${r.backpackOpen?b3InventoryMarkup(r):''}
        ${choosing&&!paused&&!over&&!discovering?`<div class="upgrade-overlay"><section class="upgrade-panel" role="dialog" aria-modal="true" aria-label="Escolha uma evolução"><div class="upgrade-header"><span class="modal-kicker">EVOLUÇÃO DISPONÍVEL · TEMPO 10%</span><div class="upgrade-kicker">NÍVEL ${p.choiceLevel||p.level}</div><h2>${p.specialMoment?'EQUIPAMENTO DE <em>SOBREVIVÊNCIA.</em>':'ESCOLHA SEU <em>CAMINHO.</em>'}</h2><p>${p.specialMoment?'Três marcos na partida. Escolha uma trilha realista e aprimore-a até o nível 15.':'Uma escolha. Várias possibilidades de sobrevivência.'}</p></div><div class="upgrade-grid ${p.specialMoment?'upgrade-special-grid':''}">${p.offers.map(u=>`<button type="button" class="upgrade-option ${u.type==='special'?'upgrade-special-card':''}" data-action="choose-upgrade" data-upgrade="${u.id}"><span class="upgrade-option-type">${u.type==='special'?'TRILHA DE SOBREVIVÊNCIA · ETAPA '+u.tier+'/3':u.type==='weapon'?'ARMA':u.type==='equipment'?'EQUIPAMENTO':'MODIFICADOR'}</span><span class="upgrade-option-icon ${u.type==='weapon'?'weapon-option-art':''}">${u.type==='special'?specialWeaponIcon(u.branch,u.tier):u.type==='weapon'?weaponSvg(u.id,'upgrade'):u.type==='equipment'?'◇':'✧'}</span><span class="upgrade-option-name">${u.name}</span><span class="upgrade-option-desc">${u.desc}</span><span class="upgrade-option-level">${u.type==='special'?'EQUIPAR · '+u.tier+'/3':`NÍVEL ${(p.levelOf(u.id)+1)} / ${u.max}`} · ESCOLHER →</span></button>`).join('')}</div><span class="upgrade-help">JOGO EM CÂMERA LENTA · VOCÊ NÃO SOFRE DANO DURANTE A ESCOLHA</span></section></div>`:''}
        ${discovering&&!paused&&!over?this.discoveryMarkup(r.discovery.active):''}
        ${paused?`<div class="pause-overlay"><div class="pause-card"><span class="modal-kicker">SOBREVIVÊNCIA INTERROMPIDA</span><h2>PAUSADO<span>.</span></h2><p>A partida está congelada e será retomada sem perder seu progresso.</p><div class="pause-arsenal"><span>ARSENAL · ARMA EQUIPADA</span><div class="pause-arsenal-active">${weaponSvg(r.gun.model,'pause',p.specialBranch==='firearms'?p.specialTier:0)}<strong>${r.gun.config.name}</strong></div></div><button class="primary-cta compact" data-action="resume"><span>CONTINUAR COMBATE</span><span class="cta-icon">${icon('arrow',19)}</span></button><button class="text-button" data-action="fullscreen-toggle">⛶ ALTERNAR TELA CHEIA</button><button class="text-button" data-action="controls">TECLADO E CONTROLE</button><button class="text-button" data-action="bestiary">REGISTRO DE INFECTADOS</button><button class="text-button" data-action="go-menu">ABANDONAR PARTIDA</button></div></div>`:''}
        ${over?`<div class="pause-overlay"><div class="pause-card game-over-card"><span class="modal-kicker">SINAL VITAL PERDIDO</span><h2>VOCÊ MORREU<span>.</span></h2><p>Sobrevivência encerrada. A experiência e os upgrades são reiniciados na próxima partida.</p><div class="gameover-stats"><div><span>ONDA ALCANÇADA</span><strong>${w.wave}</strong></div><div><span>ABATES</span><strong>${r.kills}</strong></div><div><span>NÍVEL FINAL</span><strong>${p.level}</strong></div><div><span>TEMPO VIVO</span><strong>${formatTime(r.elapsed)}</strong></div></div><button class="primary-cta compact" data-action="restart"><span>TENTAR NOVAMENTE</span><span class="cta-icon">${icon('arrow',19)}</span></button><button class="text-button" data-action="go-menu">VOLTAR AO MENU</button></div></div>`:''}
      </main>`;
  }
  updateAutoFireButton(scene){
    const button=this.root.querySelector('[data-action="auto-fire-toggle"]');
    if(!button)return;
    const enabled=Boolean(scene?.autoFireEnabled);
    button.classList.toggle('is-active',enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'Desativar tiro automático':'Ativar tiro automático');
    button.title=enabled?'Tiro automático ligado. Toque para desligar.':'Tiro automático desligado. Toque para ligar.';
    const status=button.querySelector('[data-auto-fire-status]');
    if(status)status.textContent=enabled?(scene?.autoTarget?'MIRANDO':'PROCURANDO'):'DESLIGADO';
  }
  updateHUD(run){
    if(this.view!=='field'||!run)return;
    this.updateAutoFireButton(this.game.scenes.current);
    const set=(selector,value)=>{const el=this.root.querySelector(selector);if(el)el.textContent=value;};
    set('[data-hp]',`${Math.ceil(run.player.hp)} / ${run.player.maxHp}`);
    set('[data-shield]',`${Math.ceil(run.player.shield||0)} / ${run.player.maxShield||0}`);
    set('[data-armor-tier]',String(run.player.armorTier||1));
    set('[data-shield-cells]',`× ${run.player.shieldCells}`);
    set('[data-medkits]',`× ${run.player.medkits}`);
    set('[data-consumable-name]',run.player.selectedConsumable==='medkit'?'KIT MÉDICO':'ESCUDO');
    const activeCharge=run.player.medkitCharge>0?run.player.medkitCharge:run.player.shieldCharge>0?run.player.shieldCharge:0;
    const chargeFill=this.root.querySelector('[data-q57-charge-fill]');if(chargeFill)chargeFill.style.width=`${activeCharge>0?(1-activeCharge/3)*100:0}%`;
    const chargeButton=this.root.querySelector('.q53-toggle');if(chargeButton){chargeButton.classList.toggle('q57-charging',activeCharge>0);chargeButton.classList.toggle('q57-medical',run.player.medkitCharge>0);}
    set('[data-consumable-progress]',run.player.medkitCharge>0?`CURANDO ${run.player.medkitCharge.toFixed(1)}s`:run.player.shieldCharge>0?`ESCUDO ${run.player.shieldCharge.toFixed(1)}s`:'USAR · V');
    this.root.querySelectorAll('[data-action="consumable-select"]').forEach(el=>el.classList.toggle('selected',el.dataset.item===run.player.selectedConsumable));
    const use=this.root.querySelector('[data-action="consumable-use"]');if(use)use.disabled=run.player.medkitCharge>0||run.player.shieldCharge>0||(run.player.selectedConsumable==='medkit'?(run.player.medkits<=0||run.player.hp>=run.player.maxHp):(run.player.shieldCells<=0||run.player.shield>=run.player.maxShield));
    set('[data-shield-charge]',run.player.shieldCharge>0?`${run.player.shieldCharge.toFixed(1)}s`:'CÉLULA · V');
    const cellButton=this.root.querySelector('[data-action="shield-cell"]');if(cellButton)cellButton.disabled=run.player.shieldCells<=0||run.player.shield>=run.player.maxShield||run.player.shieldCharge>0;
    this.root.querySelectorAll('[data-shield-segment]').forEach((segment,i)=>{
      const unit=run.player.shieldUnit||20;
      const remaining=i>=run.player.armorTier?0:Math.max(0,Math.min(1,((run.player.shield||0)-i*unit)/unit));
      segment.style.opacity=i>=run.player.armorTier?'.2':'1';
      segment.style.setProperty('--segment-fill',`${remaining*100}%`);
    });
    const fill=this.root.querySelector('[data-health-fill]');
    if(fill){
      const fraction=run.player.maxHp>0?Math.max(0,Math.min(1,run.player.hp/run.player.maxHp)):0;
      fill.style.width=`${fraction*100}%`;
      const track=fill.parentElement;
      // Decision 3: activate at 25% inclusive. Decision 4: disable immediately above 25%.
      const critical=fraction>0&&fraction<=.25;
      track.classList.toggle('cronos-hp-critical',critical);
      if(critical){
        const intensity=1-fraction/.25;
        track.style.setProperty('--cronos-hp-period',`${(.65+.75*(fraction/.25)).toFixed(3)}s`);
        track.style.setProperty('--cronos-hp-glow',(.28+.67*intensity).toFixed(3));
      }else{
        track.style.removeProperty('--cronos-hp-period');
        track.style.removeProperty('--cronos-hp-glow');
      }
    }
    set('[data-time]',formatTime(Math.ceil(run.waves.remaining)));
    set('[data-wave]',`ONDA ${String(run.waves.wave).padStart(2,'0')}`);
    set('[data-phase]',run.waves.phase==='rest'?'INTERVALO · RECUPERE O FÔLEGO':'ONDA EM CURSO');
    set('[data-level]',`NÍVEL ${run.progress.level}`);
    set('[data-area]',`ZONA 0${['center','suburb','industry','highway'].indexOf(run.district.id)+1} // ${run.district.name}`);
    set('[data-xp]',`${run.progress.xp-run.progress.currentLevelXP} / ${run.progress.threshold-run.progress.currentLevelXP} XP`);
    const xpFill=this.root.querySelector('[data-xp-fill]');if(xpFill)xpFill.style.width=`${Math.max(0,Math.min(100,run.progress.progress*100))}%`;
    set('[data-kills]',String(run.kills));set('[data-weapon]',run.gun.config.name);
    set('[data-special]',run.progress.specialBranch?('TRILHA '+({melee:'CORPO A CORPO',traps:'ARMADILHAS',firearms:'ARMAMENTOS'}[run.progress.specialBranch])+' · '+run.progress.specialTier+'/3'):'TRILHA · NÍVEL 5');
    const weaponArt=this.root.querySelector('[data-weapon-art]');
    if(weaponArt&&weaponArt.dataset.model!==(run.gun.model+'-'+(run.progress.specialBranch==='firearms'?run.progress.specialTier:0))){weaponArt.innerHTML=weaponSvg(run.gun.model,'hud',run.progress.specialBranch==='firearms'?run.progress.specialTier:0);weaponArt.dataset.model=run.gun.model+'-'+(run.progress.specialBranch==='firearms'?run.progress.specialTier:0);}
    set('[data-nearby]',String(run.loot.nearbyCount(run.player)));
    set('[data-grenades]',`× ${run.grenades.count}`);
    const skillButton=this.root.querySelector('[data-action="activate-special"]');
    if(skillButton){const p=run.player;skillButton.disabled=p.charId==='hanna'?p.specialCooldown>0:(p.specialRemaining>0||p.specialCooldown>0);const label=skillButton.querySelector('[data-skill-time]');if(label)label.textContent=pzSkillLabel(p);}
    const button=this.root.querySelector('[data-action="throw-grenade"]');if(button)button.disabled=run.grenades.count<=0;
    const toast=this.root.querySelector('[data-loot-toast]');if(toast){toast.textContent=run.lootToastTime>0?run.lootToast:'';toast.style.opacity=run.lootToastTime>0?'1':'0';}
    const subtitle=this.root.querySelector('[data-antonio-caption]');
    const activeLine=run.dialogue?.active;
    if(subtitle){
      const visible=Boolean(activeLine)&&!run.over&&!this.game.previewPaused&&!run.progress.selecting&&!run.discovery.selecting&&!this.modal;
      subtitle.classList.toggle('is-visible',visible);
      if(visible&&subtitle.dataset.id!==String(activeLine.id)){
        subtitle.querySelector('[data-antonio-text]').textContent=activeLine.text;
        subtitle.dataset.id=String(activeLine.id);
      }
      if(!visible)subtitle.dataset.id='';
    }
    const boss=run.boss?.alive?run.boss:null;
    this.root.querySelector('.combat-ui')?.classList.toggle('has-boss',Boolean(boss));
    const bossHud=this.root.querySelector('[data-boss-hud]');if(bossHud)bossHud.hidden=!boss;
    if(boss){
      set('[data-boss-name]',boss.name);
      set('[data-boss-hp]',`${Math.ceil(boss.hp)} / ${boss.maxHp}`);
      const fill=this.root.querySelector('[data-boss-fill]');if(fill)fill.style.width=`${Math.max(0,100*boss.hp/boss.maxHp)}%`;
    }
    const alert=this.root.querySelector('[data-boss-alert]');if(alert){alert.textContent=run.noticeTextTime>0?run.noticeText:'';alert.classList.toggle('is-visible',run.noticeTextTime>0);}
    set('[data-ammo]',`${run.gun.ammo} / ${run.gun.reserve}`);
    set('[data-reload]',run.gun.reloadRemaining>0?'RECARREGANDO...':run.gun.ammo===0&&run.gun.reserve===0?'SEM MUNIÇÃO':'');
  }
  discoveryMarkup(id){
    const d=BESTIARY[id];if(!d)return '';
    const boss=d.boss;
    return `<div class="discovery-overlay" role="dialog" aria-modal="true" aria-label="Novo infectado: ${d.name}">
      <div class="discovery-card ${boss?'discovery-boss':''}">
        <div class="discovery-stripe">${boss?'⚠ ALERTA DE ANOMALIA':'NOVA AMEAÇA IDENTIFICADA'} <span>ARQUIVO DESBLOQUEADO</span></div>
        <div class="discovery-art"><span class="discovery-number">Z—${String(BESTIARY_IDS.indexOf(id)+1).padStart(2,'0')}</span><div class="discovery-halo"></div><img src="${ASSETS[d.sprite]}" alt="Arte pixel art de ${d.name}" draggable="false" /></div>
        <div class="discovery-body"><span class="discovery-category">${d.category}</span><h2>${d.name}</h2>
          <div class="discovery-metrics"><div><span>VIDA</span><strong>${d.hp}</strong></div><div><span>DANO</span><strong>${d.damage}</strong></div><div><span>VELOCIDADE</span><strong>${d.speed}</strong></div><div><span>XP</span><strong>${d.xp}</strong></div></div>
          <span class="discovery-section">REGISTRO BIOLÓGICO</span><p>${d.lore}</p><span class="discovery-section">COMPORTAMENTO</span><p>${d.behavior}</p>
          <div class="discovery-tip"><span>PROTOCOLO DE SOBREVIVÊNCIA</span><p>${d.tip}</p></div>
          <button data-action="dismiss-discovery" class="discovery-continue">REGISTRAR E CONTINUAR <span>→</span></button>
        </div>
      </div><span class="discovery-foot">TEMPO REDUZIDO · PROTEÇÃO CONTRA DANO · PRIMEIRO CONTATO</span>
    </div>`;
  }
  bestiaryMarkup(){
    const unlocked=BESTIARY_IDS.filter(id=>this.game.save.hasDiscovered(id)).length;
    const id=this.selectedDossier;
    if(id&&this.game.save.hasDiscovered(id)){
      const d=BESTIARY[id],stats=this.game.save.bestiary;
      return `<span class="modal-kicker">ARQUIVO DE INFECTADOS / ${unlocked} DE 8</span><div class="bestiary-detail">
        <button class="bestiary-back" data-action="bestiary-list">← TODOS OS REGISTROS</button>
        <div class="bestiary-detail-art"><img src="${ASSETS[d.sprite]}" alt="${d.name}"/></div><span class="discovery-category">${d.category}</span><h2>${d.name}<span>.</span></h2>
        <div class="discovery-metrics"><div><span>VIDA</span><strong>${d.hp}</strong></div><div><span>DANO</span><strong>${d.damage}</strong></div><div><span>VELOCIDADE</span><strong>${d.speed}</strong></div><div><span>XP</span><strong>${d.xp}</strong></div></div>
        <span class="discovery-section">REGISTRO BIOLÓGICO</span><p>${d.lore}</p><span class="discovery-section">COMPORTAMENTO</span><p>${d.behavior}</p><div class="discovery-tip"><span>PROTOCOLO</span><p>${d.tip}</p></div>
        <div class="bestiary-counts"><span>ELIMINAÇÕES <strong>${stats.kills[id]||0}</strong></span><span>MORTES POR CONTATO <strong>${stats.deaths[id]||0}</strong></span></div>
      </div>`;
    }
    return `<span class="modal-kicker">DOSSIÊ CLASSIFICADO / INFECTADOS</span><h2>BESTIÁRIO<span>.</span></h2><p>Registros desbloqueados ao encontrar cada mutação pela primeira vez. ${unlocked} de ${BESTIARY_IDS.length} identificados.</p>
    <div class="bestiary-meter"><div style="width:${unlocked/BESTIARY_IDS.length*100}%"></div></div>
    <div class="bestiary-grid">${BESTIARY_IDS.map((key,i)=>{
      const d=BESTIARY[key],seen=this.game.save.hasDiscovered(key);
      return `<button class="bestiary-tile ${seen?'is-known':'is-unknown'}" data-action="bestiary-detail" data-infected="${key}" ${seen?'':'disabled'} aria-label="${seen?d.name:'Infectado não descoberto'}"><span class="bestiary-index">REG. ${String(i+1).padStart(2,'0')}</span><span class="bestiary-sprite">${seen?`<img src="${ASSETS[d.sprite]}" alt=""/>`:'?'}</span><span class="bestiary-title">${seen?d.name:'DADOS BLOQUEADOS'}</span><small>${seen?d.category:'ENCONTRE PARA REVELAR'}</small></button>`;
    }).join('')}</div><p class="bestiary-legend">Os atributos apresentados são os valores-base dos infectados. Eles podem escalar conforme a onda.</p>`;
  }
  modalMarkup(){
    let content='';const settings=this.game.save.settings;
    if(this.modal==='settings'){
      content=`<span class="modal-kicker">CONFIGURAÇÕES / SYSTEM</span><h2>AJUSTES<span>.</span></h2><p>Preferências salvas automaticamente neste navegador.</p>
      ${[['masterVolume','VOLUME GERAL'],['menuMusicVolume','MÚSICA DO MENU'],['gameMusicVolume','MÚSICA DA PARTIDA'],['effectsVolume','EFEITOS SONOROS']].map(([key,name])=>`<div class="range-row"><span>${name}</span><button class="volume-step" type="button" data-action="volume-step" data-setting="${key}" data-delta="-10" aria-label="Diminuir ${name}">−</button><input aria-label="${name}" type="range" min="0" max="100" step="1" value="${Math.round((settings[key]??1)*100)}" data-setting="${key}"/><button class="volume-step" type="button" data-action="volume-step" data-setting="${key}" data-delta="10" aria-label="Aumentar ${name}">+</button><b class="range-value">${Math.round((settings[key]??1)*100)}%</b></div>`).join('')}
      <button class="audio-test" type="button" data-action="test-effects">▶ TESTAR ÁUDIO E VERIFICAR CARREGAMENTO</button>
      <div class="b5-section"><h3>QUALIDADE GRÁFICA</h3><p>Visual original preservado; níveis ajustam somente detalhes secundários.</p>
        <div class="b5-quality-pills">${GRAPHIC_LEVELS.map(level=>`<button type="button" data-action="graphics-preset" data-level="${level}" class="${settings.graphicsQuality===level?'active':''}">${{low:'BAIXA',medium:'MÉDIA',high:'ALTA'}[level]}</button>`).join('')}</div>
        <div class="b5-quality-grid">${[['shadowsQuality','SOMBRAS E AMBIENTE'],['particlesQuality','SANGUE E PARTÍCULAS'],['lightingQuality','LUZES ADICIONAIS'],['weatherQuality','CHUVA E NEBLINA']].map(([key,label])=>`<label><span>${label}</span><select data-setting="${key}">${GRAPHIC_LEVELS.map(level=>`<option value="${level}" ${settings[key]===level?'selected':''}>${{low:'Baixa',medium:'Média',high:'Alta'}[level]}</option>`).join('')}</select></label>`).join('')}</div>
      </div>
      <button class="controls-shortcut" type="button" data-action="controls">⌨  VER E PERSONALIZAR COMANDOS  →</button>
      <div class="setting-row"><div><strong>REDUZIR MOVIMENTO</strong><small>Diminui as animações ambientais</small></div><button class="toggle ${settings.reducedMotion?'is-on':''}" data-action="motion-toggle" aria-pressed="${settings.reducedMotion}" aria-label="Reduzir movimento"><i></i></button></div>
      <div class="setting-row"><div><strong>MODO TESTE · LIBERAR SOBREVIVENTES</strong><small>Libera Hadassa, San e Hanna sem cumprir as metas · não altera seu progresso salvo</small></div><button class="toggle ${settings.devUnlockAll?'is-on':''}" data-action="dev-unlock-toggle" aria-pressed="${!!settings.devUnlockAll}" aria-label="Modo teste: liberar sobreviventes"><i></i></button></div>
      <div class="setting-row"><div><strong>DIAGNÓSTICO DE DESEMPENHO</strong><small>Mede o FPS com cada efeito desligado · use durante a partida · atalho F9</small></div><button class="toggle" data-action="perf-diagnostic" aria-label="Rodar diagnóstico de desempenho" style="width:auto;padding:0 12px;font:800 10px ui-monospace,monospace;letter-spacing:.12em">RODAR</button></div>
      <div class="setting-row"><div><strong>QUALIDADE AUTOMÁTICA</strong><small>Reduz sozinha luz, clima e partículas se o jogo ficar lento · desliga ao ajustar à mão</small></div><button class="toggle ${settings.autoQuality!==false?'is-on':''}" data-action="auto-quality-toggle" aria-pressed="${settings.autoQuality!==false}" aria-label="Qualidade automática"><i></i></button></div>
      <div class="setting-row"><div><strong>NÚMEROS DE DANO</strong><small>Valores e "CRÍTICO" sobre os inimigos atingidos</small></div><button class="toggle ${settings.damageNumbers!==false?'is-on':''}" data-action="damage-numbers-toggle" aria-pressed="${settings.damageNumbers!==false}" aria-label="Números de dano"><i></i></button></div>
      <div class="setting-row"><div><strong>MONITOR DE DESEMPENHO</strong><small>FPS, tempos do quadro, zumbis, partículas e rede · atalho F8</small></div><button class="toggle ${settings.showPerformance?'is-on':''}" data-action="performance-toggle" aria-pressed="${settings.showPerformance}" aria-label="Monitor de desempenho"><i></i></button></div>
      <p class="perf-setting-note">O jogo funciona offline; não há ping de servidor. Memória e informações de rede só aparecem quando o navegador permite.</p>`;
    } else if(this.modal==='characters'){
      const difficulty=DIFFICULTIES[this.game.save.settings.difficulty];
      content=`<span class="modal-kicker">PROJECT Z / SOBREVIVENTES</span><h2>PERSONAGEM<span>.</span></h2>
      <p>O protótipo possui um único sobrevivente jogável. A seleção de personagens ainda não foi implementada.</p>
      <div class="record-list">
      <div class="record-line"><span>PERSONAGEM DISPONÍVEL</span><strong>SOBREVIVENTE</strong></div>
      <div class="record-line"><span>ARMA INICIAL</span><strong>${WEAPONS.pistol.name}</strong></div>
      <div class="record-line"><span>DIFICULDADE ATUAL</span><strong>${difficulty.name}</strong></div>
      <div class="record-line"><span>VIDA INICIAL</span><strong>${difficulty.hp} HP</strong></div>
      </div>`;
    } else if(this.modal==='controls'){
      content=`<span class="modal-kicker">PROJECT Z / ENTRADAS FÍSICAS</span><h2>CONTROLES<span>.</span></h2><p>No celular, mova o analógico direito para mirar e atirar; ao soltá-lo, os disparos param. No gamepad, o analógico direito apenas mira e RT/R2 dispara. As funções e posições dos controles podem ser personalizadas.</p>
      <div class="b5-section"><h3>TECLAS CONFIGURÁVEIS</h3><p>Toque em uma tecla para alterar, depois pressione o novo comando. As alterações são salvas no navegador.</p>
        <div class="b5-keygrid">${Object.entries(KEYBIND_NAMES).map(([action,label])=>`<div class="b5-keyrow"><span>${label}</span><button type="button" data-action="keybind-set" data-binding="${action}">${pzKeyName(settings.keybinds?.[action])}</button></div>`).join('')}</div>
        <button type="button" class="b5-restore" data-action="keybind-reset">RESTAURAR TECLAS PADRÃO</button>
      </div>
      <div class="controls-guide">
        <section class="control-panel"><h3>⌨ TECLADO + MOUSE</h3>
        <div class="control-line"><span>Movimentar</span><kbd>W A S D / ↑ ← ↓ →</kbd></div>
        <div class="control-line"><span>Mirar / disparar</span><kbd>MOUSE / CLIQUE ESQUERDO</kbd></div><div class="control-line"><span>Aceleração de Antônio</span><kbd>ESPAÇO · +40% / 10s</kbd></div><div class="control-line"><span>Cura / escudo</span><kbd>H / V</kbd></div><div class="control-line"><span>Inventário / interação</span><kbd>TAB OU I / E</kbd></div><div class="control-line"><span>Trocar armas</span><kbd>RODINHA / 1 / 2</kbd></div>
        <div class="control-line"><span>Mira direcional</span><kbd>I J K L</kbd></div>
        <div class="control-line"><span>Recarregar</span><kbd>R</kbd></div>
        <div class="control-line"><span>Granada</span><kbd>G</kbd></div>
        <div class="control-line"><span>Pausar / retomar</span><kbd>ESC</kbd></div>
        <div class="control-line"><span>Escolher upgrade</span><kbd>1 / 2 / 3</kbd></div>
        <div class="control-line"><span>Controles / tela cheia</span><kbd>C / F</kbd></div>
        <div class="control-line"><span>Monitor de FPS</span><kbd>F8</kbd></div>
        </section>
        <section class="control-panel"><h3>◉ GAMEPAD</h3>
        <div class="control-line"><span>Movimentar</span><kbd>ANALÓGICO ESQ.</kbd></div>
        <div class="control-line"><span>Mirar (sem disparar)</span><kbd>ANALÓGICO DIR.</kbd></div>
        <div class="control-line"><span>Disparar</span><kbd>RT / R2</kbd></div>
        <div class="control-line"><span>Granada</span><kbd>RB / R1</kbd></div>
        <div class="control-line"><span>Recarregar</span><kbd>X / □</kbd></div><div class="control-line"><span>Habilidade / Cura / Escudo</span><kbd>B / LB / LT</kbd></div><div class="control-line"><span>Trocar arma / Interagir</span><kbd>Y / A</kbd></div><div class="control-line"><span>Inventário</span><kbd>SELECT / VIEW</kbd></div>
        <div class="control-line"><span>Pausar</span><kbd>START / OPTIONS</kbd></div>
        <div class="control-line"><span>Confirmar / voltar</span><kbd>A / CRUZ &nbsp;·&nbsp; B / CÍRCULO</kbd></div>
        <div class="control-line"><span>Escolhas nos menus</span><kbd>D-PAD + A</kbd></div>
        </section>
      </div><p class="control-tip">Alguns navegadores só reconhecem o gamepad depois de pressionar um botão. No iOS, o suporte depende do navegador e do controle conectado.</p>`;
    } else if(this.modal==='story'){
      content=`<span class="modal-kicker">PROJECT Z / HISTÓRIA</span><h2>HISTÓRIA<span>.</span></h2>
        <p>Antônio é o sobrevivente inicial de PROJECT Z. A apresentação narrativa e as histórias dos demais personagens serão detalhadas na próxima etapa desta fase.</p>
        <div class="about-box"><strong>PERSONAGENS PLANEJADOS</strong><span>ANTÔNIO · HADASSA · SAN · HANNA</span></div>
        <div class="about-box"><strong>ETAPA ATUAL</strong><span>O menu está funcional. Esta é uma apresentação provisória, sem alterar a história nem criar conteúdo não aprovado.</span></div>`;
    } else if(this.modal==='arsenal'){
      content=`<span class="modal-kicker">PROJECT Z / ARMAMENTOS</span><h2>ARSENAL<span>.</span></h2><p>Consulta rápida das armas existentes. A ficha completa de cada arma será refinada na R13-C6D.</p>
        <div class="record-list">${Object.values(WEAPONS).map(w=>`<div class="record-line"><span>${w.name}</span><strong>${w.magazine} TIROS · ${w.damage} DANO BASE</strong></div>`).join('')}</div>`;
    } else if(this.modal==='records'){
      const records=this.game.save.records,stats=this.game.save.statistics;
      content=`<span class="modal-kicker">ARQUIVO DE SOBREVIVENTES</span><h2>RECORDES<span>.</span></h2><p>Recordes por dificuldade, incluindo a maior onda alcançada.</p>
      <div class="record-list">${Object.values(DIFFICULTIES).map(d=>{const row=records[d.id];return `<div class="record-line"><span>${d.name}</span><strong>${row?`${row.wave>0?'ONDA '+row.wave+' · ':''}${formatTime(row.seconds)} · ${row.kills} ABATES`:'SEM REGISTROS'}</strong></div>`;}).join('')}</div>
      <div class="stats-list"><div><strong>${stats.plays}</strong><span>PARTIDAS</span></div><div><strong>${stats.totalZombies}</strong><span>ELIMINAÇÕES</span></div><div><strong>${formatTime(stats.totalSurvivalSeconds)}</strong><span>TEMPO TOTAL</span></div></div><button type="button" class="controls-shortcut" data-action="bestiary">ABRIR REGISTRO DE INFECTADOS →</button>`;
    } else if(this.modal==='bestiary'){
      content=this.bestiaryMarkup();
    } else {
      content=`<span class="modal-kicker">PROJECT Z / CRÉDITOS</span><h2>CRÉDITOS<span>.</span></h2><p>Interface de menu clássico e sombrio. HUD e gameplay preservados. Áudio com 43 arquivos WAV e duas músicas; os efeitos incluem sons enviados para a curadoria e amostras demonstrativas. Músicas: ARPMedia (menu) e Paulyudin (partida), via Pixabay.</p><div class="about-box"><strong>JÁ IMPLEMENTADO</strong><span>Quatro zonas, combates, seis zumbis e dois chefes, oito cartas de descoberta, bestiário persistente, pickups, granadas, XP e música adaptativa.</span></div><div class="about-box"><strong>PRÓXIMA ENTREGA</strong><span>R13-C6B: seleção dos quatro personagens. R13-C6D: telas secundárias completas.</span></div><div class="about-foot">${GAME.version} · ${GAME.delivery}</div>`;
    }
    return `<div class="modal-layer" role="presentation"><div class="modal-scrim" data-action="close-modal"></div><section class="modal-card" role="dialog" aria-modal="true" aria-label="${this.modal==='settings'?'Configurações':this.modal==='records'?'Recordes':this.modal==='bestiary'?'Registro de infectados':this.modal==='story'?'História':this.modal==='arsenal'?'Arsenal':this.modal==='characters'?'Personagem':this.modal==='controls'?'Controles':'Sobre o projeto'}"><button class="modal-close" data-action="close-modal" aria-label="Fechar janela">${icon('close')}</button>${content}<button class="modal-done" data-action="close-modal">CONCLUÍDO ${icon('arrow',16)}</button></section></div>`;
  }
  destroy(){this.root.removeEventListener('click',this.boundClick);this.root.removeEventListener('input',this.boundInput);}
}

