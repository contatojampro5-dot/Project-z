// -- src/world/Buildings3D.js --
// R32 · Deméter + Hefesto — cenário em 3D de verdade.
// Antes o prédio era um "cartão" fixo: telhado empurrado para cima e só a fachada da frente.
// Agora cada prédio é uma caixa 3D vista por uma câmera alta, um pouco ao sul da tela (perspectiva):
//  • o telhado fica mais perto da câmera e "foge" do ponto de fuga, então os prédios se inclinam
//    para longe do centro da visão e mudam de ângulo conforme o jogador anda (paralaxe real);
//  • aparecem as paredes laterais (leste/oeste) de quem está à esquerda ou à direita da câmera;
//  • a base (colisão) e o chão continuam exatamente iguais — a jogabilidade não muda.
// Cada parede é desenhada em faixas horizontais finas com transformação afim (perspectiva sem WebGL).
// Desligar para comparar: window.__PZ_FLAT3D=true no console.
const PZ_3D={E:1.5,lean:1,band:6,vx:0,vy:0,a:0,ready:false};

function pz3dOn(){return !window.__PZ_FLAT3D&&PZ_3D.ready;}
// Câmera: ponto de fuga abaixo do centro da tela; a = quanto cada pixel de altura afasta do ponto de fuga.
function pz3dCamera(camera,viewport){
  const z=camera.zoom||1,vh=Math.max(viewport.height,viewport.width*.62)/z,E=PZ_3D.E*vh;
  PZ_3D.vx=camera.x;PZ_3D.vy=camera.y+E;PZ_3D.a=PZ_3D.lean/E;PZ_3D.ready=true;
}
function pz3dP(x,y,z){const k=1+PZ_3D.a*z;return{x:PZ_3D.vx+(x-PZ_3D.vx)*k,y:PZ_3D.vy+(y-PZ_3D.vy)*k};}

// Parede plana de A até B (no chão), com altura H. Textura: coluna sx→A, sx+sw→B; linha sy = topo (z=H).
function pz3dWall(ctx,base,img,sx,sy,sw,sh,Ax,Ay,Bx,By,H,band){
  const n=Math.max(1,Math.ceil(H/band)),dz=H/n,ts=sh/H;
  for(let i=0;i<n;i++){
    const z1=H-i*dz,z0=z1-dz;
    const P1=pz3dP(Ax,Ay,z1),P2=pz3dP(Bx,By,z1),P3=pz3dP(Ax,Ay,z0);
    const th=dz*ts;
    ctx.setTransform(base);
    ctx.transform((P2.x-P1.x)/sw,(P2.y-P1.y)/sw,(P3.x-P1.x)/th,(P3.y-P1.y)/th,P1.x,P1.y);
    ctx.drawImage(img,sx,sy+i*th,sw,th,0,0,sw,th*1.08+.25); // leve sobreposição: sem frestas entre faixas
  }
  ctx.setTransform(base);
}
function pz3dQuad(ctx,Ax,Ay,Bx,By,H,fill){
  const a=pz3dP(Ax,Ay,0),b=pz3dP(Bx,By,0),c=pz3dP(Bx,By,H),d=pz3dP(Ax,Ay,H);
  ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
}

// Empena (parede lateral): a maioria é cega, de reboco manchado, com pixo; algumas têm janelas.
function pz3dSide(b){
  if(b.side)return b.side;
  const res=b.res,len=b.h,H=b.H;
  const c=document.createElement('canvas');c.width=Math.ceil(len*res);c.height=Math.ceil(H*res);
  const x=c.getContext('2d');x.scale(res,res);
  const rand=mulberry32(Math.round(b.x*7+b.y*11+b.h));
  if(rand()<.38){
    // lateral com janelas: reaproveita a fachada, com outra semente
    const fake={x:b.x+3,y:b.y+5,w:len,H,options:b.options,lit:[],doors:[]};
    pzPaintFacade(x,fake,0,0);
  }else{
    const tones=[[150,146,138],[128,124,120],[168,150,128],[120,128,126],[176,160,140]];
    const t=tones[Math.floor(rand()*tones.length)];
    const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,`rgb(${t.join(',')})`);g.addColorStop(1,`rgb(${t.map(v=>Math.round(v*.55)).join(',')})`);
    x.fillStyle=g;x.fillRect(0,0,len,H);
    // reboco descascado mostrando tijolo, manchas de chuva e infiltração
    for(let i=0;i<Math.floor(len/14);i++){const px=rand()*len,py=rand()*H,pw=6+rand()*18,ph=4+rand()*12;
      x.fillStyle=`rgba(${rand()<.5?'122,64,46':'70,60,52'},${(.25+rand()*.35).toFixed(2)})`;x.fillRect(px,py,pw,ph);}
    for(let i=0;i<Math.floor(len/6);i++){const sx=rand()*len;x.fillStyle=`rgba(20,22,24,${(.06+rand()*.14).toFixed(3)})`;x.fillRect(sx,rand()*H*.2,1+rand()*2.5,10+rand()*H*.7);}
    x.fillStyle='rgba(30,40,30,.25)';x.fillRect(0,H-10,len,10); // umidade no pé da parede
    // marcas das lajes e uma janelinha de banheiro (vitrô) aqui e ali
    const F=PZ_TALL.floor,floors=Math.max(2,Math.round(H/F)),fh=H/floors;
    for(let f=1;f<floors;f++){x.fillStyle='rgba(60,58,56,.25)';x.fillRect(0,f*fh-2,len,1.5);}
    for(let f=0;f<floors-1;f++)if(rand()<.5){const wx=8+rand()*Math.max(1,len-24),wy=f*fh+6;x.fillStyle='#1a1d22';x.fillRect(wx,wy,10,8);x.fillStyle='rgba(170,190,210,.25)';x.fillRect(wx+1,wy+1,4,6);}
    if(typeof pzPixo==='function'&&rand()<.75)pzPixo(x,4+rand()*Math.max(1,len-80),6+rand()*Math.max(1,H*.4),PZ_TAGS[Math.floor(rand()*PZ_TAGS.length)],{size:10});
  }
  b.side=c;return c;
}

// Contorno do prédio na tela (base + telhado), em coordenadas do mundo.
function pz3dBounds(b){
  const r0=pz3dP(b.x,b.y,b.H),r1=pz3dP(b.x+b.w,b.y+b.h,b.H);
  return{x0:Math.min(b.x,r0.x),y0:Math.min(b.y,r0.y),x1:Math.max(b.x+b.w,r1.x),y1:b.y+b.h,rx0:r0.x,ry0:r0.y,rx1:r1.x,ry1:r1.y};
}

function pz3dDrawTall(ctx,b){
  const c=pzTallCache(b),res=b.res,pad=c.pad,{x,y,w,h,H}=b,x1=x+w,y1=y+h;
  const base=ctx.getTransform(),band=PZ_3D.band;
  ctx.save();if(b.alpha<.995)ctx.globalAlpha=b.alpha;ctx.imageSmoothingEnabled=true;
  const vx=PZ_3D.vx,vy=PZ_3D.vy;
  // paredes laterais: quem está à esquerda da câmera mostra a parede leste, e vice-versa
  if(vx>x1+1){const s=pz3dSide(b);pz3dWall(ctx,base,s,0,0,s.width,s.height,x1,y,x1,y1,H,band);
    pz3dQuad(ctx,x1,y,x1,y1,H,'rgba(255,214,160,.06)');} // A13: sol do leste bate nessa face
  if(vx<x-1){const s=pz3dSide(b);pz3dWall(ctx,base,s,0,0,s.width,s.height,x,y,x,y1,H,band);
    pz3dQuad(ctx,x,y,x,y1,H,'rgba(0,0,0,.2)');}
  if(vy<y-1)pz3dQuad(ctx,x,y,x1,y,H,'#24252a'); // parede de trás (só se a câmera passar do prédio)
  // fachada da frente (sul)
  if(vy>y1)pz3dWall(ctx,base,c.canvas,pad*res,(pad+h)*res,w*res,H*res,x,y1,x1,y1,H,band);
  if(typeof pzDLBuilding==='function')pzDLBuilding(ctx,b); // R34: fogo/faróis/explosões só nas faces viradas para a luz
  // telhado (com platibanda): a uma altura H, é só um retângulo ampliado a partir do ponto de fuga
  {const e=6,r0=pz3dP(x-e,y-7,H),r1=pz3dP(x1+e,y1,H);
   ctx.drawImage(c.canvas,(pad-e)*res,(pad-7)*res,(w+e*2)*res,(h+7)*res,r0.x,r0.y,r1.x-r0.x,r1.y-r0.y);
   // aresta do telhado com a fachada: linha de luz fina (dá leitura de volume)
   ctx.fillStyle='rgba(255,240,220,.08)';const a=pz3dP(x,y1,H),bb=pz3dP(x1,y1,H);ctx.fillRect(a.x,a.y-1,bb.x-a.x,1.4);}
  ctx.restore();
}

// Janelas acesas (mapa de luz noturna) na mesma perspectiva da fachada.
function pz3dDrawEmis(L,b,c){
  const res=b.res,pad=c.pad,base=L.getTransform();
  if(PZ_3D.vy>b.y+b.h)pz3dWall(L,base,c.emis,pad*res,(pad+b.h)*res,b.w*res,b.H*res,b.x,b.y+b.h,b.x+b.w,b.y+b.h,b.H,12);
  L.setTransform(base);
}

const _pzTallDrawablesFlat=pzTallDrawables;
pzTallDrawables=function(camera,viewport,player,dt){
  if(window.__PZ_FLAT3D){PZ_3D.ready=false;return _pzTallDrawablesFlat(camera,viewport,player,dt);}
  pz3dCamera(camera,viewport);
  const out=[];if(!PZ_TALL.list.length)return out;
  const vw=viewport.width/(camera.zoom||1)/2+60,vh=viewport.height/(camera.zoom||1)/2+60;
  for(const b of PZ_TALL.list){
    const q=pz3dBounds(b);
    if(q.x1<camera.x-vw||q.x0>camera.x+vw||q.y1<camera.y-vh||q.y0>camera.y+vh)continue;
    // translúcido só quando o jogador está atrás (na área que o volume cobre na tela, acima da base)
    let target=1;
    if(player&&player.x>q.x0-14&&player.x<q.x1+14&&player.y<q.y1-2&&player.y>q.y0-34)target=.32;
    b.alpha+=(target-b.alpha)*Math.min(1,(dt||.016)*9);
    // empate na mesma linha de base: o mais longe da câmera é desenhado antes
    out.push({y:q.y1-Math.abs(b.x+b.w/2-PZ_3D.vx)*1e-3,__tall:b,draw(ctx){pz3dDrawTall(ctx,b);}});
  }
  return out;
};
