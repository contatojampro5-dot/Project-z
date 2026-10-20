// -- src/systems/WaveDirector.js --

class WaveDirector {
  constructor(multiplier=1,activeMultiplier=1){
    this.multiplier=multiplier;this.activeMultiplier=activeMultiplier;this.wave=1;this.phase='wave';this.remaining=durationForWave(1);
    this.spawned=0;this.budget=spawnsForWave(1,multiplier);this.tickTime=0;
  }
  get phaseDuration(){return this.phase==='rest'?WAVES.rest:durationForWave(this.wave);}
  get progress(){return Math.max(0,Math.min(1,1-this.remaining/this.phaseDuration));}
  update(dt,spawn,aliveCount=0){
    if(dt<=0)return;
    let remainingDt=dt;
    while(remainingDt>0){
      const used=Math.min(this.remaining,remainingDt);
      this.remaining=Math.max(0,this.remaining-used);remainingDt-=used;
      if(this.phase==='wave'){
        const desired=Math.min(this.budget,Math.floor(1+Math.min(1,this.progress/.97)*(this.budget-1)));
        let attempts=0;
        while(this.spawned<desired&&aliveCount<maxAliveForWave(this.wave,this.activeMultiplier)&&attempts<4){
          attempts++;
          if(!spawn())break;
          this.spawned++;aliveCount++;
        }
      }
      if(this.remaining<=1e-8){
        if(this.phase==='wave'){this.phase='rest';this.remaining=WAVES.rest;}
        else{this.wave++;this.phase='wave';this.remaining=durationForWave(this.wave);this.spawned=0;this.budget=spawnsForWave(this.wave,this.multiplier);}
      }
    }
  }
}

