// -- src/fazenda/Hud.js --
// R55 · painel do modo Fazenda (madeira, cercas, dica do que o E faz agora) e botões AÇÃO / CONSTRUIR no celular.
// O painel é um elemento próprio (.fz-hud) dentro do #app: o render() do UIManager não apaga.
function fzHudMount(scene){
  fzHudUnmount(scene);
  const app=document.querySelector('#app');if(!app)return;
  const el=document.createElement('div');el.className='fz-hud';el.setAttribute('aria-live','polite');
  el.innerHTML=`<div class="fz-hud-title">FAZENDA DO SEU JOÃO</div>
    <div class="fz-hud-row"><span class="fz-ico fz-ico-wood" aria-hidden="true"></span><b data-fz-wood>0</b><small>MADEIRA</small></div>
    <div class="fz-hud-row"><span class="fz-ico fz-ico-fence" aria-hidden="true"></span><b data-fz-fences>0</b><small>CERCAS</small></div>
    <div class="fz-hud-hint" data-fz-hint></div>`;
  app.appendChild(el);
  const mk=(cls,label,icon,fn)=>{const b=document.createElement('button');b.type='button';b.className='fz-touch '+cls;b.setAttribute('aria-label',label);
    b.innerHTML=`<strong>${icon}</strong><small>${label}</small>`;
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();fn();});app.appendChild(b);return b;};
  mk('fz-touch-act','AÇÃO','✋',()=>window.__projectZGame?.scenes?.current?.interact?.());
  mk('fz-touch-build','CONSTRUIR','⌂',()=>window.__projectZGame?.scenes?.current?.toggleBuild?.());
}
function fzHudUnmount(){document.querySelectorAll('.fz-hud,.fz-touch').forEach(e=>e.remove());}
function fzHint(run){
  const fz=run.fz,p=run.player;
  if(fz.build){const g=fz.ghost;
    if(!g)return 'CONSTRUÇÃO';
    if(g.target){const t=g.target,n=FZ_FENCE_TIERS[t.tier+1];return n?`E · EVOLUIR PARA ${n.name} (${n.cost})`:t.hp<t.max?'E · CONSERTAR (1)':`${FZ_FENCE_TIERS[t.tier].name} · MÁXIMO`;}
    return g.reason?g.reason:`E · PÔR ${FZ_FENCE_TIERS[1].name} (${FZ_FENCE_TIERS[1].cost}) · T SAI`;}
  if(fz.chop)return `CORTANDO… ${Math.max(0,fz.chop.t.fzHp)} GOLPES`;
  if(fzNearestTree(p,p.radius+FZ_CHOP.reach))return 'E · CORTAR ÁRVORE';
  const R=p.radius+26;if(fzFencesNear(p.x-R,p.y-R,p.x+R,p.y+R).some(f=>f.hp<f.max))return 'E · CONSERTAR CERCA (1)';
  return 'T · CONSTRUIR CERCA';
}
function fzHudUpdate(scene,dt){
  const r=scene.run,fz=r.fz;fz.hintT-=dt;if(fz.hintT>0)return;fz.hintT=.15;
  const el=document.querySelector('.fz-hud');if(!el){fzHudMount(scene);return;}
  const set=(s,v)=>{const n=el.querySelector(s);if(n&&n.textContent!==String(v))n.textContent=v;};
  set('[data-fz-wood]',fz.wood);set('[data-fz-fences]',fz.fences.length);set('[data-fz-hint]',fzHint(r));
  el.classList.toggle('is-building',fz.build);
  const g=scene.game,hide=!!(g.previewPaused||g.ui?.modal||r.discovery.selecting||r.progress.selecting||r.backpackOpen);
  for(const n of document.querySelectorAll('.fz-hud,.fz-touch'))n.classList.toggle('fz-hidden',hide);
  document.querySelector('.fz-touch-build')?.classList.toggle('is-on',fz.build);
}
// pausa: o laço para, então o painel some aqui
{const _pp=Game.prototype.pausePreview,_rp=Game.prototype.resumePreview;
 const vis=on=>{for(const n of document.querySelectorAll('.fz-hud,.fz-touch'))n.classList.toggle('fz-hidden',!on);};
 Game.prototype.pausePreview=function(...a){const out=_pp.apply(this,a);if(this.previewPaused)vis(false);return out;};
 Game.prototype.resumePreview=function(...a){const out=_rp.apply(this,a);vis(true);return out;};}
