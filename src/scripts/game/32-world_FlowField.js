// -- src/world/FlowField.js --


// A shared reverse-distance field per entity footprint. Computed only when the
// target changes tile; all zombies use the same field, avoiding one A* per zombie.
const NEIGHBORS=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
class FlowField {
  constructor({cell=40,radius=15,width=GAME.map.width,height=GAME.map.height,walkable=null}={}){
    this.cell=cell;this.radius=radius;this.width=width;this.height=height;
    this.cols=Math.ceil(width/cell);this.rows=Math.ceil(height/cell);this.total=this.cols*this.rows;
    this.walkable=new Uint8Array(this.total);
    for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){
      const cx=Math.min(width-radius-1,x*cell+cell/2),cy=Math.min(height-radius-1,y*cell+cell/2);
      this.walkable[y*this.cols+x]=+(walkable?walkable(cx,cy,radius):canOccupy(cx,cy,radius));
    }
    this.distance=new Int32Array(this.total);this.distance.fill(-1);
    this.goal=-1;this.builds=0;
  }
  index(x,y){const gx=Math.floor(x/this.cell),gy=Math.floor(y/this.cell);return gx>=0&&gy>=0&&gx<this.cols&&gy<this.rows?gy*this.cols+gx:-1;}
  canStep(a,b){
    if(b<0||!this.walkable[b])return false;
    const ax=a%this.cols,ay=(a/this.cols)|0,bx=b%this.cols,by=(b/this.cols)|0;
    if(Math.abs(bx-ax)>1||Math.abs(by-ay)>1)return false;
    if(ax!==bx&&ay!==by)return !!this.walkable[ay*this.cols+bx]&&!!this.walkable[by*this.cols+ax];
    return true;
  }
  neighbors(index){
    const x=index%this.cols,y=(index/this.cols)|0;
    const out=[];
    for(const [dx,dy] of NEIGHBORS){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=this.cols||ny>=this.rows)continue;
      const next=ny*this.cols+nx;if(this.canStep(index,next))out.push(next);
    }
    return out;
  }
  updateGoal(x,y){
    const target=this.index(x,y);if(target===this.goal)return false;
    this.goal=target;this.builds++;this.distance.fill(-1);
    if(target<0)return true;
    // Goal may fall into a blocked coarse cell near a wall. Find the nearest
    // open tile so that enemies still have a route near the player's location.
    let goal=target;
    if(!this.walkable[goal]){
      let best=Infinity;
      for(let i=0;i<this.total;i++)if(this.walkable[i]){
        const dx=i%this.cols-target%this.cols,dy=((i/this.cols)|0)-((target/this.cols)|0),d=dx*dx+dy*dy;
        if(d<best){best=d;goal=i;}
      }
    }
    const queue=new Int32Array(this.total);let head=0,tail=0;queue[tail++]=goal;this.distance[goal]=0;
    while(head<tail){const current=queue[head++],nextDist=this.distance[current]+1;
      for(const next of this.neighbors(current))if(this.distance[next]<0){this.distance[next]=nextDist;queue[tail++]=next;}
    }
    return true;
  }
  direction(x,y){
    const index=this.index(x,y);if(index<0)return null;
    const options=this.neighbors(index);
    let best=-1,bestScore=Infinity;
    // Prefer improving the field, and use the actual target position for the
    // final tile rather than jittering between adjacent centers.
    const current=this.distance[index];
    for(const next of options){const d=this.distance[next];if(d>=0&&d<bestScore&& (current<0||d<current)){best=next;bestScore=d;}}
    if(best<0)return null;
    const tx=(best%this.cols+.5)*this.cell,ty=(((best/this.cols)|0)+.5)*this.cell;
    const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy)||1;
    return {x:dx/len,y:dy/len};
  }
}
class EnemyNavigation {
  constructor(){this.small=new FlowField({radius:15});this.heavy=new FlowField({radius:22});this.last={x:NaN,y:NaN};}
  rebuild(player){this.small=new FlowField({radius:15});this.heavy=new FlowField({radius:22});if(player)this.update(player);}
  update(player){this.small.updateGoal(player.x,player.y);this.heavy.updateGoal(player.x,player.y);}
  steer(enemy,player,desired={x:player.x-enemy.x,y:player.y-enemy.y}){
    const len=Math.hypot(desired.x,desired.y)||1;
    const direct={x:desired.x/len,y:desired.y/len};
    const field=(enemy.radius>=19?this.heavy:this.small);
    // Direct line of sight is fast and prevents path field grid artifacts.
    const pathClear=canTravel(enemy.x,enemy.y,player.x,player.y,enemy.radius);
    if(pathClear)return direct;
    return field.direction(enemy.x,enemy.y)||direct;
  }
}
// A small number of swept samples gives radius-aware line of sight and avoids
// steering directly through building corners. Used only inside the navigation
// system when enemies are near an obstruction.
function canTravel(ax,ay,bx,by,radius=13){
  return !segmentHitsWall(ax,ay,bx,by,radius);
}

// Q.05.6: verificações determinísticas de integridade da mochila, acionáveis no console.
function q056AuditBackpack(){
  const results=[];
  const check=(name,ok)=>results.push({name,passed:!!ok});
  const bag=new SurvivalBackpack(7);
  check('pilhas de 2',bag.add('medkit',3)===3&&bag.count('medkit')===3);
  check('capacidade bloqueia excesso',bag.add('shieldCell',12)===10&&bag.count('shieldCell')===10);
  check('redução não perde itens',bag.resize(2)===false&&bag.count('shieldCell')===10);
  const compact=new SurvivalBackpack(4);
  compact.slots=[{type:'medkit',qty:1},{type:'medkit',qty:1},{type:'shieldCell',qty:1},null];
  check('compactação permite mochila menor',compact.resize(2)===true&&compact.count('medkit')===2&&compact.count('shieldCell')===1);
  const partial=new SurvivalBackpack(2);
  partial.slots=[{type:'medkit',qty:1},{type:'medkit',qty:2}];
  check('agrupamento parcial',partial.moveSlot(0,1)===true&&partial.slots[0].qty===1&&partial.slots[1].qty===2); // slot de destino cheio: não move, mas mantém integridade
  check('integridade após movimentação',partial.count('medkit')===3);
  return {passed:results.every(r=>r.passed),results};
}
// Q.05.8: testes determinísticos de sobrevivência (console: q058AuditSurvival()).
function q058AuditSurvival(){
  const results=[];
  const check=(name,ok)=>results.push({name,passed:Boolean(ok)});
  const p=new Player(100);
  check('colete inicial 1 barra',p.armorTier===1&&p.maxShield===25&&p.shield===25);
  for(let tier=1;tier<=5;tier++){
    p.equipArmor(tier);
    check(`colete nível ${tier}`,p.armorTier===tier&&p.maxShield===tier*25&&p.shield===p.maxShield);
  }
  p.equipArmor(1);p.invulnerable=0;p.takeDamage(35);
  check('dano atravessa escudo',p.shield===0&&p.hp===90&&p.lastDamageReport.healthDamage===10);
  check('quebra sinalizada',p.lastDamageReport.shieldBroken===true);
  p.equipArmor(3);check('troca restaura proteção',p.shield===75);
  p.backpack.add('shieldCell',2);p.invulnerable=0;p.takeDamage(30);
  check('inicia célula',p.startShieldCharge()===true&&p.shieldCharge===3);
  check('recarga não antecipa consumo',p.updateShieldCharge(2.9)===false&&p.shieldCells===2);
  check('recarga termina em 3s',p.updateShieldCharge(.1)===true&&p.shield===70&&p.shieldCells===1);
  p.backpack.add('medkit',1);p.hp=30;
  check('inicia kit',p.startMedkit()===true&&p.medkitCharge===3);
  check('kit impede célula simultânea',p.startShieldCharge()===false);
  check('kit não cura antes do prazo',p.updateMedkit(2.9)===false&&p.hp===30);
  check('kit cura ao completar',p.updateMedkit(.1)===true&&p.hp===80&&p.medkits===0);
  const bag=new SurvivalBackpack(2);bag.add('medkit',2);bag.add('shieldCell',2);
  check('pilhas e capacidade',bag.count('medkit')===2&&bag.count('shieldCell')===2&&bag.add('shieldCell')===0);
  const before=JSON.stringify(bag.slots);check('redução sem perda',bag.resize(2)===true&&bag.count('medkit')===2);
  const full=new SurvivalBackpack(3);full.add('medkit',4);full.add('shieldCell',2);
  check('redução impossível preserva itens',full.resize(2)===false&&full.capacity===3&&full.count('medkit')===4&&full.count('shieldCell')===2);
  return {passed:results.every(t=>t.passed),total:results.length,results};
}
