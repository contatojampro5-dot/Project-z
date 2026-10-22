// -- src/core/Voices.js --
// R28 · vozes das falas (ElevenLabs): Antônio, Hadassa, Hanna e San.
// Cada fala tem um arquivo próprio (PZ_VOICE_FILES, gerado em 08c). Quando a legenda de uma fala aparece,
// a voz toca junto e a legenda fica na tela pelo tempo do áudio. Pausar o jogo pausa a voz; a morte e o
// fim da partida cortam a voz. Volume: "VOZES" nas configurações (junto do volume geral).
const _pzVoice={el:null,line:null,dir:null,paused:false};
function pzVoiceVolume(){
  const s=window.__projectZGame?.save?.settings||{};
  if(s.soundEnabled===false)return 0;
  const v=Number.isFinite(s.voiceVolume)?s.voiceVolume:1,m=Number.isFinite(s.masterVolume)?s.masterVolume:1;
  return Math.max(0,Math.min(1,v*m));
}
function pzVoiceStop(){
  const e=_pzVoice.el;if(e){try{e.pause();e.removeAttribute('src');e.load();}catch{}}
  _pzVoice.el=null;_pzVoice.line=null;_pzVoice.dir=null;_pzVoice.paused=false;
}
function pzVoicePlay(dir,line){
  pzVoiceStop();
  const ch=dir.charId||'antonio',url=typeof PZ_VOICE_FILES!=='undefined'&&PZ_VOICE_FILES[ch]?.[line.id];
  if(!url)return;
  const vol=pzVoiceVolume();if(vol<=0.001)return;
  const e=new Audio(url);e.preload='auto';e.volume=vol;
  _pzVoice.el=e;_pzVoice.line=line;_pzVoice.dir=dir;
  // a legenda acompanha a voz: fica até o fim do áudio (+ um respiro)
  e.addEventListener('loadedmetadata',()=>{
    if(_pzVoice.el!==e||dir.active!==line||!Number.isFinite(e.duration))return;
    line.until=Math.max(line.until,line.started+e.duration+.45);
  });
  e.play().catch(()=>{}); // navegador pode bloquear antes do primeiro toque; a legenda segue normal
}
const _pzDialogueUpdate=DialogueDirector.prototype.update;
DialogueDirector.prototype.update=function(dt,opts={}){
  const blocked=!!opts.blocked||dt<=0;
  if(blocked){
    if(_pzVoice.el&&_pzVoice.dir===this&&!_pzVoice.paused){try{_pzVoice.el.pause();}catch{}_pzVoice.paused=true;}
    return _pzDialogueUpdate.call(this,dt,opts);
  }
  if(_pzVoice.paused&&_pzVoice.dir===this&&_pzVoice.el){_pzVoice.paused=false;_pzVoice.el.play().catch(()=>{});}
  const before=this.active;
  const r=_pzDialogueUpdate.call(this,dt,opts);
  if(this.active!==before){
    if(this.active)pzVoicePlay(this,this.active);
    else if(_pzVoice.dir===this)pzVoiceStop();
  }else if(this.active&&_pzVoice.el&&_pzVoice.line===this.active)_pzVoice.el.volume=pzVoiceVolume();
  return r;
};
const _pzDialogueHide=DialogueDirector.prototype.hide;
DialogueDirector.prototype.hide=function(){if(_pzVoice.dir===this)pzVoiceStop();return _pzDialogueHide.call(this);};
// sair da partida (menu, reiniciar) também corta a voz
document.addEventListener('visibilitychange',()=>{if(document.hidden&&_pzVoice.el&&!_pzVoice.paused){try{_pzVoice.el.pause();}catch{}_pzVoice.paused=true;}});
