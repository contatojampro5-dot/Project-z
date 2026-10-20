// -- src/systems/SpatialHash.js --
// Uniform spatial grid: localized queries instead of a full enemy-by-enemy scan.
// Object identity is preserved; callers never receive clones of entities.
class SpatialHash {
  constructor(cellSize=96){this.cellSize=cellSize;this.cells=new Map();this.stamp=0;}
  key(x,y){return `${x},${y}`;}
  clear(){this.cells.clear();}
  insert(item,radius=item.radius||0){
    const c=this.cellSize;
    for(let y=Math.floor((item.y-radius)/c);y<=Math.floor((item.y+radius)/c);y++)
      for(let x=Math.floor((item.x-radius)/c);x<=Math.floor((item.x+radius)/c);x++){
        const k=this.key(x,y);let items=this.cells.get(k);if(!items)this.cells.set(k,items=[]);items.push(item);
      }
  }
  rebuild(items){this.clear();for(const item of items)if(item.alive!==false)this.insert(item);return this;}
  query(x,y,radius=0){
    const result=[],seen=new Set(),c=this.cellSize;
    for(let gy=Math.floor((y-radius)/c);gy<=Math.floor((y+radius)/c);gy++)
      for(let gx=Math.floor((x-radius)/c);gx<=Math.floor((x+radius)/c);gx++)
        for(const item of this.cells.get(this.key(gx,gy))||[]){if(!seen.has(item)){seen.add(item);result.push(item);}}
    return result;
  }
}

