// -- src/systems/DiscoverySystem.js --

// Filas impedem que vários inimigos descubertos no mesmo quadro interrompam a partida de uma vez.
class DiscoverySystem {
  constructor(save){this.save=save;this.queue=[];this.queued=new Set();this.active=null;}
  notice(id){
    if(!BESTIARY[id]||this.save.hasDiscovered(id)||this.queued.has(id)||this.active===id)return false;
    this.queue.push(id);this.queued.add(id);return true;
  }
  activate(){
    if(this.active||!this.queue.length)return null;
    const id=this.queue.shift();this.queued.delete(id);
    this.active=id;this.save.discover(id);return BESTIARY[id];
  }
  close(){const last=this.active;this.active=null;return last;}
  get selecting(){return Boolean(this.active);}
}

