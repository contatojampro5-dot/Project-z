// -- src/data/config.js --
const GAME = Object.freeze({
  name: 'PROJECT Z',
  version: 'R13-C6B',
  delivery: 'Fase Cronos — Parte 4B: Seleção de personagens',
  map: { width: 2800, height: 2800, tile: 16 },
  fixedStep: 1 / 60,
  maxFrameDelta: 0.1,
  maxDevicePixelRatio: 2,
  colors: {
    oil: '#182c32', turquoise: '#397a78', green: '#a6d66e',
    amber: '#f0ae61', coral: '#e57483', violet: '#a17dcf',
  },
});
const DIFFICULTIES = Object.freeze({
  easy: { id: 'easy', name: 'FÁCIL', label: 'O mundo dá uma chance.', hint: 'Para conhecer a zona.', hp: 130, damage: 0.75, enemies: 0.8, resources: 1.4, tag: 'RECOMENDADO PARA INICIANTES' },
  medium: { id: 'medium', name: 'MÉDIO', label: 'A cidade não perdoa.', hint: 'A experiência original.', hp: 100, damage: 1, enemies: 1, resources: 1, tag: 'EXPERIÊNCIA ORIGINAL' },
  hardcore: { id: 'hardcore', name: 'HARDCORE', label: 'Você foi avisado.', hint: 'Cada recurso importa.', hp: 75, damage: 1.35, enemies: 1.2, resources: 0.75, tag: 'SEM MISERICÓRDIA' },
});


// CRONOS C6B: catálogo de seleção. Sem usar sprites de terceiros ou antecipar habilidades C6C.
const CRONOS_CHARACTERS = Object.freeze([
 {id:'antonio',name:'ANTÔNIO',title:'O SOBREVIVENTE',type:'Inicial',hp:100,speed:100,unlock:0,unlockType:'initial',tag:'INICIAL',symbol:'A',tint:'#c96b64',primary:'Aceleração',detail:'Aumenta a velocidade em 40% por 10 segundos. Recarga de 20 segundos.',passive:'Sobrevivência e mobilidade.',gameplay:true},
 {id:'hadassa',name:'HADASSA',title:'A ENFERMEIRA',type:'Suporte / Mobilidade',hp:70,speed:115,unlock:500,unlockType:'kills',tag:'500 ABATES',symbol:'H',tint:'#81cdb7',primary:'Sobrevida',detail:'Vida máxima +20% por 10 segundos. Ao terminar, o HP retorna proporcionalmente. Recarga de 60 segundos.',passive:'Regeneração: após 40 segundos sem dano, recupera toda a vida em 10 segundos.',gameplay:true},
 {id:'san',name:'SAN',title:'O BOXEADOR',type:'Briga / Resistência',hp:130,speed:85,unlock:20,unlockType:'wave',tag:'ONDA 20',symbol:'S',tint:'#e5a46d',primary:'Punhos de Ferro',detail:'Socos automáticos a cada 1,2 s, 2× dano normal. Ativa eleva para 4× por 5 segundos. Recarga de 20 segundos.',passive:'Maior empurrão e dano corpo a corpo; pode socar e atirar ao mesmo tempo.',gameplay:true},
 {id:'hanna',name:'HANNA',title:'A CIENTISTA',type:'Química / Física',hp:100,speed:100,unlock:2000,unlockType:'kills',tag:'2.000 ABATES',symbol:'H',tint:'#c6a7e3',primary:'Minas Improvisadas',detail:'Coloca até 5 minas consecutivas, armadas após 1,5 s. Recarga do lote em 30 segundos.',passive:'Detonação por proximidade e explosões em cadeia com intervalos de 0,25 s.',gameplay:true}
]);
function cronosCharacterProgress(save){
 const kills=save.characterProgress?.kills||0;
 const bestWave=save.characterProgress?.bestWave||0;
 return {kills,bestWave};
}
function cronosIsCharacterUnlocked(character,save){
 if(character&&save?.settings?.devUnlockAll)return true; // A4: modo teste
 if(!character || character.unlockType==='initial')return Boolean(character);
 const p=cronosCharacterProgress(save);
 return character.unlockType==='wave'?p.bestWave>=character.unlock:p.kills>=character.unlock;
}
// R13-C6B.1 — Silhuetas ORIGINAIS provisórias (contorno com luz de recorte).
// Arte final dos personagens permanece reservada para a Fase Atlas.
function pzCharFigure(char,mode='full',uid=''){
 const t=char.tint,id=`${char.id}-${mode}${uid}`;
 const P={
  antonio:{
   back:'<path d="M58 104 Q44 100 46 150 L50 196 L66 196 Z M142 104 Q156 100 154 150 L150 196 L134 196 Z"/>',
   body:'<path d="M75 204 L70 292 L72 372 L96 374 L98 292 L100 222 L102 292 L104 374 L128 372 L130 292 L125 204 Z"/><path d="M66 370 Q64 386 98 386 L98 372 Z M134 370 Q136 386 102 386 L102 372 Z"/><path d="M64 98 Q100 86 136 98 L146 118 L142 214 L58 214 L54 118 Z"/><path d="M62 100 Q48 106 47 134 L42 204 Q41 218 52 218 L60 216 L66 146 Z"/><path d="M138 100 Q152 106 153 134 L158 204 Q159 218 148 218 L140 216 L134 146 Z"/><path d="M144 210 h16 v9 h-5 v24 h-7 v-24 h-4 Z"/><path d="M91 70 h18 v22 h-18 Z"/><ellipse cx="100" cy="52" rx="21" ry="25"/><path d="M78 50 Q74 22 98 22 Q112 18 120 30 Q128 36 124 52 Q118 38 104 40 Q96 34 92 42 Q84 40 78 50 Z"/>',
   detail:'<path d="M86 96 L100 132 L114 96 M100 132 V212 M70 104 L74 210 M130 104 L126 210"/>'
  },
  hadassa:{
   back:'<path d="M120 40 Q140 52 134 92 Q130 106 124 112 Q128 84 116 62 Z"/>',
   body:'<path d="M78 206 L74 292 L76 372 L97 374 L99 294 L100 224 L101 294 L103 374 L124 372 L126 292 L122 206 Z"/><path d="M70 370 Q68 386 98 386 L98 372 Z M130 370 Q132 386 102 386 L102 372 Z"/><path d="M70 100 Q100 90 130 100 L138 120 L134 214 L66 214 L62 120 Z"/><path d="M68 102 Q55 108 54 134 L50 202 Q49 216 59 216 L66 214 L72 146 Z"/><path d="M132 102 Q145 108 146 134 L150 202 Q151 216 141 216 L134 214 L128 146 Z"/><path d="M40 182 h34 a4 4 0 0 1 4 4 v30 a4 4 0 0 1 -4 4 h-34 a4 4 0 0 1 -4 -4 v-30 a4 4 0 0 1 4 -4 Z"/><path d="M92 72 h16 v22 h-16 Z"/><ellipse cx="100" cy="53" rx="19" ry="23"/><path d="M80 52 Q78 26 100 26 Q122 26 120 52 Q114 34 100 36 Q86 34 80 52 Z"/>',
   detail:'<path d="M88 98 L100 120 L112 98 M70 108 L136 196 M53 201 h22 M64 190 v22"/>'
  },
  san:{
   back:'',
   body:'<path d="M70 206 L64 292 L66 372 L95 374 L98 292 L100 226 L102 292 L105 374 L134 372 L136 292 L130 206 Z"/><path d="M60 370 Q58 386 97 386 L97 372 Z M140 370 Q142 386 103 386 L103 372 Z"/><path d="M52 104 Q100 84 148 104 L156 126 L146 216 L54 216 L44 126 Z"/><path d="M50 106 Q34 116 36 146 L48 176 Q56 184 66 176 L70 150 Q62 132 66 118 Z"/><path d="M150 106 Q166 116 164 146 L152 176 Q144 184 134 176 L130 150 Q138 132 134 118 Z"/><ellipse cx="74" cy="132" rx="19" ry="21"/><ellipse cx="126" cy="132" rx="19" ry="21"/><path d="M88 72 h24 v24 h-24 Z"/><path d="M70 64 Q66 20 100 18 Q134 20 130 64 Q132 92 116 100 L84 100 Q68 92 70 64 Z"/>',
   detail:'<path d="M82 46 Q100 36 118 46 M60 120 Q74 108 88 120 M112 120 Q126 108 140 120 M70 200 h60"/>'
  },
  hanna:{
   back:'',
   body:'<path d="M80 250 L76 300 L78 372 L97 374 L99 300 L100 260 L101 300 L103 374 L122 372 L124 300 L120 250 Z"/><path d="M72 370 Q70 386 98 386 L98 372 Z M128 370 Q130 386 102 386 L102 372 Z"/><path d="M68 100 Q100 88 132 100 L140 122 L150 268 L120 262 L100 236 L80 262 L50 268 L60 122 Z"/><path d="M66 102 Q53 108 52 134 L48 204 Q47 218 57 218 L65 216 L70 146 Z"/><path d="M134 102 Q147 108 148 134 L152 170 Q154 184 146 188 L136 186 L130 146 Z"/><path d="M140 176 h14 v10 l10 26 q3 10 -8 10 h-18 q-11 0 -8 -10 l10 -26 Z"/><path d="M92 72 h16 v20 h-16 Z"/><ellipse cx="100" cy="53" rx="19" ry="23"/><path d="M78 62 Q72 26 100 25 Q128 26 122 62 L118 66 Q118 40 100 40 Q82 40 82 66 Z"/><path d="M80 36 h40 a6 6 0 0 1 0 12 h-40 a6 6 0 0 1 0 -12 Z"/>',
   detail:'<path d="M86 98 L100 140 L114 98 M100 140 V236 M70 150 h14 M134 205 h28"/><circle cx="90" cy="42" r="5"/><circle cx="110" cy="42" r="5"/>'
  }
 };
 const f=P[char.id]||P.antonio;
 const vb=mode==='bust'?'40 4 120 150':'0 0 200 400';
 return `<svg class="pz-fig pz-fig-${mode}" viewBox="${vb}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><defs><linearGradient id="pzg-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2730"/><stop offset=".55" stop-color="#121218"/><stop offset="1" stop-color="#07070a"/></linearGradient><linearGradient id="pzr-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t}" stop-opacity=".95"/><stop offset=".45" stop-color="${t}" stop-opacity=".12"/><stop offset=".6" stop-color="${t}" stop-opacity=".12"/><stop offset="1" stop-color="${t}" stop-opacity=".85"/></linearGradient></defs><g class="pz-fig-rim" fill="url(#pzr-${id})" stroke="url(#pzr-${id})" stroke-width="5" stroke-linejoin="round">${f.back}${f.body}</g><g class="pz-fig-sil" fill="url(#pzg-${id})">${f.back}${f.body}</g><g class="pz-fig-detail" fill="none" stroke="${t}" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round">${f.detail}</g></svg>`;
}

// R13-C6B.2 — Arte dos personagens enviada pelo autor (WebP comprimido). Antônio usa silhueta até receber arte.
const PZ_CHAR_ART=Object.freeze({"antonio":"@@ASSET:assets/images/game/antonio.webp@@","hadassa":"@@ASSET:assets/images/game/hadassa.919c5b34.webp@@","hanna":"@@ASSET:assets/images/game/hanna.76877cc6.webp@@","san":"@@ASSET:assets/images/game/san.38e63b81.webp@@"});
function pzCharVisual(char,mode='full',uid=''){
 const src=PZ_CHAR_ART[char.id];
 return src?`<img class="pz-cs-art pz-cs-art-${mode}" src="${src}" alt="" decoding="async" draggable="false">`:pzCharFigure(char,mode,uid);
}
function cronosCharacterPortrait(char,large=false){return pzCharFigure(char,large?'full':'bust');}

