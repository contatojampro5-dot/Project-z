// -- src/ui/AntonioFaces.js --
// ATLAS A11/A12 · Afrodite — rosto dos sobreviventes reagindo ao jogo (arte do usuário, 6 expressões).
// Painel de vida: retrato pequeno que muda com a situação. Caixa de fala: o rosto ao lado da frase.
const PZ_FACES={antonio:{neutro:'@@ASSET:assets/images/game/rostos/antonio-neutro.webp@@',foco:'@@ASSET:assets/images/game/rostos/antonio-foco.webp@@',raiva:'@@ASSET:assets/images/game/rostos/antonio-raiva.webp@@',medo:'@@ASSET:assets/images/game/rostos/antonio-medo.webp@@',dor:'@@ASSET:assets/images/game/rostos/antonio-dor.webp@@',grito:'@@ASSET:assets/images/game/rostos/antonio-grito.webp@@'},hadassa:{neutro:'@@ASSET:assets/images/game/rostos/hadassa-neutro.webp@@',foco:'@@ASSET:assets/images/game/rostos/hadassa-foco.webp@@',raiva:'@@ASSET:assets/images/game/rostos/hadassa-raiva.webp@@',medo:'@@ASSET:assets/images/game/rostos/hadassa-medo.webp@@',dor:'@@ASSET:assets/images/game/rostos/hadassa-dor.webp@@',grito:'@@ASSET:assets/images/game/rostos/hadassa-grito.webp@@'},san:{neutro:'@@ASSET:assets/images/game/rostos/san-neutro.webp@@',foco:'@@ASSET:assets/images/game/rostos/san-foco.webp@@',raiva:'@@ASSET:assets/images/game/rostos/san-raiva.webp@@',medo:'@@ASSET:assets/images/game/rostos/san-medo.webp@@',dor:'@@ASSET:assets/images/game/rostos/san-dor.webp@@',grito:'@@ASSET:assets/images/game/rostos/san-grito.webp@@'},hanna:{neutro:'@@ASSET:assets/images/game/rostos/hanna-neutro.webp@@',foco:'@@ASSET:assets/images/game/rostos/hanna-foco.webp@@',raiva:'@@ASSET:assets/images/game/rostos/hanna-raiva.webp@@',medo:'@@ASSET:assets/images/game/rostos/hanna-medo.webp@@',dor:'@@ASSET:assets/images/game/rostos/hanna-dor.webp@@',grito:'@@ASSET:assets/images/game/rostos/hanna-grito.webp@@'}};
// falas com expressão própria (id da fala → rosto)
const PZ_LINE_FACE={3:'dor',45:'dor',51:'medo',37:'raiva',40:'foco'};
const PZ_FACE_STATE={hp:null,hurtT:0,lastT:0,shoutT:0,wasSpecial:false};
function pzFaceFor(run){
  const p=run.player,now=performance.now()/1000,S=PZ_FACE_STATE,dt=Math.min(.5,now-(S.lastT||now));S.lastT=now;
  if(S.hp!=null&&p.hp<S.hp-.01)S.hurtT=.9;S.hp=p.hp;S.hurtT=Math.max(0,S.hurtT-dt);
  const sp=(p.specialRemaining||0)>0;if(sp&&!S.wasSpecial)S.shoutT=1.4;S.wasSpecial=sp;S.shoutT=Math.max(0,S.shoutT-dt);
  if(!p.alive||run.over)return'dor';
  if(S.shoutT>0)return'grito';
  if(S.hurtT>0||p.hp/p.maxHp<.25)return'dor';
  let near=0;for(const e of run.enemies){if(e.alive&&Math.hypot(e.x-p.x,e.y-p.y)<130)near++;}
  const boss=run.boss?.alive&&Math.hypot(run.boss.x-p.x,run.boss.y-p.y)<420;
  if(boss||near>=7)return'medo';
  if(near>=3)return'raiva';
  if((run.gun?.flashes||[]).length)return'foco';
  return'neutro';
}
function pzFaceImg(el,key,ch){const id=ch+'/'+key;if(el.dataset.face===id)return;el.dataset.face=id;el.src=(PZ_FACES[ch]||PZ_FACES.antonio)[key];}
const _pzUpdateHUD=UIManager.prototype.updateHUD;
UIManager.prototype.updateHUD=function(run){
  _pzUpdateHUD.call(this,run);
  if(!run||!this.root)return;
  const ch=run.player.charId||'antonio',isAntonio=!!PZ_FACES[ch];
  const panel=this.root.querySelector('.hud-health');
  if(panel){let img=panel.querySelector('.pz-hud-face');
    if(!img&&isAntonio){img=document.createElement('img');img.className='pz-hud-face';img.alt='';img.decoding='async';panel.prepend(img);panel.classList.add('has-face');}
    if(img){img.hidden=!isAntonio;if(isAntonio){const k=pzFaceFor(run);pzFaceImg(img,k,ch);img.dataset.mood=k;}}}
  const cap=this.root.querySelector('[data-antonio-caption]');
  if(cap){let img=cap.querySelector('.pz-cap-face');
    if(!img){img=document.createElement('img');img.className='pz-cap-face';img.alt='';img.decoding='async';cap.prepend(img);}
    const line=run.dialogue?.active;img.hidden=!isAntonio||!line;
    if(line&&isAntonio)pzFaceImg(img,PZ_LINE_FACE[line.id]||pzFaceFor(run),ch);}
};
// A12: botão da habilidade logo abaixo do painel de vida, alinhado à direita dele (pedido do jogador).
const _pzUpdateHUD2=UIManager.prototype.updateHUD;
UIManager.prototype.updateHUD=function(run){
  _pzUpdateHUD2.call(this,run);
  const btn=this.root?.querySelector('.pz-skill-button'),hp=this.root?.querySelector('.combat-hud .hud-health');
  if(!btn||!hp)return;const r=hp.getBoundingClientRect();if(!r.width)return;
  const app=document.getElementById('app').getBoundingClientRect();
  let bottom=r.bottom;const stats=this.root.querySelector('.hud-combat-stats');if(stats){const q=stats.getBoundingClientRect();if(q.width&&q.top>=r.bottom-4&&q.top<r.bottom+30&&q.left<r.right&&q.right>r.left)bottom=q.bottom;}
  const top=Math.round(bottom-app.top+8),left=Math.round(r.right-app.left-btn.offsetWidth);
  if(btn.dataset.pos!==top+','+left){btn.dataset.pos=top+','+left;btn.classList.add('pz-skill-under-hp');btn.style.setProperty('--pz-sk-top',top+'px');btn.style.setProperty('--pz-sk-left',left+'px');}
};
