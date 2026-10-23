// -- src/world/Loot3D.js --
// R36 · Hefesto + Afrodite — itens do chão em 3D, girando como a moedinha do Mario.
// Cada item é um modelo de verdade: peças com espessura (frente, verso e laterais iluminadas), vistas um pouco
// de cima, girando em volta do próprio eixo e flutuando. A frente e o verso recebem a arte do item (desenhada uma
// vez em alta resolução e guardada), com brilho que passa pela face conforme ele gira.
// Motor pequeno: cada peça é um contorno 2D extrudado (prisma). Gira em Y (ângulo th), inclina em X (PZ_LOOT3D.pitch)
// e projeta sem perspectiva; faces de costas não são desenhadas e o resto é pintado do fundo para a frente.
const PZ_LOOT3D={pitch:.42,spin:2.3,tex:new Map(),models:new Map(),light:[-.45,-.6,.66]};
{const L=PZ_LOOT3D.light,n=Math.hypot(...L);PZ_LOOT3D.light=L.map(v=>v/n);}

// ---------- contornos ----------
function pzL3Circle(rx,ry,n=28,cx=0,cy=0){const o=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;o.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]);}return o;}
function pzL3Round(w,h,r,n=5,cx=0,cy=0){
  const o=[],x0=cx-w/2,y0=cy-h/2,x1=cx+w/2,y1=cy+h/2;
  const arc=(ax,ay,a0)=>{for(let i=0;i<=n;i++){const a=a0+i/n*Math.PI/2;o.push([ax+Math.cos(a)*r,ay+Math.sin(a)*r]);}};
  arc(x1-r,y0+r,-Math.PI/2);arc(x1-r,y1-r,0);arc(x0+r,y1-r,Math.PI/2);arc(x0+r,y0+r,Math.PI);
  return o;
}
function pzL3Heart(s){
  const o=[];for(let i=0;i<40;i++){const t=i/40*Math.PI*2;
    o.push([16*Math.sin(t)**3*s,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*s+1.5*s]);}
  return o;
}
function pzL3Path(c,pts){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}

// ---------- arte das faces (alta resolução, guardada) ----------
const PZ_L3_TS=5,PZ_L3_TH=18;
function pzL3Texture(key,outline,paint){
  let t=PZ_LOOT3D.tex.get(key);if(t)return t;
  const S=PZ_L3_TH*2*PZ_L3_TS,cv=document.createElement('canvas');cv.width=cv.height=S;
  const c=cv.getContext('2d');c.scale(PZ_L3_TS,PZ_L3_TS);c.translate(PZ_L3_TH,PZ_L3_TH);
  c.save();pzL3Path(c,outline);c.clip();paint(c);c.restore();
  // borda lapidada: filete claro em cima/esquerda, escuro embaixo/direita
  c.save();pzL3Path(c,outline);c.clip();c.lineJoin='round';
  c.lineWidth=1.6;c.strokeStyle='rgba(255,255,255,.38)';c.translate(-.35,-.35);pzL3Path(c,outline);c.stroke();
  c.translate(.7,.7);c.strokeStyle='rgba(0,0,0,.32)';pzL3Path(c,outline);c.stroke();c.restore();
  t={cv};PZ_LOOT3D.tex.set(key,t);return t;
}
function pzL3Grad(c,y0,y1,stops){const g=c.createLinearGradient(-6,y0,6,y1);stops.forEach(([k,v])=>g.addColorStop(k,v));return g;}

// ---------- modelos ----------
// peça: {outline, depth, z (centro), side (cor das laterais), tex (arte da frente), back (arte do verso, opcional)}
function pzL3Model(item){
  const type=item.type,tier=item.tier||1;
  const key=type==='armor'||type==='attachment'?`${type}:${tier}:${item.slot||''}`:type==='ammo'?`ammo:${item.remaining??30}`:type;
  let m=PZ_LOOT3D.models.get(key);if(m)return m;
  const parts=[];
  if(type==='heart'||type==='fullHeart'){
    const full=type==='fullHeart',o=pzL3Heart(full?.78:.66);
    const tex=pzL3Texture(key,o,c=>{
      c.fillStyle=pzL3Grad(c,-12,12,full?[[0,'#ff9fb0'],[.45,'#f2364f'],[1,'#9c0f26']]:[[0,'#ff8a9a'],[.5,'#e2384f'],[1,'#8f1425']]);c.fillRect(-18,-18,36,36);
      const g=c.createRadialGradient(-5,-6,0,-5,-6,8);g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-18,-18,36,36);
      if(full){c.strokeStyle='#ffd769';c.lineWidth=2.2;pzL3Path(c,o);c.stroke();
        c.fillStyle='#fff6dc';c.fillRect(-1.3,-4.5,2.6,9);c.fillRect(-4.5,-1.3,9,2.6);}
    });
    parts.push({outline:o,depth:full?8:7,z:0,side:full?'#c9293f':'#b3243a',rim:full?'#ffd769':null,tex});
  }else if(type==='ammo'){
    const o=pzL3Round(22,15,2.2),n=String(item.remaining??30);
    const tex=pzL3Texture(key,o,c=>{
      c.fillStyle=pzL3Grad(c,-8,8,[[0,'#7d8a4e'],[1,'#4b5530']]);c.fillRect(-18,-18,36,36);
      c.fillStyle='#39411f';c.fillRect(-11,-3.2,22,1.2);
      for(let i=0;i<3;i++){const x=-8.3+i*3.6;c.fillStyle='#c8892f';c.fillRect(x,-5.5,2.6,7.5);c.fillStyle='#f4cf7d';c.fillRect(x,-6.8,2.6,2);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x+.4,-5,0.7,6.5);}
      c.fillStyle='#f3e3b3';c.font='bold 7px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(n,5.2,-.8);
      c.fillStyle='#e7c46e';c.font='bold 3.4px monospace';c.fillText('MUNIÇÃO',0,5);
    });
    const back=pzL3Texture('ammo:back',o,c=>{c.fillStyle=pzL3Grad(c,-8,8,[[0,'#76834a'],[1,'#454f2c']]);c.fillRect(-18,-18,36,36);
      c.fillStyle='#e7c46e';c.font='bold 4.4px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('7.62',0,0);c.fillStyle='#39411f';c.fillRect(-11,-4,22,1.2);c.fillRect(-11,3,22,1.2);});
    parts.push({outline:o,depth:11,z:0,side:'#5d683a',tex,back});
    // alça de lona por cima
    parts.push({outline:pzL3Round(8,2.4,1,2,0,-8.4),depth:3,z:0,side:'#2f3520',tex:pzL3Texture('ammo:strap',pzL3Round(8,2.4,1,2,0,-8.4),c=>{c.fillStyle='#3a4127';c.fillRect(-18,-18,36,36);})});
  }else if(type==='medkit'){
    const o=pzL3Round(21,16,2.6);
    const art=c=>{c.fillStyle=pzL3Grad(c,-8,8,[[0,'#ffffff'],[1,'#cfd3d6']]);c.fillRect(-18,-18,36,36);
      c.fillStyle='#e0303f';c.fillRect(-2.4,-6,4.8,12);c.fillRect(-6,-2.4,12,4.8);
      c.fillStyle='rgba(255,255,255,.5)';c.fillRect(-2,-5.6,1.2,4);c.fillStyle='#b7bcc0';c.fillRect(-10.5,4.6,21,.9);};
    const tex=pzL3Texture(key,o,art);
    parts.push({outline:o,depth:9,z:0,side:'#c4c9cd',tex,back:tex});
    const h=pzL3Round(9,4.4,1.6,3,0,-9.4);
    parts.push({outline:h,depth:3.2,z:0,side:'#2a2f33',tex:pzL3Texture('medkit:handle',h,c=>{c.fillStyle='#363c41';c.fillRect(-18,-18,36,36);c.fillStyle='#d9dde0';c.fillRect(-2.6,-9.6,5.2,1.8);})});
  }else if(type==='shieldCell'){
    const o=pzL3Circle(9.5,11,6).map(([x,y])=>[x,y]);
    const art=c=>{c.fillStyle=pzL3Grad(c,-11,11,[[0,'#bfe8ff'],[.5,'#3f8fe8'],[1,'#1b3f8f']]);c.fillRect(-18,-18,36,36);
      const g=c.createRadialGradient(0,0,0,0,0,7);g.addColorStop(0,'#ffffff');g.addColorStop(.35,'#8fe3ff');g.addColorStop(1,'rgba(80,170,255,0)');c.fillStyle=g;c.fillRect(-9,-9,18,18);
      c.fillStyle='#e9fbff';c.beginPath();c.moveTo(1.5,-6);c.lineTo(-3,1);c.lineTo(0,1);c.lineTo(-1.5,6);c.lineTo(3,-1);c.lineTo(0,-1);c.closePath();c.fill();};
    const tex=pzL3Texture(key,o,art);
    parts.push({outline:o,depth:7,z:0,side:'#2b66c4',rim:'#9fe0ff',tex,back:tex,glow:'#55baff'});
  }else if(type==='armor'){
    const col=['','#dedede','#4b9fff','#bc70ff','#f15b58','#f5cc56'][tier]||'#dedede';
    const o=[[-10,-7],[-5,-11],[-2,-8],[2,-8],[5,-11],[10,-7],[9,6],[4,11],[-4,11],[-9,6]];
    const tex=pzL3Texture(key,o,c=>{c.fillStyle=pzL3Grad(c,-11,11,[[0,'#ffffff'],[.15,col],[1,'#1d262c']]);c.fillRect(-18,-18,36,36);
      c.globalAlpha=.5;c.fillStyle='#132b35';c.fillRect(-7,-2,14,1.2);c.fillRect(-7,3,14,1.2);c.globalAlpha=1;
      c.fillStyle='#132b35';c.font='bold 9px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(String(tier),0,1.5);
      c.fillStyle='rgba(255,255,255,.85)';c.font='bold 9px monospace';c.fillText(String(tier),-.5,1);});
    parts.push({outline:o,depth:6,z:0,side:col,tex,back:tex,glow:col});
  }else if(type==='grenade'){
    // corpo quase redondo: fatias de tamanhos diferentes formam a bola
    const body=c=>{c.fillStyle=pzL3Grad(c,-8,10,[[0,'#a9cf7e'],[.5,'#5e7d3a'],[1,'#2c3d1c']]);c.fillRect(-18,-18,36,36);
      c.strokeStyle='rgba(20,32,14,.55)';c.lineWidth=.8;for(const y of [-1.5,2.5,6.5]){c.beginPath();c.moveTo(-9,y);c.lineTo(9,y);c.stroke();}
      for(const x of [-3,1,5]){c.beginPath();c.moveTo(x,-6);c.lineTo(x,10);c.stroke();}
      const g=c.createRadialGradient(-3,-2,0,-3,-2,6);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-18,-18,36,36);};
    for(const [z,k,d] of [[-4.2,.72,2.6],[-1.6,.95,2.6],[1.6,.95,2.6],[4.2,.72,2.6],[0,1,1.4]]){
      const o=pzL3Circle(7.6*k,8.6*k,24,0,2.2);parts.push({outline:o,depth:d,z,side:'#4b6630',tex:pzL3Texture(`grenade:b${k}`,o,body)});}
    const top=pzL3Round(6,3.4,.8,2,0,-7.3);
    parts.push({outline:top,depth:5,z:0,side:'#8c9095',tex:pzL3Texture('grenade:top',top,c=>{c.fillStyle=pzL3Grad(c,-9,-5,[[0,'#d9dde0'],[1,'#7c8186']]);c.fillRect(-18,-18,36,36);})});
    const lever=[[2.2,-9.2],[7.8,-7.4],[8.6,-1],[7.2,-.6],[6.4,-6.2],[2.2,-7.6]];
    parts.push({outline:lever,depth:2,z:2.4,side:'#7f8489',tex:pzL3Texture('grenade:lever',lever,c=>{c.fillStyle='#b9bdc1';c.fillRect(-18,-18,36,36);})});
    const ring=pzL3Circle(2.4,2.4,14,-3.6,-10.4);
    parts.push({outline:ring,depth:1.2,z:-1.5,side:'#c8a44a',tex:pzL3Texture('grenade:ring',ring,c=>{c.fillStyle='#e6c25c';c.fillRect(-18,-18,36,36);c.fillStyle='#132b35';c.beginPath();c.arc(-3.6,-10.4,1.2,0,Math.PI*2);c.fill();})});
  }else if(type==='survivalBag'){
    const o=pzL3Round(19,21,5,4,0,1);
    const tex=pzL3Texture(key,o,c=>{c.fillStyle=pzL3Grad(c,-10,12,[[0,'#d8bd8c'],[1,'#8c6c45']]);c.fillRect(-18,-18,36,36);
      c.fillStyle='#715338';c.beginPath();c.roundRect(-6.5,-.5,13,9,2.2);c.fill();c.fillStyle='#8b6a48';c.fillRect(-6.5,-.5,13,2.6);
      c.fillStyle='#e8d2a8';c.fillRect(-1.2,1.4,2.4,2.6);c.fillStyle='#5a412b';c.fillRect(-9.5,-6,19,1.3);});
    const back=pzL3Texture('bag:back',o,c=>{c.fillStyle=pzL3Grad(c,-10,12,[[0,'#cdb283'],[1,'#86683f']]);c.fillRect(-18,-18,36,36);
      c.fillStyle='#4b3524';c.fillRect(-6,-7,2.6,17);c.fillRect(3.4,-7,2.6,17);});
    parts.push({outline:o,depth:10,z:0,side:'#9d7d52',tex,back});
    const h=pzL3Round(7,3,1.4,3,0,-10.2);
    parts.push({outline:h,depth:2.6,z:0,side:'#5a412b',tex:pzL3Texture('bag:handle',h,c=>{c.fillStyle='#6b4d33';c.fillRect(-18,-18,36,36);})});
  }else if(type==='attachment'){
    const col=ACCESSORY_RARITIES[tier-1]?.color||'#dedede';
    // engrenagem (peça de arma) com o nível no meio
    const o=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2,r=(Math.floor(i/2.5)%2)?8.2:10.6;o.push([Math.cos(a)*r,Math.sin(a)*r]);}
    const tex=pzL3Texture(key,o,c=>{c.fillStyle=pzL3Grad(c,-10,10,[[0,'#ffffff'],[.2,col],[1,'#1d262c']]);c.fillRect(-18,-18,36,36);
      c.fillStyle='#101820';c.beginPath();c.arc(0,0,5.2,0,Math.PI*2);c.fill();
      c.fillStyle=col;c.font='bold 7px monospace';c.textAlign='center';c.textBaseline='middle';c.fillText(String(tier),0,.5);});
    parts.push({outline:o,depth:5,z:0,side:col,tex,back:tex,glow:col});
  }
  if(!parts.length)return null;
  for(const p of parts){
    // normal de cada aresta (para fora), luz das laterais calculada na hora
    let area=0;const o=p.outline;for(let i=0;i<o.length;i++){const a=o[i],b=o[(i+1)%o.length];area+=a[0]*b[1]-b[0]*a[1];}
    p.edges=o.map((a,i)=>{const b=o[(i+1)%o.length];let nx=b[1]-a[1],ny=-(b[0]-a[0]);const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;if(area<0){nx=-nx;ny=-ny;}return{a,b,nx,ny,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2};});
    p.rgb=pzL3RGB(p.side);
  }
  m={parts};PZ_LOOT3D.models.set(key,m);return m;
}
function pzL3RGB(hex){const h=hex.replace('#','');const v=h.length===3?h.split('').map(x=>parseInt(x+x,16)):[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return v;}

// ---------- desenho ----------
function pzL3Draw(ctx,model,th,scale){
  const c=Math.cos(th),s=Math.sin(th),cp=Math.cos(PZ_LOOT3D.pitch),sp=Math.sin(PZ_LOOT3D.pitch),L=PZ_LOOT3D.light;
  const P=(x,y,z)=>{const x1=x*c+z*s,z1=-x*s+z*c;return[x1*scale,(y*cp+z1*sp)*scale,z1*cp-y*sp];};
  const lit=(nx,ny,nz)=>{const x1=nx*c+nz*s,z1=-nx*s+nz*c,y2=ny*cp+z1*sp,z2=z1*cp-ny*sp;return{v:z2,k:Math.max(0,x1*L[0]+y2*L[1]+z2*L[2])};};
  const base=ctx.getTransform(),list=[];
  for(const p of model.parts){
    const zf=p.z+p.depth/2,zb=p.z-p.depth/2;
    for(const e of p.edges){
      const n=lit(e.nx,e.ny,0);if(n.v<=0.001)continue;
      list.push({d:P(e.mx,e.my,p.z)[2],side:1,p,e,k:n.k});
    }
    const f=lit(0,0,1);
    list.push({d:P(0,0,f.v>0?zf:zb)[2]+.02,cap:f.v>0?1:-1,p,k:f.v>0?f.k:lit(0,0,-1).k});
  }
  list.sort((a,b)=>a.d-b.d);
  for(const it of list){
    const p=it.p;
    if(it.side){
      const e=it.e,zf=p.z+p.depth/2,zb=p.z-p.depth/2,A=P(e.a[0],e.a[1],zf),B=P(e.b[0],e.b[1],zf),C=P(e.b[0],e.b[1],zb),D=P(e.a[0],e.a[1],zb);
      const k=.38+.75*it.k,[r,g,b]=p.rgb;
      ctx.fillStyle=`rgb(${Math.min(255,r*k)|0},${Math.min(255,g*k)|0},${Math.min(255,b*k)|0})`;
      ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.lineTo(C[0],C[1]);ctx.lineTo(D[0],D[1]);ctx.closePath();ctx.fill();
      // costura fina na quina da frente (lapidado)
      if(p.rim){ctx.strokeStyle=p.rim;ctx.globalAlpha=.5;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.stroke();ctx.globalAlpha=1;}
    }else{
      const front=it.cap>0,zc=front?p.z+p.depth/2:p.z-p.depth/2,tex=front?p.tex:(p.back||p.tex),m=front?1:-1;
      // mapa afim da arte (u,v) para a tela; no verso a arte é espelhada para ler do jeito certo
      const o=P(0,0,zc),ux=P(m,0,zc),vy=P(0,1,zc);
      ctx.setTransform(base);ctx.transform(ux[0]-o[0],ux[1]-o[1],vy[0]-o[0],vy[1]-o[1],o[0],o[1]);
      ctx.drawImage(tex.cv,-PZ_L3_TH,-PZ_L3_TH,PZ_L3_TH*2,PZ_L3_TH*2);
      // luz na face e reflexo que corre pela frente enquanto gira
      const shade=1-(.55+.6*it.k);
      const outline=front?p.outline:p.outline.map(([x,y])=>[-x,y]);
      if(shade>0){ctx.fillStyle=`rgba(0,0,0,${Math.min(.5,shade)})`;pzL3Path(ctx,outline);ctx.fill();}
      const sweep=Math.sin(th*2)*14;
      ctx.save();pzL3Path(ctx,outline);ctx.clip();
      const g=ctx.createLinearGradient(sweep-6,-12,sweep+6,12);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,`rgba(255,255,255,${.12+.28*it.k})`);g.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=g;ctx.fillRect(-PZ_L3_TH,-PZ_L3_TH,PZ_L3_TH*2,PZ_L3_TH*2);ctx.restore();
      ctx.setTransform(base);
    }
  }
}
function pzL3Shade(item){
  const t=item.type;
  return t==='shieldCell'?'#55baff':t==='medkit'?'#ff6675':t==='armor'?['','#dedede','#4b9fff','#bc70ff','#f15b58','#f5cc56'][item.tier]:t==='survivalBag'?'#c2a77c':t==='attachment'?ACCESSORY_RARITIES[item.tier-1].color:LOOT[t]?.color||'#ffffff';
}
{const _draw=LootSystem.prototype.draw;
 LootSystem.prototype.draw=function(ctx,camera,assets){
   if(window.__PZ_FLAT_LOOT)return _draw.call(this,ctx,camera,assets);
   const slow=window.__projectZGame?.save?.settings?.reducedMotion;
   ctx.save();
   for(const item of this.items){
     const pos=camera.worldToScreen(item.x,item.y);
     if(pos.x<-45||pos.x>camera.viewport.width+45||pos.y<-60||pos.y>camera.viewport.height+45)continue;
     const model=pzL3Model(item);if(!model)continue;
     const shade=pzL3Shade(item),t=this.clock*3+item.phase,bob=Math.sin(t)*2.2,pulse=.75+.25*Math.sin(t);
     const th=this.clock*(slow?.6:PZ_LOOT3D.spin)+item.phase;
     ctx.save();ctx.translate(Math.round(item.x),Math.round(item.y));
     // brilho no chão e sombra (a sombra encolhe quando o item sobe)
     const g=ctx.createRadialGradient(0,7,0,0,7,22);g.addColorStop(0,shade);g.addColorStop(1,'rgba(0,0,0,0)');
     ctx.globalAlpha=.3*pulse;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,7,22,11,0,0,Math.PI*2);ctx.fill();
     ctx.globalAlpha=.42-bob*.03;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,8,9.5-bob*.4,3.6-bob*.15,0,0,Math.PI*2);ctx.fill();
     ctx.globalAlpha=1;
     if(item.type==='attachment'&&item.tier>=4){ctx.globalAlpha=.22;ctx.fillStyle=shade;ctx.fillRect(-3,-66,6,58);ctx.globalAlpha=1;}
     ctx.translate(0,-7-bob);
     pzL3Draw(ctx,model,th,item.type==='fullHeart'?1.22:item.small?.95:1.14);
     // faíscas nos itens raros
     if(item.type==='fullHeart'||item.type==='shieldCell'||(item.tier>=4&&(item.type==='attachment'||item.type==='armor'))){
       ctx.fillStyle='#fff8e0';
       for(let i=0;i<3;i++){const a=this.clock*1.7+i*2.09+item.phase,r=14,k=(Math.sin(this.clock*4+i*1.3)+1)/2;
         ctx.globalAlpha=.25+.6*k;const x=Math.cos(a)*r,y=Math.sin(a)*r*.45-2,sz=.8+1.2*k;ctx.fillRect(x-sz/2,y-sz*1.6,sz,sz*3.2);ctx.fillRect(x-sz*1.6,y-sz/2,sz*3.2,sz);}
       ctx.globalAlpha=1;
     }
     ctx.restore();
     if(item.type==='ammo'){ctx.save();ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillText(String(item.remaining??30),Math.round(item.x)+.6,Math.round(item.y)+22.6);ctx.fillStyle='#fff5db';ctx.fillText(String(item.remaining??30),Math.round(item.x),Math.round(item.y)+22);ctx.restore();}
   }
   ctx.restore();
 };}
