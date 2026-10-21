// -- src/world/World.js --



// G.3.0: arquitetura visual 'Noite de Quarentena': grafite / preto / reflexos vermelhos.
const C = {
  asphalt: '#13181d', dark: '#090d11', road: '#191c21', sidewalk: '#393638',
  grout: '#15181b', vegetation: '#262c2b', moss: '#425044', amber: '#d4b389',
  turquoise: '#54636a', coral: '#e94a4f', slate: '#797b7d',
};
const r = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
function line(ctx, points, color, width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
}
// Drawn into the static map canvases once. No extra images or per-frame allocations.
function building(ctx, x, y, w, h, options = {}) {
  const { roof = '#303138', edge = '#666368', glow = '#e04b4d', title = '', variant = 'block', trim = '#8b8386' } = options;
  // Depth and broken parapet: every collision box remains unchanged.
  ctx.save();
  if(!options.__shell){r(ctx,x+17,y+24,w,h,'#080a0d');
  r(ctx,x+10,y+14,w,h,'#0d1014');}
  r(ctx,x-6,y-7,w+12,h+14,'#4c4647');
  r(ctx,x-3,y-4,w+6,h+8,'#1a1b1f');
  r(ctx,x,y,w,h,roof);
  const tint=ctx.createLinearGradient(x,y,x+w,y+h);
  tint.addColorStop(0,'rgba(239,241,239,.075)');
  tint.addColorStop(.57,'rgba(0,0,0,0)');
  tint.addColorStop(1,'rgba(0,0,0,.40)');
  ctx.fillStyle=tint;ctx.fillRect(x,y,w,h);
  r(ctx,x,y,w,6,trim);r(ctx,x,y,6,h,'#5b5456');
  r(ctx,x+w-8,y,8,h,'#12171a');r(ctx,x,y+h-8,w,8,'#0d1116');
  ctx.globalAlpha=.55;
  for(let i=18;i<w-10;i+=31){r(ctx,x+i,y+14,2,Math.max(0,h-29),'#434447');}
  for(let j=24;j<h-12;j+=34){r(ctx,x+9,y+j,Math.max(0,w-22),1,'#25282c');}
  ctx.globalAlpha=1;
  const count=Math.max(1,Math.floor(w/105));
  for(let k=0;k<count;k++){
    const bx=x+25+k*94,by=y+31+(k%2)*20;
    if(bx+54>=x+w-6)break;
    r(ctx,bx+5,by+8,48,35,'#111215');
    r(ctx,bx,by,48,32,'#666468');
    r(ctx,bx+4,by+4,40,24,'#292c31');
    for(let j=0;j<5;j++)r(ctx,bx+7,by+7+j*4,33,1,'#777678');
    r(ctx,bx+35,by+28,5,2,'#d65a5c');
  }
  if(variant==='tower'){
    const tw=Math.max(44,Math.min(72,w*.22)), th=Math.max(86,Math.min(120,h*.62));
    const tx=x+w-tw-18, ty=y+20;
    r(ctx,tx+5,ty+8,tw,th,'rgba(0,0,0,.38)');
    r(ctx,tx,ty,tw,th,'#20242a');
    r(ctx,tx,ty,tw,6,glow);
    for(let i=10;i<th-10;i+=14)r(ctx,tx+10,ty+i,tw-20,2,'rgba(232,236,239,.16)');
  }else if(variant==='round'){
    ctx.fillStyle='rgba(17,21,25,.82)';
    ctx.beginPath();ctx.ellipse(x+w*.72,y+h*.34,w*.12,h*.18,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(226,80,84,.7)';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(x+w*.72,y+h*.34,w*.11,h*.17,0,0,Math.PI*2);ctx.stroke();
    r(ctx,x+20,y+h-56,w*.45,18,'#1a1f25');
  }else if(variant==='mall'){
    r(ctx,x+18,y+h-56,w-36,18,'#1a1e24');
    r(ctx,x+18,y+h-56,w-36,4,glow);
    for(let i=28;i<w-42;i+=22)r(ctx,x+i,y+h-43,9,2,'rgba(238,232,228,.17)');
  }else if(variant==='compound'){
    const aw=Math.max(52,Math.min(84,w*.24)), ah=Math.max(48,Math.min(72,h*.27));
    r(ctx,x+16,y+20,aw,ah,'#252a31');
    r(ctx,x+16,y+20,aw,4,'#71757a');
    r(ctx,x+22,y+28,aw-18,ah-18,'rgba(255,255,255,.08)');
  }else if(variant==='industrial'){
    r(ctx,x+20,y+20,w*.38,22,'#26292d');
    r(ctx,x+26,y+24,w*.08,h*.24,'#4c575f');
    r(ctx,x+42,y+24,w*.08,h*.2,'#4c575f');
    r(ctx,x+w*.63,y+26,16,h*.3,'#555960');
    r(ctx,x+w*.68,y+26,9,h*.24,'#727882');
  }
  let rand=mulberry32(Math.floor(x*11+y*19+w));
  for(let i=0;i<Math.min(18,Math.floor(w*h/2800));i++){
    const dx=x+13+rand()*(w-30),dy=y+13+rand()*(h-28);
    r(ctx,dx,dy,5+rand()*15,1+rand()*3,'rgba(10,12,14,.58)');
    if(rand()<.3)r(ctx,dx+5,dy-4,2,5,'#70605e');
  }
  if(title){
    const plateWidth=Math.min(w-32,Math.max(102,title.length*10+18));
    r(ctx,x+16,y+h-42,plateWidth,28,'#101115');
    r(ctx,x+16,y+h-42,4,28,glow);
    r(ctx,x+20,y+h-42,plateWidth-4,1,'#5a4246');
    ctx.fillStyle='#f2eae6';ctx.font='bold 12px monospace';
    ctx.fillText(title,x+26,y+h-23,plateWidth-19);
    r(ctx,x+16,y+h-10,Math.min(75,w-35),2,glow);
  }
  // ATLAS A7 · Deméter — fachada sul: dá altura ao prédio (parede vista de cima, levemente inclinada).
  if(!options.__shell){const fh=Math.max(10,Math.min(18,h*.08)),rand=mulberry32(Math.round(x*7+y*13+w));
   const g=ctx.createLinearGradient(x,y+h,x,y+h+fh);g.addColorStop(0,'#2a2b30');g.addColorStop(1,'#141519');
   ctx.fillStyle=g;ctx.fillRect(x-3,y+h+4,w+6,fh);
   r(ctx,x-3,y+h+4,w+6,2,'#3d3c41');
   for(let wx=x+8;wx<x+w-10;wx+=14){const lit=rand()<.18;r(ctx,wx,y+h+7,7,Math.max(3,fh-7),lit?'rgba(255,196,120,.55)':'rgba(8,10,14,.75)');if(lit)r(ctx,wx,y+h+7,7,1,'rgba(255,230,180,.6)');}
   r(ctx,x-3,y+h+4+fh,w+6,3,'rgba(0,0,0,.45)');}
  ctx.restore();
}
function tree(ctx,x,y,scale=1,colored=false){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  r(ctx,5,12,12,20,'#131b1b');r(ctx,-11,12,40,9,'rgba(0,0,0,.25)');
  r(ctx,-4,-2,23,19,colored?'#49504b':'#303b36');
  r(ctx,-12,5,17,15,'#28312e');r(ctx,8,-9,14,14,'#414a42');
  r(ctx,2,1,8,3,'#687266');r(ctx,13,7,6,3,'#66736b');
  ctx.restore();
}
function crack(ctx,x,y,size,color='#101418'){
  line(ctx,[[x,y],[x+size*.3,y+size*.13],[x+size*.52,y+size*.01],[x+size*.71,y+size*.33],[x+size,y+size*.37]],color,2);
  line(ctx,[[x+size*.52,y+size*.01],[x+size*.65,y-size*.20]],color,1);
}
function car(ctx,img,x,y,rotation=0,scale=1){
  if(!img)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);
  r(ctx,-img.width/2+7,-img.height/2+11,img.width,img.height,'rgba(0,0,0,.43)');
  ctx.globalAlpha=.86;ctx.drawImage(img,-img.width/2,-img.height/2);
  // Soot and damaged body panel on every abandoned vehicle.
  ctx.globalAlpha=.67;r(ctx,-img.width*.33,-img.height*.15,img.width*.66,3,'#18181c');
  ctx.globalAlpha=1;r(ctx,-img.width*.26,img.height*.19,img.width*.5,2,'#b1a5a1');
  ctx.restore();
}

// Top-down civilian traffic silhouettes, built once into the world map canvases.
function civilianCar(ctx,x,y,{kind='sedan',angle=0,paint='slate'}={}){
  const palette={slate:'#626e79',gray:'#9b9fa1',bronze:'#a58b6c',olive:'#656f59',teal:'#4f797b',
                 burgundy:'#864d54',rust:'#a65d48',navy:'#415f83',white:'#c6c9c4',yellow:'#b7a04f'};
  const base=palette[paint]||palette.slate;
  const w=kind==='van'?47:kind==='pickup'?43:kind==='hatch'?36:37;
  const h=kind==='van'?89:kind==='pickup'?82:kind==='hatch'?60:70;
  const angleRad=angle;
  ctx.save();ctx.translate(x,y);ctx.rotate(angleRad);
  // Tire dust, cast shadow, and pale body borders read clearly on dark tarmac.
  ctx.fillStyle='rgba(0,0,0,.42)';ctx.fillRect(-w/2+8,-h/2+10,w,h);
  ctx.fillStyle='#10151a';ctx.fillRect(-w/2-3,-h*.34,5,13);ctx.fillRect(w/2-2,-h*.34,5,13);
  ctx.fillRect(-w/2-3,h*.19,5,13);ctx.fillRect(w/2-2,h*.19,5,13);
  ctx.fillStyle='#34383d';ctx.fillRect(-w/2-1,-h/2-2,w+2,h+4);
  ctx.fillStyle=base;ctx.fillRect(-w/2,-h/2,w,h);
  ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(-w/2+2,-h/2+3,3,h-8);
  ctx.fillStyle='rgba(8,11,15,.42)';ctx.fillRect(w/2-4,-h/2+3,3,h-8);
  if(kind==='pickup'){
    ctx.fillStyle='#1c252b';ctx.fillRect(-w/2+6,-h/2+6,w-12,30);
    ctx.strokeStyle='rgba(225,224,216,.45)';ctx.lineWidth=2;ctx.strokeRect(-w/2+5,-h/2+5,w-10,31);
    ctx.fillStyle='#273b43';ctx.fillRect(-w/2+7,h*.10,w-14,15);
    ctx.fillStyle='#12191f';ctx.fillRect(-w/2+7,h*.29,w-14,5);
  }else if(kind==='van'){
    ctx.fillStyle='#293943';ctx.fillRect(-w/2+7,-h*.26,w-14,18);
    ctx.fillRect(-w/2+7,h*.20,w-14,17);
    ctx.fillStyle='rgba(12,16,20,.4)';ctx.fillRect(0,-h/2+25,2,h-43);
    ctx.fillStyle='#dedbd3';ctx.fillRect(-w/2+7,h/2-14,w-14,2);
  }else{
    ctx.fillStyle='#20323d';ctx.fillRect(-w/2+7,-h*.23,w-14,17);
    ctx.fillStyle='#263945';ctx.fillRect(-w/2+8,h*.12,w-16,13);
    ctx.fillStyle='rgba(11,18,23,.68)';ctx.fillRect(-w/2+5,-2,w-10,5);
    if(kind==='hatch'){
      ctx.fillStyle='#202c32';ctx.fillRect(-w/2+8,h/2-11,w-16,7);
    }else{
      ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(-w/2+5,h/2-8,w-10,2);
    }
  }
  // Detached, cracked lights and the layered windshield indicate dereliction.
  ctx.fillStyle='#d7d7bd';ctx.fillRect(-w/2+4,-h/2+1,8,3);
  ctx.fillStyle='#82765c';ctx.fillRect(w/2-12,-h/2+1,8,3);
  ctx.fillStyle='#9b4344';ctx.fillRect(-w/2+4,h/2-5,8,3);
  ctx.fillStyle='#702c34';ctx.fillRect(w/2-12,h/2-5,8,3);
  ctx.fillStyle='rgba(10,13,16,.32)';ctx.fillRect(-w/2+6,-h*.03,w-12,4);
  ctx.fillStyle='rgba(18,22,24,.35)';ctx.fillRect(-w/2+10,h*.37,w-20,3);
  ctx.strokeStyle='rgba(211,211,206,.25)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-6,-h*.20);ctx.lineTo(1,-h*.12);ctx.lineTo(5,-h*.18);ctx.stroke();
  ctx.restore();
}

function emergencyVehicle(ctx,x,y,{type='police',rotation=0,scale=1,damaged=true}={}){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);
  const body={police:'#11151a',ambulance:'#ece8e2',fire:'#a6272c'}[type]||'#2b3036';
  const stripe={police:'#2f69d8',ambulance:'#d9484e',fire:'#f3f0eb'}[type]||'#d9484e';
  const accent={police:'#d94b55',ambulance:'#e14b53',fire:'#f0c54f'}[type]||'#d94b55';
  const roof={police:'#20262d',ambulance:'#f4efe9',fire:'#bb2f34'}[type]||'#20262d';
  r(ctx,-17,-31,34,62,'rgba(0,0,0,.34)');
  r(ctx,-16,-28,32,56,body);
  r(ctx,-14,-24,28,48,roof);
  r(ctx,-11,-18,22,16,'#8ba4b4');
  r(ctx,-11,4,22,16,'#71879a');
  r(ctx,-13,-2,26,6,'#15191f');
  if(type==='police'){
    r(ctx,-15,-26,4,52,stripe); r(ctx,11,-26,4,52,stripe);
    r(ctx,-9,-1,18,4,'#ffffff'); r(ctx,-7,-22,14,3,'#d4d8dd');
    ctx.fillStyle='#d9dde0'; ctx.font='bold 6px monospace'; ctx.fillText('POLICIA',-12,2,24);
  } else if(type==='ambulance'){
    r(ctx,-16,-6,32,5,stripe); r(ctx,-16,1,32,5,stripe);
    r(ctx,-4,-20,8,17,'#d9484e'); r(ctx,-7,-15,14,7,'#d9484e');
    ctx.fillStyle='#d9484e'; ctx.font='bold 6px monospace'; ctx.fillText('SAMU',-10,13,22);
  } else if(type==='fire'){
    r(ctx,-16,-24,32,6,'#f3f0eb'); r(ctx,-16,18,32,5,'#f3f0eb');
    for(let i=-12;i<=8;i+=7)r(ctx,i,-14,4,20,'#d7dadf');
    r(ctx,-6,-26,12,5,'#f0c54f');
    ctx.fillStyle='#f3f0eb'; ctx.font='bold 6px monospace'; ctx.fillText('BOMBEIROS',-16,14,31);
  }
  // Siren bar switched off: no emergency illumination or pulsing.
  r(ctx,-8,-30,16,4,'#3b4149');r(ctx,-6,-29,12,1,'#65666a');
  // wheels
  r(ctx,-17,-20,3,10,'#121316'); r(ctx,14,-20,3,10,'#121316'); r(ctx,-17,10,3,10,'#121316'); r(ctx,14,10,3,10,'#121316');
  if(damaged){
    ctx.globalAlpha=.32; r(ctx,-11,22,22,3,'#16181b');
    ctx.globalAlpha=.22; r(ctx,-5,-8,11,28,'#000');
    ctx.globalAlpha=1; r(ctx,-9,25,18,2,'#b3a6a2');
  }
  ctx.restore();
}

function graffiti(ctx,x,y,t,color='#b65b60'){
  ctx.save();ctx.globalAlpha=.36;ctx.fillStyle=color;
  ctx.font='bold 18px monospace';ctx.fillText(t,x,y);r(ctx,x,y+4,t.length*10,2,color);ctx.restore();
}
// Road grime has its own deterministic generator and never changes collision physics.
function urbanGrime(ctx,{x,y,w,h,seed=87,intensity=1}){
  const random=mulberry32(seed);
  ctx.save();
  const grains=Math.floor(w*h/140*intensity);
  for(let i=0;i<grains;i++){
    const px=x+random()*w,py=y+random()*h;
    const v=random();
    r(ctx,px,py,1+random()*6,v<.86?1:2,v<.34?'rgba(0,0,0,.21)':v<.75?'rgba(143,142,138,.095)':'rgba(143,56,57,.09)');
  }
  for(let i=0;i<Math.floor(w*h/8700*intensity);i++){
    const px=x+random()*w,py=y+random()*h;
    crack(ctx,px,py,7+random()*26,random()<.5?'#0d1115':'#414044');
  }
  ctx.restore();
}
// Metal lamp support: each light in lampLights is attached to a physical post.
function streetlightPole(ctx,x,y){
 ctx.save();
 ctx.fillStyle='rgba(0,0,0,.26)';ctx.fillRect(x+3,y+4,6,22);
 ctx.fillStyle='#292b30';ctx.fillRect(x-2,y-11,5,27);
 ctx.fillStyle='#757574';ctx.fillRect(x-2,y-12,2,22);
 ctx.fillStyle='#171c21';ctx.fillRect(x-7,y-15,15,7);
 ctx.fillStyle='#8c8580';ctx.fillRect(x-6,y-15,13,2);
 ctx.fillStyle='#d3c8ae';ctx.fillRect(x-5,y-11,11,2);
 ctx.fillStyle='#33383a';ctx.fillRect(x-5,y+13,11,4);
 ctx.restore();
}
function emergencyLamp(ctx,x,y,orientation=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(orientation);
  r(ctx,-4,-18,12,52,'rgba(0,0,0,.5)');
  r(ctx,-6,-20,12,45,'#4a4b50');r(ctx,-8,-24,16,12,'#111215');
  r(ctx,-6,-21,12,4,'#ff6469');r(ctx,-3,-15,6,2,'#f5b4b0');
  ctx.restore();
}
function roadDecals(ctx,x,y,w,h,{vertical=false,seed=43}={}){
  const random=mulberry32(seed);
  ctx.save();
  // Oil patches, water reflections and concrete fragments.
  for(let i=0;i<Math.floor(w*h/10000);i++){
    const px=x+random()*w,py=y+random()*h;
    const radius=8+random()*25;
    ctx.fillStyle=random()<.35?'rgba(116,43,48,.21)':'rgba(6,9,13,.24)';
    ctx.beginPath();ctx.ellipse(px,py,radius,radius*(.13+random()*.22),random()*.65,0,Math.PI*2);ctx.fill();
    if(random()<.26){r(ctx,px-radius*.3,py-1,radius*.7,1,'rgba(240,111,108,.25)');}
  }
  for(let i=0;i<Math.floor(w*h/13500);i++){
    const px=x+random()*w,py=y+random()*h;
    r(ctx,px,py,7+random()*10,2,'rgba(123,127,126,.23)');
  }
  ctx.restore();
}
function roadStencil(ctx,x,y,text,angle=0){
  // C4 · Deméter: pintura de solo gasta e discreta, para a rua ser lida em 1 segundo.
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=.2;
  ctx.fillStyle='#ded7cc';ctx.font='bold 14px monospace';
  ctx.fillText(text,0,0);ctx.fillRect(0,4,Math.min(140,text.length*8),1);
  ctx.restore();
}
function paulistaSign(ctx,x,y,main,sub='',angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  r(ctx,-6,-6,106,40,'rgba(0,0,0,.32)');
  r(ctx,0,0,98,34,'#0e1115');
  r(ctx,3,3,92,13,'#2d5f7a');
  r(ctx,3,18,92,12,'#171d24');
  r(ctx,3,3,5,27,'#d94c52');
  ctx.fillStyle='#edf1f4';ctx.font='bold 9px monospace';ctx.fillText(main,12,13,76);
  if(sub){ctx.fillStyle='#aeb9c2';ctx.font='bold 8px monospace';ctx.fillText(sub,12,27,80);}
  ctx.restore();
}
function laneMarking(ctx,x,y,text,angle=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=.32;
  ctx.fillStyle='#e5ddd0';ctx.font='bold 20px monospace';ctx.fillText(text,0,0);ctx.restore();
}
function rooftopSurvivor(ctx,assets,x,y,scale=.48){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.28)';
  ctx.fillRect(-8*scale,10*scale,16*scale,4*scale);
  const sprite=assets?.get?.('survivor');
  if(sprite){
    const w=44*scale,h=52*scale;
    ctx.drawImage(sprite,Math.round(-w/2),Math.round(-h+8*scale),Math.round(w),Math.round(h));
  }else{
    ctx.fillStyle='#cfd4d7';ctx.fillRect(-5*scale,-18*scale,10*scale,15*scale);
    ctx.fillStyle='#14181c';ctx.fillRect(-3*scale,-26*scale,6*scale,7*scale);
  }
  ctx.fillStyle='rgba(229,74,79,.72)';
  ctx.fillRect(7*scale,-10*scale,4*scale,2*scale);
  ctx.restore();
}

// R12: composição compartilhada por veículos explodidos e carros que já
// começam em chamas. Mantém intacta a geometria do fogo aprovado na R11.
function vehicleFireSourcesR11(cx,cy,w,h,seed,scale=1){
  const s=Math.max(.64,Math.min(1.12,Math.max(w,h)/104))*scale;
  return [
    {x:cx-w*.22,y:cy+h*.09,s:s*.82,p:seed},
    {x:cx+w*.14,y:cy-h*.12,s:s*.93,p:seed+2.1},
    {x:cx+w*.02,y:cy+h*.22,s:s*.63,p:seed+4.2},
  ];
}

// R11: ÚNICA fonte visual de incêndio. O fogo externo e os veículos destruídos
// usam exatamente o mesmo renderizador (gradiente, fumaça e chamas pixeladas).
// 'bounds' apenas otimiza o incêndio decorativo externo; é opcional para carros.
function drawWorldBorderFireFX(ctx,fires,t,bounds=null){
  ctx.save();
    // fogo, brilho e fumaça
    const cols=['#ff4a1c','#ff8a2a','#ffd24a','#fff1a8'];
    ctx.globalCompositeOperation='screen';
    for(const f of fires){
      if(f.x==null||(bounds&&(f.x<bounds.x0-120||f.x>bounds.x1+120||f.y<bounds.y0-160||f.y>bounds.y1+120)))continue;
      const s=f.s*(f.big?1.25:1),fl=.8+.2*Math.sin(t*7+f.p)+.1*Math.sin(t*13+f.p*2);
      const g=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,110*s);
      g.addColorStop(0,`rgba(255,140,60,${(.42*fl).toFixed(3)})`);g.addColorStop(1,'rgba(255,90,30,0)');
      ctx.fillStyle=g;ctx.fillRect(f.x-110*s,f.y-110*s,220*s,220*s);
    }
    ctx.globalCompositeOperation='source-over';
    for(const f of fires){
      if(f.x==null||(bounds&&(f.x<bounds.x0-120||f.x>bounds.x1+120||f.y<bounds.y0-200||f.y>bounds.y1+120)))continue;
      const s=f.s*(f.big?1.25:1);
      for(let i=0;i<4;i++){
        const ph=((t*.22+f.p*.37+i/4)%1),rad=(8+ph*26)*s,yy=f.y-12*s-ph*90*s,xx=f.x+Math.sin(t*.8+f.p+i)*10*ph*s;
        ctx.fillStyle=`rgba(18,18,20,${(.26*(1-ph)).toFixed(3)})`;ctx.beginPath();ctx.arc(xx,yy,rad,0,6.283);ctx.fill();
      }
      // chamas em pixel
      const bw=Math.round(22*s/2)*2;
      for(let j=0;j<4;j++){
        const c=cols[j],hh=(26-j*6)*s*(.75+.3*Math.sin(t*9+f.p+j)),ww=bw*(1-j*.22);
        ctx.fillStyle=c;
        for(let k=-1;k<=1;k++){
          const th=hh*(k===0?1:.62+.18*Math.sin(t*11+k+f.p));
          ctx.fillRect(Math.round(f.x+k*ww*.34-ww*.16),Math.round(f.y-th),Math.round(ww*.32),Math.round(th));
        }
      }
    }
  ctx.restore();
}


// ATLAS A7 · Deméter — variação de asfalto: remendos, marcas de pneu, emendas e bueiros.
// Determinístico pela posição (o mapa é pintado uma vez); não altera colisão.
function asphaltVariation(ctx,x,y,w,h,seed=1){
  if(w<=0||h<=0)return;
  const rand=mulberry32(seed|0),vertical=h>w;
  ctx.save();
  // marcas de pneu: duas faixas levemente mais escuras ao longo da via
  const lanes=vertical?Math.max(1,Math.floor(w/80)):Math.max(1,Math.floor(h/80));
  for(let l=0;l<lanes;l++){
    const base=(l+.5)*(vertical?w:h)/lanes;
    for(const off of [-13,13]){
      ctx.fillStyle='rgba(0,0,0,.07)';
      if(vertical)ctx.fillRect(x+base+off-4,y,8,h);else ctx.fillRect(x,y+base+off-4,w,8);
    }
  }
  // remendos de asfalto novo (mais escuro) e velho (mais claro), com borda de emenda
  for(let i=0,n=Math.floor(w*h/52000);i<n;i++){
    const pw=18+rand()*60,ph=12+rand()*36,px=x+rand()*(w-pw),py=y+rand()*(h-ph),fresh=rand()<.6;
    ctx.fillStyle=fresh?'rgba(4,6,9,.22)':'rgba(255,255,255,.035)';ctx.fillRect(px,py,pw,ph);
    ctx.strokeStyle=fresh?'rgba(0,0,0,.35)':'rgba(255,255,255,.05)';ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,pw-1,ph-1);
  }
  // emendas longas
  for(let i=0,n=Math.floor((vertical?h:w)/260);i<n;i++){
    ctx.fillStyle='rgba(0,0,0,.18)';
    if(vertical)ctx.fillRect(x,y+rand()*h,w,1);else ctx.fillRect(x+rand()*w,y,1,h);
  }
  // bueiros
  for(let i=0,n=Math.max(0,Math.floor(w*h/150000));i<n;i++){
    const mx=x+12+rand()*(w-24),my=y+12+rand()*(h-24);
    ctx.fillStyle='#2b2c31';ctx.beginPath();ctx.arc(mx,my,7.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#45454b';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(mx,my,7.5,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#3a3a40';for(let k=-4;k<=4;k+=2.6)ctx.fillRect(mx-5,my+k,10,1);
  }
  ctx.restore();
}
