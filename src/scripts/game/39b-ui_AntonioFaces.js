// -- src/ui/AntonioFaces.js --
// ATLAS A11 · Afrodite — rosto do Antônio reagindo ao jogo (arte do usuário, 6 expressões).
// Painel de vida: retrato pequeno que muda com a situação. Caixa de fala: o rosto ao lado da frase.
const PZ_FACES={
  neutro:'@@ASSET:assets/images/game/rostos/antonio-neutro.webp@@',foco:'@@ASSET:assets/images/game/rostos/antonio-foco.webp@@',
  raiva:'@@ASSET:assets/images/game/rostos/antonio-raiva.webp@@',medo:'@@ASSET:assets/images/game/rostos/antonio-medo.webp@@',
  dor:'@@ASSET:assets/images/game/rostos/antonio-dor.webp@@',grito:'@@ASSET:assets/images/game/rostos/antonio-grito.webp@@',
};
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
function pzFaceImg(el,key){if(el.dataset.face===key)return;el.dataset.face=key;el.src=PZ_FACES[key];}
const _pzUpdateHUD=UIManager.prototype.updateHUD;
UIManager.prototype.updateHUD=function(run){
  _pzUpdateHUD.call(this,run);
  if(!run||!this.root)return;
  const isAntonio=(run.player.charId||'antonio')==='antonio';
  const panel=this.root.querySelector('.hud-health');
  if(panel){let img=panel.querySelector('.pz-hud-face');
    if(!img&&isAntonio){img=document.createElement('img');img.className='pz-hud-face';img.alt='';img.decoding='async';panel.prepend(img);panel.classList.add('has-face');}
    if(img){img.hidden=!isAntonio;if(isAntonio){const k=pzFaceFor(run);pzFaceImg(img,k);img.dataset.mood=k;}}}
  const cap=this.root.querySelector('[data-antonio-caption]');
  if(cap){let img=cap.querySelector('.pz-cap-face');
    if(!img){img=document.createElement('img');img.className='pz-cap-face';img.alt='';img.decoding='async';cap.prepend(img);}
    const line=run.dialogue?.active;img.hidden=!isAntonio||!line;
    if(line&&isAntonio)pzFaceImg(img,PZ_LINE_FACE[line.id]||pzFaceFor(run));}
};
