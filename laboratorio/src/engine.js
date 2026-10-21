// ZLAB · motor de pintura volumétrica do Infectado (Olimpo · Afrodite + Ares)
// Esqueleto 3D → superfícies amostradas → splats iluminados, ordenados por profundidade.
const ZE=(()=>{
'use strict';
const D=Math.PI/180;
// ---------- matemática ----------
const mm=(a,b)=>{const r=new Array(9);for(let i=0;i<3;i++)for(let j=0;j<3;j++)r[i*3+j]=a[i*3]*b[j]+a[i*3+1]*b[3+j]+a[i*3+2]*b[6+j];return r;};
const mv=(m,v)=>[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];
const rx=a=>{const c=Math.cos(a*D),s=Math.sin(a*D);return[1,0,0,0,c,s,0,-s,c];};
const ry=a=>{const c=Math.cos(a*D),s=Math.sin(a*D);return[c,0,s,0,1,0,-s,0,c];};
const rz=a=>{const c=Math.cos(a*D),s=Math.sin(a*D);return[c,-s,0,s,c,0,0,0,1];};
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const scl=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len=a=>Math.hypot(a[0],a[1],a[2]);
const nrm=a=>{const l=len(a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sstep=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const mix3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const child=(f,off,rot)=>({o:add(f.o,mv(f.m,off)),m:rot?mm(f.m,rot):f.m});
const col=(m,i)=>[m[i],m[3+i],m[6+i]];

// ---------- ruído ----------
function h3(i,j,k){let h=(i*374761393+j*668265263+k*2147483647)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;}
function vn(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);let r=0;
  for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)r+=h3(xi+a,yi+b,zi+c)*(a?u:1-u)*(b?v:1-v)*(c?w:1-w);return r;}
const fbm=(x,y,z)=>vn(x,y,z)*.55+vn(x*2.1,y*2.1,z*2.1)*.3+vn(x*4.3,y*4.3,z*4.3)*.15;

// ---------- câmera (oblíqua 3/4, igual ao jogo) ----------
let CAM={K:.66,C:.9};
let V=nrm([0,.9,.66]);              // direção para a câmera
const LKEY=nrm([-.55,.42,.78]);       // luz principal (alto-esquerda)
const LRIM=nrm([.55,-.75,.45]);       // contraluz fria (lua)
let HALF=nrm(add(LKEY,V));
function setCam(elev){if(elev==null){CAM={K:.66,C:.9};V=nrm([0,.9,.66]);}else{const e=elev*D;CAM={K:Math.sin(e),C:Math.cos(e)};V=[0,Math.cos(e),Math.sin(e)];}HALF=nrm(add(LKEY,V));}

// ---------- variações ----------
const VARIANTS={
  operario:{name:'Operário',code:'A',
    skin:'#9a7a5e',shirt:'#4f6577',shirt2:'#3b4b58',pants:'#3b4a63',pants2:'#2b3446',shoes:'#4a3526',hair:'#1d1714',
    sleeves:.62,hairStyle:'short',belt:true,boots:true,gait:{reach:'R',limp:'R',roll:7},wounds:{flank:true,forearmBite:true,forehead:true,kneeTear:true,neck:false},strip:true},
  executivo:{name:'Executivo',code:'B',
    skin:'#c2a48e',shirt:'#c9c4b6',shirt2:'#a29d90',pants:'#2c2c31',pants2:'#1f1f23',shoes:'#16120f',hair:'#8d8a85',
    sleeves:1,hairStyle:'bald',belt:true,tie:'#5b1d22',gait:{reach:'B',limp:'L',roll:-4},wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:true,chest:true},strip:false},
  paciente:{name:'Paciente',code:'C',
    skin:'#6f5242',shirt:'#8fa59a',shirt2:'#6e8479',pants:null,shoes:null,hair:'#2a1d16',
    sleeves:.32,hairStyle:'long',gown:true,gait:{reach:'L',limp:'L',roll:-9},wounds:{flank:true,forearmBite:false,forehead:false,kneeTear:false,neck:true,legs:true},strip:false},
};


// Pele necrosada: tom original apagado para cinza-esverdeado
const DEAD=hex('#6f7a66'),BRUISE=hex('#4d3540'),VEIN=hex('#3a2a3c'),BLOOD=hex('#3f0709'),BLOOD2=hex('#6a1114'),FLESH=hex('#6a2424'),BONE=hex('#d8ccb0'),DIRT=hex('#3b3226'),EYE=hex('#d9d6b8');

// ---------- materiais ----------
// cada material devolve [r,g,b,molhado,emissivo]
let SK=0;
function skinTone(v,q,extra=0){SK=1;
  const n=fbm(q[0]*.22+3,q[1]*.22,q[2]*.22);
  let c=mix3(v.skinC,DEAD,(v.deadMix!=null?v.deadMix:.42)+extra);
  c=mix3(c,BRUISE,sstep(.58,.78,n)*.55);
  const vein=Math.abs(vn(q[0]*.5,q[1]*.5+9,q[2]*.5)-.5);
  c=mix3(c,VEIN,sstep(.035,.0,vein)*.22);
  const grime=fbm(q[0]*.6,q[1]*.6+20,q[2]*.6);
  return mix3(c,DIRT,sstep(.55,.8,grime)*.35);
}
function cloth(base,shade,q,dirtLevel=0){SK=0;
  const n=fbm(q[0]*.35,q[1]*.35+40,q[2]*.35);
  let c=mix3(base,shade,sstep(.35,.75,n));
  const weave=(Math.sin(q[2]*3.1+q[0]*.4)*.5+.5)*.06;c=scl(c,1-weave);
  const d=fbm(q[0]*.25+7,q[1]*.25,q[2]*.25);
  return mix3(c,DIRT,clamp(sstep(.5,.85,d)*.55+dirtLevel,0,.85));
}
function blood(c,amount,q){
  if(amount<=0)return[c,0];
  const n=vn(q[0]*.9,q[1]*.9,q[2]*.9+5);
  const b=mix3(BLOOD,BLOOD2,n*.6);
  return[mix3(c,b,clamp(amount,0,1)),amount>.55?amount:0];
}
// Escorrimento: manchas que descem a partir de uma linha
function drip(q,topZ,strength,width=.35){
  const col=vn(q[0]*width,q[1]*width,1.3);
  const lenD=4+col*18;
  const d=topZ-q[2];
  if(d<0)return sstep(-1.5,0,d)*strength;
  return sstep(lenD,lenD*.4,d)*sstep(.35,.6,col)*strength;
}

function material(v,key,s){SK=0;
  if(v.alive){const r=aliveMat(v,key,s);if(r)return r;}
  const q=s.q;let c,wet=0,emi=0;
  const W=v.wounds;
  // ----- cabeça -----
  if(key==='head'){
    const e=s.e;// direção unitária local (x dir., y frente, z cima)
    c=skinTone(v,q,.05);
    // órbitas fundas e maçãs encovadas
    const front=e[1];
    const eyeL=Math.hypot(e[0]+.36,e[2]-.12),eyeR=Math.hypot(e[0]-.36,e[2]-.12);
    const sock=Math.min(eyeL,eyeR);
    if(front>.3){
      c=scl(c,1-sstep(.32,.12,sock)*.55);
      c=scl(c,1-sstep(.2,.0,Math.abs(e[2]+.18))*sstep(.3,.6,Math.abs(e[0]))*.18);
      if(sock<.1&&front>.6){const iris=sstep(.1,.045,sock);c=mix3(c,EYE,iris*.85);emi=iris*.55;
        if(sock<.028)c=mix3(c,[96,92,74],.6);}
      // boca: fenda escura, lábios rachados, dentes amarelados aparecendo
      const my=e[2]+.5,mw=Math.abs(e[0]);
      if(front>.62&&mw<.27){
        const lip=sstep(.085,.05,Math.abs(my))*sstep(.27,.18,mw);
        if(lip>0)c=mix3(c,[88,46,44],lip*.7);
        const open=sstep(.045,.02,Math.abs(my))*sstep(.25,.15,mw);
        if(open>0){c=mix3(c,[26,10,10],open);wet=Math.max(wet,open*.35);
          if(my>.0&&my<.035&&((mw*34)|0)%2===0)c=mix3(c,[150,132,98],open*.8);}
      }
      // sangue seco no queixo, escorrendo
      const chin=sstep(-.4,-.62,e[2])*sstep(.25,.65,front);
      const dripc=sstep(.45,.75,vn(e[0]*9,3,1))*sstep(-.45,-.8,e[2]);
      const mb=Math.max(chin*.55*sstep(.4,.1,mw),dripc*.8)*(.6+.4*vn(q[0]*1.3,q[1],q[2]));
      if(mb>0){const r=blood(c,mb,q);c=r[0];wet=Math.max(wet,r[1]*.6);}
      if(W.forehead){const g=sstep(.1,.02,Math.abs((e[2]-.62)-(e[0]-.1)*.6))*sstep(.38,.2,Math.abs(e[0]+.05));if(g>0){c=mix3(c,FLESH,g);wet=Math.max(wet,g*.8);}}
    }
    // cabelo
    const hs=v.hairStyle;let hair=0;
    const tuft=vn(q[0]*.9,q[1]*.9,q[2]*.9+60);
    if(hs==='short')hair=sstep(.1,.24,e[2]+(front>0?-.38+front*.0:0)+tuft*.12-(front>.2?front*.35:0)+(front<-.1?.5:0));
    if(hs==='bald'){const ring=e[2]>-.4&&e[2]<.3&&front<.2;hair=ring?sstep(.0,.2,.3-e[2]+tuft*.15)*sstep(-.4,-.15,e[2])*sstep(.2,-.2,front)*(.45+tuft*.6):0;}
    if(hs==='long')hair=sstep(.0,.2,e[2]+tuft*.15-(front>.2?front*.55:0)+(front<0?.9:0)+.1);
    if(hair>0){const hc=mix3(v.hairC,scl(v.hairC,.55),tuft);c=mix3(c,hc,clamp(hair,0,1)*.95);if(hs==='bald')c=mix3(c,v.hairC,hair*.3);}
    return[...c,wet,emi];
  }
  if(key==='jaw'){
    const e=s.e;c=skinTone(v,q,.08);
    if(e[2]>.55&&e[1]>.35){c=mix3(c,[146,128,96],.75);}            // dentes inferiores
    else if(e[2]>.2&&e[1]>.1){c=mix3(c,[40,14,14],.85);wet=.35;}      // gengiva
    const r=blood(c,sstep(.1,.8,e[1])*sstep(.3,-.4,e[2])*.6,q);return[...r[0],Math.max(wet,r[1]*.6),0];
  }
  if(key==='nose'){c=skinTone(v,q,.02);c=scl(c,.92);const r=blood(c,s.e[2]<-.3?.6:0,q);return[...r[0],r[1],0];}
  if(key==='earL'||key==='earR'){const e=s.e;c=scl(skinTone(v,q,.1),.85);const out=(key==='earR'?e[0]:-e[0]);if(out>.2){const r=Math.hypot(e[1]*.9,e[2]);c=mix3(c,[54,34,36],sstep(.75,.35,r)*.8);if(r>.82)c=scl(c,1.08);}return[...c,0,0];}
  if(key==='neck'){
    c=skinTone(v,q,.06);
    if(W.neck){const bite=sstep(2.6,.8,Math.hypot(s.cx-1.6,s.cy*1.0-.4,0)+(s.t-.45)*6*0);const g=sstep(.55,.2,Math.hypot((s.t-.5)*1.6,Math.sin(s.th-(v.code==='B'?.6:2.4))*1.2));
      if(g>0){c=mix3(c,FLESH,g);wet=g;}}
    const r=blood(c,drip(q,8,.7,.5)*(Math.sin(s.th)>-.2?1:0),q);
    return[...r[0],Math.max(wet,r[1]),0];
  }
  // ----- tronco -----
  if(key==='torso'){
    const ph=s.phi,fr=Math.sin(ph),sd=Math.cos(ph),z=s.zs;// zs: 0 (quadril) → 1 (pescoço)
    if(v.gown){
      c=cloth(v.shirtC,v.shirt2C,q,.05);
      const dots=(Math.sin(q[0]*1.4)*Math.sin(q[2]*1.4))>.82?1:0;c=scl(c,1-dots*.07);
      // costas abertas
      if(fr<-.82&&z>.12){const g=sstep(.95,.82,-fr);c=mix3(skinTone(v,q,.05),c,g*.0);}
    }else if(v.shirtless){
      c=skinTone(v,q,.06);
      if(v.bloat){// pele esticada: estrias e veias de gás brilhando por baixo
        const st=Math.abs(Math.sin(q[2]*1.6+q[0]*.25+vn(q[0]*.3,q[1]*.3,q[2]*.3)*3));if(st<.05&&z<.6&&fr>-.2)c=mix3(c,[118,86,92],.3);c=mix3(c,[86,70,74],sstep(.55,.85,fbm(q[0]*.2,q[1]*.2+5,q[2]*.2))*.45);
        const vein=Math.abs(vn(q[0]*.32,q[1]*.32,q[2]*.32+7)-.5);const vg=sstep(.025,0,vein)*sstep(.75,.25,z)*.8;
        if(vg>0){c=mix3(c,[255,150,70],vg*.8);s._emi=vg*.6;}
        }
      else if(v.ribs){const rib=Math.pow(Math.abs(Math.sin(z*30)),3)*sstep(.32,.45,z)*sstep(.8,.68,z)*sstep(-.5,.2,Math.abs(sd)-.05);c=scl(c,1-rib*.42);c=scl(c,1-sstep(.35,.15,z)*sstep(.3,.8,fr)*.25);
        const sp=Math.pow(Math.abs(Math.sin(z*42)),6)*sstep(-.85,-.98,fr);c=scl(c,1+sp*.25);}
      else{const mus=Math.pow(Math.abs(Math.sin(ph*3.2+.4)),5)*sstep(.4,.85,z)*sstep(.1,.7,fr);c=scl(c,1-mus*.18);}// peitoral e abdômen marcados
    }else c=cloth(v.shirtC,v.shirt2C,q,0);
    if(v.overalls){// jardineira: peitilho na frente, alças cruzando os ombros
      const bib=fr>.25&&z<.78&&Math.abs(Math.cos(ph))<.55;const strap=z>.6&&Math.abs(Math.abs(Math.cos(ph))-.42)<.07;
      if(bib||strap||z<.2){c=cloth(v.pantsC,v.pants2C,q,.08);if(strap||(bib&&z>.74))c=scl(c,.82);if(bib&&Math.abs(z-.6)<.025)c=mix3(c,[180,170,150],.5);}}
    // gola e decote
    if(!v.shirtless&&z>.9){c=scl(c,.86);}
    if(!v.shirtless&&z>.93&&fr>.55){c=skinTone(v,q,.05);}
    // calça/cinto na base
    if(!v.gown&&z<.12&&v.pantsC){c=cloth(v.pantsC,v.pants2C,q,.05);if(v.belt&&z>.07)c=mix3(c,[36,26,20],.85);}
    // gravata
    if(v.tie&&fr>.6&&z>.38&&z<.93){const off=Math.cos(ph)+.04;const w=lerp(.05,.11,(z-.38)/.55);
      if(Math.abs(off)<w){c=mix3(v.tieC,[30,10,12],vn(q[0],q[1],q[2])*.4);if(Math.abs(off)>w*.8)c=scl(c,.75);}}
    // botões / vista da camisa
    if(!v.gown&&fr>.9&&Math.abs(Math.cos(ph))<.04&&z>.12&&z<.9){c=scl(c,.82);if(((z*14)|0)%3===0)c=mix3(c,[220,214,200],.5);}
    // sangue do queixo escorrendo no peito
    let bl=0;
    if(fr>.1)bl=Math.max(bl,drip(q,(v.code==='C'?5:9)+vn(q[0]*.4,0,3)*4,.95,.45)*sstep(.1,.5,fr));
    if(W.chest&&fr>0)bl=Math.max(bl,sstep(.32,.1,Math.hypot(sd-.35,(z-.62)*1.6))*.95);
    // ferida no flanco (costelas expostas)
    if(W.flank){const fx=Math.hypot((ph-(Math.PI*.82))*1.1,(z-.5)*2.4);
      const ragged=fx+(vn(q[0]*1.2,q[1]*1.2,q[2]*1.2)-.5)*.16;
      if(ragged<.36){const g=sstep(.36,.26,ragged);c=mix3(c,[48,30,26],g*.85);
        if(ragged<.25){c=mix3(FLESH,[40,10,12],vn(q[0]*2,q[1]*2,q[2]*2)*.6);wet=.6;const rib=Math.sin(z*44+vn(q[0],q[1],q[2])*2)>.8;if(rib&&ragged<.18)c=mix3(c,[150,130,104],.55);}}}
    // camisa rasgada mostrando pele
    if(!v.gown&&!v.shirtless){const tear=fbm(q[0]*.5+11,q[1]*.5,q[2]*.5);if(tear>(v.torn?.6:.74)&&z>.15&&z<.85&&!(v.overalls&&fr>.25)){c=skinTone(v,q,.08);c=scl(c,.8);}}
    if(v.gown){bl=Math.max(bl,sstep(.62,.8,fbm(q[0]*.3+2,q[1]*.3,q[2]*.3))*.85);}
    const r=blood(c,bl,q);
    return[...r[0],Math.max(wet,r[1]),s._emi||0];
  }
  if(key==='skirt'){// avental do paciente
    c=cloth(v.shirtC,v.shirt2C,q,.08);const r=blood(c,sstep(.6,.8,fbm(q[0]*.3,q[1]*.3+3,q[2]*.3))*.8+sstep(.6,1,s.zs)*.2,q);
    return[...r[0],r[1],0];
  }
  // ----- braços -----
  if(key==='uarmL'||key==='uarmR'){
    const sl=v.sleeves; // fração do braço superior coberta (>1 = cobre até antebraço)
    const edge=sl+(vn(q[0]*.8,q[1]*.8,q[2]*.8)-.5)*.12;
    if(s.t<edge||sl>=1){c=cloth(v.shirtC,v.shirt2C,q,.03);if(v.sleeves<1&&v.sleeves>.5&&Math.abs(s.t-edge)<.12)c=scl(c,.8);}// manga dobrada
    else c=skinTone(v,q,0);
    return[...c,0,0];
  }
  if(key==='farmL'||key==='farmR'){
    if(v.sleeves>=1&&s.t<.82){c=cloth(v.shirtC,v.shirt2C,q,.08);if(s.t>.74)c=scl(c,.8);}
    else c=skinTone(v,q,0);
    let w=0;
    if(W.forearmBite&&key==='farmL'){const g=sstep(.45,.2,Math.hypot((s.t-.45)*2,Math.sin(s.th-1.2)));if(g>0){c=mix3(c,FLESH,g);w=g;}
      if(g>.2&&((s.th*6)|0)%2)c=mix3(c,[40,10,10],.5);}
    const r=blood(c,s.t>.7?sstep(.7,1,s.t)*.55:0,q);
    return[...r[0],Math.max(w,r[1]),0];
  }
  if(key==='handL'||key==='handR'){
    const e=s.e;c=skinTone(v,q,.1);
    if(e[1]>0){// dorso: tendões e veias saltadas
      const ten=Math.pow(Math.abs(Math.sin(e[0]*5.2+.4)),6)*sstep(-.6,.6,e[2]);c=scl(c,1+ten*.12);
      const vein=Math.abs(vn(e[0]*2.5,e[2]*2.5,21)-.5);c=mix3(c,[56,46,70],sstep(.03,0,vein)*.45);
    }else{// palma mais escura e suja, vincos
      c=mix3(c,DIRT,.3);const cr=Math.abs(Math.sin(e[2]*7+e[0]*3));if(cr<.12)c=scl(c,.75);}
    const r=blood(c,sstep(.3,1,e[2])*.3+(e[1]<0?.15:0),q);return[...r[0],r[1]*.5,0];
  }
  if(key.startsWith('px')||key.startsWith('pt')){
    const j=+key[key.length-1];c=skinTone(v,q,.12);
    const dors=Math.cos(s.th);// 1 = dorso do dedo
    if(dors>.3&&s.t<.2&&j<2)c=mix3(c,[70,52,56],sstep(.2,0,s.t)*.6*sstep(.3,.9,dors));// nós enrugados
    if(dors>.2&&s.cap===-1)c=mix3(c,[78,58,58],.45);
    let wet=0;
    if(j===2&&v.claws){// garra de osso: a falange vira uma lâmina curva
      const k=sstep(.18,.5,s.t);c=mix3(c,mix3([206,196,172],[120,108,90],sstep(.2,1,s.t)*.5+vn(q[0]*5,q[1]*5,q[2]*5)*.3),k);
      if(s.t>.9||s.cap===1)c=mix3(c,[70,30,26],.55);return[...c,.35*k,0];}
    if(j===2){// unha: rachada, amarelada, com sujeira e sangue por baixo
      const nail=dors>.35&&s.t>.15&&s.cap>=0;
      if(nail){c=mix3([150,134,104],[82,66,48],vn(q[0]*4,q[1]*4,q[2]*4)*.7);if(dors<.48||s.t<.22)c=scl(c,.55);if(s.t>.85||s.cap===1)c=mix3(c,[44,16,14],.7);wet=.35;
        if(Math.abs(vn(s.th*6,s.t*8,5)-.5)<.04)c=scl(c,.55);}
      const r=blood(c,Math.min(.4,sstep(.6,1,s.t)*.3*(nail?.4:1)+(s.cap===1?.12:0)),q);c=r[0];
    }
    return[...c,wet,0];
  }
  // ----- pernas -----
  if(key==='thighL'||key==='thighR'||key==='shinL'||key==='shinR'){
    const shin=key.startsWith('shin');
    if(!v.pantsC){// pernas nuas (paciente)
      c=skinTone(v,q,.06);
      if(W.legs){const g=sstep(.75,.88,fbm(q[0]*.4,q[1]*.4,q[2]*.4+key.length));c=mix3(c,BRUISE,g*.7);}
      if(shin)c=mix3(c,DIRT,sstep(.4,1,s.t)*.5);
      const r=blood(c,drip(q,30,.5,.6)*.5,q);return[...r[0],r[1],0];
    }
    if(v.shorts&&(shin||s.t>.5+(vn(s.th*2,1,2)-.5)*.08)){c=skinTone(v,q,.04);
      if(!shin){const mus=Math.pow(Math.abs(Math.sin(s.th*2+.5)),4);c=scl(c,1-mus*.12);}
      if(shin&&s.t>.85)c=mix3(c,[200,196,186],.85);// meia
      const r=blood(c,drip(q,26,.4,.6)*.4,q);return[...r[0],r[1],0];}
    c=cloth(v.pantsC,v.pants2C,q,shin?sstep(.3,1,s.t)*.45:.0);
    const fold=Math.sin(q[2]*1.25+vn(q[0]*.6,q[1]*.6,q[2]*.3)*5);c=scl(c,1-sstep(.55,1,fold)*.16+sstep(.7,1,-fold)*.05);
    if(!shin&&s.t>.82)c=scl(c,.86);
    // desbotado na frente da coxa (jeans)
    if(v.code==='A'&&!shin)c=mix3(c,[110,128,150],sstep(.3,.9,Math.sin(s.th))*.25*(1-Math.abs(s.t-.5)));
    if(W.kneeTear&&key==='thighR'&&s.t>.78&&Math.sin(s.th)>.4){c=skinTone(v,q,.1);const r=blood(c,.5,q);return[...r[0],r[1],0];}
    if(W.kneeTear&&key==='shinR'&&s.t<.12&&Math.sin(s.th)>.4){c=skinTone(v,q,.1);}
    return[...c,0,0];
  }
  if(key==='stumpL'||key==='stumpR'){c=FLESH.slice();const r=blood(c,.8,q);return[...r[0],.9,0];}
  if(key==='footL'||key==='footR'){
    if(!v.shoesC){c=skinTone(v,q,.1);c=mix3(c,DIRT,.45);return[...c,0,0];}
    c=mix3(v.shoesC,scl(v.shoesC,.6),vn(q[0]*.5,q[1]*.5,q[2]*.5));
    if(s.e[2]<-.55)c=scl(c,.5);// sola
    if(v.boots)c=mix3(c,DIRT,sstep(.4,.8,fbm(q[0]*.5,q[1]*.5,q[2]*.5))*.6);
    if(v.sneakers){if(s.e[2]<-.4)c=[210,206,198];if(Math.abs(s.e[2]+.1)<.08&&s.e[1]>-.3)c=[160,60,40];c=mix3(c,DIRT,sstep(.5,.85,fbm(q[0]*.5,q[1]*.5,q[2]*.5))*.5);}
    const spec=v.code==='B'?.25:0;
    return[...c,spec,0];
  }
  if(key==='strip'){c=cloth(v.shirtC,v.shirt2C,q,.2);c=scl(c,.85);const r=blood(c,s.t*.6,q);return[...r[0],r[1],0];}
  if(key==='tieEnd'){c=mix3(v.tieC,[30,10,12],vn(q[0],q[1],q[2])*.4);if(Math.abs(Math.cos(s.th))>.85)c=scl(c,.75);return[...c,0,0];}
  if(key.startsWith('lock')){c=mix3(v.hairC,scl(v.hairC,.6),vn(q[0],q[1],q[2]));return[...c,0,0];}
  return[200,0,200,0,0];
}

// ---------- geometria das partes (repouso) ----------
const SEG={// raios em unidades (altura total ≈ 100)
  uarm:{L:16,ra:4.2,rb:3.3},farm:{L:15,ra:3.3,rb:2.5},
  thigh:{L:22,ra:6.4,rb:4.6},shin:{L:21.5,ra:4.6,rb:3.2},
  neck:{L:6.5,ra:3.6,rb:3.2},finger:{L:4.4,ra:.72,rb:.5},thumb:{L:3.2,ra:.8,rb:.6},strip:{L:11,ra:1.5,rb:.6},tieEnd:{L:9,ra:1.6,rb:2.0},lock:{L:13,ra:1.4,rb:.5},stump:{L:3,ra:4.8,rb:4.0},
};
// mão (Proko: palma ≈ dedo médio; falanges pela metade; arco dos nós com o médio mais à frente)
const FING=[{k:.92,r:.95},{k:1,r:1},{k:.96,r:.95},{k:.78,r:.84}];
const HK=1.22;// mão um pouco maior que a real: braços também são robustos para leitura no jogo
const PHL=[2.6*HK,1.6*HK,1.12*HK];
FING.forEach((f,i)=>PHL.forEach((L,j)=>{SEG['ph'+i+j]={L:L*f.k,ra:(.58-j*.06)*f.r*HK,rb:(.52-j*.09)*f.r*HK};}));
[[2.2,.66,.6],[1.75,.6,.52],[1.4,.52,.42]].forEach(([L,ra,rb],j)=>{SEG['pt'+j]={L:L*HK,ra:ra*HK,rb:rb*HK};});
const PALM=5.6*HK;
const TORSO=[// [frame, z, wx, wf, cy]
  [0,-7,10.8,7.6,-.6],[0,-1,11.6,7.4,-.4],[1,0,10.6,6.6,0],[1,6,11.4,7.0,.2],
  [2,0,13.2,7.6,.4],[2,5,15.0,7.4,.2],[2,8.5,13.4,6.6,-.2],[2,10.6,8.2,5.2,0],[2,11.6,4.4,3.6,.4]];
const GOWN=[[0,-1,12.2,8.4,0],[0,-8,13.4,9.4,-.2],[0,-15,14.6,10.4,-.4],[0,-22,15.6,11.2,-.6]];

// ---------- proporções por variação ----------
function initVariant(k_,v){
  v.key=k_;v.type=v.type||'comum';
  for(const k of['skin','shirt','shirt2','pants','pants2','shoes','hair','tie','hood','glowc'])if(v[k])v[k+'C']=hex(v[k]);
  const B=v.B=Object.assign({k:1,arm:1,armR:1,leg:1,legR:1,neck:1,neckR:1,head:1,hand:1,finger:1,shoulder:1,hip:1,spine:1,tw:1,tf:1,chest:1,belly:0,jaw:JAW_DEG},v.B||{});
  const S2={};for(const[n,g]of Object.entries(SEG))S2[n]={...g};
  const sc=(n,L,R)=>{if(S2[n]){S2[n].L*=L;S2[n].ra*=R;S2[n].rb*=R;}};
  sc('uarm',B.arm,B.armR);sc('farm',B.arm,B.armR*(B.forearmR||1));sc('thigh',B.leg,B.legR);sc('shin',B.leg,B.legR);sc('stump',1,B.legR);sc('neck',B.neck,B.neckR);
  for(const n in S2)if(/^ph|^pt/.test(n))sc(n,B.hand*(n.startsWith('ph')?B.finger:1),B.hand);
  if(B.clawLen){for(let i=0;i<4;i++){const g=S2['ph'+i+'2'];g.L*=B.clawLen;g.ra*=1.1;g.rb*=.3;}const t2=S2['pt2'];t2.L*=B.clawLen*.85;t2.rb*=.25;}
  if(B.armRk){S2.uarmR={...S2.uarm};S2.farmR={...S2.farm};S2.uarmR.L*=B.armRk[0];S2.uarmR.ra*=B.armRk[1];S2.uarmR.rb*=B.armRk[1];S2.farmR.L*=B.armRk[0];S2.farmR.ra*=B.armRk[2];S2.farmR.rb*=B.armRk[2];}
  v.SEG=S2;v.PALM=PALM*B.hand;
  v.TORSO=TORSO.map(([f,z,wx,wf,cy])=>{const up=f===2?B.chest:1;let bx=wx*B.tw*up,bf=wf*B.tf*(f===2?(1+(B.chest-1)*.6):1),bc=cy;
    if(B.belly&&(f===1||(f===0&&z>-3)||(f===2&&z<3))){const k=f===1?1:.55;bx+=B.belly*.55*k;bf+=B.belly*k;bc+=B.belly*.55*k;}
    return[f,z*B.spine,bx,bf,bc];});
  v.GOWN=(v.robe?ROBE:GOWN).map(([f,z,wx,wf,cy])=>[f,z,wx*B.tw+(B.belly||0)*.3,wf*B.tf+(B.belly||0)*.5,cy]);
}
const ROBE=[[0,-1,12.4,8.6,0],[0,-10,13.6,9.6,-.2],[0,-20,14.8,10.6,-.4],[0,-30,15.8,11.4,-.6],[0,-41,16.6,12,-.8]];
function partList(v){
  const L=[];
  const seg=(key,type)=>L.push({key,kind:'seg',type});
  const ell=(key,r)=>L.push({key,kind:'ell',r});
  L.push({key:'torso',kind:'loft',secs:v.TORSO,cap:true});
  if(v.gown)L.push({key:'skirt',kind:'loft',secs:v.GOWN,cap:false,open:true});
  seg('neck','neck');
  L.push({key:'face',kind:'face'});const hs=v.B.head;if(!v.noEars){ell('earL',[.6*hs,1.15*hs,1.95*hs]);ell('earR',[.6*hs,1.15*hs,1.95*hs]);}
  for(const sd of['L','R']){
    const asy=v.SEG['uarm'+sd]?sd:'';seg('uarm'+sd,'uarm'+asy);seg('farm'+sd,'farm'+asy);
    if(!(v.fused&&v.fused===sd)){const hk=v.B.hand*(sd==='R'&&v.B.handRk?v.B.handRk:1);ell('hand'+sd,[2.3*HK*hk,.95*HK*hk,3.05*HK*hk]);for(let f=0;f<4;f++)for(let j=0;j<3;j++)seg('px'+sd+f+j,'ph'+f+j);for(let j=0;j<3;j++)seg('pt'+sd+j,'pt'+j);}
    seg('thigh'+sd,'thigh');seg('shin'+sd,'shin');{const fk=v.B.foot||1;ell('foot'+sd,v.shoesC?[3.3*fk,5.8*fk,2.5*fk]:[2.8*fk,5.2*fk,1.9*fk]);}
    seg('stump'+sd,'stump');
  }
  if(v.strip)seg('strip','strip');
  if(v.tie)seg('tieEnd','tieEnd');
  if(v.hairStyle==='long')for(let i=0;i<7;i++)seg('lock'+i,'lock');
  (v.extras||[]).forEach((x,i)=>L.push(x.seg?{key:'x'+i,kind:'seg',type:'xs'+i,extra:x}:{key:'x'+i,kind:'ell',r:x.r,extra:x}));
  return L;
}

// Amostragem estável (coordenadas próprias de cada parte → material fixo)
function buildTemplate(v,spacing,opts={}){
  const all=partList(v);
  const parts=opts.only?all.filter(p=>opts.only.some(o=>p.key.startsWith(o))):all;
  const fullSpacing=spacing;
  for(const p of parts){
    const isHand=/^(hand|px|pt)/.test(p.key),isFace=p.key==='face'||p.key.startsWith('ear');
    spacing=isFace?(opts.face||fullSpacing*.5):isHand?(opts.hand||fullSpacing*.55):(opts.body||fullSpacing);
    p.sp=spacing;
    if(p.kind==='face'){p.F=buildFace(v,spacing);p.eyes=p.F.eyes;continue;}
    const S=[];// cada amostra: {params..., q, color}
    if(p.kind==='seg'){
      const g=v.SEG[p.type],ravg=(g.ra+g.rb)/2;
      const nt=Math.max(2,Math.ceil(g.L/spacing)+1),nth=Math.max(6,Math.ceil(2*Math.PI*ravg/spacing));
      for(let i=0;i<nt;i++)for(let j=0;j<nth;j++){
        const t=i/(nt-1),th=(j+(i%2)*.5)/nth*Math.PI*2,r=lerp(g.ra,g.rb,t);
        S.push({t,th,cap:0,q:[Math.cos(th)*r,Math.sin(th)*r,t*g.L+p.key.length*7]});
      }
      for(const end of[0,1]){const r=end?g.rb:g.ra;const nr=Math.max(2,Math.ceil(Math.PI/2*r/spacing));
        for(let i=1;i<=nr;i++){const al=i/nr*Math.PI/2,rr=Math.cos(al)*r;const n=Math.max(3,Math.ceil(2*Math.PI*rr/spacing));
          for(let j=0;j<n;j++){const th=j/n*Math.PI*2;S.push({t:end,th,cap:end?1:-1,al,q:[Math.cos(th)*rr,Math.sin(th)*rr,(end?g.L+Math.sin(al)*r:-Math.sin(al)*r)+p.key.length*7]});}}}
      p.seg=g;
    }else if(p.kind==='ell'){
      const[a,b,c]=p.r,rm=(a+b+c)/3;
      const nlat=Math.max(4,Math.ceil(Math.PI*rm/spacing));
      for(let i=0;i<=nlat;i++){const be=-Math.PI/2+i/nlat*Math.PI,cr=Math.cos(be);
        const n=Math.max(1,Math.ceil(2*Math.PI*rm*cr/spacing));
        for(let j=0;j<n;j++){const la=(j+(i%2)*.5)/n*Math.PI*2;const e=[cr*Math.cos(la),cr*Math.sin(la),Math.sin(be)];
          S.push({e,q:[e[0]*a+p.key.length*5,e[1]*b,e[2]*c]});}}
    }else if(p.kind==='loft'){
      const secs=p.secs;
      for(let k=0;k<secs.length-1;k++){
        const A=secs[k],B=secs[k+1];const FZ=[0,8*v.B.spine,20*v.B.spine];
        const dz=Math.abs((FZ[B[0]]+B[1])-(FZ[A[0]]+A[1]))*1.35,dw=Math.max(Math.abs(B[2]-A[2]),Math.abs(B[3]-A[3]));
        const ns=Math.max(1,Math.ceil(Math.hypot(dz,dw)*1.25/spacing));
        for(let i=0;i<ns;i++){const f=i/ns;const wx=lerp(A[2],B[2],f),wf=lerp(A[3],B[3],f);
          const per=Math.PI*(1.5*(wx+wf)-Math.sqrt(wx*wf));const n=Math.max(8,Math.ceil(per/spacing));
          for(let j=0;j<n;j++){const ph=(j+(i%2)*.5)/n*Math.PI*2;
            const zs=(k+f)/(secs.length-1);
            S.push({k,f,phi:ph,zs,q:[Math.cos(ph)*wx,Math.sin(ph)*wf,(k+f)*5+(p.key==='skirt'?-40:0)]});}}
      }
      if(p.cap){const T=secs[secs.length-1];const nr=Math.max(2,Math.ceil(Math.max(T[2],T[3])/spacing));
        for(let i=1;i<nr;i++){const rr=1-i/nr;const n=Math.max(4,Math.ceil(2*Math.PI*Math.max(T[2],T[3])*rr/spacing));
          for(let j=0;j<n;j++){const ph=j/n*Math.PI*2;S.push({k:secs.length-1,f:0,phi:ph,zs:1,capR:rr,q:[Math.cos(ph)*T[2]*rr,Math.sin(ph)*T[3]*rr,(secs.length-1)*5+1]});}}}
    }
    if(v.bump){const kind=p.extra?p.extra.mat:p.key;const e=.18;
      for(const s of S){const q=s.q;const H=(a,b,c)=>bumpH(v,kind,[a,b,c],s);
        s.g=[(H(q[0]+e,q[1],q[2])-H(q[0]-e,q[1],q[2]))/(2*e),(H(q[0],q[1]+e,q[2])-H(q[0],q[1]-e,q[2]))/(2*e),(H(q[0],q[1],q[2]+e)-H(q[0],q[1],q[2]-e))/(2*e)];}}
    for(const s of S){if(p.kind==='seg'){s.cx=s.q[0];s.cy=s.q[1];}const m=p.extra?extraMat(v,p.extra,s):material(v,p.key,s);s.c=[m[0],m[1],m[2],m[3],m[4],SK];s.j=.95+h3(s.q[0]*100|0,s.q[1]*100|0,s.q[2]*100|0)*.1;}
    p.S=S;
  }
  return{v,parts,spacing:fullSpacing};
}

// ---------- ROSTO (Afrodite) ----------
// Superfície da cabeça esculpida em coordenadas (u = ângulo horizontal a partir da frente, v = altura angular).
// Expressões por blendshape: [mandíbula, rosnado, testa franzida, olhos apertados, pálpebras caídas].
const HEADR=[6.0,7.4,8.4];
const g2=(du,dv,su,sv)=>Math.exp(-(du*du)/(su*su)-(dv*dv)/(sv*sv));
const EYE_U=.44,EYE_V=.1,EYE_HW=.215,EYE_HH=.066;
const MOUTH_V=-.47,MOUTH_HW=.24;
const JAW_DEG=26,HINGE=[0,1.2,-1.4];
function eyeHH(u){const du=(Math.abs(u)-EYE_U)/EYE_HW;if(Math.abs(du)>=1)return 0;return EYE_HH*Math.pow(1-du*du,.55)*(du<0?1.08:1);}
function eyeCenterV(u){const du=(Math.abs(u)-EYE_U)/EYE_HW;return EYE_V+du*.018;}// canto externo levemente mais alto
function inEye(u,v){const hh=eyeHH(u);return hh>0&&Math.abs(v-eyeCenterV(u))<hh;}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay;const t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(px-ax-dx*t,py-ay-dy*t);}
// relevo (unidades) em função de (u,v) e das expressões que mudam o relevo
let FV=null;// variação cujo rosto está sendo esculpido
function relief(u,v,X){
  const au=Math.abs(u),cu=Math.cos(u);let D=0;
  // microrrelevo da pele: poros e irregularidade (vale para a cabeça toda)
  D+=.03*(vn(u*20+9,v*20,3)-.5);
  if(cu<-.1)return D;
  const snarl=X[1],brow=X[2];
  D+=.6*g2(au-.3,v-.25,.3,.055);            // arcada supraciliar
  D-=1.25*g2(au-EYE_U,v-EYE_V,.2,.12);      // órbita funda
  D+=.62*g2(au-EYE_U,v-EYE_V,.16,.065);     // globo sob as pálpebras
  D-=.42*g2(au-EYE_U,v-(EYE_V-.11),.17,.045);// olheira cavada
  D+=.5*g2(au-.52,v+.03,.13,.08);           // maçã do rosto saltada
  D-=.7*g2(au-.4,v+.33,.15,.14);            // bochecha encovada
  D-=.45*g2(au-.88,v-.24,.14,.16);          // têmpora funda
  D+=1.0*g2(u,v-.02,.055,.17)+.5*g2(u,v+.1,.05,.08);// dorso do nariz
  if(FV&&FV.skullFace){// sem nariz: cavidade nasal exposta, maçãs e órbitas mais fundas, lábios finos
    D-=1.3*g2(u,v+.17,.075,.09)+.6*g2(au-.04,v+.2,.03,.06)+.6*g2(au-.5,v+.3,.15,.14)+.5*g2(au-EYE_U,v-EYE_V,.22,.13);D+=.5*g2(au-.52,v+.02,.12,.07);
    return D-.25*g2(u,v+.47,.25,.06);}
  D+=1.65*g2(u,v+.2,.078,.065);             // ponta do nariz
  D+=1.0*g2(au-.1,v+.24,.045,.045);         // asas do nariz
  D-=.8*g2(au-.058,v+.285,.024,.016);       // narinas
  D-=.28*g2(u,v+.36,.028,.045);             // filtro
  D+=.36*g2(u,v+.428,.19,.03);              // lábio superior
  D+=.34*g2(u,v+.512,.15,.03);              // lábio inferior
  D-=.3*g2(u,v-MOUTH_V,.25,.011);           // fenda da boca
  D+=.6*g2(u,v+.78,.2,.11);                 // queixo
  D-=.14*g2(u,v+.62,.12,.035);              // sulco mentolabial
  D+=.35*g2(au-.8,v+.45,.12,.13);           // ângulo da mandíbula
  // sulco nasolabial: aprofunda no rosnado
  const nl=segDist(au,v,.13,-.25,.25,-.44);D-=(.14+.3*snarl)*Math.exp(-(nl*nl)/(.02*.02));
  // rugas do nariz no rosnado
  D-=.18*snarl*g2(au-.07,v+.04,.045,.07)*(.5+.5*Math.sin(v*130));
  // vincos entre as sobrancelhas
  D-=.16*brow*g2(u,v-.21,.07,.06)*(.5+.5*Math.cos(u*95));
  // testa enrugada e pés de galinha (pele desidratada)
  D-=.07*(.5+.5*Math.sin(v*75+vn(u*6,1,1)*2))*g2(u,v-.55,.45,.14);
  D-=.06*(.5+.5*Math.sin(Math.atan2(v-EYE_V,au-EYE_U-.16)*14))*g2(au-EYE_U-.2,v-EYE_V,.07,.09);
  return D;
}
function headShape(u,v,X){
  const cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
  const low=sstep(-.15,-.95,v);
  const ax=HEADR[0]*(1-.1*low),by=HEADR[1]*(1-.05*low),cz=HEADR[2];
  const x=su*cv*ax,y=cu*cv*by,z=sv*cz;
  const n=nrm([x/(ax*ax),y/(by*by),z/(cz*cz)]);
  const D=relief(u,v,X);
  return[x+n[0]*D,y+n[1]*D,z+n[2]*D];
}
// deslizamento das regiões móveis (pálpebras, lábio, sobrancelha)
function warp(u0,v0,X){
  let u=u0,v=v0;const au=Math.abs(u0),sg=u0<0?-1:1;
  const snarl=X[1],brow=X[2],squint=X[3],close=X[4];
  const du=(au-EYE_U)/EYE_HW;
  if(Math.abs(du)<1.25&&(close>0||squint>0)){
    const fx=Math.max(0,1-du*du);const hh=EYE_HH*Math.pow(fx,.55)+.004;const c=eyeCenterV(u0);
    const top=c+hh,bot=c-hh;
    if(v0>=top-.002&&v0<top+.1){const f=1-(v0-top)/.1;v-=(close*2*hh*.92+squint*hh*.75)*f*f*(.25+.75*fx);}
    if(v0<=bot+.002&&v0>bot-.08){const f=1-(bot-v0)/.08;v+=(squint*hh*1.05+close*hh*.25)*f*f*(.25+.75*fx);}
  }
  const bw=g2(au-.17,v0-.29,.15,.075);v-=brow*.04*bw;u-=sg*brow*.018*bw;
  v-=squint*.018*g2(au-.4,v0-.25,.2,.08);
  const ul=sstep(MOUTH_V-.004,MOUTH_V+.012,v0)*sstep(MOUTH_V+.15,MOUTH_V+.06,v0)*sstep(.32,.16,au);
  v+=snarl*.055*ul*(.55+.45*sstep(.02,.13,au));
  const ll=sstep(MOUTH_V+.004,MOUTH_V-.012,v0)*sstep(MOUTH_V-.14,MOUTH_V-.06,v0)*sstep(.3,.14,au);
  v-=snarl*.025*ll;
  v+=snarl*.022*g2(au-.3,v0+.24,.14,.12)+squint*.025*g2(au-.42,v0+.06,.16,.07);
  u+=sg*snarl*.035*g2(au-.235,v0-MOUTH_V,.07,.05);
  return[u,v];
}
function jawW(u0,v0){
  const au=Math.abs(u0);if(Math.cos(u0)<-.35)return 0;
  const neckFade=sstep(-1.5,-1.02,v0);
  const outer=sstep(MOUTH_V+.03,MOUTH_V-.22,v0)*sstep(1.4,.6,au)*neckFade;
  if(v0<MOUTH_V&&au<MOUTH_HW){const inner=neckFade;const t=sstep(.17,MOUTH_HW,au);return lerp(inner,Math.max(outer,.55),t);}
  return outer;
}
const rotX=(p,a,H)=>{const c=Math.cos(a*D),s=Math.sin(a*D);const y=p[1]-H[1],z=p[2]-H[2];return[p[0],H[1]+c*y+s*z,H[2]-s*y+c*z];};
function faceF(u0,v0,X){const w=warp(u0,v0,X);return headShape(w[0],w[1],X);}
function faceN(u0,v0,X,P){const h=.0035;
  const a=faceF(u0+h,v0,X),b=faceF(u0-h,v0,X),c=faceF(u0,v0+h,X),d=faceF(u0,v0-h,X);
  let n=nrm(cross(sub(a,b),sub(c,d)));if(dot(n,P)<0)n=scl(n,-1);return n;}

// Paletas dos olhos por variação
const EYES={
  operario:{sclera:'#cfae92',red:.8,iris:'#a7752a',iris2:'#5a3410',pupil:.2,glow:'#ff7a2a'},
  executivo:{sclera:'#c4b8a6',red:.6,iris:'#a8b6ba',iris2:'#6c7a80',pupil:.12,glow:'#e8f0f0',cataract:true},
  paciente:{sclera:'#8a1c18',red:1,iris:'#d9cfa8',iris2:'#8f8466',pupil:.1,glow:'#ff3a2a',hemorrhage:true},
};
function hairMask(v,e,q){
  const hs=v.hairStyle;let hair=0;const front=e[1];
  const tuft=vn(q[0]*.9,q[1]*.9,q[2]*.9+60),fine=vn(q[0]*3,q[1]*3,q[2]*3+8);
  if(hs==='short')hair=sstep(.08,.2,e[2]+tuft*.16+fine*.08-(front>.2?front*.62-Math.abs(e[0])*.18:0)+(front<-.1?.55:0)+(Math.abs(e[0])>.85&&e[2]>-.25?.25:0));
  if(hs==='bald'){hair=(e[2]>-.42&&e[2]<.32&&front<.25)?sstep(.0,.2,.32-e[2]+tuft*.15)*sstep(-.42,-.15,e[2])*sstep(.25,-.2,front)*(.45+tuft*.6):0;}
  if(hs==='long')hair=sstep(.0,.2,e[2]+tuft*.15+fine*.05-(front>.2?front*.6:0)+(front<0?.95:0)+.12);
  if(hs==='none')return 0;
  if(hs==='hood'){const d=Math.max((Math.abs(e[0])-.42)*1.4,(e[2]-.34)*1.3,(.35-front)*1.2,-(e[2]+.7));hair=sstep(-.06,.16,d+tuft*.05);}
  return clamp(hair,0,1);
}
function faceColor(v,u0,v0,e,q,P0){
  if(v.alive)return aliveFace(v,u0,v0,e,q);
  const au=Math.abs(u0),cu=Math.cos(u0);let c=skinTone(v,q,.04);let wet=0,emi=0;SK=1;
  // tons do rosto: olheiras roxas, nariz e lábios arroxeados, veias nas têmporas
  c=mix3(c,[70,44,58],g2(au-EYE_U,v0-(EYE_V-.1),.18,.055)*.75);
  c=mix3(c,[64,40,48],g2(au-EYE_U,v0-EYE_V,.24,.13)*.35);
  c=mix3(c,[120,70,70],g2(u0,v0+.2,.08,.07)*.25);
  const vein=Math.abs(vn(u0*22,v0*22+5,2)-.5);c=mix3(c,[60,46,74],sstep(.025,0,vein)*g2(au-.9,v0-.18,.12,.14)*.6);
  // sobrancelhas
  const browV=.265-.12*(au-.33)*(au-.33);
  const bm=g2(au-.33,v0-browV,.2,.024)*sstep(.1,.16,au);
  if(v.hairStyle!=='none'&&bm>.3&&h3(q[0]*90|0,q[1]*90|0,q[2]*90|0)>.35){c=mix3(c,v.hairC||[30,24,20],Math.min(1,bm)*.85);SK=0;}
  // barba por fazer (operário)
  if(v.code==='A'){const st=g2(u0,v0+.6,.55,.2)*sstep(-.3,-.42,v0)*(1-g2(u0,v0+.48,.22,.06));if(h3(q[0]*130|0,q[1]*130|0,7)>.55)c=mix3(c,[40,32,28],st*.6);}
  // pálpebras: borda vermelha e úmida, cílios ralos
  const hh=eyeHH(u0),du=(au-EYE_U)/EYE_HW;
  if(Math.abs(du)<1.15){const ed=Math.abs(v0-eyeCenterV(u0))-hh;
    if(ed<.03){const k=sstep(.03,0,ed);c=mix3(c,[150,52,50],k*.8);wet=Math.max(wet,k*.6);}
    if(v0>EYE_V&&ed<.012&&h3(q[0]*200|0,q[2]*200|0,3)>.45){c=mix3(c,[28,20,18],.8);}}
  // lábios mortos, rachados
  const lip=Math.max(g2(u0,v0+.428,.19,.026),g2(u0,v0+.512,.15,.028));
  if(lip>.25){c=mix3(c,[58,40,44],lip*.7);const crack=Math.abs(vn(u0*60,v0*20,9)-.5);if(crack<.04)c=mix3(c,[40,14,18],lip);wet=Math.max(wet,lip*.25);}
  // narinas
  const nos=g2(au-.062,v0+.283,.026,.017);if(nos>.35)c=mix3(c,[26,12,12],Math.min(1,nos*1.3));
  if(v.skullFace){const cav=g2(u0,v0+.17,.065,.08)+g2(au-.035,v0+.2,.025,.05);if(cav>.2){c=mix3(c,[22,10,12],Math.min(1,cav));SK=0;}}
  // dentro da fenda da boca
  if(Math.abs(v0-MOUTH_V)<.012&&au<MOUTH_HW){c=mix3(c,[30,10,12],.85);}
  // sangue: em volta da boca, escorrendo do queixo; nariz sangrando (executivo)
  const chin=sstep(-.5,-.7,v0)*sstep(.3,.75,cu)*sstep(.32,.06,au)*.7;
  const dripc=sstep(.5,.78,vn(u0*14,3,1))*sstep(-.5,-.85,v0)*sstep(.45,.1,au);
  const corner=g2(au-.22,v0-MOUTH_V,.06,.05);
  let mb=Math.max(chin*.55,dripc*.85,corner*.8,lip*.35)*(.55+.45*vn(q[0]*1.3,q[1],q[2]));
  if(v.code==='B'){const nb=g2(au-.06,v0+.33,.03,.05)+sstep(.55,.8,vn(u0*30,1,2))*g2(au-.07,v0+.4,.04,.05);mb=Math.max(mb,Math.min(1,nb)*.9);}
  if(mb>0){const r=blood(c,mb,q);c=r[0];wet=Math.max(wet,r[1]*.7);}
  // corte na testa (operário)
  if(v.code==='A'){const g=sstep(.03,.008,Math.abs((v0-.52)-(u0-.08)*.55))*sstep(.3,.18,Math.abs(u0+.02));
    if(g>0){c=mix3(c,[70,18,18],g);wet=Math.max(wet,g*.8);SK=0;}
    const gr=sstep(.06,.03,Math.abs((v0-.52)-(u0-.08)*.55))*sstep(.32,.2,Math.abs(u0+.02));c=mix3(c,[90,40,44],gr*(1-g)*.6);}
  // cabelo (direção e na esfera unitária)
  const hair=hairMask(v,e,q),tuft=vn(q[0]*.9,q[1]*.9,q[2]*.9+60);
  if(hair>0&&v.hairStyle==='hood'){const fold=.82+.18*Math.sin(Math.atan2(e[0],e[2])*7+tuft*3);let hc=scl(mix3(v.hoodC,scl(v.hoodC,.6),tuft),fold);
    if(e[1]>.1&&hair<.95)hc=scl(hc,.55);c=mix3(c,hc,hair);SK=hair>.5?0:SK;return[c[0],c[1],c[2],0,0,SK];}
  if(hair>0){const strand=.75+.25*Math.sin(Math.atan2(e[0],e[1])*90+tuft*6);const hc=mix3(scl(v.hairC,strand),scl(v.hairC,.5),tuft);
    c=mix3(c,hc,clamp(hair,0,1)*.96);if(hair>.5)SK=0;wet=Math.max(wet,hair*.08);}
  return[c[0],c[1],c[2],wet,emi,SK];
}

// Monta as amostras do rosto + olhos + boca (posição, normal e deltas das 5 expressões)
function buildFace(v,sp){FV=v;
  const out=[];
  const CH=[[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1]];
  const Z=[0,0,0,0,0];
  const push=(P0,N0,dP,dN,col,ao)=>out.push({P0,N0,dP,dN,c:col,ao,j:.985+h3(P0[0]*97|0,P0[1]*97|0,P0[2]*97|0)*.03});
  // superfície da cabeça
  const cz=HEADR[2],dv=sp/cz;
  function hairDisp(v,P){const eD=nrm([P[0]/HEADR[0],P[1]/HEADR[1],P[2]/HEADR[2]]),qD=[P[0]*1.3+30,P[1]*1.3,P[2]*1.3];const hm=hairMask(v,eD,qD);if(hm<=0)return 0;
    return v.hairStyle==='hood'?hm*(.5+.25*vn(qD[0]*.6,qD[1]*.6,qD[2]*.6)):hm*hm*(.06+.1*vn(qD[0]*1.4,qD[1]*1.4,qD[2]*1.4));}
  const FH=(u,vv)=>{const P=faceF(u,vv,Z);const d=hairDisp(v,P);if(!d)return P;const n=nrm([P[0]/(HEADR[0]*HEADR[0]),P[1]/(HEADR[1]*HEADR[1]),P[2]/(HEADR[2]*HEADR[2])]);return add(P,scl(n,d));};
  function faceSample(u0,vj,stretch){
      if(inEye(u0,vj))return;
      if(vj<-1.3)return; // base: entra no pescoço
      let P0=faceF(u0,vj,Z);const N0=faceN(u0,vj,Z,P0);const Praw=P0;
      const eD=nrm([P0[0]/HEADR[0],P0[1]/HEADR[1],P0[2]/HEADR[2]]),qD=[P0[0]*1.3+30,P0[1]*1.3,P0[2]*1.3];
      const hdp=hairDisp(v,P0);let NH=null;if(hdp>0){P0=add(P0,scl(N0,hdp));const h2=.004;NH=nrm(cross(sub(FH(u0+h2,vj),FH(u0-h2,vj)),sub(FH(u0,vj+h2),FH(u0,vj-h2))));if(dot(NH,P0)<0)NH=scl(NH,-1);}
      const dP=[],dN=[];
      const active=Math.cos(u0)>-.2&&vj>-1.0&&vj<.75&&Math.abs(u0)<1.2;
      const wj=jawW(u0,vj);
      if(wj>0){const Pr=rotX(P0,(v.B?v.B.jaw:JAW_DEG),HINGE),Nr=rotX(N0,(v.B?v.B.jaw:JAW_DEG),[0,0,0]);dP.push(scl(sub(Pr,P0),wj));dN.push(scl(sub(Nr,N0),wj));}
      else{dP.push(null);dN.push(null);}
      for(let k=1;k<5;k++){
        if(!active){dP.push(null);dN.push(null);continue;}
        const P1=faceF(u0,vj,CH[k]);const d=sub(P1,Praw);
        if(Math.abs(d[0])+Math.abs(d[1])+Math.abs(d[2])<1e-4&&k!==1&&k!==2){dP.push(null);dN.push(null);continue;}
        const N1=faceN(u0,vj,CH[k],P1);dP.push(d);dN.push(sub(N1,N0));
      }
      const e=nrm([P0[0]/HEADR[0],P0[1]/HEADR[1],P0[2]/HEADR[2]]);
      const q=[P0[0]*1.3+30,P0[1]*1.3,P0[2]*1.3];
      const D0=relief(u0,vj,Z);
      push(P0,NH||N0,dP,dN,faceColor(v,u0,vj,e,q,P0),clamp(1+Math.min(0,D0)*.32,.5,1));out[out.length-1].k=stretch;
  }
  for(let v0=-Math.PI/2+dv*.5;v0<Math.PI/2;v0+=dv){
    const cv=Math.cos(v0);const circ=2*Math.PI*((HEADR[0]+HEADR[1])/2)*cv;const n=Math.max(6,Math.ceil(circ/sp));
    for(let i=0;i<n;i++){
      const u0=-Math.PI+(i+.5+(h3(i,(v0*1000)|0,5)-.5)*.5)/n*2*Math.PI;
      const vj=v0+(h3(i,(v0*1000)|0,9)-.5)*dv*.5;
      // esticamento local: onde o relevo afasta as amostras, a célula ganha amostras extras
      const hh=.004,Fu=len(sub(FH(u0+hh,vj),FH(u0-hh,vj)))/(2*hh),Fv=len(sub(FH(u0,vj+hh),FH(u0,vj-hh)))/(2*hh);
      const su=Fu*(2*Math.PI/n)/sp,svv=Fv*dv/sp;
      const nu=Math.min(6,Math.max(1,Math.round(su))),nv=Math.min(6,Math.max(1,Math.round(svv)));
      for(let a=0;a<nu;a++)for(let b=0;b<nv;b++){
        const uu=nu===1?u0:u0+((a+.5)/nu-.5)*(2*Math.PI/n)+(h3(i,a,b)-.5)*(2*Math.PI/n)/nu*.4;
        const vv=nv===1?vj:vj+((b+.5)/nv-.5)*dv+(h3(b,i,a)-.5)*dv/nv*.4;
        faceSample(uu,vv,clamp(Math.max(su/nu,svv/nv)*1.06,1,1.6));
      }
    }
  }
  // globos oculares
  const EY=EYES[v.key]||EYES.operario;const scl_=hex(EY.sclera),irC=hex(EY.iris),ir2=hex(EY.iris2),glow=hex(EY.glow);
  const re=1.22;
  for(const sg of[-1,1]){
    const S0=faceF(sg*EYE_U,EYE_V,Z),Nn=faceN(sg*EYE_U,EYE_V,Z,S0);
    const C=sub(S0,scl(Nn,re-.12));(out.eyes||(out.eyes=[])).push(add(C,[0,re*.85,0]));
    const gaze=v.alive?nrm([-sg*.28,1,-.03]):nrm([sg*.06+(sg<0?-.05:0),1,-.04]);// leve estrabismo: um olho desvia
    const nlat=Math.max(5,Math.ceil(Math.PI*re/(sp*.7)));
    for(let i=0;i<=nlat;i++){const be=-Math.PI/2+i/nlat*Math.PI,cb=Math.cos(be);const n=Math.max(4,Math.ceil(2*Math.PI*re*cb/(sp*.7)));
      for(let j=0;j<n;j++){const la=(j+(i%2)*.5)/n*2*Math.PI;const d=[cb*Math.cos(la),cb*Math.sin(la),Math.sin(be)];
        if(dot(d,[0,1,0])<-.1)continue;
        const ca=dot(d,gaze),al=Math.acos(clamp(ca,-1,1));
        let c,emi=0,wet=1;
        const ang=Math.atan2(d[2],d[0]);
        if(al<EY.pupil){c=EY.cataract?[120,128,130]:[12,6,6];emi=EY.cataract?.3:0;}
        else if(al<.46){const t=(al-EY.pupil)/(.46-EY.pupil);const streak=vn(ang*9,t*3,4);c=mix3(irC,ir2,clamp(t*.7+streak*.5-.1,0,1));
          if(t>.85)c=mix3(c,[28,18,14],(t-.85)/.15);emi=.32;if(EY.cataract)c=mix3(c,[200,206,206],.35);}
        else{
          c=scl_.slice();
          const vein=Math.abs(vn(ang*5+sg*3,al*5,11)-.5);const vein2=Math.abs(vn(ang*11,al*9,13)-.5);
          const redness=EY.red*sstep(.5,1.4,al);
          c=mix3(c,[150,30,28],redness*.55);
          c=mix3(c,[160,22,22],sstep(.045,.0,vein)*EY.red*sstep(.55,.9,al));
          c=mix3(c,[140,26,26],sstep(.03,.0,vein2)*EY.red*.8*sstep(.6,1,al));
          if(EY.hemorrhage)c=mix3(c,[120,12,14],.55+.3*vn(ang*3,al*3,5));
          c=scl(c,.92);
        }
        push(add(C,scl(d,re)),d,[null,null,null,null,null],[null,null,null,null,null],[c[0],c[1],c[2],wet*.9,emi,0],.95);
      }}
  }
  // boca: cavidade, gengiva, dentes, língua
  const cav={c:[0,3.4,-3.95],r:[2.6,2.4,1.5]};
  const ellPts=(C,R,s2,fn)=>{const rm=(R[0]+R[1]+R[2])/3;const nlat=Math.max(4,Math.ceil(Math.PI*rm/s2));
    for(let i=0;i<=nlat;i++){const be=-Math.PI/2+i/nlat*Math.PI,cb=Math.cos(be);const n=Math.max(3,Math.ceil(2*Math.PI*rm*cb/s2));
      for(let j=0;j<n;j++){const la=(j+(i%2)*.5)/n*2*Math.PI;const d=[cb*Math.cos(la),cb*Math.sin(la),Math.sin(be)];
        fn(add(C,[d[0]*R[0],d[1]*R[1],d[2]*R[2]]),nrm([d[0]/R[0],d[1]/R[1],d[2]/R[2]]),d);}}};
  const jawDelta=(P,N,w)=>{const Pr=rotX(P,(v.B?v.B.jaw:JAW_DEG),HINGE),Nr=rotX(N,(v.B?v.B.jaw:JAW_DEG),[0,0,0]);return[[scl(sub(Pr,P),w),null,null,null,null],[scl(sub(Nr,N),w),null,null,null,null]];};
  ellPts(cav.c,cav.r,sp*1.1,(P,N,d)=>{if(d[1]>.35)return;const Ni=scl(N,-1);const w=sstep(.2,-.3,d[2]);const[dp,dn]=jawDelta(P,Ni,w);
    const t=.5+.5*vn(P[0],P[1],P[2]);push(P,Ni,dp,dn,[30+t*14,8,10,.15,0,0],.45);});
  // língua (no fundo, escura)
  ellPts([0,3.0,-4.85],[1.3,1.9,.45],sp*.9,(P,N,d)=>{if(d[2]<-.2)return;const[dp,dn]=jawDelta(P,N,1);const t=vn(P[0]*3,P[1]*3,P[2]*3);
    push(P,N,dp,dn,[52+t*14,26,32,.15,0,0],.4);});
  // dentes: incisivos retangulares, caninos longos, amarelados e cariados; alguns faltando
  const miss=v.alive?[]:v.code==='A'?[2,7]:v.code==='B'?[5]:[1,6,8];
  for(const lower of(v.alive?[]:[0,1])){
    for(let i=0;i<10;i++){const idx=lower?9-i:i;if(miss.includes(idx)&&(!lower||i%2))continue;
      const ph=-.9+i*.2;const canine=(i===2||i===7);const inc=i>=3&&i<=6;
      let wd=inc?.5:canine?.44:.48,ht=(lower?.62:.82)*(canine?1.25:inc?1:.85);if(v.fangs){wd*=.72;ht*=1.6;}
      const x=2.05*Math.sin(ph)*1.04,y=3.9+2.05*Math.cos(ph);
      const C=lower?[x,y-.1,-4.12-ht*.28]:[x,y+.3,-3.68-ht*.32];
      const decay=h3(i,lower,3);
      ellPts(C,[wd*.5,.17+(inc?0:.06),ht*.5],sp*.45,(P,N,d)=>{
        const tip=lower?d[2]:-d[2];
        let col=v.alive?mix3([226,218,198],[170,156,128],sstep(.6,-.9,tip)*.5):mix3([190,176,138],[112,92,62],sstep(.6,-.9,tip)*.75);
        if(!v.alive&&decay>.72)col=mix3(col,[64,46,30],.65*sstep(-.5,.4,tip));
        if(tip>.82)col=mix3(col,[150,140,120],.4);
        const[dp,dn]=lower?jawDelta(P,N,1):[[null,null,null,null,null],[null,null,null,null,null]];
        push(P,N,dp,dn,[col[0],col[1],col[2],.2,0,0],.85);});
    }
    for(let i=0;i<14;i++){const ph=-1.0+i*.154;const x=2.1*Math.sin(ph)*1.04,y=3.8+2.1*Math.cos(ph);
      const C=[x,y-.15,lower?-4.62:-3.2];
      ellPts(C,[.36,.32,.24],sp*.5,(P,N,d)=>{const[dp,dn]=lower?jawDelta(P,N,1):[[null,null,null,null,null],[null,null,null,null,null]];push(P,N,dp,dn,[70,22,26,.3,0,0],.7);});}
  }
  return out;
}

// ---------- esqueleto ----------
// pose em graus. Convenções: pitch + = inclina para frente (tronco/cabeça); membros: swing + = para frente.
function buildSkeleton(P,v){
  const G={};
  const root={o:[0,P.root.f||0,50+(P.root.z||0)],m:mm(mm(rz(P.root.yaw||0),rx(P.root.pitch||0)),ry(P.root.roll||0))};
  const B=v.B,SG=v.SEG;
  const lumbar=child(root,[0,0,8*B.spine],mm(mm(rx(P.sp[0]),ry(P.sp[1])),rz(P.sp[2])));
  const chest=child(lumbar,[0,0,12*B.spine],mm(mm(rx(P.ch[0]),ry(P.ch[1])),rz(P.ch[2])));
  G.frames=[root,lumbar,chest];
  const ncomp=P.armLocal?0:-(P.sp[0]+P.ch[0])*.95; // pescoço compensa a corcunda: o rosto olha à frente
  const neckF=child(chest,[0,.8,10.8*B.spine],mm(mm(rx(P.neck[0]+ncomp),ry(P.neck[1])),rz(P.neck[2])));
  const neckTop=child(neckF,[0,0,SG.neck.L]);
  G.neck={a:neckF.o,b:neckTop.o,ref:neckF.m};
  const headF=child(neckTop,[0,0,0],mm(rx(P.head[0]),ry(P.head[1])));
  const hsc=B.head;const hc=child(headF,[0,1.6*hsc,6.4*hsc]);
  G.head={c:hc.o,m:headF.m};
  G.face={c:hc.o,m:headF.m,s:hsc};G.headF=headF;
  G.earL={c:child(hc,[-5.55*hsc,-.7*hsc,.4*hsc]).o,m:mm(headF.m,rz(-14))};G.earR={c:child(hc,[5.55*hsc,-.7*hsc,.4*hsc]).o,m:mm(headF.m,rz(14))};
  for(const sd of['L','R']){
    const s=sd==='R'?1:-1;
    const A=P.arms[sd];
    const comp=P.armLocal?0:(P.sp[0]+P.ch[0]); // braço medido em relação à vertical
    const shF=child(chest,[s*13.6*B.shoulder*B.chest,-.2,5.4*B.spine],mm(mm(rz(s*(A.yaw||0)),rx(-(A.pitch+comp))),ry(-s*A.abd)));
    const SU=SG['uarm'+sd]||SG.uarm,SF=SG['farm'+sd]||SG.farm;
    const elF=child(shF,[0,0,-SU.L],rx(-A.elbow));
    const wr=child(elF,[0,0,-SF.L]);G['_sh'+sd]=shF;G['_el'+sd]=elF;G['_wr'+sd]=wr;
    G['uarm'+sd]={a:shF.o,b:elF.o,ref:shF.m};
    G['farm'+sd]={a:elF.o,b:wr.o,ref:elF.m};
    const hd=nrm(col(elF.m,2).map(x=>-x));
    let up=[0,0,1];if(Math.abs(dot(hd,up))>.8)up=col(elF.m,1);
    const hm=frameFromAxis(hd,up);// y = dorso da mão, z = direção dos dedos
    const PALM=v.PALM,HKv=HK*B.hand;G['hand'+sd]={c:add(wr.o,scl(hd,PALM*.5)),m:hm};
    const claw=A.claw!=null?A.claw:.9,spread=A.spread||0;
    const KX=[1.55*HKv,.52*HKv,-.5*HKv,-1.45*HKv],KZ=[.93,1,.96,.86],SPL=[-5,0,5,11];
    for(let f=0;f<4;f++){
      let Fm=mm(hm,ry(-s*(SPL[f]*(1+spread*1.6))));
      let a=add(wr.o,mv(hm,[s*KX[f],.15,PALM*KZ[f]]));
      const ang=[8+22*claw+f*3,14+52*claw+f*4,6+34*claw];
      for(let j=0;j<3;j++){Fm=mm(Fm,rx(-ang[j]));const L=SG['ph'+f+j].L;const b=add(a,scl(col(Fm,2),L));G['px'+sd+f+j]={a,b,ref:Fm};a=b;}
    }
    {let Ft=frameFromAxis(mv(hm,[s*.78,-.42,.48]),col(hm,1));let a=add(wr.o,mv(hm,[s*1.5*HKv,-.35*HKv,PALM*.18]));
      const ang=[4+8*claw,10+30*claw,8+30*claw];
      for(let j=0;j<3;j++){Ft=mm(Ft,rx(-ang[j]));const L=SG['pt'+j].L;const b=add(a,scl(col(Ft,2),L));G['pt'+sd+j]={a,b,ref:Ft};a=b;}}
    const Lg=P.legs[sd];
    const hipF=child(root,[s*6.4*B.hip,0,-4],mm(mm(rz(s*(Lg.yaw||0)),rx(-Lg.swing)),ry(-s*(Lg.abd||0))));
    const knF=child(hipF,[0,0,-SG.thigh.L],rx(Lg.knee));
    const an=child(knF,[0,0,-SG.shin.L]);G['_hip'+sd]=hipF;G['_kn'+sd]=knF;G['_an'+sd]=an;
    if(P.legless){
      G['thigh'+sd]={a:hipF.o,b:knF.o,ref:hipF.m};
      const sd2=col(hipF.m,2).map(x=>-x);
      G['stump'+sd]={a:knF.o,b:add(knF.o,scl(sd2,SG.stump.L)),ref:hipF.m};
    }else{
      G['thigh'+sd]={a:hipF.o,b:knF.o,ref:hipF.m};
      G['shin'+sd]={a:knF.o,b:an.o,ref:knF.m};
      const footM=mm(knF.m,rx(-(Lg.ankle||0)));
      const fk=B.foot||1;G['foot'+sd]={c:add(an.o,mv(footM,[0,2.6*fk,-1.4*fk])),m:footM};
    }
  }
  // tecidos e cabelo pendurados pela gravidade
  const sway=P.sway||0;
  if(v.strip){const a=child(root,[-7,5.5,-5]).o;G.strip={a,b:add(a,[sway*2.5+1,-sway*1.5+1,-SG.strip.L]),ref:root.m};}
  if(v.tie){const a=child(chest,[.4,7.4,1.5]).o;const fwd=col(chest.m,1);G.tieEnd={a,b:add(a,[fwd[0]*2+sway*2,fwd[1]*2-sway,-SG.tieEnd.L]),ref:chest.m};}
  if(v.hairStyle==='long'){for(let i=0;i<7;i++){const ang=(-.9+i*.3);const a=child(hc,[Math.sin(ang)*6.2*hsc,(-Math.cos(ang)*6.8+1)*hsc,1.5*hsc]).o;
    G['lock'+i]={a,b:add(a,[Math.sin(ang)*3+sway*2,-2.5-Math.cos(ang)*1.5,-SG.lock.L+Math.abs(ang)*2]),ref:headF.m};}}
  // partes extras presas ao corpo (pústulas, bolsas, placas, núcleo)
  const FR={root,lumbar,chest,head:{o:hc.o,m:headF.m},neck:neckF,uarmL:G._shL,uarmR:G._shR,farmL:G._elL,farmR:G._elR,wristL:G._wrL,wristR:G._wrR};
  FR.hipL=G._hipL;FR.hipR=G._hipR;FR.kneeL=G._knL;FR.kneeR=G._knR;FR.ankleL=G._anL;FR.ankleR=G._anR;FR.handL={o:G.handL.c,m:G.handL.m};FR.handR={o:G.handR.c,m:G.handR.m};
  if(typeof gunFrame==='function'&&P.gun){const gf=gunFrame(P,v,G,chest);if(gf)FR.gun=gf;}
  (v.extras||[]).forEach((x,i)=>{const f=FR[x.frame]||chest;const off=x.off?(x.frame==='head'?scl(x.off,hsc):x.off):[0,0,0];const m=x.rot?mm(f.m,mm(mm(rz(x.rot[2]||0),rx(x.rot[0]||0)),ry(x.rot[1]||0))):f.m;
    if(x.seg){const sw=x.sway?[Math.sin((P.t||0)*6.283*(x.sway[0]||1)+i*1.7)*x.sway[1],Math.cos((P.t||0)*6.283*(x.sway[0]||1)+i*2.3)*x.sway[1]*.7,0]:[0,0,0];
      const gr=x.growLen?1+(P.swell||0)*x.growLen:1;const hs2=x.frame==='head'?hsc:1;const xa=scl(x.a,hs2),xb=scl(x.b,hs2);const a=add(f.o,mv(f.m,xa));const bb=add(xa,scl(sub(xb,xa),gr));const b=add(f.o,mv(f.m,add(bb,sw)));G['x'+i]={a,b,ref:f.m};return;}
    let c=add(f.o,mv(f.m,off));if(x.show==='spit'){const k=P.spit||0;c=add(c,mv(f.m,[0,k*14,-k*3]));}
    if(x.tip!=null){const sg=G['x'+x.tip];if(sg&&sg.b)c=add(sg.b,mv(f.m,off));}
    G['x'+i]={c,m};});
  return G;
}
function frameFromAxis(z,ref){// colunas: x=lateral, y=ref ortogonal, z=eixo
  z=nrm(z);let y=sub(ref,scl(z,dot(ref,z)));if(len(y)<1e-4)y=[0,0,1];y=nrm(y);const x=cross(y,z);
  return[x[0],y[0],z[0],x[1],y[1],z[1],x[2],y[2],z[2]];
}

// ---------- render ----------
const tmp={X:new Float32Array(220000),Y:new Float32Array(220000),Dp:new Float32Array(220000),R:new Uint8Array(220000),Gc:new Uint8Array(220000),B:new Uint8Array(220000),Rad:new Float32Array(220000),idx:new Uint32Array(220000)};
let FILL=0;const LFILL=nrm([.75,.35,.35]);
function shadeRGB(c,n,ao,jit){
  const nv=dot(n,V);
  const ndl=dot(n,LKEY);const hemi=.5+.5*n[2]+(FILL?FILL*Math.max(0,dot(n,LFILL)):0);
  let r,g,b;
  if(c[5]){// pele: luz que "abraça" (wrap) + faixa avermelhada na transição luz/sombra (GPU Gems, cap. 16)
    const w=(ndl+.3)/1.3,diff=Math.max(0,w);
    const sc=sstep(0,.32,w)*sstep(.64,.32,w);
    let k=(.3*hemi+.78*diff)*ao*jit;const edge=.36+.64*sstep(-.05,.5,nv);k*=edge;
    r=c[0]*k+sc*18*ao;g=c[1]*k+sc*6*ao;b=c[2]*k+sc*5*ao;
    const nh=Math.max(0,dot(n,HALF));const sp=(Math.pow(nh,52)*.11+Math.pow(nh,12)*.035)*sstep(0,.2,ndl);// oleosidade em duas camadas
    r+=sp*235;g+=sp*222;b+=sp*214;
  }else{
    const diff=Math.max(0,ndl);
    let k=(.34*hemi+.8*diff)*ao*jit;const edge=.3+.7*sstep(-.05,.5,nv);k*=edge;
    r=c[0]*k;g=c[1]*k;b=c[2]*k;
  }
  const rim=Math.pow(1-clamp(nv,0,1),2.5)*Math.max(0,dot(n,LRIM))*.9;
  r+=rim*70;g+=rim*92;b+=rim*120;
  if(c[3]>0){const sp=Math.pow(Math.max(0,dot(n,HALF)),c[3]>.85?90:30)*c[3]*(c[3]>.85?2.2:.9);r+=sp*230;g+=sp*215;b+=sp*205;}
  if(c[4]>0){r=lerp(r,c[0]*1.1,c[4]);g=lerp(g,c[1]*1.1,c[4]);b=lerp(b,c[2]*1.05,c[4]);}
  return[r,g,b];
}
let BK=.75;function bumpN(n,g,k){const gl=len(g);if(gl>1.1)g=scl(g,1.1/gl);const gd=dot(g,n);return nrm([n[0]-k*(g[0]-n[0]*gd),n[1]-k*(g[1]-n[1]*gd),n[2]-k*(g[2]-n[2]*gd)]);}
// Desenha um quadro. opts: {scale, x, y (chão), facing (rad), outline, shadow:true}
function render(ctx,tpl,P,opts){
  const v=tpl.v,G=buildSkeleton(P,v);setCam(opts.elev);FILL=opts.fill||0;BK=v.B.bumpK||.75;
  const h=opts.facing;const sh=Math.sin(h),ch=Math.cos(h);
  // corpo → mundo (X leste, Y sul/câmera, Z cima)
  const W=p=>[-p[0]*sh+p[1]*ch,p[0]*ch+p[1]*sh,p[2]];
  // apoio no chão: o ponto mais baixo toca z=0
  let minZ=1e9;
  const ext=(c,r)=>{if(c[2]-r<minZ)minZ=c[2]-r;};
  for(const k in G){const g=G[k];if(!g||k==='frames')continue;if(g.a){const sg=v.SEG[k.replace(/[LR]$|\d+$/,'')]||v.SEG[k];ext(g.a,sg?sg.ra*.9:1);ext(g.b,sg?sg.rb*.9:1);}else if(g.c)ext(g.c,1.6);}
  for(const f of[0,1]){const fr=G.frames[f];ext(child(fr,[0,-7,f?0:-7]).o,7);}
  const lift=P.noClamp?0:-minZ;
  const S=opts.scale*(v.B.k||1),K=CAM.K,C=CAM.C;let ox=opts.x,oy=opts.y;
  if(opts.focus&&G[opts.focus]){const g=G[opts.focus];const fc=g.c||add(g.a,scl(sub(g.b,g.a),.5));const off=opts.focusOff||[0,0,0];const w=W([fc[0]+off[0],fc[1]+off[1],fc[2]+lift+off[2]]);ox=opts.x-w[0]*S;oy=opts.y-(w[1]*K-w[2]*C)*S;}
  let rad=tpl.spacing*S*.78+.45;
  let n=0;
  const push=(p,nn,c,ao,jit)=>{
    const w=W([p[0],p[1],p[2]+lift]),nw=W(nn);
    if(dot(nw,V)<-.22)return;
    const col=shadeRGB(c,nw,ao,jit);
    if(P.burn>0&&c[5]){const cr=Math.abs(Math.sin(p[0]*1.1+p[2]*.9+p[1]*.4)*Math.sin(p[1]*1.5-p[2]*.7+p[0]*.3));const m=sstep(.16,.03,cr)*sstep(1-P.burn*1.2,1.1-P.burn,(jit-.95)*10)*1.0;const e=P.burn*.1+m*P.burn;col[0]=lerp(col[0],255,e*.75);col[1]=lerp(col[1],120,e*.55);col[2]=lerp(col[2],50,e*.35);}
    tmp.X[n]=ox+w[0]*S;tmp.Y[n]=oy+(w[1]*K-w[2]*C)*S;tmp.Dp[n]=dot(w,V);
    tmp.R[n]=col[0]>255?255:col[0];tmp.Gc[n]=col[1]>255?255:col[1];tmp.B[n]=col[2]>255?255:col[2];
    tmp.Rad[n]=rad*(.9+.2*jit-.18);n++;
  };
  const hidden=P.hide||{};
  for(const p of tpl.parts){
    if(hidden[p.key])continue;
    if(p.extra&&(p.extra.glowOnly||(typeof extraVisible==='function'&&!extraVisible(p.extra,P))))continue;
    const g=G[p.key];if(!g&&p.kind!=='loft')continue;
    rad=(p.sp||tpl.spacing)*S*.78+.4;
    if(p.kind==='face'){
      const X=P.face||[0,0,0,0,0];const m=g.m;const fs=g.s||1;const r1=rad*fs;rad=r1;
      for(const f of p.F){
        let px=f.P0[0],py=f.P0[1],pz=f.P0[2],nx=f.N0[0],ny=f.N0[1],nz=f.N0[2];
        for(let k=0;k<5;k++){const w=X[k];if(!w)continue;const d=f.dP[k];if(d){px+=d[0]*w;py+=d[1]*w;pz+=d[2]*w;}const dn=f.dN[k];if(dn){nx+=dn[0]*w;ny+=dn[1]*w;nz+=dn[2]*w;}}
        const pt=add(g.c,mv(m,[px*fs,py*fs,pz*fs]));const nn=nrm(mv(m,[nx,ny,nz]));
        const r0=rad;if(f.k)rad=r0*f.k;push(pt,nn,f.c,f.ao,f.j);rad=r0;
      }
      continue;
    }
    if(p.kind==='seg'){
      const sg=p.seg,d0=sub(g.b,g.a),L=len(d0)||1e-3,d=scl(d0,1/L);
      const refv=col(g.ref,1);let u=sub(refv,scl(d,dot(refv,d)));if(len(u)<1e-3)u=col(g.ref,2);u=nrm(u);const w=cross(d,u);
      for(const s of p.S){
        const cs=Math.cos(s.th),sn=Math.sin(s.th);const radial=[u[0]*cs+w[0]*sn,u[1]*cs+w[1]*sn,u[2]*cs+w[2]*sn];
        let pt,nn;
        if(s.cap===0){const r=lerp(sg.ra,sg.rb,s.t);pt=add(add(g.a,scl(d,s.t*L)),scl(radial,r));nn=radial;}
        else{const r=s.cap>0?sg.rb:sg.ra,cdir=s.cap>0?d:scl(d,-1),cen=s.cap>0?g.b:g.a;
          nn=add(scl(cdir,Math.sin(s.al)),scl(radial,Math.cos(s.al)));pt=add(cen,scl(nn,r));}
        const ao=s.cap===0?(.82+.18*Math.sin(Math.PI*s.t)):.82;
        if(s.g){const gw=[u[0]*s.g[0]+w[0]*s.g[1]+d[0]*s.g[2],u[1]*s.g[0]+w[1]*s.g[1]+d[1]*s.g[2],u[2]*s.g[0]+w[2]*s.g[1]+d[2]*s.g[2]];nn=bumpN(nn,gw,BK);}
        push(pt,nn,s.c,ao,s.j);
      }
    }else if(p.kind==='ell'){
      let gk=1;if(p.extra){const x=p.extra;if(x.show==='spit'){gk=(P.spit>0&&P.spit<1)?1:0;}if(x.grow)gk*=1+(P.swell||0)*x.grow+(x.pulse?Math.sin((P.t||0)*6.283*x.pulse+x.off[0])*.06:0);if(x.scaleBy)gk*=Math.max(.05,P[x.scaleBy]||0);if(gk<=0)continue;}
      const a=p.r[0]*gk,b=p.r[1]*gk,c=p.r[2]*gk;const m=g.m;
      for(const s of p.S){const e=s.e;const lp=[e[0]*a,e[1]*b,e[2]*c];const pt=add(g.c,mv(m,lp));let nn=nrm(mv(m,[e[0]/a,e[1]/b,e[2]/c]));
        if(s.g)nn=bumpN(nn,mv(m,s.g),BK);
        push(pt,nn,s.c,p.key==='head'?.95:.85,s.j);}
    }else{
      const F=G.frames,secs=p.secs;
      // pontos e normais de cada seção (cache por quadro)
      for(const s of p.S){
        const A=secs[s.k],B=secs[Math.min(s.k+1,secs.length-1)];
        const cs=Math.cos(s.phi),sn=Math.sin(s.phi);
        const fa=F[A[0]],fb=F[B[0]];
        const rr=s.capR!=null?s.capR:1;
        const pa=add(fa.o,mv(fa.m,[cs*A[2]*rr,A[4]+sn*A[3]*rr,A[1]+(s.capR!=null?(1-rr*rr)*1.5:0)]));
        const pb=add(fb.o,mv(fb.m,[cs*B[2],B[4]+sn*B[3],B[1]]));
        const pt=s.capR!=null?pa:[lerp(pa[0],pb[0],s.f),lerp(pa[1],pb[1],s.f),lerp(pa[2],pb[2],s.f)];
        const mframe=s.f<.5?fa.m:fb.m;
        const wx=lerp(A[2],B[2],s.f),wf=lerp(A[3],B[3],s.f);
        let nn;
        if(s.capR!=null)nn=nrm(mv(fa.m,[cs*.45*rr,sn*.45*rr,1]));
        else{const R=nrm(mv(mframe,[cs/wx,sn/wf,0]));const T=sub(pb,pa);const tl=len(T);
          if(tl>1e-3){const Tn=scl(T,1/tl);nn=nrm(sub(R,scl(Tn,dot(R,Tn))));}else nn=R;}
        const ao=p.key==='torso'?(.78+.22*sstep(0,.35,s.zs)):.85;
        if(s.g)nn=bumpN(nn,mv(mframe,s.g),BK);
        push(pt,nn,s.c,ao,s.j);
      }
    }
  }
  // cotos: disco de carne e osso onde o membro foi arrancado (peças soltas)
  for(const st of (opts.stumps||[])){const g=G[st.key];if(!g||!g.a)continue;const sg=v.SEG[st.key.replace(/[LR]$/,'')]||v.SEG[st.key]||{ra:3};
    const cen=st.end==='b'?g.b:g.a;const d=nrm(st.end==='b'?sub(g.b,g.a):sub(g.a,g.b));let u=cross(d,[0,0,1]);if(len(u)<.1)u=cross(d,[1,0,0]);u=nrm(u);const w=cross(d,u);
    const R=(st.end==='b'?sg.rb:sg.ra)*1.02,sp=(tpl.spacing*.5);rad=sp*S*.78+.4;
    for(let r=0;r<=R;r+=sp){const n=Math.max(1,Math.ceil(2*Math.PI*r/sp));for(let i=0;i<n;i++){const a2=i/n*6.283;const pt=add(cen,add(scl(u,Math.cos(a2)*r),scl(w,Math.sin(a2)*r)));
      const k=r/R;const jag=vn(Math.cos(a2)*3,Math.sin(a2)*3,7);
      const c=k<.28?[226,212,186,.4,0,0]:k<.85?[150+jag*40,24,26,.6,0,0]:[96,16,18,.8,0,0];
      push(add(add(pt,scl(d,R*(1.06-.35*k*k))),scl(d,(jag-.5)*.5)),nrm(add(d,scl(sub(pt,cen),.12))),c,1,1);}}}
  // sombra no chão
  if(opts.shadow!==false){
    ctx.save();ctx.fillStyle='rgba(4,4,6,.42)';
    const spots=[];
    for(const k of['footL','footR','handL','handR','head','stumpL','stumpR']){const g=G[k];if(g)spots.push([g.c||g.b,k==='head'?6:4]);}
    for(const k of['thighL','thighR','shinL','shinR','uarmL','uarmR','farmL','farmR']){const g=G[k];if(g)spots.push([add(g.a,scl(sub(g.b,g.a),.5)),4.5]);}
    for(const f of G.frames)spots.push([f.o,10]);
    ctx.beginPath();
    for(const[c,r]of spots){const w=W([c[0],c[1],c[2]+lift]);const hgt=Math.max(0,w[2]);if(hgt>(r>8?60:22))continue;
      const k2=1-hgt/(r>8?75:30);const rr=r*S*(1+hgt/40);
      ctx.moveTo(ox+w[0]*S+rr*1.2,oy+w[1]*K*S);ctx.ellipse(ox+w[0]*S,oy+w[1]*K*S,rr*1.2*k2+S,rr*.6*k2+.6*S,0,0,Math.PI*2);}
    ctx.filter=`blur(${Math.max(1,2.4*S)}px)`;ctx.fill();ctx.filter='none';ctx.restore();
  }
  if(opts.pool>0){const pc=W([G.frames[2].o[0],G.frames[2].o[1],0]);ctx.save();ctx.fillStyle='rgba(70,6,10,.75)';ctx.filter=`blur(${S*.8}px)`;
    ctx.beginPath();ctx.ellipse(ox+pc[0]*S,oy+pc[1]*K*S,opts.pool*22*S,opts.pool*13*S,0,0,Math.PI*2);ctx.fill();ctx.filter='none';
    ctx.fillStyle='rgba(150,40,40,.25)';ctx.beginPath();ctx.ellipse(ox+pc[0]*S-opts.pool*6*S,oy+pc[1]*K*S-opts.pool*3*S,opts.pool*7*S,opts.pool*2.6*S,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  // ordem de pintura: do fundo para a frente
  const idx=tmp.idx;for(let i=0;i<n;i++)idx[i]=i;
  const sub_=idx.subarray(0,n);sub_.sort((a,b)=>tmp.Dp[a]-tmp.Dp[b]);
  // oclusão de contato (AO em espaço de tela): escurece dobras, axilas, encaixes e o que fica sob placas e tumores
  if(opts.ao){
    let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;for(let i=0;i<n;i++){const x=tmp.X[i],y=tmp.Y[i];if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
    const cs=Math.max(1.5,rad*1.1),gw=Math.ceil((maxX-minX)/cs)+3,gh=Math.ceil((maxY-minY)/cs)+3;const D=new Float32Array(gw*gh).fill(-1e9);
    for(let i=0;i<n;i++){const gx=((tmp.X[i]-minX)/cs|0)+1,gy=((tmp.Y[i]-minY)/cs|0)+1,k=gy*gw+gx;if(tmp.Dp[i]>D[k])D[k]=tmp.Dp[i];}
    const R1=Math.max(2,Math.round(opts.ao*2.2/cs*S)),R2=R1*2,dirs=[[1,0],[.7,.7],[0,1],[-.7,.7],[-1,0],[-.7,-.7],[0,-1],[.7,-.7]];const thr=.6,far=9*(v.B.k||1);
    for(let i=0;i<n;i++){const gx=((tmp.X[i]-minX)/cs|0)+1,gy=((tmp.Y[i]-minY)/cs|0)+1,dp=tmp.Dp[i];let occ=0;
      for(const[dx,dy]of dirs){for(const R of[R1,R2]){const x=gx+Math.round(dx*R),y=gy+Math.round(dy*R);if(x<0||y<0||x>=gw||y>=gh)continue;const dd=D[y*gw+x]-dp;if(dd>thr&&dd<far)occ+=R===R1?1:.6;}}
      const k=1-Math.min(.55,occ/12.8*.62);tmp.R[i]*=k;tmp.Gc[i]*=k;tmp.B[i]*=k;}
  }
  // enxame: insetos que orbitam o corpo (os de trás antes do corpo, os da frente depois)
  const swarmPts=[];
  if(P.swarm){const Sw=P.swarm,cen=add(G.frames[2].o,[0,0,lift+(Sw.z||0)]);
    for(let i=0;i<Sw.n;i++){const ph=h3(i,7,3)*6.283,sp=.6+h3(i,5,1)*1.2,rr=Sw.r*(.55+h3(i,2,9)*.7)*(1+(Sw.burst||0)*1.6*h3(i,4,4));
      const a=ph+(Sw.t||0)*6.283*sp*(i%2?1:-1);const z=Math.sin(a*1.7+ph)*Sw.r*.45+(h3(i,8,8)-.5)*Sw.r*.6;
      const pw=add(cen,[Math.cos(a)*rr,Math.sin(a)*rr,z]);const w=W(pw);swarmPts.push({x:ox+w[0]*S,y:oy+(w[1]*K-w[2]*C)*S,d:dot(w,V)-dot(W(cen),V),f:(Sw.t*40+i)%2});}}
  const drawSwarm=front=>{if(!swarmPts.length)return;const gc=hex(P.swarm.glow||'#c79aff');ctx.save();
    for(const q of swarmPts){if((q.d>0)!==front)continue;const r=Math.max(1.3,S*.9);
      ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,r*4);g.addColorStop(0,`rgba(${gc[0]},${gc[1]},${gc[2]},.35)`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,r*4,0,6.2832);ctx.fill();
      ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(16,10,20,.95)';ctx.beginPath();ctx.ellipse(q.x,q.y,r*1.2,r*.8,0,0,6.2832);ctx.fill();
      ctx.fillStyle='rgba(210,190,230,.35)';ctx.beginPath();ctx.ellipse(q.x-r*(q.f?1.1:.6),q.y-r*.6,r*.9,r*.35,-.5,0,6.2832);ctx.ellipse(q.x+r*(q.f?1.1:.6),q.y-r*.6,r*.9,r*.35,.5,0,6.2832);ctx.fill();}
    ctx.restore();};
  drawSwarm(false);
  // contorno
  if(opts.outline!==false){ctx.fillStyle=opts.outlineColor||'rgba(8,6,7,.92)';ctx.beginPath();const ow=clamp(S*.55,.7,opts.outlineMax||1.8);
    for(let i=0;i<n;i++){const j=sub_[i];ctx.moveTo(tmp.X[j]+tmp.Rad[j]+ow,tmp.Y[j]);ctx.arc(tmp.X[j],tmp.Y[j],tmp.Rad[j]+ow,0,6.2832);}ctx.fill();}
  for(let i=0;i<n;i++){const j=sub_[i];ctx.fillStyle=`rgb(${tmp.R[j]|0},${tmp.Gc[j]|0},${tmp.B[j]|0})`;ctx.beginPath();ctx.arc(tmp.X[j],tmp.Y[j],tmp.Rad[j],0,6.2832);ctx.fill();}
  drawSwarm(true);
  // brilho dos olhos: lê a ameaça mesmo quando o rosto tem poucos pixels
  const fp=tpl.parts.find(p=>p.key==='face');
  if(opts.glow&&!v.alive&&fp&&fp.eyes&&G.face&&!hidden.face){
    const m=G.face.m,fw=W(mv(m,[0,1,0])),vis=sstep(-.62,-.1,dot(fw,V));const close=(P.face||[])[4]||0;
    if(vis>0&&close<.6){const EY=EYES[v.key]||EYES.operario;const gc=hex(EY.glow);
      ctx.save();ctx.globalCompositeOperation='lighter';
      for(const E of fp.eyes){const fs=G.face.s||1;const w=W(add(add(G.face.c,mv(m,scl(E,fs))),[0,0,lift]));const x=ox+w[0]*S,y=oy+(w[1]*K-w[2]*C)*S;const r=Math.max(2.6,S*2.3);
        const gr=ctx.createRadialGradient(x,y,0,x,y,r);const a=Math.min(1,1.0*vis*(1-close)).toFixed(3);
        gr.addColorStop(0,`rgba(${gc[0]},${gc[1]},${gc[2]},${a})`);gr.addColorStop(.35,`rgba(${gc[0]},${Math.round(gc[1]*.5)},${Math.round(gc[2]*.4)},${(a*.45).toFixed(3)})`);gr.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();}
      ctx.restore();}
  }
  if(P.burn>0){const c0=W(add(G.frames[2].o,[0,0,lift]));const x0=ox+c0[0]*S,y0=oy+(c0[1]*K-c0[2]*C)*S,r=S*34;ctx.save();ctx.globalCompositeOperation='lighter';
    const gr=ctx.createRadialGradient(x0,y0,0,x0,y0,r);gr.addColorStop(0,`rgba(255,130,50,${(.35*P.burn).toFixed(3)})`);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x0,y0,r,0,6.2832);ctx.fill();ctx.restore();}
  if(opts.glow&&v.extras){ctx.save();ctx.globalCompositeOperation='lighter';
    v.extras.forEach((x,i)=>{if(!x.glow)return;if(typeof extraVisible==='function'&&!extraVisible(x,P))return;const g=G['x'+i];if(!g||!g.c)return;if(x.show==='spit'&&!(P.spit>0&&P.spit<1))return;
      const amp=(x.scaleBy?(P[x.scaleBy]||0)*2:1)*(P.glowAmp||1)*(1+(P.swell||0)*1.4)*(x.pulse?(.8+.2*Math.sin((P.t||0)*6.283*x.pulse+i)):1);
      const w=W(add(g.c,[0,0,lift]));const x0=ox+w[0]*S,y0=oy+(w[1]*K-w[2]*C)*S;const r=Math.max(2,x.r[0]*S*(x.glowR||2.2));const gc=hex(x.glow);
      const gr=ctx.createRadialGradient(x0,y0,0,x0,y0,r);gr.addColorStop(0,`rgba(${gc[0]},${gc[1]},${gc[2]},${Math.min(.9,.42*amp*(x.glowA||1)).toFixed(3)})`);gr.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x0,y0,r,0,6.2832);ctx.fill();});
    ctx.restore();}
  return n;
}

// ---------- animações ----------
const BASE=()=>({root:{f:0,z:0,pitch:0,roll:0,yaw:0},sp:[0,0,0],ch:[0,0,0],neck:[0,0,0],head:[0,0],jaw:0,
  arms:{L:{pitch:8,abd:8,elbow:12,yaw:0},R:{pitch:8,abd:8,elbow:12,yaw:0}},
  legs:{L:{swing:0,abd:2,knee:4,yaw:0,ankle:0},R:{swing:0,abd:2,knee:4,yaw:0,ankle:0}},sway:0});
function lerpObj(a,b,t){if(typeof a==='number'&&typeof b==='number')return lerp(a,b,t);if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return t<.5?a:b;if(Array.isArray(a))return a.map((x,i)=>lerpObj(x,b[i],t));const o={};for(const k in a)o[k]=(k in b)?lerpObj(a[k],b[k],t):a[k];for(const k in b)if(!(k in o))o[k]=b[k];return o;}
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function keys(list,u){// list: [[u,pose],...]
  for(let i=0;i<list.length-1;i++){const[a,pa]=list[i],[b,pb]=list[i+1];if(u<=b){return lerpObj(pa,pb,ease((u-a)/((b-a)||1)));}}
  return list[list.length-1][1];
}
function mirror(P){// troca esquerda/direita
  const Q=JSON.parse(JSON.stringify(P));
  [Q.arms.L,Q.arms.R]=[Q.arms.R,Q.arms.L];[Q.legs.L,Q.legs.R]=[Q.legs.R,Q.legs.L];
  Q.root.roll*=-1;Q.root.yaw*=-1;Q.sp[1]*=-1;Q.sp[2]*=-1;Q.ch[1]*=-1;Q.ch[2]*=-1;Q.neck[1]*=-1;Q.neck[2]*=-1;Q.head[1]*=-1;Q.sway*=-1;
  return Q;
}
// Poses escritas para quem estende o braço DIREITO e manca da perna DIREITA.
function hunch(P,v){P.sp[0]+=8;P.ch[0]+=12;P.ch[1]+=v.gait.roll;P.neck[0]+=10;P.head[0]-=14;P.head[1]+=12;return P;}
function armsFor(P,v,reachPitch,phase){
  if(v.gait.reach==='B'){P.arms.L={pitch:reachPitch-6+4*Math.sin(phase+1),abd:6,elbow:16,yaw:-8};P.arms.R={pitch:reachPitch+4*Math.sin(phase),abd:6,elbow:20,yaw:-8};}
  return P;
}
const ANIMS={
  idle:{frames:6,fps:6,loop:true,label:'Parado'},
  walk:{frames:8,fps:9,loop:true,label:'Andar'},
  attack:{frames:7,fps:12,loop:false,label:'Atacar'},
  hit:{frames:4,fps:12,loop:false,label:'Levar tiro'},
  death:{frames:9,fps:10,loop:false,label:'Morrer'},
  crawl:{frames:8,fps:8,loop:true,label:'Rastejar'},
};
// expressão facial e garras por animação: [mandíbula, rosnado, testa, apertar, pálpebras]
function faceFor(anim,u,P){
  const ph=u*Math.PI*2,j=clamp((P.jaw||0)/40,0,1);
  if(anim==='walk')return[j*.9+.12,.55+.2*Math.sin(2*ph),.75,.1,.26];
  if(anim==='idle')return[j*.8+.15,.3+.1*Math.sin(ph),.55,0,.4+.08*Math.sin(ph)];
  if(anim==='attack'){const k=sstep(.05,.3,u)*sstep(1,.72,u);return[j,.35+.65*k,.6+.4*k,.25*k,0];}
  if(anim==='hit'){const k=sstep(0,.25,u)*sstep(1,.45,u);return[j*.8+.2*k,.5,.3,.9*k,.2*k];}
  if(anim==='death'){const k=sstep(.45,1,u);return[clamp(j*.9+.25*k,0,.75),.5*(1-sstep(.15,.6,u)),.4*(1-k),.5*(1-sstep(0,.4,u))*sstep(0,.12,u),.68*k];}
  if(anim==='crawl')return[j*.9+.15,.7,.85,.15,.22];
  return[j,.4,.6,0,.15];
}
function clawFor(anim,u,P){
  const ph=u*Math.PI*2;
  const set=(l,r,sl=0,sr=0)=>{P.arms.L.claw=l;P.arms.R.claw=r;P.arms.L.spread=sl;P.arms.R.spread=sr;};
  if(anim==='walk')set(.95+.1*Math.sin(ph),.55+.12*Math.sin(ph+1),0,.5);
  else if(anim==='idle')set(.75,.7,0,.1);
  else if(anim==='attack'){const w=sstep(.05,.3,u)*sstep(.5,.35,u),st=sstep(.38,.55,u);set(lerp(.8,.15,w)+st*.55,lerp(.6,.1,w)+st*.75,w*1.2,w*1.3);}
  else if(anim==='hit')set(.4,.35,.8,.8);
  else if(anim==='death'){const k=sstep(.5,1,u);set(lerp(.3,.55,k),lerp(.3,.45,k),.6*(1-k),.6*(1-k));}
  else if(anim==='crawl')set(1.05+.2*Math.sin(ph),1.05-.2*Math.sin(ph),.3,.3);
}
function pose(anim,u,v){
  const P=rawPose(anim,u,v);
  P.face=faceFor(anim,u,P);clawFor(anim,u,P);P.t=u;
  if(v.type==='invocador'&&anim==='attack'){P.face[1]=.9;P.face[2]=.2;}
  if(v.type==='colmeia'&&!P.swarm)P.swarm=anim==='death'?{n:44,r:22+40*u,t:u,z:4,burst:u}:{n:28,r:28,t:u,z:6};
  if(v.type==='colosso'||v.type==='colmeia'){P.face[1]=Math.max(P.face[1],.8);P.face[2]=Math.max(P.face[2],.9);}
  if(v.type==='notivago'){const j=clamp((P.jaw||0)/40,0,1);P.face=anim==='burn'||anim==='flee'?[j,.9,.9,1,0]:[j,.85,.95,.35,0];
    const cl=anim==='attack'?(u>.4&&u<.75?.2:1.1):anim==='claw'?(u>.4?.15:1.2):anim==='flee'?1.3:1.1;P.arms.L.claw=cl;P.arms.R.claw=cl;P.arms.L.spread=P.arms.R.spread=anim==='attack'||anim==='claw'?1:.4;
    if(anim==='death')P.burn=0;}
  if(v.type==='explosivo'&&anim==='attack'){P.face[3]=.5*P.swell;}
  return (v.gait.reach==='L'&&anim!=='crawl')?mirror(P):P;
}
function rawPose(anim,u,v){
  const tp=TYPE_POSE[v.type]&&TYPE_POSE[v.type][anim];
  if(tp){const std=(a,uu)=>a===anim?rawPoseStd(a,uu,v):rawPose(a,uu,v);const P=tp(u,v,std);if(anim==='walk'||anim==='idle'){/* corpo já definido pelo tipo */}return P;}
  return rawPoseStd(anim,u,v);
}
function rawPoseStd(anim,u,v){
  let P=BASE();const ph=u*Math.PI*2;
  if(anim==='walk'){
    const sL=Math.sin(ph);
    P.legs.L={swing:24*sL,abd:2,knee:8+30*Math.pow(Math.max(0,Math.cos(ph)),1.4),yaw:-4,ankle:-6*sL};
    P.legs.R={swing:-15*sL,abd:5,knee:5+12*Math.max(0,-Math.cos(ph)),yaw:20,ankle:6*sL+8};
    P.root.roll=6*sL;P.root.yaw=7*sL;P.root.f=0;
    P.sp=[4,0,-5*sL];P.ch=[6+3*Math.sin(2*ph),-4*sL,-7*sL];
    P.neck=[6,3*Math.sin(ph+1),6*sL];P.head=[0,4*Math.sin(ph+1.4)];
    P.arms.R={pitch:72+6*Math.sin(2*ph),abd:10,elbow:18+8*sL,yaw:-12};
    P.arms.L={pitch:14-20*sL,abd:12,elbow:22+6*Math.cos(ph),yaw:4};
    P.jaw=8+6*Math.max(0,Math.sin(2*ph));P.sway=-sL;
    P=armsFor(P,v,74,ph);
  }else if(anim==='idle'){
    const b=Math.sin(ph);const tw=sstep(.55,.62,u)*sstep(.78,.7,u);
    P.legs.L={swing:4,abd:5,knee:9,yaw:-6,ankle:0};P.legs.R={swing:-3,abd:6,knee:6,yaw:18,ankle:4};
    P.root.roll=3+1.5*b;P.sp=[4+1.5*b,0,0];P.ch=[6+2.5*b,-2,4];
    P.neck=[6-2*b,0,22*tw];P.head=[2*b,6+8*tw];
    P.arms.R={pitch:22+4*b,abd:12,elbow:20,yaw:-6};P.arms.L={pitch:10+3*b,abd:10,elbow:16,yaw:4};
    P.jaw=10+8*Math.max(0,b);P.sway=b*.5;
    P=armsFor(P,v,30,ph);
  }else if(anim==='attack'){
    const k0=rawPose('walk',0,v);
    const wind=lerpObj(k0,{root:{f:-2,pitch:-4},sp:[0,0,6],ch:[-6,0,10],neck:[-4,0,0],head:[-14,10],jaw:30,
      arms:{L:{pitch:128,abd:22,elbow:58,yaw:-10},R:{pitch:136,abd:20,elbow:52,yaw:-10}},
      legs:{L:{swing:10,abd:4,knee:18,yaw:-4},R:{swing:-14,abd:6,knee:12,yaw:16}}},1);
    const strike=lerpObj(k0,{root:{f:10,pitch:8},sp:[14,0,-4],ch:[30,0,-10],neck:[10,0,0],head:[8,6],jaw:40,
      arms:{L:{pitch:62,abd:6,elbow:8,yaw:-20},R:{pitch:48,abd:4,elbow:6,yaw:-22}},
      legs:{L:{swing:34,abd:4,knee:30,yaw:-4},R:{swing:-26,abd:6,knee:10,yaw:16}}},1);
    const follow=lerpObj(strike,{root:{f:8},ch:[34,0,-4],arms:{L:{pitch:18,abd:10,elbow:16},R:{pitch:10,abd:10,elbow:20}},jaw:22},1);
    P=keys([[0,k0],[.28,wind],[.5,strike],[.72,follow],[1,k0]],u);
    P.sway=-Math.sin(ph);
    return P;
  }else if(anim==='hit'){
    const k0=rawPose('walk',0,v);
    const back=lerpObj(k0,{root:{f:-5,pitch:-6},sp:[-6,0,8],ch:[-16,0,14],neck:[-18,0,0],head:[-22,20],jaw:26,
      arms:{L:{pitch:38,abd:44,elbow:30},R:{pitch:60,abd:40,elbow:26}}},1);
    P=keys([[0,k0],[.3,back],[1,k0]],u);P.sway=1.5;
    return P;
  }else if(anim==='death'){
    const k0=rawPose('walk',0,v);
    const jolt=lerpObj(k0,{root:{f:-4,pitch:-6},sp:[-8,0,10],ch:[-18,0,18],neck:[-20,0,0],head:[-26,24],jaw:30,
      arms:{L:{pitch:46,abd:56,elbow:34},R:{pitch:70,abd:50,elbow:30}}},1);
    const buckle=lerpObj(jolt,{root:{f:-6,pitch:-30,roll:10},sp:[-4,0,6],ch:[-10,0,10],
      legs:{L:{swing:46,abd:6,knee:84},R:{swing:30,abd:10,knee:70}},arms:{L:{pitch:70,abd:70,elbow:40},R:{pitch:94,abd:62,elbow:36}}},1);
    const fall=lerpObj(buckle,{root:{f:-10,pitch:-72,roll:14},sp:[-2,0,0],ch:[-4,0,0],neck:[-8,0,10],head:[-10,30],
      legs:{L:{swing:30,abd:8,knee:44},R:{swing:22,abd:12,knee:36}},arms:{L:{pitch:96,abd:80,elbow:30},R:{pitch:112,abd:72,elbow:28}}},1);
    const down=lerpObj(fall,{root:{f:-12,pitch:-90,roll:12},sp:[0,0,0],ch:[0,0,0],neck:[0,0,26],head:[0,36],jaw:18,
      legs:{L:{swing:8,abd:10,knee:16,yaw:-18},R:{swing:4,abd:14,knee:22,yaw:24}},arms:{L:{pitch:-4,abd:72,elbow:22},R:{pitch:4,abd:28,elbow:34}}},1);
    P=keys([[0,k0],[.16,jolt],[.42,buckle],[.7,fall],[.86,down],[1,down]],u);P.sway=0;
    return P;
  }else if(anim==='crawl'){
    const s1=Math.sin(ph);
    P.root={f:0,z:0,pitch:84,roll:7*s1,yaw:5*s1};
    P.sp=[-6,0,-4*s1];P.ch=[-12,5*s1,-8*s1];P.neck=[-36,0,6*s1];P.head=[-24,8];
    P.arms.R={pitch:150+30*s1,abd:24,elbow:24+46*Math.max(0,-s1),yaw:-8};
    P.arms.L={pitch:150-30*s1,abd:24,elbow:24+46*Math.max(0,s1),yaw:-8};
    P.legs.L={swing:-4+3*s1,abd:9,knee:8,yaw:-8,ankle:-30};P.legs.R={swing:-4-3*s1,abd:11,knee:14,yaw:14,ankle:-30};
    P.jaw=14+10*Math.max(0,Math.sin(2*ph));P.sway=s1;P.legless=!!v.legless;P.armLocal=true;
    return P;
  }
  hunch(P,v);
  return P;
}
// ajuste de corcunda também nas animações de ataque/impacto/morte (vêm do walk já ajustado)

// ---------- folha de sprites ----------
const CELL={w:128,h:144,ground:120,scale:1.05};// bake 2× (no jogo: 64×72, chão em 60)
// ---------- OS OUTROS CINCO (Ares + Afrodite) ----------
Object.assign(VARIANTS,{
  // CORREDOR: magro, pernas longas, corrida desesperada
  atleta:{type:'corredor',name:'Atleta',code:'R1',
    skin:'#a77a5a',shirt:'#5d6b52',shirt2:'#434e3b',pants:'#1d1f23',pants2:'#141518',shoes:'#c4c0b6',hair:'#22160f',
    sleeves:0,shorts:true,hairStyle:'short',sneakers:true,gait:{reach:'R',limp:'R',roll:3},
    wounds:{flank:false,forearmBite:true,forehead:false,kneeTear:false,neck:true},strip:false,
    B:{k:.98,arm:1.03,armR:.78,leg:1.07,legR:.8,tw:.84,tf:.84,chest:.94,neckR:.84,head:.95,hand:.95}},
  ciclista:{type:'corredor',name:'Ciclista',code:'R2',
    skin:'#cfa98c',shirt:'#2c7a82',shirt2:'#1f565c',pants:'#121315',pants2:'#0b0b0d',shoes:'#3a3a40',hair:'#5a381f',
    sleeves:.36,shorts:true,hairStyle:'long',gait:{reach:'L',limp:'L',roll:-3},
    wounds:{flank:true,forearmBite:false,forehead:false,kneeTear:false,neck:false,chest:true},strip:false,
    B:{k:.97,arm:1.02,armR:.76,leg:1.06,legR:.78,tw:.82,tf:.82,chest:.92,neckR:.82,head:.94,hand:.93}},
  // EXPLOSIVO: barriga inchada de gás, pústulas que brilham e crescem antes de estourar
  inchado:{type:'explosivo',name:'Inchado',code:'X1',
    skin:'#8c8a6c',shirt:'#7a6a4e',shirt2:'#5e523c',pants:'#4a4036',pants2:'#342c25',shoes:'#2d241c',hair:'#1a1512',
    sleeves:0,shirtless:true,bloat:true,hairStyle:'bald',belt:true,gait:{reach:'B',limp:'R',roll:4},
    wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:false,
    B:{tw:1.18,tf:1.12,belly:12.5,armR:1.18,legR:1.16,neckR:1.3,neck:.7,hip:1.14,head:1.02,hand:1.08},
    pustules:{glow:'#ff8a3a',c:'#e0a050',n:11}},
  mecanico:{type:'explosivo',name:'Mecânico',code:'X2',
    skin:'#a08a72',shirt:'#8d8470',shirt2:'#6b6453',pants:'#2f4a63',pants2:'#22374a',shoes:'#231c16',hair:'#2b2018',
    sleeves:0,shirtless:true,overalls:true,bloat:true,hairStyle:'short',boots:true,gait:{reach:'R',limp:'L',roll:-5},
    wounds:{flank:false,forearmBite:true,forehead:false,kneeTear:false,neck:false},strip:false,
    B:{tw:1.16,tf:1.1,belly:11.5,armR:1.15,legR:1.14,neckR:1.25,neck:.75,hip:1.12,head:1.0,hand:1.06},
    pustules:{glow:'#ffb238',c:'#d8b452',n:9}},
  // CUSPIDOR: pescoço comprido, bolsas de ácido na garganta, mandíbula que abre além do normal
  moletom:{type:'cuspidor',name:'Moletom',code:'S1',
    skin:'#7c7884',shirt:'#4a4357',shirt2:'#352f40',pants:'#2b2d33',pants2:'#1e2024',shoes:'#3a3632',hair:'#141012',
    sleeves:1,hairStyle:'short',gait:{reach:'B',limp:'R',roll:6},
    wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:true,neck:false},strip:true,
    B:{neck:1.9,neckR:.8,armR:.82,legR:.86,tw:.88,tf:.86,head:.97,jaw:44,hand:1.02,finger:1.15},
    sacs:{glow:'#9cff6a',c:'#7fae5a'}},
  garconete:{type:'cuspidor',name:'Garçonete',code:'S2',
    skin:'#b09888',shirt:'#d6d0c2',shirt2:'#aaa496',pants:'#1c1c20',pants2:'#131316',shoes:'#141012',hair:'#3a2216',
    sleeves:.9,hairStyle:'long',belt:true,gait:{reach:'L',limp:'L',roll:-6},
    wounds:{flank:true,forearmBite:false,forehead:false,kneeTear:false,neck:false,chest:true},strip:false,
    B:{neck:1.8,neckR:.76,armR:.78,legR:.82,tw:.84,tf:.84,head:.95,jaw:44,hand:1.0,finger:1.12},
    sacs:{glow:'#c47aff',c:'#9a6ab8'}},
  // TANQUE: massa muscular, placas de osso calcificado, cabeça pequena afundada nos ombros
  pedreiro:{type:'tanque',name:'Pedreiro',code:'T1',
    skin:'#8a8676',shirt:'#5a6a3a',shirt2:'#3f4b29',pants:'#5a6a3a',pants2:'#3f4b29',shoes:'#3a2a1a',hair:'#151210',
    sleeves:0,shirtless:true,overalls:true,boots:true,hairStyle:'bald',gait:{reach:'B',limp:'R',roll:3},
    wounds:{flank:true,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:false,
    B:{k:1.12,chest:1.4,tw:1.26,tf:1.28,shoulder:1.08,arm:1.06,armR:1.7,forearmR:1.12,legR:1.42,leg:.94,neckR:1.7,neck:.5,head:.86,hand:1.4,hip:1.2,foot:1.25},
    plates:{c:'#c9bc98'}},
  seguranca:{type:'tanque',name:'Segurança',code:'T2',
    skin:'#6e5a4c',shirt:'#1d2024',shirt2:'#121417',pants:'#24272b',pants2:'#181a1d',shoes:'#0f0e0d',hair:'#0f0c0b',
    sleeves:.3,torn:true,boots:true,belt:true,hairStyle:'short',gait:{reach:'B',limp:'L',roll:-3},
    wounds:{flank:false,forearmBite:false,forehead:true,kneeTear:false,neck:false},strip:false,
    B:{k:1.12,chest:1.36,tw:1.22,tf:1.24,shoulder:1.08,arm:1.06,armR:1.62,forearmR:1.12,legR:1.38,leg:.95,neckR:1.65,neck:.5,head:.86,hand:1.36,hip:1.18,foot:1.22},
    plates:{c:'#b8a888',spikes:true}},
  // INVOCADOR: alto e magro, manto com capuz, núcleo que brilha no peito, dedos longos
  profeta:{type:'invocador',name:'Profeta',code:'I1',
    skin:'#9b98a4',shirt:'#3d2a4a',shirt2:'#291c33',pants:null,shoes:null,hair:'#1a1416',hood:'#33233f',
    sleeves:1,gown:true,robe:true,hairStyle:'hood',noEars:true,gait:{reach:'B',limp:null,roll:2},
    wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:false,
    B:{k:1.06,arm:1.12,armR:.82,legR:.85,tw:.9,tf:.88,head:.94,hand:1.18,finger:1.35,neck:1.2,neckR:.85},
    core:{glow:'#d07aff',c:'#e6b8ff'}},
  andarilho:{type:'invocador',name:'Andarilho',code:'I2',
    skin:'#a3978a',shirt:'#4d4640',shirt2:'#352f2a',pants:null,shoes:null,hair:'#2a2420',hood:'#3e3832',
    sleeves:1,gown:true,robe:true,hairStyle:'hood',noEars:true,gait:{reach:'L',limp:'R',roll:-4},
    wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:true},strip:true,
    B:{k:1.05,arm:1.1,armR:.84,legR:.86,tw:.9,tf:.9,head:.95,hand:1.16,finger:1.3,neck:1.15,neckR:.86},
    core:{glow:'#9f7aff',c:'#cdb8ff'}},
});
Object.assign(EYES,{
  atleta:{sclera:'#c79a7a',red:.95,iris:'#c9a020',iris2:'#6a4a08',pupil:.08,glow:'#ffd23a'},
  ciclista:{sclera:'#c4a088',red:.9,iris:'#d8b030',iris2:'#7a5410',pupil:.08,glow:'#ffcc40'},
  inchado:{sclera:'#d0b070',red:.7,iris:'#e07020',iris2:'#7a2a08',pupil:.14,glow:'#ff8030'},
  mecanico:{sclera:'#c8b080',red:.75,iris:'#e08a20',iris2:'#7a3a08',pupil:.14,glow:'#ff9a30'},
  moletom:{sclera:'#a8b890',red:.5,iris:'#9cff6a',iris2:'#2e6a18',pupil:.1,glow:'#9cff6a'},
  garconete:{sclera:'#b8a8c0',red:.5,iris:'#c47aff',iris2:'#4a1a6a',pupil:.1,glow:'#c47aff'},
  pedreiro:{sclera:'#b0a890',red:.9,iris:'#7ad8d0',iris2:'#1a5a54',pupil:.16,glow:'#7ae8e0'},
  seguranca:{sclera:'#a89880',red:.95,iris:'#6ac8c0',iris2:'#184a46',pupil:.16,glow:'#6af0e4'},
  profeta:{sclera:'#2a1830',red:.2,iris:'#e6b8ff',iris2:'#8a3ad0',pupil:.06,glow:'#e0a0ff',hemorrhage:false,void:true},
  andarilho:{sclera:'#201a28',red:.2,iris:'#cdb8ff',iris2:'#6a4ad0',pupil:.06,glow:'#b89aff',void:true},
});

const TYPES={
  comum:{name:'Infectado',tint:'#91b998',variants:['operario','executivo','paciente'],old:'zombie',game:{radius:13,size:1}},
  corredor:{name:'Corredor',tint:'#edbc78',variants:['atleta','ciclista'],old:'runner',game:{radius:11,size:.84},
    anims:{walk:{frames:8,fps:15,loop:true,label:'Correr'},attack:{frames:7,fps:14,loop:false,label:'Bote'},idle:{frames:6,fps:9,loop:true,label:'Parado'}}},
  explosivo:{name:'Explosivo',tint:'#f2897d',variants:['inchado','mecanico'],old:'bomber',game:{radius:14,size:1.02},
    anims:{walk:{frames:8,fps:7,loop:true,label:'Arrastar'},attack:{frames:8,fps:10,loop:false,label:'Inflar'}}},
  cuspidor:{name:'Cuspidor',tint:'#b9a1de',variants:['moletom','garconete'],old:'spitter',game:{radius:13,size:1},
    anims:{walk:{frames:8,fps:8,loop:true,label:'Rondar'},attack:{frames:8,fps:12,loop:false,label:'Cuspir'}}},
  tanque:{name:'Tanque',tint:'#84b1ad',variants:['pedreiro','seguranca'],old:'tank',game:{radius:19,size:1.23},
    cell:{w:176,h:184,ground:160,scale:1.05},
    anims:{walk:{frames:8,fps:6,loop:true,label:'Pisar'},attack:{frames:8,fps:10,loop:false,label:'Esmagar'}}},
  invocador:{name:'Invocador',tint:'#be8ddd',variants:['profeta','andarilho'],old:'summoner',game:{radius:14,size:1},
    anims:{walk:{frames:8,fps:6,loop:true,label:'Flutuar'},attack:{frames:8,fps:9,loop:false,label:'Invocar'},idle:{frames:8,fps:6,loop:true,label:'Parado'}}},
};

// extras gerados a partir do corpo de cada variação (precisam do tronco já calculado)
function buildExtras(v){
  const X=[];const T=v.TORSO;const FN=['root','lumbar','chest'];
  const onTorso=(k,f,phi,lift=0)=>{const A=T[k],B=T[Math.min(k+1,T.length-1)];const same=A[0]===B[0];
    const wx=lerp(A[2],B[2],f),wf=lerp(A[3],B[3],f),cy=lerp(A[4],B[4],f);const z=same?lerp(A[1],B[1],f):A[1]+f*3;
    return{frame:FN[A[0]],off:[Math.cos(phi)*(wx+lift),cy+Math.sin(phi)*(wf+lift),z]};};
  if(v.pustules){const P=v.pustules;const spots=[[2,.3,1.25],[2,.7,1.75],[3,.4,1.5],[1,.6,1.1],[3,.2,2.1],[4,.3,1.0],[2,.5,2.4],[5,.2,1.3],[1,.2,2.0],[4,.6,4.6],[3,.5,4.9]];
    spots.slice(0,P.n).forEach(([k,f,phi],i)=>{const r=1.1+((i*37)%10)/10*1.3;const o=onTorso(k,f,phi,-r*.35);
      X.push({...o,r:[r,r*.9,r],mat:'pustule',grow:.75,glow:P.glow,glowR:1.5,glowA:.55,pulse:1+i%3*.3,col:P.c});});
    // pústulas nos ombros e no pescoço
    X.push({frame:'chest',off:[10.5,1.5,7.5],r:[1.4,1.3,1.4],mat:'pustule',grow:.7,glow:P.glow,pulse:1.4,col:P.c});
    X.push({frame:'neck',off:[-2.6,2.4,2.5],r:[1.2,1.1,1.2],mat:'pustule',grow:.6,glow:P.glow,pulse:1.7,col:P.c});
  }
  if(v.sacs){const S=v.sacs;const L=v.SEG.neck.L;
    X.push({frame:'neck',off:[2.4,2.0,L*.45],r:[1.7,1.6,2.4],mat:'sac',grow:.9,glow:S.glow,glowR:1.8,pulse:1.5,col:S.c});
    X.push({frame:'neck',off:[-2.3,2.2,L*.55],r:[1.5,1.4,2.1],mat:'sac',grow:.9,glow:S.glow,glowR:1.8,pulse:1.8,col:S.c});
    X.push({frame:'neck',off:[0,2.9,L*.25],r:[1.9,1.6,1.7],mat:'sac',grow:1,glow:S.glow,glowR:1.8,pulse:1.2,col:S.c});
    X.push({frame:'head',off:[0,7.5,-3.8],r:[1.5,1.5,1.5],mat:'spit',show:'spit',glow:S.glow,glowR:3,col:S.c});
  }
  if(v.plates){const C=v.plates.c;const sw=13.6*v.B.shoulder*v.B.chest;const T2=v.TORSO;const back=-(T2[5][3])-T2[5][4];const lback=-(T2[3][3])+T2[3][4];
    for(const s of[-1,1]){X.push({frame:'chest',off:[s*sw*.95,-1,11.6],r:[5.6,4.8,3.0],mat:'plate',col:C,rot:[8,s*-24,0]});
      X.push({frame:'chest',off:[s*sw*1.12,-.4,8.4],r:[3.2,3.8,3.4],mat:'plate',col:C});
      X.push({frame:'chest',off:[s*sw*.55,back+.6,7.6],r:[4.0,2.6,4.2],mat:'plate',col:C});}
    X.push({frame:'chest',off:[0,back+.2,4],r:[5.8,2.4,5.0],mat:'plate',col:C});
    X.push({frame:'lumbar',off:[0,lback+.4,3],r:[4.4,2.0,3.6],mat:'plate',col:C});
    if(v.plates.spikes)for(let i=0;i<5;i++){const s=i%2?1:-1;X.push({frame:'chest',off:[s*(1.5+i*1.4),back-.8,9-i*2],r:[.9,.9,2.8],mat:'spike',col:C,rot:[-60,s*20,0]});}
  }
  if(v.core){const C=v.core;
    X.push({frame:'chest',off:[0,7.9,3.2],r:[2.4,1.1,2.6],mat:'core',grow:.25,glow:C.glow,glowR:3.2,pulse:1,col:C.c});
    for(const s of[-1,1])X.push({frame:'chest',off:[s*2.1,7.4,4.6],r:[.9,.6,.9],mat:'core',glow:C.glow,glowR:2,pulse:1.3,col:C.c});
  }
  return X;
}
function extraMat(v,x,s){
  const e=s.e,q=s.q,col=hex(x.col||'#c0a070');let c,wet=0,emi=0;SK=0;
  if(x.mat==='pustule'){const cen=sstep(.2,.95,e[1]>0?Math.max(e[1],e[2]*.3+e[1]):-1);
    c=mix3(mix3(skinTone(v,q,.1),[120,60,70],.5),col,sstep(-.2,.6,e[2]*.3+e[1]+.3));c=mix3(c,[255,236,170],sstep(.7,1,e[1])*.6);
    wet=.85;emi=sstep(.2,.9,e[1])*.55;SK=0;}
  else if(x.mat==='sac'){const vein=Math.abs(vn(e[0]*5,e[2]*5,3)-.5);c=mix3(col,scl(col,.55),sstep(.3,-.6,e[1]));c=mix3(c,[40,30,40],sstep(.035,0,vein)*.7);wet=.95;emi=.4;}
  else if(x.mat==='plate'||x.mat==='spike'){const cr=Math.abs(vn(e[0]*2.5,e[1]*2.5,e[2]*2.5)-.5);c=mix3(col,scl(col,.7),sstep(.5,-.5,e[2])*.8);
    if(cr<.025)c=scl(c,.6);c=mix3(c,[110,40,36],sstep(-.6,-.95,e[2])*.6);wet=.1;}
  else if(x.mat==='spit'){c=col.slice();wet=1;emi=.9;}
  else if(x.mat==='core'){const rib=Math.abs(Math.sin(e[2]*9))<.18;c=mix3(col,[255,255,255],sstep(.4,1,e[1])*.5);if(rib)c=mix3(c,[60,30,70],.7);emi=.85;wet=.6;}
  else c=col;
  return[c[0],c[1],c[2],wet,emi];
}

// ---------- poses próprias de cada tipo ----------
const kf=(base,over)=>lerpObj(base,over,1);
const TYPE_POSE={
  corredor:{
    walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
      P.legs.L={swing:40*s,abd:3,knee:14+80*Math.pow(Math.max(0,c),1.2),yaw:-3,ankle:-12*s};
      P.legs.R={swing:-40*s,abd:3,knee:14+80*Math.pow(Math.max(0,-c),1.2),yaw:6,ankle:12*s};
      P.root.roll=5*s;P.root.yaw=9*s;P.sp=[16,0,-8*s];P.ch=[18+3*Math.sin(2*ph),-5*s+v.gait.roll,-11*s];
      P.neck=[14,0,6*s];P.head=[-16,6];
      P.arms.R={pitch:28+46*s,abd:16,elbow:78+10*c,yaw:-8};P.arms.L={pitch:28-46*s,abd:16,elbow:78-10*c,yaw:-8};
      P.jaw=24+10*Math.max(0,Math.sin(2*ph));P.sway=-s*1.5;return P;},
    attack(u,v,std){const k0=std('walk',0);
      const crouch=kf(k0,{root:{f:-3,pitch:6},sp:[24,0,0],ch:[24,0,0],neck:[-2,0,0],head:[-18,0],jaw:30,
        legs:{L:{swing:34,abd:6,knee:70},R:{swing:-6,abd:6,knee:60}},arms:{L:{pitch:50,abd:30,elbow:60},R:{pitch:56,abd:30,elbow:60}}});
      const leap=kf(k0,{root:{f:18,pitch:34},sp:[6,0,0],ch:[4,0,0],neck:[-24,0,0],head:[-14,0],jaw:42,
        legs:{L:{swing:-26,abd:5,knee:24},R:{swing:-42,abd:5,knee:16}},arms:{L:{pitch:118,abd:24,elbow:12},R:{pitch:124,abd:24,elbow:10}}});
      const land=kf(k0,{root:{f:22,pitch:12},sp:[28,0,0],ch:[26,0,0],neck:[4,0,0],head:[-10,0],jaw:32,
        legs:{L:{swing:44,abd:8,knee:72},R:{swing:-8,abd:8,knee:56}},arms:{L:{pitch:58,abd:12,elbow:18},R:{pitch:50,abd:12,elbow:16}}});
      return keys([[0,k0],[.25,crouch],[.5,leap],[.72,land],[1,kf(k0,{root:{f:12}})]],u);},
    idle(u,v,std){const P=std('idle',u);const ph=u*Math.PI*2;P.neck[2]+=16*Math.sin(ph*3);P.head[1]+=10*Math.sin(ph*5);P.root.roll+=3*Math.sin(ph*2);P.jaw+=8;return P;},
  },
  explosivo:{
    walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
      P.legs.L={swing:15*s,abd:12,knee:8+18*Math.max(0,c),yaw:-12,ankle:0};P.legs.R={swing:-15*s,abd:13,knee:8+18*Math.max(0,-c),yaw:16,ankle:0};
      P.root.roll=10*s;P.root.yaw=4*s;P.sp=[-6,0,0];P.ch=[-2,-5*s+v.gait.roll,3*s];
      P.neck=[18,3*s,6*s];P.head=[-8,10];
      P.arms.R={pitch:16+6*s,abd:30+5*s,elbow:22,yaw:4};P.arms.L={pitch:16-6*s,abd:30-5*s,elbow:22,yaw:4};
      P.jaw=10+6*Math.max(0,s);P.sway=s;return P;},
    attack(u,v,std){const k0=std('walk',0);const w=sstep(0,.85,u);
      const P=kf(k0,{sp:[-12*w,0,0],ch:[-10*w,0,0],neck:[18-34*w,0,0],head:[-8-26*w,0],jaw:6+38*w,
        arms:{L:{pitch:16+52*w,abd:30+46*w,elbow:22-10*w},R:{pitch:16+48*w,abd:30+48*w,elbow:22-10*w}},
        legs:{L:{swing:4,abd:14+4*w,knee:10+10*w},R:{swing:-4,abd:15+4*w,knee:10+10*w}}});
      P.swell=w;P.root.roll=7*Math.sin(u*70)*w;P.root.f=Math.sin(u*55)*1.2*w;P.sway=Math.sin(u*60)*w;return P;},
    idle(u,v,std){const P=std('idle',u);P.sp[0]-=6;P.ch[0]-=6;P.legs.L.abd=12;P.legs.R.abd=13;P.arms.L.abd=28;P.arms.R.abd=28;P.swell=.08+.06*Math.sin(u*Math.PI*2);return P;},
  },
  cuspidor:{
    walk(u,v,std){const P=std('walk',u);P.sp[0]+=8;P.ch[0]+=10;P.legs.L.knee+=14;P.legs.R.knee+=14;
      P.arms.L={pitch:30+8*Math.sin(u*6.283),abd:14,elbow:36,yaw:-6};P.arms.R={pitch:30-8*Math.sin(u*6.283),abd:14,elbow:36,yaw:-6};
      P.neck[0]+=12;P.head[0]-=22;P.swell=.15+.1*Math.sin(u*12.566);return P;},
    attack(u,v,std){const k0=std('walk',0);
      const recoil=kf(k0,{ch:[-6,0,0],neck:[-30,0,0],head:[-26,0],jaw:30,arms:{L:{pitch:20,abd:26,elbow:40},R:{pitch:20,abd:26,elbow:40}}});
      const spit=kf(k0,{ch:[26,0,0],neck:[30,0,0],head:[6,0],jaw:44,arms:{L:{pitch:14,abd:30,elbow:22},R:{pitch:14,abd:30,elbow:22}}});
      const P=keys([[0,k0],[.32,recoil],[.5,spit],[.78,kf(spit,{jaw:30})],[1,k0]],u);
      P.swell=sstep(.05,.32,u)*sstep(.55,.4,u)*1.0+.12;P.spit=u>.45&&u<.98?sstep(.45,.95,u):0;return P;},
  },
  tanque:{
    walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
      P.legs.L={swing:17*s,abd:9,knee:10+24*Math.max(0,c),yaw:-6};P.legs.R={swing:-17*s,abd:10,knee:10+24*Math.max(0,-c),yaw:8};
      P.root.roll=6*s;P.root.yaw=6*s;P.sp=[8,0,-5*s];P.ch=[12,-4*s+v.gait.roll,-8*s];
      P.neck=[20,0,4*s];P.head=[-16,4];
      P.arms.R={pitch:14+16*s,abd:26,elbow:26,yaw:-4,claw:1.1};P.arms.L={pitch:14-16*s,abd:26,elbow:26,yaw:-4};
      P.jaw=14;P.sway=s;return P;},
    attack(u,v,std){const k0=std('walk',0);
      const raise=kf(k0,{root:{f:-2,pitch:-4},sp:[-8,0,0],ch:[-12,0,0],neck:[6,0,0],head:[-18,0],jaw:32,
        arms:{L:{pitch:172,abd:14,elbow:52},R:{pitch:176,abd:14,elbow:48}},legs:{L:{swing:10,abd:12,knee:20},R:{swing:-8,abd:12,knee:16}}});
      const slam=kf(k0,{root:{f:9,pitch:6},sp:[26,0,0],ch:[30,0,0],neck:[10,0,0],head:[-8,0],jaw:42,
        arms:{L:{pitch:58,abd:8,elbow:8},R:{pitch:54,abd:8,elbow:6}},legs:{L:{swing:30,abd:12,knee:44},R:{swing:-16,abd:12,knee:30}}});
      return keys([[0,k0],[.34,raise],[.52,slam],[.74,kf(slam,{jaw:26})],[1,k0]],u);},
  },
  invocador:{
    walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
      P.legs.L={swing:10*s,abd:4,knee:6+12*Math.max(0,c)};P.legs.R={swing:-10*s,abd:4,knee:6+12*Math.max(0,-c)};
      P.root.roll=3*s;P.sp=[4,0,0];P.ch=[6,v.gait.roll,0];P.neck=[2,6*Math.sin(ph),0];P.head=[6,16+4*s];
      P.arms.R={pitch:38+6*s,abd:34,elbow:30,yaw:-12};P.arms.L={pitch:38-6*s,abd:34,elbow:30,yaw:-12};
      P.jaw=18;P.glowAmp=1+.35*Math.sin(2*ph);P.sway=s*.6;return P;},
    idle(u,v){const ph=u*Math.PI*2;const P=TYPE_POSE.invocador.walk(0,v);P.legs.L.swing=2;P.legs.R.swing=-2;
      P.root.roll=2*Math.sin(ph);P.arms.R.pitch=34+8*Math.sin(ph);P.arms.L.pitch=34+8*Math.sin(ph+1);P.head[1]=16+8*Math.sin(ph);P.glowAmp=1+.5*Math.sin(ph);return P;},
    attack(u,v,std){const k0=std('walk',0);
      const rise=kf(k0,{ch:[-14,0,0],sp:[-6,0,0],neck:[-22,0,0],head:[-28,0],jaw:36,
        arms:{L:{pitch:148,abd:44,elbow:14},R:{pitch:152,abd:44,elbow:12}}});
      const P=keys([[0,k0],[.45,rise],[.7,kf(rise,{jaw:40})],[1,k0]],u);
      P.glowAmp=1+2.4*sstep(.1,.55,u)*sstep(1,.7,u);return P;},
  },
};

// NOTÍVAGO: o caçador da noite. Magro, agachado, garras de osso; a luz faz a pele virar brasa.
Object.assign(VARIANTS,{
  sombrio:{type:'notivago',name:'Sombrio',code:'N1',
    skin:'#4a525c',deadMix:.06,shirt:'#1b2026',shirt2:'#11151a',pants:'#14181c',pants2:'#0c0f12',shoes:null,hair:'#0b0d0f',
    sleeves:0,shirtless:true,shorts:true,ribs:true,claws:true,noEars:true,skullFace:true,fangs:true,hairStyle:'none',gait:{reach:'B',limp:null,roll:0},
    wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:true,
    B:{k:1.04,arm:1.24,armR:.7,forearmR:.8,leg:1.02,legR:.72,tw:.76,tf:.7,chest:.94,neck:1.15,neckR:.72,head:.9,hand:1.2,finger:1.25,clawLen:2.5,spine:1.06,jaw:40}},
  cinzento:{type:'notivago',name:'Cinzento',code:'N2',
    skin:'#74716c',deadMix:.1,shirt:'#2a2622',shirt2:'#1c1916',pants:'#221e1a',pants2:'#161310',shoes:null,hair:'#0b0d0f',
    sleeves:0,shirtless:true,shorts:true,ribs:true,claws:true,noEars:true,skullFace:true,fangs:true,hairStyle:'none',gait:{reach:'B',limp:null,roll:0},
    wounds:{flank:true,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:true,
    B:{k:1.06,arm:1.26,armR:.68,forearmR:.8,leg:1.04,legR:.7,tw:.74,tf:.68,chest:.92,neck:1.2,neckR:.7,head:.88,hand:1.22,finger:1.3,clawLen:2.6,spine:1.08,jaw:42}},
});
Object.assign(EYES,{
  sombrio:{sclera:'#0c0e0c',red:0,iris:'#d9ed9d',iris2:'#5c7a2a',pupil:.05,glow:'#b8f070',void:true},
  cinzento:{sclera:'#141210',red:.1,iris:'#e8f0b0',iris2:'#7a8a3a',pupil:.05,glow:'#c8f080',void:true},
});
TYPES.notivago={name:'Notívago',tint:'#9fc27a',variants:['sombrio','cinzento'],old:'midnight',game:{radius:15,size:1.2},night:true,
  anims:{idle:{frames:6,fps:8,loop:true,label:'Espreitar'},walk:{frames:8,fps:13,loop:true,label:'Rondar'},
    attack:{frames:8,fps:14,loop:false,label:'Saltar'},claw:{frames:6,fps:14,loop:false,label:'Garra'},
    hit:{frames:4,fps:12,loop:false,label:'Levar tiro'},flee:{frames:8,fps:14,loop:true,label:'Fugir'},
    burn:{frames:8,fps:9,loop:false,label:'Queimar'},death:{frames:9,fps:10,loop:false,label:'Morrer'},crawl:null}};
TYPE_POSE.notivago={
  walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
    // corrida baixa, quase de quatro: tronco paralelo ao chão, braços varrendo perto do asfalto
    P.legs.L={swing:30*s+18,abd:9,knee:58+40*Math.max(0,c),yaw:-6,ankle:-20};P.legs.R={swing:-30*s+18,abd:9,knee:58+40*Math.max(0,-c),yaw:6,ankle:-20};
    P.root={f:0,z:0,pitch:26,roll:5*s,yaw:6*s};P.sp=[14,0,-6*s];P.ch=[10,-4*s,-8*s];
    P.neck=[-6,0,8*s];P.head=[-30,4*s];
    P.arms.R={pitch:52+34*s,abd:24,elbow:30+20*Math.max(0,s),yaw:-6};P.arms.L={pitch:52-34*s,abd:24,elbow:30+20*Math.max(0,-s),yaw:-6};
    P.jaw=20+12*Math.max(0,Math.sin(2*ph));P.sway=-s;return P;},
  idle(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=BASE();
    P.legs.L={swing:30,abd:12,knee:86,yaw:-10,ankle:-24};P.legs.R={swing:20,abd:12,knee:80,yaw:12,ankle:-24};
    P.root={f:0,z:0,pitch:20,roll:2*b,yaw:0};P.sp=[16+2*b,0,0];P.ch=[12,0,4*b];P.neck=[-8,0,18*Math.sin(ph*2)];P.head=[-28,10*Math.sin(ph*3)];
    P.arms.R={pitch:58+4*b,abd:30,elbow:44,yaw:-10};P.arms.L={pitch:56-4*b,abd:30,elbow:46,yaw:-10};P.jaw=16+8*Math.max(0,b);return P;},
  attack(u,v,std){const k0=std('idle',0);
    const coil=kf(k0,{root:{f:-4,pitch:30},sp:[22,0,0],ch:[16,0,0],neck:[-14,0,0],head:[-34,0],jaw:34,
      legs:{L:{swing:44,abd:12,knee:110,ankle:-30},R:{swing:36,abd:12,knee:104,ankle:-30}},arms:{L:{pitch:30,abd:40,elbow:70},R:{pitch:30,abd:40,elbow:70}}});
    const leap=kf(k0,{root:{f:24,pitch:62,roll:0},sp:[0,0,0],ch:[-6,0,0],neck:[-26,0,0],head:[-24,0],jaw:44,
      legs:{L:{swing:-36,abd:8,knee:30,ankle:10},R:{swing:-46,abd:8,knee:22,ankle:10}},arms:{L:{pitch:150,abd:22,elbow:10},R:{pitch:156,abd:22,elbow:8}}});
    const land=kf(k0,{root:{f:30,pitch:34},sp:[24,0,0],ch:[18,0,0],neck:[-10,0,0],head:[-26,0],jaw:30,
      legs:{L:{swing:46,abd:12,knee:96,ankle:-24},R:{swing:30,abd:12,knee:84,ankle:-24}},arms:{L:{pitch:70,abd:26,elbow:20},R:{pitch:64,abd:26,elbow:22}}});
    const P=keys([[0,k0],[.3,coil],[.55,leap],[.78,land],[1,kf(land,{root:{f:24}})]],u);return P;},
  claw(u,v,std){const k0=std('idle',0);
    const wind=kf(k0,{ch:[6,0,-28],sp:[12,0,-10],arms:{R:{pitch:110,abd:64,elbow:50,yaw:30},L:{pitch:40,abd:30,elbow:50}},jaw:30,head:[-30,-8]});
    const swipe=kf(k0,{ch:[18,0,30],sp:[16,0,14],arms:{R:{pitch:70,abd:-10,elbow:12,yaw:-40},L:{pitch:96,abd:56,elbow:40,yaw:20}},jaw:42,head:[-24,10]});
    return keys([[0,k0],[.32,wind],[.58,swipe],[1,k0]],u);},
  flee(u,v){const P=TYPE_POSE.notivago.walk(u,v);// corre cobrindo o rosto da luz
    P.arms.R={pitch:120,abd:30,elbow:120,yaw:30};P.arms.L={pitch:116,abd:30,elbow:124,yaw:30};P.head=[-6,14];P.neck=[16,0,0];P.root.pitch=34;return P;},
  burn(u,v,std){const k0=std('idle',0);const w=sstep(0,.9,u);
    const writhe=kf(k0,{root:{f:-3,pitch:20-30*w,roll:12*Math.sin(u*40)},sp:[6-20*w,0,0],ch:[-10*w,8*Math.sin(u*33),0],neck:[-20*w,0,14*Math.sin(u*27)],head:[-20-20*w,16*Math.sin(u*31)],jaw:40,
      arms:{R:{pitch:130,abd:24,elbow:110+20*Math.sin(u*25),yaw:30},L:{pitch:126,abd:26,elbow:116,yaw:30}},
      legs:{L:{swing:30,abd:14,knee:90-30*w},R:{swing:14,abd:14,knee:70-20*w}}});
    writhe.burn=.25+.75*w;return writhe;},
};
// ---------- CHEFES (Afrodite + Ares + Hefesto) ----------
// Grade hexagonal: distância normalizada ao centro do favo (0 centro → 1 parede) e id da célula
function hexd(x,y,s){
  const q=(2/3*x)/s,r=(-1/3*x+Math.sqrt(3)/3*y)/s;let cx=q,cz=r,cy=-cx-cz;let rx=Math.round(cx),ry=Math.round(cy),rz=Math.round(cz);
  const dx=Math.abs(rx-cx),dy=Math.abs(ry-cy),dz=Math.abs(rz-cz);
  if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;
  const hx=s*1.5*rx,hy=s*Math.sqrt(3)*(rz+rx/2);const px=Math.abs(x-hx),py=Math.abs(y-hy);
  return[Math.max(px*.866+py*.5,py)/(s*.866),rx*73+rz*19];
}
const fiber=q=>.5+.5*Math.sin(q[2]*3.1+vn(q[0]*.5,q[1]*.5,q[2]*.2)*5+q[0]*.4);
function tearMask(q,th){return sstep(th,th+.09,fbm(q[0]*.13+31,q[1]*.13,q[2]*.13)+.04*vn(q[0]*.9,q[1]*.9,q[2]*.9));}
function muscle(q,k){const f=fiber(q);let c=mix3([96,20,22],[168,58,50],f);c=mix3(c,[60,10,12],sstep(.6,.95,vn(q[0]*.7,q[1]*.7,q[2]*.7))*.5);return c;}
function bumpH(v,kind,q,s){
  if(v.bumpFn)return v.bumpFn(kind,q,s);
  return .1*fbm(q[0]*.8,q[1]*.8,q[2]*.8)+.04*vn(q[0]*2.5,q[1]*2.5,q[2]*2.5);
}
// materiais exclusivos dos chefes (extras)
const BOSS_MAT={
  flesh(v,x,s,e,q){SK=1;let c=skinTone(v,q,.03);const m=v.post?v.post.call(v,x.as||'torso',{q,t:s.t,th:s.th,ext:1},[c[0],c[1],c[2],0,0]):[c[0],c[1],c[2],0,0];SK=1;return[[m[0],m[1],m[2]],m[3],m[4]];},
  bonemass(v,x,s,e,q){const cr=Math.abs(vn(q[0]*.6,q[1]*.6,q[2]*.6)-.5);let c=mix3([222,210,182],[170,150,118],vn(q[0]*.3,q[1]*.3,q[2]*.3));
    if(cr<.018)c=mix3(c,[70,40,34],.7);c=mix3(c,[110,46,38],sstep(.7,.92,fbm(q[0]*.4+3,q[1]*.4,q[2]*.4))*.5);
    c=mix3(c,[120,40,34],sstep(-.35,-.8,e[2])*.55);return[c,.18,0];},
  bone(v,x,s,e,q){const t=s.t!=null?s.t:(e[2]*.5+.5);let c=mix3([226,214,186],[120,96,74],sstep(.2,1,1-t)*.7);
    c=mix3(c,[90,30,26],sstep(.25,0,t)*.6);if(Math.abs(vn(q[0]*1.5,q[1]*1.5,q[2]*1.5)-.5)<.03)c=scl(c,.6);return[c,.2,0];},
  tumor(v,x,s,e,q){let c=mix3(skinTone(v,q,.05),[150,90,96],.55);const vein=Math.abs(vn(q[0]*.8,q[1]*.8,q[2]*.8)-.5);
    c=mix3(c,[80,40,80],sstep(.04,0,vein)*.8);const crack=sstep(.035,0,Math.abs(vn(q[0]*1.4+7,q[1]*1.4,q[2]*1.4)-.5));
    let emi=0;if(x.glow&&crack>0){c=mix3(c,hex(x.glow),crack*.9);emi=crack*.7;}SK=1;return[c,.35,emi];},
  rebar(v,x,s,e,q){const t=s.t||0;const rib=Math.abs(Math.sin(t*(x.L||20)*2.2+s.th*1))>.82;let c=mix3([104,62,40],[58,40,32],vn(q[0]*2,q[1]*2,q[2]*2));
    if(rib)c=scl(c,.75);c=mix3(c,[150,96,60],sstep(.7,.9,vn(q[0]*3+4,q[1]*3,q[2]*3))*.5);const bl=sstep(.45,.5,Math.abs(t-.5))*0;
    const entry=sstep(.12,0,Math.abs(t-x.e1))+sstep(.12,0,Math.abs(t-x.e2));c=mix3(c,BLOOD2,Math.min(1,entry)*.85);return[c,entry>.2?.7:.3,0];},
  chestface(v,x,s,e,q){let c=mix3(skinTone(v,q,.02),[150,110,110],.25);SK=1;let wet=0,emi=0;
    const eyeL=Math.hypot((e[0]+.36)*1.3,e[2]-.28),eyeR=Math.hypot((e[0]-.34)*1.3,e[2]-.3);const eye=Math.min(eyeL,eyeR);
    c=scl(c,1-sstep(.34,.12,eye)*.75);if(eye<.1){c=mix3([20,8,6],hex(x.glow||'#ff9a50'),sstep(.1,.02,eye)*.7);emi=sstep(.1,.03,eye)*.6;wet=.6;SK=0;}
    const mouth=Math.hypot(e[0]*1.6,(e[2]+.42)*1.05);if(mouth<.32){c=mix3(c,[24,6,8],sstep(.32,.2,mouth));wet=.6;SK=0;if(mouth>.2&&mouth<.27&&((Math.atan2(e[2]+.42,e[0])*9|0)%2))c=mix3(c,[170,150,110],.7);}
    c=mix3(c,[90,40,50],sstep(.48,.3,mouth)*sstep(.3,.36,mouth)*.6);
    if(e[1]<.2)c=mix3(c,muscle(q,1),sstep(.2,-.2,e[1]));
    const tear=sstep(.12,.0,Math.abs(e[2]+.05-e[0]*.2))*sstep(.7,.4,Math.abs(e[0]));c=mix3(c,BLOOD2,tear*.4);
    return[c,wet,emi];},
  comb(v,x,s,e,q){const R=x.r[0];const u=Math.atan2(e[0],-e[1])*R,w=e[2]*R*1.1;const[d,id]=hexd(u,w,1.55);
    const larva=h3(id,7,1)>.38,depth=sstep(.92,.7,d);let c,emi=0,wet=.3;SK=0;
    if(d>.82){c=mix3([150,118,104],[96,70,66],vn(q[0],q[1],q[2]));wet=.5;}
    else{c=mix3([70,34,62],[26,12,28],depth);if(larva){const k=sstep(.7,.1,d);const g=hex(x.glow||'#c79aff');c=mix3(c,mix3(g,[255,250,240],k*.5),k);emi=k;wet=.9;}}
    return[c,wet,emi];},
  pod(v,x,s,e,q){const g=hex(x.glow||'#c79aff');const vein=Math.abs(vn(e[0]*4,e[1]*4,e[2]*4)-.5);let c=mix3(g,[255,240,255],sstep(.2,1,e[2])*.35);
    c=mix3(c,[60,20,70],sstep(.04,0,vein)*.8);c=mix3(c,[110,70,90],sstep(-.3,-.8,e[2]));return[c,.9,.62];},
  stalk(v,x,s,e,q){const t=s.t||0;let c=mix3([150,110,120],[90,50,70],t);if(Math.abs(Math.sin(t*22))>.9)c=scl(c,.72);
    c=mix3(c,[60,30,60],sstep(.035,0,Math.abs(vn(q[0]*2,q[1]*2,q[2]*2)-.5))*.7);SK=1;return[c,.45,0];},
  chitin(v,x,s,e,q){const t=s.t||0;let c=mix3([46,36,42],[22,18,22],vn(q[0]*1.5,q[1]*1.5,q[2]*1.5));if(Math.abs(Math.sin(t*14))>.88)c=mix3(c,[110,80,90],.5);
    if(t>.85&&s.cap===1)c=[200,180,160];return[c,.75,0];},
  sac2(v,x,s,e,q){let c=mix3([186,160,172],[120,96,120],sstep(-.2,.8,-e[1]));const g=hex(x.glow||'#c79aff');
    const lv=hexd(e[0]*7,e[2]*7,2.2);const sil=lv[0]<.55&&h3(lv[1],3,3)>.3;if(sil){c=mix3(c,[40,20,46],.75*sstep(.55,.3,lv[0]));}
    const vein=Math.abs(vn(e[0]*5,e[1]*5,e[2]*5)-.5);c=mix3(c,[90,40,90],sstep(.03,0,vein)*.7);c=mix3(c,g,.18);return[c,.95,.3];},
};
const _extraMat=extraMat;
extraMat=function(v,x,s){
  const f=BOSS_MAT[x.mat];if(!f)return _extraMat(v,x,s);
  const e=s.e||[Math.cos(s.th||0),Math.sin(s.th||0),(s.t||0)*2-1];SK=0;const[c,wet,emi]=f(v,x,s,e,s.q);return[c[0],c[1],c[2],wet,emi];
};
const _material=material;
material=function(v,key,s){const m=_material(v,key,s);return v.post?v.post(key,s,m):m;};

// ---------- O COLOSSO ----------
VARIANTS.colosso={type:'colosso',name:'Colosso',code:'K1',
  skin:'#a8928a',deadMix:.28,shirt:'#3b3530',shirt2:'#26221e',pants:'#3a3631',pants2:'#26231f',shoes:null,hair:'#100d0c',
  sleeves:-1,shirtless:true,belt:true,hairStyle:'none',noEars:false,fused:'R',bump:true,gait:{reach:'B',limp:'R',roll:5},
  wounds:{flank:true,forearmBite:false,forehead:true,kneeTear:false,neck:false},strip:true,
  B:{k:1.62,chest:1.58,tw:1.42,tf:1.5,shoulder:1.12,arm:1.04,armR:1.55,forearmR:1.15,legR:1.6,leg:.88,neck:.35,neckR:2.0,head:.74,hand:1.45,hip:1.28,foot:1.45,spine:1.0,jaw:36,
     armRk:[1.18,1.45,1.75],belly:2,bumpK:1.3},
  bumpFn(kind,q,s){
    if(kind==='bonemass'||kind==='bone')return .22*vn(q[0]*.7,q[1]*.7,q[2]*.7)-.25*sstep(.03,0,Math.abs(vn(q[0]*.6,q[1]*.6,q[2]*.6)-.5));
    if(kind==='tumor')return .5*vn(q[0]*.9,q[1]*.9,q[2]*.9)+.08*vn(q[0]*2.2,q[1]*2.2,q[2]*2.2);
    if(kind==='rebar')return .12*Math.sin(q[2]*6.5+Math.atan2(q[1],q[0]));
    if(kind==='chestface')return 0;
    const t=tearMask(q,.6);
    return .38*fbm(q[0]*.26,q[1]*.26,q[2]*.26)+.025*vn(q[0]*2,q[1]*2,q[2]*2)+t*(.18*fiber(q)-.45);
  },
  post(key,s,m){const q=s.q;if(!q)return m;let c=[m[0],m[1],m[2]],wet=m[3],emi=m[4];
    const flesh=/^(torso|uarm|farm|thigh|shin|neck)/.test(key);if(!flesh)return m;
    const legs=/^(thigh|shin)/.test(key);
    if(legs&&!(s.t>.62||key.startsWith('shin'))){// calça arrebentada: tiras e buracos
      if(tearMask(q,.55)>.5){c=skinTone(this,q,.05);SK=1;}}
    else if(legs){c=skinTone(this,q,.05);SK=1;}
    const t=s.ext?0:tearMask(q,key==='torso'?.6:.64);
    const lip=tearMask(q,key==='torso'?.55:.59)*(1-t);if(lip>0)c=mix3(c,[150,108,104],lip*.35);
    if(t>0&&SK){const mc=muscle(q,1);c=mix3(c,mc,sstep(.15,.6,t));c=mix3(c,[48,14,14],sstep(0,.2,t)*sstep(.5,.2,t)*.8);wet=Math.max(wet,t*.75);}
    // veias de calor sob a pele, mais vivas perto dos tumores do ombro
    const vein=Math.abs(vn(q[0]*.28,q[1]*.28,q[2]*.28+5)-.5);const vg=sstep(.012,0,vein)*(key==='torso'?1:.6)*(1-t);
    if(vg>0){c=mix3(c,[255,140,70],vg*.65);emi=Math.max(emi,vg*.45);}
    c=mix3(c,[90,64,80],sstep(.62,.85,fbm(q[0]*.18+9,q[1]*.18,q[2]*.18))*.4);// hematomas
    return[c[0],c[1],c[2],wet,emi];},
  extrasFn(v){const X=[];const T=v.TORSO;const back=-(T[5][3])-T[5][4],backL=-(T[3][3])+T[3][4],sw=13.6*v.B.shoulder*v.B.chest;
    // massa muscular: trapézio em montanha, corcunda tumoral, deltoides, peitorais, dorsais
    X.push({frame:'chest',off:[0,-5,8],r:[sw*.82,8,7],mat:'flesh'});
    X.push({frame:'chest',off:[-3,back+4,9],r:[13,8,10],mat:'flesh'});
    X.push({frame:'chest',off:[6,back+5,13],r:[8,6,7],mat:'tumor',glow:'#ff8a40',glowR:1.2,glowA:.25,pulse:.6,col:'#a86a64'});
    for(const s2 of[-1,1]){X.push({frame:s2>0?'uarmR':'uarmL',off:[0,0,-3.5],r:[s2>0?9:7.5,s2>0?9:7.5,s2>0?10:8.5],mat:'flesh',as:'uarm'+(s2>0?'R':'L')});
      X.push({frame:'chest',off:[s2*sw*.78,-2,-2],r:[5,7,9],mat:'flesh'});}
    // clava: punho direito fundido num bloco de osso com esporões
    X.push({frame:'wristR',off:[0,0,-8],r:[9.5,8.4,11.5],mat:'bonemass',col:'#d6c8a8'});
    X.push({frame:'wristR',off:[0,1.5,-1.5],r:[6.8,6.2,6.4],mat:'tumor',glow:'#ff8a40'});
    for(let i=0;i<8;i++){const a=i/8*6.283;X.push({seg:1,frame:'wristR',a:[Math.cos(a)*6.5,Math.sin(a)*6,-7-(i%2)*4],b:[Math.cos(a)*15,Math.sin(a)*14,-12-(i%3)*4],ra:2.4,rb:.3,mat:'bone'});}
    X.push({seg:1,frame:'wristR',a:[0,0,-17],b:[0,0,-26],ra:2.8,rb:.35,mat:'bone'});
    // espinhos ósseos ao longo da espinha
    for(let i=0;i<7;i++){const z=12-i*3.6,fr=i<4?'chest':'lumbar',by=(i<4?back:backL)+1.5;const s=i%2?1:-1;
      X.push({seg:1,frame:fr,a:[s*1.2,by,i<4?z:z+12],b:[s*2.5,by-7-(i%3)*1.6,(i<4?z:z+12)+4],ra:1.6,rb:.2,mat:'bone'});}
    // tumores no ombro esquerdo e no pescoço
    [[-sw*.85,-2,11,5.4],[-sw*.6,3,13.4,4.1],[-sw*1.05,2.5,7,3.6],[-sw*.75,-6,8,3.8],[-6,5,14.5,3.2],[-sw*.95,-4.5,13,2.8]].forEach(([x,y,z,r],i)=>
      X.push({frame:'chest',off:[x,y,z],r:[r,r*.92,r*1.05],mat:'tumor',glow:'#ff8a40',glowR:1.3,glowA:.35,pulse:.8+i*.2,col:'#b07070'}));
    // placa de osso sobre o crânio (a cabeça afunda entre os ombros)
    X.push({frame:'head',off:[0,-2.5,5.8],r:[5.8,5.2,2.6],mat:'bonemass',rot:[-10,0,0]});
    for(const s2 of[-1,1])X.push({seg:1,frame:'head',a:[s2*4.5,0,5],b:[s2*8.5,-3,10],ra:1.6,rb:.25,mat:'bone'});
    // vergalhões atravessados: entram pela frente, saem pelas costas
    const tf=T[5][3];
    X.push({seg:1,frame:'chest',a:[5,tf+7,3],b:[9,back-8,10],ra:.75,rb:.75,mat:'rebar',e1:.32,e2:.7});
    X.push({seg:1,frame:'chest',a:[-4,tf+9,8],b:[-12,back-6,1],ra:.7,rb:.7,mat:'rebar',e1:.28,e2:.72});
    X.push({seg:1,frame:'lumbar',a:[sw*.7,6,6],b:[-sw*.25,-14,2],ra:.65,rb:.65,mat:'rebar',e1:.3,e2:.68});
    // o rosto que grita no peito: o que sobrou do hospedeiro
    X.push({frame:'chest',off:[4,tf+.6,4.5],r:[5.6,3.2,6.6],mat:'chestface',glow:'#ff9a50',rot:[-4,0,-10]});
    return X;},
};
EYES.colosso={sclera:'#3a1008',red:1,iris:'#ffb060',iris2:'#a03a10',pupil:.07,glow:'#ff8a3a',hemorrhage:true};
TYPES.colosso={name:'O Colosso',tint:'#e0a06d',boss:true,variants:['colosso'],old:'colossus',game:{radius:31,size:1.87},
  cell:{w:300,h:330,ground:298,scale:1.05},
  anims:{idle:{frames:8,fps:6,loop:true,label:'Respirar'},walk:{frames:8,fps:6,loop:true,label:'Avançar'},
    telegraph:{frames:8,fps:8,loop:false,label:'Preparar investida'},attack:{frames:6,fps:12,loop:true,label:'Investida'},
    slam:{frames:8,fps:10,loop:false,label:'Esmagar'},hit:{frames:4,fps:10,loop:false,label:'Levar tiro'},
    death:{frames:12,fps:9,loop:false,label:'Tombar'},crawl:null}};
TYPE_POSE.colosso={
  walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
    P.legs.L={swing:15*s,abd:10,knee:16+26*Math.max(0,c),yaw:-8};P.legs.R={swing:-11*s,abd:12,knee:12+18*Math.max(0,-c),yaw:16};
    P.root.roll=7*s;P.root.yaw=6*s;P.root.pitch=4;P.sp=[12,0,-6*s];P.ch=[16,-6*s+5,-8*s];
    P.neck=[22,0,0];P.head=[-26,6];
    P.arms.R={pitch:4+8*s,abd:20,elbow:10,yaw:-6};// a clava arrasta
    P.arms.L={pitch:22-18*s,abd:26,elbow:30,yaw:-10};
    P.jaw=14+8*Math.max(0,Math.sin(2*ph));P.sway=s;return P;},
  idle(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=TYPE_POSE.colosso.walk(0,v);
    P.legs.L.swing=6;P.legs.R.swing=-4;P.ch[0]=14+3*b;P.sp[0]=10+1.5*b;P.arms.L.pitch=18+4*b;P.jaw=12+12*Math.max(0,b);P.root.roll=2*b;P.neck[2]=8*Math.sin(ph*.5);return P;},
  telegraph(u,v,std){const k0=std('idle',0);const w=sstep(0,.5,u);
    const P=kf(k0,{root:{f:-2,pitch:10},sp:[22*w+10,0,0],ch:[22*w+14,0,0],neck:[10,0,0],head:[-40*w-20,0],jaw:20+30*sstep(.4,.8,u),
      legs:{L:{swing:22,abd:12,knee:40*w+14},R:{swing:-26*w,abd:14,knee:30*w+12,ankle:10*Math.sin(u*25)*w}},
      arms:{L:{pitch:30,abd:46,elbow:50},R:{pitch:18,abd:40,elbow:30}}});
    P.root.roll=3*Math.sin(u*30)*w;return P;},
  attack(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();// investida: ombro na frente, cabeça baixa
    P.legs.L={swing:34*s+8,abd:8,knee:24+56*Math.max(0,c)};P.legs.R={swing:-34*s+8,abd:9,knee:24+56*Math.max(0,-c)};
    P.root={f:4,z:0,pitch:18,roll:5*s,yaw:-14};P.sp=[22,0,-6];P.ch=[22,0,-16];P.neck=[16,0,0];P.head=[-10,0];
    P.arms.R={pitch:-14,abd:26,elbow:6,yaw:10};P.arms.L={pitch:70+10*s,abd:20,elbow:60,yaw:-30};P.jaw=32;return P;},
  slam(u,v,std){const k0=std('idle',0);
    const raise=kf(k0,{root:{f:-2,pitch:-6,yaw:16},sp:[-6,0,14],ch:[-10,0,18],neck:[6,0,0],head:[-30,0],jaw:34,
      arms:{R:{pitch:176,abd:20,elbow:40,yaw:0},L:{pitch:60,abd:40,elbow:40}},legs:{L:{swing:16,abd:12,knee:24},R:{swing:-12,abd:12,knee:18}}});
    const smash=kf(k0,{root:{f:8,pitch:10,yaw:-10},sp:[26,0,-10],ch:[30,0,-16],neck:[16,0,0],head:[-16,0],jaw:44,
      arms:{R:{pitch:40,abd:10,elbow:4,yaw:-10},L:{pitch:40,abd:40,elbow:40}},legs:{L:{swing:34,abd:12,knee:56},R:{swing:-20,abd:12,knee:34}}});
    return keys([[0,k0],[.38,raise],[.55,smash],[.78,kf(smash,{jaw:26})],[1,k0]],u);},
};

// ---------- A COLMEIA ----------
VARIANTS.colmeia={type:'colmeia',name:'Colmeia',code:'H1',
  skin:'#8a8a9e',deadMix:.2,shirt:'#3a2a44',shirt2:'#261c2e',pants:'#241c26',pants2:'#18121a',shoes:null,hair:'#100d12',
  sleeves:-1,shirtless:true,shorts:true,ribs:true,hairStyle:'none',noEars:true,claws:true,bump:true,gait:{reach:'B',limp:'L',roll:-4},
  wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:true},strip:false,
  B:{k:1.48,tw:.94,tf:.9,chest:1.04,arm:1.32,armR:.72,forearmR:.85,legR:.82,leg:1.08,neck:1.35,neckR:.8,head:.92,hand:1.3,finger:1.45,clawLen:1.7,spine:1.15,jaw:42,bumpK:1.2},
  bumpFn(kind,q,s){
    if(kind==='comb'){const R=6;const e=s.e;const[d]=hexd(Math.atan2(e[0],-e[1])*R*1.6,e[2]*R*1.76,1.55);return d>.82?.15:-.55*sstep(.82,.5,d);}
    if(kind==='pod')return .12*vn(q[0]*3,q[1]*3,q[2]*3);
    if(kind==='chitin')return .1*Math.sin((s.t||0)*44);
    if(kind==='stalk')return .14*Math.abs(Math.sin((s.t||0)*22));
    if(kind==='sac2')return .08*vn(q[0]*2,q[1]*2,q[2]*2);
    return .2*fbm(q[0]*.45,q[1]*.45,q[2]*.45)+.06*vn(q[0]*2.6,q[1]*2.6,q[2]*2.6)-.18*sstep(.8,.9,vn(q[0]*1.2,q[1]*1.2,q[2]*1.2+4));
  },
  post(key,s,m){const q=s.q;if(!q)return m;let c=[m[0],m[1],m[2]],wet=m[3],emi=m[4];
    if(!/^(torso|uarm|farm|thigh|shin|neck)/.test(key))return m;
    // furos com larvas na pele (pequenos, em grupos) e veias violeta
    const[d,id]=hexd(q[0]*1.3+q[2]*.3,q[2]*1.3+q[1]*.4,1.1);const cl=sstep(.6,.75,fbm(q[0]*.18+2,q[1]*.18,q[2]*.18));
    if(cl>0&&d<.55&&h3(id,2,2)>.45){c=mix3(c,[30,14,34],cl);if(d<.25&&h3(id,4,4)>.5){c=mix3(c,[220,180,255],cl*.8);emi=Math.max(emi,cl*.6);}wet=.8;}
    const vein=Math.abs(vn(q[0]*.3,q[1]*.3,q[2]*.3+11)-.5);c=mix3(c,[110,60,150],sstep(.025,0,vein)*.7);
    return[c[0],c[1],c[2],wet,emi];},
  extrasFn(v){const X=[];const T=v.TORSO;const back=-(T[5][3])-T[5][4],backL=-(T[3][3])+T[3][4];const G0='#c79aff';
    // a colmeia: massa de favos nas costas e nos ombros
    X.push({frame:'chest',off:[0,back-8,9],r:[15,10.5,17],mat:'comb',glow:G0,glowR:1.1,glowA:.3,grow:.12,pulse:.6});
    X.push({frame:'lumbar',off:[5,backL-5,2],r:[7.5,6,8],mat:'comb',glow:G0,glowR:1.1,glowA:.2,grow:.15,pulse:.8});
    X.push({frame:'chest',off:[-11,back-2,12],r:[5.5,5,5.8],mat:'comb',glow:G0,glowR:1,glowA:.2,grow:.15,pulse:.9});
    X.push({frame:'chest',off:[10,back-1,13],r:[4.8,4.4,5],mat:'comb',glow:G0,glowR:1,glowA:.2,grow:.15,pulse:1.1});
    // coroa: o crânio se abriu em hastes de carne com bolsas luminosas
    const crown=[[-3,0,1,-9,2,12],[0,-1,1,0,-4,14],[3,0,1,9,1,12],[-2,2,1,-6,9,10],[2,2,1,6,9,10],[0,-3,0,1,-10,9]];
    crown.forEach(([ax,ay,az,bx,by,bz],i)=>{const j=X.length;X.push({seg:1,frame:'head',a:[ax,ay,az+5],b:[bx,by,bz+5],ra:1.3,rb:.55,mat:'stalk',sway:[.7+i*.13,1.1],growLen:.2});
      X.push({frame:'head',off:[0,0,0],tip:j,r:[1.9,1.9,2.3],mat:'pod',glow:G0,glowR:2.6,glowA:.8,grow:.6,pulse:1+i*.2});});
    // ventre translúcido com larvas
    X.push({frame:'lumbar',off:[0,T[3][3]+2.5,1],r:[7,5.6,7.4],mat:'sac2',glow:G0,glowR:1.4,glowA:.4,grow:.25,pulse:.7});
    // segundo par de braços: patas de inseto saindo das costas
    for(const s of[-1,1]){X.push({seg:1,frame:'chest',a:[s*7,back+2,8],b:[s*17,back-8,20],ra:1.6,rb:1.1,mat:'chitin',sway:[1.2,1.4]});
      X.push({seg:1,frame:'chest',a:[s*17,back-8,20],b:[s*27,back+2,8],ra:1.1,rb:.35,mat:'chitin',sway:[1.4,2.6]});
      X.push({seg:1,frame:'chest',a:[s*6,back+1,2],b:[s*15,back-6,-2],ra:1.3,rb:.9,mat:'chitin',sway:[1.1,1.2]});
      X.push({seg:1,frame:'chest',a:[s*15,back-6,-2],b:[s*22,back+3,-12],ra:.9,rb:.3,mat:'chitin',sway:[1.3,2.2]});}
    return X;},
};
EYES.colmeia={sclera:'#1a0e22',red:.2,iris:'#e6c8ff',iris2:'#7a3ad0',pupil:.04,glow:'#d6a8ff',void:true};
TYPES.colmeia={name:'A Colmeia',tint:'#b988dd',boss:true,variants:['colmeia'],old:'hive',game:{radius:32,size:1.87},
  cell:{w:320,h:340,ground:300,scale:1.05},
  anims:{idle:{frames:8,fps:6,loop:true,label:'Pulsar'},walk:{frames:8,fps:5,loop:true,label:'Arrastar'},
    telegraph:{frames:8,fps:8,loop:false,label:'Enxame iminente'},attack:{frames:8,fps:10,loop:false,label:'Liberar enxame'},
    hit:{frames:4,fps:10,loop:false,label:'Levar tiro'},death:{frames:12,fps:9,loop:false,label:'Romper'},crawl:null}};
TYPE_POSE.colmeia={
  walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph),c=Math.cos(ph);const P=BASE();
    P.legs.L={swing:12*s,abd:6,knee:14+18*Math.max(0,c)};P.legs.R={swing:-12*s,abd:6,knee:14+18*Math.max(0,-c)};
    P.root.roll=4*s;P.sp=[18,0,-4*s];P.ch=[16,-3*s-4,-5*s];P.neck=[4,0,10*Math.sin(ph)];P.head=[-18,14+6*s];
    P.arms.R={pitch:30+10*s,abd:26,elbow:40,yaw:-10};P.arms.L={pitch:30-10*s,abd:26,elbow:40,yaw:-10};
    P.jaw=18+8*Math.max(0,s);P.swarm={n:28,r:30,t:u,z:6};return P;},
  idle(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=TYPE_POSE.colmeia.walk(0,v);P.legs.L.swing=3;P.legs.R.swing=-3;
    P.ch[0]=16+3*b;P.head[1]=14+8*b;P.swell=.1+.1*b;P.swarm={n:28,r:28,t:u,z:6};return P;},
  telegraph(u,v,std){const k0=std('idle',0);const w=sstep(0,.85,u);
    const P=kf(k0,{sp:[10,0,0],ch:[24*w+10,0,0],neck:[14*w,0,0],head:[-10,0],jaw:20+20*w,
      arms:{L:{pitch:20,abd:50*w+20,elbow:60},R:{pitch:20,abd:50*w+20,elbow:60}},legs:{L:{swing:6,abd:10,knee:30*w+14},R:{swing:-4,abd:10,knee:30*w+14}}});
    P.swell=.15+.85*w;P.swarm={n:28,r:30-14*w,t:u*2,z:6};P.root.roll=2*Math.sin(u*40)*w;return P;},
  attack(u,v,std){const k0=std('idle',0);const b=sstep(.15,.45,u);
    const P=kf(k0,{sp:[-8*b,0,0],ch:[-16*b+8,0,0],neck:[-30*b,0,0],head:[-30*b-10,0],jaw:44*b,
      arms:{L:{pitch:120*b+20,abd:70*b,elbow:20},R:{pitch:116*b+20,abd:70*b,elbow:18}}});
    P.swell=1-sstep(.3,.6,u)*.8;P.swarm={n:44,r:24,t:u*1.5,z:8,burst:sstep(.25,.7,u)};P.glowAmp=1+2*b;return P;},
};
TYPES.colmeia.anims.death.swarmBurst=true;

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

for(const[k_,v]of Object.entries(VARIANTS)){initVariant(k_,v);v.extras=(v.extrasFn?v.extrasFn(v):[]).concat(buildExtras(v));v.extras.forEach((x,i)=>{if(x.seg)v.SEG['xs'+i]={L:x.L||len(sub(x.b,x.a)),ra:x.ra,rb:x.rb};});}
function animsOf(v){const o=Object.assign({},ANIMS,(TYPES[v.type]||{}).anims||{});for(const k in o)if(!o[k])delete o[k];return o;}
function cellOf(v){return(TYPES[v.type]||{}).cell||CELL;}
function bakeCell(ctx,tpl,anim,frame,dir,x0,y0,cell,mod){
  cell=cell||cellOf(tpl.v);const A=animsOf(tpl.v)[anim];const u=A.loop?frame/A.frames:frame/(A.frames-1);
  const P=pose(anim,u,mod&&mod.legless?Object.assign({},tpl.v,{legless:true}):tpl.v);
  // mutilações: esconde um braço inteiro e deixa o coto no ombro
  const stumps=[];if(mod&&mod.noArm){const sd=mod.noArm;P.hide=P.hide||{};for(const p of tpl.parts)if(new RegExp('^(farm|hand|px|pt)'+sd).test(p.key)||p.key==='uarm'+sd)P.hide[p.key]=1;
    stumps.push({key:'uarm'+sd,end:'a'});}
  const pool=anim==='death'?sstep(.6,1,u):0;
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,cell.w,cell.h);ctx.clip();
  render(ctx,tpl,P,{scale:cell.scale,x:x0+cell.w/2,y:y0+cell.ground,facing:dir*Math.PI/4,pool,glow:true,stumps,ao:TYPES[tpl.v.type]&&TYPES[tpl.v.type].boss?1:0});
  ctx.restore();
}
return{muzzleScreen:(v,d,s)=>muzzleScreen(v,d,s),VARIANTS,ANIMS,TYPES,animsOf,cellOf,buildTemplate,render,pose,bakeCell,CELL,hex,buildSkeleton,rawPose:(a,u,v)=>rawPose(a,u,v)};
})();
if(typeof module!=='undefined')module.exports=ZE;
