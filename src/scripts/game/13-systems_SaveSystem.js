// -- src/systems/SaveSystem.js --


// PROJECT Z — BLOCO 5: preferências visuais e comandos configuráveis.
const GRAPHIC_LEVELS=Object.freeze(['low','medium','high']);
const GRAPHIC_DEFAULTS=Object.freeze({graphicsQuality:'medium',shadowsQuality:'medium',particlesQuality:'medium',lightingQuality:'medium',weatherQuality:'medium'});
const KEYBIND_DEFAULTS=Object.freeze({up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD',reload:'KeyR',grenade:'KeyG',backpack:'KeyI',backpackAlt:'Tab',consumable:'KeyV',medkit:'KeyH',skill:'Space',interact:'KeyE',weapon1:'Digit1',weapon2:'Digit2',pause:'Escape'});
const KEYBIND_NAMES=Object.freeze({up:'MOVER PARA CIMA',left:'MOVER PARA ESQUERDA',down:'MOVER PARA BAIXO',right:'MOVER PARA DIREITA',reload:'RECARREGAR',grenade:'GRANADA',backpack:'INVENTÁRIO (I)',backpackAlt:'INVENTÁRIO (TAB)',consumable:'ESCUDO',medkit:'CURA RÁPIDA',skill:'HABILIDADE ESPECIAL',interact:'INTERAGIR',weapon1:'ARMA PRINCIPAL',weapon2:'ARMA SECUNDÁRIA',pause:'PAUSAR'});
function graphicLevel(value){return GRAPHIC_LEVELS.includes(value)?value:'medium';}
function keyFor(action){const keys=window.__projectZGame?.save?.settings?.keybinds;return keys&&Object.hasOwn(keys,action)?keys[action]:KEYBIND_DEFAULTS[action];}
function pzKeyName(v){return v===null?'SEM TECLA':String(v||'').replace(/^Key/,'').replace(/^Digit/,'').replace('Escape','ESC').replace('Space','ESPAÇO').replace('Tab','TAB');}
const PAD_BIND_DEFAULTS=Object.freeze({confirm:0,special:1,reload:2,swap:3,heal:4,grenade:5,shield:6,fire:7,inventory:8,pause:9,interact:0});
const PAD_BIND_NAMES=Object.freeze({confirm:'CONFIRMAR NOS MENUS',special:'HABILIDADE',reload:'RECARREGAR',swap:'TROCAR ARMA',heal:'CURA RÁPIDA',grenade:'GRANADA',shield:'ESCUDO',fire:'ATIRAR',inventory:'INVENTÁRIO',pause:'PAUSAR',interact:'INTERAGIR'});
const GRAPHIC_SCALE=Object.freeze({low:.45,medium:1,high:1.18});
const KEY = 'project-z:save:v1';
function createDefaultSave() {
  return {
    version: 1,
    settings: { difficulty: 'medium', musicEnabled: true, soundEnabled: true, masterVolume: 1, menuMusicVolume: 1, gameMusicVolume: 1, musicVolume: 0.42, effectsVolume: 0.65, voiceVolume: 1, weaponsVolume: .9, creaturesVolume: .8, environmentVolume: .8, uiVolume: .85, reducedMotion: false, showPerformance: false, ...GRAPHIC_DEFAULTS, keybinds:{...KEYBIND_DEFAULTS},padbinds:{...PAD_BIND_DEFAULTS},touchLayout:null,axisTuning:{moveSensitivity:1,aimSensitivity:1,moveDead:.14,aimDead:.16},vibration:{shots:true,damage:true,explosions:true} },
    statistics: { plays: 0, totalZombies: 0, totalSurvivalSeconds: 0 },
    characterProgress: { kills: 0, bestWave: 0 },
    records: { easy: null, medium: null, hardcore: null },
    bestiary: { unlocked: {}, kills: {}, deaths: {}, firstSeen: {} },
  };
}
function normalizeSave(data) {
  const base = createDefaultSave();
  if (!data || typeof data !== 'object' || data.version !== 1) return base;
  const settings = { ...base.settings, ...(data.settings && typeof data.settings === 'object' ? data.settings : {}) };
  if (!DIFFICULTIES[settings.difficulty]) settings.difficulty = 'medium';
  if(!CRONOS_CHARACTERS.some(c=>c.id===settings.selectedCharacter))settings.selectedCharacter='antonio';
  for (const k of ['masterVolume', 'menuMusicVolume', 'gameMusicVolume', 'musicVolume', 'effectsVolume', 'voiceVolume', 'weaponsVolume', 'creaturesVolume', 'environmentVolume', 'uiVolume']) settings[k] = Number.isFinite(settings[k]) ? Math.max(0, Math.min(1, settings[k])) : base.settings[k];
  for (const k of ['musicEnabled', 'soundEnabled', 'reducedMotion', 'showPerformance']) settings[k] = Boolean(settings[k]);
  for(const key of Object.keys(GRAPHIC_DEFAULTS))settings[key]=graphicLevel(settings[key]);
  const stored={...(settings.keybinds&&typeof settings.keybinds==='object'?settings.keybinds:{})};
  // Migrate the old R13-C4F default P to the approved Esc, without overriding custom modern bindings.
  if(!Object.hasOwn(stored,'skill')&&stored.pause==='KeyP')stored.pause='Escape';
  settings.keybinds={...KEYBIND_DEFAULTS};
  const assigned=new Set();
  for(const action of Object.keys(KEYBIND_DEFAULTS)){
    let code=Object.hasOwn(stored,action)?stored[action]:KEYBIND_DEFAULTS[action];
    if(code!==null&&(!(/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Tab|Escape|ShiftLeft|ShiftRight|ControlLeft|ControlRight)$/.test(code))||assigned.has(code)))code=null;
    settings.keybinds[action]=code;
    if(code!==null)assigned.add(code);
  }
  const inputPad=settings.padbinds&&typeof settings.padbinds==='object'?settings.padbinds:{};
  settings.padbinds={...PAD_BIND_DEFAULTS};
  const padUsed=new Set();
  for(const action of Object.keys(PAD_BIND_DEFAULTS)){
    let index=Object.hasOwn(inputPad,action)?inputPad[action]:PAD_BIND_DEFAULTS[action];
    // Default A/Cross serves both menu confirmation and in-world interaction.
    const sharedDefault=action==='interact'&&index===0&&settings.padbinds.confirm===0;
    if(index!==null&&(!Number.isInteger(index)||index<0||index>16||(padUsed.has(index)&&!sharedDefault)))index=null;
    settings.padbinds[action]=index;
    if(index!==null)padUsed.add(index);
  }
  const layout=settings.touchLayout;
  settings.touchLayout=layout&&['move','aim'].every(k=>Number.isFinite(layout[k]?.x)&&Number.isFinite(layout[k]?.y)&&layout[k].x>=8&&layout[k].x<=92&&layout[k].y>=45&&layout[k].y<=94)?{move:{x:layout.move.x,y:layout.move.y},aim:{x:layout.aim.x,y:layout.aim.y}}:null;
  const rawTune=settings.axisTuning||{};
  settings.axisTuning={};
  for(const k of ['moveSensitivity','aimSensitivity'])settings.axisTuning[k]=Math.max(.45,Math.min(1.6,Number(rawTune[k])||1));
  for(const k of ['moveDead','aimDead'])settings.axisTuning[k]=Math.max(.05,Math.min(.32,Number(rawTune[k])||.16));
  const vib=settings.vibration||{};
  settings.vibration={shots:vib.shots!==false,damage:vib.damage!==false,explosions:vib.explosions!==false};
  const statistics = { ...base.statistics, ...(data.statistics && typeof data.statistics === 'object' ? data.statistics : {}) };
  for (const k of Object.keys(base.statistics)) statistics[k] = Number.isFinite(statistics[k]) ? Math.max(0, statistics[k]) : 0;
  const records = { ...base.records };
  for (const id of Object.keys(records)) {
    const record = data.records?.[id];
    if (record && Number.isFinite(record.wave) && Number.isFinite(record.seconds)) records[id] = {
      wave: Math.max(0, record.wave), seconds: Math.max(0, record.seconds), kills: Math.max(0, record.kills || 0), date: typeof record.date === 'string' ? record.date : '',
    };
  }
  const bestiary={unlocked:{},kills:{},deaths:{},firstSeen:{}};
  for(const id of Object.keys(BESTIARY)){
    if(data.bestiary?.unlocked?.[id]===true){
      bestiary.unlocked[id]=true;
      const when=data.bestiary?.firstSeen?.[id];
      if(typeof when==='string'&&when.length<64)bestiary.firstSeen[id]=when;
    }
    for(const k of ['kills','deaths']){
      const count=data.bestiary?.[k]?.[id];
      if(Number.isSafeInteger(count)&&count>=0)bestiary[k][id]=Math.min(count,1e9);
    }
  }
  // Migração segura: preserva as eliminações e ondas registradas nas versões anteriores.
  const historicalKills=Math.max(statistics.totalZombies,Object.values(bestiary.kills).reduce((n,v)=>n+v,0));
  const historicalWave=Math.max(0,...Object.values(records).map(x=>x?.wave||0));
  const storedProgress=data.characterProgress||{};
  const characterProgress={
    kills:Math.max(historicalKills,Number.isSafeInteger(storedProgress.kills)?storedProgress.kills:0),
    bestWave:Math.max(historicalWave,Number.isSafeInteger(storedProgress.bestWave)?storedProgress.bestWave:0)
  };
  return { version: 1, settings, statistics, records, bestiary, characterProgress };
}
class SaveSystem {
  constructor(storage = null) {
    if (!storage) {
      try { storage = globalThis.localStorage; }
      catch { storage = { getItem: () => null, setItem: () => {} }; }
    }
    this.storage = storage;
    try { this.data = normalizeSave(JSON.parse(storage.getItem(KEY))); }
    catch { this.data = createDefaultSave(); }
  }
  persist() { try { this.storage.setItem(KEY, JSON.stringify(this.data)); return true; } catch { return false; } }
  setSettings(patch) { this.data = normalizeSave({ ...this.data, settings: { ...this.data.settings, ...patch } }); this.persist(); return this.data.settings; }
  get settings() { return this.data.settings; }
  get records() { return this.data.records; }
  get statistics() { return this.data.statistics; }
  get characterProgress(){return this.data.characterProgress;}
  recordCharacterKill(){this.data.characterProgress.kills++;this.persist();}
  recordCharacterWave(wave){
    if(!Number.isFinite(wave)||wave<=this.data.characterProgress.bestWave)return;
    this.data.characterProgress.bestWave=Math.floor(wave);this.persist();
  }
  get bestiary(){return this.data.bestiary;}
  hasDiscovered(id){return this.data.bestiary.unlocked[id]===true;}
  discover(id,now=new Date().toISOString()){
    if(!BESTIARY[id]||this.hasDiscovered(id))return false;
    this.data.bestiary.unlocked[id]=true;
    this.data.bestiary.firstSeen[id]=now;
    this.persist();return true;
  }
  recordInfectedKill(id){
    if(!BESTIARY[id])return false;
    this.data.bestiary.kills[id]=(this.data.bestiary.kills[id]||0)+1;
    this._killsSincePersist=(this._killsSincePersist||0)+1;
    if(this._killsSincePersist>=8){this._killsSincePersist=0;this.persist();}
    return true;
  }
  recordInfectedDeath(id){
    if(!BESTIARY[id])return false;
    this.data.bestiary.deaths[id]=(this.data.bestiary.deaths[id]||0)+1;
    this.persist();return true;
  }
  // Reservado para a entrega de gameplay. Não registra partidas de prévia da fundação.
  registerRun({ difficulty, wave, seconds, kills }) {
    if (!DIFFICULTIES[difficulty]) throw new Error('Dificuldade inválida');
    const next = { wave, seconds, kills, date: new Date().toISOString() };
    const prev = this.data.records[difficulty];
    if (!prev || wave > prev.wave || (wave === prev.wave && seconds > prev.seconds)) this.data.records[difficulty] = next;
    this.data.statistics.plays++;
    this.data.statistics.totalZombies += kills;
    this.recordCharacterWave(wave);
    this.data.statistics.totalSurvivalSeconds += seconds;
    this.persist();
  }
}
const SAVE_KEY = KEY;

