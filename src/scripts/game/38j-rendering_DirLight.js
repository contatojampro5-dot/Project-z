// -- src/rendering/DirLight.js --
// R34 · Hélio + Apolo — luz com direção e distância nos objetos (não só no chão).
// O mapa de luz (38f) clareia uma área inteira por igual. Agora cada personagem, zumbi, carro e prédio
// recebe a luz só do lado virado para ela:
//  • fogueiras, carros pegando fogo, explosões, clarão do tiro, faróis, lanterna, postes (à noite) e o sol
//    da praia (de dia, fora da sombra dos prédios);
//  • quanto mais perto, mais forte; longe, não pega; em cima do fogo, a pessoa fica toda tingida da cor dele;
//  • o lado contrário à luz forte fica mais escuro (volume).
// Desligar para comparar: window.__PZ_NO_DIRLIGHT=true.
const PZ_DL={lights:[],sun:null,scratch:null,sctx:null,frame:0,quality:'medium'};
const PZ_DL_SUN=[255,206,140];

function pzDLOn(){return !window.__PZ_NO_DIRLIGHT;}
// Junta as luzes do quadro (uma vez por quadro).
function pzDLCollect(run,world,camera){
  const L=PZ_DL.lights;L.length=0;PZ_DL.frame++;
  const env=run.q04Environment||Q04_ENVIRONMENT.get(run.elapsed||0,true),dark=env.dark||0;
  PZ_DL.quality=typeof PZ_LIGHTMAP!=='undefined'?PZ_LIGHTMAP.quality():'medium';
  const t=performance.now()/1000;
  const vw=camera.viewport.width/camera.zoom/2+300,vh=camera.viewport.height/camera.zoom/2+300;
  const near=(x,y)=>Math.abs(x-camera.x)<vw&&Math.abs(y-camera.y)<vh;
  const add=(x,y,R,I,rgb,extra)=>{if(I>.01&&near(x,y))L.push(Object.assign({x,y,R,I,rgb},extra||null));};
  const fire=typeof PZ_LUX!=='undefined'?PZ_LUX.fire:[255,118,42];
  // fogo do mapa e de fora do muro
  for(const f of world.fireLights||[]){const fl=.85+Math.sin(t*13+f.x)*.09+Math.sin(t*23+f.y)*.06;add(f.x,f.y,(f.radius||90)*2.4,1.05*fl,fire,{fire:1});}
  for(const f of world.border?.fires||[]){if(f.x==null)continue;const fl=.85+Math.sin(t*11+(f.p||0))*.12;add(f.x,f.y,190*(f.s||1),.9*fl,fire,{fire:1});}
  // carros pegando fogo
  const D=run.destructibles;
  for(const s of D?.initialBurningCars||[]){if(s.vehicle?.exploded)continue;const fl=.85+Math.sin(t*12+s.x)*.1;add(s.x,s.y,240,1.1*fl,fire,{fire:1});}
  for(const o of D?.objects||[])if(o.kind==='vehicle'&&o.exploded&&o.burnTime>0){const x=o.rect.x+o.rect.w/2,y=o.rect.y+o.rect.h/2,fl=.85+Math.sin(t*14+x)*.12;add(x,y,260,Math.min(1.2,o.burnTime/2)*fl,fire,{fire:1});}
  // explosões (barris, granadas, ondas de choque)
  const muzzle=typeof PZ_LUX!=='undefined'?PZ_LUX.muzzle:[255,196,120];
  for(const b of run.barrels?.blasts||[])add(b.x,b.y,380,Math.min(1.6,b.life*3),fire,{fire:1});
  for(const b of run.grenades?.blasts||[])add(b.x,b.y,340,Math.min(1.5,b.life*3),muzzle,{fire:1});
  for(const q of run.worldFX?.shock||[])add(q.x,q.y,q.r*2.2,Math.min(1,q.life/q.total*1.4),muzzle);
  // clarão do tiro
  for(const f of run.gun?.flashes||[]){const k=Math.max(0,f.life/f.maxLife);add(f.x,f.y,150,.95*k,muzzle,PZ_DL.quality==='high'?null:{only:run.player});} // médio/baixo: o clarão só pinta quem atira (economia)
  // faróis e lanterna (cones), quadro anterior do mapa de luz
  if(typeof PZ_LIGHTMAP!=='undefined'){
    for(const c of PZ_LIGHTMAP.cars||[])add(c.x,c.y,280,.95*c.k,c.warm?PZ_LUX.halogen:PZ_LUX.xenon,{face:c.face,cos:.88});
    const p=run.player,fo=PZ_LIGHTMAP.flashOn||0;
    if(p&&fo>.02)add(p.x,p.y,PZ_LIGHT_CFG.flashlight.range,.85*fo,PZ_LUX.flash,{face:p.facing||0,cos:PZ_LIGHT_CFG.flashlight.cos,owner:p});
    // postes: vêm de cima, iluminam pouco (só à noite)
    const s=smoothstep(.05,.7,dark);
    if(s>.02)for(const {l,k} of PZ_LIGHTMAP.vis||[]){if(l.type!=='lamp')continue;add(l.x,l.y,l.R*.85,.42*k*s,l.rgb,{soft:1});}
  }
  // sol da praia (leste), só de dia
  const day=typeof pzSunDay==='function'?pzSunDay(env):0;
  PZ_DL.sun=day>.03?{dx:-PZ_SUN.dir[0],dy:-PZ_SUN.dir[1],I:.2*day,rgb:PZ_DL_SUN}:null;
}
// O ponto está na sombra de algum prédio (sol do leste, sombra para o oeste)?
function pzDLInShade(x,y){
  for(const b of PZ_TALL.list){
    const Ls=b.H*.55*1.9;
    if(x<b.x+b.w&&x>b.x-.976*Ls&&y>b.y-4&&y<b.y+b.h+.215*Ls)return true;
  }
  return false;
}
// Soma das luzes num ponto: cor média, direção dominante (de onde vem), intensidade e "em cima".
function pzDLAt(x,y,self,noSun){
  let I=0,r=0,g=0,b=0,dx=0,dy=0,full=0;
  for(const l of PZ_DL.lights){
    if(l.owner&&l.owner===self)continue;
    if(l.only&&l.only!==self)continue;
    const vx=l.x-x,vy=l.y-y,d=Math.hypot(vx,vy);if(d>=l.R)continue;
    let f=1-d/l.R;f=f*f*l.I;
    if(l.cos!=null){ // cone: o alvo precisa estar na frente da luz
      if(d<4)continue;const c=(-vx*Math.cos(l.face)-vy*Math.sin(l.face))/d;if(c<l.cos)continue;f*=Math.min(1,(c-l.cos)/(1-l.cos)*3);}
    if(l.soft)f*=.7;
    if(f<.004)continue;
    I+=f;r+=l.rgb[0]*f;g+=l.rgb[1]*f;b+=l.rgb[2]*f;
    if(d>.5){dx+=vx/d*f;dy+=vy/d*f;}
    if(l.fire)full=Math.max(full,Math.min(1,1-(d-14)/46)*Math.min(1,l.I));
  }
  const S=PZ_DL.sun;
  if(S&&!noSun&&!pzDLInShade(x,y)){const f=S.I;I+=f;r+=S.rgb[0]*f;g+=S.rgb[1]*f;b+=S.rgb[2]*f;dx+=S.dx*f;dy+=S.dy*f;}
  if(I<.02)return null;
  const n=Math.hypot(dx,dy);
  return{I:Math.min(1.15,I),rgb:[r/I|0,g/I|0,b/I|0],dx:n>1e-4?dx/n:0,dy:n>1e-4?dy/n:-1,dir:Math.min(1,n/I),full:Math.max(0,full)};
}
function pzDLScratch(w,h){
  let c=PZ_DL.scratch;
  if(!c){c=PZ_DL.scratch=document.createElement('canvas');PZ_DL.sctx=c.getContext('2d');}
  if(c.width<w||c.height<h){c.width=Math.max(c.width,w);c.height=Math.max(c.height,h);}
  return PZ_DL.sctx;
}
// Repinta o desenho num rascunho e aplica a luz só no lado virado para ela.
// paint(c) desenha o objeto em coordenadas do mundo; box = área do mundo que contém o desenho; cx,cy,rad = volume.
function pzDLApply(ctx,paint,box,cx,cy,rad,L){
  const T=ctx.getTransform(),sx=Math.hypot(T.a,T.b),sy=Math.hypot(T.c,T.d);
  // canto da caixa no dispositivo (sem rotação: a câmera não gira)
  const X0=Math.floor(T.a*box.x+T.c*box.y+T.e),Y0=Math.floor(T.b*box.x+T.d*box.y+T.f);
  const X1=Math.ceil(T.a*(box.x+box.w)+T.c*(box.y+box.h)+T.e),Y1=Math.ceil(T.b*(box.x+box.w)+T.d*(box.y+box.h)+T.f);
  const W=X1-X0,H=Y1-Y0;if(W<2||H<2||W>900||H>900||!sx||!sy)return;
  const passes=[];
  // 1) lado de trás mais escuro (só a sombra, recortada no desenho); 2) luz somada no lado virado para ela
  if(L.I*L.dir>.28&&PZ_DL.quality==='high'&&L.full<.8){const sh=Math.min(.42,(L.I*L.dir-.28)*.7);passes.push({op:'source-over',mask:'source-in',stops:[[0,'rgba(0,0,0,0)'],[.5,'rgba(0,0,0,0)'],[1,`rgba(0,0,0,${sh.toFixed(3)})`]]});}
  const a=Math.min(.9,L.I*.7),far=a*Math.max(1-L.dir,L.full);
  passes.push({op:'lighter',mask:'source-in',stops:[[0,`rgba(${L.rgb.join(',')},${a.toFixed(3)})`],[1,`rgba(${L.rgb.join(',')},${far.toFixed(3)})`]]});
  // a luz é suave: o rascunho trabalha em meia resolução (4× menos pixels) e é ampliado ao somar
  const q=PZ_DL.quality==='high'?1:.5,w=Math.ceil(W*q),h=Math.ceil(H*q);
  const c=pzDLScratch(w,h);
  for(const p of passes){
    c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.globalAlpha=1;c.clearRect(0,0,w+2,h+2);
    c.setTransform(T.a*q,T.b*q,T.c*q,T.d*q,(T.e-X0)*q,(T.f-Y0)*q);
    c.save();paint(c);c.restore();
    c.globalCompositeOperation=p.mask;
    const g=c.createLinearGradient(cx+L.dx*rad,cy+L.dy*rad,cx-L.dx*rad,cy-L.dy*rad);
    for(const [o,col] of p.stops)g.addColorStop(o,col);
    c.fillStyle=g;c.fillRect(box.x,box.y,box.w,box.h);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation=p.op;ctx.globalAlpha=1;
    ctx.imageSmoothingEnabled=true;ctx.drawImage(PZ_DL.scratch,0,0,w,h,X0,Y0,W,H);ctx.restore();
  }
}
// Personagens e zumbis (chamado logo depois de desenhar cada um).
function pzDLEntity(ctx,entity,paint){
  if(!pzDLOn()||!PZ_DL.lights.length&&!(PZ_DL.sun&&entity.__isPlayer))return;
  if(entity.flinch>0&&!entity.__isPlayer)return; // piscando de dano (filtro caro): pula este quadro
  const L=pzDLAt(entity.x,entity.y,entity,!entity.__isPlayer&&PZ_DL.quality!=='high');if(!L)return;
  const R=(entity.radius||12)*(typeof Boss!=="undefined"&&entity instanceof Boss?2.6:2.4);
  pzDLApply(ctx,paint,{x:entity.x-R*2.2,y:entity.y-R*3.2,w:R*4.4,h:R*4.6},entity.x,entity.y-R*.4,R*1.15,L);
}
// Carros e caixas com volume (38i): luz no teto e no lado virado para a luz.
function pzDLProp(ctx,T3){
  if(!pzDLOn()||!PZ_DL.lights.length)return;
  // a máscara de luz fica no espaço da textura do objeto (não depende da câmera) e é refeita a cada 6 quadros
  const f=PZ_DL.frame;let M=T3.__lit;
  if(!M||f-M.f>=6||f<M.f){
    const L=pzDLAt(T3.cx,T3.cy,null,true);
    if(!L||L.I<.06){T3.__lit={f,none:1};return;}
    const S=T3.S,px=Math.ceil(S);
    const c=M&&M.c?M.c:document.createElement('canvas');if(c.width!==px){c.width=c.height=px;}
    const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.clearRect(0,0,px,px);
    x.drawImage(T3.top,0,0,px,px);x.globalCompositeOperation='source-in';
    const a=Math.min(.85,L.I*.66),far=a*Math.max(1-L.dir,L.full),r=S*.32,cx=px/2,cy=px/2;
    const g=x.createLinearGradient(cx+L.dx*r,cy+L.dy*r,cx-L.dx*r,cy-L.dy*r);
    g.addColorStop(0,`rgba(${L.rgb.join(',')},${a.toFixed(3)})`);g.addColorStop(1,`rgba(${L.rgb.join(',')},${far.toFixed(3)})`);
    x.fillStyle=g;x.fillRect(0,0,px,px);
    M=T3.__lit={f,c};
  }
  if(M.none)return;
  const S=T3.S;ctx.save();ctx.globalCompositeOperation='lighter';ctx.drawImage(M.c,T3.cx-S/2,T3.cy-S/2,S,S);ctx.restore();
}
// Prédios: só as faces viradas para a luz recebem brilho, mais forte perto da luz (some com a distância).
function pzDLBuilding(ctx,b){
  if(!pzDLOn()||!PZ_DL.lights.length)return;
  const x0=b.x,x1=b.x+b.w,y0=b.y,y1=b.y+b.h,H=b.H;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const l of PZ_DL.lights){
    if(l.soft||l.owner||l.only)continue;
    if(l.x<x0-l.R||l.x>x1+l.R||l.y<y0-l.R||l.y>y1+l.R)continue;
    const faces=[];
    if(PZ_3D.vy>y1&&l.y>y1)faces.push([x0,y1,x1,y1,l.y-y1]);
    if(PZ_3D.vx>x1&&l.x>x1)faces.push([x1,y0,x1,y1,l.x-x1]);
    if(PZ_3D.vx<x0&&l.x<x0)faces.push([x0,y0,x0,y1,x0-l.x]);
    for(const [ax,ay,bx,by,dist] of faces){
      if(dist>l.R)continue;
      if(l.cos!=null){const mx=(ax+bx)/2-l.x,my=(ay+by)/2-l.y,d=Math.hypot(mx,my)||1;if((mx*Math.cos(l.face)+my*Math.sin(l.face))/d<l.cos-.15)continue;}
      const a=Math.min(.75,l.I*.62);
      const g=ctx.createRadialGradient(l.x,l.y,0,l.x,l.y,l.R);
      g.addColorStop(0,`rgba(${l.rgb.join(',')},${a.toFixed(3)})`);g.addColorStop(.45,`rgba(${l.rgb.join(',')},${(a*.35).toFixed(3)})`);g.addColorStop(1,`rgba(${l.rgb.join(',')},0)`);
      pz3dQuad(ctx,ax,ay,bx,by,H,g);
    }
  }
  ctx.restore();
}
