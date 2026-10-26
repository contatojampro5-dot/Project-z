// Exporta folhas em resolução cheia (uma imagem por animação) para o prólogo em Godot.
// Uso: node export_civ.js <pasta-saida> [prefixos,separados,por,virgula]
// Monta o motor + civis.js numa página e renderiza cada variante nas 8 direções.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const OUT=path.resolve(process.argv[2]||'saida_civis');fs.mkdirSync(OUT,{recursive:true});
const only=process.argv[3]?process.argv[3].split(','):null;
const eng=fs.readFileSync(path.join(__dirname,'engine.js'),'utf8');
const civ=fs.readFileSync(path.join(__dirname,'civis.js'),'utf8');
const MARK='for(const[k_,v]of Object.entries(VARIANTS)){initVariant(k_,v);';
if(!eng.includes(MARK))throw new Error('ponto de injeção não encontrado no engine.js');
const engine=eng.replace(MARK,civ+'\n'+MARK).replace('return{muzzleScreen:','return{CIV_EXPORT,muzzleScreen:');
const page=`<html><body><script>${engine}</script><script>
function stylize(c){const x=c.getContext('2d'),W=c.width,H=c.height,img=x.getImageData(0,0,W,H),d=img.data;
  for(let i=0;i<d.length;i+=4){if(d[i+3]<200)continue;let r=d[i],g=d[i+1],b=d[i+2];const l=(r+g+b)/3;
    r=l+(r-l)*1.28;g=l+(g-l)*1.28;b=l+(b-l)*1.28;r=(r-128)*1.1+134;g=(g-128)*1.1+134;b=(b-128)*1.1+134;
    d[i]=Math.max(0,Math.min(255,r));d[i+1]=Math.max(0,Math.min(255,g));d[i+2]=Math.max(0,Math.min(255,b));}
  x.putImageData(img,0,0);}
window.exportAnim=(k,a)=>{const v=ZE.VARIANTS[k];const A=ZE.animsOf(v);const def=A[a];const cl=ZE.cellOf(v);const t=ZE.buildTemplate(v,1.15);
 const g=document.createElement('canvas');g.width=cl.w*8;g.height=cl.h*def.frames;const gx=g.getContext('2d');
 const cell=document.createElement('canvas');cell.width=cl.w;cell.height=cl.h;const cx=cell.getContext('2d');
 for(let f=0;f<def.frames;f++){const u=def.loop?f/def.frames:f/(def.frames-1);const P=ZE.pose(a,u,v);P.flash=0;
   for(let d=0;d<8;d++){cx.clearRect(0,0,cl.w,cl.h);ZE.render(cx,t,P,{scale:cl.scale,x:cl.w/2,y:cl.ground,facing:d*Math.PI/4,fill:.45,outlineMax:1.7,glow:true});
     stylize(cell);gx.drawImage(cell,d*cl.w,f*cl.h);}}
 return {img:g.toDataURL('image/webp',.88),frames:def.frames,fps:def.fps,loop:!!def.loop,cell:{w:cl.w,h:cl.h,ground:cl.ground}};};
window.jobs=(only)=>{const out=[];const INF=['operario','executivo','paciente','atleta'];
  for(const k of Object.keys(ZE.VARIANTS)){const v=ZE.VARIANTS[k];
  if(only&&!only.some(o=>k.startsWith(o)))continue;if(!only&&v.type!=='civil'&&!INF.includes(k))continue;
  const set=INF.includes(k)?ZE.CIV_EXPORT.infectado:k==='civ_antonio_ext'?ZE.CIV_EXPORT.antonio_ext:v.char!=='civil'&&v.type==='civil'?ZE.CIV_EXPORT.protag:ZE.CIV_EXPORT.civil;
  const have=ZE.animsOf(v);for(const a of set)if(have[a])out.push([k,a]);}return out;};
</script></body></html>`;
const pageFile=path.join(OUT,'_motor.html');fs.writeFileSync(pageFile,page);
(async()=>{const b=await chromium.launch();
 const p0=await b.newPage();p0.on('pageerror',e=>console.log('ERRO',e.message));await p0.goto('file://'+pageFile);
 const queue=await p0.evaluate(o=>jobs(o),only);await p0.close();console.log(queue.length,'animações');
 const idxF=path.join(OUT,'folhas.json');const index=fs.existsSync(idxF)?JSON.parse(fs.readFileSync(idxF)):{};
 const worker=async()=>{const p=await b.newPage();p.on('pageerror',e=>console.log('ERRO',e.message));await p.goto('file://'+pageFile);
   while(queue.length){const [k,a]=queue.shift();const t=Date.now();const r=await p.evaluate(([k,a])=>exportAnim(k,a),[k,a]);
     fs.writeFileSync(path.join(OUT,`${k}__${a}.webp`),Buffer.from(r.img.split(',')[1],'base64'));
     index[k]=index[k]||{cell:r.cell,anims:{}};index[k].anims[a]={frames:r.frames,fps:r.fps,loop:r.loop};
     fs.writeFileSync(idxF,JSON.stringify(index,null,1));console.log(k,a,((Date.now()-t)/1000).toFixed(1)+'s');}
   await p.close();};
 await Promise.all([worker(),worker(),worker(),worker()]);fs.unlinkSync(pageFile);await b.close();console.log('FIM');})();
