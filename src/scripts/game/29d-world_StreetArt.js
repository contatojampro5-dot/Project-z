// -- src/world/StreetArt.js --
// ATLAS A9 · Afrodite — a cidade fala: pichações (spray e pixo paulistano), frases políticas dos dois lados,
// e lambe-lambes colados uns sobre os outros (eleição, desaparecidos, avisos oficiais, "compro ouro", cartomante).
// Candidatos e números de urna são inventados.
const PZ_POLITICS=Object.freeze([
  'FORA LULA','FASCISTAS NÃO PASSARÃO','FORA BOLSONARO','DITADURA NUNCA MAIS','SEM ANISTIA','INTERVENÇÃO JÁ',
  'O GOVERNO SABIA','CADÊ O EXÉRCITO?','QUARENTENA É PRISÃO','ELES MENTIRAM','SP RESISTE','FORA TODOS',
  'POLÍTICO É O VÍRUS','LIBERDADE!','NEM ESQUERDA NEM DIREITA: SOBREVIVA','A CULPA É DE BRASÍLIA','VOTO NULO',
]);
const PZ_TAGS=Object.freeze(['FOGO','ÓDIO','RUÍNA','NOIA','KAOS','VÍRUS','ZN','LESTE','MOOCA','BRÁS 011','ZUMBI','FIM']);
const PZ_SPRAY_COLORS=Object.freeze(['#d8322f','#111214','#e8e4da','#2f6fd0','#e8c547','#1f8a4c','#c43fb8','#f07a2a']);

// Spray: letras com contorno, um pouco tortas, com tinta escorrendo.
function pzSpray(ctx,x,y,text,{color='#d8322f',size=12,rot=0,rand=Math.random,outline=true}={}){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  ctx.font=`900 ${size}px Impact,"Arial Black","Helvetica Neue",sans-serif`;ctx.textBaseline='alphabetic';
  const w=ctx.measureText(text).width;
  if(outline){ctx.lineJoin='round';ctx.lineWidth=Math.max(1.5,size*.18);ctx.strokeStyle=color==='#111214'?'rgba(230,226,218,.55)':'rgba(10,10,12,.75)';ctx.strokeText(text,0,0);}
  ctx.fillStyle=color;ctx.fillText(text,0,0);
  // overspray (névoa da lata) e escorridos
  ctx.globalAlpha=.18;ctx.fillText(text,.8,.6);ctx.globalAlpha=1;
  for(let i=0;i<Math.max(2,Math.round(w/7));i++){if(rand()<.55)continue;const dx=rand()*w,len=2+rand()*size*.9;ctx.fillStyle=color;ctx.fillRect(dx,-1,Math.max(.8,size*.07),len);ctx.beginPath();ctx.arc(dx+size*.035,len-1,size*.06,0,Math.PI*2);ctx.fill();}
  ctx.restore();return w;
}
// Pixo: letras altas e retas, em preto, típicas dos prédios de São Paulo.
function pzPixo(ctx,x,y,text,{size=14,color='#0e0f11',rot=0}={}){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(.55,1.45);
  ctx.font=`700 ${size}px "Courier New",monospace`;ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=1.1;
  ctx.fillText(text,0,0);ctx.strokeText(text,0,0);
  ctx.fillRect(0,2,ctx.measureText(text).width,1); // sublinhado
  ctx.restore();
}
// Lambe-lambe (cartaz colado). kind: aleatório se não informado.
const PZ_POSTER_KINDS=['eleicao','eleicao','procura','aviso','ouro','cartomante','politica','fim'];
function pzPoster(ctx,x,y,w,h,rand=Math.random,kind){
  kind=kind||PZ_POSTER_KINDS[Math.floor(rand()*PZ_POSTER_KINDS.length)];
  ctx.save();ctx.translate(x,y);ctx.rotate((rand()-.5)*.08);
  const fit=(t,max,sz,weight='900')=>{let s=sz;ctx.font=`${weight} ${s}px "Arial Narrow",Arial,sans-serif`;while(ctx.measureText(t).width>max&&s>3){s-=.5;ctx.font=`${weight} ${s}px "Arial Narrow",Arial,sans-serif`;}return s;};
  const txt=(t,ty,sz,col,weight)=>{const s=fit(t,w-3,sz,weight);ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(t,w/2,ty+s*.85);ctx.textAlign='start';return s;};
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(1,1.2,w,h);
  let bg='#e9e3d2';
  if(kind==='eleicao'){const pal=[['#1b4f9c','#f2d33a'],['#c8262c','#fff'],['#1f7a3e','#f4e04a'],['#5b2a86','#fff']][Math.floor(rand()*4)];
    ctx.fillStyle=pal[0];ctx.fillRect(0,0,w,h);ctx.fillStyle='#d9cbb5';ctx.fillRect(w*.2,h*.12,w*.6,h*.38);ctx.fillStyle='#5a4636';ctx.beginPath();ctx.arc(w/2,h*.27,w*.14,0,Math.PI*2);ctx.fill();ctx.fillRect(w*.3,h*.38,w*.4,h*.12);
    const names=['ZÉ DA QUEBRADA','DONA CIDA','PASTOR ELIAS','CAPITÃO REIS','PROF. MARINA','TONHÃO DO BRÁS','DRA. LÚCIA'];
    txt(names[Math.floor(rand()*names.length)],h*.53,h*.13,pal[1]);txt(String(70+Math.floor(rand()*29))+'.'+String(100+Math.floor(rand()*899)),h*.7,h*.17,'#fff');txt(rand()<.5?'VEREADOR':'DEP. ESTADUAL',h*.88,h*.08,pal[1],'700');
    // bigode e chifres desenhados por cima
    if(rand()<.35){ctx.strokeStyle='#111';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(w*.4,h*.32);ctx.lineTo(w*.6,h*.32);ctx.moveTo(w*.38,h*.14);ctx.lineTo(w*.42,h*.2);ctx.moveTo(w*.62,h*.14);ctx.lineTo(w*.58,h*.2);ctx.stroke();}
    bg=null;}
  else{
    bg=kind==='ouro'?'#f2dc3a':kind==='cartomante'?'#f4b8c8':kind==='aviso'?'#f0ece2':kind==='fim'?'#ffffff':kind==='politica'?'#111214':'#ece6d6';
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    if(kind==='procura'){txt('DESAPARECIDO',h*.04,h*.1,'#b01e1e');ctx.fillStyle='#4a4540';ctx.fillRect(w*.18,h*.18,w*.64,h*.42);ctx.fillStyle='#8a7f72';ctx.beginPath();ctx.arc(w/2,h*.33,w*.13,0,Math.PI*2);ctx.fill();
      txt(['LUCAS, 9 ANOS','MARIA S.','SR. JOÃO','ANA CLARA','PEDRINHO'][Math.floor(rand()*5)],h*.64,h*.1,'#111');ctx.fillStyle='rgba(30,30,30,.6)';for(let l=h*.8;l<h*.95;l+=h*.06)ctx.fillRect(w*.12,l,w*.76,.7);}
    else if(kind==='aviso'){ctx.fillStyle='#1d4a85';ctx.fillRect(0,0,w,h*.16);txt('PREFEITURA DE SP',h*.02,h*.09,'#fff','700');txt('TOQUE DE',h*.22,h*.15,'#111');txt('RECOLHER',h*.38,h*.15,'#111');txt('18H ÀS 6H',h*.56,h*.17,'#b01e1e');ctx.fillStyle='rgba(30,30,30,.55)';for(let l=h*.8;l<h*.95;l+=h*.05)ctx.fillRect(w*.1,l,w*.8,.6);}
    else if(kind==='ouro'){txt('COMPRO',h*.08,h*.2,'#c8262c');txt('OURO',h*.32,h*.3,'#111');txt('PAGO À VISTA',h*.72,h*.1,'#111','700');}
    else if(kind==='cartomante'){txt('MÃE ROSA',h*.06,h*.15,'#5b2a86');txt('TRAGO A PESSOA',h*.32,h*.1,'#111','700');txt('AMADA EM 3 DIAS',h*.46,h*.1,'#111','700');txt('JOGO DE BÚZIOS',h*.7,h*.09,'#5b2a86','700');}
    else if(kind==='fim'){txt('ARREPENDEI-VOS',h*.12,h*.12,'#111');txt('O FIM',h*.36,h*.22,'#c8262c');txt('CHEGOU',h*.62,h*.18,'#111');}
    else{const t=PZ_POLITICS[Math.floor(rand()*PZ_POLITICS.length)].split(' ');let ty=h*.08;const lines=[];let cur='';for(const wd of t){if((cur+' '+wd).trim().length>9){if(cur)lines.push(cur);cur=wd;}else cur=(cur+' '+wd).trim();}if(cur)lines.push(cur);
      const lh=Math.min(h*.26,h*.86/lines.length);for(const ln of lines){txt(ln,ty,lh*.9,rand()<.5?'#e8e4da':'#e3342f');ty+=lh;}}
  }
  // desgaste: papel rasgado, bolhas de cola, sujeira
  ctx.fillStyle='rgba(60,50,35,.18)';ctx.fillRect(0,h*.6,w,h*.4);
  if(rand()<.6){ctx.fillStyle='rgba(40,38,34,.9)';ctx.beginPath();const c=rand()<.5;ctx.moveTo(c?w:0,h);ctx.lineTo(c?w-w*.35:w*.35,h);ctx.lineTo(c?w:0,h-h*.3);ctx.closePath();ctx.fill();}
  if(rand()<.4){ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(rand()*w*.7,rand()*h*.7,w*.3,1);}
  ctx.restore();
}
// Uma parede cheia: cartazes sobrepostos + pichação por cima.
function pzPosterCluster(ctx,x,y,w,h,rand){
  const n=2+Math.floor(rand()*3),pw=Math.min(w*.5,22),ph=pw*1.35;
  for(let i=0;i<n;i++)pzPoster(ctx,x+rand()*(w-pw),y+rand()*Math.max(1,h-ph),pw,ph,rand);
}
