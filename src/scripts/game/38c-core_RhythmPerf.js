// -- src/core/RhythmPerf.js --
// CRONOS C6 · Hefesto + Ares + Atena — ritmo e desempenho.

// 1) Pós-processamento composto pela placa de vídeo (camadas CSS sobre o canvas), em vez de
//    pintar a tela inteira várias vezes com modos de mistura no canvas.
class PzPost {
  constructor(){this.el=null;this.last='';this.t=0;}
  ensure(){
    if(this.el&&this.el.isConnected)return true;
    const canvas=document.getElementById('game-canvas');if(!canvas)return false;
    const el=document.createElement('div');el.className='pz-post';el.setAttribute('aria-hidden','true');
    el.innerHTML='<i class="pz-post-grade"></i><i class="pz-post-vignette"></i><i class="pz-post-grain"></i>';
    canvas.after(el);this.el=el;
    // textura de granulação gerada uma vez
    const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d'),img=x.createImageData(160,160);
    for(let i=0;i<img.data.length;i+=4){const n=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=n;img.data[i+3]=255;}
    x.putImageData(img,0,0);el.style.setProperty('--pz-grain',`url(${c.toDataURL()})`);
    return true;
  }
  update(env,quality,reduced){
    if(!this.ensure())return;
    const golden=env.golden||0,dark=env.dark||0,dawn=env.phase==='dawn'?1-Math.abs(.5-dark)*2:0;
    // mistura das tintas do período: dourado quente, noite azulada, amanhecer rosado
    let r=0,g=0,b=0,a=0;
    const add=(cr,cg,cb,w)=>{r+=cr*w;g+=cg*w;b+=cb*w;a+=w;};
    add(255,168,92,.30*golden);add(46,82,160,.34*dark);add(255,140,160,.18*dawn);
    // Atlas A1: tinta em mistura normal (barata); a intensidade equivale à do soft-light anterior.
    const tint=a>.001?`rgba(${Math.round(r/a)},${Math.round(g/a)},${Math.round(b/a)},${Math.min(.2,a*.4).toFixed(3)})`:'transparent';
    const key=`${tint}|${dark.toFixed(2)}|${quality}|${reduced}`;
    if(key===this.last)return;this.last=key;
    this.el.style.setProperty('--pz-tint',tint);
    this.el.style.setProperty('--pz-vig',(.28+.22*dark).toFixed(3));
    this.el.classList.toggle('grain-on',quality==='high'); // grão estático, só na qualidade alta
  }
}
const PZ_POST=new PzPost();

// 2) Qualidade automática: mede o tempo real de quadro e reduz a qualidade, um degrau por vez,
//    até o jogo ficar fluido. Nunca sobe sozinha (evita oscilar). Desliga se o jogador mexer à mão.
class PzAutoQuality {
  constructor(){this.samples=[];this.last=0;this.warm=0;this.cooldown=0;}
  reset(){this.samples=[];this.last=0;this.warm=0;this.cooldown=0;}
  frame(game,scene){
    const s=game.save.settings;if(s.autoQuality===false||window.__pzDiagRunning)return;
    const now=performance.now();
    if(this.last){const dt=now-this.last;if(dt<250)this.samples.push(dt);}
    this.last=now;
    if(game.previewPaused||game.ui?.modal||document.hidden){this.samples.length=0;return;}
    this.warm+=1;if(this.warm<240)return;          // ~4 s para estabilizar
    if(this.samples.length<150)return;              // janela de ~2,5 s
    const sorted=this.samples.slice().sort((a,b)=>a-b),median=sorted.at(Math.floor(sorted.length/2));
    this.samples.length=0;
    if(this.cooldown>now)return;
    if(median<=22)return;                            // ≥ ~45 fps: está bom
    const order=['lightingQuality','weatherQuality','particlesQuality','shadowsQuality'];
    const down={high:'medium',medium:'low'};
    // primeiro tudo de alta para média; só depois de média para baixa
    const pick=order.find(k=>graphicLevel(s[k])==='high')||order.find(k=>graphicLevel(s[k])==='medium');
    for(const key of pick?[pick]:[]){
      const cur=graphicLevel(s[key]);
      if(down[cur]){
        game.applySettings({[key]:down[cur]},false,false);
        const names={lightingQuality:'LUZ',weatherQuality:'CLIMA',particlesQuality:'PARTÍCULAS',shadowsQuality:'SOMBRAS'};
        scene?.notify?.(`QUALIDADE AUTOMÁTICA · ${names[key]} ${down[cur]==='low'?'BAIXA':'MÉDIA'}`,2.2);
        this.cooldown=now+4000;return;
      }
    }
  }
}
const PZ_AUTO_QUALITY=new PzAutoQuality();

// 3) Avisos de ataque (Ares): todo ataque inimigo fica previsível para quem presta atenção.
function pzDrawTelegraphs(ctx,run){
  const p=run.player,t=performance.now()/1000;
  ctx.save();
  for(const e of run.enemies){
    if(!e.alive)continue;
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
    if(d>420)continue;
    if(e.isBoss){
      // fases visuais do chefe: aura vermelha abaixo de 50% e mais intensa abaixo de 25%
      const k=e.hp/(e.maxHp||e.template?.hp||e.hp||1);
      if(k<.5){
        const strong=k<.25,pulse=.5+.5*Math.sin(t*(strong?9:5));
        const R=e.radius*(1.35+.12*pulse);
        const g=ctx.createRadialGradient(e.x,e.y,e.radius*.6,e.x,e.y,R*1.4);
        g.addColorStop(0,`rgba(255,60,70,${(strong?.32:.18)*(.6+.4*pulse)})`);g.addColorStop(1,'rgba(255,60,70,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,R*1.4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=`rgba(255,90,95,${.35+.4*pulse})`;ctx.lineWidth=strong?2.5:1.5;ctx.setLineDash(strong?[]:[6,5]);
        ctx.beginPath();ctx.arc(e.x,e.y,R,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      }
      continue;
    }
    if(e.kind==='bomber'&&e.fuse>=0){
      // mostra o raio real da explosão enquanto o pavio queima
      const pulse=.5+.5*Math.sin(t*22);
      ctx.strokeStyle=`rgba(255,80,70,${.45+.4*pulse})`;ctx.lineWidth=2;ctx.setLineDash([7,6]);
      ctx.beginPath();ctx.arc(e.x,e.y,82,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=`rgba(255,70,60,${.07+.06*pulse})`;ctx.beginPath();ctx.arc(e.x,e.y,82,0,Math.PI*2);ctx.fill();
      continue;
    }
    if(e.kind==='spitter'){
      if(d<345&&d>78&&e.attackCooldown<.5){
        const k=1-e.attackCooldown/.5,ox=e.x+dx/d*(e.radius+3),oy=e.y+dy/d*(e.radius+3);
        ctx.fillStyle=`rgba(201,156,255,${.35+.55*k})`;ctx.beginPath();ctx.arc(ox,oy,2+k*4,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=`rgba(201,156,255,${.25*k})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+dx/d*60*k,oy+dy/d*60*k);ctx.stroke();
      }
      continue;
    }
    if(e.kind==='summoner'||e.kind==='midnight')continue;
    // corpo a corpo: arco vermelho na direção do jogador pouco antes do golpe
    const contact=e.radius+p.radius+2;
    if(d<contact+22&&e.attackCooldown<.35){
      const k=1-e.attackCooldown/.35,a=Math.atan2(dy,dx);
      ctx.strokeStyle=`rgba(255,77,85,${.25+.6*k})`;ctx.lineWidth=2+k*1.5;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(e.x,e.y,e.radius+4+k*3,a-.9,a+.9);ctx.stroke();
    }
  }
  ctx.restore();
}

// 4) Fumaça suave pré-renderizada (substitui os discos escuros): leve, clara e difusa.
const PZ_SMOKE_SPRITE=(()=>{const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');
  const g=x.createRadialGradient(48,48,0,48,48,48);
  g.addColorStop(0,'rgba(170,166,160,.55)');g.addColorStop(.35,'rgba(150,146,142,.32)');g.addColorStop(.7,'rgba(130,127,124,.10)');g.addColorStop(1,'rgba(120,118,116,0)');
  x.fillStyle=g;x.fillRect(0,0,96,96);return c;})();

// Atlas A1 · Hefesto — diagnóstico de desempenho (F9 na partida ou botão nas Configurações).
// Congela a simulação e mede o FPS de desenho com cada camada desligada, numa tabela.
window.__PZ_DIAG={post:true,light:true,fx:true,env:true,blur:true};
const PZ_DIAG_STEPS=[
  ['Tudo ligado',{}],
  ['Sem camadas de cor (pós)',{post:false}],
  ['Sem mapa de luz e lanterna',{light:false}],
  ['Sem efeitos do mundo (chuva, fumaça, poças)',{fx:false}],
  ['Sem ambiente (neblina, sol, postes)',{env:false}],
  ['Sem vidro desfocado na interface',{blur:false}],
  ['Tudo desligado',{post:false,light:false,fx:false,env:false,blur:false}],
  ['Tudo ligado (conferência)',{}],
];
async function pzRunDiagnostic(game){
  if(game.scenes.name!=='field'||!game.scenes.current?.run){alert('Abra uma partida e rode o diagnóstico (F9) durante o jogo.');return;}
  if(window.__pzDiagRunning)return;window.__pzDiagRunning=true;
  game.ui.showModal(null);
  const wasPaused=game.loop?.paused;game.loop?.setPaused(true);
  const app=document.getElementById('app');
  const measure=ms=>new Promise(res=>{const d=[];let last=0;const end=performance.now()+ms;
    function f(t){if(last)d.push(t-last);last=t;if(t<end)requestAnimationFrame(f);else{const avg=d.reduce((a,b)=>a+b,0)/Math.max(1,d.length);res(avg?1000/avg:0);}}requestAnimationFrame(f);});
  const results=[];
  await measure(1500); // aquecimento
  for(const [label,flags] of PZ_DIAG_STEPS){
    Object.assign(window.__PZ_DIAG,{post:true,light:true,fx:true,env:true,blur:true},flags);
    app?.classList.toggle('pz-diag-noblur',!window.__PZ_DIAG.blur);
    if(PZ_POST.el)PZ_POST.el.style.display=window.__PZ_DIAG.post?'':'none';
    await measure(900);results.push([label,await measure(2500)]);
  }
  Object.assign(window.__PZ_DIAG,{post:true,light:true,fx:true,env:true,blur:true});
  app?.classList.remove('pz-diag-noblur');if(PZ_POST.el)PZ_POST.el.style.display='';
  game.loop?.setPaused(!!wasPaused);window.__pzDiagRunning=false;
  const base=(results[0][1]+results.at(-1)[1])/2;
  const box=document.createElement('div');box.className='pz-diag';box.setAttribute('role','dialog');
  box.innerHTML=`<h3>DIAGNÓSTICO DE DESEMPENHO</h3><p>FPS de desenho com o jogo congelado, ${innerWidth}×${innerHeight}, escala ${devicePixelRatio}. Tire um print desta tela e mande para a Olimpo.</p>
    <table>${results.map(([l,f],i)=>`<tr><td>${l}</td><td class="${i&&f>base*1.08?'gain':''}">${f.toFixed(0)} FPS${i&&f>base*1.08?' (+'+Math.round(f-base)+')':''}</td></tr>`).join('')}</table>
    <p style="margin-top:10px">Qualidade: luz ${game.save.settings.lightingQuality} · clima ${game.save.settings.weatherQuality} · partículas ${game.save.settings.particlesQuality} · sombras ${game.save.settings.shadowsQuality} · automática ${game.save.settings.autoQuality===false?'desligada':'ligada'}</p>
    <button type="button">FECHAR</button>`;
  box.querySelector('button').onclick=()=>box.remove();
  document.body.appendChild(box);
}
