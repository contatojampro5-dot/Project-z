// -- src/core/Survivors.js --
// ATLAS A4 · Atena + Ares — Hadassa, San e Hanna jogáveis, com as habilidades descritas na seleção.
// Atributos: VIDA e VELOCIDADE da ficha são porcentagens sobre o Antônio (100/100).

const SURVIVOR_KITS=Object.freeze({
  antonio:{cooldown:20,icon:'⚡',label:'ACELERAR',title:'Aceleração +40% por 10 segundos'},
  hadassa:{cooldown:60,icon:'✚',label:'SOBREVIDA',title:'Sobrevida: vida máxima +20% por 10 segundos'},
  san:{cooldown:20,icon:'✊',label:'PUNHOS',title:'Punhos de Ferro: socos 4× mais fortes por 5 segundos'},
  hanna:{cooldown:30,icon:'◎',label:'MINA',title:'Minas Improvisadas: até 5 minas por lote'},
});
const SAN_PUNCH={interval:1.2,base:16,reach:24};
const HANNA_MINE={perBatch:5,arm:1.5,trigger:30,radius:74,damage:72,chain:.25,chainReach:90};
const pzCharOf=run=>run?.player?.charId||'antonio';

// Chamado ao iniciar a partida: aplica vida e velocidade da ficha e prepara a habilidade.
function pzSurvivorSetup(scene){
  const r=scene.run,g=scene.game;if(!r)return;
  const id=g.save.settings.selectedCharacter||'antonio';
  const ch=CRONOS_CHARACTERS.find(c=>c.id===id)||CRONOS_CHARACTERS[0];
  const p=r.player;p.charId=ch.id;p.charTint=ch.tint;p.speedMul=(ch.speed||100)/100;
  if(ch.hp&&ch.hp!==100){const k=ch.hp/100;p.maxHp=Math.round(p.maxHp*k);p.hp=p.maxHp;p.shieldUnit=p.maxHp*.25;p.maxShield=p.shieldUnit*p.armorTier;p.shield=Math.min(p.shield,p.maxShield);}
  p.lastHurtAt=0;p.punchClock=SAN_PUNCH.interval;p.minesLeft=HANNA_MINE.perBatch;
  r.mines=[];r.punchFX=null;
  // As falas atuais são do Antônio; os outros sobreviventes ficam em silêncio até terem as próprias (A6).
  if(ch.id!=='antonio'&&r.dialogue){r.dialogue.request=()=>false;}
}

function pzSpecialCooldown(p){return SURVIVOR_KITS[p.charId||'antonio']?.cooldown??20;}

// Ativação (Espaço / botão de habilidade).
function pzActivateSpecial(scene){
  const r=scene.run,p=r.player,id=pzCharOf(r);
  if(id==='hanna'){
    if(p.specialCooldown>0||p.minesLeft<=0)return false;
    r.mines.push({x:p.x,y:p.y+6,arm:HANNA_MINE.arm,fuse:-1,blink:0});
    if(r.mines.length>12)r.mines.shift();
    p.minesLeft--;scene.game.audio.effect('pickup');
    scene.notify(`HANNA · MINA ${HANNA_MINE.perBatch-p.minesLeft}/${HANNA_MINE.perBatch} · ARMA EM 1,5 s`,1.2);
    if(p.minesLeft<=0)p.specialCooldown=SURVIVOR_KITS.hanna.cooldown;
    return true;
  }
  if(p.specialRemaining>0||p.specialCooldown>0)return false;
  if(id==='hadassa'){
    p.sobrevidaBase=p.maxHp;const ratio=p.hp/p.maxHp;
    p.maxHp=Math.round(p.maxHp*1.2);p.hp=Math.round(ratio*p.maxHp);
    p.specialRemaining=10;scene.notify('HADASSA · SOBREVIDA · VIDA MÁXIMA +20% / 10 s',1.8);
  }else if(id==='san'){
    p.specialRemaining=5;p.punchClock=Math.min(p.punchClock,.15);scene.notify('SAN · PUNHOS DE FERRO · SOCOS 4× / 5 s',1.8);
  }else{
    p.specialRemaining=10;scene.notify('ANTÔNIO · ACELERAÇÃO +40% / 10s',1.7);
  }
  return true;
}

// Fim da habilidade ativa (antes de entrar em recarga).
function pzSpecialEnded(p){
  if(p.charId==='hadassa'&&p.sobrevidaBase){
    const ratio=p.hp/p.maxHp;p.maxHp=p.sobrevidaBase;p.hp=Math.max(1,Math.round(ratio*p.maxHp));p.sobrevidaBase=0;
  }
}

// Passivas e efeitos contínuos, a cada passo da simulação.
function pzSurvivorUpdate(scene,dt){
  const r=scene.run;if(!r||dt<=0)return;
  const p=r.player,id=pzCharOf(r);if(!p.alive)return;
  if(id==='hanna'&&p.minesLeft<=0&&p.specialCooldown<=0)p.minesLeft=HANNA_MINE.perBatch; // lote recarregado
  if(id==='hadassa'){
    // Regeneração: depois de 40 s sem dano, recupera a vida toda em 10 s.
    if(r.elapsed-(p.lastHurtAt||0)>40&&p.hp<p.maxHp){p.heal(p.maxHp/10*dt);p.regenGlow=.3;}
    p.regenGlow=Math.max(0,(p.regenGlow||0)-dt);
  }
  if(id==='san'){
    p.punchClock-=dt;
    if(p.punchClock<=0){
      let best=null,bd=1e9;
      for(const e of r.spatial?.query(p.x,p.y,90)||r.enemies){
        if(!e.alive)continue;const d=Math.hypot(e.x-p.x,e.y-p.y)-e.radius-p.radius;
        if(d<SAN_PUNCH.reach&&d<bd){bd=d;best=e;}
      }
      if(best){
        const dx=best.x-p.x,dy=best.y-p.y,len=Math.hypot(dx,dy)||1,mult=p.specialRemaining>0?4:2;
        const died=best.hit(SAN_PUNCH.base*mult,{dx:dx/len,dy:dy/len,zone:'torso'});
        if(best.alive&&!best.isBoss){best.hitVX=(best.hitVX||0)+dx/len*260;best.hitVY=(best.hitVY||0)+dy/len*260;} // empurrão maior
        r.effects.emitBlood(best.x,best.y,dx/len,dy/len,died);r.effects.emit(best.x,best.y,died?'kill':'hit',died?4:2);
        scene.game.audio.effect(died?'kill':'hit');scene.game.audio.body?.('pistol');
        r.punchFX={a:Math.atan2(dy,dx),t:.18,strong:mult===4};p.facing=Math.atan2(dy,dx);
        scene.creditKill(best,died);
        p.punchClock=p.specialRemaining>0?SAN_PUNCH.interval*.6:SAN_PUNCH.interval;
      }else p.punchClock=.1;
    }
    if(r.punchFX)r.punchFX.t-=dt;
  }
  // Minas da Hanna: armam em 1,5 s, detonam por proximidade e em cadeia a cada 0,25 s.
  if(r.mines?.length){
    for(const m of r.mines){
      m.blink+=dt;
      if(m.arm>0){m.arm-=dt;continue;}
      if(m.fuse<0){
        for(const e of r.spatial?.query(m.x,m.y,60)||r.enemies){if(e.alive&&Math.hypot(e.x-m.x,e.y-m.y)<HANNA_MINE.trigger+e.radius){m.fuse=0;break;}}
      }
      if(m.fuse>=0){m.fuse-=dt;if(m.fuse<=0&&!m.done){
        m.done=true;scene.areaExplosion(m.x,m.y,HANNA_MINE.radius,HANNA_MINE.damage,{source:'mine',playerScale:0});
        for(const o of r.mines)if(!o.done&&o.fuse<0&&o.arm<=0&&Math.hypot(o.x-m.x,o.y-m.y)<HANNA_MINE.chainReach)o.fuse=HANNA_MINE.chain;
      }}
    }
    r.mines=r.mines.filter(m=>!m.done);
  }
}

// Desenho no mundo: anel de identidade, minas, soco, aura da Sobrevida e da regeneração.
function pzSurvivorDrawUnder(ctx,run){
  const p=run.player,id=pzCharOf(run);
  for(const m of run.mines||[]){
    const armed=m.arm<=0,on=armed?(Math.sin(m.blink*(m.fuse>=0?40:7))>0):(Math.sin(m.blink*16)>0);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(m.x+1,m.y+2,7,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a3f3a';ctx.beginPath();ctx.arc(m.x,m.y,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#596059';ctx.fillRect(m.x-5,m.y-1,10,2);
    ctx.fillStyle=on?(armed?'#ff4b55':'#f3c35c'):'#2a2020';ctx.fillRect(m.x-1.5,m.y-4,3,3);
    if(armed){ctx.strokeStyle='rgba(198,167,227,.18)';ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(m.x,m.y,HANNA_MINE.trigger,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  }
  if(id!=='antonio'&&p.alive){
    // anel na cor do sobrevivente: identifica o personagem até os sprites próprios (A5)
    ctx.strokeStyle=p.charTint||'#fff';ctx.globalAlpha=.75;ctx.lineWidth=1.6;
    ctx.beginPath();ctx.ellipse(p.x,p.y+13,12,5,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
}
function pzSurvivorDrawOver(ctx,run){
  const p=run.player,id=pzCharOf(run),t=performance.now()/1000;
  if(id==='hadassa'&&(p.specialRemaining>0||p.regenGlow>0)){
    const k=p.specialRemaining>0?1:.6,pulse=.5+.5*Math.sin(t*6);
    ctx.strokeStyle=`rgba(129,205,183,${(.35+.35*pulse)*k})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-2,18+pulse*2,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=`rgba(129,205,183,${.8*k})`;ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('+',p.x+12,p.y-18-((t*20)%10));
  }
  if(id==='san'&&run.punchFX&&run.punchFX.t>0){
    const f=run.punchFX,k=f.t/.18;
    ctx.strokeStyle=f.strong?`rgba(255,170,90,${k})`:`rgba(255,235,210,${k*.85})`;ctx.lineWidth=f.strong?4:2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.arc(p.x,p.y,22,f.a-.7,f.a+.7);ctx.stroke();
  }
  if(id==='san'&&p.specialRemaining>0){ctx.strokeStyle=`rgba(229,164,109,${.4+.3*Math.sin(t*10)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y-2,17,0,Math.PI*2);ctx.stroke();}
}

// Rótulo do botão de habilidade no HUD.
function pzSkillLabel(p){
  const id=p.charId||'antonio',kit=SURVIVOR_KITS[id];
  if(id==='hanna')return p.specialCooldown>0?`LOTE EM ${p.specialCooldown.toFixed(0)}s`:`MINAS ${p.minesLeft}/${HANNA_MINE.perBatch}`;
  return p.specialRemaining>0?`ATIVO ${p.specialRemaining.toFixed(0)}s`:p.specialCooldown>0?`AGUARDE ${p.specialCooldown.toFixed(0)}s`:kit.label;
}
