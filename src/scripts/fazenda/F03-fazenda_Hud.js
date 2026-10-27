// -- src/fazenda/Hud.js --
// R55 · painel do modo Fazenda (madeira, cercas, dica do que o E faz agora) e botões AÇÃO / CONSTRUIR no celular.
// O painel é um elemento próprio (.fz-hud) dentro do #app: o render() do UIManager não apaga.
function fzHudMount(scene){
  fzHudUnmount(scene);
  const app=document.querySelector('#app');if(!app)return;
  const el=document.createElement('div');el.className='fz-hud';el.setAttribute('aria-live','polite');
  el.innerHTML=`<div class="fz-hud-title">FAZENDA DO SEU JOÃO</div>
    <div class="fz-hud-phase" data-fz-phase></div>
    <div class="fz-hud-row"><span class="fz-ico fz-ico-tree" aria-hidden="true"></span><b data-fz-logs>0</b><small>ÁRVORES COLETADAS</small></div>
    <div class="fz-hud-row" data-fz-woodrow><span class="fz-ico fz-ico-wood" aria-hidden="true"></span><b data-fz-wood>0</b><small>MADEIRA</small></div>
    <div class="fz-hud-row"><span class="fz-ico fz-ico-fence" aria-hidden="true"></span><b data-fz-fences>0</b><small>CERCAS</small></div>
    <div class="fz-hud-row fz-hud-axe" data-fz-axe><span class="fz-ico fz-ico-axe" aria-hidden="true"></span><small data-fz-axetxt>SEM MACHADO</small></div>
    <div class="fz-hud-hint" data-fz-hint></div>`;
  app.appendChild(el);
  // barra de escolha da cerca (aparece no modo construção): clicar/tocar escolhe
  const bar=document.createElement('div');bar.className='fz-pick';
  bar.innerHTML=FZ_FENCE_TIERS.slice(1).map((T,i)=>`<button type="button" class="fz-pick-item" data-fz-tier="${i+1}"><kbd>${i+1}</kbd><span class="fz-pick-art fz-pick-t${i+1}" aria-hidden="true"></span><b>${T.name}</b><small>${fzPlaceCost(i+1)} MADEIRA · VIDA ${T.hp}</small></button>`).join('');
  bar.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-fz-tier]');if(!b)return;e.preventDefault();e.stopPropagation();const s=window.__projectZGame?.scenes?.current;if(s?.run?.fz)fzSelect(s,Number(b.dataset.fzTier));});
  app.appendChild(bar);
  const mk=(cls,label,icon,down,up)=>{const b=document.createElement('button');b.type='button';b.className='fz-touch '+cls;b.setAttribute('aria-label',label);
    b.innerHTML=`<strong>${icon}</strong><small>${label}</small>`;
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();down();});
    if(up)for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>up());
    app.appendChild(b);return b;};
  mk('fz-touch-act','AÇÃO','✋',()=>{FZ_HOLD.touch=true;window.__projectZGame?.scenes?.current?.interact?.();},()=>{FZ_HOLD.touch=false;});
  mk('fz-touch-build','CONSTRUIR','⌂',()=>window.__projectZGame?.scenes?.current?.toggleBuild?.());
}
function fzHudUnmount(){document.querySelectorAll('.fz-hud,.fz-touch,.fz-pick').forEach(e=>e.remove());}
function fzHint(run){
  const fz=run.fz,p=run.player;
  if(fzNearAxe(run))return 'E · PEGAR O MACHADO';
  const why=fzBuildBlock(run);
  if(fz.build){const g=fz.ghost;
    if(!g)return 'CONSTRUÇÃO';
    if(g.target){const t=g.target,n=FZ_FENCE_TIERS[t.tier+1];return n?`E · EVOLUIR PARA ${n.name} (${n.cost})`:t.hp<t.max?'E · CONSERTAR (1)':`${FZ_FENCE_TIERS[t.tier].name} · MÁXIMO`;}
    return g.reason?g.reason:`E · PÔR ${FZ_FENCE_TIERS[fz.sel].name} (${fzPlaceCost(fz.sel)}) · T SAI`;}
  if(fz.chop)return `CORTANDO… SEGURE O E (${Math.max(0,FZ_CHOP.hold-fz.chop.prog).toFixed(1)} s)`;
  if(why)return fz.axe?why:(fzBuildPhase(run)?'PEGUE O MACHADO NO CEPO DO LADO DA CASA':why);
  if(!fz.axe)return 'PEGUE O MACHADO NO CEPO DO LADO DA CASA';
  if(fzNearestTree(p,p.radius+FZ_CHOP.reach))return 'SEGURE E POR 3 s · CORTAR ÁRVORE';
  const R=p.radius+26;if(fzFencesNear(p.x-R,p.y-R,p.x+R,p.y+R).some(f=>f.hp<f.max))return 'E · CONSERTAR CERCA (1)';
  return 'T · CONSTRUIR CERCA';
}
function fzHudUpdate(scene,dt){
  const r=scene.run,fz=r.fz;fz.hintT-=dt;if(fz.hintT>0)return;fz.hintT=.15;
  const el=document.querySelector('.fz-hud');if(!el){fzHudMount(scene);return;}
  const set=(s,v)=>{const n=el.querySelector(s);if(n&&n.textContent!==String(v))n.textContent=v;};
  const w=r.waves,mm=formatTime(Math.ceil(w.remaining));
  set('[data-fz-phase]',fzBuildPhase(r)?`CONSTRUÇÃO · ${mm} ATÉ A ONDA ${String(w.wave+1).padStart(2,'0')}`:`ONDA ${String(w.wave).padStart(2,'0')} · CONSTRUÇÃO EM ${mm}`);
  set('[data-fz-logs]',fz.logs);set('[data-fz-wood]',fz.wood);set('[data-fz-fences]',fz.fences.length);set('[data-fz-hint]',fzHint(r));
  set('[data-fz-axetxt]',fz.axe?'MACHADO NA MÃO':'SEM MACHADO');
  el.querySelector('[data-fz-axe]')?.classList.toggle('is-on',fz.axe);
  el.querySelector('[data-fz-woodrow]')?.classList.toggle('is-flash',(fz.woodFlash||0)>0);
  el.classList.toggle('is-building',fz.build);el.classList.toggle('is-wave',!fzBuildPhase(r));
  const bar=document.querySelector('.fz-pick');
  if(bar){bar.classList.toggle('is-on',fz.build);
    for(const b of bar.querySelectorAll('[data-fz-tier]')){const n=Number(b.dataset.fzTier);b.classList.toggle('is-sel',n===fz.sel);b.classList.toggle('is-poor',fz.wood<fzPlaceCost(n));}}
  const g=scene.game,hide=!!(g.previewPaused||g.ui?.modal||r.discovery.selecting||r.progress.selecting||r.backpackOpen);
  for(const n of document.querySelectorAll('.fz-hud,.fz-touch,.fz-pick'))n.classList.toggle('fz-hidden',hide);
  document.querySelector('.fz-touch-build')?.classList.toggle('is-on',fz.build);
}
// pausa: o laço para, então o painel some aqui
{const _pp=Game.prototype.pausePreview,_rp=Game.prototype.resumePreview;
 const vis=on=>{for(const n of document.querySelectorAll('.fz-hud,.fz-touch,.fz-pick'))n.classList.toggle('fz-hidden',!on);};
 Game.prototype.pausePreview=function(...a){const out=_pp.apply(this,a);if(this.previewPaused)vis(false);return out;};
 Game.prototype.resumePreview=function(...a){const out=_rp.apply(this,a);vis(true);return out;};}
