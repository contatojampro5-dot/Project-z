// -- src/systems/AudioSystem.js --

// Sound Overhaul G.1. Audio real gravado é um recurso opcional substituível:
// o pacote atual contém amostras DEMONSTRATIVAS originais geradas por síntese.
// A trilha rítmica da Alpha 0.7 permanece, preservando seus quatro estados.
const MAX_DISTANCE=610;
const BUS_NAMES=['weapons','creatures','environment','ui'];
const audioClamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const audioPath=(name)=>globalThis.__PROJECT_Z_EMBEDDED_AUDIO__?.[name]||new URL(`audio/${name}`,document.baseURI).href;

class AudioSystem {
  constructor(settings){
    this.settings=settings;
    this.ctx=null;this.master=null;this.musicGain=null;this.fxGain=null;
    this.bus={};this.buffers=new Map();this.failed=new Set();this.errors=new Map();this.loading=null;
    this.active=new Set();this.lastPlayed=new Map();this.lastVariant=new Map();
    this.listener={x:0,y:0};this.growlClock=0;this.growlCount=0;this.lastStep=0;
    this.interval=null;this.step=0;this.mode='menu';this.intensity=0;this.tempo=290;
    this.disposed=false;
    this.musicTrack=null;this.musicTrackName=null;this.musicTrackLoading=false;
    this.weatherVoices=null;this.weatherClock=0;this.thunderCooldown=17;
  }
  async unlock(){
    const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Context||this.disposed)return false;
    try{
      if(!this.ctx){
        this.ctx=new Context();
        const compressor=this.ctx.createDynamicsCompressor();
        compressor.threshold.value=-12;compressor.knee.value=8;compressor.ratio.value=7;
        compressor.attack.value=.003;compressor.release.value=.2;
        compressor.connect(this.ctx.destination);
        this.master=this.ctx.createGain();this.master.gain.value=.72;this.master.connect(compressor);
        this.musicGain=this.ctx.createGain();this.musicGain.connect(this.master);
        this.fxGain=this.ctx.createGain();this.fxGain.connect(this.master);
        for(const category of BUS_NAMES){
          const bus=this.ctx.createGain();bus.connect(this.fxGain);this.bus[category]=bus;
        }
      }
      if(this.ctx.state!=='running')await this.ctx.resume();
      this.applySettings(this.settings);
      this.ensureWeatherAudio();
      // Never block a pointer event waiting for decoded samples; synthesis is fallback.
      void this.preloadSamples();
      return true;
    }catch{return false;}
  }
  applySettings(settings){
    this.settings=settings;
    if(this.master)this.master.gain.setTargetAtTime(audioClamp(settings.masterVolume??1)*.72,this.ctx.currentTime,.025);
    if(this.musicGain)this.musicGain.gain.setTargetAtTime(settings.musicEnabled?audioClamp(settings.musicVolume)*.18:0,this.ctx.currentTime,.045);
    if(this.fxGain)this.fxGain.gain.setTargetAtTime(settings.soundEnabled?audioClamp(settings.effectsVolume)*.85:0,this.ctx.currentTime,.025);
    const names={weapons:'weaponsVolume',creatures:'creaturesVolume',environment:'environmentVolume',ui:'uiVolume'};
    for(const [category,key] of Object.entries(names)){
      const value=Number.isFinite(settings[key])?audioClamp(settings[key]):1;
      if(this.bus[category])this.bus[category].gain.setTargetAtTime(value,this.ctx.currentTime,.025);
    }
    if(this.ctx&&settings.musicEnabled)this.startMusic();else this.stopMusic();
    if(this.musicTrack){this.musicTrack.volume=this.trackVolume();if(!settings.musicEnabled)this.musicTrack.pause();}
  }
  async preloadSamples(){
    if(this.loading)return this.loading;
    if(!this.ctx)return false;
    this.loading=(async()=>{
      let next=0;
      const work=async()=>{
        while(next<SOUND_FILES.length&&!this.disposed){
          const id=SOUND_FILES[next++];
          try{
            const path=audioPath(id);
            let bytes;
            if(path.startsWith('data:')){
              const raw=atob(path.slice(path.indexOf(',')+1));
              const data=new Uint8Array(raw.length);
              for(let i=0;i<raw.length;i++)data[i]=raw.charCodeAt(i);
              bytes=data.buffer;
            }else{
              const response=await fetch(path);
              if(!response.ok)throw new Error(String(response.status));
              bytes=await response.arrayBuffer();
            }
            if(bytes.byteLength>2_000_000)throw new Error('SFX larger than 2 MB');
            const buffer=await this.ctx.decodeAudioData(bytes);
            if(!this.disposed)this.buffers.set(id,buffer);
          }catch(error){this.failed.add(id);this.errors.set(id,String(error));console.warn('[PROJECT Z] Falha no WAV:',id,error);} // Error is visible in console and diagnostic
        }
      };
      await Promise.all([work(),work(),work()]);
      return this.buffers.size;
    })();
    return this.loading;
  }
  get loadedCount(){return this.buffers.size;}
  get missingCount(){return this.failed.size;}
  setListener(x,y){this.listener={x,y};}
  setMode(mode){
    if(mode===this.mode)return;
    this.mode=mode;this.step=0;
    this.switchTrack();
    const bpm=mode==='boss'?178:mode==='horde'?150:mode==='field'?124:102;
    const desired=Math.round(60000/bpm/2);
    if(this.tempo!==desired){this.tempo=desired;if(this.interval){this.stopMusic();this.startMusic();}}
  }
  setIntensity(amount){this.intensity=audioClamp(amount);}
  trackVolume(){
    const key=this.musicTrackName==='menu'?'menuMusicVolume':'gameMusicVolume';
    return this.settings.musicEnabled?Math.min(1,(this.settings.musicVolume??1)*(this.settings[key]??1)*.40*(this.settings.masterVolume??1)):0;
  }
  switchTrack(){
    const target=this.mode==='menu'?'menu':'gameplay';
    if(typeof Audio==='undefined')return;
    if(this.musicTrackName===target)return;
    if(this.musicTrack){this.musicTrack.pause();this.musicTrack.currentTime=0;}
    this.musicTrackName=target;
    const embedded=globalThis.__PROJECT_Z_EMBEDDED_MUSIC__?.[target];
    this.musicTrack=new Audio(embedded||new URL(`music/${target}.mp3`,document.baseURI).href);
    this.musicTrack.loop=true;this.musicTrack.preload='auto';
    this.musicTrack.volume=this.trackVolume();
    if(this.ctx?.state==='running'&&this.settings.musicEnabled)this.musicTrack.play().catch(()=>{});
  }
  startMusic(){
    this.switchTrack();
    if(this.musicTrack){if(this.settings.musicEnabled)this.musicTrack.play().catch(()=>{});return;}
    if(this.interval||!this.ctx||this.ctx.state!=='running'||!this.settings.musicEnabled)return;
    this.interval=setInterval(()=>this.playBeat(),this.tempo);
  }
  stopMusic(){if(this.musicTrack)this.musicTrack.pause();if(this.interval){clearInterval(this.interval);this.interval=null;}}
  tone(frequency,duration=.18,kind='sine',volume=.15,bus='music',timeOffset=0){
    if(!this.ctx||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime+timeOffset,osc=this.ctx.createOscillator(),amp=this.ctx.createGain();
    osc.type=kind;osc.frequency.setValueAtTime(frequency,now);
    amp.gain.setValueAtTime(.0001,now);
    amp.gain.exponentialRampToValueAtTime(Math.max(.0001,volume),now+.015);
    amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(amp);amp.connect(bus==='fx'?this.bus.ui:this.musicGain);
    osc.start(now);osc.stop(now+duration+.02);
  }
  playBeat(){
    if(!this.ctx||!this.settings.musicEnabled||this.ctx.state!=='running')return;
    const menu=this.mode==='menu',boss=this.mode==='boss',horde=this.mode==='horde';
    const notes=menu?[65.41,73.42,82.41,73.42]:boss?[65.41,69.3,82.41,73.42]:[82.41,98,123.47,110];
    const bass=notes[Math.floor(this.step/2)%notes.length];
    if(this.step%2===0)this.tone(bass,boss?.29:.41,'triangle',boss?.39:.31);
    if(this.step%4===2)this.tone(bass*2,.22,'sine',.09);
    if(!menu){
      if(this.step%2===0)this.tone(boss?52:55,.07,'square',boss?.14:.085);
      if((boss||horde)&&this.step%2===1)this.tone(220,.045,'triangle',.10);
      if(boss&&this.step%4===3)this.tone(164.81,.12,'sawtooth',.055);
    }
    this.step++;
  }
  feedback(type='select'){
    if(!this.ctx||!this.settings.soundEnabled)return;
    if(type==='select'){this.tone(480,.07,'triangle',.24,'fx');this.tone(720,.10,'sine',.14,'fx',.05);}
    else if(type==='back')this.tone(360,.10,'triangle',.18,'fx');
  }
  activeVoices(category){return [...this.active].filter(v=>v.category===category).length;}
  pickVariant(key,variants){
    if(variants.length===1)return variants[0];
    const previous=this.lastVariant.get(key);
    const available=variants.filter(id=>id!==previous);
    const chosen=available[Math.floor(Math.random()*available.length)];
    this.lastVariant.set(key,chosen);
    return chosen;
  }
  playSample(key,options={}){
    const data=SOUND_EVENTS[key];
    if(!data||!this.ctx||this.ctx.state!=='running'||!this.settings.soundEnabled)return false;
    const now=this.ctx.currentTime;
    const last=this.lastPlayed.get(key)??-Infinity;
    if(now-last<(data.cooldown||0))return false;
    const location=Number.isFinite(options.x)&&Number.isFinite(options.y)?{x:options.x,y:options.y}:null;
    const mix=spatialMix(location,this.listener,MAX_DISTANCE);
    if(mix.gain<.015)return false;
    if(this.active.size>=SOUND_LIMITS.total||this.activeVoices(data.group)>=SOUND_LIMITS[data.group])return false;
    const available=data.variants.filter(id=>this.buffers.has(id));
    if(!available.length)return false;
    const variant=this.pickVariant(key,available);
    const buffer=this.buffers.get(variant);
    if(!buffer)return false;
    this.lastPlayed.set(key,now);
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
    source.buffer=buffer;
    const jitter=data.group==='creatures'?.11:data.group==='weapons'?.035:.025;
    source.playbackRate.value=1+(Math.random()*2-1)*jitter;
    gain.gain.value=audioClamp((options.volume??1)*data.gain*mix.gain,0,1.25);
    source.connect(gain);
    const destination=this.bus[data.group];
    let panner=null;
    if(location&&this.ctx.createStereoPanner){
      panner=this.ctx.createStereoPanner();panner.pan.value=mix.pan;
      gain.connect(panner);panner.connect(destination);
    }else gain.connect(destination);
    const voice={source,category:data.group,key};
    this.active.add(voice);
    source.onended=()=>{this.active.delete(voice);source.disconnect();gain.disconnect();panner?.disconnect();};
    source.start();
    return true;
  }
  // Keeps existing call signatures (effect('shot')) compatible with Alpha 0.7.
  effect(type,options={}){
    if(!this.ctx||!this.settings.soundEnabled||this.ctx.state!=='running')return false;
    // For voice pools, select all corresponding WAV files loaded before choosing a variant.
    if(this.playSample(type,options))return true;
    // If audio was throttled or muted by distance, do not synthesize a louder fallback.
    const data=SOUND_EVENTS[type];
    if(data){
      const at=this.lastPlayed.get(type)??-Infinity;
      if(this.ctx.currentTime-at<(data.cooldown||0))return false;
      if(this.buffers.size>0&&data.variants.some(n=>this.buffers.has(n)))return false;
      if(options.x!=null&&spatialMix({x:options.x,y:options.y},this.listener,MAX_DISTANCE).gain<.015)return false;
    }
    // Lightweight procedural fallback while downloads/decode are still in progress.
    const fallback={shot:[135,.065,'sawtooth',.13],rifleShot:[105,.095,'sawtooth',.18],shotgun:[75,.19,'sawtooth',.21],hit:[230,.06,'triangle',.06],kill:[96,.13,'square',.07],hurt:[75,.26,'sawtooth',.18],death:[60,.55,'triangle',.26],level:[520,.16,'triangle',.2],upgrade:[700,.18,'triangle',.18],wave:[185,.24,'sawtooth',.15],pickup:[520,.1,'triangle',.18],ammo:[360,.12,'square',.12],grenadeThrow:[180,.12,'triangle',.14],explosion:[73,.42,'sawtooth',.23],bossSpawn:[92,.72,'sawtooth',.23],bossWarn:[290,.28,'sawtooth',.1],bossCharge:[110,.2,'sawtooth',.23],bossCast:[185,.35,'sawtooth',.22],bossDown:[98,.4,'triangle',.28],zombieGrowl:[79,.23,'sawtooth',.12],runnerGrowl:[139,.19,'sawtooth',.1],colossusGrowl:[52,.48,'sawtooth',.18]};
    const cfg=fallback[type];
    if(!cfg)return false;
    if(data)this.lastPlayed.set(type,this.ctx.currentTime);
    this.tone(cfg[0],cfg[1],cfg[2],cfg[3],'fx');return true;
  }
  // Pé na poça: chiado curto de água (ruído filtrado) + "ploc" grave. Sintetizado, sem arquivo.
  puddleStep(sprint=false){
    if(!this.ctx||!this.settings.soundEnabled||this.ctx.state!=='running')return;
    const ctx=this.ctx,now=ctx.currentTime;if(now-(this._lastSplash||0)<.12)return;this._lastSplash=now;
    if(!this._splashBuf){const len=Math.floor(ctx.sampleRate*.25);const b=ctx.createBuffer(1,len,ctx.sampleRate),dd=b.getChannelData(0);for(let i=0;i<len;i++)dd[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);this._splashBuf=b;}
    const src=ctx.createBufferSource();src.buffer=this._splashBuf;src.playbackRate.value=.85+Math.random()*.35;
    const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1400+Math.random()*900;bp.Q.value=.9;
    const g=ctx.createGain();const vol=(sprint?.16:.11);g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(.001,now+.22);
    src.connect(bp);bp.connect(g);g.connect(this.bus?.fx||ctx.destination);src.start(now);src.stop(now+.25);
    const o=ctx.createOscillator(),og=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(190,now);o.frequency.exponentialRampToValueAtTime(85,now+.09);
    og.gain.setValueAtTime(vol*.6,now);og.gain.exponentialRampToValueAtTime(.001,now+.1);o.connect(og);og.connect(this.bus?.fx||ctx.destination);o.start(now);o.stop(now+.11);
  }
  // Low-cost procedural rain and wind, not per-zombie samples or external downloads.
  ensureWeatherAudio(){
    if(!this.ctx||this.weatherVoices||this.ctx.state!=='running')return;
    const ctx=this.ctx,rate=ctx.sampleRate,length=Math.max(1024,Math.floor(rate*1.25));
    const buffer=ctx.createBuffer(1,length,rate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=Math.random()*2-1;
    const make=(high,low)=>{
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const gain=ctx.createGain();gain.gain.value=0;
      const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=high;
      const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=low;
      source.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(this.bus.environment);source.start();
      return {source,gain,hp,lp};
    };
    this.weatherVoices={rain:make(900,5200),wind:make(65,360)};
  }
  pauseWeather(){
    if(!this.weatherVoices||!this.ctx)return;
    for(const node of Object.values(this.weatherVoices))node.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.09);
  }
  updateEnvironment(dt,environment,{paused=false}={}){
    if(!this.ctx||this.ctx.state!=='running')return;
    if(!this.weatherVoices)this.ensureWeatherAudio();
    if(!this.weatherVoices)return;
    const weather=environment||{},active=this.mode!=='menu'&&!paused&&this.settings.soundEnabled;
    const rain=active?Math.max(0,Math.min(.22,(weather.wet||0)*.105)):0;
    const wind=active?Math.max(0,Math.min(.13,.028+(weather.dark||0)*.038+(weather.wet||0)*.037)):0;
    for(const [key,volume] of [['rain',rain],['wind',wind]]){
      this.weatherVoices[key].gain.gain.setTargetAtTime(volume,this.ctx.currentTime,.20);
    }
    // Distant thunder only in substantial rain; no additional game mechanics.
    this.thunderCooldown-=Math.max(0,dt||0);
    if(active&&weather.wet>.72&&this.thunderCooldown<=0){
      this.thunderCooldown=19+Math.random()*22;
      const o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime;
      o.type='triangle';o.frequency.setValueAtTime(56,now);o.frequency.exponentialRampToValueAtTime(28,now+1.9);
      g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.035,now+.12);
      g.gain.exponentialRampToValueAtTime(.0001,now+2.1);
      o.connect(g);g.connect(this.bus.environment);o.start(now);o.stop(now+2.2);
      o.onended=()=>{o.disconnect();g.disconnect();};
    }
  }
  // Global ambient voice scheduler: never one looping voice per zombie.
  updateThreats(dt,enemies,player,{slow=false,paused=false}={}){
    if(!this.ctx||!this.settings.soundEnabled||paused||slow||this.ctx.state!=='running')return;
    this.listener.x=player.x;this.listener.y=player.y;
    this.growlClock-=dt;
    if(this.growlClock>0)return;
    this.growlClock=.85+Math.random()*1.25;
    const selected=chooseVoice(enemies,player);
    if(!selected)return;
    const type=ZOMBIE_VOICE[selected.kind]||'zombieGrowl';
    this.effect(type,{x:selected.x,y:selected.y});
    this.growlCount++;
  }
  stopEffects(){
    if(this.weatherVoices){
      for(const voice of Object.values(this.weatherVoices)){
        try{voice.source.stop();}catch{};
        voice.source.disconnect();voice.gain.disconnect();voice.hp.disconnect();voice.lp.disconnect();
      }
      this.weatherVoices=null;
    }
    for(const voice of [...this.active]){
      try{voice.source.stop();}catch{};
    }
    this.active.clear();
  }
  dispose(){
    this.disposed=true;this.stopMusic();this.stopEffects();
    this.ctx?.close().catch(()=>{});this.ctx=null;
    this.buffers.clear();this.failed.clear();
  }
}

