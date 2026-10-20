// -- src/progression/Progression.js --

class Progression {
  constructor(random=Math.random){this.random=random;this.xp=0;this.level=1;this.pending=0;this.selecting=false;this.offers=[];this.levels={};this.weapon='pistol';this.pendingLevels=[];this.specialBranch=null;this.specialTier=0;this.choiceLevel=0;this.specialMoment=false;}
  get threshold(){return xpForLevel(this.level+1);}
  get currentLevelXP(){return xpForLevel(this.level);}
  get progress(){return (this.xp-this.currentLevelXP)/Math.max(1,this.threshold-this.currentLevelXP);}
  gain(amount){
    if(!Number.isFinite(amount)||amount<=0)return 0;
    this.xp+=amount;let gained=0;
    while(this.xp>=xpForLevel(this.level+1) && gained<100){this.level++;this.pending++;this.pendingLevels.push(this.level);gained++;}
    return gained;
  }
  available(){return UPGRADES.filter(u=>u.level<=this.level&&(this.levels[u.id]||0)<u.max&&(u.type!=='weapon'||u.id!==this.weapon));}
  generateOffers(){
    const milestoneIndex=SPECIAL_MILESTONES.indexOf(this.choiceLevel);
    if(milestoneIndex!==-1){
      this.specialMoment=true;
      const tier=milestoneIndex+1;
      if(tier===1 && !this.specialBranch)return Object.values(SURVIVAL_TRACKS).map(branch=>branch[0]);
      if(this.specialBranch && this.specialTier===tier-1)return [SURVIVAL_TRACKS[this.specialBranch][tier-1]];
    }
    this.specialMoment=false;
    const items=this.available().slice();
    for(let i=items.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
    // Garantir possibilidade de evolução da arma quando ainda usa a pistola.
    if(this.weapon==='pistol'){
      const option=items.find(i=>i.type==='weapon');
      if(option){items.splice(items.indexOf(option),1);items.unshift(option);}
    }
    return items.slice(0,4);
  }
  beginChoice(){
    if(this.selecting||this.pending<=0)return false;
    this.choiceLevel=this.pendingLevels[0]??this.level;
    this.selecting=true;this.offers=this.generateOffers();
    // Ao esgotar todos os upgrades, os níveis não ficam travados por menus vazios.
    if(!this.offers.length){this.pending=0;this.selecting=false;return false;}
    return true;
  }
  choose(id){
    if(!this.selecting||!this.offers.some(o=>o.id===id))return null;
    const item=UPGRADE_BY_ID[id]||SPECIAL_BY_ID[id];
    if(!item)return null;
    this.levels[id]=(this.levels[id]||0)+1;
    if(item.type==='weapon')this.weapon=id;
    if(item.type==='special'){
      if(item.tier===1)this.specialBranch=item.branch;
      this.specialTier=item.tier;
    }
    this.pending--;this.pendingLevels.shift();this.selecting=false;this.offers=[];this.specialMoment=false;
    return item;
  }
  levelOf(id){return this.levels[id]||0;}
}

