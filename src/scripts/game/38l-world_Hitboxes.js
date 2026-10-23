// -- src/world/Hitboxes.js --
// R35 · Ares + Hefesto — colisão do tamanho do desenho.
// Revisão do mapa (ver README R35): várias colisões não batiam com o que aparece na tela:
//  • carros "sprite" do centro usavam a mesma caixa 41×84 para sedã, picape e Kombi;
//  • carros comuns tinham 3 px a mais de cada lado;
//  • 2 caixas pequenas e as 3 caixas de madeira grandes não tinham colisão nenhuma (zumbi e jogador atravessavam),
//    e sobrava a colisão antiga de uma caixa, maior que o desenho e fora do lugar;
//  • ambulância e caminhão de bombeiros tinham uma caixa pequena deslocada do desenho (e a viatura, uma caixa
//    deitada maior que ela).
// Aqui cada objeto quebrável recebe uma colisão medida no próprio desenho (carro: retângulo girado do tamanho da
// lataria; caixa/viatura/ambulância: contorno opaco do desenho, sem a sombra). Depois o mapa de caminhos dos
// zumbis é refeito. window.__PZ_HITBOX_DEBUG=true mostra as colisões na tela.
const PZ_HB={made:new Map(),orphans:[],done:false};
function pzHBBucketsAdd(o){
  for(let cy=Math.floor(o.y/CELL);cy<=Math.floor((o.y+o.h)/CELL);cy++)
    for(let cx=Math.floor(o.x/CELL);cx<=Math.floor((o.x+o.w)/CELL);cx++){
      const key=`${cx},${cy}`;let b=buckets.get(key);if(!b)buckets.set(key,b=[]);if(!b.includes(o))b.push(o);}
}
function pzHBBucketsRemove(o){for(const b of buckets.values()){const i=b.indexOf(o);if(i>=0)b.splice(i,1);}}
function pzHBSet(o,shape){
  // shape: {cx,cy,angle,halfW,halfH}; a caixa alinhada (x,y,w,h) vira só o recorte rápido da busca
  pzHBBucketsRemove(o);
  const c=Math.abs(Math.cos(shape.angle)),s=Math.abs(Math.sin(shape.angle));
  const ex=shape.halfW*c+shape.halfH*s,ey=shape.halfW*s+shape.halfH*c;
  o.x=shape.cx-ex;o.y=shape.cy-ey;o.w=ex*2;o.h=ey*2;o.carShape=shape;
  pzHBBucketsAdd(o);
}
// Contorno opaco (alfa > 60%) do desenho do objeto, para tirar a sombra semitransparente.
function pzHBMeasure(wd,o,assets){
  const p=o.rect,S=Math.ceil(Math.max(p.w,p.h)*2.4+80),cx=p.x+p.w/2,cy=p.y+p.h/2;
  const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  x.translate(S/2-cx,S/2-cy);wd.__pz3dPaint=true;try{wd.paintOriginalObject(x,o,assets);}finally{wd.__pz3dPaint=false;}
  const d=x.getImageData(0,0,S,S).data;let x0=S,y0=S,x1=-1,y1=-1;
  for(let j=0;j<S;j++)for(let i=0;i<S;i++)if(d[(j*S+i)*4+3]>153){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;}
  if(x1<0)return null;
  return{cx:cx-S/2+(x0+x1+1)/2,cy:cy-S/2+(y0+y1+1)/2,angle:0,halfW:(x1-x0+1)/2,halfH:(y1-y0+1)/2};
}
function pzHBFix(wd,run){
  const assets=window.__projectZGame?.assets;
  const used=new Set();
  for(const o of wd.objects){
    const v=o.visual;let shape=null;
    if(v.kind==='civilian'||v.kind==='spriteCar'){
      const p=pzCar3DParams(o),[w,h]=PZ_CAR3D_DIMS[p.kind]||PZ_CAR3D_DIMS.sedan;
      shape={cx:p.x,cy:p.y,angle:p.angle,halfW:w/2+1,halfH:h/2+.5}; // lataria + retrovisor
    }else if(v.kind==='smallBox'||v.kind==='spriteBox'||v.kind==='emergency'||(v.kind==='district'&&v.prop?.type==='vehicle'&&(v.prop.x===982||v.prop.x===2185))){
      shape=pzHBMeasure(wd,o,assets);
    }
    if(!shape){if(o.collider)used.add(o.collider);continue;}
    let col=o.collider;
    if(!col){
      const key=`${v.kind}:${Math.round(o.rect.x)}:${Math.round(o.rect.y)}`;
      col=PZ_HB.made.get(key);if(!col){col={x:0,y:0,w:0,h:0};PZ_HB.made.set(key,col);}
      o.collider=col;wd.byCollider.set(col,o);
    }
    col.destroyed=!o.alive;
    pzHBSet(col,shape);used.add(col);
  }
  // colisões antigas que não pertencem a nenhum objeto nem a prédio: caixas que já foram trocadas
  const buildings=new Set([...(typeof DISTRICT_BUILDINGS!=='undefined'?DISTRICT_BUILDINGS:[])].map(b=>`${b.x},${b.y},${b.w},${b.h}`));
  if(!PZ_HB.done){
    for(const ob of OBSTACLES){
      if(used.has(ob)||ob.barrel)continue;
      if(buildings.has(`${ob.x},${ob.y},${ob.w},${ob.h}`)||ob.w*ob.h>9000)continue; // prédios e muros grandes ficam
      // pequena e sem dono: é a colisão de uma caixa/carro que agora tem colisão própria? então sai
      const owner=wd.objects.find(o=>o.collider!==ob&&o.collider&&Math.hypot(o.collider.x+o.collider.w/2-(ob.x+ob.w/2),o.collider.y+o.collider.h/2-(ob.y+ob.h/2))<36);
      if(owner){pzHBBucketsRemove(ob);PZ_HB.orphans.push(ob);}
    }
    PZ_HB.done=true;
  }
  run?.navigation?.rebuild?.(run.player);
}
{const Base=WorldDestruction;
 WorldDestruction=class extends Base{constructor(run){super(run);try{pzHBFix(this,run);}catch(e){console.warn('[PROJECT Z] revisão de colisão falhou',e);}}};}
// Ferramenta: desenha as colisões por cima do mapa.
function pzHBDebug(ctx){
  if(!window.__PZ_HITBOX_DEBUG)return;
  const cam=window.__projectZGame?.camera;if(!cam)return;
  ctx.save();ctx.lineWidth=1.2;
  const seen=new Set();
  for(const o of nearbyObstacles(cam.x-900,cam.y-600,cam.x+900,cam.y+600)){
    if(seen.has(o))continue;seen.add(o);
    ctx.strokeStyle=o.carShape?'#5de6be':'#f0c54f';
    if(o.carShape){const z=o.carShape;ctx.save();ctx.translate(z.cx,z.cy);ctx.rotate(z.angle);ctx.strokeRect(-z.halfW,-z.halfH,z.halfW*2,z.halfH*2);ctx.restore();}
    else ctx.strokeRect(o.x,o.y,o.w,o.h);
  }
  ctx.restore();
}
{const _rs=pzDrawReloadAndSwap;pzDrawReloadAndSwap=function(ctx,r){const out=_rs.apply(this,arguments);pzHBDebug(ctx);return out;};}
