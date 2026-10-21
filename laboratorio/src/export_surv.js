const {chromium}=require('playwright');const fs=require('fs');
const OUT='/home/claude/project-z/assets/images/game/sobreviventes';fs.mkdirSync(OUT,{recursive:true});
const only=process.argv[2]?process.argv[2].split(','):null;
(async()=>{const b=await chromium.launch();
 const p0=await b.newPage();await p0.goto('file:///home/claude/zlab/export_surv.html');let keys=await p0.evaluate(()=>keys());await p0.close();
 if(only)keys=keys.filter(k=>only.some(o=>k.startsWith(o)));
 const idxF=OUT+'/sobreviventes.json';const index=fs.existsSync(idxF)?JSON.parse(fs.readFileSync(idxF)):{};
 const queue=keys.slice();
 const worker=async()=>{const p=await b.newPage();await p.goto('file:///home/claude/zlab/export_surv.html');
   while(queue.length){const k=queue.shift();const t=Date.now();const v=await p.evaluate(k=>exportOne(k),k);
     fs.writeFileSync(OUT+'/'+k+'.webp',Buffer.from(v.img.split(',')[1],'base64'));
     index[k]={cell:v.cell,anims:v.meta,muzzle:v.muzzle};fs.writeFileSync(idxF,JSON.stringify(index));
     console.log(k,((Date.now()-t)/1000).toFixed(0)+'s');}
   await p.close();};
 await Promise.all([worker(),worker(),worker(),worker()]);await b.close();console.log('FIM');})();
