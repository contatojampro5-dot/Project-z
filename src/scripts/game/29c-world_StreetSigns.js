// -- src/world/StreetSigns.js --
// ATLAS A9 · Deméter + Hefesto — os nomes das ruas saíram do chão e foram para placas em poste, como em São Paulo:
// placa azul com borda branca, o nome da via em destaque e, em cima, a faixa com o bairro e o CEP.
// Nas esquinas fica um poste com as duas placas (uma para cada rua do cruzamento). As placas de sentido
// (antes deitadas no asfalto) viraram placas indicativas em dois postes, na calçada.
// São desenhadas junto com os personagens, ordenadas pela base: quem passa atrás fica atrás do poste.
const PZ_SIGNS={list:[],seen:new Set()};

// Nomes por trecho de via (as quatro avenidas do mapa).
const PZ_STREET_NAMES=Object.freeze({
  h1:['R. DA MOOCA','R. HERMILO ALVES','R. BETÂNIA'],
  h2:['R. AZEVEDO JÚNIOR','R. J. A. LOGAREIRO','R. MILÃO'],
  v1:['AV. RANGEL PESTANA','R. VANDENKOOLK','R. CAETANO PINTO'],
  v2:['R. SÃO PAULO','AV. DO ESTADO','R. DO GASÔMETRO'],
});
function pzBairro(x,y){return x<1152&&y<1152?'BRÁS':x>=1152&&y<1152?'BELÉM':x<1152?'MOOCA':'PARI';}
function pzCep(x,y){const n=3000+Math.abs(Math.round(x*3+y*7))%900;return '0'+n+'-'+String(Math.abs(Math.round(x+y))%900+100);}
function pzSignBlocked(x,y){
  if(typeof OBSTACLES==='undefined')return false;
  return OBSTACLES.some(o=>x>o.x-6&&x<o.x+o.w+6&&y>o.y-4&&y<o.y+o.h+10);
}
function pzAddSign(s){
  const key=`${s.type}:${Math.round(s.x/8)}:${Math.round(s.y/8)}`;if(PZ_SIGNS.seen.has(key))return;
  if(pzSignBlocked(s.x,s.y))return;
  PZ_SIGNS.seen.add(key);PZ_SIGNS.list.push(s);
}
// Placas de esquina nos quatro cruzamentos.
function pzSeedStreetSigns(){
  if(PZ_SIGNS.seeded)return;PZ_SIGNS.seeded=true;
  const H=[{y0:401,y1:754,n:PZ_STREET_NAMES.h1},{y0:1777,y1:2053,n:PZ_STREET_NAMES.h2}];
  const V=[{x0:398,x1:748,n:PZ_STREET_NAMES.v1},{x0:1847,x1:2055,n:PZ_STREET_NAMES.v2}];
  for(let vi=0;vi<2;vi++)for(let hi=0;hi<2;hi++){
    const v=V[vi],h=H[hi];
    const hW=h.n[vi],hE=h.n[vi+1],vN=v.n[hi],vS=v.n[hi+1];
    const corners=[[v.x0-16,h.y0-14,hW,vN],[v.x1+16,h.y1+22,hE,vS],[v.x1+16,h.y0-14,hE,vN],[v.x0-16,h.y1+22,hW,vS]];
    for(const [x,y,a,b] of corners.slice(0,(vi+hi)%2?4:3))pzAddSign({type:'street',x,y,plates:[a,b],bairro:pzBairro(x,y),cep:pzCep(x,y)});
  }
}
// Mesma assinatura da placa antiga: agora vira placa indicativa em pé, fora do asfalto.
paulistaSign=function(ctx,x,y,main,sub='',angle=0){
  let px=x+(Math.abs(angle)>.1?14:48),py=y+(Math.abs(angle)>.1?40:16);
  for(const r of PZ_ROADS){
    if(px>r.x-10&&px<r.x+r.w+10&&py>r.y-10&&py<r.y+r.h+10){
      if(r.v){px=px<r.x+r.w/2?r.x-22:r.x+r.w+22;}else{py=py<r.y+r.h/2?r.y-16:r.y+r.h+28;}
    }
  }
  pzAddSign({type:'dir',x:px,y:py,main,sub});
};

function pzFitText(c,text,maxW,size,weight='bold'){
  let s=size;c.font=`${weight} ${s}px "Arial Narrow",Arial,sans-serif`;
  while(c.measureText(text).width>maxW&&s>4){s-=.5;c.font=`${weight} ${s}px "Arial Narrow",Arial,sans-serif`;}
}
// Placa azul paulistana (em coordenadas locais, canto superior esquerdo em 0,0).
function pzPlate(c,w,h,name,top){
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(1.5,1.5,w,h);
  c.fillStyle='#e9edf2';c.fillRect(0,0,w,h);
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2d63a8');g.addColorStop(1,'#1d4a85');
  c.fillStyle=g;c.fillRect(.8,.8,w-1.6,h-1.6);
  c.fillStyle='rgba(255,255,255,.85)';c.fillRect(.8,4.2,w-1.6,.4);
  c.fillStyle='#e9edf2';c.textBaseline='middle';
  pzFitText(c,top,w-4,2.6);c.textAlign='center';c.fillText(top,w/2,2.6);
  pzFitText(c,name,w-4,5.6);c.fillText(name,w/2,4.6+(h-4.6)/2+.2);
  // desgaste: sujeira e um amassado
  c.fillStyle='rgba(20,16,12,.18)';c.fillRect(w*.62,h*.55,w*.3,h*.35);
  c.fillStyle='rgba(255,255,255,.12)';c.fillRect(1,1,w-2,.6);
  c.textAlign='start';c.textBaseline='alphabetic';
}
function pzPole(c,x,top,bottom){
  c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x+1,bottom-1,8,2.2);
  c.fillStyle='#5b5f64';c.fillRect(x-1,top,2.2,bottom-top);
  c.fillStyle='#a3a8ad';c.fillRect(x-1,top,.8,bottom-top);
  c.fillStyle='#2e3236';c.fillRect(x+.8,top,.4,bottom-top);
  c.fillStyle='#3a3c3f';c.fillRect(x-2,bottom-2,4.2,2);
}
// Pré-desenho em alta resolução (o texto fica nítido com o zoom do jogo).
function pzSignCanvas(s){
  if(s.cv)return s.cv;
  const RES=3,W=s.type==='dir'?84:56,Hh=s.type==='dir'?52:56;const c=document.createElement('canvas');c.width=W*RES;c.height=Hh*RES;
  const x=c.getContext('2d');x.scale(RES,RES);
  const ax=W/2,base=Hh-3;
  if(s.type==='street'){
    pzPole(x,ax,4,base);
    // abraçadeiras e as duas placas, a segunda um pouco mais baixa e deslocada (fica na outra face do poste)
    x.fillStyle='#2b2d30';x.fillRect(ax-2,9,4.6,1.6);x.fillRect(ax-2,23,4.6,1.6);
    x.save();x.translate(ax-24,4);pzPlate(x,46,13,s.plates[0],`${s.bairro} · CEP ${s.cep}`);x.restore();
    x.save();x.translate(ax-21,18.5);pzPlate(x,42,13,s.plates[1],`${s.bairro} · CEP ${s.cep}`);x.restore();
    x.fillStyle='rgba(0,0,0,.25)';x.fillRect(ax-1,17,2.2,1.5);
  }else{
    const pw=72,ph=22,px=(W-pw)/2;
    pzPole(x,px+10,10,base);pzPole(x,px+pw-10,10,base);
    x.save();x.translate(px,4);
    x.fillStyle='rgba(0,0,0,.35)';x.fillRect(2,2,pw,ph);
    x.fillStyle='#e9edf2';x.fillRect(0,0,pw,ph);
    const g=x.createLinearGradient(0,0,0,ph);g.addColorStop(0,'#2d63a8');g.addColorStop(1,'#1b4580');x.fillStyle=g;x.fillRect(1,1,pw-2,ph-2);
    // seta
    x.fillStyle='#e9edf2';x.beginPath();x.moveTo(pw-5,ph/2);x.lineTo(pw-11,ph/2-5);x.lineTo(pw-11,ph/2-2);x.lineTo(pw-17,ph/2-2);x.lineTo(pw-17,ph/2+2);x.lineTo(pw-11,ph/2+2);x.lineTo(pw-11,ph/2+5);x.closePath();x.fill();
    x.textBaseline='middle';pzFitText(x,s.main,pw-24,6.4);x.fillText(s.main,4,ph*.36);
    if(s.sub){x.fillStyle='#c9d6e6';pzFitText(x,s.sub,pw-24,4.6);x.fillText(s.sub,4,ph*.74);}
    x.fillStyle='rgba(20,16,12,.2)';x.fillRect(pw*.15,ph*.6,pw*.3,ph*.3);
    // adesivo/pichação por cima, comum nas placas da cidade
    if((s.x+s.y)%3<1){x.fillStyle='rgba(200,40,50,.55)';x.fillRect(pw*.55,ph*.62,10,5);}
    x.restore();
  }
  s.cv={canvas:c,W,H:Hh,ax,base};return s.cv;
}
function pzSignDrawables(camera,viewport){
  pzSeedStreetSigns();
  const out=[];const vw=camera.viewport.width/camera.zoom/2+60,vh=camera.viewport.height/camera.zoom/2+80;
  for(const s of PZ_SIGNS.list){
    if(Math.abs(s.x-camera.x)>vw||Math.abs(s.y-camera.y)>vh)continue;
    out.push({y:s.y,__tall:1,draw(ctx){const v=pzSignCanvas(s);ctx.drawImage(v.canvas,s.x-v.ax,s.y-v.base,v.W,v.H);}});
  }
  return out;
}
// À noite as placas são refletivas: brilham quando a lanterna ou um farol bate nelas.
function pzSignsGlint(ctx,p,flashOn,cars){
  if(flashOn<.05&&!(cars&&cars.length))return;
  const fl=PZ_LIGHT_CFG.flashlight;
  for(const s of PZ_SIGNS.list){
    const v=s.cv;if(!v)continue;
    const cx=s.x,cy=s.y-36;let k=0;
    if(flashOn>.05){const dx=cx-p.x,dy=cy-p.y,d=Math.hypot(dx,dy);if(d>8&&d<fl.range*1.1&&(dx*Math.cos(p.facing||0)+dy*Math.sin(p.facing||0))/d>fl.cos-.05)k=Math.max(k,(1-d/(fl.range*1.1))*flashOn);}
    for(const c of cars||[]){const dx=cx-c.x,dy=cy-c.y,d=Math.hypot(dx,dy);if(d<230&&d>4&&(dx*Math.cos(c.face)+dy*Math.sin(c.face))/d>.9)k=Math.max(k,(1-d/230)*c.k);}
    if(k<.03)continue;
    ctx.globalAlpha=Math.min(.9,k*1.1);ctx.drawImage(v.canvas,s.x-v.ax,s.y-v.base,v.W,v.H);ctx.globalAlpha=1;
  }
}
