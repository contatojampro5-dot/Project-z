// -- src/world/TallBuildings.js --
// ATLAS A8 · Deméter + Hefesto — prédios de 3 a 5 andares.
// A base (colisão) não muda. A parede da frente sobe sobre a própria base e o telhado passa a ficar por cima da
// rua de trás. Por isso o prédio deixa de ser pintado no chão e vira um objeto desenhado junto com os personagens,
// ordenado pela linha da base: quem está atrás some atrás do prédio, quem está na frente aparece na frente.
// Quando o JOGADOR passa atrás, o prédio fica translúcido e o que estiver atrás dele (inclusive zumbis) aparece.
const PZ_TALL={list:[],byKey:new Map(),floor:27};
const _pzBuildingFlat=building;

function pzTallHeight(x,y,w,h){const r=mulberry32(Math.round(x*31+y*17+w*7+h));return Math.round(84+Math.floor(r()*4)*18);} // 84–138 px: 3 a 5 andares

building=function(ctx,x,y,w,h,options={}){
  const key=`${Math.round(x)}:${Math.round(y)}:${Math.round(w)}:${Math.round(h)}`;
  const scale=Math.abs(ctx.getTransform?.().a||1);
  if(!PZ_TALL.byKey.has(key)){
    const b={x,y,w,h,H:pzTallHeight(x,y,w,h),options,res:scale<.9?.5:1,cache:null,alpha:1};
    PZ_TALL.byKey.set(key,b);PZ_TALL.list.push(b);
  }
  // No chão fica só a sombra do volume (luz vinda do noroeste) e o contato com a calçada.
  const H=PZ_TALL.byKey.get(key).H;
  ctx.save();
  ctx.fillStyle='rgba(4,5,8,.42)';
  ctx.beginPath();ctx.moveTo(x+w,y+h);ctx.lineTo(x+w+H*.42,y+h+H*.12);ctx.lineTo(x+w+H*.42,y-H*.1);ctx.lineTo(x+w,y);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(4,5,8,.35)';ctx.fillRect(x-4,y+h,w+8,9);
  ctx.fillStyle='#16171b';ctx.fillRect(x,y,w,h);
  ctx.restore();
};

// Fachada de frente: janelas por andar, faixas entre andares, térreo com portas de enrolar e letreiro.
const PZ_WIN=Object.freeze({tungsten:[255,190,112],fluo:[214,236,255],tv:[132,168,255]});
function pzPaintFacade(ctx,b,ox,oy){
  b.lit=[];b.doors=[];
  const{w,H,options}=b,rand=mulberry32(Math.round(b.x*13+b.y*7+w));const glow=options.glow||'#e04b4d';
  const g=ctx.createLinearGradient(0,oy,0,oy+H);g.addColorStop(0,'#3a383d');g.addColorStop(.55,'#2c2c31');g.addColorStop(1,'#1c1d22');
  ctx.fillStyle=g;ctx.fillRect(ox,oy,w,H);
  // textura de concreto e manchas de chuva escorrendo
  for(let i=0;i<Math.floor(w/9);i++){const sx=ox+rand()*w,sl=8+rand()*H*.6;ctx.fillStyle=`rgba(10,12,14,${(.05+rand()*.12).toFixed(3)})`;ctx.fillRect(sx,oy+rand()*H*.3,1+rand()*2,sl);}
  const F=PZ_TALL.floor,floors=Math.max(2,Math.round(H/F)),fh=H/floors;
  const bay=w>160?22:18;
  for(let f=0;f<floors-1;f++){const fy=oy+f*fh;
    ctx.fillStyle='rgba(120,116,118,.35)';ctx.fillRect(ox,fy+fh-3,w,2);// laje
    for(let wx=ox+9;wx<ox+w-bay+4;wx+=bay){
      const ww=bay-8,wh=fh-11,wy=fy+5;const lit=rand()<.13,broken=rand()<.12,dark=rand()<.5;
      ctx.fillStyle='#101216';ctx.fillRect(wx-1,wy-1,ww+2,wh+2);
      let lc=null;
      if(lit){const k=rand();lc=k<.62?PZ_WIN.tungsten:k<.9?PZ_WIN.fluo:PZ_WIN.tv;
        // vidro aceso: mais claro no centro, cortina/persiana em parte da janela
        const g=ctx.createLinearGradient(0,wy,0,wy+wh);g.addColorStop(0,`rgb(${lc.map(v=>Math.round(v*.78)).join(',')})`);g.addColorStop(.5,`rgb(${lc.join(',')})`);g.addColorStop(1,`rgb(${lc.map(v=>Math.round(v*.7)).join(',')})`);
        ctx.fillStyle=g;ctx.fillRect(wx,wy,ww,wh);
        if(rand()<.5){ctx.fillStyle='rgba(60,40,30,.55)';ctx.fillRect(wx,wy,ww*(.25+rand()*.35),wh);}
        if(rand()<.4){ctx.fillStyle='rgba(30,22,20,.6)';for(let l=wy+2;l<wy+wh;l+=3)ctx.fillRect(wx,l,ww,1);}
        b.lit.push({x:wx-ox,y:wy-oy,w:ww,h:wh,rgb:lc,floor:f});
      }else{ctx.fillStyle=broken?'#07080a':dark?'#161a20':'#222a33';ctx.fillRect(wx,wy,ww,wh);}
      if(!lit&&!broken){ctx.fillStyle='rgba(170,190,210,.13)';ctx.fillRect(wx+1,wy+1,ww*.4,wh-2);}// reflexo
      if(broken){ctx.strokeStyle='rgba(160,170,180,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(wx,wy);ctx.lineTo(wx+ww*.6,wy+wh*.7);ctx.lineTo(wx+ww,wy+wh*.3);ctx.stroke();}
      ctx.fillStyle='rgba(150,146,148,.5)';ctx.fillRect(wx-1,wy+wh+1,ww+2,1);// peitoril
      if(rand()<.06){ctx.fillStyle='#4b4f55';ctx.fillRect(wx+2,wy+wh-6,ww-4,6);ctx.fillStyle='#2a2d31';ctx.fillRect(wx+3,wy+wh-5,ww-6,1);}// ar-condicionado
    }
  }
  // térreo: portas de aço, uma vitrine acesa e marquise
  const gy=oy+(floors-1)*fh,gh=fh;
  ctx.fillStyle='#151619';ctx.fillRect(ox,gy,w,gh);
  for(let sx=ox+8;sx<ox+w-30;sx+=Math.max(34,w/4)){
    const sw=Math.min(28,w/5);const open=rand()<.25;
    ctx.fillStyle=open?'rgb(214,170,112)':'#5a5d62';ctx.fillRect(sx,gy+6,sw,gh-7);
    if(open){ctx.fillStyle='rgba(40,28,20,.6)';ctx.fillRect(sx+3,gy+gh*.45,sw-6,gh*.5);b.doors.push({x:sx-ox,y:gy+6-oy,w:sw,h:gh-7});}
    if(!open)for(let l=gy+8;l<gy+gh-2;l+=3){ctx.fillStyle='rgba(20,22,26,.6)';ctx.fillRect(sx,l,sw,1);}
    if(rand()<.4){ctx.fillStyle='rgba(30,10,12,.7)';ctx.fillRect(sx+3,gy+gh*.4,sw-6,3);}// pichação
  }
  ctx.fillStyle='#2b2c31';ctx.fillRect(ox-2,gy-1,w+4,5);ctx.fillStyle=glow;ctx.globalAlpha=.55;ctx.fillRect(ox+w*.18,gy,w*.3,2);ctx.globalAlpha=1;
  // quina direita na sombra e borda esquerda iluminada
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(ox+w-7,oy,7,H);
  ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(ox,oy,3,H);
}

function pzTallCache(b){
  if(b.cache)return b.cache;
  const pad=10,res=b.res,cw=Math.ceil((b.w+pad*2)*res),ch=Math.ceil((b.h+b.H+pad*2)*res);
  const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d');x.scale(res,res);x.imageSmoothingEnabled=false;
  // telhado: o desenho original do prédio, sem as sombras de chão nem a fachada baixa antiga
  x.save();x.translate(pad-b.x,pad-b.y);_pzBuildingFlat(x,b.x,b.y,b.h>0?b.w:b.w,b.h,Object.assign({},b.options,{__shell:true}));x.restore();
  pzPaintFacade(x,b,pad,pad+b.h);
  // beiral: sombra do telhado sobre o topo da parede
  const eg=x.createLinearGradient(0,pad+b.h,0,pad+b.h+10);eg.addColorStop(0,'rgba(0,0,0,.55)');eg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=eg;x.fillRect(pad,pad+b.h,b.w,10);
  b.cache={canvas:c,pad};
  // ATLAS A9: máscara de luz própria (janelas e lojas acesas) e o brilho que ela faz no ar; luz que cai na calçada.
  if(b.lit.length||b.doors.length){
    const e=document.createElement('canvas');e.width=cw;e.height=ch;const ex=e.getContext('2d');ex.scale(res,res);
    const gl=document.createElement('canvas');gl.width=Math.ceil(cw/2);gl.height=Math.ceil(ch/2);const gx=gl.getContext('2d');gx.scale(res/2,res/2);
    const fy=pad+b.h;
    for(const q of b.lit){ex.fillStyle=`rgb(${q.rgb.map(v=>Math.min(255,v+40)).join(',')})`;ex.fillRect(pad+q.x,fy+q.y,q.w,q.h);
      const g=gx.createRadialGradient(pad+q.x+q.w/2,fy+q.y+q.h/2,1,pad+q.x+q.w/2,fy+q.y+q.h/2,q.w*1.3);g.addColorStop(0,`rgba(${q.rgb.join(',')},.5)`);g.addColorStop(1,`rgba(${q.rgb.join(',')},0)`);
      gx.fillStyle=g;gx.fillRect(pad+q.x-q.w*1.3,fy+q.y-q.w*1.3+q.h/2,q.w*3.6,q.w*2.6+q.h);}
    for(const q of b.doors){ex.fillStyle='rgb(255,214,160)';ex.fillRect(pad+q.x,fy+q.y,q.w,q.h);}
    b.cache.emis=e;b.cache.glow=gl;
  }
  const spill=[];
  for(const q of b.doors)spill.push({x:q.x+q.w/2,y:16,R:62,rgb:[255,200,140],p:.9});
  const low=b.lit.filter(q=>q.floor>=Math.max(0,Math.round(b.H/PZ_TALL.floor)-3));
  for(const q of low.slice(0,4))spill.push({x:q.x+q.w/2,y:22,R:54,rgb:q.rgb,p:.42});
  b.cache.spill=spill;
  return b.cache;
}

// Lista de prédios visíveis neste quadro, como "desenháveis" ordenados pela base.
function pzTallDrawables(camera,viewport,player,dt){
  const out=[];if(!PZ_TALL.list.length)return out;
  const v=camera.view?.()||null;
  for(const b of PZ_TALL.list){
    const top=camera.worldToScreen(b.x,b.y-b.H),bot=camera.worldToScreen(b.x+b.w,b.y+b.h);
    if(bot.x<-40||bot.y<-40||top.x>viewport.width+40||top.y>viewport.height+40)continue;
    // translúcido só quando o jogador está atrás (dentro da área coberta pelo prédio, acima da base)
    let target=1;
    if(player&&player.x>b.x-14&&player.x<b.x+b.w+14&&player.y<b.y+b.h-2&&player.y>b.y-b.H-34)target=.32;
    b.alpha+=(target-b.alpha)*Math.min(1,(dt||.016)*9);
    out.push({y:b.y+b.h,__tall:b,draw(ctx){pzDrawTall(ctx,b);}});
  }
  return out;
}
function pzDrawTall(ctx,b){
  const c=pzTallCache(b);ctx.save();if(b.alpha<.995)ctx.globalAlpha=b.alpha;
  ctx.imageSmoothingEnabled=b.res<1;
  ctx.drawImage(c.canvas,b.x-c.pad,b.y-b.H-c.pad,b.w+c.pad*2,b.h+b.H+c.pad*2);
  ctx.restore();
}
