// -- src/core/AmbientLife.js --
// R43 · Eco + Apolo — som do ambiente com distância (quanto mais perto, mais alto).
// 1) Fogo: chiado + estalos que crescem quando o jogador chega perto de carro pegando fogo, fogueira ou incêndio do muro.
// 2) Trovão junto do relâmpago: estalo seco + ronco longo, com o atraso da distância (clarão primeiro, som depois).
// 3) Zumbis: rosnado mais frequente quando estão perto, e um murmúrio da horda que sobe com a quantidade e a proximidade.
// 4) Chefões: rugido forte quando aparecem e de tempos em tempos enquanto vivos (mais alto perto deles).
// 5) Carros com farol aceso: motor ligado em marcha lenta quando o jogador passa perto.
// 6) Pessoas nos prédios: vozes (ElevenLabs) gritando "corre", "socorro"... abafadas, vindas de um prédio perto.
// Os sons gravados ficam em assets/audio/ambient/ (PZ_AMB_FILES); sem eles, fogo/trovão/motor são feitos na hora (WebAudio).
// window.__PZ_NO_AMBIENT=true desliga tudo.
const PZ_AMB={ready:false,buf:{},loading:false,fire:null,engine:null,horde:null,nextPeople:9,nextBossRoar:6,lastBoss:null,thunderQ:[],crackle:0,peopleLast:-1};
function pzAmbFiles(){return typeof PZ_AMB_FILES!=='undefined'?PZ_AMB_FILES:{};}
function pzAmbLoad(a){
  if(PZ_AMB.loading||!a.ctx)return;PZ_AMB.loading=true;
  for(const [key,list] of Object.entries(pzAmbFiles())){
    PZ_AMB.buf[key]=[];
    for(const url of [].concat(list)){if(location.protocol==='file:'&&!url.startsWith('data:'))continue; // aberto direto do disco: fica o som feito na hora
      fetch(url).then(r=>r.ok?r.arrayBuffer():Promise.reject(r.status)).then(b=>a.ctx.decodeAudioData(b))
      .then(buf=>{PZ_AMB.buf[key].push(buf);}).catch(e=>console.warn('[PROJECT Z] som ambiente',key,e));}
  }
}
function pzAmbPick(key){const l=PZ_AMB.buf[key];return l&&l.length?l[Math.floor(Math.random()*l.length)]:null;}
function pzAmbNoise(c,sec=2){const n=Math.floor(c.sampleRate*sec),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;}
// laço contínuo com volume e lado controlados a cada quadro
function pzAmbLoop(a,build){
  const c=a.ctx,g=c.createGain();g.gain.value=0;const pan=c.createStereoPanner?c.createStereoPanner():null;
  (pan?(g.connect(pan),pan):g).connect(a.bus.environment||a.fxGain);
  const nodes=build(c,g)||[];return {g,pan,nodes,sample:null};
}
function pzAmbSampleLoop(a,L,key){
  // troca o som feito na hora pelo gravado assim que ele carrega
  if(L.sample||!pzAmbPick(key))return;
  const c=a.ctx,s=c.createBufferSource();s.buffer=pzAmbPick(key);s.loop=true;
  s.loopStart=.03;s.loopEnd=Math.max(.1,s.buffer.duration-.03); // pula o silencinho que o mp3 põe nas pontas
  const sg=c.createGain();sg.gain.value=1;s.connect(sg).connect(L.g);s.start(c.currentTime,Math.random()*s.buffer.duration);
  for(const n of L.nodes){try{n.disconnect();}catch{}}
  L.sample=s;
}
function pzAmbSetup(a){
  if(PZ_AMB.ready)return true;if(!a.ctx||!a.bus?.environment)return false;
  const noise=pzAmbNoise(a.ctx,2.5);PZ_AMB.noise=noise;
  // fogo: chiado grave + chiado médio (os estalos vêm por cima, em pzAmbCrackle)
  PZ_AMB.fire=pzAmbLoop(a,(c,out)=>{
    const s=c.createBufferSource();s.buffer=noise;s.loop=true;
    const lo=c.createBiquadFilter();lo.type='lowpass';lo.frequency.value=260;const lg=c.createGain();lg.gain.value=.9;
    const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1300;bp.Q.value=.7;const bg=c.createGain();bg.gain.value=.22;
    s.connect(lo).connect(lg).connect(out);s.connect(bp).connect(bg).connect(out);s.start();return [lg,bg];
  });
  // motor em marcha lenta: grave pulsando (explosões do motor) com filtro fechado
  PZ_AMB.engine=pzAmbLoop(a,(c,out)=>{
    const o=c.createOscillator();o.type='sawtooth';o.frequency.value=34;
    const o2=c.createOscillator();o2.type='square';o2.frequency.value=68.5;const g2=c.createGain();g2.gain.value=.25;
    const am=c.createGain();am.gain.value=.55;const lfo=c.createOscillator();lfo.frequency.value=13.5;const ld=c.createGain();ld.gain.value=.45;
    lfo.connect(ld).connect(am.gain);
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=230;lp.Q.value=2;
    o.connect(am);o2.connect(g2).connect(am);am.connect(lp).connect(out);o.start();o2.start();lfo.start();return [lp];
  });
  // murmúrio da horda: só com o arquivo gravado (gemidos); sem ele fica mudo
  PZ_AMB.horde=pzAmbLoop(a,()=>[]);
  PZ_AMB.ready=true;pzAmbLoad(a);
  return true;
}
// estalo de lenha/lataria queimando
function pzAmbCrackle(a,vol,pan){
  const c=a.ctx,t=c.currentTime+Math.random()*.03,s=c.createBufferSource();s.buffer=PZ_AMB.noise;
  const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800+Math.random()*3000;
  const g=c.createGain(),len=.006+Math.random()*.03;g.gain.setValueAtTime(vol*(.4+Math.random()*.9),t);g.gain.exponentialRampToValueAtTime(.0001,t+len);
  const p=c.createStereoPanner?c.createStereoPanner():null;if(p)p.pan.value=pan;
  s.connect(hp).connect(g);(p?(g.connect(p),p):g).connect(a.bus.environment);
  s.start(t,Math.random()*2);s.stop(t+len+.01);s.onended=()=>{s.disconnect();hp.disconnect();g.disconnect();p?.disconnect();};
}
// trovão: estalo seco + ronco que rola (dist 0 = em cima, 1 = longe)
function pzAmbThunder(a,dist){
  const c=a.ctx,t=c.currentTime,out=a.bus.environment,pan=c.createStereoPanner?c.createStereoPanner():null;
  const vol=.55*(1-.55*dist);if(pan){pan.pan.value=(Math.random()*2-1)*.6;pan.connect(out);}const dst=pan||out;
  const rec=pzAmbPick('thunder');
  if(rec){const s=c.createBufferSource(),g=c.createGain();s.buffer=rec;s.playbackRate.value=.9+Math.random()*.2;g.gain.value=vol*1.5;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000-6500*dist;s.connect(lp).connect(g).connect(dst);s.start(t);s.onended=()=>{s.disconnect();lp.disconnect();g.disconnect();pan?.disconnect();};return;}
  const dur=4+Math.random()*3+dist*2;
  if(dist<.6){const s=c.createBufferSource();s.buffer=PZ_AMB.noise;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;
    const g=c.createGain();g.gain.setValueAtTime(vol*1.1,t);g.gain.exponentialRampToValueAtTime(.0001,t+.45);s.connect(hp).connect(g).connect(dst);s.start(t);s.stop(t+.5);}
  const r=c.createBufferSource();r.buffer=PZ_AMB.noise;r.loop=true;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(420-200*dist,t);lp.frequency.exponentialRampToValueAtTime(90,t+dur);
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*1.8,t+.08+dist*.4);
  // o ronco "rola": sobe e desce algumas vezes antes de sumir
  let k=t+.5;while(k<t+dur-1){g.gain.linearRampToValueAtTime(vol*(.6+Math.random()*1.1),k);k+=.35+Math.random()*.8;}
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  r.connect(lp).connect(g).connect(dst);r.start(t);r.stop(t+dur+.1);
  const o=c.createOscillator(),og=c.createGain();o.type='sine';o.frequency.setValueAtTime(48,t);o.frequency.exponentialRampToValueAtTime(26,t+dur*.7);
  og.gain.setValueAtTime(.0001,t);og.gain.exponentialRampToValueAtTime(vol*.7,t+.15);og.gain.exponentialRampToValueAtTime(.0001,t+dur*.8);o.connect(og).connect(dst);o.start(t);o.stop(t+dur);
  r.onended=()=>{r.disconnect();lp.disconnect();g.disconnect();o.disconnect();og.disconnect();pan?.disconnect();};
}
// toca um arquivo num ponto do mapa (com distância, lado e opção de som abafado/eco de prédio)
function pzAmbAt(a,key,x,y,{vol=1,max=900,muffle=0,rate=1}={}){
  const buf=pzAmbPick(key);if(!buf)return false;
  const mix=spatialMix({x,y},a.listener,max);if(mix.gain<.02)return false;
  const c=a.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=buf;s.playbackRate.value=rate;g.gain.value=Math.min(1.4,vol*mix.gain);
  let n=s;if(muffle){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4200-2400*muffle;n.connect(lp);n=lp;}
  n.connect(g);const p=c.createStereoPanner?c.createStereoPanner():null;
  if(p){p.pan.value=mix.pan;g.connect(p);p.connect(a.bus.environment);}else g.connect(a.bus.environment);
  if(muffle&&a.reverb){const send=c.createGain();send.gain.value=.9*muffle;g.connect(send);send.connect(a.reverb);s.onended=()=>send.disconnect();}
  s.start();return true;
}
function pzAmbFires(run,world){
  const out=[];
  for(const f of world?.fireLights||[])out.push({x:f.x,y:f.y,R:(f.radius||90)*4.5});
  for(const f of world?.border?.fires||[])if(f.x!=null)out.push({x:f.x,y:f.y,R:(f.big?520:380)*(f.s||1)});
  const D=run.destructibles;
  for(const s of D?.initialBurningCars||[])if(!s.vehicle?.exploded)out.push({x:s.x,y:s.y,R:440});
  for(const o of D?.objects||[])if(o.kind==='vehicle'&&o.exploded&&o.burnTime>0)out.push({x:o.rect.x+o.rect.w/2,y:o.rect.y+o.rect.h/2,R:480*Math.min(1,o.burnTime/2)});
  return out;
}
// mesmos carros que acendem farol no mapa de luz (38f): civis inteiros escolhidos pela mesma semente
function pzAmbCarsOn(run){
  const out=[];
  for(const o of run.destructibles?.objects||[]){
    if(o.visual?.kind!=='civilian'||!o.alive||o.exploded)continue;const v=o.visual.v;
    if(mulberry32(Math.round(v.x*13+v.y*7))()>.36)continue;out.push(v);
  }
  return out;
}
{const P=AudioSystem.prototype,_ue=P.updateEnvironment;
 P.updateEnvironment=function(dt,environment,opts={}){
   const before=this.thunderCooldown;
   const r=_ue.apply(this,arguments);
   try{
     if(!this.ctx||this.ctx.state!=='running'||!pzAmbSetup(this))return r;
     const g=window.__projectZGame,run=g?.scenes?.current?.run,p=run?.player,now=this.ctx.currentTime,s=this.settings||{};
     const on=!!(run&&p&&!run.over&&!opts.paused&&this.mode!=='menu'&&s.soundEnabled!==false&&!window.__PZ_NO_AMBIENT&&!document.hidden);
     dt=Math.max(0,Math.min(.1,dt||0));
     // ---- fogo
     let fire=0,fpan=0;
     if(on)for(const f of pzAmbFires(run,g.world)){const d=Math.hypot(f.x-p.x,f.y-p.y);const k=1-d/f.R;if(k>fire){fire=k;fpan=Math.max(-.8,Math.min(.8,(f.x-p.x)/260));}}
     const F=PZ_AMB.fire;pzAmbSampleLoop(this,F,'fire');
     const fv=fire>0?Math.pow(fire,2):0;
     F.g.gain.setTargetAtTime(fv*(F.sample?.75:.2),now,.25);if(F.pan)F.pan.pan.setTargetAtTime(fpan*(1-fire*.6),now,.2);
     if(fv>.02&&!F.sample){PZ_AMB.crackle-=dt*(4+26*fv);while(PZ_AMB.crackle<0){PZ_AMB.crackle+=1;pzAmbCrackle(this,.28*fv,fpan);}}
     else if(fv>.05&&Math.random()<dt*10*fv)pzAmbCrackle(this,.18*fv,fpan);
     // ---- trovão junto do relâmpago (o clarão do 38o liga no mesmo instante em que o tempo do trovão reinicia)
     if(this.thunderCooldown>before+1&&on){const dist=Math.random();PZ_AMB.thunderQ.push(now+.12+dist*1.4);PZ_AMB.thunderDist=dist;}
     while(PZ_AMB.thunderQ.length&&PZ_AMB.thunderQ[0]<=now){PZ_AMB.thunderQ.shift();if(on)pzAmbThunder(this,PZ_AMB.thunderDist??.5);}
     // ---- motor dos carros com farol aceso
     let eng=0,epan=0;
     if(on)for(const v of pzAmbCarsOn(run)){const d=Math.hypot(v.x-p.x,v.y-p.y);const k=1-d/300;if(k>eng){eng=k;epan=Math.max(-.8,Math.min(.8,(v.x-p.x)/200));}}
     const E=PZ_AMB.engine;pzAmbSampleLoop(this,E,'engine');
     E.g.gain.setTargetAtTime(eng>0?eng*eng*(E.sample?.7:.16):0,now,.3);if(E.pan)E.pan.pan.setTargetAtTime(epan,now,.2);
     // ---- murmúrio da horda: soma dos zumbis perto (cada um pesa mais quanto mais perto)
     let crowd=0;
     if(on)for(const e of run.enemies||[]){if(!e.alive||e.isBoss)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<520)crowd+=Math.pow(1-d/520,2);}
     const H=PZ_AMB.horde;pzAmbSampleLoop(this,H,'horde');
     H.g.gain.setTargetAtTime(H.sample?Math.min(.5,crowd*.06):0,now,.6);
     // ---- chefão: rugido quando aparece e de tempos em tempos
     const boss=on&&run.boss?.alive?run.boss:null;
     if(boss&&PZ_AMB.lastBoss!==boss){PZ_AMB.lastBoss=boss;PZ_AMB.nextBossRoar=.6;}
     if(!boss)PZ_AMB.lastBoss=null;
     if(boss){PZ_AMB.nextBossRoar-=dt;if(PZ_AMB.nextBossRoar<=0){PZ_AMB.nextBossRoar=7+Math.random()*7;
       const key=boss.kind==='colossus'?'roarColossus':'roarHive';
       const own=pzAmbAt(this,key,boss.x,boss.y,{vol:1.15,max:1100,rate:.92+Math.random()*.16});
       this.effect(boss.kind==='colossus'?'colossusGrowl':'hiveGrowl',{x:boss.x,y:boss.y,volume:own?.7:1.2}); // os dois juntos dão mais corpo
       this.body?.('explosion',{x:boss.x,y:boss.y,volume:.35});}}
     // ---- pessoas presas nos prédios
     if(on&&typeof PZ_TALL!=='undefined'){
       PZ_AMB.nextPeople-=dt*(1+(this.intensity||0));
       if(PZ_AMB.nextPeople<=0){const few=(PZ_AMB.buf.people?.length||0)+(PZ_AMB.buf.scream?.length||0)<4;PZ_AMB.nextPeople=(few?40:14)+Math.random()*(few?35:20);
         const near=PZ_TALL.list.map(b=>({b,d:Math.hypot(b.x+b.w/2-p.x,b.y+b.h/2-p.y)})).filter(o=>o.d>120&&o.d<720);
         if(near.length){const {b}=near[Math.floor(Math.random()*near.length)];
           const x=b.x+b.w*(.2+Math.random()*.6),y=b.y+b.h*(.2+Math.random()*.6);
           const key=Math.random()<.68?'people':'scream';
           pzAmbAt(this,key,x,y,{vol:key==='scream'?.8:1,max:950,muffle:.45+Math.random()*.3,rate:.97+Math.random()*.06});}}
     }
   }catch(e){PZ_AMB.err=e;}
   return r;
 };}
// zumbis perto rosnam mais vezes (o volume já cresce com a distância no spatialMix)
{const P=AudioSystem.prototype,_ut=P.updateThreats;
 P.updateThreats=function(dt,enemies,player,opts={}){
   const r=_ut.apply(this,arguments);
   try{
     if(window.__PZ_NO_AMBIENT||!player||!enemies?.length)return r;
     let best=Infinity;for(const e of enemies)if(e.alive){const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<best)best=d;}
     if(best<220)this.growlClock=Math.min(this.growlClock,.3+best/220*.7+Math.random()*.25);
   }catch(e){}
   return r;
 };}
