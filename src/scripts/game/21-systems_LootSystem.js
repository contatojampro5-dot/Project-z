// -- src/systems/LootSystem.js --


// Drops com frequências escaladas por dificuldade, coleta por proximidade e
// geração em locais livres. Toda aleatoriedade pode ser injetada para testes.
class LootSystem {
  constructor(resourceMultiplier=1, random=Math.random) {
    this.multiplier=Math.max(.3,resourceMultiplier);this.ammoWorldCap=resourceMultiplier>=1.25?5:resourceMultiplier>=.9?3:2;
    this.random=random;
    this.items=[];
    this.nextId=0;
    this.timers={};
    this.clock=0;this.ammoCap=300;this.ammoPack=30;this.armorTier=1;this.shieldWorldCap=18;
    for(const type of ['ammo','heart','grenade','fullHeart'])this.timers[type]=this.nextDelay(type);this.timers.medkit=36;this.timers.shieldCell=13;this.timers.armor=42;this.timers.survivalBag=62;this.timers.attachment=29;
  }
  nextDelay(type){
    if(type==='medkit')return 36+this.random()*22;
    if(type==='shieldCell')return (11+this.random()*8)/this.multiplier;
    if(type==='armor')return 45+this.random()*35;
    if(type==='survivalBag')return 58+this.random()*42;
    if(type==='attachment')return 28+this.random()*20;
    const [min,max]=LOOT[type].interval;
    return (min+(max-min)*this.random())/this.multiplier;
  }
  // Recursos iniciais entram nas bordas da câmera, não surgem sob os pés.
  seedNear(player,camera){
    for(const type of ['ammo','heart','grenade'])this.trySpawn(type,player,camera);
    this.seedShieldCells(player);
  }
  seedShieldCells(player){
    // Pontos espalhados pelos quatro setores, com checagem REAL de colisão e distância.
    // Pontos iniciais persistem até serem coletados; não nascem sob o jogador.
    const sites=[
      [250,515],[855,515],[520,870],[925,1040],
      [1370,500],[1710,745],[2220,470],[2600,950],
      [250,1430],[600,1850],[960,2140],[490,2530],
      [1350,1440],[1700,1740],[2380,1910],[2600,2460],
      [1520,950],[900,1450],[1890,2470],[2700,1400],
    ];
    let added=0;
    for(const [baseX,baseY] of sites){
      if(added>=14||this.items.filter(i=>i.type==='shieldCell').length>=this.shieldWorldCap)break;
      for(const [ox,oy] of [[0,0],[38,0],[-38,0],[0,38],[0,-38],[65,65],[-65,65]]){
        const x=baseX+ox,y=baseY+oy;
        if(Math.hypot(x-player.x,y-player.y)<160)continue;
        const cell=this.add('shieldCell',x,y);
        if(cell){cell.persistent=true;added++;break;}
      }
    }
    return added;
  }
  add(type,x,y,options={}){
    if(!(LOOT[type]||type==='shieldCell'||type==='armor'||type==='medkit'||type==='survivalBag'||type==='attachment')||!canOccupy(x,y,17))return null;
    if(type==='armor'&&this.armorTier>=5)return null;
    if(this.items.some(p=>Math.hypot(p.x-x,p.y-y)<30))return null;
    const item={id:++this.nextId,type,x,y,age:0,phase:this.random()*Math.PI*2,...(type==='ammo'?{remaining:this.ammoPack}:type==='armor'?{tier:this.armorTier+1}:type==='survivalBag'?{capacity:2+Math.floor(this.random()*6)}:type==='attachment'?{slot:['mag','stock','sight','barrel'][Math.floor(this.random()*4)],tier:b3RandomAccessoryTier(this.random)}:{})};
    this.items.push(item);return item;
  }
  addAccessory(x,y,slot,tier){
    if(!['mag','stock','sight','barrel'].includes(slot)||!Number.isInteger(tier)||tier<1||tier>5)return null;
    const item=this.add('attachment',x,y);
    if(item){item.slot=slot;item.tier=tier;}return item;
  }
  canSpawn(type,wave,player,gun){
    if(type==='medkit')return player.backpack.canAdd('medkit')&&this.items.filter(i=>i.type===type).length<2;
    if(type==='shieldCell')return player.shieldCells<5&&player.backpack.canAdd('shieldCell')&&this.items.filter(i=>i.type===type).length<this.shieldWorldCap;
    if(type==='armor')return player.armorTier<5&&this.items.filter(i=>i.type===type&&i.tier===player.armorTier+1).length<2;
    if(type==='survivalBag')return this.items.filter(i=>i.type===type).length<2;
    if(type==='attachment')return this.items.filter(i=>i.type===type).length<3&&player.backpack.canAdd('attachment');
    if(this.items.length>=LOOT.maxWorldPickups||this.items.filter(i=>i.type===type).length>=(type==='ammo'?this.ammoWorldCap:LOOT[type].max))return false;
    if(type==='fullHeart'&&(wave<LOOT.fullHeart.unlockWave||player.hp>player.maxHp*.72))return false;
    if(type==='heart'&&player.hp>=player.maxHp*.92)return false;
    if(type==='ammo'&&gun.reserve>=this.ammoCap)return false;
    return true;
  }
  trySpawn(type,player,camera){
    // Regras da câmera são compartilhadas com inimigos e chefes. 35-110
    // unidades além da borda: próximo o suficiente para recompensar exploração.
    const point=placeOutsideCamera(camera,this.random,{
      radius:19,margin:38,reach:82,attempts:110,player,minPlayerDistance:110,
      accept:(x,y)=>!this.items.some(p=>Math.hypot(p.x-x,p.y-y)<47),
    });
    return point?this.add(type,point.x,point.y):null;
  }
  collect(item,player,gun,grenades){
    switch(item.type){
      case 'heart': {
        const added=player.heal(LOOT.heart.heal);
        return added>0?{label:`+${Math.round(added)} HP`,type:'heart'}:null;
      }
      case 'fullHeart': {
        const added=player.heal(player.maxHp);
        return added>0?{label:'VIDA RESTAURADA',type:'fullHeart'}:null;
      }
      case 'ammo': {
        const amount=Math.min(Math.max(0,this.ammoCap-gun.reserve),item.remaining??this.ammoPack);
        if(amount<=0)return null;
        gun.reserve+=amount;item.remaining=(item.remaining??this.ammoPack)-amount;
        return {label:`+${Math.round(amount)} BALAS`,type:'ammo',keep:item.remaining>0};
      }
      case 'medkit': {
        if(!player.backpack.add('medkit'))return null;return {label:'KIT MÉDICO +1',type:'medkit'};
      }
      case 'shieldCell': {
        if(player.shieldCells>=5||!player.backpack.add('shieldCell'))return null;return {label:'CÉLULA DE ESCUDO +1',type:'shieldCell'};
      }
      case 'survivalBag': {
        const current=player.backpack.capacity;
        const target=item.capacity;
        if(!player.backpack.resize(target))return null; // Não descartar itens ao reduzir a mochila.
        return {label:`MOCHILA ${target} ESPAÇOS ${target<current?'· TROCA REALIZADA':'· EQUIPADA'}`,type:'survivalBag'};
      }
      case 'armor': {
        if(player.armorTier>=5||item.tier!==player.armorTier+1)return null;
        player.equipArmor(item.tier);
        this.armorTier=player.armorTier;
        return {label:'COLETE NÍVEL '+item.tier+' EQUIPADO',type:'armor'};
      }
      case 'attachment': {
        const itemType=b3AccessoryType(item.slot,item.tier);
        if(!player.backpack.add(itemType))return null;
        return {label:`${B3_ACCESSORY_NAMES[item.slot]} · ${ACCESSORY_RARITIES[item.tier-1].name}`,type:'attachment'};
      }
      case 'grenade': {
        if(!grenades.add(1))return null;
        return {label:'GRANADA +1',type:'grenade'};
      }
      default:return null;
    }
  }
  update(dt,{player,gun,grenades,wave,camera,onPickup=()=>{}}){
    if(dt<=0)return;
    this.clock+=dt;
    this.armorTier=player.armorTier;
    // Coletes antigos não ficam no chão depois que Antônio troca para a raridade seguinte.
    this.items=this.items.filter(i=>i.type!=='armor'||(player.armorTier<5&&i.tier===player.armorTier+1));
    for(const type of Object.keys(this.timers)){
      this.timers[type]-=dt;
      if(this.timers[type]<=0){
        const allowed=this.canSpawn(type,wave,player,gun);
        const created=allowed?this.trySpawn(type,player,camera):null;
        // Se não houver borda livre, tentar novamente em breve, sem drops na tela.
        this.timers[type]=allowed&&!created?3.0:this.nextDelay(type);
      }
    }
    const left=[];
    for(const item of this.items){
      item.age+=dt;
      if(item.type!=='ammo'&&item.age>LOOT.lifetime&&!item.persistent)continue;
      if(Math.hypot(player.x-item.x,player.y-item.y)<player.radius+LOOT.collectionRadius-5){
        const result=this.collect(item,player,gun,grenades);
        if(result){onPickup(result,item);if(!result.keep)continue;}
      }
      left.push(item);
    }
    this.items=left.filter(i=>i.type!=='armor'||(player.armorTier<5&&i.tier===player.armorTier+1));
  }
  draw(ctx,camera,assets){
    ctx.save();ctx.lineJoin='round';ctx.textAlign='center';
    for(const item of this.items){
      const pos=camera.worldToScreen(item.x,item.y);
      if(pos.x<-35||pos.x>camera.viewport.width+35||pos.y<-35||pos.y>camera.viewport.height+35)continue;
      const {x,y,type}=item,shade=type==='shieldCell'?'#55baff':type==='medkit'?'#ff6675':type==='armor'?['','#dedede','#4b9fff','#bc70ff','#f15b58','#f5cc56'][item.tier]:type==='survivalBag'?'#c2a77c':type==='attachment'?ACCESSORY_RARITIES[item.tier-1].color:LOOT[type].color;
      ctx.save();ctx.translate(Math.round(x),Math.round(y+Math.sin(this.clock*3+item.phase)*2.4));
      const pulse=.75+.25*Math.sin(this.clock*3+item.phase);
      ctx.globalAlpha=.27*pulse;ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.fillStyle='#132b35';ctx.fillRect(-12,-12,24,24);
      ctx.strokeStyle=shade;ctx.lineWidth=2;ctx.strokeRect(-12,-12,24,24);
      ctx.fillStyle=shade;
      if(type==='attachment'){
        if(item.tier>=4){ctx.globalAlpha=.25;ctx.fillStyle=shade;ctx.fillRect(-3,-64,6,51);ctx.globalAlpha=1;}
        ctx.fillStyle=shade;ctx.fillRect(-8,-5,16,10);ctx.fillRect(-3,-10,6,5);ctx.fillStyle='#101820';ctx.fillRect(-5,-2,10,4);ctx.fillStyle=shade;
      }
      if(type==='survivalBag'){ctx.fillStyle='#bda077';ctx.fillRect(-8,-8,16,18);ctx.fillStyle='#715338';ctx.fillRect(-5,-5,10,9);ctx.fillStyle='#e8d2a8';ctx.fillRect(-2,1,4,5);ctx.fillStyle=shade;}
      if(type==='medkit'){ctx.fillStyle='#fbe6e6';ctx.fillRect(-3,-9,6,18);ctx.fillRect(-9,-3,18,6);ctx.fillStyle=shade;}
      if(type==='heart'||type==='fullHeart'){
        const s=type==='fullHeart'?1.17:1;ctx.scale(s,s);
        // Pixel heart, no fonts / downloads.
        for(const [px,py,w,h] of [[-8,-6,6,5],[2,-6,6,5],[-10,-1,20,5],[-8,4,16,4],[-5,8,10,3],[-2,11,4,2]])ctx.fillRect(px,py,w,h);
        if(type==='fullHeart'){ctx.fillStyle='#fff1d3';ctx.fillRect(-4,-4,3,3);ctx.fillRect(3,-4,2,2);}
      } else if(type==='ammo'){
        ctx.fillStyle='#fff5db';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText(String(item.remaining??30),0,21);ctx.fillStyle=shade;
        for(let i=-1;i<=1;i++){ctx.fillRect(i*6-2,-8,5,15);ctx.fillStyle='#fff0c6';ctx.fillRect(i*6-2,-9,5,3);ctx.fillStyle=shade;}
      } else if(type==='attachment'){
        ctx.fillStyle=shade;ctx.font='bold 9px monospace';ctx.fillText(String(item.tier),0,20);
      } else if(type==='shieldCell'){
        ctx.fillStyle='#d9f6ff';ctx.fillRect(-6,-8,12,16);ctx.fillStyle='#4b9bff';ctx.fillRect(-3,-5,6,10);ctx.fillStyle='#fff';ctx.fillRect(-1,-3,2,6);
      } else if(type==='armor'){
        ctx.fillStyle=shade;ctx.beginPath();ctx.moveTo(-9,-8);ctx.lineTo(-3,-11);ctx.lineTo(3,-11);ctx.lineTo(9,-8);ctx.lineTo(7,5);ctx.lineTo(0,11);ctx.lineTo(-7,5);ctx.closePath();ctx.fill();ctx.fillStyle='#132b35';ctx.font='bold 10px monospace';ctx.fillText(String(item.tier),0,4);
      } else if(type==='grenade'){
        ctx.fillRect(-6,-4,12,13);ctx.fillRect(-4,-7,8,3);ctx.fillRect(-2,-10,5,3);
        ctx.fillRect(5,-6,4,2);ctx.fillStyle='#213d31';ctx.fillRect(-3,0,6,5);
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // UI pode consultar distância de suprimentos para indicar exploração do mapa.
  nearbyCount(player,range=215){return this.items.filter(i=>Math.hypot(player.x-i.x,player.y-i.y)<=range).length;}
}

