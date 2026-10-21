// ======================================================================
// SOBREVIVENTES · Olimpo (Afrodite + Ares + Hefesto)
// Antônio, Hadassa, San e Hanna no mesmo motor dos infectados, versão estilizada:
// pele viva, roupas de cada arte, cabelo, acessórios e as 6 armas do jogo nas mãos.
// A arma é um objeto próprio: quando o personagem mira, ela fica presa ao peito e os braços
// alcançam o cabo e o guarda-mão por cinemática inversa (as mãos realmente seguram a arma).
// ======================================================================
const ALIVE_DIRT=[74,60,44];
function aliveSkin(v,q){SK=1;
  const n=fbm(q[0]*.3+1,q[1]*.3,q[2]*.3);let c=mix3(v.skinC,scl(v.skinC,.86),sstep(.4,.8,n)*.6);
  const g=fbm(q[0]*.55,q[1]*.55+20,q[2]*.55);c=mix3(c,ALIVE_DIRT,sstep(.6,.85,g)*.3);
  if(v.tattoo){const t=Math.abs(vn(q[0]*.7,q[1]*.7,q[2]*.7+50)-.5);if(t<.05)c=scl(c,.55);}
  return c;
}
function aliveCloth(base,shade,q,dirt,v){SK=0;
  const n=fbm(q[0]*.35,q[1]*.35+40,q[2]*.35);let c=mix3(base,shade,sstep(.35,.75,n)*.8);
  c=scl(c,1-(Math.sin(q[2]*3.1+q[0]*.4)*.5+.5)*.05);
  const d=fbm(q[0]*.25+7,q[1]*.25,q[2]*.25);c=mix3(c,ALIVE_DIRT,clamp(sstep(.62,.88,d)*.25+(dirt||0),0,.6));
  const bl=(v&&v.blood)||0;if(bl&&vn(q[0]*1.1+3,q[1]*1.1,q[2]*1.1)>.9-bl*.06)c=mix3(c,[92,22,20],.35+bl*.15);
  return c;
}
const H3=h=>hex(h);
// ---------- materiais do corpo ----------
function topAt(v,q,ph,z){// tronco: camisa/jaqueta/camiseta de time/moletom
  const T=v.top,fr=Math.sin(ph),side=Math.cos(ph);let c=aliveCloth(T.cC,T.sC,q,0,v);
  if(T.kind==='shirt'){
    const px=side+.38,pz=z-.7;if(fr>.35&&Math.abs(px)<.16&&pz>-.1&&pz<.07){c=scl(c,.9);if(Math.abs(px)>.13||pz<-.085||Math.abs(pz-.04)<.012)c=scl(c,.72);}
    if(fr>.88&&Math.abs(side)<.05&&z>.14&&z<.9){c=scl(c,.84);if(((z*13)|0)%3===0&&Math.abs(side)<.025)c=mix3(c,[226,220,206],.6);}
    if(z>.86&&fr>.6&&Math.abs(side)<.22+(z-.86)*2)c=aliveSkin(v,q);
    if(z>.9)c=scl(c,.86);
  }else if(T.kind==='jacket'){// jaqueta aberta sobre a regata escura, alças do arnês
    const open=T.open+(z-.5)*.06;
    if(fr>.4&&Math.abs(side)<open){c=aliveCloth(T.iC,scl(T.iC,.7),q,0,v);if(z>.84&&Math.abs(side)<open*.85)c=aliveSkin(v,q);}
    else if(fr>.4&&Math.abs(Math.abs(side)-open)<.035)c=scl(c,.72);// borda da jaqueta
    if(T.harness){const strap=Math.abs(Math.abs(side)-(.3+(.8-z)*.12))<.035&&z>.25;if(strap)c=[40,34,28];if(Math.abs(z-.36)<.02&&fr>0)c=[44,36,30];}
    if(z>.9)c=scl(c,.8);
  }else if(T.kind==='jersey'){// camiseta de futebol americano com o número
    const num=T.number||'13';
    const drawNum=(u,w)=>{const W1=.055,y0=.3,y1=.7,inY=w>y0&&w<y1;
      const one=Math.abs(u+.26)<W1&&inY;
      const x0=-.06,x1=.3,bar=(yy)=>Math.abs(w-yy)<.05&&u>x0&&u<x1;const right=Math.abs(u-x1+.04)<W1&&inY;
      return one||right||bar(y1-.03)||bar((y0+y1)/2)||bar(y0+.03);};
    const u=fr>0?side:-side;
    if(Math.abs(fr)>.35&&drawNum(u,z))c=mix3(c,T.nC,.88);
    if(Math.abs(z-.86)<.025||Math.abs(z-.14)<.02)c=mix3(c,T.nC,.0),c=scl(c,1.25);
    if(z>.88)c=scl(c,.8);
    if(z>.92&&fr>.5&&Math.abs(side)<.2)c=aliveSkin(v,q);
  }else if(T.kind==='hoodie'){// moletom com capuz, bolso canguru e cordões
    if(fr>.55&&z>.12&&z<.36&&Math.abs(side)<.36){c=scl(c,.88);if(Math.abs(Math.abs(side)-.34)<.03||Math.abs(z-.36)<.02)c=scl(c,.75);}
    if(fr>.75&&z>.66&&z<.86&&Math.abs(Math.abs(side)-.09)<.018)c=[180,172,160];
    if(z<.1)c=mix3(c,T.iC,.8);// barra da camiseta clara aparecendo
    if(z>.92&&fr>.6&&Math.abs(side)<.2)c=aliveSkin(v,q);
  }
  if(z<.13&&v.pantsC&&T.kind!=='hoodie'){c=aliveCloth(v.pantsC,v.pants2C,q,.04,v);}
  if(v.belt&&z<.13&&z>.07){c=mix3(v.beltC,scl(v.beltC,.6),vn(q[0]*2,q[1]*2,q[2]*2));if(fr>.9&&Math.abs(side)<.1)c=[170,160,140];}
  return c;
}
function aliveMat(v,key,s){
  const q=s.q;let c;
  if(key==='torso')return[...topAt(v,q,s.phi,s.zs),0,0];
  if(key==='uarmL'||key==='uarmR'){const edge=v.sleeves+(vn(q[0]*.8,q[1]*.8,q[2]*.8)-.5)*.08;
    if(s.t<edge||v.sleeves>=1){c=aliveCloth(v.top.cC,v.top.sC,q,.02,v);
      if(v.top.kind==='jersey'&&Math.abs(s.t-edge+.08)<.05)c=mix3(c,v.top.nC,.8);// listras da manga
      else if(v.sleeves<1&&Math.abs(s.t-edge)<.16)c=scl(c,.78+.12*Math.sin(s.t*60));}
    else{c=aliveSkin(v,q);}
    return[...c,0,0];}
  if(key==='farmL'||key==='farmR'){
    if(v.farmSleeve&&s.t<v.farmSleeve){c=aliveCloth(v.top.cC,v.top.sC,q,.02,v);if(s.t>v.farmSleeve-.12)c=scl(c,.78+.12*Math.sin(s.t*70));return[...c,0,0];}
    c=aliveSkin(v,q);
    if(v.wraps&&s.t>.72){c=mix3([226,220,206],[180,172,160],vn(q[0]*3,q[1]*3,q[2]*3));if(Math.abs(Math.sin(s.t*60+s.th))<.15)c=scl(c,.85);}
    else if(v.gloves&&s.t>.86)c=v.glovesC.slice();
    else if(Math.cos(s.th)>.2&&vn(q[0]*7,q[1]*7,q[2]*7)>.68&&v.sex!=='f')c=scl(c,.84);
    return[...c,0,0];}
  if(key==='handL'||key==='handR'){const e=s.e;
    if(v.wraps){c=mix3([226,220,206],[176,168,156],vn(q[0]*3,q[1]*3,q[2]*3));if(Math.abs(Math.sin(e[2]*9+e[0]*3))<.2)c=scl(c,.86);if(vn(q[0]*2,q[1]*2,q[2]*2)>.72)c=mix3(c,[110,28,24],.5);return[...c,0,0];}
    if(v.gloves){c=mix3(v.glovesC,scl(v.glovesC,.7),vn(q[0]*3,q[1]*3,q[2]*3));return[...c,.15,0];}
    c=aliveSkin(v,q);if(e[1]<0)c=mix3(c,scl(v.skinC,1.15),.25);return[...c,0,0];}
  if(key.startsWith('px')||key.startsWith('pt')){const j=+key[key.length-1];
    if(v.gloves&&j===0){c=v.glovesC.slice();return[...c,.15,0];}
    if(v.wraps&&j===0){c=[214,206,192];return[...c,0,0];}
    c=aliveSkin(v,q);const dors=Math.cos(s.th);
    if(j===2&&dors>.35&&s.t>.2){c=mix3(v.sex==='f'?[214,170,160]:[206,168,150],[150,110,96],vn(q[0]*4,q[1]*4,q[2]*4)*.4);return[...c,.25,0];}
    return[...c,0,0];}
  if(key==='thighL'||key==='thighR'||key==='shinL'||key==='shinR'){
    const shin=key.startsWith('shin'),R=key.endsWith('R');const P=v.pantsSpec;
    if(v.boots&&shin&&s.t>v.boots.top){c=mix3(v.bootsC,scl(v.bootsC,.65),vn(q[0]*.8,q[1]*.8,q[2]*.8));if(Math.abs(Math.sin(s.t*40))<.12&&Math.sin(s.th)>.3)c=[200,190,170];// cadarço
      c=mix3(c,ALIVE_DIRT,sstep(.5,.85,fbm(q[0]*.5,q[1]*.5,q[2]*.5))*.45);return[...c,.12,0];}
    c=aliveCloth(v.pantsC,v.pants2C,q,shin?sstep(.4,1,s.t)*.3:0,v);
    const fold=Math.sin(q[2]*(P.kind==='sweat'?.9:1.25)+vn(q[0]*.6,q[1]*.6,q[2]*.3)*5);c=scl(c,1-sstep(.55,1,fold)*(P.kind==='sweat'?.22:.15)+sstep(.7,1,-fold)*.05);
    const out=(R?1:-1)*Math.cos(s.th);
    if(P.cargo&&!shin&&out>.55&&s.t>.42&&s.t<.8){c=scl(c,.92);if(s.t<.5||out<.62||Math.abs(s.t-.8)<.03)c=scl(c,.75);}
    if(P.kind==='sweat'){if(shin&&s.t>.84)c=scl(c,.8);if(!shin&&s.t<.08&&Math.sin(s.th)>.7)c=scl(c,.85);}
    if(P.kind==='jeans'){if(Math.abs(Math.cos(s.th))>.92)c=scl(c,.82);// costura lateral
      const rip=(!shin&&s.t>.55&&s.t<.75)||(shin&&s.t<.12)||(!shin&&s.t>.88);if(rip&&Math.sin(s.th)>.35&&vn(q[0]*1.5,q[1]*1.5,q[2]*1.5+(R?3:0))>.52){c=aliveSkin(v,q);if(vn(q[0]*6,q[1]*6,q[2]*6)>.55)c=[180,170,150];}}
    if(!shin&&s.t>.84&&Math.sin(s.th)>.3&&!v.kneepads)c=mix3(c,[110,100,80],.2);
    return[...c,0,0];}
  if(key==='footL'||key==='footR'){const e=s.e;
    if(v.boots){c=mix3(v.bootsC,scl(v.bootsC,.6),vn(q[0]*.6,q[1]*.6,q[2]*.6));if(e[2]<-.45)c=[34,28,24];if(e[2]>.4&&Math.abs(e[0])<.35&&((e[1]*12|0)%2))c=[190,180,160];
      c=mix3(c,ALIVE_DIRT,sstep(.5,.85,fbm(q[0]*.5,q[1]*.5,q[2]*.5))*.5);return[...c,.15,0];}
    c=mix3(v.shoesC,scl(v.shoesC,.75),vn(q[0]*.6,q[1]*.6,q[2]*.6));
    if(e[2]<-.45)c=v.soleC.slice();
    if(v.shoeStripe&&Math.abs(e[2]+.1)<.12&&e[1]>-.5&&e[1]<.5)c=v.shoeStripe.slice();
    if(e[1]>.55&&e[2]>-.1)c=scl(c,1.1);
    if(e[2]>.5&&Math.abs(e[0])<.35&&e[1]>-.2&&((e[1]*12|0)%2))c=[214,206,190];
    c=mix3(c,ALIVE_DIRT,sstep(.5,.85,fbm(q[0]*.5,q[1]*.5,q[2]*.5))*.45);
    return[...c,.08,0];}
  if(key==='neck'){c=aliveSkin(v,q);if(v.beard==='full'&&Math.sin(s.th)>-.1&&s.t<.75&&vn(q[0]*9,q[1]*9,q[2]*9)>.55)c=mix3(c,v.hairC,.55);
    if(v.top.kind==='hoodie'&&s.t<.4)c=aliveCloth(v.top.cC,v.top.sC,q,0,v);return[...c,0,0];}
  if(key==='earL'||key==='earR'){const e=s.e;c=scl(aliveSkin(v,q),.93);const out=(key==='earR'?e[0]:-e[0]);if(out>.2){const r=Math.hypot(e[1]*.9,e[2]);c=mix3(c,scl(v.skinC,.6),sstep(.75,.35,r)*.6);}return[...c,0,0];}
  if(key.startsWith('lock')){c=mix3(v.hairC,scl(v.hairC,.6),vn(q[0],q[1],q[2]));return[...c,.1,0];}
  return null;
}
// rosto vivo
function aliveFace(v,u0,v0,e,q){
  const au=Math.abs(u0);let c=aliveSkin(v,q);let wet=0;SK=1;const fem=v.sex==='f';
  c=mix3(c,scl(c,.8),g2(au-EYE_U,v0-(EYE_V-.08),.2,.05)*.45);
  c=mix3(c,fem?[200,110,100]:[180,100,80],g2(au-.5,v0+.12,.18,.12)*(fem?.22:.16));
  c=mix3(c,[170,96,80],g2(u0,v0+.18,.09,.12)*.15);
  if(v.freckles&&g2(au-.32,v0+.05,.3,.14)>.2&&h3(q[0]*160|0,q[1]*160|0,q[2]*160|0)>.86)c=mix3(c,[150,86,56],.55);
  const browV=.275-.1*(au-.33)*(au-.33);const bm=g2(au-.33,v0-browV,.22,fem?.022:.034)*sstep(.07,.15,au);
  if(bm>.25){c=mix3(c,scl(v.hairC,.85),Math.min(1,bm*1.25)*.9);SK=0;}
  const hh=eyeHH(u0),du=(au-EYE_U)/EYE_HW;
  if(Math.abs(du)<1.15){const ed=Math.abs(v0-eyeCenterV(u0))-hh;
    if(ed<.025){const k=sstep(.025,0,ed);c=mix3(c,scl(c,.7),k*.6);}
    if(v0>EYE_V&&ed<(fem?.02:.014))c=mix3(c,[24,18,16],.9);}
  const tuft=vn(q[0]*1.2,q[1]*1.2,q[2]*1.2+60),fine=h3(q[0]*140|0,q[1]*140|0,q[2]*140|0);
  const lips=Math.max(g2(u0,v0+.428,.17,.024),g2(u0,v0+.505,.14,.026));
  let beard=0;
  if(v.beard==='full'){const jaw=sstep(-.2,-.34,v0)*sstep(1.2,.95,au);const cheekLine=sstep(.0,.1,(-.3-v0)+(au-.45)*.35);const must=g2(u0,v0+.37,.22,.04);
    beard=clamp(Math.max(jaw*cheekLine,must*1.2)*(1-sstep(.25,.55,lips)*.95)+tuft*.15-.08,0,1);}
  if(beard>.2&&fine>.12){const bc=mix3(v.hairC,scl(v.hairC,.55),tuft);c=mix3(c,v.grayBeard&&fine>.9?[150,146,140]:bc,Math.min(1,beard*1.1));SK=beard>.6?0:SK;}
  if(lips>.25&&beard<.6){c=mix3(c,fem?[168,84,80]:[132,76,66],lips*(fem?.7:.6));wet=Math.max(wet,lips*.25);}
  if(Math.abs(v0-MOUTH_V)<.01&&au<MOUTH_HW*.9)c=mix3(c,[60,30,28],.7);
  const nos=g2(au-.062,v0+.283,.026,.017);if(nos>.35)c=mix3(c,scl(v.skinC,.45),Math.min(1,nos*1.2));
  if(v.scar&&g2(u0+.28,v0-.27,.012,.06)>.6)c=mix3(c,[200,150,130],.5);
  const hair=hairMask(v,e,q);
  if(hair>0){const strand=.75+.25*Math.sin(Math.atan2(e[0],e[1])*90+tuft*6);const hc=mix3(scl(v.hairC,strand),scl(v.hairC,.5),tuft);c=mix3(c,hc,clamp(hair,0,1)*.96);if(hair>.5)SK=0;}
  return[c[0],c[1],c[2],wet,0,SK];
}

// ---------- as 6 armas do jogo ----------
// Quadro da arma: origem no cabo (onde fica a palma direita), +y = cano, +z = para cima, +x = direita.
// Peças: {s:[a,b,ra,rb]} cápsula, {e:[c,r]} elipsoide. gripL = onde a mão esquerda segura. muzzle = boca do cano.
const GUNS={
  pistol:{cls:'curta',name:'Pistola',muzzle:[0,15,3.1],gripL:[-.4,.6,-2.4],parts:[
    {s:[[0,-2.6,3.1],[0,14.5,3.1],1.35,1.3],m:'gun',c:'#2b2e33'},{s:[[0,-1.5,1.6],[0,11.5,1.6],1.15,1.1],m:'gunpoly',c:'#1d1e21'},
    {s:[[0,-.4,1.2],[0,-2.8,-6.2],1.35,1.15],m:'gunpoly',c:'#191a1c'},{e:[[0,2.2,-.1],[.35,1.6,.9]],m:'gun',c:'#25272b'},{e:[[0,13.8,4.6],[.4,.5,.45]],m:'metal',c:'#c9cfd0'}]},
  revolver:{cls:'curta',name:'Revólver RM44',muzzle:[0,20,3.2],gripL:[-.4,.4,-2.6],parts:[
    {s:[[0,1.5,3.2],[0,19.5,3.2],1.0,.95],m:'metal',c:'#8e9499'},{s:[[0,1,4.2],[0,16,4.2],.45,.45],m:'metal',c:'#6d7378'},
    {e:[[0,2.8,2.6],[2.1,2.6,2.1]],m:'metal',c:'#9aa0a4'},{s:[[0,-1.6,2.6],[0,3,2.6],1.3,1.3],m:'gun',c:'#3a3d42'},
    {s:[[0,-.5,1.4],[0,-3.4,-6.4],1.45,1.6],m:'wood',c:'#6a3e22'},{e:[[0,1.8,-.3],[.35,1.4,.9]],m:'gun',c:'#2a2c30'}]},
  smg:{cls:'longa',name:'SM9 Vespa',muzzle:[0,22,2.8],gripL:[0,8.5,-2.2],stock:-7,parts:[
    {s:[[0,-5,2.8],[0,14,2.8],1.8,1.7],m:'gun',c:'#24272b'},{s:[[0,14,2.8],[0,22,2.8],1.0,1.0],m:'gun',c:'#1b1d20'},
    {s:[[0,4,1.2],[0,5.5,-8],.95,.9],m:'gunpoly',c:'#181a1c'},{s:[[0,-.4,1.2],[0,-2.4,-5.6],1.25,1.1],m:'gunpoly',c:'#191a1c'},
    {s:[[0,8.5,1.4],[0,8.5,-3],.8,.8],m:'gunpoly',c:'#202226'},{s:[[0,-5,3.4],[0,-12,2.2],.45,.45],m:'metal',c:'#5d6266'},{s:[[0,-12,3.2],[0,-12,.8],.5,.5],m:'metal',c:'#5d6266'},
    {e:[[0,6,5],[.8,2.6,.7]],m:'gun',c:'#2f3337'}]},
  rifle:{cls:'longa',name:'R98 Estaca de Carvalho',muzzle:[0,36,3],gripL:[0,10,.4],stock:-17,parts:[
    {s:[[0,-5,3],[0,16,3],1.75,1.7],m:'gun',c:'#2a2d31'},{s:[[0,16,3.2],[0,35,3.2],.65,.62],m:'gun',c:'#202225'},
    {s:[[0,8,2.4],[0,20,2.6],1.75,1.6],m:'wood',c:'#7a4a26'},{s:[[0,5,1.4],[0,7.8,-7.2],1.05,.95],m:'gun',c:'#1d1f22'},
    {s:[[0,-.4,1.2],[0,-2.6,-5.6],1.3,1.15],m:'wood',c:'#6a3e20'},{s:[[0,-5,2.6],[0,-17,.9],1.6,2.1],m:'wood',c:'#6e4222'},
    {e:[[0,4,5.4],[.9,3.4,.9]],m:'gun',c:'#1a1c1f'},{e:[[0,35,3.2],[.9,.9,.9]],m:'gun',c:'#151618'}]},
  shotgun:{cls:'longa',name:'E12 Fique em Paz',muzzle:[0,30,3],gripL:[0,8,1],stock:-15,parts:[
    {s:[[-.85,2,3.1],[-.85,30,3.1],.85,.82],m:'gun',c:'#2b2e32'},{s:[[.85,2,3.1],[.85,30,3.1],.85,.82],m:'gun',c:'#2b2e32'},
    {s:[[0,6,1.8],[0,15,1.9],1.8,1.6],m:'wood',c:'#7a4422'},{s:[[0,-3,2.6],[0,3,2.8],1.9,1.9],m:'metal',c:'#8a8e92'},
    {s:[[0,-.6,1.4],[0,-2.6,-4.8],1.3,1.2],m:'wood',c:'#6a3a1e'},{s:[[0,-3,2.2],[0,-15,.4],1.6,2.2],m:'wood',c:'#6e3e20'},{e:[[0,0,4.8],[.6,.9,.5]],m:'metal',c:'#9aa0a4'}]},
  sniper:{cls:'longa',name:'.50 Caçador de Cabeças',muzzle:[0,46,3.2],gripL:[0,11,.6],stock:-19,parts:[
    {s:[[0,-7,3],[0,19,3],1.95,1.9],m:'gun',c:'#3d4136'},{s:[[0,19,3.2],[0,44,3.2],.85,.8],m:'gun',c:'#1e2022'},
    {s:[[0,43,3.2],[0,47,3.2],1.3,1.3],m:'gun',c:'#151618'},{s:[[0,2,6.6],[0,13,6.6],1.25,1.25],m:'gun',c:'#141517'},
    {e:[[0,13.4,6.6],[1.6,.6,1.6]],m:'lens',c:'#3a5a7a'},{s:[[0,5,1.4],[0,6.5,-5],1.2,1.1],m:'gun',c:'#24262a'},
    {s:[[0,-.4,1.2],[0,-2.6,-5.6],1.3,1.15],m:'gunpoly',c:'#26282c'},{s:[[0,-7,2.6],[0,-19,1.2],1.8,2.3],m:'gunpoly',c:'#33362e'},
    {s:[[-.8,30,1.8],[-1.2,22,.4],.35,.35],m:'metal',c:'#4a4d50'},{s:[[.8,30,1.8],[1.2,22,.4],.35,.35],m:'metal',c:'#4a4d50'}]},
};
const GUN_SCALE=1.25;// arma um pouco maior que a real: leitura no jogo
function gunExtras(w){const G=GUNS[w],X=[];const S=GUN_SCALE;
  for(const p of G.parts){if(p.s)X.push({seg:1,frame:'gun',a:scl(p.s[0],S),b:scl(p.s[1],S),ra:p.s[2]*S,rb:p.s[3]*S,mat:p.m,col:p.c,weapon:1});
    else X.push({frame:'gun',off:scl(p.e[0],S),r:scl(p.e[1],S),mat:p.m,col:p.c,weapon:1});}
  X.push({frame:'gun',off:scl(add(G.muzzle,[0,2.2,0]),S),r:[2.2,3.4,2.2],mat:'flash',col:'#ffe6a0',weapon:1,showIf:'flash',scaleBy:'flash',glow:'#ffbe5a',glowR:4,glowA:1});
  return X;}

// ---------- os quatro sobreviventes ----------
const SURV={
  antonio:{name:'Antônio',sex:'m',skin:'#9a6a4c',hair:'#1c140f',beard:'full',grayBeard:true,scar:true,
    top:{kind:'shirt',c:'#a8916f',s:'#7e6a50'},sleeves:.5,blood:.6,belt:'#4a3020',
    pants:{c:'#4f4b34',s:'#39361f',cargo:true},shoes:'#5e4a38',sole:'#d2c6b0',
    eyes:{iris:'#5a3820',iris2:'#2a180c'},
    B:{k:1.0,head:1.12,hand:1.0,chest:1.06,tw:1.04,tf:1.02,armR:1.06,legR:1.04,shoulder:1.02,jaw:12,foot:1.05},
    acc:v=>[
      {frame:'head',off:[0,-.4,4.6],r:[6.2,7.3,3.9],mat:'cap',col:'#3a2e25',rot:[-8,0,0]},
      {frame:'head',off:[0,8.0,3.5],r:[5.4,4.6,.8],mat:'capbrim',col:'#2e241c',rot:[-16,0,0]},
      {frame:'head',off:[0,-.6,8.4],r:[.9,.9,.6],mat:'cap',col:'#2a2018'},
      {frame:'wristL',off:[0,0,2.0],r:[2.9,2.9,1.25],mat:'watch',col:'#1c1d20'},
      {frame:'root',off:[0,7.6,-.8],r:[1.7,.7,1.15],mat:'metal',col:'#b9b2a2'},
      {seg:1,frame:'root',a:[3.4,7.6,-1.6],b:[3.8,8.0,-5.2],ra:.45,rb:.45,mat:'metal',col:'#c8c4bc'},
      {frame:'root',off:[-10.8,2.4,-2.6],r:[1.8,2.4,3.1],mat:'leather',col:'#4a3424'}]},
  hadassa:{name:'Hadassa',sex:'f',skin:'#c4987c',hair:'#2a1a12',hairStyle:'long',
    top:{kind:'jacket',c:'#5c5340',s:'#403a2c',inner:'#2a2826',open:.24,harness:true},sleeves:1,farmSleeve:.4,blood:.25,belt:'#3a2a1e',
    pants:{c:'#3a3530',s:'#2a2622',cargo:true},kneepads:'#34312d',boots:{c:'#5a4030',top:.6},gloves:'#26221e',
    eyes:{iris:'#6a4a2a',iris2:'#2e1c0c'},
    B:{k:.96,head:1.12,hand:.9,chest:.9,tw:.86,tf:.9,hip:1.08,armR:.82,legR:.9,neckR:.84,shoulder:.92,jaw:12,foot:.92},
    acc:v=>{const X=[
      // lenço no pescoço, arnês, cinto com explosivos caseiros, rádio nas costas, bolsas
      {frame:'neck',off:[0,1.2,1.2],r:[4.4,4.0,2.0],mat:'cloth',col:'#6a3a2a'},{frame:'chest',off:[0,4.6,9.4],r:[4.8,3.0,2.2],mat:'cloth',col:'#5e3426'},
      {frame:'chest',off:[2.6,6.8,6.4],r:[2.1,1.6,2.6],mat:'cloth',col:'#5e3426'},
      {frame:'chest',off:[7.5,-6.5,6],r:[2.4,1.6,4.2],mat:'gunpoly',col:'#2a2b2c'},{seg:1,frame:'chest',a:[8.5,-6.5,9],b:[9.5,-6.5,19],ra:.35,rb:.3,mat:'metal',col:'#3a3c3e'},
      {frame:'root',off:[-9,4.6,-1],r:[1.5,1.5,2.8],mat:'brass',col:'#8a7040'},{frame:'root',off:[-5.5,6.6,-1],r:[1.5,1.5,2.8],mat:'metal',col:'#9aa0a0'},
      {frame:'root',off:[5.5,6.6,-1],r:[1.4,1.4,2.6],mat:'brass',col:'#8a7040'},{frame:'root',off:[9,4.2,-1],r:[1.5,1.5,2.8],mat:'metal',col:'#9aa0a0'},
      {frame:'root',off:[-2,7.3,-1.6],r:[1.2,.6,1.2],mat:'wire',col:'#a02a20'},{frame:'root',off:[2,7.3,-2.2],r:[1.0,.6,1.0],mat:'wire',col:'#a02a20'},
      {frame:'hipR',off:[1.8,3.6,-9],r:[2.4,2.0,3.2],mat:'cloth',col:'#4a4232'},
      {frame:'kneeL',off:[0,2.2,0],r:[3.4,2.2,3.4],mat:'pad',col:v.kneepads},{frame:'kneeR',off:[0,2.2,0],r:[3.4,2.2,3.4],mat:'pad',col:v.kneepads},
      {frame:'wristL',off:[0,0,2.2],r:[2.6,2.6,1.1],mat:'watch',col:'#1c1d20'},
      // busto, sob a regata
      {frame:'chest',off:[-3.6,5.4,5.8],r:[3.4,2.4,3.0],mat:'inner',col:v.top.inner},{frame:'chest',off:[3.6,5.4,5.8],r:[3.4,2.4,3.0],mat:'inner',col:v.top.inner}];
      // trança longa sobre o ombro esquerdo
      const pts=[[-3,-4,6],[-6.5,-1,1],[-8.5,2.5,-5],[-9,5,-11],[-8.6,6.4,-17],[-8,7,-22]];
      for(let i=0;i<pts.length-1;i++)X.push({seg:1,frame:'head',a:pts[i],b:pts[i+1],ra:1.6-i*.15,rb:1.5-i*.15,mat:'braid',col:'#2a1a12'});
      X.push({frame:'head',off:[-7.6,7.2,-23],r:[.9,.9,.9],mat:'cloth',col:'#7a3a2a'});
      return X;}},
  san:{name:'San',sex:'m',skin:'#5a3a2a',hair:'#0e0a08',beard:'full',tattoo:true,
    top:{kind:'jersey',c:'#1c1d20',s:'#121315',number:'13',numC:'#d9d2c4'},sleeves:.42,blood:.9,wraps:true,
    pants:{kind:'sweat',c:'#7a7a7e',s:'#56565a'},shoes:'#d8d4cc',sole:'#e8e4dc',shoeStripe:[30,30,32],
    eyes:{iris:'#3a2414',iris2:'#160c06'},
    B:{k:1.1,head:1.0,chest:1.3,tw:1.28,tf:1.24,shoulder:1.12,arm:1.04,armR:1.55,forearmR:1.15,legR:1.32,leg:.97,neckR:1.5,neck:.8,hand:1.16,hip:1.14,foot:1.16,jaw:12},
    acc:v=>[
      {seg:1,frame:'chest',a:[-4,4,10.6],b:[0,7.4,6.8],ra:.35,rb:.35,mat:'gold',col:'#c9a640'},{seg:1,frame:'chest',a:[0,7.4,6.8],b:[4,4,10.6],ra:.35,rb:.35,mat:'gold',col:'#c9a640'},
      {frame:'chest',off:[0,8.0,6.6],r:[.9,.4,1.2],mat:'gold',col:'#d8b648'},
      {seg:1,frame:'root',a:[-1.2,8.6,-.6],b:[-1.6,9.2,-6],ra:.35,rb:.3,mat:'cloth',col:'#d8d4cc'},{seg:1,frame:'root',a:[1.2,8.6,-.6],b:[1.6,9.2,-6.5],ra:.35,rb:.3,mat:'cloth',col:'#d8d4cc'},
      {frame:'ankleL',off:[0,0,2.5],r:[4.6,4.6,2.6],mat:'sweatcuff',col:'#5c5c60'},{frame:'ankleR',off:[0,0,2.5],r:[4.6,4.6,2.6],mat:'sweatcuff',col:'#5c5c60'}]},
  hanna:{name:'Hanna',sex:'f',skin:'#d6aa8e',hair:'#9a5a32',freckles:true,
    top:{kind:'hoodie',c:'#2e2b2a',s:'#1f1d1c',inner:'#a39a88'},sleeves:1,farmSleeve:.55,blood:.25,belt:'#3a2a1e',
    pants:{kind:'jeans',c:'#3e3a36',s:'#2c2926'},boots:{c:'#5e4430',top:.66},gloves:'#26221e',
    eyes:{iris:'#5a7a4a',iris2:'#243a1a'},
    B:{k:.95,head:1.12,hand:.9,chest:.9,tw:.85,tf:.88,hip:1.06,armR:.82,legR:.88,neckR:.84,shoulder:.9,jaw:12,foot:.92},
    acc:v=>[
      // cabelo curto ondulado (volume), capuz nas costas, mochila com saco de dormir
      {frame:'head',off:[-5.4,-1.2,1.6],r:[2.4,4.6,4.4],mat:'hair',col:v.hair},{frame:'head',off:[5.4,-1.2,1.6],r:[2.4,4.6,4.4],mat:'hair',col:v.hair},
      {frame:'head',off:[0,-4.6,1.4],r:[5.6,2.8,4.6],mat:'hair',col:v.hair},{frame:'head',off:[-4.6,1.6,-1.8],r:[1.9,2.4,3.2],mat:'hair',col:v.hair},{frame:'head',off:[4.6,1.6,-1.8],r:[1.9,2.4,3.2],mat:'hair',col:v.hair},
      {frame:'chest',off:[0,-7.6,10],r:[6.2,3.0,3.0],mat:'cloth',col:'#262321'},
      {frame:'chest',off:[0,-9.6,3],r:[8.6,4.2,8.6],mat:'pack',col:'#5e5238'},{frame:'chest',off:[0,-9.2,12.6],r:[7.8,3.4,3.0],mat:'bedroll',col:'#6e6044'},
      {seg:1,frame:'chest',a:[-7,6,10],b:[-6,6.4,-2],ra:.6,rb:.6,mat:'strap',col:'#4a3e2a'},{seg:1,frame:'chest',a:[7,6,10],b:[6,6.4,-2],ra:.6,rb:.6,mat:'strap',col:'#4a3e2a'},
      {frame:'root',off:[-10.2,3.6,-2],r:[2.2,2.6,3.2],mat:'cloth',col:'#4a4232'},{frame:'root',off:[9.6,3.2,-3],r:[1.6,2.0,2.6],mat:'cloth',col:'#4a4232'},
      {seg:1,frame:'root',a:[7.5,5,-4],b:[8.6,5.8,-15],ra:1.6,rb:.9,mat:'cloth',col:'#8a2a2a',sway:[1,1.6]},
      {seg:1,frame:'root',a:[2.6,7.4,-1.5],b:[3,7.8,-5],ra:.42,rb:.42,mat:'metal',col:'#c8c4bc'},
      {frame:'chest',off:[-3.4,5.6,5.6],r:[3.2,2.2,2.8],mat:'top',col:v.top.c},{frame:'chest',off:[3.4,5.6,5.6],r:[3.2,2.2,2.8],mat:'top',col:v.top.c}]},
};
const SURV_SPECIAL={antonio:'acelerar',hadassa:'sobrevida',san:'punhos',hanna:'mina'};
function specialProps(id){
  if(id==='hadassa')return[{seg:1,frame:'handR',a:[0,0,-1],b:[0,0,7],ra:.7,rb:.5,mat:'syringe',col:'#cfe8e0',showIf:'syringe'},
    {frame:'chest',off:[0,2,4],r:[9,7,10],mat:'healglow',col:'#7fe0b0',showIf:'heal',scaleBy:'heal',glow:'#6fe0a8',glowR:1.6,glowA:.7,glowOnly:1}];
  if(id==='hanna')return[{frame:'handL',off:[0,0,2.5],r:[2.6,1.0,2.6],mat:'mine',col:'#3a3f3a',showIf:'mineHand'},
    {frame:'root',off:[0,16,-24],r:[3.2,3.2,1.2],mat:'mine',col:'#3a3f3a',showIf:'mineGround',glow:'#ff4b55',glowR:1.2,glowA:.7}];
  if(id==='antonio')return[{frame:'chest',off:[0,0,6],r:[11,9,14],mat:'speed',col:'#ffd27a',showIf:'burst',scaleBy:'burst',glow:'#ffcf7a',glowR:1.4,glowA:.45,glowOnly:1}];
  if(id==='san')return[{frame:'handR',off:[0,0,3],r:[2.6,2.6,2.6],mat:'impact',col:'#ffe0b0',showIf:'punchR',scaleBy:'punchR',glow:'#ffd27a',glowR:3,glowA:1,glowOnly:1},
    {frame:'handL',off:[0,0,3],r:[2.6,2.6,2.6],mat:'impact',col:'#ffe0b0',showIf:'punchL',scaleBy:'punchL',glow:'#ffd27a',glowR:3,glowA:1,glowOnly:1}];
  return[];
}
const GUN_IDS=['pistol','revolver','smg','rifle','shotgun','sniper'];
for(const[id,b]of Object.entries(SURV)){
  for(const w of GUN_IDS){
    const v={type:'sobrevivente',alive:true,stylized:true,code:'P_'+id,char:id,weapon:w,cls:GUNS[w].cls,name:b.name+' · '+GUNS[w].name,
      skin:b.skin,hair:b.hair,shirt:b.top.c,shirt2:b.top.s,pants:b.pants.c,pants2:b.pants.s,shoes:b.shoes||'#3a3028',
      sex:b.sex,beard:b.beard||'none',grayBeard:b.grayBeard,scar:b.scar,freckles:b.freckles,tattoo:b.tattoo,wraps:b.wraps,
      top:Object.assign({},b.top,{cC:hex(b.top.c),sC:hex(b.top.s),iC:hex(b.top.inner||b.top.c),nC:hex(b.top.numC||'#ffffff')}),
      sleeves:b.sleeves,farmSleeve:b.farmSleeve||0,blood:b.blood||0,belt:!!b.belt,beltC:hex(b.belt||'#3a2a1e'),
      pantsSpec:b.pants,soleC:hex(b.sole||'#2a2420'),shoeStripe:b.shoeStripe,
      boots:b.boots?{top:b.boots.top}:null,bootsC:b.boots?hex(b.boots.c):null,gloves:!!b.gloves,glovesC:b.gloves?hex(b.gloves):null,kneepads:b.kneepads,
      hairStyle:b.hairStyle||'short',gait:{reach:'R',limp:null,roll:0},
      wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:false,
      B:Object.assign({},b.B)};
    v.extrasFn=vv=>b.acc(Object.assign({},vv,{hair:b.hair,kneepads:b.kneepads,top:b.top})).concat(gunExtras(w),specialProps(id));
    VARIANTS[id+'_'+w]=v;
    EYES[id+'_'+w]={sclera:'#e7dfd2',red:0,iris:b.eyes.iris,iris2:b.eyes.iris2,pupil:.2,glow:'#000000'};
  }
}
function extraVisible(x,P){if(x.weapon&&P.noWeapon)return false;if(x.showIf&&!(P[x.showIf]>0))return false;return true;}
const _extraMat0=extraMat;
extraMat=function(v,x,s){
  const e=s.e||[Math.cos(s.th||0),Math.sin(s.th||0),(s.t!=null?s.t*2-1:0)],q=s.q,col=hex(x.col||'#808080');let c;
  switch(x.mat){
    case'cap':c=mix3(col,scl(col,.75),vn(q[0]*.8,q[1]*.8,q[2]*.8));if(e[1]>.55&&e[2]>-.1&&e[2]<.55&&Math.abs(e[0])<.55){c=mix3(c,[206,196,170],.75);if(Math.abs(e[2]-.22)<.07||Math.abs(e[2]-.38)<.06)c=scl(c,.6);}if(Math.abs(e[0])<.05&&e[2]>.3)c=scl(c,.7);return[...c,0,0];
    case'capbrim':c=mix3(col,scl(col,.7),sstep(.2,-.2,e[2]));if(Math.hypot(e[0],e[1])>.9)c=scl(c,1.2);return[...c,0,0];
    case'watch':c=col.slice();if(e[2]<-.3||e[2]>.3)c=[40,40,44];if(Math.abs(e[2])<.35&&Math.sin(Math.atan2(e[1],e[0]))>.55)c=[206,204,196];return[...c,.6,0];
    case'metal':c=mix3(col,scl(col,.6),sstep(.3,-.6,e[2]));return[...c,.85,0];
    case'brass':c=mix3(col,scl(col,.6),sstep(.3,-.6,e[2]));if(Math.abs(e[2])>.7)c=[60,56,50];return[...c,.8,0];
    case'gold':c=mix3(col,[255,236,160],sstep(.4,1,e[2]||0)*.4);return[...c,.95,0];
    case'wire':c=col.slice();return[...c,.3,0];
    case'leather':case'pack':case'strap':c=mix3(col,scl(col,.7),vn(q[0]*2,q[1]*2,q[2]*2));if(x.mat==='pack'&&Math.abs(e[0])>.85)c=scl(c,.8);if(x.mat==='pack'&&e[1]<-.6&&Math.abs(e[2])<.3)c=scl(c,.75);return[...c,.12,0];
    case'bedroll':c=mix3(col,scl(col,.7),.5+.5*Math.sin(Math.atan2(e[1],e[2])*6));return[...c,0,0];
    case'pad':c=mix3(col,scl(col,.6),vn(q[0]*2,q[1]*2,q[2]*2));if(e[1]>.6)c=scl(c,1.2);return[...c,.25,0];
    case'cloth':case'braid':case'sweatcuff':{c=aliveCloth(col,scl(col,.7),q,.02,null);if(x.mat==='braid'){c=mix3(col,scl(col,.55),.5+.5*Math.sin((q[2]+q[0])*2.4));}if(x.mat==='sweatcuff'&&Math.abs(Math.sin(e[2]*12))<.3)c=scl(c,.85);return[...c,0,0];}
    case'hair':{const t=vn(q[0]*1.2,q[1]*1.2,q[2]*1.2);c=mix3(col,scl(col,.55),t);c=scl(c,.85+.15*Math.sin(Math.atan2(e[0],e[1])*30+t*5));return[...c,.12,0];}
    case'inner':c=aliveCloth(col,scl(col,.75),q,0,null);return[...c,0,0];
    case'top':c=aliveCloth(col,scl(col,.75),q,0,v);return[...c,0,0];
    case'gun':c=mix3(col,[70,74,80],sstep(.3,.95,e[1]||0)*.45);if(Math.abs(e[0])>.9)c=scl(c,.8);return[...c,.7,0];
    case'gunpoly':c=mix3(col,scl(col,1.35),sstep(.4,1,e[1]||0)*.4);return[...c,.25,0];
    case'wood':{const gr=Math.sin(q[2]*2.2+q[1]*1.4+vn(q[0],q[1],q[2])*4)*.5+.5;c=mix3(col,scl(col,.7),gr*.55);return[...c,.4,0];}
    case'lens':c=mix3(col,[200,230,255],sstep(.5,1,e[1])*.6);return[...c,1,.3];
    case'flash':c=mix3([255,250,220],col,sstep(.2,1,Math.hypot(e[0],e[2])));return[...c,0,1];
    case'syringe':c=s.t<.6?[200,240,225]:[150,154,158];if(s.t<.55&&Math.cos(s.th)>.2)c=[120,230,180];return[...c,.9,.4];
    case'healglow':c=[120,235,180];return[...c,0,1];
    case'speed':c=[255,214,130];return[...c,0,1];
    case'impact':c=[255,236,190];return[...c,0,1];
    case'mine':c=mix3(col,scl(col,.6),sstep(.3,-.6,e[2]));if(e[2]>.6&&Math.hypot(e[0],e[1])<.3)c=[255,70,80];return[...c,.6,e[2]>.6&&Math.hypot(e[0],e[1])<.3?1:0];
  }
  return _extraMat0(v,x,s);
};

// ---------- quadro da arma e cinemática inversa ----------
function bodyFrames(P,v){const B=v.B;const root={o:[0,P.root.f||0,50+(P.root.z||0)],m:mm(mm(rz(P.root.yaw||0),rx(P.root.pitch||0)),ry(P.root.roll||0))};
  const lumbar=child(root,[0,0,8*B.spine],mm(mm(rx(P.sp[0]),ry(P.sp[1])),rz(P.sp[2])));const chest=child(lumbar,[0,0,12*B.spine],mm(mm(rx(P.ch[0]),ry(P.ch[1])),rz(P.ch[2])));return{root,chest};}
function armChain(P,v,sd,A,chest){const B=v.B,SG=v.SEG,s=sd==='R'?1:-1;const comp=P.armLocal?0:(P.sp[0]+P.ch[0]);
  const shF=child(chest,[s*13.6*B.shoulder*B.chest,-.2,5.4*B.spine],mm(mm(rz(s*(A.yaw||0)),rx(-(A.pitch+comp))),ry(-s*A.abd)));
  const SU=SG['uarm'+sd]||SG.uarm,SF=SG['farm'+sd]||SG.farm;const elF=child(shF,[0,0,-SU.L],rx(-A.elbow));const wr=child(elF,[0,0,-SF.L]);
  const hd=nrm(col(elF.m,2).map(x=>-x));return{palm:add(wr.o,scl(hd,v.PALM*.5)),elbow:elF.o};}
function gunWorld(P,v,frames){// quadro da arma no espaço do personagem (modo peito)
  const g=P.gun,fr=frames||bodyFrames(P,v);const o=add(fr.chest.o,mv(fr.chest.m,g.off));
  const m=mm(mm(rz(g.yaw||0),rx(-(g.pitch||0))),ry(g.roll||0));return{o,m};}
function gunFrame(P,v,G,chest){
  const g=P.gun;if(!g)return null;
  if(g.mode==='hand'){const h=G.handR;if(!h)return null;// cano seguindo o antebraço, cabo na palma
    const m=mm(h.m,mm(rx(g.tilt!=null?g.tilt:-80),rz(0)));return{o:add(h.c,mv(h.m,[0,-.6,0])),m:mm(m,rx(0))};}
  return gunWorld(P,v,{chest});
}
function ikArm(P,v,sd,target,chest,pref){
  const A=P.arms[sd];const keys=['pitch','abd','yaw','elbow'];const lim={pitch:[-60,200],abd:[-35,110],yaw:[-80,80],elbow:[2,150]};
  const cost=()=>{const p=armChain(P,v,sd,A,chest).palm;const d=sub(p,target);let c=dot(d,d);
    if(pref){c+=.0006*((A.abd-pref.abd)**2)+.0003*((A.yaw-(pref.yaw||0))**2);}return c;};
  let best=cost();
  for(const step of[24,12,6,3,1.5,.75,.35]){
    for(let pass=0;pass<5;pass++){let moved=false;
      for(const k of keys){const v0=A[k];for(const dir of[1,-1]){A[k]=clamp(v0+dir*step,lim[k][0],lim[k][1]);const c=cost();if(c<best-1e-6){best=c;moved=true;break;}A[k]=v0;}}
      if(!moved)break;}}
  return best;
}
function solveTargets(P,v){const fr=bodyFrames(P,v);const sp=t=>add((t.space==='root'?fr.root:fr.chest).o,mv((t.space==='root'?fr.root:fr.chest).m,t.p));
  if(P.rightTarget)ikArm(P,v,'R',sp(P.rightTarget),fr.chest,{abd:0,yaw:10});
  if(P.leftHandTarget)ikArm(P,v,'L',sp(P.leftHandTarget),fr.chest,{abd:0,yaw:10});}
function solveGrip(P,v){
  const g=P.gun;if(!g||g.mode!=='chest')return;const fr=bodyFrames(P,v);const W=gunWorld(P,v,fr);const S=GUN_SCALE;const G=GUNS[v.weapon];
  const toW=p=>add(W.o,mv(W.m,scl(p,S)));
  const tR=toW([0,0,0]);ikArm(P,v,'R',tR,fr.chest,{abd:v.cls==='longa'?30:8,yaw:-10});
  if(P.leftFree)return;
  let tL=P.leftTarget?(P.leftTarget.space==='gun'?toW(P.leftTarget.p):add(fr.chest.o,mv(fr.chest.m,P.leftTarget.p))):toW(G.gripL);
  ikArm(P,v,'L',tL,fr.chest,{abd:v.cls==='longa'?-4:4,yaw:20});
}
// ---------- poses ----------
function legsWalk(P,ph,amp=1){const s=Math.sin(ph),c=Math.cos(ph);
  P.legs.L={swing:26*s*amp,abd:3,knee:6+34*Math.pow(Math.max(0,c),1.3)*amp,yaw:-2,ankle:-8*s*amp};
  P.legs.R={swing:-26*s*amp,abd:3,knee:6+34*Math.pow(Math.max(0,-c),1.3)*amp,yaw:2,ankle:8*s*amp};
  P.root.roll=2.5*s*amp;P.root.z=1.2*Math.abs(Math.cos(ph))*amp-1.2*amp;return P;}
const isLong=v=>v.cls==='longa';
function aimGun(v,recoil=0){// arma apontada para frente, na altura dos olhos (curta) ou com coronha no ombro (longa)
  if(isLong(v)){const st=(GUNS[v.weapon].stock||-15)*GUN_SCALE;return{mode:'chest',off:[6.5,13-recoil*2.4,3.8],pitch:-2+recoil*7,yaw:-3};}
  return{mode:'chest',off:[2.4,24-recoil*3,5.6+recoil*1.2],pitch:recoil*16,yaw:-4};}
function portGun(v,b=0){// arma longa atravessada na frente do corpo, cano para cima e para a esquerda
  return{mode:'chest',off:[5,8.5,-6+b],pitch:38,yaw:-58,roll:-20};}
function stance(P,v,b=0){
  P.legs.L={swing:4,abd:7,knee:7,yaw:-10,ankle:0};P.legs.R={swing:-6,abd:7,knee:8,yaw:14,ankle:0};
  P.root.roll=1+1.2*b;P.sp=[1+b,0,0];P.ch=[1+1.5*b,0,0];P.neck=[0,0,0];P.head=[1+b,0];return P;}
const SP={
  idle(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=stance(BASE(),v,b);P.head[1]=3*Math.sin(ph);
    if(isLong(v)){P.gun=portGun(v,b*.6);}
    else{P.gun={mode:'hand',tilt:-62};P.arms.R={pitch:22+3*b,abd:8,elbow:34,yaw:-8,claw:1.08};P.arms.L={pitch:10+2*b,abd:10,elbow:20,yaw:4,claw:.45};}
    P.jaw=2;P.sway=b*.3;return P;},
  aim(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=stance(BASE(),v,b*.6);
    if(isLong(v)){P.legs.L.swing=12;P.legs.R.swing=-12;P.legs.R.yaw=24;P.ch=[2,0,-8];P.sp=[3,0,-4];P.neck=[0,0,10];P.head=[6,-4];}
    else{P.legs.L.swing=8;P.legs.R.swing=-10;P.ch=[2,0,-3];P.head=[4,0];}
    P.gun=aimGun(v);P.gun.off=add(P.gun.off,[0,0,.4*b]);return P;},
  walk(u,v){const ph=u*Math.PI*2;const P=BASE();legsWalk(P,ph,.9);P.root.yaw=4*Math.sin(ph);P.sp=[3,0,-2*Math.sin(ph)];P.ch=[2,0,-3*Math.sin(ph)+(isLong(v)?-8:-2)];P.head=[4,0];
    P.gun=aimGun(v);P.gun.off=add(P.gun.off,[0,0,.8*Math.sin(2*ph)]);P.sway=-Math.sin(ph)*.5;return P;},
  run(u,v){const ph=u*Math.PI*2,s=Math.sin(ph);const P=BASE();
    P.legs.L={swing:46*s,abd:3,knee:14+72*Math.pow(Math.max(0,Math.cos(ph)),1.2),yaw:-2,ankle:-14*s};
    P.legs.R={swing:-46*s,abd:3,knee:14+72*Math.pow(Math.max(0,-Math.cos(ph)),1.2),yaw:2,ankle:14*s};
    P.root.z=2.4*Math.abs(Math.sin(ph))-1.6;P.root.roll=3*s;P.root.yaw=6*s;P.sp=[12,0,0];P.ch=[8,0,-8*s];P.neck=[-6,0,6*s];P.head=[-4,0];
    if(isLong(v)){P.gun=portGun(v,2*Math.sin(2*ph));P.gun.pitch=-24;}
    else{P.gun={mode:'hand',tilt:-40};P.arms.R={pitch:20+44*s,abd:10,elbow:70-10*s,yaw:-6,claw:1.08};P.arms.L={pitch:20-44*s,abd:10,elbow:70+10*s,yaw:6,claw:.9};}
    P.jaw=8;P.sway=-s;return P;},
  shoot(u,v){const P=SP.aim(0,v);const r=u<.25?sstep(0,.25,u):sstep(1,.25,u);const k=isLong(v)?(v.weapon==='sniper'?1.8:v.weapon==='shotgun'?1.6:1):1.2;
    P.gun=aimGun(v,r*k);P.root.f=-r*k*1.4;P.sp[0]-=r*3*k;P.ch[0]-=r*2*k;P.head[0]-=r*4;P.flash=u<.3?1-u/.3:0;return P;},
  reload(u,v){const P=stance(BASE(),v,0);const long=isLong(v);
    const tilt=sstep(0,.18,u)*sstep(1,.86,u);
    P.gun=long?{mode:'chest',off:[4,12,0+2*tilt],pitch:10+16*tilt,yaw:-24,roll:-30*tilt}:{mode:'chest',off:[2,15,2+3*tilt],pitch:28*tilt,yaw:-12-8*tilt,roll:-40*tilt};
    const S=GUN_SCALE,G=GUNS[v.weapon];
    const magwell=long?[0,(G.gripL[1]-5),-2]:[0,0,-5.5];const belt=[-9,5,-15];const slide=long?[0,4,3.6]:[0,6,3.6];
    const reach=sstep(.2,.36,u)*sstep(.6,.44,u),insert=sstep(.48,.6,u)*sstep(.82,.72,u),rack=sstep(.76,.84,u)*sstep(1,.92,u);
    if(reach>.5)P.leftTarget={space:'chest',p:belt};
    else if(insert>.3)P.leftTarget={space:'gun',p:magwell};
    else if(rack>.3)P.leftTarget={space:'gun',p:add(slide,[0,-4*rack,0])};
    else P.leftTarget={space:'gun',p:long?G.gripL:G.gripL};
    P.ch=[4+5*tilt,0,-6*tilt+6*reach];P.neck=[8*tilt+6*reach,0,-8*reach];P.head=[12*tilt+8*reach,-6*tilt];P.mag=reach;return P;},
  hit(u,v){const k=sstep(0,.25,u)*sstep(1,.4,u);const P=SP.aim(0,v);
    P.root.f=-3*k;P.root.pitch=-6*k;P.sp=[P.sp[0]-6*k,0,6*k];P.ch=[P.ch[0]-12*k,0,P.ch[2]+10*k];P.neck=[-10*k,0,0];P.head=[-14*k,12*k];
    P.gun.pitch=(P.gun.pitch||0)+22*k;P.gun.off=add(P.gun.off,[0,-3*k,3*k]);P.leftFree=k>.3;if(k>.3)P.arms.L={pitch:40,abd:30+20*k,elbow:50,claw:.3};P.sway=1.2*k;return P;},
  death(u,v){const k0=SP.aim(0,v);
    const jolt=lerpObj(k0,{root:{f:-3,pitch:-8},sp:[-8,0,8],ch:[-16,0,14],neck:[-16,0,0],head:[-20,16]},1);
    const knees=lerpObj(jolt,{root:{f:2,pitch:10,roll:6,z:-12},sp:[10,0,4],ch:[16,0,6],neck:[10,0,0],head:[10,10],
      legs:{L:{swing:60,abd:8,knee:110},R:{swing:50,abd:10,knee:100}}},1);
    const fall=lerpObj(knees,{root:{f:8,pitch:70,roll:10,z:-14},sp:[4,0,0],ch:[4,0,0],neck:[-10,0,14],head:[-12,26],legs:{L:{swing:30,abd:8,knee:50},R:{swing:22,abd:12,knee:40}}},1);
    const down=lerpObj(fall,{root:{f:10,pitch:88,roll:8,z:-14},neck:[-14,0,30],head:[-10,40],legs:{L:{swing:6,abd:10,knee:16,yaw:-14},R:{swing:2,abd:14,knee:22,yaw:20}}},1);
    const P=keys([[0,k0],[.14,jolt],[.4,knees],[.7,fall],[.85,down],[1,down]],u);
    const t=sstep(.1,.45,u);
    P.gun={mode:'hand',tilt:-62};P.arms.R=lerpObj({pitch:70,abd:20,elbow:20,yaw:-10,claw:1.05},{pitch:110,abd:60,elbow:24,yaw:0,claw:.6},sstep(.4,.85,u));
    P.arms.L=lerpObj({pitch:50,abd:40,elbow:40,claw:.4},{pitch:160,abd:50,elbow:16,claw:.3},sstep(.4,.85,u));P.leftFree=true;
    if(u>.12)P.gun.mode='hand';P.sway=0;return P;},
  special(u,v){
    const id=v.char;
    if(id==='antonio'){// ACELERAR: respira, bate no peito, abaixa e arranca
      const k0=SP.idle(0,v);const breathe=lerpObj(k0,{sp:[-4,0,0],ch:[-10,0,0],neck:[-6,0,0],head:[-16,0]},1);
      const coil=lerpObj(k0,{root:{z:-6,f:-2},sp:[18,0,0],ch:[16,0,0],neck:[-10,0,0],head:[-10,0],legs:{L:{swing:30,abd:6,knee:70},R:{swing:-34,abd:6,knee:44,ankle:20}}},1);
      const launch=SP.run(.25,v);const P=keys([[0,k0],[.25,breathe],[.55,coil],[.8,launch],[1,launch]],u);
      const thump=sstep(.12,.25,u)*sstep(.5,.35,u);P.leftFree=true;P.arms.L={pitch:lerp(10,96,thump),abd:-10*thump,elbow:lerp(20,118,thump),yaw:44*thump,claw:1.1};
      P.gun=u<.75?(isLong(v)?portGun(v):{mode:'hand',tilt:-62}):(isLong(v)?portGun(v):{mode:'hand',tilt:-40});
      if(!isLong(v)&&u<.75)P.arms.R={pitch:22,abd:8,elbow:34,yaw:-8,claw:1.08};
      P.burst=sstep(.6,.85,u)*(1-sstep(.95,1,u)*.3);return P;}
    if(id==='hadassa'){// SOBREVIDA: guarda a arma, aplica a seringa na coxa, brilho verde
      const P=stance(BASE(),v,0);P.noWeapon=true;P.leftFree=true;
      const reach=sstep(.05,.3,u),stab=sstep(.35,.5,u)*sstep(.85,.7,u);
      P.syringe=sstep(.08,.15,u)*sstep(1,.9,u);P.heal=sstep(.45,.7,u)*(1-sstep(.9,1,u)*.4);
      P.arms.R={pitch:20,abd:10,elbow:40,yaw:0,claw:1.05};
      if(reach>.05)P.rightTarget={space:'root',p:[lerp(10,7,reach),lerp(3,9-stab*2.5,reach),lerp(-2,-12,reach)]};
      P.arms.L={pitch:30*reach,abd:30,elbow:40,claw:.6};P.legs.L.swing=14*reach;P.legs.L.knee=26*reach;
      P.sp=[8*reach,0,0];P.ch=[10*reach-stab*4,0,6*reach];P.head=[16*reach,-6];return P;}
    if(id==='san'){// PUNHOS: guarda alta e sequência jab – direto – gancho
      const P=stance(BASE(),v,0);P.noWeapon=true;P.leftFree=true;
      P.legs.L={swing:16,abd:8,knee:16,yaw:-18};P.legs.R={swing:-14,abd:8,knee:18,yaw:24,ankle:10};P.root.z=-3;
      const guardL={pitch:62,abd:-6,elbow:118,yaw:38,claw:1.4},guardR={pitch:58,abd:-2,elbow:124,yaw:42,claw:1.4};
      const jab=sstep(.08,.18,u)*sstep(.32,.22,u),cross=sstep(.36,.46,u)*sstep(.6,.5,u),hook=sstep(.66,.76,u)*sstep(.92,.82,u);
      P.arms.L=lerpObj(lerpObj(guardL,{pitch:92,abd:-10,elbow:6,yaw:22,claw:1.45},jab),{pitch:84,abd:56,elbow:92,yaw:40,claw:1.45},hook);
      P.arms.R=lerpObj(guardR,{pitch:94,abd:-14,elbow:6,yaw:30,claw:1.45},cross);
      P.ch=[6+4*cross,0,-10*jab+22*cross-20*hook];P.sp=[4,0,-6*jab+10*cross-12*hook];P.root.yaw=-6*jab+10*cross-10*hook;P.head=[6,0];
      P.punchL=Math.max(jab,hook)>.85?1:0;P.punchR=cross>.85?1:0;return P;}
    if(id==='hanna'){// MINA: agacha, crava a mina no chão, arma o pino
      const P=stance(BASE(),v,0);P.leftFree=true;if(!isLong(v)){P.gun={mode:'hand',tilt:-62};}else P.gun={mode:'chest',off:[9,4,0],pitch:72,yaw:-6,roll:0};
      const down=sstep(.1,.35,u)*sstep(1,.8,u),place=sstep(.35,.55,u);
      P.root.z=-20*down;P.legs.L={swing:58*down,abd:8,knee:110*down,yaw:-6,ankle:-30*down};P.legs.R={swing:-12*down,abd:10,knee:120*down,yaw:12,ankle:40*down};
      P.sp=[20*down,0,0];P.ch=[18*down,0,0];P.neck=[-6*down,0,0];P.head=[14*down,0];
      P.arms.L={pitch:lerp(20,96,down),abd:6,elbow:lerp(30,8,down),yaw:10,claw:.7};
      if(down>.2)P.leftHandTarget={space:'root',p:[-1,lerp(8,15,place),-20*down-2]};
      if(!isLong(v))P.arms.R={pitch:22+30*down,abd:24,elbow:40,yaw:-8,claw:1.08};
      P.mineHand=place<.5?sstep(.05,.15,u):0;P.mineGround=place>=.5?1:0;return P;}
    return SP.idle(u,v);},
};
const _pose0=pose;
pose=function(anim,u,v){
  if(!v.alive)return _pose0(anim,u,v);
  const P=(SP[anim]||SP.idle)(u,v);P.t=u;
  if(!P.face)P.face=[.04,0,.4,0,.1];
  for(const sd of['L','R']){const A=P.arms[sd];if(A.claw==null)A.claw=.5;if(A.spread==null)A.spread=0;}
  if(P.gun&&P.gun.mode==='chest'&&!P.noWeapon){P.arms.R.claw=1.08;if(!P.leftFree)P.arms.L.claw=.95;solveGrip(P,v);}
  if(P.rightTarget||P.leftHandTarget)solveTargets(P,v);
  return P;
};
TYPES.sobrevivente={name:'Sobrevivente',tint:'#d8b07a',variants:Object.keys(VARIANTS).filter(k=>VARIANTS[k].alive),old:'survivor',game:{radius:14,size:1},
  cell:{w:150,h:150,ground:126,scale:1.06},
  anims:{idle:{frames:6,fps:5,loop:true,label:'Parado'},aim:{frames:6,fps:5,loop:true,label:'Mirando'},walk:{frames:8,fps:10,loop:true,label:'Andar mirando'},
    run:{frames:8,fps:13,loop:true,label:'Correr'},shoot:{frames:4,fps:16,loop:false,label:'Atirar'},reload:{frames:12,fps:10,loop:false,label:'Recarregar'},
    hit:{frames:4,fps:12,loop:false,label:'Levar dano'},death:{frames:10,fps:9,loop:false,label:'Morrer'},special:{frames:12,fps:10,loop:false,label:'Habilidade'},
    attack:null,crawl:null}};

// boca do cano na tela (para o clarão do jogo sair da ponta certa da arma)
function muzzleScreen(v,dir,scale){const P=pose('aim',0,v);const fr=bodyFrames(P,v);const W=gunWorld(P,v,fr);const G=GUNS[v.weapon];
  const m=add(W.o,mv(W.m,scl(add(G.muzzle,[0,1,0]),GUN_SCALE)));const h=dir*Math.PI/4,sh=Math.sin(h),ch=Math.cos(h);
  const w=[-m[0]*sh+m[1]*ch,m[0]*ch+m[1]*sh,m[2]];return[w[0]*scale,(w[1]*CAM.K-w[2]*CAM.C)*scale];}
