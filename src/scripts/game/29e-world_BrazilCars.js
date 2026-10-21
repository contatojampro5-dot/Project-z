// -- src/world/BrazilCars.js --
// ATLAS A10 · Hefesto — frota paulistana. As medidas (e as colisões) de cada tipo continuam as mesmas;
// muda o desenho: hatch popular quadradão, hatch moderno, Fusca, sedã compacto/médio, táxi branco,
// viatura da polícia, picape pequena com caçamba carregada, Kombi, furgão de entrega e ambulância.
// Cores seguem a frota brasileira (muito branco, preto, prata e cinza). Marcas são fictícias / sem logotipo.
// Cada carro é desenhado uma vez num canvas próprio (2x) e depois só copiado girado.
const PZ_CAR_CACHE=new Map();
const PZ_CAR_COLORS=[ // [peso, cor]
  [22,'#d9dad6'],[19,'#1c1e22'],[17,'#a9adb0'],[15,'#6b7076'],[8,'#9c2a2a'],[7,'#2b4c86'],
  [3,'#c9b48a'],[3,'#3f5a3c'],[3,'#5e2430'],[3,'#8a7a5a'],
];
const PZ_CLASSIC_COLORS=['#c9b48a','#8fb3c9','#5f6e46','#9a4a32','#d8cfa8','#6e8a8a'];
function pzPick(rand,list){let t=list.reduce((s,a)=>s+a[0],0)*rand();for(const [w,c] of list){if((t-=w)<=0)return c;}return list[0][1];}
function pzShade(hex,k){const v=hex.replace('#','');const c=[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(v.slice(i,i+2),16)*k))));return `rgb(${c.join(',')})`;}

function pzCarVariant(kind,rand){
  const k=rand();
  if(kind==='hatch')return k<.5?'quadrado':k<.8?'moderno':'fusca';
  if(kind==='sedan')return k<.45?'compacto':k<.7?'medio':k<.86?'taxi':'policia';
  if(kind==='pickup')return 'picape';
  return k<.5?'kombi':k<.85?'furgao':'samu';
}
function pzRR(c,x,y,w,h,rad){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,rad);else c.rect(x,y,w,h);}

// Desenho no espaço local: frente para -y, centro em 0,0.
function pzPaintCar(c,kind,variant,rand,w,h){
  let body=variant==='taxi'||variant==='policia'||variant==='samu'?'#e4e5e1':variant==='fusca'?PZ_CLASSIC_COLORS[Math.floor(rand()*PZ_CLASSIC_COLORS.length)]:pzPick(rand,PZ_CAR_COLORS);
  if(variant==='furgao')body=rand()<.8?'#e2e3df':'#a9adb0';
  const old=variant==='quadrado'||variant==='fusca'||variant==='kombi'||(variant==='compacto'&&rand()<.5);
  const glass='#1a2630',glassHi='rgba(170,200,220,.22)',dark='#15171a';
  // sombra
  c.fillStyle='rgba(0,0,0,.45)';pzRR(c,-w/2+5,-h/2+7,w,h,8);c.fill();
  // rodas aparecendo nos cantos
  c.fillStyle='#0d0f12';for(const [sx,sy] of [[-1,-.3],[1,-.3],[-1,.3],[1,.3]])c.fillRect(sx*(w/2)-(sx<0?3:0),sy*h-6,3,12);
  if(variant==='fusca'){
    // carroceria oval com para-lamas
    c.fillStyle=pzShade(body,.75);for(const [sx,sy] of [[-1,-.28],[1,-.28],[-1,.3],[1,.3]]){c.beginPath();c.ellipse(sx*w*.36,sy*h,w*.2,h*.14,0,0,Math.PI*2);c.fill();}
    c.fillStyle=body;c.beginPath();c.ellipse(0,0,w*.42,h*.5,0,0,Math.PI*2);c.fill();
    c.fillStyle=pzShade(body,1.12);c.beginPath();c.ellipse(-w*.08,h*.02,w*.3,h*.25,0,0,Math.PI*2);c.fill(); // teto
    c.fillStyle=glass;c.beginPath();c.ellipse(0,-h*.17,w*.27,h*.07,0,Math.PI,0);c.fill();c.fillRect(-w*.27,-h*.17,w*.54,3);
    c.fillStyle=glass;c.fillRect(-w*.16,h*.25,w*.32,4); // vigia traseira pequena
    c.fillStyle='#e9e6d6';c.beginPath();c.arc(-w*.3,-h*.4,2.6,0,Math.PI*2);c.arc(w*.3,-h*.4,2.6,0,Math.PI*2);c.fill();
    c.fillStyle='rgba(0,0,0,.25)';for(let i=-3;i<=3;i++)c.fillRect(i*2.4-.5,h*.33,1,6); // grade do motor atrás
    c.fillStyle='#b8bcbf';c.fillRect(-w*.38,-h*.5,w*.76,1.6);c.fillRect(-w*.38,h*.49-1.6,w*.76,1.6); // para-choques cromados
    c.fillStyle='#8a8f93';c.fillRect(-4,h*.5-1,8,2.4); // placa cinza antiga
    return;
  }
  // carroceria
  const rad=variant==='moderno'?9:variant==='kombi'?7:variant==='quadrado'?3.5:5;
  c.fillStyle=body;pzRR(c,-w/2,-h/2,w,h,rad);c.fill();
  // brilho na lateral esquerda e sombra na direita (volume)
  c.fillStyle='rgba(255,255,255,.14)';c.fillRect(-w/2+1.5,-h/2+rad,2.4,h-rad*2);
  c.fillStyle='rgba(0,0,0,.25)';c.fillRect(w/2-3.5,-h/2+rad,2.4,h-rad*2);
  const bumper=(y)=>{c.fillStyle=old?'#25272a':pzShade(body,.85);c.fillRect(-w/2+2,y,w-4,2.2);};
  if(variant==='kombi'||variant==='furgao'||variant==='samu'){
    // teto longo com nervuras, frente achatada
    if(variant==='kombi'&&rand()<.6){c.fillStyle='#e8e6de';pzRR(c,-w/2+2,-h/2+8,w-4,h-12,5);c.fill();} // "saia e blusa"
    c.fillStyle=glass;c.fillRect(-w/2+4,-h/2+3,w-8,6); // para-brisa visto de cima
    c.fillStyle='rgba(0,0,0,.14)';for(let y=-h/2+16;y<h/2-8;y+=6)c.fillRect(-w/2+5,y,w-10,1.2);
    if(variant!=='furgao'){c.fillStyle=glass;for(let y=-h/2+16;y<h/2-14;y+=11){c.fillRect(-w/2+1,y,2,8);c.fillRect(w/2-3,y,2,8);}}
    if(variant==='kombi'){c.fillStyle='#c9ccce';c.beginPath();c.moveTo(-6,-h/2+1);c.lineTo(0,-h/2+5);c.lineTo(6,-h/2+1);c.lineWidth=1.4;c.strokeStyle='#c9ccce';c.stroke();
      if(rand()<.35){c.fillStyle='#2a2b2e';c.fillRect(-w/2+6,-h*.1,w-12,h*.35);for(let i=0;i<4;i++){c.fillStyle=['#7a5a3a','#5a6a7a','#3a3a3a'][i%3];c.fillRect(-w/2+8+i*8,-h*.05,6,8);}} // bagageiro com tralha
    }
    if(variant==='furgao'){c.fillStyle='#c8372f';c.fillRect(-w/2+2,h*.05,w-4,3);c.fillStyle='rgba(40,40,40,.65)';c.font='bold 5px monospace';c.save();c.rotate(Math.PI/2);c.fillText('ENTREGAS',-12,w/2-6);c.restore();}
    if(variant==='samu'){c.fillStyle='#c8241f';c.fillRect(-w/2+2,-h*.05,w-4,5);c.fillRect(-2.5,-h*.3,5,16);c.fillRect(-8,-h*.3+5.5,16,5);
      c.fillStyle='#c8241f';c.font='bold 6px Arial';c.textAlign='center';c.fillText('SAMU 192',0,h*.3);c.textAlign='start';
      c.fillStyle='#e8352e';c.fillRect(-w/2+5,-h/2+11,w*.35,3);c.fillStyle='#2f6fd0';c.fillRect(w/2-5-w*.35,-h/2+11,w*.35,3);}
    bumper(-h/2);bumper(h/2-2.2);
  }else{
    const pick=variant==='picape';
    const hood=variant==='medio'?.3:variant==='moderno'?.22:.24;
    const ws0=-h/2+h*hood;                         // começo do para-brisa
    const roofLen=pick?h*.25:variant==='quadrado'?h*.33:h*.3;
    const ws1=ws0+(variant==='moderno'?9:7);        // fim do para-brisa
    const rf1=ws1+roofLen;
    // vincos do capô
    c.fillStyle='rgba(0,0,0,.12)';c.fillRect(-w*.22,-h/2+4,1,ws0+h/2-5);c.fillRect(w*.22,-h/2+4,1,ws0+h/2-5);
    // para-brisa
    c.fillStyle=glass;c.beginPath();c.moveTo(-w/2+4,ws0+ (variant==='moderno'?2:0));c.lineTo(w/2-4,ws0+(variant==='moderno'?2:0));c.lineTo(w/2-5.5,ws1);c.lineTo(-w/2+5.5,ws1);c.closePath();c.fill();
    c.fillStyle=glassHi;c.fillRect(-w/2+6,ws0+1,w*.25,1.4);
    // teto
    c.fillStyle=pzShade(body,1.07);pzRR(c,-w/2+5.5,ws1,w-11,roofLen,2.5);c.fill();
    // vidros laterais (filetes)
    c.fillStyle=glass;c.fillRect(-w/2+3,ws1+1,2,roofLen-2);c.fillRect(w/2-5,ws1+1,2,roofLen-2);
    if(pick){
      // cabine fecha, caçamba aberta com carga
      c.fillStyle=glass;c.fillRect(-w/2+6,rf1,w-12,3);
      const b0=rf1+5,b1=h/2-3;c.fillStyle=pzShade(body,.6);c.fillRect(-w/2+3,b0,w-6,b1-b0);
      c.fillStyle='#2a2522';c.fillRect(-w/2+5,b0+2,w-10,b1-b0-4);
      const load=Math.floor(rand()*4);
      if(load===0){for(let i=0;i<9;i++){c.fillStyle=['#7a7068','#5c5650','#8a6a4a'][i%3];c.fillRect(-w/2+6+rand()*(w-16),b0+3+rand()*(b1-b0-10),4+rand()*5,3+rand()*4);}} // entulho
      else if(load===1){c.fillStyle='#2f5fa0';c.beginPath();c.arc(-5,b0+9,5,0,Math.PI*2);c.fill();c.fillStyle='#c8372f';c.beginPath();c.arc(6,b0+12,4.5,0,Math.PI*2);c.fill();} // botijões
      else if(load===2){for(let i=0;i<4;i++){c.fillStyle=i%2?'#b08a5a':'#9a764a';c.fillRect(-w/2+6+(i%2)*14,b0+3+Math.floor(i/2)*10,12,9);}} // caixas
      else{c.fillStyle='#4b6b3a';c.fillRect(-w/2+6,b0+3,w-12,b1-b0-6);c.fillStyle='rgba(0,0,0,.25)';for(let y=b0+5;y<b1-3;y+=4)c.fillRect(-w/2+6,y,w-12,1);} // lona
    }else{
      // vigia traseira e tampa (porta-malas no sedã)
      const rw=variant==='quadrado'?4:6;c.fillStyle=glass;c.fillRect(-w/2+6,rf1,w-12,rw);
      if(variant==='compacto'||variant==='medio'||variant==='taxi'||variant==='policia'){c.fillStyle='rgba(0,0,0,.14)';c.fillRect(-w/2+5,rf1+rw+1,w-10,1);}
    }
    // faróis e lanternas
    c.fillStyle='#e9e6d6';
    if(variant==='moderno'){c.beginPath();c.moveTo(-w/2+2,-h/2+4);c.lineTo(-w/2+11,-h/2+2);c.lineTo(-w/2+9,-h/2+6);c.fill();c.beginPath();c.moveTo(w/2-2,-h/2+4);c.lineTo(w/2-11,-h/2+2);c.lineTo(w/2-9,-h/2+6);c.fill();}
    else{c.fillRect(-w/2+3,-h/2+1.5,7,3);c.fillRect(w/2-10,-h/2+1.5,7,3);}
    bumper(-h/2);bumper(h/2-2.2);
    // táxi: luminoso; polícia: giroflex e grafismo
    if(variant==='taxi'){const ry=ws1+roofLen*.4;c.fillStyle='#f4f1e6';c.fillRect(-6,ry,12,5);c.fillStyle='#c8241f';c.font='bold 3.6px Arial';c.textAlign='center';c.fillText('TÁXI',0,ry+4);c.textAlign='start';
      c.fillStyle='rgba(30,30,30,.55)';c.fillRect(-w/2,-h*.05,1.4,h*.3);c.fillRect(w/2-1.4,-h*.05,1.4,h*.3);}
    if(variant==='policia'){const ry=ws1+2;c.fillStyle='#1d1e22';c.fillRect(-w/2+6,ry,w-12,4);c.fillStyle='#d8241f';c.fillRect(-w/2+6,ry,(w-12)/2-1,4);c.fillStyle='#2f6fd0';c.fillRect(1,ry,(w-12)/2-1,4);
      c.fillStyle='#c8241f';c.fillRect(-w/2,-h*.02,2.4,h*.3);c.fillRect(w/2-2.4,-h*.02,2.4,h*.3);c.fillStyle='#5d6268';c.fillRect(-w/2,h*.28,2.4,h*.1);c.fillRect(w/2-2.4,h*.28,2.4,h*.1);
      c.fillStyle='#1d1e22';c.font='bold 4.4px Arial';c.textAlign='center';c.fillText('POLÍCIA',0,-h/2+h*.14);c.textAlign='start';}
  }
  // lanternas traseiras e placa (Mercosul nos novos, cinza nos antigos)
  c.fillStyle='#8f1d1d';c.fillRect(-w/2+2.5,h/2-3.5,5,2.5);c.fillRect(w/2-7.5,h/2-3.5,5,2.5);
  if(old){c.fillStyle='#8a8f93';c.fillRect(-4,h/2-1.2,8,2.4);}else{c.fillStyle='#f2f2ee';c.fillRect(-4,h/2-1.2,8,2.4);c.fillStyle='#2f55a8';c.fillRect(-4,h/2-1.2,8,.7);}
  // abandono: sujeira, ferrugem, vidro trincado, retrovisor
  c.fillStyle='rgba(0,0,0,.3)';c.fillRect(-w/2-1.5,-h/2+h*.26,2,3);c.fillRect(w/2-.5,-h/2+h*.26,2,3);
  for(let i=0;i<5;i++){c.fillStyle=rand()<.5?'rgba(90,70,50,.22)':'rgba(30,26,22,.2)';c.beginPath();c.ellipse((rand()-.5)*w*.8,(rand()-.5)*h*.8,2+rand()*5,1.5+rand()*3,rand()*3,0,Math.PI*2);c.fill();}
  if(old&&rand()<.6){c.fillStyle='rgba(140,70,30,.45)';c.fillRect(-w/2+1,h*.2,3,5);c.fillRect(w/2-4,-h*.1,3,4);}
  if(rand()<.5){c.strokeStyle='rgba(225,230,235,.55)';c.lineWidth=.6;const cx=(rand()-.5)*w*.4,cy=-h/2+h*.27;c.beginPath();for(let i=0;i<5;i++){const a=rand()*Math.PI*2;c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*6,cy+Math.sin(a)*3);}c.stroke();}
}
civilianCar=function(ctx,x,y,{kind='sedan',angle=0,paint='slate'}={}){
  const w=kind==='van'?47:kind==='pickup'?43:kind==='hatch'?36:37;
  const h=kind==='van'?89:kind==='pickup'?82:kind==='hatch'?60:70;
  const key=`${Math.round(x)}:${Math.round(y)}:${kind}`;let spr=PZ_CAR_CACHE.get(key);
  if(!spr){
    const rand=mulberry32(Math.round(x*131+y*71)+kind.length*7),variant=pzCarVariant(kind,rand),R=2,P=12;
    const cv=document.createElement('canvas');cv.width=(w+P*2)*R;cv.height=(h+P*2)*R;const c=cv.getContext('2d');
    c.scale(R,R);c.translate(w/2+P,h/2+P);pzPaintCar(c,kind,variant,rand,w,h);
    spr={cv,w:w+P*2,h:h+P*2,variant};PZ_CAR_CACHE.set(key,spr);
  }
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.imageSmoothingEnabled=true;ctx.drawImage(spr.cv,-spr.w/2,-spr.h/2,spr.w,spr.h);ctx.restore();
};
