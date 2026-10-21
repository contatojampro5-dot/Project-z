// ======================================================================
// SOBREVIVENTES (Olimpo · Afrodite + Ares + Hefesto) — estudo do Antônio
// Pele viva, rosto humano com barba, boné, camisa de trabalho com mangas dobradas, calça cargo, relógio,
// cinto com mosquetão e a arma na mão. Estilizado: cabeça e mãos um pouco maiores, cores mais vivas e
// contorno mais grosso para destacar o jogador no meio da horda.
// ======================================================================
const ALIVE_DIRT=[74,60,44];
function aliveSkin(v,q){SK=1;
  const n=fbm(q[0]*.3+1,q[1]*.3,q[2]*.3);let c=mix3(v.skinC,scl(v.skinC,.86),sstep(.4,.8,n)*.6);
  const g=fbm(q[0]*.55,q[1]*.55+20,q[2]*.55);return mix3(c,ALIVE_DIRT,sstep(.6,.85,g)*.32);
}
function aliveCloth(base,shade,q,dirt=0){SK=0;
  const n=fbm(q[0]*.35,q[1]*.35+40,q[2]*.35);let c=mix3(base,shade,sstep(.35,.75,n)*.8);
  const weave=(Math.sin(q[2]*3.1+q[0]*.4)*.5+.5)*.05;c=scl(c,1-weave);
  const d=fbm(q[0]*.25+7,q[1]*.25,q[2]*.25);c=mix3(c,ALIVE_DIRT,clamp(sstep(.62,.88,d)*.25+dirt,0,.6));
  // respingos de sangue de zumbi (pouco, escuro)
  if(vn(q[0]*1.1+3,q[1]*1.1,q[2]*1.1)>.9)c=mix3(c,[90,24,22],.4);
  return c;
}
function aliveMat(v,key,s){
  const q=s.q;let c;
  if(key==='torso'){
    const ph=s.phi,fr=Math.sin(ph),side=Math.cos(ph),z=s.zs;
    c=aliveCloth(v.shirtC,v.shirt2C,q,0);
    // bolso no peito (lado esquerdo do personagem), costura e lapela
    const px=side-(-.38),pz=z-.7;if(fr>.35&&Math.abs(px)<.16&&pz>-.1&&pz<.07){c=scl(c,.9);if(Math.abs(px)>.13||pz<-.085||Math.abs(pz-.04)<.012)c=scl(c,.72);}
    // vista com botões
    if(fr>.88&&Math.abs(side)<.05&&z>.14&&z<.9){c=scl(c,.84);if(((z*13)|0)%3===0&&Math.abs(side)<.025)c=mix3(c,[226,220,206],.6);}
    // gola aberta mostrando o peito
    if(z>.9){c=scl(c,.85);}
    if(z>.86&&fr>.6&&Math.abs(side)<.22+(z-.86)*2)c=aliveSkin(v,q);
    // cinto de couro com fivela
    if(z<.13&&v.pantsC){c=aliveCloth(v.pantsC,v.pants2C,q,.04);if(z>.075)c=mix3([62,42,28],[40,26,18],vn(q[0]*2,q[1]*2,q[2]*2));if(z>.075&&fr>.9&&Math.abs(side)<.1)c=[170,160,140];}
    // suor nas costas e axilas
    if(fr<-.3&&z>.5&&z<.85)c=scl(c,.93);
    return[...c,0,0];
  }
  if(key==='uarmL'||key==='uarmR'){const edge=v.sleeves+(vn(q[0]*.8,q[1]*.8,q[2]*.8)-.5)*.08;
    if(s.t<edge){c=aliveCloth(v.shirtC,v.shirt2C,q,.02);if(Math.abs(s.t-edge)<.16)c=scl(c,.78+.12*Math.sin(s.t*60));}// manga dobrada em gomos
    else{c=aliveSkin(v,q);const hair=vn(q[0]*6,q[1]*6,q[2]*6)>.7&&Math.sin(s.th)>-.2;if(hair)c=scl(c,.86);}
    return[...c,0,0];}
  if(key==='farmL'||key==='farmR'){c=aliveSkin(v,q);if(Math.cos(s.th)>.2&&vn(q[0]*7,q[1]*7,q[2]*7)>.68)c=scl(c,.84);// pelos do antebraço
    const tendon=Math.pow(Math.abs(Math.sin(s.th*2+.6)),8)*sstep(.4,.9,s.t);c=scl(c,1+tendon*.06);return[...c,0,0];}
  if(key==='handL'||key==='handR'){const e=s.e;c=aliveSkin(v,q);if(e[1]<0)c=mix3(c,[150,110,90],.25);// palma mais clara
    if(e[1]>0){const kn=Math.pow(Math.abs(Math.sin(e[0]*5.2+.4)),8)*sstep(.4,.9,e[2]);c=scl(c,1+kn*.08);}
    return[...c,0,0];}
  if(key.startsWith('px')||key.startsWith('pt')){const j=+key[key.length-1];c=aliveSkin(v,q);const dors=Math.cos(s.th);
    if(j===2&&dors>.35&&s.t>.2){c=mix3([206,168,150],[150,110,96],vn(q[0]*4,q[1]*4,q[2]*4)*.5);if(s.t>.9)c=mix3(c,[60,44,34],.45);return[...c,.25,0];}// unha (com sujeira na ponta)
    if(dors>.3&&s.t<.15)c=scl(c,.9);return[...c,0,0];}
  if(key==='thighL'||key==='thighR'||key==='shinL'||key==='shinR'){
    const shin=key.startsWith('shin');c=aliveCloth(v.pantsC,v.pants2C,q,shin?sstep(.4,1,s.t)*.35:0);
    const fold=Math.sin(q[2]*1.25+vn(q[0]*.6,q[1]*.6,q[2]*.3)*5);c=scl(c,1-sstep(.55,1,fold)*.16+sstep(.7,1,-fold)*.05);
    // bolso cargo na lateral da coxa, com aba
    const out=(key.endsWith('R')?1:-1)*Math.cos(s.th);
    if(!shin&&out>.55&&s.t>.42&&s.t<.8){c=scl(c,.92);if(s.t<.5||out<.62||Math.abs(s.t-.8)<.03)c=scl(c,.75);if(s.t<.5&&out>.75)c=scl(c,.86);}
    // joelhos gastos e manchados
    if(!shin&&s.t>.84&&Math.sin(s.th)>.3)c=mix3(c,[110,100,80],.25);
    if(shin&&s.t>.88)c=scl(c,.82);// barra
    return[...c,0,0];}
  if(key==='footL'||key==='footR'){const e=s.e;
    c=mix3(v.shoesC,scl(v.shoesC,.7),vn(q[0]*.6,q[1]*.6,q[2]*.6));
    if(e[2]<-.45)c=[198,188,170];// sola clara
    if(Math.abs(e[2]+.12)<.07&&e[1]>-.4)c=mix3(c,[200,190,170],.5);// faixa lateral
    if(e[1]>.55&&e[2]>-.1)c=scl(c,1.15);// biqueira
    if(e[2]>.5&&Math.abs(e[0])<.35&&e[1]>-.2&&((e[1]*12|0)%2))c=[214,206,190];// cadarço
    c=mix3(c,ALIVE_DIRT,sstep(.5,.85,fbm(q[0]*.5,q[1]*.5,q[2]*.5))*.45);
    return[...c,.08,0];}
  if(key==='neck'){c=aliveSkin(v,q);if(Math.sin(s.th)>-.1&&s.t<.75&&vn(q[0]*9,q[1]*9,q[2]*9)>.55)c=mix3(c,v.hairC,.55);return[...c,0,0];}// barba descendo no pescoço
  if(key==='earL'||key==='earR'){const e=s.e;c=scl(aliveSkin(v,q),.93);const out=(key==='earR'?e[0]:-e[0]);if(out>.2){const r=Math.hypot(e[1]*.9,e[2]);c=mix3(c,[120,70,60],sstep(.75,.35,r)*.6);}return[...c,0,0];}
  return null;
}
// rosto vivo: sobrancelhas grossas, olhos castanhos limpos, barba cheia, bigode, lábios naturais
function aliveFace(v,u0,v0,e,q){
  const au=Math.abs(u0),cu=Math.cos(u0);let c=aliveSkin(v,q);let wet=0;SK=1;
  // sombra das órbitas (leve), maçãs coradas, nariz um pouco mais vermelho (sol)
  c=mix3(c,scl(c,.78),g2(au-EYE_U,v0-(EYE_V-.08),.2,.05)*.5);
  c=mix3(c,[180,100,80],g2(au-.5,v0+.12,.18,.12)*.18);
  c=mix3(c,[170,96,80],g2(u0,v0+.18,.09,.12)*.2);
  // sobrancelhas grossas e escuras
  const browV=.275-.1*(au-.33)*(au-.33);const bm=g2(au-.33,v0-browV,.22,.034)*sstep(.07,.15,au);
  if(bm>.25){c=mix3(c,scl(v.hairC,.9),Math.min(1,bm*1.25)*.92);SK=0;}
  // pálpebras e cílios
  const hh=eyeHH(u0),du=(au-EYE_U)/EYE_HW;
  if(Math.abs(du)<1.15){const ed=Math.abs(v0-eyeCenterV(u0))-hh;
    if(ed<.025){const k=sstep(.025,0,ed);c=mix3(c,scl(c,.7),k*.6);}
    if(v0>EYE_V&&ed<.014)c=mix3(c,[30,22,18],.85);}
  // barba cheia (queixo, mandíbula, bigode), bem aparada; deixa os lábios à mostra
  const tuft=vn(q[0]*1.2,q[1]*1.2,q[2]*1.2+60),fine=h3(q[0]*140|0,q[1]*140|0,q[2]*140|0);
  const jaw=sstep(-.2,-.34,v0)*sstep(1.2,.95,au);
  const cheekLine=sstep(.0,.1,(-.3-v0)+(au-.45)*.35);
  const must=g2(u0,v0+.37,.22,.04);
  const lips=Math.max(g2(u0,v0+.428,.17,.024),g2(u0,v0+.505,.14,.026));
  let beard=Math.max(jaw*cheekLine,must*1.2)*(1-sstep(.25,.55,lips)*.95);
  beard=clamp(beard+tuft*.15-.08,0,1);
  if(beard>.2&&fine>.12){const bc=mix3(v.hairC,scl(v.hairC,.55),tuft);c=mix3(c,bc,Math.min(1,beard*1.1));SK=beard>.6?0:SK;}
  // lábios
  if(lips>.25&&beard<.6){c=mix3(c,[132,76,66],lips*.6);wet=Math.max(wet,lips*.2);}
  if(Math.abs(v0-MOUTH_V)<.01&&au<MOUTH_HW*.9)c=mix3(c,[60,30,28],.7);
  // narinas
  const nos=g2(au-.062,v0+.283,.026,.017);if(nos>.35)c=mix3(c,[70,36,30],Math.min(1,nos*1.2));
  // cicatriz pequena na sobrancelha (história do personagem)
  if(g2(u0+.28,v0-.27,.012,.06)>.6)c=mix3(c,[200,150,130],.5);
  // cabelo curto (aparece embaixo do boné)
  const hair=hairMask(v,e,q);
  if(hair>0){const strand=.75+.25*Math.sin(Math.atan2(e[0],e[1])*90+tuft*6);const hc=mix3(scl(v.hairC,strand),scl(v.hairC,.5),tuft);c=mix3(c,hc,clamp(hair,0,1)*.96);if(hair>.5)SK=0;}
  return[c[0],c[1],c[2],wet,0,SK];
}

// ---------- variação: Antônio ----------
const ANTONIO={type:'sobrevivente',name:'Antônio',code:'P1',alive:true,stylized:true,
  skin:'#9a6f56',shirt:'#c2ad86',shirt2:'#9d8865',pants:'#5d5a40',pants2:'#45422f',shoes:'#5e4a38',hair:'#1c140f',
  sleeves:.5,hairStyle:'short',belt:true,gait:{reach:'R',limp:null,roll:0},
  wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:false,
  B:{k:1.0,head:1.12,hand:.98,chest:1.06,tw:1.04,tf:1.02,armR:1.06,legR:1.04,shoulder:1.02,jaw:12,foot:1.05},
  extrasFn:v=>survivorExtras(v)};
Object.assign(VARIANTS,{
  antonio:Object.assign({},ANTONIO,{weapon:'curta',name:'Antônio · arma curta'}),
  antonioLonga:Object.assign({},ANTONIO,{weapon:'longa',name:'Antônio · arma longa'}),
});
EYES.antonio=EYES.antonioLonga={sclera:'#e7dfd2',red:0,iris:'#5a3820',iris2:'#2a180c',pupil:.2,glow:'#000000'};

function survivorExtras(v){
  const X=[];const hs=1;// offsets da cabeça já são escalados pelo tamanho da cabeça
  // boné: copa, aba e botão; frente clara com bordado (como o da arte: "oração diária")
  X.push({frame:'head',off:[0,-.4,4.6],r:[6.2,7.3,3.9],mat:'cap',col:'#4a3a2c',rot:[-8,0,0]});
  X.push({frame:'head',off:[0,8.0,3.5],r:[5.4,4.6,.8],mat:'capbrim',col:'#35291f',rot:[-16,0,0]});
  X.push({frame:'head',off:[0,-.6,8.4],r:[.9,.9,.6],mat:'cap',col:'#2a2018'});
  // relógio no pulso esquerdo
  X.push({frame:'wristL',off:[0,0,2.0],r:[2.9,2.9,1.25],mat:'watch',col:'#1c1d20'});
  // fivela, mosquetão e porta-carregador no cinto
  X.push({frame:'root',off:[0,7.6,-.8],r:[1.7,.7,1.15],mat:'metal',col:'#b9b2a2'});
  X.push({seg:1,frame:'root',a:[3.4,7.6,-1.6],b:[3.8,8.0,-5.2],ra:.45,rb:.45,mat:'metal',col:'#c8c4bc'});
  X.push({frame:'root',off:[-10.8,2.4,-2.6],r:[1.8,2.4,3.1],mat:'leather',col:'#4a3424'});
  if(v.weapon==='curta'){
    // pistola na mão direita: ferrolho, armação, guarda-mato e cabo
    X.push({seg:1,frame:'wristR',a:[0,-2.2,-3.4],b:[0,-2.2,-17],ra:1.6,rb:1.5,mat:'gun',col:'#2a2c30'});
    X.push({seg:1,frame:'wristR',a:[0,-.6,-3.6],b:[0,-.6,-14],ra:1.35,rb:1.3,mat:'gunpoly',col:'#1e1f22'});
    X.push({frame:'wristR',off:[0,1.0,-4.6],r:[1.2,3.0,1.7],mat:'gunpoly',col:'#1a1b1d'});
  }else{
    // espingarda/fuzil: cano, guarda-mão, ferrolho, coronha apoiada no ombro
    X.push({seg:1,frame:'wristR',a:[0,-1.4,-4],b:[0,-1.4,-30],ra:.75,rb:.7,mat:'gun',col:'#26282b'});
    X.push({seg:1,frame:'wristR',a:[0,-.6,-10],b:[0,-.6,-21],ra:1.45,rb:1.35,mat:'wood',col:'#6a4426'});
    X.push({seg:1,frame:'wristR',a:[0,-1.0,-2.5],b:[0,-1.0,-10],ra:1.45,rb:1.45,mat:'gun',col:'#2a2c30'});
    X.push({seg:1,frame:'wristR',a:[0,-.4,-2],b:[0,.4,9.5],ra:1.3,rb:1.75,mat:'wood',col:'#5e3c22'});
  }
  return X;
}
const _extraMat0=extraMat;
extraMat=function(v,x,s){
  const e=s.e||[Math.cos(s.th||0),Math.sin(s.th||0),(s.t!=null?s.t*2-1:0)],q=s.q,col=hex(x.col||'#808080');let c;
  if(x.mat==='cap'){c=mix3(col,scl(col,.75),vn(q[0]*.8,q[1]*.8,q[2]*.8));if(e[1]>.55&&e[2]>-.1&&e[2]<.55&&Math.abs(e[0])<.55){c=mix3(c,[206,196,170],.75);if(Math.abs(e[2]-.22)<.07||Math.abs(e[2]-.38)<.06)c=scl(c,.6);}
    if(Math.abs(e[0])<.05&&e[2]>.3)c=scl(c,.7);return[...c,0,0];}
  if(x.mat==='capbrim'){c=mix3(col,scl(col,.7),sstep(.2,-.2,e[2]));if(Math.hypot(e[0],e[1])>.9)c=scl(c,1.2);return[...c,0,0];}
  if(x.mat==='watch'){c=col.slice();if(e[2]<-.3||e[2]>.3)c=[40,40,44];if(Math.abs(e[2])<.35&&Math.sin(Math.atan2(e[1],e[0]))>.55)c=[206,204,196];return[...c,.6,0];}
  if(x.mat==='metal'){c=mix3(col,scl(col,.6),sstep(.3,-.6,e[2]));return[...c,.85,0];}
  if(x.mat==='leather'){c=mix3(col,scl(col,.7),vn(q[0]*2,q[1]*2,q[2]*2));return[...c,.15,0];}
  if(x.mat==='gun'){c=mix3(col,[64,66,72],sstep(.3,.95,e[1]||0)*.5);return[...c,.75,0];}
  if(x.mat==='gunpoly'){c=mix3(col,scl(col,1.3),sstep(.4,1,e[1]||0)*.4);if(((q[2]*4)|0)%2&&x.r)c=scl(c,.85);return[...c,.25,0];}
  if(x.mat==='wood'){const gr=Math.sin(q[2]*2.2+vn(q[0],q[1],q[2])*4)*.5+.5;c=mix3(col,scl(col,.72),gr*.6);return[...c,.35,0];}
  return _extraMat0(v,x,s);
};
// ---------- expressões (rosto) ----------
// canais do rosto: [mandíbula, rosnado, testa franzida, apertar olhos, pálpebras]
const EXPR={neutro:[.04,0,.25,0,.12],raiva:[.12,.55,1,.45,0],medo:[.42,0,0,0,0],dor:[.5,.35,.75,1,.25],foco:[.02,.12,.6,.35,.05],grito:[.9,.6,.9,.6,0]};
function survivorFace(anim,u,P){
  if(P.expr&&EXPR[P.expr])return EXPR[P.expr].slice();
  if(anim==='shoot')return EXPR.foco.map((x,i)=>i===1?x+.2*sstep(.0,.3,u)*sstep(.8,.4,u):x);
  if(anim==='walk'||anim==='aim')return EXPR.foco.slice();
  if(anim==='run')return[.3,.15,.45,.2,0];
  if(anim==='reload')return[.05,.05,.55,.15,.25];
  if(anim==='hit'){const k=sstep(0,.25,u)*sstep(1,.45,u);return EXPR.neutro.map((x,i)=>lerp(x,EXPR.dor[i],k));}
  if(anim==='death'){const k=sstep(.5,1,u);return[.4+.2*k,.3*(1-k),.6*(1-k),.8*(1-k),.7*k];}
  if(anim==='special'){const k=sstep(.1,.45,u);return EXPR.neutro.map((x,i)=>lerp(x,EXPR.grito[i],k*sstep(1,.7,u)+(u>.7?.3:0)));}
  return EXPR.neutro.slice();
}
// ---------- poses ----------
// Mira: os dois braços à frente, mãos se encontrando na frente do peito (arma curta) ou
// coronha no ombro e mão esquerda no guarda-mão (arma longa).
function aimArms(P,v,k=1,recoil=0){
  const long=v.weapon==='longa';
  if(long){
    P.arms.R=lerpObj(P.arms.R,{pitch:58-recoil*6,abd:34,elbow:96+recoil*8,yaw:-38,claw:1.05,spread:0},k);
    P.arms.L=lerpObj(P.arms.L,{pitch:86-recoil*8,abd:-6,elbow:22,yaw:28,claw:.8,spread:.2},k);
    P.ch=lerpObj(P.ch,[4-recoil*6,0,-14],k);P.neck=lerpObj(P.neck,[4,0,10],k);P.head=lerpObj(P.head,[6,-6],k);
  }else{
    P.arms.R=lerpObj(P.arms.R,{pitch:84+recoil*18,abd:4,elbow:8+recoil*14,yaw:-26,claw:1.05,spread:0},k);
    P.arms.L=lerpObj(P.arms.L,{pitch:80+recoil*14,abd:-8,elbow:34,yaw:40,claw:.85,spread:.2},k);
    P.ch=lerpObj(P.ch,[2-recoil*5,0,-4],k);P.neck=lerpObj(P.neck,[2,0,4],k);
  }
  return P;
}
function lowArms(P,v,b=0){// arma baixa, pronta
  if(v.weapon==='longa'){P.arms.R={pitch:30+2*b,abd:24,elbow:78,yaw:-30,claw:1.05,spread:0};P.arms.L={pitch:52+2*b,abd:-2,elbow:46,yaw:30,claw:.8,spread:.2};}
  else{P.arms.R={pitch:26+3*b,abd:8,elbow:30,yaw:-10,claw:1.05,spread:0};P.arms.L={pitch:12+2*b,abd:10,elbow:20,yaw:4,claw:.45,spread:.1};}
  return P;
}
function legsWalk(P,ph,amp=1){const s=Math.sin(ph),c=Math.cos(ph);
  P.legs.L={swing:26*s*amp,abd:3,knee:6+34*Math.pow(Math.max(0,c),1.3)*amp,yaw:-2,ankle:-8*s*amp};
  P.legs.R={swing:-26*s*amp,abd:3,knee:6+34*Math.pow(Math.max(0,-c),1.3)*amp,yaw:2,ankle:8*s*amp};
  P.root.roll=2.5*s*amp;P.root.z=1.2*Math.abs(Math.cos(ph))*amp-1.2*amp;return P;}
TYPE_POSE.sobrevivente={
  idle(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=BASE();
    P.legs.L={swing:3,abd:7,knee:6,yaw:-8,ankle:0};P.legs.R={swing:-3,abd:7,knee:6,yaw:10,ankle:0};
    P.root.roll=1.2*b;P.sp=[1+b,0,0];P.ch=[1+1.5*b,0,2];P.neck=[0,0,3*Math.sin(ph*.5)];P.head=[1+b,3*Math.sin(ph)];
    lowArms(P,v,b);P.jaw=2;P.sway=b*.3;return P;},
  walk(u,v){const ph=u*Math.PI*2;const P=BASE();legsWalk(P,ph,.85);P.root.yaw=3*Math.sin(ph);P.sp=[3,0,0];P.ch=[2,0,-3*Math.sin(ph)];
    aimArms(P,v,1);P.arms.R.pitch+=1.5*Math.sin(2*ph);P.arms.L.pitch+=1.5*Math.sin(2*ph);P.jaw=1;P.sway=-Math.sin(ph)*.5;return P;},
  aim(u,v){const ph=u*Math.PI*2;const P=TYPE_POSE.sobrevivente.idle(u,v);aimArms(P,v,1);P.legs.L.swing=8;P.legs.R.swing=-10;P.legs.R.knee=12;P.ch[0]+=.6*Math.sin(ph);return P;},
  run(u,v){const ph=u*Math.PI*2,s=Math.sin(ph);const P=BASE();
    P.legs.L={swing:46*s,abd:3,knee:14+70*Math.pow(Math.max(0,Math.cos(ph)),1.2),yaw:-2,ankle:-14*s};
    P.legs.R={swing:-46*s,abd:3,knee:14+70*Math.pow(Math.max(0,-Math.cos(ph)),1.2),yaw:2,ankle:14*s};
    P.root.z=2.4*Math.abs(Math.sin(ph))-1.6;P.root.roll=3*s;P.root.yaw=6*s;P.sp=[12,0,0];P.ch=[8,0,-8*s];P.neck=[-6,0,6*s];P.head=[-4,0];
    if(v.weapon==='longa'){P.arms.R={pitch:34-10*s,abd:20,elbow:84,yaw:-34,claw:1.05};P.arms.L={pitch:58+10*s,abd:-2,elbow:50,yaw:30,claw:.8};}
    else{P.arms.R={pitch:20+44*s,abd:10,elbow:70-10*s,yaw:-6,claw:1.05};P.arms.L={pitch:20-44*s,abd:10,elbow:70+10*s,yaw:6,claw:.6};}
    P.jaw=8;P.sway=-s;return P;},
  shoot(u,v){const P=TYPE_POSE.sobrevivente.aim(0,v);const r=u<.25?sstep(0,.25,u):sstep(1,.25,u);aimArms(P,v,1,r*(v.weapon==='longa'?1.4:1));
    P.root.f=-r*(v.weapon==='longa'?2.2:1.2);P.sp[0]-=r*3;P.flash=u<.34?1-u/.34:0;return P;},
  reload(u,v){const P=TYPE_POSE.sobrevivente.idle(0,v);const long=v.weapon==='longa';
    // 0–.25 arma inclina e solta o carregador; .25–.55 mão esquerda busca novo no cinto; .55–.8 encaixa; .8–1 puxa o ferrolho e volta
    const tilt=sstep(0,.2,u)*sstep(1,.85,u);
    P.arms.R={pitch:(long?44:58)+8*tilt,abd:long?22:4,elbow:(long?80:58)+10*tilt,yaw:long?-30:-26,claw:1.05};
    const reach=sstep(.22,.4,u)*sstep(.62,.45,u),insert=sstep(.5,.65,u)*sstep(.85,.75,u),rack=sstep(.78,.86,u)*sstep(1,.9,u);
    P.arms.L={pitch:lerp(lerp(56,4,reach),70,insert)+rack*18,abd:lerp(-2,22,reach)+rack*6,elbow:lerp(lerp(70,18,reach),60,insert)-rack*30,yaw:lerp(30,-6,reach)+insert*6,claw:lerp(.5,1.1,reach+insert),spread:0};
    P.ch=[4+4*tilt,0,-6*tilt+8*reach];P.neck=[8*tilt,0,-6*reach];P.head=[14*tilt+6*reach,-8*tilt];P.mag=reach>.2?1:0;return P;},
  hit(u,v,std){const k0=TYPE_POSE.sobrevivente.aim(0,v);const k=sstep(0,.25,u)*sstep(1,.4,u);
    const P=lerpObj(k0,{root:{f:-3,pitch:-6},sp:[-6,0,6],ch:[-12,0,10],neck:[-10,0,0],head:[-14,12]},k);
    P.arms.L=lerpObj(P.arms.L,{pitch:40,abd:30,elbow:50},k);P.sway=1.2*k;return P;},
  death(u,v){const k0=TYPE_POSE.sobrevivente.aim(0,v);
    const jolt=lerpObj(k0,{root:{f:-3,pitch:-8},sp:[-8,0,8],ch:[-16,0,14],neck:[-16,0,0],head:[-20,16],arms:{L:{pitch:40,abd:50,elbow:40,claw:.4},R:{pitch:50,abd:40,elbow:30,claw:.7}}},1);
    const knees=lerpObj(jolt,{root:{f:2,pitch:10,roll:6,z:-12},sp:[10,0,4],ch:[16,0,6],neck:[10,0,0],head:[10,10],
      legs:{L:{swing:60,abd:8,knee:110},R:{swing:50,abd:10,knee:100}},arms:{L:{pitch:20,abd:20,elbow:40},R:{pitch:30,abd:20,elbow:40}}},1);
    const fall=lerpObj(knees,{root:{f:8,pitch:70,roll:10,z:-14},sp:[4,0,0],ch:[4,0,0],neck:[-10,0,14],head:[-12,26],
      legs:{L:{swing:30,abd:8,knee:50},R:{swing:22,abd:12,knee:40}},arms:{L:{pitch:120,abd:40,elbow:30},R:{pitch:96,abd:56,elbow:24}}},1);
    const down=lerpObj(fall,{root:{f:10,pitch:88,roll:8,z:-14},neck:[-14,0,30],head:[-10,40],legs:{L:{swing:6,abd:10,knee:16,yaw:-14},R:{swing:2,abd:14,knee:22,yaw:20}},arms:{L:{pitch:160,abd:50,elbow:16,claw:.3},R:{pitch:20,abd:60,elbow:30,claw:.5}}},1);
    const P=keys([[0,k0],[.14,jolt],[.4,knees],[.7,fall],[.85,down],[1,down]],u);P.sway=0;return P;},
  special(u,v){// ACELERAR: respira fundo, abaixa o corpo, bate no peito e arranca
    const k0=TYPE_POSE.sobrevivente.idle(0,v);
    const breathe=lerpObj(k0,{sp:[-4,0,0],ch:[-10,0,0],neck:[-6,0,0],head:[-14,0]},1);
    const coil=lerpObj(k0,{root:{z:-6,f:-2},sp:[18,0,0],ch:[16,0,0],neck:[-10,0,0],head:[-10,0],legs:{L:{swing:30,abd:6,knee:70},R:{swing:-34,abd:6,knee:44,ankle:20}},
      arms:{L:{pitch:96,abd:-10,elbow:110,yaw:40,claw:1.1},R:{pitch:30,abd:20,elbow:70}}},1);
    const launch=TYPE_POSE.sobrevivente.run(.25,v);
    const P=keys([[0,k0],[.25,breathe],[.55,coil],[.8,launch],[1,launch]],u);P.burst=sstep(.6,.85,u);return P;},
};
const _pose0=pose;
pose=function(anim,u,v){
  if(!v.alive)return _pose0(anim,u,v);
  const tp=TYPE_POSE.sobrevivente[anim]||TYPE_POSE.sobrevivente.idle;const P=tp(u,v,(a,uu)=>TYPE_POSE.sobrevivente[a](uu,v));
  P.face=survivorFace(anim,u,P);P.t=u;
  for(const sd of['L','R']){const A=P.arms[sd];if(A.claw==null)A.claw=.5;if(A.spread==null)A.spread=0;}
  return P;
};
TYPES.sobrevivente={name:'Sobrevivente',tint:'#d8b07a',variants:['antonio','antonioLonga'],old:'survivor',game:{radius:14,size:1},
  cell:{w:140,h:150,ground:126,scale:1.0},
  anims:{idle:{frames:6,fps:5,loop:true,label:'Parado'},aim:{frames:6,fps:5,loop:true,label:'Mirando'},walk:{frames:8,fps:10,loop:true,label:'Andar mirando'},
    run:{frames:8,fps:13,loop:true,label:'Correr'},shoot:{frames:4,fps:16,loop:false,label:'Atirar'},reload:{frames:10,fps:9,loop:false,label:'Recarregar'},
    hit:{frames:4,fps:12,loop:false,label:'Levar dano'},death:{frames:10,fps:9,loop:false,label:'Morrer'},special:{frames:10,fps:10,loop:false,label:'Habilidade · Acelerar'},
    attack:null,crawl:null}};
