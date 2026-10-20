// -- src/world/CollisionMap.js --


// A mesma geometria de edifícios, veículos e barreiras do mapa pintado na Entrega A.
// Retângulos são intencionalmente aproximados para permitir passagem ao redor das bordas.
const OBSTACLES = Object.freeze([
  {x:52,y:58,w:272,h:204},{x:820,y:64,w:238,h:164},
  {x:52,y:835,w:254,h:169},{x:836,y:835,w:233,h:160},
  {x:315,y:315,w:60,h:21},{x:910,y:350,w:55,h:18},
  {x:58,y:1039,w:130,h:24},{x:918,y:1011,w:93,h:30},
  {x:328,y:262,w:38,h:39},{x:766,y:255,w:36,h:38},
  {x:264,y:793,w:32,h:28},{x:770,y:1024,w:33,h:33},
  {x:454,y:225,w:24,h:108},{x:683,y:249,w:28,h:106},
  {x:472,y:820,w:48,h:76},{x:674,y:929,w:30,h:72},
  {x:842,y:648,w:75,h:65},{x:235,y:619,w:70,h:66},
  {x:278,y:522,w:70,h:68},{x:749,y:538,w:68,h:73},
  ...DISTRICT_OBSTACLES,
  ...ABANDONED_CAR_OBSTACLES,
  {x:523,y:694,w:96,h:59}, // desativada: viatura decorativa do centro
]);
// Immutable obstacle broadphase shared by shots, movement and navigation.
// G.3.1.6: obstáculos dos barris são removidos assim que explodem.
// Mantemos as construções e carros estáticos na hash anterior.
let ACTIVE_BARREL_OBSTACLES=[];
const CELL=128;
const buckets=new Map();
for(const o of OBSTACLES){
  for(let cy=Math.floor(o.y/CELL);cy<=Math.floor((o.y+o.h)/CELL);cy++)
    for(let cx=Math.floor(o.x/CELL);cx<=Math.floor((o.x+o.w)/CELL);cx++){
      const key=`${cx},${cy}`;let bucket=buckets.get(key);if(!bucket)buckets.set(key,bucket=[]);bucket.push(o);
    }
}
function nearbyObstacles(minX,minY,maxX,maxY){
  const result=[],seen=new Set();
  for(let cy=Math.floor(minY/CELL);cy<=Math.floor(maxY/CELL);cy++)
    for(let cx=Math.floor(minX/CELL);cx<=Math.floor(maxX/CELL);cx++)
      for(const o of buckets.get(`${cx},${cy}`)||[])if(!o.destroyed&&!seen.has(o)){seen.add(o);result.push(o);}
  for(const o of ACTIVE_BARREL_OBSTACLES){
    if(o.x<=maxX && o.y<=maxY && o.x+o.w>=minX && o.y+o.h>=minY)result.push(o);
  }
  return result;
}
function segmentHitsStaticWall(x1,y1,x2,y2,radius=0){
  const minX=Math.min(x1,x2)-radius,maxX=Math.max(x1,x2)+radius;
  const minY=Math.min(y1,y2)-radius,maxY=Math.max(y1,y2)+radius;
  const candidates=nearbyObstacles(minX,minY,maxX,maxY);
  return candidates.some(o=>!o.barrel && segmentRectHit(x1,y1,x2,y2,
    o.carShape ? {carShape:{...o.carShape,halfW:o.carShape.halfW+radius,halfH:o.carShape.halfH+radius}} : {x:o.x-radius,y:o.y-radius,w:o.w+radius*2,h:o.h+radius*2}));
}
function segmentHitsWall(x1,y1,x2,y2,radius=0){
  const boxes=nearbyObstacles(Math.min(x1,x2)-radius,Math.min(y1,y2)-radius,Math.max(x1,x2)+radius,Math.max(y1,y2)+radius);
  return boxes.some(o=>segmentRectHit(x1,y1,x2,y2,o.carShape ? {carShape:{...o.carShape,halfW:o.carShape.halfW+radius,halfH:o.carShape.halfH+radius}} : {x:o.x-radius,y:o.y-radius,w:o.w+radius*2,h:o.h+radius*2}));
}
function circleIntersectsRect(x,y,r,rect){
  if(rect.carShape){
    const z=rect.carShape,c=Math.cos(z.angle),s=Math.sin(z.angle),dx=x-z.cx,dy=y-z.cy;
    const lx=dx*c+dy*s,ly=-dx*s+dy*c;
    const qx=Math.max(-z.halfW,Math.min(lx,z.halfW));
    const qy=Math.max(-z.halfH,Math.min(ly,z.halfH));
    return (lx-qx)**2+(ly-qy)**2<r*r;
  }
  const nearX=Math.max(rect.x,Math.min(x,rect.x+rect.w));
  const nearY=Math.max(rect.y,Math.min(y,rect.y+rect.h));
  return (x-nearX)**2+(y-nearY)**2<r*r;
}
function canOccupy(x,y,r,obstacles=OBSTACLES,world=GAME.map){
  if(x-r<0||y-r<0||x+r>world.width||y+r>world.height)return false;
  const nearby=obstacles===OBSTACLES?nearbyObstacles(x-r,y-r,x+r,y+r):obstacles;
  return !nearby.some(box=>circleIntersectsRect(x,y,r,box));
}
function slideCircle(x,y,dx,dy,r,obstacles=OBSTACLES,world=GAME.map){
  const nx=canOccupy(x+dx,y,r,obstacles,world)?x+dx:x;
  const ny=canOccupy(nx,y+dy,r,obstacles,world)?y+dy:y;
  return {x:nx,y:ny};
}
function segmentRectHit(x1,y1,x2,y2,r){
  if(r.carShape){
    const z=r.carShape,c=Math.cos(z.angle),s=Math.sin(z.angle);
    const local=(x,y)=>{const dx=x-z.cx,dy=y-z.cy;return [dx*c+dy*s,-dx*s+dy*c];};
    const [ax,ay]=local(x1,y1),[bx,by]=local(x2,y2);
    return segmentRectHit(ax,ay,bx,by,{x:-z.halfW,y:-z.halfH,w:2*z.halfW,h:2*z.halfH});
  }
  // Liang-Barsky slab intersection, used for bullets against solid geometry.
  let t0=0,t1=1;
  const dx=x2-x1,dy=y2-y1;
  for(const [p,q] of [[-dx,x1-r.x],[dx,r.x+r.w-x1],[-dy,y1-r.y],[dy,r.y+r.h-y1]]){
    if(p===0){if(q<0)return false;continue;}
    const t=q/p;
    if(p<0){if(t>t1)return false;t0=Math.max(t0,t);}
    else {if(t<t0)return false;t1=Math.min(t1,t);}
  }
  return t0<=t1;
}
function segmentCircleHit(ax,ay,bx,by,cx,cy,r){
  const dx=bx-ax,dy=by-ay;const len=dx*dx+dy*dy;
  const t=len===0?0:Math.max(0,Math.min(1,((cx-ax)*dx+(cy-ay)*dy)/len));
  const x=ax+dx*t,y=ay+dy*t;
  return (x-cx)**2+(y-cy)**2<=r*r;
}

