// -- src/entities/BossSprites.js --
// ATLAS A5.4 · O Colosso e A Colmeia com as folhas do laboratório.
// Estados do chefe → animações: chase=avançar, telegraph=preparar (acompanha o aviso do jogo),
// dash=investida (Colosso), golpe de contato=esmagar (Colosso), fim do aviso=liberar enxame (Colmeia).
const PZ_BOSS_SPRITES=Object.freeze({
  colossus:{key:'infChefeColosso_',cell:{w:150,h:165,ground:149,cx:75},foot:44,
    anims:{idle:{row:0,frames:8},walk:{row:0,frames:8},attack:{row:0,frames:6,fps:12},death:{row:0,frames:12,fps:9},telegraph:{row:0,frames:8},slam:{row:0,frames:8,fps:10}}},
  hive:{key:'infChefeColmeia_',cell:{w:160,h:170,ground:150,cx:80},foot:44,
    anims:{idle:{row:0,frames:8},walk:{row:0,frames:8},attack:{row:0,frames:8,fps:10},death:{row:0,frames:12,fps:9},telegraph:{row:0,frames:8}}},
});
const PZ_BOSS_FX={dead:[]};

function pzBossBlit(ctx,assets,spec,anim,frame,dir,x,y,alpha=1){
  const img=assets.get(spec.key+anim);if(!img||!img.width)return false;
  const c=spec.cell,a=spec.anims[anim];const row=a.row+Math.min(a.frames-1,Math.max(0,frame|0));
  if(alpha<1)ctx.globalAlpha=alpha;
  ctx.drawImage(img,dir*c.w,row*c.h,c.w,c.h,Math.round(x-c.cx),Math.round(y+spec.foot-c.ground),c.w,c.h);
  if(alpha<1)ctx.globalAlpha=1;return true;
}

const _pzBossDraw=Boss.prototype.draw;
Boss.prototype.draw=function(ctx,assets){
  const spec=PZ_BOSS_SPRITES[this.kind],img=spec&&assets&&assets.get(spec.key+'walk');
  if(!img||!img.width)return _pzBossDraw.call(this,ctx,assets);
  const now=performance.now(),TAU=Math.PI*2;
  // transições de estado viram "gatilhos" de animação
  if(this._pzPrev==='telegraph'&&this.state!=='telegraph'&&this.kind==='hive')this._pzCast=now;
  this._pzPrev=this.state;
  let anim='walk',frame=Math.floor(this.stride/TAU*8)%8;
  if(this.state==='telegraph'){anim='telegraph';const dur=this.kind==='colossus'?1.2:1.1;frame=Math.floor((1-Math.max(0,this.warning)/dur)*8);}
  else if(this.state==='dash'){anim='attack';frame=Math.floor(now/1000*12)%6;}
  else if(this.kind==='hive'&&this._pzCast&&now-this._pzCast<800){anim='attack';frame=Math.floor((now-this._pzCast)/1000*10);}
  else if(this.kind==='colossus'&&this._pzSlam&&now-this._pzSlam<800){anim='slam';frame=Math.floor((now-this._pzSlam)/1000*10);}
  else if(this.state==='recover'){anim='idle';frame=Math.floor(now/1000*6)%8;}
  const dir=pzDir8(this.heading);
  ctx.save();ctx.translate(Math.round(this.x),Math.round(this.y));
  for(const mark of this.dashTrail){ctx.globalAlpha=mark.life*.35;ctx.fillStyle='#f4a773';ctx.beginPath();ctx.ellipse(mark.x-this.x,mark.y-this.y+18,26,10,0,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;
  if(this.state==='telegraph'){
    ctx.strokeStyle=this.kind==='colossus'?'#ff9e68':'#e0b0ff';ctx.lineWidth=4;ctx.globalAlpha=.65+Math.sin(this.warning*26)*.22;
    if(this.kind==='colossus'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(this.direction.x*270,this.direction.y*270);ctx.stroke();
      ctx.setLineDash([9,7]);ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,48,0,TAU);ctx.stroke();ctx.setLineDash([]);}
    else{ctx.beginPath();ctx.arc(0,0,116,0,TAU);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  ctx.restore();
  ctx.save();
  if(this.flinch>0)ctx.filter='brightness(1.6)';
  if(this.state==='dash'){ctx.shadowColor='#ffbd7d';ctx.shadowBlur=22;}
  if(!pzBossBlit(ctx,assets,spec,anim,frame,dir,this.x,this.y))pzBossBlit(ctx,assets,spec,'walk',0,dir,this.x,this.y);
  ctx.restore();
  if(this.slamPulse>0){ctx.save();ctx.strokeStyle='#d0a3fc';ctx.lineWidth=3;ctx.globalAlpha=this.slamPulse/.45;ctx.beginPath();ctx.arc(this.x,this.y,110*(1-this.slamPulse/.45),0,TAU);ctx.stroke();ctx.restore();}
};

// golpe de contato do Colosso vira "esmagar"; morte guarda o corpo caindo
const _pzBossUpdate=Boss.prototype.update;
Boss.prototype.update=function(dt,player,others,context){
  const dmg=_pzBossUpdate.call(this,dt,player,others,context);
  if(dmg>0&&this.kind==='colossus'&&this.state==='chase')this._pzSlam=performance.now();
  return dmg;
};
const _pzBossHit=Boss.prototype.hit;
Boss.prototype.hit=function(damage){
  const was=this.alive;const died=_pzBossHit.call(this,damage);
  if(was&&!this.alive&&PZ_BOSS_SPRITES[this.kind])PZ_BOSS_FX.dead.push({kind:this.kind,x:this.x,y:this.y,dir:pzDir8(this.heading),t:0,life:14});
  return died;
};
const _pzFxUpdateB=CombatEffects.prototype.update;
CombatEffects.prototype.update=function(dt){_pzFxUpdateB.call(this,dt);const L=PZ_BOSS_FX.dead;let n=0;for(const d of L){d.t+=dt;if(d.t<d.life)L[n++]=d;}L.length=n;};
const _pzFxDrawUnderB=CombatEffects.prototype.drawUnder;
CombatEffects.prototype.drawUnder=function(ctx){
  _pzFxDrawUnderB.call(this,ctx);const assets=window.__PZ_ASSETS__;if(!assets)return;
  for(const d of PZ_BOSS_FX.dead){const spec=PZ_BOSS_SPRITES[d.kind];
    const a=spec.anims.death;pzBossBlit(ctx,assets,spec,'death',Math.floor(d.t*(a.fps||9)),d.dir,d.x,d.y,Math.min(1,(d.life-d.t)/2));}
};
function pzResetBossFx(){PZ_BOSS_FX.dead.length=0;}
