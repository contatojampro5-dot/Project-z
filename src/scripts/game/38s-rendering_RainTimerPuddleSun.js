// -- src/rendering/RainTimerPuddleSun.js --
// R41 · Hélio + Hermes
// 1) Timer da chuva: um selo abaixo do botão CLIMA diz quanto falta para começar a chover ou para a chuva parar.
//    A chuva segue a mesma conta do clima (Q04Environment.get → wet), então a previsão é exata.
// 2) Sol nas poças: depois da chuva, com o céu aberto, as poças refletem o sol que vem da praia (leste):
//    um brilho quente do lado do sol, faíscas que piscam na água e um reflexo dourado no fim da tarde.
//    Some com chuva forte, neblina e à noite (aí ficam só os reflexos de postes/fogo que já existiam).

const PZ_RAIN_ON=.1; // acima disso as gotas aparecem e as poças começam a encher
function pzWetAt(t){ // mesma fórmula do Q04Environment.get, sem o resto do clima
  return Math.max(0,Math.min(1,(Math.sin(t/79+.7)+Math.sin(t/137+2.2)*.5-.35)*.9));
}
// Próxima troca (começa/para) a partir de t, procurando até 15 minutos à frente.
function pzRainForecast(t){
  const forced=window.__PZ_RAIN_FORCE;
  if(typeof forced==='number')return {raining:forced>PZ_RAIN_ON,wet:forced,inS:null};
  const w0=pzWetAt(t),raining=w0>PZ_RAIN_ON;
  let s=0;for(;s<900;s+=1){if((pzWetAt(t+s)>PZ_RAIN_ON)!==raining)break;}
  if(s>=900)return {raining,wet:w0,inS:null};
  // refina para o segundo exato
  let a=Math.max(0,s-1),b=s;for(let i=0;i<8;i++){const m=(a+b)/2;if((pzWetAt(t+m)>PZ_RAIN_ON)!==raining)b=m;else a=m;}
  // pico da chuva (para mostrar se vai ser fraca ou forte)
  let peak=0;if(!raining){for(let k=b;k<b+300;k+=3){const w=pzWetAt(t+k);if(w<=PZ_RAIN_ON&&k>b+3)break;peak=Math.max(peak,w);}}
  return {raining,wet:w0,inS:b,peak};
}
function pzClock(s){s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}

const _pzRainHUD={el:null,next:0};
function pzRainHudUpdate(run){
  const now=performance.now();if(now<_pzRainHUD.next)return;_pzRainHUD.next=now+250;
  const app=document.getElementById('app')||document.body,btn=document.querySelector('.pz-climate-cycle');
  let el=_pzRainHUD.el;
  if(!el||!el.isConnected){el=document.createElement('div');el.className='pz-rain-timer';el.setAttribute('aria-live','polite');
    el.innerHTML='<span class="pz-rain-ico" aria-hidden="true">☂</span><span class="pz-rain-txt"></span><i class="pz-rain-bar"><b></b></i>';
    app.appendChild(el);_pzRainHUD.el=el;}
  const field=document.querySelector('.app[data-scene="field"]')||document.querySelector('[data-scene="field"]');
  if(!run||run.over||!btn||!field){el.hidden=true;return;}
  const r=btn.getBoundingClientRect();if(!r.width){el.hidden=true;return;}
  el.hidden=false;
  el.style.left=Math.round(r.left)+'px';el.style.top=Math.round(r.bottom+5)+'px';el.style.minWidth=Math.round(r.width)+'px';
  const f=pzRainForecast(run.elapsed||0),txt=el.querySelector('.pz-rain-txt'),bar=el.querySelector('.pz-rain-bar b');
  let label;
  if(f.inS==null)label=f.raining?'CHOVENDO':'SEM CHUVA À VISTA';
  else if(f.raining)label=`CHUVA · PARA EM ${pzClock(f.inS)}`;
  else label=`CHUVA EM ${pzClock(f.inS)}${f.peak>.55?' · FORTE':f.peak>.28?'':' · FRACA'}`;
  if(txt.textContent!==label)txt.textContent=label;
  el.classList.toggle('is-raining',f.raining);
  el.classList.toggle('is-soon',!f.raining&&f.inS!=null&&f.inS<20);
  bar.style.width=(f.raining?Math.round(Math.min(1,f.wet)*100):0)+'%';
}

// Gancho: o WorldFX.update roda a cada quadro da partida, com o clima do quadro.
const _pzRainFxUpdate=WorldFX.prototype.update;
WorldFX.prototype.update=function(dt,run,camera,world,env){
  const r=_pzRainFxUpdate.apply(this,arguments);
  try{pzRainHudUpdate(run);}catch(e){}
  this.__env=env;
  return r;
};
// esconde o selo fora da partida
setInterval(()=>{const el=_pzRainHUD.el;if(!el)return;const g=window.__projectZGame,run=g?.scenes?.current?.run;
  if(!run||run.over||!document.querySelector('.pz-climate-cycle'))el.hidden=true;},500);

// ---------- sol nas poças ----------
function pzPuddleSun(env){
  const dark=env?.dark||0,fog=env?.fog||0,wet=env?.wet||0;
  const day=1-smoothstep(.06,.42,dark);
  return Math.max(0,day*(1-.55*fog)*(1-smoothstep(.15,.6,wet))); // céu fechado na chuva forte: quase sem sol
}
const _pzReflect=WorldFX.prototype.drawReflections;
WorldFX.prototype.drawReflections=function(ctx,camera,world,run,dark,flashOn){
  _pzReflect.apply(this,arguments);
  const L=this.puddleLevel;if(L<.05||window.__PZ_NO_PUDDLE_SUN)return;
  const env=this.__env||Q04_ENVIRONMENT.get(run.elapsed||0,true);
  const k=pzPuddleSun(env)*Math.min(1,L*1.3);if(k<.03)return;
  const gold=Math.min(1,env.golden||0);
  // cor do sol: branco quente ao meio-dia, dourado/laranja no fim de tarde
  const c1=gold>0?[255,Math.round(226-40*gold),Math.round(178-90*gold)]:[255,236,200];
  const c2=[255,Math.round(196-50*gold),Math.round(120-60*gold)];
  const col=a=>`rgba(${c1[0]},${c1[1]},${c1[2]},${a.toFixed(3)})`,col2=a=>`rgba(${c2[0]},${c2[1]},${c2[2]},${a.toFixed(3)})`;
  const [sx,sy]=PZ_SUN.dir; // direção em que a luz anda (do leste para o oeste)
  const ux=-sx,uy=-sy;        // lado de onde vem o sol (leste)
  const t=this.time||0,vw=camera.viewport.width/camera.zoom/2+40,vh=camera.viewport.height/camera.zoom/2+40;
  ctx.save();camera.apply(ctx);ctx.globalCompositeOperation='screen';
  for(const q of this.puddles){
    if(Math.abs(q.x-camera.x)>vw||Math.abs(q.y-camera.y)>vh)continue;
    ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a);const sc=.55+.45*L;ctx.scale(sc,sc);
    if(q.path)ctx.clip(q.path);else{ctx.beginPath();ctx.ellipse(0,0,q.rx,q.ry,0,0,Math.PI*2);ctx.clip();}
    ctx.rotate(-q.a); // dentro do recorte, eixos do mundo: o sol sempre vem do mesmo lado
    const R=Math.max(q.rx,q.ry),seed=q.seed||((q.x*13+q.y*7)%97);
    // 1) brilho do sol refletido, do lado da praia, levemente alongado
    const hx=ux*R*.38,hy=uy*R*.38-R*.08;
    const g=ctx.createRadialGradient(hx,hy,0,hx,hy,R*1.05);
    g.addColorStop(0,col(.62*k));g.addColorStop(.25,col2(.30*k));g.addColorStop(1,col2(0));
    ctx.fillStyle=g;ctx.save();ctx.translate(hx,hy);ctx.rotate(Math.atan2(uy,ux));ctx.scale(1.5,.7);ctx.translate(-hx,-hy);
    ctx.fillRect(-R*2,-R*2,R*4,R*4);ctx.restore();
    // 2) faixa de luz atravessando a água na direção do sol (reflexo comprido do fim de tarde)
    if(gold>.05){ctx.save();ctx.rotate(Math.atan2(uy,ux));
      const lg=ctx.createLinearGradient(-R,0,R,0);lg.addColorStop(0,col2(0));lg.addColorStop(.7,col2(.32*k*gold));lg.addColorStop(1,col2(.1*k*gold));
      ctx.fillStyle=lg;ctx.fillRect(-R,-R*.09,R*2,R*.18);ctx.restore();}
    // 3) onda leve: linhas finas de luz que andam devagar
    ctx.strokeStyle=col(.22*k);ctx.lineWidth=.7;
    for(let i=0;i<3;i++){const ph=(t*.35+i/3+seed*.013)%1,yy=(ph-.5)*R*1.2;
      ctx.globalAlpha=Math.sin(ph*Math.PI);ctx.beginPath();ctx.moveTo(hx-R*.45,hy+yy);ctx.quadraticCurveTo(hx,hy+yy-1.5,hx+R*.45,hy+yy);ctx.stroke();}
    ctx.globalAlpha=1;
    // 4) faíscas: pontinhos em cruz que piscam onde a água espelha o sol
    for(let i=0;i<5;i++){
      const a=seed*1.7+i*2.39,px=hx+Math.cos(a)*R*(.12+.5*((i*37+seed)%10)/10),py=hy+Math.sin(a)*R*(.1+.35*((i*53+seed)%10)/10);
      const tw=Math.max(0,Math.sin(t*(2.2+i*.7)+seed+i*1.3));if(tw<.35)continue;
      const s=(1.2+2.2*tw)*(.6+.4*k),al=Math.min(1,.9*k*tw);
      ctx.fillStyle=col(al);ctx.fillRect(px-s,py-.35,s*2,.7);ctx.fillRect(px-.35,py-s,.7,s*2);
      ctx.fillStyle=`rgba(255,255,255,${al.toFixed(3)})`;ctx.fillRect(px-.6,py-.6,1.2,1.2);
    }
    ctx.restore();
  }
  ctx.restore();
};
