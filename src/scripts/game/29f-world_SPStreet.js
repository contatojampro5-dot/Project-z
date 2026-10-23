// -- src/world/SPStreet.js --
// ATLAS A10 · Deméter — rua de São Paulo (Zona Leste).
// Chão: calçada "mapa de SP" (preto/branco) no Centro, concreto remendado nos bairros, faixa exclusiva
// "ÔNIBUS", ciclofaixa vermelha com tachões, lombadas, bueiros, caçambas de entulho, motos caídas com baú
// de entrega, carroças de catador, mesas plásticas de boteco, lonas de camelô, sacos de lixo.
// Em pé (ordenados com os personagens): postes de concreto com emaranhado de fios e transformador,
// orelhões laranja/azuis, bancas de jornal, papeleiras verdes, pontos de ônibus.
// No ar: fiação entre os postes e a rede do trólebus sobre a Av. Rangel Pestana.

const PZ_SP={props:[],poles:[],seeded:false};
const PZ_INTERSECT=[[398,748,401,754],[1847,2055,401,754],[398,748,1777,2053],[1847,2055,1777,2053]];
function pzInCross(x,y,pad=0){return PZ_INTERSECT.some(([x0,x1,y0,y1])=>x>x0-pad&&x<x1+pad&&y>y0-pad&&y<y1+pad);}
function pzRectFree(x,y,w,h,pad=4){
  if(typeof OBSTACLES==='undefined')return true;
  return !OBSTACLES.some(o=>x<o.x+o.w+pad&&x+w>o.x-pad&&y<o.y+o.h+pad&&y+h>o.y-pad);
}
// Faixas de calçada de 24 de largura dos dois lados de cada avenida.
function pzSidewalks(){
  const out=[];
  for(const r of PZ_ROADS){
    if(r.v){out.push({x:r.x-24,y:r.y,w:24,h:r.h,v:1,side:-1,road:r});out.push({x:r.x+r.w,y:r.y,w:24,h:r.h,v:1,side:1,road:r});}
    else{out.push({x:r.x,y:r.y-24,w:r.w,h:24,v:0,side:-1,road:r});out.push({x:r.x,y:r.y+r.h,w:r.w,h:24,v:0,side:1,road:r});}
  }
  return out;
}

// ---------- texturas ----------
const PZ_SP_TILES={};
function pzPisoPaulista(){
  if(PZ_SP_TILES.piso)return PZ_SP_TILES.piso;
  // módulo de Mirthes Bernardes: peças preta, branca e meia-cara (diagonal) formando o "mapa"
  const S=4,c=document.createElement('canvas');c.width=c.height=S*4;const x=c.getContext('2d');
  const W="#9e998f",B="#3a3a3c";
  const cell=(i,j,t,rot)=>{const px=i*S,py=j*S;x.fillStyle=t==='b'?B:W;x.fillRect(px,py,S,S);
    if(t==='d'){x.fillStyle=B;x.beginPath();const p=[[px,py],[px+S,py],[px+S,py+S],[px,py+S]];const a=p[rot%4],b=p[(rot+1)%4],d=p[(rot+3)%4];x.moveTo(...a);x.lineTo(...b);x.lineTo(...d);x.closePath();x.fill();}};
  const grid=[['w','d0','d1','w'],['d3','b','b','d1'],['d3','b','b','d2'],['w','d3','d2','w']];
  // módulo: um "mapa" preto no meio, quatro meias-caras em volta
  const m=[['d',2],['b'],['b'],['d',3]];
  for(let j=0;j<4;j++)for(let i=0;i<4;i++){const g=grid[j][i];if(g==='w')cell(i,j,'w');else if(g==='b')cell(i,j,'b');else cell(i,j,'d',+g[1]);}
  x.strokeStyle='rgba(0,0,0,.14)';x.lineWidth=.4;for(let k=0;k<=4;k++){x.beginPath();x.moveTo(k*S,0);x.lineTo(k*S,S*4);x.moveTo(0,k*S);x.lineTo(S*4,k*S);x.stroke();}
  return PZ_SP_TILES.piso=c;
}
function pzConcreto(){
  if(PZ_SP_TILES.conc)return PZ_SP_TILES.conc;
  // placas de concreto 24×24 (calçada comum de bairro), mais claras que o asfalto
  const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d'),rnd=mulberry32(77);
  x.fillStyle='#86827a';x.fillRect(0,0,48,48);
  for(let k=0;k<4;k++){x.fillStyle=['#8b877f','#7f7b74','#8e8a81','#837f77'][k];x.fillRect((k%2)*24+1,(k>>1)*24+1,22,22);}
  for(let i=0;i<260;i++){x.fillStyle=rnd()<.5?'rgba(0,0,0,.09)':'rgba(255,255,255,.06)';x.fillRect(rnd()*48,rnd()*48,1+rnd()*2,1);}
  x.fillStyle='rgba(30,28,26,.55)';x.fillRect(0,0,48,1);x.fillRect(0,24,48,1);x.fillRect(0,0,1,48);x.fillRect(24,0,1,48);
  return PZ_SP_TILES.conc=c;
}

// ---------- chão (pintado uma vez nos canvases do mapa) ----------
function pzSPGround(ctx,zone){
  const rand=mulberry32(zone.x*3+zone.y*7+11),center=zone.id==='center';
  const zx0=zone.x,zy0=zone.y,zx1=zone.x+zone.w,zy1=zone.y+zone.h;
  const inZone=(x,y)=>x>=zx0&&x<zx1&&y>=zy0&&y<zy1;
  ctx.save();
  // calçadas (R27): o piso vai do meio-fio até a fachada do prédio (ou 40 de largura quando não há prédio
  // perto), sem buracos por causa de carros/caixas, que são desenhados por cima. O material é por rua,
  // não por zona: não há mais emenda no meio da calçada quando se muda de bairro.
  const BLD=[...OBSTACLES.slice(0,4),...(typeof DISTRICT_BUILDINGS!=='undefined'?DISTRICT_BUILDINGS:[]),
    ...(typeof DISTRICT_PROPS!=='undefined'?DISTRICT_PROPS.filter(p=>p.type==='garden'):[])];
  const inBld=(x,y)=>BLD.some(o=>x>=o.x&&x<o.x+o.w&&y>=o.y&&y<o.y+o.h);
  const sideFill=[];
  for(const s of pzSidewalks()){
    const R=s.road,piso=R===PZ_ROADS[0]||R===PZ_ROADS[2];
    const pat=ctx.createPattern(piso?pzPisoPaulista():pzConcreto(),'repeat');
    const len=s.v?s.h:s.w,step=8,MAX=160;
    for(let a=0;a<len;a+=step){
      const al=(s.v?s.y:s.x)+a+step/2;
      const at=q=>s.v?[s.side<0?R.x-q:R.x+R.w+q,al]:[al,s.side<0?R.y-q:R.y+R.h+q];
      const [cx,cy]=at(3);if(pzOnRoad(cx,cy)||cx<0||cy<0||cx>2800||cy>2800)continue;
      let d=0;while(d<MAX){const [px,py]=at(d+2);if(px<0||py<0||px>2800||py>2800||inBld(px,py)||pzOnRoad(px,py))break;d+=4;}
      const depth=d>=MAX?40:Math.max(d,8);
      const x=s.v?(s.side<0?R.x-depth:R.x+R.w):al-step/2,y=s.v?al-step/2:(s.side<0?R.y-depth:R.y+R.h);
      const w=s.v?depth:step,h=s.v?step:depth;
      if(x+w<zx0||y+h<zy0||x>zx1||y>zy1)continue;
      ctx.fillStyle=pat;ctx.fillRect(x,y,w,h);
      sideFill.push([s,x,y,w,h,d>=MAX]);
    }
  }
  // meio-fio de granito e sarjeta; borda de terra onde a calçada acaba sem prédio
  for(const [s,x,y,w,h,open] of sideFill){
    const R=s.road;
    if(s.v){const cx=s.side<0?x+w-2:x;ctx.fillStyle='#b9b4a8';ctx.fillRect(cx,y,2,h);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(s.side<0?x+w:x-2,y,2,h);
      if(open){ctx.fillStyle='rgba(30,26,20,.45)';ctx.fillRect(s.side<0?x:x+w-1.5,y,1.5,h);}}
    else{const cy=s.side<0?y+h-2:y;ctx.fillStyle='#b9b4a8';ctx.fillRect(x,cy,w,2);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x,s.side<0?y+h:y-2,w,2);
      if(open){ctx.fillStyle='rgba(30,26,20,.45)';ctx.fillRect(x,s.side<0?y:y+h-1.5,w,1.5);}}
  }
  for(const s of pzSidewalks()){
    // sujeira, remendos, rampas de garagem e raízes de tipuana quebrando o piso
    for(let i=0;i<(s.v?s.h:s.w)/40;i++){
      const a=rand()*(s.v?s.h:s.w),x=s.v?s.x+rand()*s.w:s.x+a,y=s.v?s.y+a:s.y+rand()*s.h;
      if(!inZone(x,y)||pzInCross(x,y,4)||!pzRectFree(x-4,y-4,8,8,0))continue;
      const k=rand();
      if(k<.4){ctx.fillStyle='rgba(20,18,16,.28)';ctx.beginPath();ctx.ellipse(x,y,4+rand()*8,2+rand()*4,rand()*3,0,Math.PI*2);ctx.fill();}
      else if(k<.6){ctx.fillStyle=center?'#9a958c':'#4f4d4a';ctx.fillRect(x-5,y-4,10+rand()*8,8);}
      else if(k<.75){ctx.strokeStyle='rgba(30,26,22,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);for(let q=0;q<4;q++)ctx.lineTo(x+(rand()-.5)*14,y+(rand()-.5)*10);ctx.stroke();}
      else{ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-1,y-1,3+rand()*4,2);}
    }
  }
  // faixa exclusiva de ônibus na Av. Rangel Pestana (x 414–732)
  const bus=(x,y0,y1,rot)=>{
    for(let y=y0;y<y1;y+=4){if(pzInCross(x,y,24)||!inZone(x,y))continue;r(ctx,x,y,3,4,'rgba(222,216,204,.78)');}
    ctx.font='900 17px Arial';ctx.fillStyle='rgba(222,216,204,.62)';
    for(let y=y0+120;y<y1;y+=340){if(pzInCross(x,y,90)||!inZone(x,y))continue;const lx=rot>0?x-30:x+30;ctx.save();ctx.translate(lx,y);ctx.rotate(rot);ctx.textAlign='center';ctx.fillText('ÔNIBUS',0,6);ctx.restore();}
  };
  bus(470,0,2800,-Math.PI/2);bus(674,0,2800,Math.PI/2);
  // ciclofaixa vermelha na via de cima (y 417–739), lado norte
  for(let x=0;x<2800;x+=10){if(pzInCross(x,428,30)||!inZone(x,428))continue;
    r(ctx,x,421,10,13,'#8f2a26');if(x%30===0)r(ctx,x+3,436,3,2,'#e8e2d4');}
  for(let x=60;x<2800;x+=220){if(pzInCross(x,428,60)||!inZone(x,428))continue;
    ctx.strokeStyle='rgba(240,236,228,.85)';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x-5,430,3,0,Math.PI*2);ctx.arc(x+5,430,3,0,Math.PI*2);ctx.moveTo(x-5,430);ctx.lineTo(x,426);ctx.lineTo(x+5,430);ctx.stroke();}
  // lombadas
  for(const [x,y,w,h] of [[414,250,318,10],[414,1450,318,10],[1100,417,10,322],[2300,417,10,322],[1300,1790,10,250],[1860,2300,182,10],[1860,1000,182,10]]){
    if(!inZone(x+w/2,y+h/2))continue;r(ctx,x,y,w,h,'#2e2e30');
    for(let k=0;k<(w>h?w:h);k+=12){if(w>h)r(ctx,x+k,y+2,6,h-4,'#c9a43a');else r(ctx,x+2,y+k,w-4,6,'#c9a43a');}
  }
  // bueiros junto ao meio-fio
  for(const r0 of PZ_ROADS)for(let a=60;a<(r0.v?r0.h:r0.w);a+=260){
    const x=r0.v?r0.x+18:r0.x+a,y=r0.v?r0.y+a:r0.y+18;if(!inZone(x,y)||pzInCross(x,y,10))continue;
    r(ctx,x,y,12,7,'#111214');for(let k=1;k<12;k+=2)r(ctx,x+k,y+1,1,5,'#3a3c40');
  }
  // objetos baixos nas calçadas: caçamba, moto caída, carroça, mesas de boteco, lona de camelô, lixo
  let n=0;
  for(const s of pzSidewalks()){
    const len=s.v?s.h:s.w;
    for(let a=30+rand()*80;a<len;a+=90+rand()*170){
      const x=s.v?s.x+s.w/2:s.x+a,y=s.v?s.y+a:s.y+s.h/2;
      if(!inZone(x,y)||pzInCross(x,y,40)||!pzRectFree(x-18,y-14,36,28,2))continue;
      const k=rand();n++;
      ctx.save();ctx.translate(x,y);if(s.v)ctx.rotate(Math.PI/2);
      if(k<.14){ // caçamba de entulho
        const col=['#d8a12a','#c8462f','#2f6f9a','#4a7a3a'][Math.floor(rand()*4)];
        r(ctx,-15,-6,32,16,'rgba(0,0,0,.4)');ctx.fillStyle=pzShade(col,.75);ctx.beginPath();ctx.moveTo(-17,-8);ctx.lineTo(17,-8);ctx.lineTo(14,8);ctx.lineTo(-14,8);ctx.closePath();ctx.fill();
        r(ctx,-14,-5,28,10,'#2a2622');for(let i=0;i<10;i++)r(ctx,-13+rand()*24,-4+rand()*7,3+rand()*4,2+rand()*3,['#7a7068','#9a8a72','#5c4a3a','#c9c2b0'][i%4]);
        r(ctx,-17,-8,34,2,col);for(let q=-15;q<15;q+=6)r(ctx,q,6,3,2,'#e8e2d4');
      }else if(k<.3){ // moto caída com baú de entrega
        ctx.rotate((rand()-.5)*1.4);r(ctx,-9,-1,20,6,'rgba(0,0,0,.35)');r(ctx,-10,-3,20,5,'#24272b');ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-9,-.5,3,0,Math.PI*2);ctx.arc(10,-.5,3,0,Math.PI*2);ctx.fill();
        r(ctx,-4,-5,6,3,'#5a5e63');const bx=rand()<.6?['#d8261f','#ef6a1a'][Math.floor(rand()*2)]:'#16171a';r(ctx,-12,-11,9,9,bx);r(ctx,-12,-11,9,2,pzShade(bx,1.25));
        if(rand()<.4){r(ctx,4,4,6,6,'rgba(150,20,18,.5)');}
      }else if(k<.42){ // carroça de catador com papelão
        ctx.rotate((rand()-.5)*.6);r(ctx,-10,-6,24,16,'rgba(0,0,0,.3)');r(ctx,-12,-8,22,15,'#6b4a2e');for(let i=0;i<5;i++)r(ctx,-11+i*4,-12+rand()*3,4+rand()*3,10+rand()*4,['#b08a5a','#9a764a','#c8a46a'][i%3]);
        r(ctx,-15,-9,3,17,'#3a2a1a');ctx.fillStyle='#111';ctx.beginPath();ctx.arc(-1,8,3,0,Math.PI*2);ctx.fill();r(ctx,10,-2,10,2,'#3a2a1a');
      }else if(k<.56&&!s.v){ // mesas e cadeiras plásticas de boteco
        for(let i=0;i<2;i++){const mx=-12+i*22;r(ctx,mx-6,-4,12,10,'rgba(0,0,0,.25)');r(ctx,mx-6,-6,12,10,'#e5b92a');r(ctx,mx-5,-5,10,2,'#f3d45a');
          for(const [cx,cy] of [[-9,-9],[7,-9],[-9,5],[7,5]])if(rand()<.7){r(ctx,mx+cx,cy,4,4,rand()<.2?'#c8302a':'#e5b92a');}}
        if(rand()<.5){r(ctx,-2,-3,2,5,'#3a6a3a');r(ctx,1,-2,2,4,'#3a6a3a');} // garrafas
      }else if(k<.7&&center){ // lona de camelô com mercadoria
        const col=rand()<.5?'#2f6fd0':'#ef7a1a';ctx.rotate((rand()-.5)*.3);r(ctx,-16,-10,32,20,'rgba(0,0,0,.25)');r(ctx,-17,-11,32,20,col);
        for(let i=0;i<12;i++)r(ctx,-15+(i%4)*7,-9+Math.floor(i/4)*6,5,4,['#e8e2d4','#1d1e22','#c8302a','#e5b92a','#3a8fd0'][i%5]);
      }else if(k<.86){ // sacos de lixo
        for(let i=0;i<3+Math.floor(rand()*4);i++){ctx.fillStyle=rand()<.8?'#16171a':'#2f5f3a';ctx.beginPath();ctx.ellipse((rand()-.5)*16,(rand()-.5)*8,4+rand()*3,3+rand()*2,rand()*3,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect((rand()-.5)*12,(rand()-.5)*6,2,1);}
      }else{ // colchão/sofá largado
        ctx.rotate((rand()-.5)*.8);r(ctx,-12,-7,26,16,'rgba(0,0,0,.3)');r(ctx,-14,-8,26,15,rand()<.5?'#c9c2a8':'#6a4a3a');r(ctx,-14,-8,26,2,'rgba(255,255,255,.2)');r(ctx,-6,-3,6,4,'rgba(90,60,30,.4)');
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- objetos em pé ----------
function pzSPSeed(){
  if(PZ_SP.seeded)return;PZ_SP.seeded=true;
  const rand=mulberry32(19802),lamps=(window.__projectZGame?.world?.lampLights)||[];
  const nearLamp=(x,y)=>lamps.some(l=>Math.hypot(l.x-x,l.y-y)<34)||(typeof PZ_SIGNS!=='undefined'&&PZ_SIGNS.list.some(s=>Math.hypot(s.x-x,s.y-y)<40));
  // postes de concreto ao longo das duas bordas de cada avenida
  for(const s of pzSidewalks()){
    const len=s.v?s.h:s.w,line=[];
    for(let a=40;a<len;a+=118){
      const x=s.v?(s.side<0?s.x+18:s.x+6):s.x+a,y=s.v?s.y+a:(s.side<0?s.y+20:s.y+8);
      if(x<0||y<0||x>2800||y>2800||pzInCross(x,y,20)||nearLamp(x,y)||!pzRectFree(x-3,y-3,6,6,2)){if(line.length>1)PZ_SP.poles.push(line.slice());line.length=0;continue;}
      const p={type:'poste',x,y,tr:rand()<.25,gato:rand()<.3,seed:rand()};line.push(p);PZ_SP.props.push(p);
    }
    if(line.length>1)PZ_SP.poles.push(line.slice());
  }
  // orelhões, bancas, papeleiras e pontos de ônibus
  for(const s of pzSidewalks()){
    const len=s.v?s.h:s.w;
    for(let a=70+rand()*120;a<len;a+=230+rand()*260){
      const x=s.v?s.x+12:s.x+a,y=s.v?s.y+a:s.y+14;
      if(x<10||y<10||x>2790||y>2790||pzInCross(x,y,30)||nearLamp(x,y)||!pzRectFree(x-10,y-8,20,16,2))continue;
      if(PZ_SP.props.some(p=>Math.hypot(p.x-x,p.y-y)<26))continue;
      const k=rand();
      PZ_SP.props.push({type:k<.38?'orelhao':k<.6?'banca':k<.85?'papeleira':'ponto',x,y,col:rand()<.5?'#e86a1a':'#2f6fd0',seed:rand(),v:s.v});
    }
  }
}
function pzSPCanvas(p){
  if(p.cv)return p.cv;
  const RES=3,W=p.type==='banca'?40:p.type==='ponto'?50:28,H=p.type==='poste'?132:p.type==='banca'?36:p.type==='ponto'?40:34;
  const c=document.createElement('canvas');c.width=W*RES;c.height=H*RES;const x=c.getContext('2d');x.scale(RES,RES);
  const ax=W/2,base=H-3,rand=mulberry32(Math.round(p.seed*1e6));
  x.fillStyle='rgba(0,0,0,.3)';x.beginPath();x.ellipse(ax+4,base,W*.32,3,0,0,Math.PI*2);x.fill();
  if(p.type==='poste'){
    // poste de concreto cônico, cruzeta, isoladores, transformador, rolos de fio
    const g=x.createLinearGradient(ax-3,0,ax+3,0);g.addColorStop(0,'#b9b5ac');g.addColorStop(.5,'#9a968d');g.addColorStop(1,'#6e6b65');
    x.fillStyle=g;x.beginPath();x.moveTo(ax-3,base);x.lineTo(ax+3,base);x.lineTo(ax+1.6,6);x.lineTo(ax-1.6,6);x.closePath();x.fill();
    x.fillStyle='rgba(60,50,40,.35)';x.fillRect(ax-3,base-10,6,10);
    x.fillStyle='#5a5853';x.fillRect(ax-10,9,20,2.2);x.fillRect(ax-8,15,16,1.8);
    x.fillStyle='#cfd3d6';for(const dx of [-9,-4,4,9])x.fillRect(ax+dx-.7,7.4,1.4,2);
    if(p.tr){x.fillStyle='#6b7076';x.fillRect(ax+3,18,7,11);x.fillStyle='#8a8f94';x.fillRect(ax+3,18,7,2);x.fillStyle='#3a3d41';x.fillRect(ax+4,21,5,1);}
    x.strokeStyle='#121214';x.lineWidth=.8;for(let i=0;i<4;i++){x.beginPath();x.ellipse(ax-1+rand()*2,24+i*3+rand()*3,3+rand()*2,1.6,0,0,Math.PI*2);x.stroke();} // rolos de fio
    if(p.gato){x.beginPath();x.moveTo(ax,20);x.quadraticCurveTo(ax-12,34,ax-14,base-6);x.stroke();}
    x.fillStyle='#e8e2d4';x.fillRect(ax-2,base-22,4,3);x.fillStyle='#2a2a2a';x.font='bold 2.6px monospace';x.fillText(String(100+Math.floor(rand()*899)),ax-2,base-19.8);
    // cartaz colado no poste
    if(rand()<.35){x.fillStyle=['#f2dc3a','#e9e3d2','#f4b8c8'][Math.floor(rand()*3)];x.fillRect(ax-3,base-17,6,7);x.fillStyle='#222';x.fillRect(ax-2,base-15,4,.6);x.fillRect(ax-2,base-13,4,.6);}
  }else if(p.type==='orelhao'){
    // concha de fibra em forma de ovo sobre um pé (projeto de Chu Ming Silveira)
    x.fillStyle='#4b4e52';x.fillRect(ax-1,base-14,2,14);
    const g=x.createRadialGradient(ax-3,8,1,ax,12,11);g.addColorStop(0,pzShade(p.col,1.35));g.addColorStop(1,pzShade(p.col,.75));
    x.fillStyle=g;x.beginPath();x.ellipse(ax,13,8.5,10.5,0,0,Math.PI*2);x.fill();
    x.fillStyle='rgba(0,0,0,.45)';x.beginPath();x.ellipse(ax,16,6,7,0,0,Math.PI);x.fill();
    x.fillStyle='#2a2c30';x.fillRect(ax-3,13,6,7);x.fillStyle='#8a8f94';x.fillRect(ax-2,14,4,2);
    if(rand()<.5){x.strokeStyle='#111';x.lineWidth=.7;x.beginPath();x.moveTo(ax+2,18);x.quadraticCurveTo(ax+6,26,ax+3,base-2);x.stroke();} // fone pendurado
    x.fillStyle='#fff';x.font='bold 2.4px Arial';x.fillText('TELEFONE',ax-5.2,5.2);
  }else if(p.type==='banca'){
    // banca de jornal fechada: caixa metálica verde-escura com porta de enrolar e revistas penduradas
    x.fillStyle='#2f4a3a';x.fillRect(4,8,32,base-8);x.fillStyle='#3d5e4a';x.fillRect(2,4,36,6);x.fillStyle='#1d2a22';x.fillRect(2,10,36,1.5);
    x.fillStyle='#7a7e82';x.fillRect(7,13,26,base-15);for(let y=14;y<base-2;y+=2.4){x.fillStyle='rgba(20,22,26,.55)';x.fillRect(7,y,26,.7);}
    for(let i=0;i<5;i++){x.fillStyle=['#c8302a','#e5b92a','#2f6fd0','#e8e2d4','#3a8f4a'][i];x.fillRect(4.5+i*6.4,10.5,5,4);}
    x.fillStyle='#e8e2d4';x.font='bold 3.4px Arial';x.fillText('BANCA',14,7.8);
    if(rand()<.5){x.fillStyle=PZ_SPRAY_COLORS[Math.floor(rand()*PZ_SPRAY_COLORS.length)];x.font='900 5px Impact,Arial';x.fillText(PZ_TAGS[Math.floor(rand()*PZ_TAGS.length)],9,base-6);}
  }else if(p.type==='papeleira'){
    // papeleira verde presa num pequeno poste
    x.fillStyle='#5a5e63';x.fillRect(ax-1,10,2,base-10);
    x.fillStyle='#2f7a45';x.beginPath();x.moveTo(ax-6,12);x.lineTo(ax+6,12);x.lineTo(ax+5,24);x.lineTo(ax-5,24);x.closePath();x.fill();
    x.fillStyle='#3f9a58';x.fillRect(ax-6,12,12,2);x.fillStyle='#16241a';x.fillRect(ax-4,13,8,1.5);
    if(rand()<.6){x.fillStyle='#e8e2d4';x.fillRect(ax-3,9.5,3,3);x.fillStyle='#c8302a';x.fillRect(ax+1,10,2,2.5);}
  }else{
    // ponto de ônibus: abrigo de vidro e metal com painel
    x.fillStyle='#3a3d41';x.fillRect(4,10,2,base-10);x.fillRect(44,10,2,base-10);
    x.fillStyle='rgba(170,200,215,.35)';x.fillRect(6,14,38,base-16);x.strokeStyle='rgba(220,235,240,.5)';x.lineWidth=.5;x.strokeRect(6,14,38,base-16);
    x.fillStyle='#e9e5da';x.fillRect(2,6,46,5);x.fillStyle='#c8302a';x.fillRect(2,6,46,1.5);
    x.fillStyle='#d9cdb4';x.fillRect(32,15,10,base-19);x.fillStyle='#2f6fd0';x.fillRect(33,16,8,6);
    x.fillStyle='#4a4d52';x.fillRect(9,base-8,20,2);
    x.fillStyle='#1d1e22';x.font='bold 3px Arial';x.fillText('ÔNIBUS',8,9.8);
    if(rand()<.6){x.strokeStyle='rgba(240,245,250,.7)';x.beginPath();x.moveTo(12,18);x.lineTo(18,26);x.lineTo(15,30);x.moveTo(18,26);x.lineTo(24,24);x.stroke();} // vidro quebrado
  }
  p.cv={canvas:c,W,H,ax,base};return p.cv;
}
// A11: objeto alto na frente do jogador fica transparente (o jogador nunca some atrás de poste, orelhão ou placa).
function pzOccludes(o,x,y,W,H,player){
  let t=1;
  if(player&&player.y<y-2&&player.y>y-H-6&&Math.abs(player.x-x)<W/2+10)t=.28;
  o.__fa=(o.__fa??1)+(t-(o.__fa??1))*.25;return o.__fa;
}
function pzSPDrawables(camera,player){
  pzSPSeed();
  const out=[],vw=camera.viewport.width/camera.zoom/2+60,vh=camera.viewport.height/camera.zoom/2+150;
  for(const p of PZ_SP.props){
    if(Math.abs(p.x-camera.x)>vw||Math.abs(p.y-camera.y)>vh)continue;
    out.push({x:p.x,y:p.y,__tall:1,lean:1,draw(ctx){const v=pzSPCanvas(p);const a=pzOccludes(p,p.x,p.y,v.W,v.H,player);if(a<.99)ctx.globalAlpha=a;ctx.drawImage(v.canvas,p.x-v.ax,p.y-v.base,v.W,v.H);ctx.globalAlpha=1;}});
  }
  return out;
}
// ---------- fios no ar ----------
function pzSPDrawWires(ctx,camera,player){
  pzSPSeed();
  const vw=camera.viewport.width/camera.zoom/2+140,vh=camera.viewport.height/camera.zoom/2+220,WH=118;
  // perto do jogador os fios quase somem (não escondem personagem nem zumbi ao redor dele)
  const near=(xa,ya,xb,yb)=>player&&player.x>Math.min(xa,xb)-60&&player.x<Math.max(xa,xb)+60&&player.y-30>Math.min(ya,yb)-70&&player.y-30<Math.max(ya,yb)+70;
  const x0=camera.x-vw,x1=camera.x+vw,y0=camera.y-vh,y1=camera.y+vh;
  ctx.save();ctx.lineCap='round';
  // fiação entre postes (alturas diferentes, barriga, alguns fios soltos)
  for(const line of PZ_SP.poles){
    for(let i=0;i<line.length-1;i++){
      const a=line[i],b=line[i+1];
      if(Math.max(a.x,b.x)<x0||Math.min(a.x,b.x)>x1||Math.max(a.y,b.y)<y0||Math.min(a.y,b.y)>y1)continue;
      const ta=pz3dTop(a.x,a.y,WH),tb=pz3dTop(b.x,b.y,WH),ax=ta.x,ay=ta.y,bx=tb.x,by=tb.y; // R33: topo do poste na perspectivactx.globalAlpha=near(ax,ay,bx,by)?.14:.8;
      for(let k=0;k<5;k++){
        const off=k<3?-8+k*8:-5+(k-3)*10,dy=k<3?0:6;
        const sag=6+k*2.2+((a.seed*7+k)%3);
        ctx.strokeStyle=k<3?'rgba(14,15,17,.85)':'rgba(24,24,26,.75)';ctx.lineWidth=k<3?.9:1.3;
        const hx=ax+(Math.abs(bx-ax)>Math.abs(by-ay)?0:off),hy=ay+dy+(Math.abs(bx-ax)>Math.abs(by-ay)?off*.3:0);
        const ex=bx+(Math.abs(bx-ax)>Math.abs(by-ay)?0:off),ey=by+dy+(Math.abs(bx-ax)>Math.abs(by-ay)?off*.3:0);
        ctx.beginPath();ctx.moveTo(hx,hy);ctx.quadraticCurveTo((hx+ex)/2,(hy+ey)/2+sag,ex,ey);ctx.stroke();
      }
      if(a.gato&&ctx.globalAlpha>.5){ctx.strokeStyle='rgba(14,15,17,.8)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(ax,ay+8);ctx.quadraticCurveTo(ax+(a.seed-.5)*40,ay+30,ax+(a.seed-.5)*70,ay+40);ctx.stroke();}
    }
  }
  ctx.globalAlpha=1;
  // rede aérea do trólebus sobre a Av. Rangel Pestana (dois pares de fios + cabos transversais)
  if(x1>398&&x0<748){
    ctx.strokeStyle='rgba(18,19,21,.9)';ctx.lineWidth=1;
    const ya=Math.max(0,y0),yb=Math.min(2800,y1);
    for(const fx of [500,508,640,648]){ctx.globalAlpha=player&&Math.abs(player.x-fx)<46?.14:.8;const p0=pz3dTop(fx,ya,WH),p1=pz3dTop(fx,yb+WH,WH);ctx.beginPath();ctx.moveTo(p0.x,p0.y+(pz3dOn()?0:WH));ctx.lineTo(p1.x,p1.y);ctx.stroke();}
    ctx.strokeStyle='rgba(30,30,32,.7)';ctx.lineWidth=.8;ctx.beginPath();
    ctx.stroke();
    ctx.fillStyle='#3a3c40';
    for(let y=Math.ceil(ya/118)*118;y<yb;y+=118){if(pzInCross(573,y,10))continue;
      ctx.globalAlpha=near(392,y-WH,754,y-WH)?.14:.75;const q0=pz3dTop(392,y,WH),q1=pz3dTop(754,y,WH),qm=pz3dTop(573,y,WH);ctx.beginPath();ctx.moveTo(q0.x,q0.y);ctx.quadraticCurveTo(qm.x,qm.y+8,q1.x,q1.y);ctx.stroke();
      for(const fx of [504,644]){const q=pz3dTop(fx,y,WH);ctx.fillRect(q.x-5,q.y+3,10,2);}}
    ctx.globalAlpha=1;
  }
  ctx.restore();
}
