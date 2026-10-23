// -- src/world/Cars3D.js --
// R35 · Hefesto + Afrodite — carro de verdade em 3D (no lugar das camadas empilhadas da R33).
// Cada carro é montado como um modelo: carroceria (laterais, frente com faróis e grade, traseira com
// lanternas e placa), quatro rodas com pneu e calota, capô e porta-malas por cima, e a cabine com
// para-brisa inclinado, vidros laterais, colunas e teto. Tudo projetado na mesma câmera 3D dos prédios (29g),
// então o carro muda de ângulo conforme o jogador anda. O desenho de cima (29e) vira a pintura do capô e do teto.
const PZ_CAR3D_DIMS={sedan:[37,70],hatch:[36,60],pickup:[43,82],van:[47,89]};
function pzCar3DParams(o){
  const v=o.visual;
  if(v.kind==='civilian')return{x:v.v.x,y:v.v.y,angle:v.v.angle||0,kind:v.v.kind||'sedan',paint:v.v.paint};
  if(v.kind==='spriteCar')return{x:v.x,y:v.y,angle:v.angle||0,kind:v.sprite==='carTeal'?'van':v.sprite==='carCoral'?'sedan':'pickup'};
  return null;
}
function pzCar3DSprite(p){
  const key=`${Math.round(p.x)}:${Math.round(p.y)}:${p.kind}`;let spr=PZ_CAR_CACHE.get(key);
  if(!spr){const c=document.createElement('canvas').getContext('2d');civilianCar(c,p.x,p.y,{kind:p.kind,angle:p.angle,paint:p.paint});spr=PZ_CAR_CACHE.get(key);}
  if(spr&&!spr.rgb){
    // cor da lataria: amostra no porta-malas/capô do desenho
    const [w,h]=PZ_CAR3D_DIMS[p.kind]||PZ_CAR3D_DIMS.sedan,R=2,P=12,x=spr.cv.getContext('2d');
    const at=(lx,ly)=>x.getImageData(Math.round((lx+w/2+P)*R),Math.round((ly+h/2+P)*R),1,1).data;
    const a=at(-w*.3,-h*.44),b=at(w*.3,h*.43);spr.rgb=[0,1,2].map(i=>Math.round((a[i]+b[i])/2));
  }
  return spr;
}
// Geometria da cabine (espaço local, frente para -y).
function pzCar3DShape(kind,variant,w,h){
  const S={zb0:2.6,zb1:10};
  if(variant==='kombi'||variant==='furgao'||variant==='samu'){
    Object.assign(S,{zb1:10.5,c0:-h/2+2.5,c1:h/2-1.5,t0:-h/2+8,t1:h/2-2,cw:w-2,tw:w-4,zt:25,box:1});
  }else if(variant==='fusca'){
    Object.assign(S,{zb1:9,c0:-h*.2,c1:h*.3,t0:-h*.1,t1:h*.22,cw:w*.72,tw:w*.56,zt:17});
  }else{
    const hood=variant==='medio'?.3:variant==='moderno'?.22:.24,ws0=-h/2+h*hood,ws1=ws0+(variant==='moderno'?9:7);
    const roofLen=variant==='picape'?h*.25:variant==='quadrado'?h*.33:h*.3,rf1=ws1+roofLen,rw=variant==='quadrado'?4:6;
    Object.assign(S,{c0:ws0,c1:variant==='picape'?rf1+3:rf1+rw,t0:ws1,t1:rf1,cw:w-5,tw:w-11,zt:variant==='quadrado'?17.5:16.5});
  }
  return S;
}
function pzCar3DDraw(ctx,o,wd,assets,part3d){ // part3d: 'shadow' só a sombra, 'body' sem a sombra
  const p=pzCar3DParams(o);if(!p)return false;
  const spr=pzCar3DSprite(p);if(!spr)return false;
  const [w,h]=PZ_CAR3D_DIMS[p.kind]||PZ_CAR3D_DIMS.sedan,R=2,P=12,variant=spr.variant;
  const S=pzCar3DShape(p.kind,variant,w,h);
  const ca=Math.cos(p.angle),sa=Math.sin(p.angle),vx=PZ_3D.vx,vy=PZ_3D.vy,base=ctx.getTransform();
  const W=(lx,ly)=>[p.x+lx*ca-ly*sa,p.y+lx*sa+ly*ca];
  const Pp=(lx,ly,z)=>{const q=W(lx,ly);return pz3dP(q[0],q[1],z);};
  // face vertical de A a B (local): visível se a câmera está do lado de fora
  const seen=(ax,ay,bx,by)=>{const A=W(ax,ay),B=W(bx,by),nx=B[1]-A[1],ny=-(B[0]-A[0]);return nx*(vx-(A[0]+B[0])/2)+ny*(vy-(A[1]+B[1])/2)>0;};
  const poly=(pts,fill)=>{ctx.fillStyle=fill;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();};
  // pedaço de uma face (u ao longo de A→B, de z0 a z1)
  const part=(ax,ay,bx,by,u0,u1,z0,z1,fill)=>{const L=(u,z)=>Pp(ax+(bx-ax)*u,ay+(by-ay)*u,z);poly([L(u0,z0),L(u1,z0),L(u1,z1),L(u0,z1)],fill);};
  const [r,g,b]=spr.rgb,col=(k)=>`rgb(${Math.min(255,r*k)|0},${Math.min(255,g*k)|0},${Math.min(255,b*k)|0})`;
  const sunK=(ax,ay,bx,by)=>{const A=W(ax,ay),B=W(bx,by),nx=B[1]-A[1],ny=-(B[0]-A[0]),l=Math.hypot(nx,ny)||1;return Math.max(0,(nx*.976-ny*.215)/l);};
  const texAt=(z,lx0,ly0,lw,lh)=>{const k=1+PZ_3D.a*z;ctx.setTransform(base);ctx.translate(vx,vy);ctx.scale(k,k);ctx.translate(-vx,-vy);ctx.translate(p.x,p.y);ctx.rotate(p.angle);
    ctx.drawImage(spr.cv,(lx0+w/2+P)*R,(ly0+h/2+P)*R,lw*R,lh*R,lx0,ly0,lw,lh);ctx.setTransform(base);};
  ctx.save();ctx.imageSmoothingEnabled=true;
  const hw=w/2,hh=h/2;
  // sombra no chão (sol do leste: cai para o oeste)
  if(part3d!=='body'){const q=[[-hw-1,-hh-1],[hw+1,-hh-1],[hw+1,hh+1],[-hw-1,hh+1]].map(([lx,ly])=>{const t=W(lx,ly);return{x:t[0]-5,y:t[1]+2};});poly(q,'rgba(0,0,0,.34)');}
  if(part3d==='shadow'){ctx.restore();return true;}
  // carroceria: 4 lados (só os que a câmera vê)
  const sides=[[-hw,hh,-hw,-hh,'L'],[hw,-hh,hw,hh,'R'],[-hw,-hh,hw,-hh,'F'],[hw,hh,-hw,hh,'B']];
  for(const [ax,ay,bx,by,t] of sides){
    if(!seen(ax,ay,bx,by))continue;
    const k=(t==='F'||t==='B'?.6:.7)+.28*sunK(ax,ay,bx,by);
    part(ax,ay,bx,by,0,1,S.zb0,S.zb1,col(k));
    part(ax,ay,bx,by,0,1,S.zb0,S.zb0+1.6,'rgba(15,16,18,.75)'); // saia / para-choque de baixo
    part(ax,ay,bx,by,0,1,S.zb1-1,S.zb1,col(k*1.18)); // vinco de luz na quina de cima
    if(t==='F'){
      part(ax,ay,bx,by,.06,.27,6.2,8.8,'#ece8d8');part(ax,ay,bx,by,.73,.94,6.2,8.8,'#ece8d8'); // faróis
      part(ax,ay,bx,by,.32,.68,4.4,7.6,'#191b1f');for(let i=0;i<3;i++)part(ax,ay,bx,by,.33,.67,4.9+i*.9,5.3+i*.9,'rgba(120,124,128,.5)'); // grade
      part(ax,ay,bx,by,.02,.98,2.6,4.2,'#25272b'); // para-choque
    }else if(t==='B'){
      part(ax,ay,bx,by,.05,.24,6.4,8.8,'#a11e1e');part(ax,ay,bx,by,.76,.95,6.4,8.8,'#a11e1e'); // lanternas
      part(ax,ay,bx,by,.38,.62,4.4,6.4,'#e9e9e4');part(ax,ay,bx,by,.38,.62,6,6.4,'#2f55a8'); // placa
      part(ax,ay,bx,by,.02,.98,2.6,4.2,'#25272b');
    }else{
      // vinco da porta, maçaneta e friso
      part(ax,ay,bx,by,.49,.505,3.2,S.zb1-.6,'rgba(0,0,0,.35)');
      part(ax,ay,bx,by,t==='L'?.40:.55,t==='L'?.45:.60,7.4,8.2,'rgba(20,20,22,.6)');
      part(ax,ay,bx,by,.06,.94,5.2,5.7,'rgba(0,0,0,.16)');
    }
  }
  // rodas: pneu escuro com calota, por cima da lateral (como se vê um carro de lado)
  for(const sx of [-1,1])for(const fy of [-.31,.31]){
    const wx=sx*(hw+.6),c=fy*h,l=6.4,ax=wx,ay=c+(sx<0?l:-l),bx=wx,by=c+(sx<0?-l:l);
    if(!seen(ax,ay,bx,by))continue;
    part(ax,ay,bx,by,0,1,0,8.2,'#0b0c0e');
    part(ax,ay,bx,by,.22,.78,1.8,6.4,'#3c3f44');part(ax,ay,bx,by,.34,.66,2.8,5.4,'#8d9298'); // calota
    part(ax,ay,bx,by,-.08,1.08,7.6,9.2,col(.45)); // para-lama
  }
  // capô, porta-malas (pintura de cima) na altura da carroceria
  texAt(S.zb1,-hw,-hh,w,h);
  // cabine: tronco de pirâmide entre a base (c0..c1, largura cw) e o teto (t0..t1, largura tw)
  const B=[[-S.cw/2,S.c0],[S.cw/2,S.c0],[S.cw/2,S.c1],[-S.cw/2,S.c1]],T=[[-S.tw/2,S.t0],[S.tw/2,S.t0],[S.tw/2,S.t1],[-S.tw/2,S.t1]];
  const glass='#1d2a34';
  const faces=[[0,1,'F'],[1,2,'R'],[2,3,'B'],[3,0,'L']];
  for(const [i,j,t] of faces){
    if(!seen(B[i][0],B[i][1],B[j][0],B[j][1]))continue;
    const q=[Pp(B[i][0],B[i][1],S.zb1),Pp(B[j][0],B[j][1],S.zb1),Pp(T[j][0],T[j][1],S.zt),Pp(T[i][0],T[i][1],S.zt)];
    const k=.72+.25*sunK(B[i][0],B[i][1],B[j][0],B[j][1]);
    poly(q,col(k)); // colunas / lataria da cabine
    // vidro recuado nas bordas (bilinear entre base e teto)
    const lerp=(a,b2,u)=>({x:a.x+(b2.x-a.x)*u,y:a.y+(b2.y-a.y)*u});
    const at=(u,v)=>lerp(lerp(q[0],q[1],u),lerp(q[3],q[2],u),v);
    const m=S.box&&(t==='L'||t==='R')?[.05,.95]:t==='F'||t==='B'?[.06,.94]:[.08,.92];
    const v0=S.box&&(t==='L'||t==='R')?.45:.12;
    poly([at(m[0],v0),at(m[1],v0),at(m[1],.9),at(m[0],.9)],glass);
    poly([at(m[0]+.03,v0+.08),at(m[0]+.25,v0+.08),at(m[0]+.12,.84),at(m[0]+.03,.84)],'rgba(170,200,222,.18)'); // reflexo
    if(!S.box&&(t==='L'||t==='R'))poly([at(.5,v0),at(.53,v0),at(.53,.9),at(.5,.9)],col(k*.8)); // coluna do meio
  }
  // teto (pintura de cima do teto)
  texAt(S.zt,-S.tw/2,S.t0,S.tw,S.t1-S.t0);
  // luz com direção (38j) sobre a lataria de cima
  if(typeof pzDLProp==='function'){const T3=pz3dPropTex(wd,o,assets);const k=1+PZ_3D.a*S.zb1;ctx.setTransform(base);ctx.translate(vx,vy);ctx.scale(k,k);ctx.translate(-vx,-vy);pzDLProp(ctx,T3);ctx.setTransform(base);}
  ctx.restore();
  return true;
}
{const _p=WorldDestruction.prototype.paintOriginalObject;
 WorldDestruction.prototype.paintOriginalObject=function(target,o,assets){
   if(!this.__pz3dPaint&&this.__pz3dCtx&&target===this.__pz3dCtx&&o.kind==='vehicle'&&pz3dOn()&&!window.__PZ_STACKCARS){
     // R35b: no chão fica só a sombra; o carro entra na fila e é desenhado na ordem de profundidade (pzCarDrawables)
     if(!this.__pzCarSorted&&pzCar3DParams(o)&&pzCar3DDraw(target,o,this,assets,'shadow')){PZ_CARQ.push({wd:this,o,assets});return;}
     if(pzCar3DDraw(target,o,this,assets,this.__pzCarSorted?'body':undefined))return;
   }
   return _p.call(this,target,o,assets);
 };}

// R35b · carro na ordem de profundidade + translúcido quando o jogador passa atrás dele (igual aos prédios).
const PZ_CARQ=[];
function pzCarDrawables(camera,player,dt){
  const out=[];
  for(const it of PZ_CARQ.splice(0)){
    const {wd,o,assets}=it,p=pzCar3DParams(o);if(!p)continue;
    const [w,h]=PZ_CAR3D_DIMS[p.kind]||PZ_CAR3D_DIMS.sedan,ca=Math.cos(p.angle),sa=Math.sin(p.angle);
    let y0=1e9,y1=-1e9,x0=1e9,x1=-1e9;
    for(const [lx,ly] of [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]]){
      const X=p.x+lx*ca-ly*sa,Y=p.y+lx*sa+ly*ca,T=pz3dP(X,Y,22);
      y0=Math.min(y0,Y,T.y);y1=Math.max(y1,Y);x0=Math.min(x0,X,T.x);x1=Math.max(x1,X,T.x);}
    // translúcido só quando o jogador está atrás (acima da frente do carro, dentro da área que ele cobre na tela)
    let target=1;
    if(player&&player.x>x0-10&&player.x<x1+10&&player.y<y1-4&&player.y>y0-30)target=.38;
    o.__pzA=(o.__pzA??1)+(target-(o.__pzA??1))*Math.min(1,(dt||.016)*9);
    out.push({x:p.x,y:y1,__tall:1,draw(ctx){
      ctx.save();if(o.__pzA<.995)ctx.globalAlpha=o.__pzA;
      wd.__pz3dCtx=ctx;wd.__pzCarSorted=true;
      try{wd.paintOriginalObject(ctx,o,assets);}finally{wd.__pz3dCtx=null;wd.__pzCarSorted=false;ctx.restore();}
    }});
  }
  return out;
}
{const _d=WorldDestruction.prototype.draw;WorldDestruction.prototype.draw=function(){PZ_CARQ.length=0;return _d.apply(this,arguments);};}
