// -- src/data/assets.js --
// A base deriva da URL da página: funciona em subdiretórios e no preview offline.
const spriteURL = name => ({"barrel.png": "@@ASSET:assets/images/game/barrel.04dc874e.png@@", "car-coral.png": "@@ASSET:assets/images/game/car-coral.014b316a.png@@", "car-amber.png": "@@ASSET:assets/images/game/car-amber.77c4289a.png@@", "streetlamp.png": "@@ASSET:assets/images/game/streetlamp.26b3a4ea.png@@", "car-teal.png": "@@ASSET:assets/images/game/car-teal.9db120b0.png@@", "antonio-sheet.png": "@@ASSET:assets/images/game/antonio-sheet.667151bf.png@@", "survivor.png": "@@ASSET:assets/images/game/survivor.6b3b0ace.png@@", "crate.png": "@@ASSET:assets/images/game/crate.8397f9ee.png@@", "medkit.png": "@@ASSET:assets/images/game/medkit.b16126f9.png@@"})[name];
const ASSETS = {
  survivorSheet: spriteURL('antonio-sheet.png'),
  survivor: spriteURL('survivor.png'),
  carCoral: spriteURL('car-coral.png'),
  carTeal: spriteURL('car-teal.png'),
  carAmber: spriteURL('car-amber.png'),
  crate: spriteURL('crate.png'),
  medkit: spriteURL('medkit.png'),
  barrel: spriteURL('barrel.png'),
  streetlamp: spriteURL('streetlamp.png'),
};

// G.3.1.8: retratos e atlases de 8 direções / 4 frames para zumbis.
ASSETS.zombie = '@@ASSET:assets/images/game/zombie.fc11de90.png@@';
ASSETS.zombieAtlas = '@@ASSET:assets/images/game/zombieAtlas.095fe4e2.png@@';
ASSETS.runner = '@@ASSET:assets/images/game/runner.49c6e247.png@@';
ASSETS.runnerAtlas = '@@ASSET:assets/images/game/runnerAtlas.6421e857.png@@';
ASSETS.bomber = '@@ASSET:assets/images/game/bomber.aa7adbe5.png@@';
ASSETS.bomberAtlas = '@@ASSET:assets/images/game/bomberAtlas.6ce0d8a6.png@@';
ASSETS.spitter = '@@ASSET:assets/images/game/spitter.ea549a18.png@@';
ASSETS.spitterAtlas = '@@ASSET:assets/images/game/spitterAtlas.a4ff77f6.png@@';
ASSETS.tank = '@@ASSET:assets/images/game/tank.3d6ab902.png@@';
ASSETS.tankAtlas = '@@ASSET:assets/images/game/tankAtlas.af6f6a4a.png@@';
ASSETS.summoner = '@@ASSET:assets/images/game/summoner.c884a09d.png@@';
ASSETS.summonerAtlas = '@@ASSET:assets/images/game/summonerAtlas.bea169c7.png@@';
ASSETS.colossus = '@@ASSET:assets/images/game/colossus.7a570491.png@@';
ASSETS.colossusAtlas = '@@ASSET:assets/images/game/colossusAtlas.d3807ea4.png@@';
ASSETS.hive = '@@ASSET:assets/images/game/hive.bc6d49ed.png@@';
ASSETS.hiveAtlas = '@@ASSET:assets/images/game/hiveAtlas.efbc0907.png@@';

