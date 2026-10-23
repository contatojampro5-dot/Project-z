// -- src/core/CinemaSound.js --
// R40 · Apolo + Eco — som de cinema.
// 1) Trilha que cresce com a horda: por baixo da música entra uma camada de tensão feita na hora (WebAudio):
//    um grave contínuo que vai abrindo (filtro) e um pulso tipo batida de coração que acelera conforme a horda
//    aumenta; com chefe na área entra uma nota mais aguda. A música também sobe um pouco de volume no aperto.
// 2) Cidade ao longe: de tempos em tempos, uma sirene distante (com eco, de um lado ou do outro) e um rádio
//    chiando com vozes picotadas e o bipe de fim de mensagem. Tudo baixinho, como se fosse longe.
// Segue os controles de som e música do jogo. window.__PZ_NO_CINEMA=true desliga.
const PZ_CSOUND={ready:false,nextBeat:0,nextSiren:28,nextRadio:48,noise:null,smooth:0};
function pzCSoundSetup(a){
  if(PZ_CSOUND.ready||!a.ctx||!a.musicGain)return PZ_CSOUND.ready;
  const c=a.ctx;
  const out=c.createGain();out.gain.value=0;out.connect(a.musicGain);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;lp.Q.value=4;lp.connect(out);
  const o1=c.createOscillator();o1.type='sawtooth';o1.frequency.value=55;
  const o2=c.createOscillator();o2.type='sawtooth';o2.frequency.value=82.41;o2.detune.value=6;
  const g1=c.createGain();g1.gain.value=.5;const g2=c.createGain();g2.gain.value=.32;
  o1.connect(g1).connect(lp);o2.connect(g2).connect(lp);
  // nota aguda do chefe
  const o3=c.createOscillator();o3.type='triangle';o3.frequency.value=220;const g3=c.createGain();g3.gain.value=0;o3.connect(g3).connect(lp);
  o1.start();o2.start();o3.start();
  // ruído para rádio e chiado
  const len=c.sampleRate*2,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  // eco da distância
  const echo=c.createDelay(1.5);echo.delayTime.value=.42;const fb=c.createGain();fb.gain.value=.38;echo.connect(fb).connect(echo);
  const far=c.createGain();far.gain.value=1;far.connect(a.bus.environment||a.fxGain);echo.connect(far);
  Object.assign(PZ_CSOUND,{ready:true,out,lp,g3,noise:buf,echo,far});
  return true;
}
function pzCSoundThump(a,t,k){
  const c=a.ctx,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(78,t);o.frequency.exponentialRampToValueAtTime(38,t+.22);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09*k,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.3);
  o.connect(g).connect(PZ_CSOUND.out);o.start(t);o.stop(t+.32);o.onended=()=>{o.disconnect();g.disconnect();};
}
function pzCSoundSiren(a){
  const c=a.ctx,t=c.currentTime,dur=6+Math.random()*4;
  const o=c.createOscillator();o.type='sine';
  const lfo=c.createOscillator();lfo.type='sine';lfo.frequency.value=.45+Math.random()*.3;
  const depth=c.createGain();depth.gain.value=170;lfo.connect(depth).connect(o.frequency);o.frequency.value=780;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1500;
  const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.018,t+1.6);g.gain.setValueAtTime(.018,t+dur-2);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  const pan=c.createStereoPanner?c.createStereoPanner():null;
  o.connect(lp).connect(g);
  const tail=pan?(pan.pan.value=(Math.random()<.5?-1:1)*(.45+Math.random()*.45),g.connect(pan),pan):g;
  tail.connect(PZ_CSOUND.far);tail.connect(PZ_CSOUND.echo);
  o.start(t);lfo.start(t);o.stop(t+dur+.1);lfo.stop(t+dur+.1);
  o.onended=()=>{for(const n of [o,lfo,depth,lp,g,pan])n?.disconnect();};
}
function pzCSoundRadio(a){
  const c=a.ctx,t0=c.currentTime,dur=1.6+Math.random()*1.8;
  const src=c.createBufferSource();src.buffer=PZ_CSOUND.noise;src.loop=true;
  const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=2.6;
  const g=c.createGain();g.gain.value=.0001;
  const pan=c.createStereoPanner?c.createStereoPanner():null;if(pan)pan.pan.value=(Math.random()*2-1)*.7;
  src.connect(bp).connect(g);(pan?g.connect(pan):g).connect(PZ_CSOUND.far);
  // abre o rádio (estalo), "sílabas" picotadas, fecha com estalo
  g.gain.setValueAtTime(.022,t0);g.gain.setValueAtTime(.006,t0+.05);
  let t=t0+.12;while(t<t0+dur){const s=.06+Math.random()*.16;g.gain.setValueAtTime(.006,t);g.gain.linearRampToValueAtTime(.014+Math.random()*.01,t+.02);g.gain.setValueAtTime(.012,t+s);g.gain.linearRampToValueAtTime(.004,t+s+.03);
    bp.frequency.setValueAtTime(1200+Math.random()*1400,t);t+=s+.03+Math.random()*.09;}
  g.gain.setValueAtTime(.022,t);g.gain.exponentialRampToValueAtTime(.0001,t+.08);
  src.start(t0);src.stop(t+.12);
  // bipe de fim de mensagem
  const b=c.createOscillator(),bg=c.createGain();b.type='square';b.frequency.value=1250;bg.gain.setValueAtTime(.0001,t+.1);bg.gain.exponentialRampToValueAtTime(.006,t+.11);bg.gain.exponentialRampToValueAtTime(.0001,t+.24);
  b.connect(bg);(pan?bg.connect(pan):bg.connect(PZ_CSOUND.far));b.start(t+.1);b.stop(t+.26);
  src.onended=()=>{for(const n of [src,bp,g])n.disconnect();};b.onended=()=>{b.disconnect();bg.disconnect();pan?.disconnect();};
}
{const P=AudioSystem.prototype,_ue=P.updateEnvironment;
 P.updateEnvironment=function(dt,environment,opts={}){
   const r=_ue.apply(this,arguments);
   try{
     if(!this.ctx||this.ctx.state!=='running')return r;
     if(!pzCSoundSetup(this))return r;
     const s=this.settings||{},on=!window.__PZ_NO_CINEMA&&this.mode!=='menu'&&!opts.paused;
     const music=on&&s.musicEnabled!==false,sound=on&&s.soundEnabled!==false;
     // intensidade suavizada (a horda chegando faz subir aos poucos)
     const k=Math.max(0,Math.min(1,this.intensity||0)),boss=this.mode==='boss';
     PZ_CSOUND.smooth+=((boss?Math.max(k,.75):k)-PZ_CSOUND.smooth)*Math.min(1,(dt||0)*.8);
     const I=PZ_CSOUND.smooth,now=this.ctx.currentTime;
     PZ_CSOUND.out.gain.setTargetAtTime(music?.05+.32*I:0,now,.6);
     PZ_CSOUND.lp.frequency.setTargetAtTime(160+1300*I*I,now,.5);
     PZ_CSOUND.g3.gain.setTargetAtTime(music&&boss?.22:0,now,.8);
     if(this.musicTrack&&this.musicTrackName!=='menu')this.musicTrack.volume=Math.min(1,this.trackVolume()*(music?(.85+.3*I):1));
     // pulso: só quando a coisa aperta; acelera com a horda
     if(music&&I>.18){const bpm=66+64*I;if(PZ_CSOUND.nextBeat<now)PZ_CSOUND.nextBeat=now+.05;
       while(PZ_CSOUND.nextBeat<now+.12){pzCSoundThump(this,PZ_CSOUND.nextBeat,Math.min(1,I*1.2));pzCSoundThump(this,PZ_CSOUND.nextBeat+.2,.55*Math.min(1,I*1.2));PZ_CSOUND.nextBeat+=60/bpm;}}
     // cidade ao longe
     if(sound){
       PZ_CSOUND.nextSiren-=dt||0;PZ_CSOUND.nextRadio-=dt||0;
       if(PZ_CSOUND.nextSiren<=0){PZ_CSOUND.nextSiren=35+Math.random()*50;pzCSoundSiren(this);}
       if(PZ_CSOUND.nextRadio<=0){PZ_CSOUND.nextRadio=45+Math.random()*60;pzCSoundRadio(this);}
     }
   }catch(e){}
   return r;
 };}
