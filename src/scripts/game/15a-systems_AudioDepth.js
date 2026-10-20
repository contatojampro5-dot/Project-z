// -- src/systems/AudioDepth.js --
// CRONOS C5 · Dionísio — "áudio com corpo" sem trocar os arquivos atuais:
// 1) reverberação de rua (eco curto dos prédios + cauda) nos sons de armas, criaturas e ambiente;
// 2) camada grave sintetizada sob cada disparo e explosão, proporcional ao peso da arma.
const AUDIO_BODY=Object.freeze({
  pistol:{gain:.20,freq:115,tail:.16}, smg:{gain:.11,freq:125,tail:.10}, rifle:{gain:.24,freq:96,tail:.2},
  shotgun:{gain:.46,freq:72,tail:.32}, revolver:{gain:.38,freq:82,tail:.28}, sniper:{gain:.6,freq:56,tail:.45},
  explosion:{gain:.85,freq:48,tail:.9},
});
function pzStreetImpulse(ctx,seconds=1.6){
  const rate=ctx.sampleRate,len=Math.floor(rate*seconds),ir=ctx.createBuffer(2,len,rate);
  for(let ch=0;ch<2;ch++){
    const d=ir.getChannelData(ch);
    for(let i=0;i<len;i++){const t=i/rate;d[i]=(Math.random()*2-1)*Math.pow(1-t/seconds,3.2)*.55;}
    // reflexões iniciais: fachadas dos dois lados da rua (levemente diferentes por canal)
    for(const [ms,amp] of [[23+ch*4,.7],[41+ch*6,.5],[67+ch*3,.38],[104+ch*8,.24]]){const k=Math.floor(rate*ms/1000);if(k<len)d[k]+=amp*(ch?-1:1);}
  }
  return ir;
}
AudioSystem.prototype.ensureDepth=function(){
  if(this.depthReady||!this.ctx||!this.master||!this.bus?.weapons)return;
  try{
    const c=this.ctx;
    this.reverb=c.createConvolver();this.reverb.buffer=pzStreetImpulse(c);
    this.reverbWet=c.createGain();this.reverbWet.gain.value=.16;
    const tone=c.createBiquadFilter();tone.type='lowpass';tone.frequency.value=4200;
    this.reverb.connect(tone);tone.connect(this.reverbWet);this.reverbWet.connect(this.master);
    for(const [bus,amount] of [['weapons',.55],['creatures',.4],['environment',.35]]){
      if(!this.bus[bus])continue;const send=c.createGain();send.gain.value=amount;this.bus[bus].connect(send);send.connect(this.reverb);
    }
    const n=c.createBuffer(1,Math.floor(c.sampleRate*1.2),c.sampleRate),nd=n.getChannelData(0);
    for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    this.noiseBuffer=n;this.depthReady=true;
  }catch(e){this.depthReady=true;console.warn('[PROJECT Z] Profundidade de áudio indisponível',e);}
};
AudioSystem.prototype.body=function(kind,options={}){
  const b=AUDIO_BODY[kind];
  if(!b||!this.ctx||this.ctx.state!=='running'||!this.settings.soundEnabled)return false;
  this.ensureDepth();if(!this.noiseBuffer)return false;
  const c=this.ctx,now=c.currentTime,dest=this.bus.weapons;
  const mix=Number.isFinite(options.x)?spatialMix({x:options.x,y:options.y},this.listener,MAX_DISTANCE):{gain:1,pan:0};
  const g=b.gain*mix.gain*(options.volume??1);if(g<.02)return false;
  // pancada grave: seno que cai de frequência
  const osc=c.createOscillator(),og=c.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(b.freq*1.7,now);osc.frequency.exponentialRampToValueAtTime(b.freq*.5,now+.16+b.tail*.3);
  og.gain.setValueAtTime(.0001,now);og.gain.exponentialRampToValueAtTime(g,now+.004);og.gain.exponentialRampToValueAtTime(.0001,now+.2+b.tail*.4);
  osc.connect(og);og.connect(dest);osc.start(now);osc.stop(now+.25+b.tail*.4);
  // cauda de ar: ruído filtrado que se espalha pela rua
  const src=c.createBufferSource(),lp=c.createBiquadFilter(),ng=c.createGain();
  src.buffer=this.noiseBuffer;lp.type='lowpass';lp.frequency.setValueAtTime(kind==='explosion'?700:1400,now);lp.frequency.exponentialRampToValueAtTime(180,now+b.tail);
  ng.gain.setValueAtTime(.0001,now);ng.gain.exponentialRampToValueAtTime(g*.55,now+.006);ng.gain.exponentialRampToValueAtTime(.0001,now+b.tail+.05);
  src.connect(lp);lp.connect(ng);
  if(c.createStereoPanner&&mix.pan){const pn=c.createStereoPanner();pn.pan.value=mix.pan;ng.connect(pn);pn.connect(dest);}else ng.connect(dest);
  src.start(now);src.stop(now+b.tail+.1);
  return true;
};
{const unlock=AudioSystem.prototype.unlock;
 AudioSystem.prototype.unlock=async function(...a){const ok=await unlock.apply(this,a);if(ok)this.ensureDepth();return ok;};}
