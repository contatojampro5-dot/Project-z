// ======================================================================
// CIVIS · Olimpo (Afrodite + Ares) — R48 (prólogo em Godot)
// Moradores da Zona Leste no mesmo motor dos sobreviventes, SEM arma, com poses de pânico:
// parado olhando em volta, andar, correr, fugir com os braços para cima, se encolher, falar no celular,
// levar golpe e cair. Também gera Hannah, Antônio (com e sem extintor) e Hadassa desarmados.
// Este arquivo é colado dentro do motor (engine.js) pelo export_civ.html, antes do initVariant.
// ======================================================================
const HANG={pitch:6,abd:9,elbow:16,yaw:0,claw:.42};
const CIV_BODY_M={k:1.0,head:1.12,hand:1.0,chest:1.0,tw:1.0,tf:1.0,shoulder:1.0,jaw:12,foot:1.0};
const CIV_BODY_F={k:.95,head:1.12,hand:.9,chest:.9,tw:.86,tf:.9,hip:1.08,armR:.82,legR:.9,neckR:.84,shoulder:.92,jaw:12,foot:.92};
const civHairL=(c)=>[{frame:'head',off:[-5.4,-1.2,1.6],r:[2.4,4.6,4.4],mat:'hair',col:c},{frame:'head',off:[5.4,-1.2,1.6],r:[2.4,4.6,4.4],mat:'hair',col:c},{frame:'head',off:[0,-4.6,1.4],r:[5.6,2.8,4.6],mat:'hair',col:c}];
const civBackpack=(c)=>[{frame:'chest',off:[0,-9.6,3],r:[8,4,8.4],mat:'pack',col:c},
  {seg:1,frame:'chest',a:[-7,6,10],b:[-6,6.4,-2],ra:.6,rb:.6,mat:'strap',col:'#2e2a24'},{seg:1,frame:'chest',a:[7,6,10],b:[6,6.4,-2],ra:.6,rb:.6,mat:'strap',col:'#2e2a24'}];
const civBust=(c)=>[{frame:'chest',off:[-3.4,5.6,5.6],r:[3.2,2.2,2.8],mat:'top',col:c},{frame:'chest',off:[3.4,5.6,5.6],r:[3.2,2.2,2.8],mat:'top',col:c}];
const civCap=(c)=>[{frame:'head',off:[0,-.4,4.6],r:[6.2,7.3,3.9],mat:'cap',col:c,rot:[-8,0,0]},{frame:'head',off:[0,8.0,3.5],r:[5.4,4.6,.8],mat:'capbrim',col:c,rot:[-16,0,0]}];
const PHONE={frame:'handR',off:[0,.6,3.2],r:[1.5,.5,2.8],mat:'gunpoly',col:'#16181b',showIf:'phone'};
// extintor: cilindro vermelho preso na mão direita, com bico preto
const EXTINTOR=[{seg:1,frame:'handR',a:[0,1.6,1],b:[0,1.6,15],ra:2.6,rb:2.6,mat:'metal',col:'#c21f1f'},
  {frame:'handR',off:[0,1.6,16],r:[1.6,1.6,1.4],mat:'gunpoly',col:'#202124'},
  {seg:1,frame:'handR',a:[0,1.6,16],b:[0,5.2,17.5],ra:.5,rb:.5,mat:'gunpoly',col:'#202124'}];

const CIVS={
  // gente da rua
  executivo:{name:'Executivo',sex:'m',skin:'#c89a7a',hair:'#2a2018',top:{kind:'shirt',c:'#d8d6d0',s:'#aeaaa2'},sleeves:1,pants:{c:'#2c2f36',s:'#1e2126'},shoes:'#1a1612',belt:'#1e1612'},
  atendente:{name:'Atendente',sex:'f',skin:'#a87656',hair:'#1a120c',hairStyle:'long',top:{kind:'shirt',c:'#7a2f3a',s:'#5a1f28'},sleeves:.5,pants:{kind:'jeans',c:'#2e3a52',s:'#1f2840'},shoes:'#2a201a'},
  estudante:{name:'Estudante',sex:'m',skin:'#e0b896',hair:'#3a2a1e',top:{kind:'hoodie',c:'#5b6270',s:'#41464f',inner:'#d8d2c4'},sleeves:1,pants:{kind:'jeans',c:'#3c4e6a',s:'#2a3850'},shoes:'#e8e4dc',sole:'#f2efe8',acc:v=>civBackpack('#2b3b2e')},
  estudante2:{name:'Estudante',sex:'f',skin:'#7a4e34',hair:'#140e0a',hairStyle:'long',top:{kind:'shirt',c:'#d9a23a',s:'#b07e22'},sleeves:.35,pants:{kind:'jeans',c:'#2a2d33',s:'#1c1e22'},shoes:'#e8e4dc',sole:'#f2efe8',acc:v=>civBackpack('#6a2a3a')},
  idoso:{name:'Idoso',sex:'m',skin:'#c8a088',hair:'#d8d4cc',beard:'none',grayBeard:true,top:{kind:'shirt',c:'#b8a888',s:'#948468'},sleeves:.5,pants:{c:'#5a5650',s:'#423f3a'},shoes:'#3a2c22',belt:'#3a2a1e',B:{k:.97,chest:.98,tw:1.04,head:1.1}},
  idosa:{name:'Idosa',sex:'f',skin:'#d8b49c',hair:'#e2ded6',hairStyle:'long',top:{kind:'shirt',c:'#6a7a9a',s:'#4e5a74'},sleeves:.6,pants:{c:'#4a4440',s:'#36312e'},shoes:'#2a2420'},
  pedreiro:{name:'Pedreiro',sex:'m',skin:'#8a5a3c',hair:'#18120e',beard:'full',top:{kind:'jacket',c:'#e0782a',s:'#b85a18',inner:'#5a5a5a',open:.2},sleeves:.5,pants:{c:'#6a6458',s:'#4e4a40',cargo:true},boots:{c:'#4a3a2a',top:.5},acc:v=>civCap('#e8e2d2')},
  motoboy:{name:'Motoboy',sex:'m',skin:'#6a4430',hair:'#100c0a',top:{kind:'jacket',c:'#2a2a2e',s:'#1a1a1e',inner:'#8a1f1f',open:.12},sleeves:1,pants:{kind:'jeans',c:'#2c3442',s:'#1e2430'},shoes:'#1a1a1a',
    acc:v=>[{frame:'chest',off:[0,-10.5,6],r:[9.5,6.2,9.5],mat:'pack',col:'#b8241e'},{seg:1,frame:'chest',a:[-7,6,10],b:[-6,6.4,-2],ra:.6,rb:.6,mat:'strap',col:'#1e1e1e'},{seg:1,frame:'chest',a:[7,6,10],b:[6,6.4,-2],ra:.6,rb:.6,mat:'strap',col:'#1e1e1e'}]},
  torcedor:{name:'Torcedor',sex:'m',skin:'#b07a56',hair:'#141010',top:{kind:'jersey',c:'#f2f0ea',s:'#c8c4ba',number:'10',numC:'#1d1d1d'},sleeves:.42,pants:{kind:'sweat',c:'#1e1e22',s:'#141418'},shoes:'#e8e4dc',sole:'#f0ece6'},
  torcedora:{name:'Torcedora',sex:'f',skin:'#c89070',hair:'#2a1a10',hairStyle:'long',top:{kind:'jersey',c:'#1d1d20',s:'#121214',number:'9',numC:'#f2f0ea'},sleeves:.42,pants:{kind:'jeans',c:'#3c4e6a',s:'#2a3850'},shoes:'#e8e4dc',sole:'#f0ece6'},
  enfermeiro:{name:'Enfermeiro',sex:'m',skin:'#9a6a4c',hair:'#1c140f',top:{kind:'shirt',c:'#5a9a92',s:'#3e7a72'},sleeves:.4,pants:{c:'#5a9a92',s:'#3e7a72'},shoes:'#e0ddd6',sole:'#f0ede6'},
  funcionaria:{name:'Funcionária',sex:'f',skin:'#b8866a',hair:'#22160e',hairStyle:'long',top:{kind:'shirt',c:'#b8232a',s:'#8a1a1f'},sleeves:.45,pants:{c:'#22252c',s:'#16181d'},shoes:'#1a1612',acc:v=>civCap('#b8232a')},
  policial:{name:'Policial',sex:'m',skin:'#a87656',hair:'#16100c',top:{kind:'shirt',c:'#58606a',s:'#40464e'},sleeves:1,pants:{c:'#3a4048',s:'#2a2f35',cargo:true},boots:{c:'#141414',top:.6},belt:'#141414',
    acc:v=>[...civCap('#2a3038'),{frame:'chest',off:[0,4,4],r:[9.6,5.2,9],mat:'pad',col:'#2a2e34'}]},
  jovem:{name:'Jovem',sex:'m',skin:'#5a3a2a',hair:'#0e0a08',top:{kind:'shirt',c:'#2f6db3',s:'#22508a'},sleeves:.35,pants:{kind:'sweat',c:'#7a7a7e',s:'#56565a'},shoes:'#d8d4cc',sole:'#e8e4dc',acc:v=>civCap('#1d1d20')},
  // protagonistas desarmados (prólogo: ninguém está armado ainda)
  hanna:{name:'Hanna',char:'hanna',sex:'f',skin:'#d6aa8e',hair:'#9a5a32',freckles:true,top:{kind:'hoodie',c:'#2e2b2a',s:'#1f1d1c',inner:'#a39a88'},sleeves:1,pants:{kind:'jeans',c:'#3e3a36',s:'#2c2926'},boots:{c:'#5e4430',top:.66},
    eyes:{iris:'#5a7a4a',iris2:'#243a1a'},B:CIV_BODY_F,acc:v=>[...civHairL('#9a5a32'),...civBackpack('#5e5238'),...civBust('#2e2b2a'),PHONE]},
  hadassa:{name:'Hadassa',char:'hadassa',sex:'f',skin:'#c4987c',hair:'#2a1a12',hairStyle:'long',top:{kind:'jacket',c:'#4a4436',s:'#34302a',inner:'#d8d4c8',open:.26},sleeves:1,farmSleeve:.45,
    pants:{c:'#3a3530',s:'#2a2622',cargo:true},kneepads:'#34312d',boots:{c:'#5a4030',top:.6},eyes:{iris:'#6a4a2a',iris2:'#2e1c0c'},B:CIV_BODY_F,
    acc:v=>[{frame:'neck',off:[0,1.2,1.2],r:[4.4,4.0,2.0],mat:'cloth',col:'#7a2a24'},
      {frame:'uarmL',off:[0,0,-5],r:[3.3,3.3,2.2],mat:'cloth',col:'#e8e4da'},{frame:'uarmL',off:[0,2.6,-5],r:[1.4,1.0,1.6],mat:'cloth',col:'#c01e1e'},
      {frame:'root',off:[-9.6,3.6,-2],r:[2.8,2.8,3.4],mat:'cloth',col:'#e8e2d6'},{frame:'root',off:[-9.6,6.2,-2],r:[1.2,.6,1.8],mat:'cloth',col:'#c01e1e'},
      {frame:'chest',off:[0,-9.6,3],r:[8,4,8.4],mat:'pack',col:'#5a5038'},...civBust('#d8d4c8')]},
  antonio:{name:'Antônio',char:'antonio',sex:'m',skin:'#9a6a4c',hair:'#1c140f',beard:'full',grayBeard:true,scar:true,top:{kind:'shirt',c:'#a8916f',s:'#7e6a50'},sleeves:.5,belt:'#4a3020',
    pants:{c:'#4f4b34',s:'#39361f',cargo:true},shoes:'#5e4a38',sole:'#d2c6b0',eyes:{iris:'#5a3820',iris2:'#2a180c'},
    B:{k:1.0,head:1.12,hand:1.0,chest:1.06,tw:1.04,tf:1.02,armR:1.06,legR:1.04,shoulder:1.02,jaw:12,foot:1.05},
    acc:v=>[...civCap('#3a2e25'),{frame:'wristL',off:[0,0,2.0],r:[2.9,2.9,1.25],mat:'watch',col:'#1c1d20'}]},
};
CIVS.antonio_ext=Object.assign({},CIVS.antonio,{extintor:true,acc:v=>CIVS.antonio.acc(v).concat(EXTINTOR)});

for(const[id,b]of Object.entries(CIVS)){
  const f=b.sex==='f';
  const v={type:'civil',alive:true,stylized:true,unarmed:true,extintor:!!b.extintor,code:'C_'+id,char:b.char||'civil',weapon:'pistol',cls:'curta',name:b.name,
    skin:b.skin,hair:b.hair,shirt:b.top.c,shirt2:b.top.s,pants:b.pants.c,pants2:b.pants.s,shoes:b.shoes||'#3a3028',
    sex:b.sex,beard:b.beard||(f?'none':'stubble'),grayBeard:b.grayBeard,scar:b.scar,freckles:b.freckles,tattoo:b.tattoo,wraps:false,
    top:Object.assign({},b.top,{cC:hex(b.top.c),sC:hex(b.top.s),iC:hex(b.top.inner||b.top.c),nC:hex(b.top.numC||'#ffffff')}),
    sleeves:b.sleeves,farmSleeve:b.farmSleeve||0,blood:0,belt:!!b.belt,beltC:hex(b.belt||'#3a2a1e'),
    pantsSpec:b.pants,soleC:hex(b.sole||'#2a2420'),shoeStripe:b.shoeStripe,
    boots:b.boots?{top:b.boots.top}:null,bootsC:b.boots?hex(b.boots.c):null,gloves:false,glovesC:null,kneepads:b.kneepads,
    hairStyle:b.hairStyle||'short',gait:{reach:'R',limp:null,roll:0},
    wounds:{flank:false,forearmBite:false,forehead:false,kneeTear:false,neck:false},strip:false,
    B:Object.assign({},f?CIV_BODY_F:CIV_BODY_M,b.B||{})};
  v.extrasFn=vv=>(b.acc?b.acc(vv):[]).concat(f&&!b.char?civBust(b.top.c):[]);
  VARIANTS['civ_'+id]=v;
  EYES['civ_'+id]={sclera:'#e7dfd2',red:0,iris:(b.eyes||{}).iris||'#4a3220',iris2:(b.eyes||{}).iris2||'#22140a',pupil:.2,glow:'#000000'};
}

// ---------- poses sem arma ----------
const armSwing=(P,s,amp,elb)=>{P.arms.R={pitch:8+amp*s,abd:9,elbow:elb+6*s,yaw:-4,claw:.5};P.arms.L={pitch:8-amp*s,abd:9,elbow:elb-6*s,yaw:4,claw:.5};};
const SP0=Object.assign({},SP);// poses originais (antes de embrulhar)
const CIVP={
  idle(u,v){const ph=u*Math.PI*2,b=Math.sin(ph);const P=stance(BASE(),v,b);P.head=[2+b,20*Math.sin(ph)];P.ch=[1+b,0,6*Math.sin(ph)];
    P.arms.R={...HANG,pitch:6+2*b};P.arms.L={...HANG,pitch:6-2*b};
    if(v.extintor)P.arms.R={pitch:4,abd:12,elbow:10,yaw:0,claw:1.1};P.jaw=2;return P;},
  walk(u,v){const ph=u*Math.PI*2,s=Math.sin(ph);const P=BASE();legsWalk(P,ph,.9);P.root.yaw=4*s;P.sp=[3,0,-2*s];P.ch=[2,0,-4*s];P.head=[4,0];
    armSwing(P,-s,22,18);if(v.extintor)P.arms.R={pitch:6,abd:12,elbow:12,yaw:0,claw:1.1};return P;},
  run(u,v){const ph=u*Math.PI*2,s=Math.sin(ph);const P=BASE();
    P.legs.L={swing:46*s,abd:3,knee:14+72*Math.pow(Math.max(0,Math.cos(ph)),1.2),yaw:-2,ankle:-14*s};
    P.legs.R={swing:-46*s,abd:3,knee:14+72*Math.pow(Math.max(0,-Math.cos(ph)),1.2),yaw:2,ankle:14*s};
    P.root.z=2.4*Math.abs(Math.sin(ph))-1.6;P.root.roll=3*s;P.root.yaw=6*s;P.sp=[12,0,0];P.ch=[8,0,-8*s];P.neck=[-6,0,6*s];P.head=[-4,0];
    P.arms.R={pitch:20-50*s,abd:10,elbow:84+8*s,yaw:-6,claw:.9};P.arms.L={pitch:20+50*s,abd:10,elbow:84-8*s,yaw:6,claw:.9};
    if(v.extintor)P.arms.R={pitch:12-16*s,abd:14,elbow:24,yaw:0,claw:1.1};P.jaw=8;return P;},
  flee(u,v){const P=CIVP.run(u,v),ph=u*Math.PI*2,s=Math.sin(ph);// pânico: braços para cima, olhando para trás
    P.arms.L={pitch:150+10*s,abd:40,elbow:90+20*s,yaw:20,claw:.3};P.arms.R={pitch:110-30*s,abd:60+10*s,elbow:40,yaw:-10,claw:.2};
    P.head=[-8,34*Math.sin(ph*.5)];P.neck=[-8,0,20];P.jaw=14;return P;},
  cower(u,v){const ph=u*Math.PI*2,b=Math.sin(ph*2);const P=stance(BASE(),v,0);// agachado, braços na cabeça, tremendo
    P.root.z=-16;P.legs.L={swing:50,abd:12,knee:100,yaw:-10,ankle:-24};P.legs.R={swing:44,abd:14,knee:104,yaw:12,ankle:-20};
    P.sp=[26,0,b*2];P.ch=[22,0,0];P.neck=[16,0,0];P.head=[18,0];
    P.arms.L={pitch:150,abd:30,elbow:120,yaw:30,claw:.3};P.arms.R={pitch:150,abd:30,elbow:120,yaw:-30,claw:.3};P.jaw=10;return P;},
  phone(u,v){const P=CIVP.idle(u,v);P.arms.R={pitch:28,abd:34,elbow:148,yaw:44,claw:.85};P.head=[8,-10];P.phone=1;return P;},
  look(u,v){const P=CIVP.phone(u,v);P.arms.R={pitch:52,abd:12,elbow:96,yaw:30,claw:.85};P.head=[22,-4];return P;},// olhando a tela do celular
  hit(u,v){const k=sstep(0,.25,u)*sstep(1,.4,u);const P=CIVP.idle(0,v);
    P.root.f=-3*k;P.root.pitch=-6*k;P.sp=[-6*k,0,6*k];P.ch=[-12*k,0,10*k];P.neck=[-10*k,0,0];P.head=[-14*k,12*k];
    P.arms.L={pitch:40*k+6,abd:30+30*k,elbow:50,claw:.3};P.arms.R={pitch:30*k+6,abd:30+40*k,elbow:40,claw:.3};return P;},
  death(u,v){const P=SP0.death(u,v);P.gun=null;P.noWeapon=true;return P;},
  swing(u,v){// golpe com o extintor: ergue com as duas mãos e desce com força
    const up=sstep(0,.35,u),down=sstep(.45,.7,u);const P=stance(BASE(),v,0);
    P.legs.L.swing=14;P.legs.R.swing=-16;P.legs.R.yaw=20;P.ch=[-10*up+30*down,0,-14*up+10*down];P.sp=[-6*up+20*down,0,0];P.head=[-6*up+14*down,0];
    const pitch=lerp(lerp(20,175,up),70,down),el=lerp(lerp(40,30,up),10,down);
    P.arms.R={pitch,abd:6,elbow:el,yaw:-14,claw:1.1};P.arms.L={pitch:pitch-6,abd:8,elbow:el+20,yaw:24,claw:1.0};return P;},
};
for(const k of Object.keys(CIVP)){const prev=SP[k];SP[k]=function(u,v){if(v&&v.unarmed){const P=CIVP[k](u,v);P.gun=null;P.noWeapon=true;return P;}return prev?prev(u,v):SP.idle(u,v);};}
TYPES.civil={name:'Civil',tint:'#c8b898',variants:Object.keys(CIVS).map(k=>'civ_'+k),old:'survivor',game:{radius:12,size:1},
  cell:{w:128,h:128,ground:108,scale:1.3},
  anims:{idle:{frames:6,fps:5,loop:true},walk:{frames:8,fps:9,loop:true},run:{frames:8,fps:13,loop:true},flee:{frames:8,fps:13,loop:true},
    cower:{frames:4,fps:8,loop:true},phone:{frames:4,fps:4,loop:true},look:{frames:4,fps:4,loop:true},hit:{frames:4,fps:12,loop:false},death:{frames:10,fps:9,loop:false},
    swing:{frames:6,fps:16,loop:false},attack:null,crawl:null}};

// infectados do prólogo na mesma escala dos civis (célula 128, escala 1.3)
TYPES.comum.cell={w:128,h:128,ground:108,scale:1.3};
TYPES.corredor.cell={w:128,h:128,ground:108,scale:1.3};
// animações exportadas por variante (o resto não entra, para economizar memória de vídeo)
const CIV_EXPORT={
  civil:['idle','walk','run','flee','cower','hit','death','phone'],
  protag:['idle','walk','run','flee','cower','hit','death','phone','look'],
  antonio_ext:['idle','walk','run','hit','death','swing'],
  infectado:['idle','walk','attack','hit','death'],
};
