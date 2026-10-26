// -- R53 · ÚLTIMA CARTADA · zumbis 3D do Mixamo no jogo do navegador (Afrodite + Ares) --
// Os modelos que o Theo baixou do Mixamo (godot-preview/assets/mixamo) foram fotografados em 8 direções
// (laboratorio/src/mixamo_folhas: three.js + FBXLoader), na mesma célula 64×72 e nas mesmas linhas das folhas antigas:
// andar/correr (0), atacar (8), levar tiro (15), morrer (19) e rastejar sem pernas (28). Para cada um há também a folha
// sem o braço esquerdo e sem o direito. Comum: Prisoner, Warzombie, Copzombie, Parasite, Ch18 e Swat;
// corredor: Yaku e Zombiegirl. window.__PZ_OLD_ZOMBIES=true (antes de começar a partida) volta aos desenhos antigos.
const PZ_MIXAMO=Object.freeze({normal:['prisoner','warzombie','copzombie','parasite','ch18','swat'],runner:['yaku','zombiegirl']});
(function(){
  const cap=s=>'mx'+s[0].toUpperCase()+s.slice(1);
  for(const [kind,list] of Object.entries(PZ_MIXAMO)){
    const spec=PZ_SPRITES[kind],A=spec.anims;
    spec._old={variants:spec.variants,armless:spec.armless,legless:spec.legless};
    spec._new={variants:list.map(cap),legless:null,
      armless:{L:list.map(w=>cap(w)+'SemL'),R:list.map(w=>cap(w)+'SemR'),anims:{walk:A.walk,attack:A.attack,hit:A.hit,death:A.death,crawl:A.crawl}}};
  }
})();
function pzMixamoApply(){
  const old=!!window.__PZ_OLD_ZOMBIES;
  for(const kind of Object.keys(PZ_MIXAMO)){const s=PZ_SPRITES[kind],src=old?s._old:s._new;s.variants=src.variants;s.armless=src.armless;s.legless=src.legless;s.mixamo=!old;}
}
pzMixamoApply();
// partida nova: confere a chave e limpa os corpos (a escolha da folha de cada zumbi é feita no primeiro desenho)
{const _reset=pzResetCorpses;pzResetCorpses=function(){pzMixamoApply();return _reset();};}
// pedaços arrancados: as folhas novas usam as peças do comum/corredor (3 e 2 variações na folha de peças)
{const _part=pzPartVariant;pzPartVariant=function(enemy){
  const spec=enemy&&PZ_SPRITES[enemy.kind];
  if(spec?.mixamo){const v=enemy._sv!=null?enemy._sv:0;return spec.partsBase+(enemy.kind==='normal'?v%3:v%2);}
  return _part(enemy);};}
