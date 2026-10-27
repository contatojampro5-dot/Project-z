// -- src/world/Morro.js --
// R54 · Deméter + Hefesto — a praia virou o MORRO DO CRUZEIRO (pedido do Theo).
// O mapa cresceu para o leste (GAME.map.width 2800 → 4400; a cidade continua em 0..cityWidth=2800).
// Na divisa fica a avenida do pé do morro; dali sobe a Estrada do Cruzeiro (terra, em curvas) até a
// FAZENDA DO SEU JOÃO (primeiro refúgio, docs/historia.md item 27) no topo, e a Trilha do Cruzeiro sai
// da rua de cima. Em volta: mata atlântica (copas, ipês, embaúbas, palmitos e eucaliptos).
//  • chão do morro pintado uma vez numa faixa em meia resolução (relevo com luz do leste e curvas de nível
//    bem leves), igual à faixa da praia antiga — nada disso custa por quadro;
//  • árvores, casa, celeiro, caixa d'água, porteira e cruzeiro são objetos em pé na ordem de profundidade
//    (entram pela lista do pzWallDrawables), inclinam na câmera 3D e ficam translúcidos quando o jogador
//    passa atrás (igual prédios, carros e muro);
//  • só os troncos e as construções têm colisão (o caminho dos zumbis contorna);
//  • fora do mapa a mata é pintada fechada na própria faixa (sem objeto, sem custo).
const PZ_MORRO={
  X0:GAME.map.cityWidth||2800,X1:GAME.map.width,H:GAME.map.height,OUT:640,
  F:{x:3820,y:1300}, // centro do platô da fazenda
  RW:72,             // largura da estrada
  trees:[],cards:[],grid:new Map(),GC:256,road:[],trail:[],spr:{},ready:false
};
function pzMSmooth(a,b,v){const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);}
// Altura do terreno (0 no pé, 1 no platô).
function pzMorroH(x,y){
  const F=PZ_MORRO.F,d=Math.hypot((x-F.x)/1.05,(y-F.y)/1.32);
  let h=1-pzMSmooth(300,1500,d);
  const n=Math.sin(x/190+Math.sin(y/240)*1.3)*Math.sin(y/160+Math.cos(x/300)*1.1)*.5+.5;
  h+=(n-.5)*.12*pzMSmooth(300,620,d);
  return Math.max(0,h*pzMSmooth(2870,3260,x));
}
// Curva suave (Catmull-Rom) a partir dos pontos de controle, amostrada a cada ~8 px.
function pzMSpline(P){
  const out=[];
  for(let i=0;i<P.length-1;i++){
    const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];
    const n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/8));
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;
      out.push([.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
                .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}
  }
  out.push(P[P.length-1].slice());return out;
}
function pzMDist(pts,x,y){let b=1e9;for(let i=0;i<pts.length;i+=2){const d=(pts[i][0]-x)**2+(pts[i][1]-y)**2;if(d<b)b=d;}return Math.sqrt(b);}
// Estrada: sai da avenida de baixo (y≈1915) e sobe em zigue-zague até a porteira (sul do platô).
PZ_MORRO.road=pzMSpline([[2902,1915],[2960,1915],[3130,1935],[3330,2030],[3500,2150],[3660,2185],[3770,2110],[3740,2010],[3580,1930],[3430,1850],[3420,1760],[3540,1700],[3700,1700],[3820,1690],[3820,1590]]);
// Trilha: sai da avenida de cima (y≈578) e sobe pela mata até o cruzeiro (norte do platô).
PZ_MORRO.trail=pzMSpline([[2930,600],[3080,640],[3230,740],[3330,860],[3470,930],[3560,1010],[3660,1040],[3740,1060]]);
function pzMInFarm(x,y){const F=PZ_MORRO.F;return ((x-F.x)/460)**2+((y-F.y-40)/350)**2<1;}

// ---------- árvores ----------
// Cada desenho é feito uma vez (em pé, pé em (ox,oy)) e reaproveitado com escala/espelho.
const PZ_TREE_KINDS=[
  {k:'copa',pal:['#1f3a20','#2f5a2c','#4b7f3a','#86b25a'],R:30,T:30},
  {k:'copa',pal:['#22381c','#355a28','#557d34','#97b862'],R:36,T:34},
  {k:'copa',pal:['#1b3324','#2b5236','#467a4a','#7fae73'],R:26,T:26},
  {k:'copa',pal:['#2a3a1c','#465f2a','#6c8a3c','#a9c06a'],R:32,T:30},
  {k:'ipe',pal:['#7a5a10','#c8941a','#e9be2c','#fbe27a'],R:28,T:34},
  {k:'ipe',pal:['#5a2048','#8e3a72','#c060a0','#eaa0cc'],R:28,T:34},
  {k:'embauba',pal:['#3e4a3a','#7a8c78','#a9b8a4','#d8e2d2'],R:26,T:50},
  {k:'palmito',pal:['#1f3a20','#2f6a30','#52923e','#8cc060'],R:20,T:54},
  {k:'eucalipto',pal:['#2a3a30','#4a6450','#728c72','#a6bca0'],R:18,T:62},
];
function pzTreeSprite(i){
  if(PZ_MORRO.spr[i])return PZ_MORRO.spr[i];
  const K=PZ_TREE_KINDS[i],RES=2,R=K.R,T=K.T,W=R*2+24,H=T+R*2+18,ox=W/2,oy=H-6;
  const c=document.createElement('canvas');c.width=W*RES;c.height=H*RES;const x=c.getContext('2d');x.scale(RES,RES);
  const rnd=mulberry32(5400+i*97),[c0,c1,c2,c3]=K.pal;
  const cx=ox,cy=oy-T-R*.75;
  // tronco
  const bark=K.k==='eucalipto'||K.k==='embauba'?['#bdb6a4','#8c8576']:['#5a4030','#3a2a20'];
  const tw=K.k==='palmito'?2.2:K.k==='eucalipto'?3.2:4.2;
  x.fillStyle=bark[1];x.beginPath();x.moveTo(ox-tw-1.5,oy);x.quadraticCurveTo(ox-tw*.6,cy+R*.3,ox-1,cy);x.lineTo(ox+1,cy);x.quadraticCurveTo(ox+tw*.6,cy+R*.3,ox+tw+1.5,oy);x.closePath();x.fill();
  x.fillStyle=bark[0];x.fillRect(ox+.5,cy+R*.3,tw*.55,oy-cy-R*.3);
  x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(ox,oy,tw+4,2.2,0,0,Math.PI*2);x.fill();
  if(K.k==='palmito'){
    // estipe fina com anéis e copa em estrela
    for(let y=oy-4;y>cy;y-=5){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(ox-tw,y,tw*2,1);}
    const n=11;
    for(let j=0;j<n;j++){const a=j/n*Math.PI*2+rnd()*.3,L=R*(.8+rnd()*.35),ex=cx+Math.cos(a)*L,ey=cy+Math.sin(a)*L*.6+R*.25;
      const front=Math.sin(a)>0;x.strokeStyle=front?c2:c1;x.lineWidth=2.6;x.beginPath();x.moveTo(cx,cy);x.quadraticCurveTo((cx+ex)/2,(cy+ey)/2-6,ex,ey);x.stroke();
      for(let t=.2;t<1;t+=.12){const px=cx+(ex-cx)*t,py=cy+(ey-cy)*t-5*Math.sin(t*Math.PI);x.strokeStyle=front?c3:c2;x.lineWidth=1.1;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a+1.3)*4,py+Math.sin(a+1.3)*3+2);x.stroke();}}
    x.fillStyle='#6a4a20';x.beginPath();x.arc(cx,cy+2,2.4,0,Math.PI*2);x.fill();
    return PZ_MORRO.spr[i]={canvas:c,W,H,ox,oy,R,T};
  }
  if(K.k==='embauba'){
    // galhos em candelabro com folhas prateadas em guarda-chuva
    const tips=[[-R*.7,-R*.1],[R*.75,-R*.25],[-R*.2,-R*.75],[R*.25,-R*.6],[0,-R*.15]];
    x.strokeStyle=bark[1];x.lineWidth=2;
    for(const [dx,dy] of tips){x.beginPath();x.moveTo(ox,cy+R*.5);x.quadraticCurveTo(ox+dx*.3,cy+dy*.2,cx+dx,cy+dy);x.stroke();}
    for(const [dx,dy] of tips){const px=cx+dx,py=cy+dy;
      for(let j=0;j<7;j++){const a=j/7*Math.PI*2;x.fillStyle=Math.sin(a)>0?c1:c2;x.beginPath();x.ellipse(px+Math.cos(a)*7,py+Math.sin(a)*4,7,3.2,a,0,Math.PI*2);x.fill();}
      x.fillStyle=c3;x.beginPath();x.ellipse(px+2,py-2,4,2.5,0,0,Math.PI*2);x.fill();}
    return PZ_MORRO.spr[i]={canvas:c,W,H,ox,oy,R,T};
  }
  // copa: bolos de folhas sobrepostos (sombra embaixo/oeste, luz em cima/leste, de onde vem o sol)
  const ry=K.k==='eucalipto'?1.7:.82,blobs=[];
  const nb=K.k==='eucalipto'?9:15;
  for(let j=0;j<nb;j++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*R*.62;blobs.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*ry,R*(.36+rnd()*.22)]);}
  // galhos aparecendo entre as folhas
  x.strokeStyle=bark[1];x.lineWidth=1.6;
  for(let j=0;j<4;j++){const a=-Math.PI/2+(rnd()-.5)*2.2;x.beginPath();x.moveTo(ox,cy+R*.45);x.lineTo(cx+Math.cos(a)*R*.6,cy+Math.sin(a)*R*.5*ry);x.stroke();}
  for(const [bx,by,br] of blobs){x.fillStyle=c0;x.beginPath();x.ellipse(bx-2,by+3,br,br*(K.k==='eucalipto'?1.2:.88),0,0,Math.PI*2);x.fill();}
  for(const [bx,by,br] of blobs){x.fillStyle=c1;x.beginPath();x.ellipse(bx,by,br*.9,br*.8*(K.k==='eucalipto'?1.25:1),0,0,Math.PI*2);x.fill();}
  for(const [bx,by,br] of blobs){if(bx-cx+(cy-by)*.8<-R*.15)continue;x.fillStyle=c2;x.beginPath();x.ellipse(bx+br*.22,by-br*.22,br*.55,br*.45,0,0,Math.PI*2);x.fill();}
  // pontinhos de folha (luz e sombra)
  for(let j=0;j<R*9;j++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*R*.95,px=cx+Math.cos(a)*d,py=cy+Math.sin(a)*d*ry;
    const lit=Math.cos(a)*.6-Math.sin(a)*.8>0;x.fillStyle=lit?(rnd()<.5?c3:c2):(rnd()<.5?c0:'rgba(10,20,10,.5)');x.fillRect(px,py,1.6,1.6);}
  if(K.k==='ipe'){for(let j=0;j<40;j++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*R,px=cx+Math.cos(a)*d,py=cy+Math.sin(a)*d*ry;x.fillStyle=rnd()<.5?c3:'#fff3c8';x.fillRect(px,py,1.5,1.5);}}
  // barriga da copa mais escura (volume)
  x.save();x.globalCompositeOperation='source-atop';const g=x.createLinearGradient(0,cy-R,0,cy+R*ry);g.addColorStop(0,'rgba(255,255,220,.10)');g.addColorStop(.6,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,10,0,.32)');x.fillStyle=g;x.fillRect(0,0,W,oy-T*.4);x.restore();
  return PZ_MORRO.spr[i]={canvas:c,W,H,ox,oy,R,T};
}
function pzMorroPickKind(rnd,h){
  const v=rnd();
  if(v<.06)return 4;if(v<.1)return 5;if(v<.17)return 6;if(v<.25)return 7;
  if(v<.32&&h<.45)return 8;
  return [0,1,2,3][Math.floor(rnd()*4)];
}
function pzMorroPlantTrees(){
  const M=PZ_MORRO,rnd=mulberry32(54054),S=58;
  for(let gy=-150;gy<M.H+150;gy+=S)for(let gx=2940;gx<M.X1+150;gx+=S){
    const x=gx+(rnd()-.5)*44,y=gy+(rnd()-.5)*44,h=pzMorroH(x,y),k=rnd(),kind=pzMorroPickKind(rnd,h),sc=.82+rnd()*.42,flip=rnd()<.5;
    if(x<2975)continue;
    if(pzMDist(M.road,x,y)<M.RW/2+34||pzMDist(M.trail,x,y)<30||pzMInFarm(x,y))continue;
    // clareiras e pé do morro mais aberto
    const glade=Math.sin(x/230+1.1)*Math.sin(y/190+.4);
    const p=x<3150?.38:glade>.72?.12:.8;
    if(k>p)continue;
    M.trees.push({x,y,kind,sc,flip,inMap:x<M.X1-8&&y>8&&y<M.H-8});
  }
  // árvores de quintal da fazenda: mangueira e jabuticabeiras perto da casa
  for(const [x,y,kind,sc] of [[3560,1250,1,1.15],[3600,1440,3,.95],[4180,1300,0,1.1],[3930,1520,2,.9],[3660,1135,4,1]])M.trees.push({x,y,kind,sc,flip:false,inMap:true});
  for(const t of M.trees){
    const key=Math.floor(t.x/M.GC)+','+Math.floor(t.y/M.GC);let b=M.grid.get(key);if(!b)M.grid.set(key,b=[]);b.push(t);
    if(t.inMap)pzMorroBlock({x:t.x-6*t.sc,y:t.y-5,w:12*t.sc,h:9});
  }
}
function pzMorroBlock(o){
  o.morro=true;
  if(typeof pzHBBucketsAdd==='function')pzHBBucketsAdd(o);
  else for(let cy=Math.floor(o.y/CELL);cy<=Math.floor((o.y+o.h)/CELL);cy++)for(let cx=Math.floor(o.x/CELL);cx<=Math.floor((o.x+o.w)/CELL);cx++){const key=`${cx},${cy}`;let b=buckets.get(key);if(!b)buckets.set(key,b=[]);b.push(o);}
}

// ---------- construções da fazenda (cartões em pé: telhado acima da fachada) ----------
function pzMCanvas(W,H,RES=2){const c=document.createElement('canvas');c.width=Math.ceil(W*RES);c.height=Math.ceil(H*RES);const x=c.getContext('2d');x.scale(RES,RES);return [c,x];}
function pzMTiles(x,x0,y0,w,h,base,dark,rnd){
  x.fillStyle=base;x.fillRect(x0,y0,w,h);
  for(let yy=y0;yy<y0+h;yy+=5){x.fillStyle=dark;x.fillRect(x0,yy+4,w,1);
    for(let xx=x0+((yy/5)%2)*4;xx<x0+w;xx+=8){x.fillStyle='rgba(255,220,180,.18)';x.fillRect(xx,yy,4,2);x.fillStyle='rgba(0,0,0,.12)';x.fillRect(xx+5,yy+1,2,3);}}
  for(let i=0;i<w*h/120;i++){x.fillStyle=rnd()<.5?'rgba(40,30,20,.25)':'rgba(70,80,40,.2)';x.fillRect(x0+rnd()*w,y0+rnd()*h,2+rnd()*5,2);}
}
// Casa sede: paredes caiadas, janelas azuis, varanda com esteios de madeira e rede, telhado de barro de 4 águas.
function pzMHouse(){
  const W=220,D=104,H=48,P=12,[c,x]=pzMCanvas(W+P*2,D+H+P*2),rnd=mulberry32(7301),o={W:W+P*2,H:D+H+P*2,ax:W/2+P,base:D+H+P};
  const X=P,Y=P;
  // fachada
  const g=x.createLinearGradient(0,Y+D,0,Y+D+H);g.addColorStop(0,'#d9d0bb');g.addColorStop(1,'#bdb39c');x.fillStyle=g;x.fillRect(X,Y+D,W,H);
  x.fillStyle='rgba(120,90,60,.35)';x.fillRect(X,Y+D+H-8,W,8); // barro respingado no pé
  for(let i=0;i<40;i++){x.fillStyle=`rgba(90,80,60,${(.05+rnd()*.12).toFixed(2)})`;x.fillRect(X+rnd()*W,Y+D+rnd()*H*.6,1+rnd()*2,6+rnd()*14);}
  const win=(wx)=>{x.fillStyle='#3a2a1c';x.fillRect(wx-1,Y+D+13,20,22);x.fillStyle='#2d5f8a';x.fillRect(wx,Y+D+14,8,20);x.fillRect(wx+10,Y+D+14,8,20);
    x.fillStyle='#4a82b0';x.fillRect(wx+1,Y+D+15,2,18);x.fillRect(wx+11,Y+D+15,2,18);x.fillStyle='#e8e0cc';x.fillRect(wx-2,Y+D+35,22,2);};
  for(const wx of [X+16,X+52,X+150,X+186])win(wx);
  x.fillStyle='#3a2a1c';x.fillRect(X+96,Y+D+10,28,H-10);x.fillStyle='#6b4a2c';x.fillRect(X+98,Y+D+12,24,H-12);
  x.fillStyle='#55391f';for(let k=0;k<3;k++)x.fillRect(X+100,Y+D+16+k*10,20,2);x.fillStyle='#c8a050';x.fillRect(X+118,Y+D+30,2,3);
  // sombra do beiral e da varanda
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(X,Y+D,W,10);
  // esteios da varanda (na frente da parede) e a rede
  x.strokeStyle='#c45a4a';x.lineWidth=2;x.beginPath();x.moveTo(X+138,Y+D+12);x.quadraticCurveTo(X+156,Y+D+34,X+176,Y+D+12);x.stroke();
  x.strokeStyle='#e8c050';x.lineWidth=1;x.beginPath();x.moveTo(X+138,Y+D+14);x.quadraticCurveTo(X+156,Y+D+33,X+176,Y+D+14);x.stroke();
  for(let k=0;k<6;k++){const px=X+6+k*41.6;x.fillStyle='#5a3a20';x.fillRect(px,Y+D+4,6,H-4);x.fillStyle='#7a5432';x.fillRect(px+1,Y+D+4,2,H-4);}
  // telhado de 4 águas (cumeeira leste-oeste), beiral saindo 9 px
  const e=9,L=X-e,T=Y-e+4,R=X+W+e,B=Y+D+e,mid=(T+B)/2,i0=L+44,i1=R-44;
  const face=(pts,base,dark,shade)=>{x.save();x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))x.lineTo(p[0],p[1]);x.closePath();x.clip();pzMTiles(x,L,T,R-L,B-T,base,dark,rnd);x.fillStyle=shade;x.fillRect(L,T,R-L,B-T);x.restore();};
  face([[L,B],[R,B],[i1,mid],[i0,mid]],'#b0583a','#7a3420','rgba(255,200,150,.10)'); // água sul
  face([[L,T],[R,T],[i1,mid],[i0,mid]],'#9c4c32','#6a2c1a','rgba(0,0,0,.18)');        // água norte
  face([[R,T],[R,B],[i1,mid]],'#c26a46','#843c22','rgba(255,220,170,.16)');           // leste (sol)
  face([[L,T],[L,B],[i0,mid]],'#8a4028','#5a2414','rgba(0,0,0,.28)');                 // oeste
  x.strokeStyle='#e0d6c0';x.lineWidth=2.2;x.beginPath();x.moveTo(i0,mid);x.lineTo(i1,mid);x.moveTo(i0,mid);x.lineTo(L,T);x.moveTo(i0,mid);x.lineTo(L,B);x.moveTo(i1,mid);x.lineTo(R,T);x.moveTo(i1,mid);x.lineTo(R,B);x.stroke();
  x.fillStyle='rgba(0,0,0,.4)';x.fillRect(L,B,R-L,2);
  // chaminé do fogão a lenha
  const chx=R-62,chy=mid-26;x.fillStyle='#7a4a34';x.fillRect(chx,chy,14,24);x.fillStyle='#9a5e42';x.fillRect(chx,chy,14,5);x.fillStyle='#2a1a12';x.fillRect(chx+3,chy+1,8,3);
  o.canvas=c;o.chimney={x:chx-o.ax+7,y:chy-o.base+2};return o;
}
// Paiol/celeiro de tábuas vermelhas com telhado de zinco de 2 águas.
function pzMBarn(){
  const W=150,D=92,H=56,P=10,[c,x]=pzMCanvas(W+P*2,D+H+P*2),rnd=mulberry32(7302),o={W:W+P*2,H:D+H+P*2,ax:W/2+P,base:D+H+P};
  const X=P,Y=P;
  x.fillStyle='#8a2e24';x.fillRect(X,Y+D,W,H);
  for(let xx=X;xx<X+W;xx+=6){x.fillStyle=rnd()<.5?'#7a261e':'#9a3a2c';x.fillRect(xx,Y+D,5,H);x.fillStyle='rgba(0,0,0,.3)';x.fillRect(xx+5,Y+D,1,H);}
  x.fillStyle='#e8e0cc';x.fillRect(X+45,Y+D+10,60,H-10);x.fillStyle='#2a1a12';x.fillRect(X+48,Y+D+13,54,H-13);
  x.fillStyle='#d9a84a';for(let k=0;k<5;k++)x.fillRect(X+52+k*10,Y+D+H-12-(k%2)*4,9,12+(k%2)*4); // fardos de feno
  x.strokeStyle='#e8e0cc';x.lineWidth=3;x.beginPath();x.moveTo(X+48,Y+D+13);x.lineTo(X+75,Y+D+H);x.moveTo(X+102,Y+D+13);x.lineTo(X+75,Y+D+H);x.stroke();
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(X,Y+D,W,8);
  const e=7,L=X-e,T=Y-e+4,R=X+W+e,B=Y+D+e,mid=(T+B)/2;
  const zinc=(y0,y1,a,b)=>{const g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(L,y0,R-L,y1-y0);
    for(let xx=L;xx<R;xx+=4){x.fillStyle='rgba(255,255,255,.14)';x.fillRect(xx,y0,1,y1-y0);x.fillStyle='rgba(0,0,0,.16)';x.fillRect(xx+2,y0,1,y1-y0);}
    for(let i=0;i<14;i++){x.fillStyle='rgba(140,70,30,.35)';x.fillRect(L+rnd()*(R-L),y0+rnd()*(y1-y0),4+rnd()*14,2+rnd()*6);}};
  zinc(T,mid,'#6c7276','#8a9094');zinc(mid,B,'#a4aaae','#888e92');
  x.fillStyle='#c8ccd0';x.fillRect(L,mid-1.5,R-L,3);x.fillStyle='rgba(0,0,0,.4)';x.fillRect(L,B,R-L,2);
  o.canvas=c;return o;
}
// Caixa d'água de madeira no alto de quatro pés.
function pzMTower(){
  const [c,x]=pzMCanvas(60,120),o={W:60,H:120,ax:30,base:114};
  x.strokeStyle='#4a3420';x.lineWidth=3;
  for(const [a,b] of [[12,20],[48,40],[20,24],[40,36]]){x.beginPath();x.moveTo(a,114);x.lineTo(b,46);x.stroke();}
  x.lineWidth=1.5;x.beginPath();x.moveTo(14,100);x.lineTo(46,70);x.moveTo(46,100);x.lineTo(14,70);x.stroke();
  x.fillStyle='#6a4a2c';x.fillRect(8,14,44,34);for(let xx=8;xx<52;xx+=5){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(xx,14,1,34);}
  x.fillStyle='#8a6a44';x.fillRect(8,14,8,34);x.fillStyle='#3a3a3a';for(const yy of [18,30,42])x.fillRect(8,yy,44,2);
  x.fillStyle='#5a5e60';x.beginPath();x.ellipse(30,14,23,7,0,0,Math.PI*2);x.fill();x.fillStyle='#7a7e80';x.beginPath();x.ellipse(32,12,15,4,0,0,Math.PI*2);x.fill();
  o.canvas=c;return o;
}
function pzMCoop(){
  const W=78,D=40,H=26,P=6,[c,x]=pzMCanvas(W+P*2,D+H+P*2),o={W:W+P*2,H:D+H+P*2,ax:W/2+P,base:D+H+P},X=P,Y=P;
  x.fillStyle='#8a6a44';x.fillRect(X,Y+D,W,H);x.strokeStyle='rgba(220,220,210,.55)';x.lineWidth=.6;
  for(let k=0;k<W;k+=4){x.beginPath();x.moveTo(X+k,Y+D+4);x.lineTo(X+k+4,Y+D+H);x.moveTo(X+k+4,Y+D+4);x.lineTo(X+k,Y+D+H);x.stroke();}
  x.fillStyle='#5a3a20';for(const px of [X,X+W/2-2,X+W-4])x.fillRect(px,Y+D,4,H);
  for(let yy=Y-2;yy<Y+D+4;yy+=4){x.fillStyle=(yy/4)%2?'#8e9498':'#a8aeb2';x.fillRect(X-4,yy,W+8,4);}
  o.canvas=c;return o;
}
// Cruzeiro: a cruz de madeira no alto do morro (dá nome ao lugar), sobre um monte de pedras.
function pzMCross(){
  const [c,x]=pzMCanvas(70,140),o={W:70,H:140,ax:35,base:132};
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2;x.fillStyle=i%3?'#8a8478':'#a8a294';x.beginPath();x.ellipse(35+Math.cos(a)*14,128+Math.sin(a)*4,7,5,0,0,Math.PI*2);x.fill();}
  x.fillStyle='#b8b2a4';x.beginPath();x.ellipse(35,125,12,5,0,0,Math.PI*2);x.fill();
  x.fillStyle='#4a3020';x.fillRect(31,10,9,118);x.fillRect(10,34,51,9);x.fillStyle='#6a4a30';x.fillRect(32,10,3,118);x.fillRect(10,35,51,3);
  x.strokeStyle='rgba(240,240,230,.7)';x.lineWidth=1.2;x.beginPath();x.moveTo(36,46);x.quadraticCurveTo(26,60,38,74);x.stroke(); // pano branco amarrado
  x.fillStyle='rgba(240,236,224,.85)';x.beginPath();x.moveTo(38,44);x.lineTo(48,50);x.lineTo(44,70);x.lineTo(38,62);x.closePath();x.fill();
  o.canvas=c;return o;
}
// Porteira com a placa da fazenda (nome fictício: Seu João é personagem da história).
function pzMGate(){
  const [c,x]=pzMCanvas(160,80),o={W:160,H:80,ax:80,base:74};
  x.fillStyle='#4a3020';x.fillRect(22,14,8,60);x.fillRect(130,14,8,60);x.fillStyle='#6a4a30';x.fillRect(23,14,3,60);x.fillRect(131,14,3,60);
  x.fillStyle='#5a3a22';x.fillRect(14,8,132,16);x.fillStyle='#7a5432';x.fillRect(16,10,128,12);
  x.fillStyle='#f0e6c8';x.font='bold 8px monospace';x.textAlign='center';x.fillText('FAZENDA DO SEU JOÃO',80,19);
  // folha da porteira aberta, encostada do lado
  x.strokeStyle='#8a6a44';x.lineWidth=3;for(const yy of [44,54,64]){x.beginPath();x.moveTo(30,yy);x.lineTo(62,yy-6);x.stroke();}
  x.beginPath();x.moveTo(30,44);x.lineTo(62,58);x.stroke();
  o.canvas=c;return o;
}
function pzMorroBuildCards(){
  const M=PZ_MORRO;
  const add=(make,x,y,fp,extra)=>{const s=make();const card=Object.assign({x,y,s,a:1},extra||{});M.cards.push(card);if(fp)pzMorroBlock(fp);return card;};
  // casa sede: pé (fachada) em y=1290, ocupa x 3710..3930 e 104 de fundo
  M.house=add(pzMHouse,3820,1290,{x:3710,y:1186,w:220,h:104},{occW:240,occH:170,smoke:1,shadow:1});
  add(pzMBarn,4075,1240,{x:4000,y:1148,w:150,h:92},{occW:166,occH:160,shadow:1});
  add(pzMTower,3600,1235,{x:3584,y:1224,w:32,h:12},{occW:50,occH:110});
  add(pzMCoop,4045,1430,{x:4006,y:1390,w:78,h:40},{occW:86,occH:70,shadow:1});
  add(pzMCross,3740,1060,{x:3728,y:1052,w:24,h:10},{occW:56,occH:130});
  add(pzMGate,3820,1600,null,{occW:150,occH:70});
  pzMorroBlock({x:3739,y:1592,w:12,h:10});pzMorroBlock({x:3889,y:1592,w:12,h:10}); // esteios da porteira
  pzMorroBlock({x:3866,y:1410,w:26,h:22}); // poço
  pzMorroBlock({x:3612,y:1548,w:62,h:34}); // trator velho
}

// ---------- chão do morro (pintado uma vez) ----------
function pzMorroPaint(wb,ctx){
  const M=PZ_MORRO,X0=M.X0,H=M.H,Mg=wb.M,Y0=-Mg,Y1=H+Mg,X1=M.X1+M.OUT,rand=mulberry32(5454);
  // 1) relevo: grade grossa (8 px) com cor por altura e luz do leste/nordeste, ampliada com suavização
  const S=8,gw=Math.ceil((X1-X0)/S),gh=Math.ceil((Y1-Y0)/S),hc=document.createElement('canvas');hc.width=gw;hc.height=gh;
  const hx=hc.getContext('2d'),img=hx.createImageData(gw,gh),d=img.data,L=[.62,-.42,.66],K=760;
  const low=[118,116,70],mid=[78,104,52],top=[86,116,58];
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){
    const x=X0+i*S,y=Y0+j*S,h=pzMorroH(x,y),dx=(pzMorroH(x+S,y)-pzMorroH(x-S,y))/(2*S)*K,dy=(pzMorroH(x,y+S)-pzMorroH(x,y-S))/(2*S)*K;
    const nl=Math.hypot(dx,dy,1),sh=(-dx*L[0]-dy*L[1]+L[2])/nl;
    const t=Math.min(1,h/.55),u=Math.max(0,(h-.55)/.45),base=low.map((v,k)=>v+(mid[k]-v)*t+(top[k]-mid[k])*u);
    const f=(h*15)%1,lit=(.6+.52*sh)*(.84+.24*Math.min(1,h)),cont=h>.04?(f<.06?.9:f<.14?1.04:1):1,o=(j*gw+i)*4;
    d[o]=Math.min(255,base[0]*lit*cont);d[o+1]=Math.min(255,base[1]*lit*cont);d[o+2]=Math.min(255,base[2]*lit*cont);d[o+3]=255;
  }
  hx.putImageData(img,0,0);
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(hc,X0,Y0,gw*S,gh*S);ctx.restore();
  // 2) capim: pontinhos e touceiras
  const gt=wb.pzNoiseTile('capim',128,(r)=>{const n=r();return n<.05?[30,44,20,120]:n<.1?[170,180,100,70]:n<.14?[90,70,40,60]:[0,0,0,0];});
  ctx.fillStyle=ctx.createPattern(gt,'repeat');ctx.fillRect(X0,Y0,X1-X0,Y1-Y0);
  for(let i=0;i<9000;i++){const x=X0+rand()*(X1-X0),y=Y0+rand()*(Y1-Y0);if(x<2960)continue;
    ctx.strokeStyle=['rgba(40,60,26,.5)','rgba(120,140,70,.45)','rgba(150,140,80,.35)'][Math.floor(rand()*3)];ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(rand()-.5)*5,y-4-rand()*5);ctx.moveTo(x+2,y);ctx.lineTo(x+3+(rand()-.5)*4,y-3-rand()*4);ctx.stroke();}
  // terra exposta e pedras de granito (sombra para o oeste: o sol vem do leste)
  for(let i=0;i<120;i++){const x=3000+rand()*(M.X1-3000),y=rand()*H;ctx.fillStyle='rgba(110,86,56,.28)';ctx.beginPath();ctx.ellipse(x,y,14+rand()*30,6+rand()*14,rand()*3,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<220;i++){const x=3000+rand()*(M.X1+300-3000),y=Y0+400+rand()*(Y1-Y0-800),s=3+rand()*(rand()<.1?16:7);
    ctx.fillStyle='rgba(20,24,14,.35)';ctx.beginPath();ctx.ellipse(x-s*.5,y+s*.3,s*1.1,s*.6,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8a877c';ctx.beginPath();ctx.ellipse(x,y,s,s*.7,rand(),0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#b4b0a2';ctx.beginPath();ctx.ellipse(x+s*.25,y-s*.2,s*.5,s*.32,0,0,Math.PI*2);ctx.fill();}
  // 3) avenida do pé do morro (a antiga beira-mar, sem a praia) e calçada de terra
  const AV=100,a0=X0+14,a1=X0+AV-12,midA=(a0+a1)/2;
  r(ctx,X0,Y0,AV,Y1-Y0,'#47423f');r(ctx,a0,Y0,a1-a0,Y1-Y0,'#1d1f24');asphaltVariation(ctx,a0,Y0,a1-a0,Y1-Y0,9911);
  r(ctx,a0-3,Y0,3,Y1-Y0,'#6a6562');r(ctx,a1,Y0,4,Y1-Y0,'#77726c');
  r(ctx,midA-3,Y0,2,Y1-Y0,'#c9a43a');r(ctx,midA+1,Y0,2,Y1-Y0,'#c9a43a');
  for(const [y0,y1] of [[401,754],[1777,2053]]){r(ctx,X0,y0+13,a0-X0,y1-y0-26,'#1d1f24');for(const yy of [y0-18,y1+4])for(let x=a0+3;x<a1-6;x+=9)r(ctx,x,yy,5,14,'rgba(214,208,196,.7)');r(ctx,midA-3,y0,6,y1-y0,'#1d1f24');}
  for(let i=0;i<200;i++){const y=Y0+rand()*(Y1-Y0),x=a0+rand()*(a1-a0);ctx.fillStyle=rand()<.5?'rgba(5,6,8,.3)':'rgba(120,110,96,.12)';ctx.beginPath();ctx.ellipse(x,y,3+rand()*9,2+rand()*4,rand()*3,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<30;i++)crack(ctx,a0+rand()*(a1-a0),Y0+rand()*(Y1-Y0),8+rand()*18,'#0d0f12');
  const verge=ctx.createLinearGradient(X0+AV,0,X0+AV+70,0);verge.addColorStop(0,'rgba(92,74,50,.85)');verge.addColorStop(1,'rgba(92,74,50,0)');ctx.fillStyle=verge;ctx.fillRect(X0+AV,Y0,70,Y1-Y0);
  // 4) Estrada do Cruzeiro (terra batida com cascalho, sulcos de pneu) e a trilha
  const stroke=(pts,w,col,dash)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';if(dash)ctx.setLineDash(dash);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.setLineDash([]);};
  const offset=(pts,o)=>pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [p[0]-(b[1]-a[1])/l*o,p[1]+(b[0]-a[0])/l*o];});
  const road=M.road,RW=M.RW;
  stroke(road,RW+22,'rgba(40,34,20,.35)');stroke(road,RW+10,'#6e5a3c');stroke(road,RW,'#8a7250');
  stroke(offset(road,RW*.22),9,'rgba(70,54,34,.55)');stroke(offset(road,-RW*.22),9,'rgba(70,54,34,.55)');
  stroke(road,6,'rgba(120,150,70,.45)',[14,10]); // capim no meio
  for(let i=0;i<1600;i++){const p=road[Math.floor(rand()*road.length)],x=p[0]+(rand()-.5)*RW*.9,y=p[1]+(rand()-.5)*RW*.9;ctx.fillStyle=rand()<.5?'rgba(170,150,120,.6)':'rgba(60,46,30,.5)';ctx.fillRect(x,y,2,2);}
  for(let i=0;i<14;i++){const p=road[30+Math.floor(rand()*(road.length-60))];ctx.fillStyle='rgba(60,70,80,.55)';ctx.beginPath();ctx.ellipse(p[0]+(rand()-.5)*30,p[1]+(rand()-.5)*20,8+rand()*12,4+rand()*6,rand()*3,0,Math.PI*2);ctx.fill();} // poças de lama
  // cerca de mourão e arame no lado do barranco (onde o terreno desce)
  for(let i=6;i<road.length-6;i+=4){const p=road[i],a=road[i-2],b=road[i+2],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/l,ny=(b[0]-a[0])/l;
    const side=pzMorroH(p[0]+nx*60,p[1]+ny*60)<pzMorroH(p[0]-nx*60,p[1]-ny*60)?1:-1,o=RW/2+9;
    const qx=p[0]+nx*o*side,qy=p[1]+ny*o*side;if(qx<2960)continue;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(qx-4,qy,5,3);ctx.fillStyle='#5a4028';ctx.fillRect(qx-2,qy-5,4,6);ctx.fillStyle='#7a5a3a';ctx.fillRect(qx-2,qy-5,2,6);}
  stroke(offset(road,RW/2+9).map((p,i)=>p),.8,'rgba(200,200,190,.25)');
  stroke(M.trail,26,'rgba(40,34,20,.3)');stroke(M.trail,20,'#7a6444');stroke(M.trail,8,'rgba(60,46,30,.5)',[6,8]);
  for(let i=4;i<M.trail.length;i+=9){const p=M.trail[i];ctx.fillStyle='#9a958a';ctx.beginPath();ctx.ellipse(p[0]+(rand()-.5)*6,p[1],5,3,rand(),0,Math.PI*2);ctx.fill();} // degraus de pedra
  // 5) fazenda: terreiro de terra, horta, curral e cerca do pasto
  const F=M.F;
  ctx.fillStyle='rgba(150,118,76,.75)';ctx.beginPath();ctx.ellipse(F.x,F.y+60,300,220,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(170,136,90,.6)';ctx.beginPath();ctx.ellipse(F.x,F.y+80,230,150,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<900;i++){const a=rand()*Math.PI*2,dd=Math.sqrt(rand()),x=F.x+Math.cos(a)*dd*290,y=F.y+60+Math.sin(a)*dd*210;ctx.fillStyle=rand()<.5?'rgba(120,92,60,.5)':'rgba(200,170,130,.4)';ctx.fillRect(x,y,2,2);}
  // calçada de cerâmica vermelha da varanda
  r(ctx,3700,1290,240,22,'#9a4a34');for(let x=3700;x<3940;x+=12)r(ctx,x,1290,1,22,'rgba(0,0,0,.2)');r(ctx,3700,1300,240,1,'rgba(0,0,0,.2)');
  // horta (canteiros com couve, alface e milho)
  for(let k=0;k<7;k++){const y=1360+k*18;r(ctx,3590,y,150,12,'#5a3e26');r(ctx,3590,y,150,3,'#6e4e30');
    for(let x=3596;x<3734;x+=9){ctx.fillStyle=k%3===0?'#7ab04a':k%3===1?'#4a8a3a':'#a8c060';ctx.beginPath();ctx.arc(x,y+6,3.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,200,.3)';ctx.fillRect(x,y+4,1.5,1.5);}}
  // curral / pasto cercado com tábuas (abertura voltada para a casa)
  const fence=(x0,y0,x1,y1)=>{const n=Math.max(1,Math.round(Math.hypot(x1-x0,y1-y0)/26));
    for(let k=0;k<=n;k++){const x=x0+(x1-x0)*k/n,y=y0+(y1-y0)*k/n;ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-4,y+1,6,3);ctx.fillStyle='#5a3e26';ctx.fillRect(x-2,y-8,4,9);}
    for(const dy of [-6,-2]){ctx.strokeStyle='#8a6a44';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0+dy);ctx.lineTo(x1,y1+dy);ctx.stroke();}};
  ctx.fillStyle='rgba(120,150,70,.35)';ctx.fillRect(3980,1480,260,150);
  fence(3980,1480,4240,1480);fence(4240,1480,4240,1630);fence(3980,1630,4240,1630);fence(3980,1480,3980,1530);fence(3980,1590,3980,1630);
  // poço, trator velho, lenha e varal
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(3876,1426,17,8,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8a877c';ctx.beginPath();ctx.arc(3879,1421,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1a2026';ctx.beginPath();ctx.arc(3879,1421,8,0,Math.PI*2);ctx.fill();
  r(ctx,3866,1404,3,18,'#4a3020');r(ctx,3889,1404,3,18,'#4a3020');r(ctx,3864,1402,30,4,'#6a4a30');
  ctx.save();ctx.translate(3643,1565);ctx.rotate(-.18);r(ctx,-30,-10,64,30,'rgba(0,0,0,.3)');r(ctx,-34,-16,40,26,'#a8402a');r(ctx,-34,-16,40,6,'#c85a3a');r(ctx,6,-12,22,18,'#8a3424');
  ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.ellipse(-24,14,12,6,0,0,Math.PI*2);ctx.ellipse(-24,-20,12,6,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(20,12,7,4,0,0,Math.PI*2);ctx.ellipse(20,-14,7,4,0,0,Math.PI*2);ctx.fill();
  r(ctx,-14,-6,8,10,'#2a2a2a');r(ctx,10,-20,3,10,'#3a3a3a');ctx.restore();
  for(let k=0;k<5;k++)for(let j=0;j<4-(k%2);j++){ctx.fillStyle=j%2?'#6a4a30':'#8a6a44';ctx.beginPath();ctx.ellipse(3955+j*9+(k%2)*4,1312-k*4,5,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c8a878';ctx.beginPath();ctx.arc(3955+j*9+(k%2)*4,1312-k*4,2,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='rgba(220,220,210,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(3640,1320);ctx.lineTo(3690,1330);ctx.stroke();
  for(let k=0;k<4;k++){ctx.fillStyle=['#c84a3a','#e8e0cc','#3a7fd0','#e8c050'][k];ctx.fillRect(3646+k*11,1321+k*2.2,7,9);}
  // cerca de arame farpado da propriedade (caída em vários pontos)
  for(let k=0;k<140;k++){const a=k/140*Math.PI*2,x=F.x+Math.cos(a)*470,y=F.y+40+Math.sin(a)*360;
    if(pzMDist(M.road,x,y)<70||pzMDist(M.trail,x,y)<40||Math.sin(k*1.7)>.7)continue;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-3,y+1,5,2);ctx.fillStyle='#5a4028';ctx.fillRect(x-1.5,y-6,3,7);}
  // 6) sombras das árvores e das construções (sol do leste → sombra para o oeste)
  for(const t of M.trees){const K=PZ_TREE_KINDS[t.kind],R=K.R*t.sc,T=K.T*t.sc;
    ctx.fillStyle='rgba(16,26,10,.30)';ctx.beginPath();ctx.ellipse(t.x-T*.55-R*.3,t.y+2,R*1.05,R*.5,0,0,Math.PI*2);ctx.fill();}
  for(const c of M.cards){if(!c.shadow)continue;ctx.fillStyle='rgba(16,20,10,.32)';const w=c.occW*.9;ctx.fillRect(c.x-w/2-28,c.y-c.occH*.55,w,c.occH*.55+6);}
  // 7) mata fechada fora do mapa (desenhada achatada na faixa: sem objeto, sem custo por quadro)
  const outer=[];const rr=mulberry32(5455);
  for(let y=Y0;y<Y1;y+=34)for(let x=X0+120;x<X1;x+=34){
    const inside=x<M.X1+30&&y>-40&&y<H+40;if(inside)continue;
    if(x<2990)continue;
    const v=rr();outer.push([x+(rr()-.5)*30,y+(rr()-.5)*30,v<.03?4:v<.05?5:v<.08?6:[0,1,2,3][Math.floor(rr()*4)],.85+rr()*.4]);
  }
  outer.sort((a,b)=>a[1]-b[1]);
  for(const [x,y,k,sc] of outer){const s=pzTreeSprite(k);ctx.drawImage(s.canvas,x-s.ox*sc,y-s.oy*sc,s.W*sc,s.H*sc);}
  // mata do fundo mais escura (sombra da própria copa), para o que é jogável se destacar
  ctx.fillStyle='rgba(8,16,8,.34)';ctx.fillRect(M.X1+30,Y0,X1-M.X1-30,Y1-Y0);ctx.fillRect(X0+100,Y0,M.X1+30-X0-100,Mg-40);ctx.fillRect(X0+100,H+40,M.X1+30-X0-100,Mg-40);
  // névoa leve na mata ao fundo e tom geral para casar com a cidade
  ctx.fillStyle='rgba(22,26,32,.12)';ctx.fillRect(X0,Y0,X1-X0,Y1-Y0);
}

// ---------- objetos em pé na ordem de profundidade ----------
function pzMorroAlpha(o,x,y,W,H,player){
  let t=1;if(player&&player.y<y-2&&player.y>y-H-6&&Math.abs(player.x-x)<W/2+8)t=.3;
  o.__fa=(o.__fa??1)+(t-(o.__fa??1))*.22;return o.__fa;
}
function pzMorroDrawables(camera,player){
  const M=PZ_MORRO,out=[];if(!M.ready)return out;
  const vw=camera.viewport.width/camera.zoom/2,vh=camera.viewport.height/camera.zoom/2;
  if(camera.x+vw+120<M.X0)return out;
  const x0=camera.x-vw-80,x1=camera.x+vw+80,y0=camera.y-vh-40,y1=camera.y+vh+160;
  for(let gy=Math.floor(y0/M.GC);gy<=Math.floor(y1/M.GC);gy++)for(let gx=Math.floor(x0/M.GC);gx<=Math.floor(x1/M.GC);gx++){
    const b=M.grid.get(gx+','+gy);if(!b)continue;
    for(const t of b){if(t.x<x0||t.x>x1||t.y<y0||t.y>y1)continue;
      out.push({x:t.x,y:t.y,__tall:1,lean:1,draw(ctx){
        const s=pzTreeSprite(t.kind),sc=t.sc,a=pzMorroAlpha(t,t.x,t.y,s.R*2*sc,(s.T+s.R*2)*sc,player);
        if(a<.99)ctx.globalAlpha=a;
        if(t.flip){ctx.save();ctx.translate(t.x,0);ctx.scale(-1,1);ctx.drawImage(s.canvas,-s.ox*sc,t.y-s.oy*sc,s.W*sc,s.H*sc);ctx.restore();}
        else ctx.drawImage(s.canvas,t.x-s.ox*sc,t.y-s.oy*sc,s.W*sc,s.H*sc);
        ctx.globalAlpha=1;}});
    }
  }
  const now=performance.now()*.001;
  for(const c of M.cards){const s=c.s;if(c.x+s.W<x0||c.x-s.W>x1||c.y<y0||c.y-s.H>y1+200)continue;
    out.push({x:c.x,y:c.y,__tall:1,lean:1,draw(ctx){
      const a=pzMorroAlpha(c,c.x,c.y,c.occW,c.occH,player);if(a<.99)ctx.globalAlpha=a;
      ctx.drawImage(s.canvas,c.x-s.ax,c.y-s.base,s.W,s.H);
      if(c.smoke&&s.chimney){ // fumaça do fogão a lenha: Seu João ainda está lá?
        for(let k=0;k<4;k++){const ph=(now*.25+k/4)%1,sx=c.x+s.chimney.x+ph*16+Math.sin(now+k)*3,sy=c.y+s.chimney.y-ph*46;
          ctx.fillStyle=`rgba(210,210,205,${(.3*(1-ph)*a).toFixed(3)})`;ctx.beginPath();ctx.arc(sx,sy,4+ph*9,0,Math.PI*2);ctx.fill();}}
      ctx.globalAlpha=1;}});
  }
  return out;
}

// ---------- zonas ----------
const PZ_MORRO_ZONES={
  morro:{id:'morro',name:'MORRO DO CRUZEIRO',short:'MORRO',x:2800,y:0,w:1600,h:2800,color:'#7aa05a'},
  fazenda:{id:'fazenda',name:'FAZENDA DO SEU JOÃO',short:'FAZENDA',x:3360,y:950,w:920,h:700,color:'#d9a84a'},
};
{const _dz=districtAt;
 districtAt=function(x,y){
   if(x>=PZ_MORRO.X0+100)return pzMInFarm(x,y)?PZ_MORRO_ZONES.fazenda:PZ_MORRO_ZONES.morro;
   return _dz(x,y);
 };}

// ---------- ligação ----------
pzMorroPlantTrees();pzMorroBuildCards();PZ_MORRO.ready=true;
{const _wd=pzWallDrawables;
 pzWallDrawables=function(camera){
   const out=_wd(camera);
   const pl=window.__projectZGame?.scenes?.current?.run?.player||null;
   for(const d of pzMorroDrawables(camera,pl))out.push(d);
   return out;
 };}
// sem mar: a borda não tem mais linha da praia (o reflexo da lua da noite antiga some junto)
WorldBorder.prototype.shore=null;
