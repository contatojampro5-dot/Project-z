const { chromium } = require('playwright');const fs=require('fs');
const [,,who,kind,outFile,hideArg]=process.argv;
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage();
p.on('console',m=>{if(m.type()==='error')console.log('ERR',m.text())});p.on('pageerror',e=>console.log('PE',e.message));
await p.goto('http://127.0.0.1:8899/studio.html');await p.waitForFunction(()=>window.ready);
const walk=kind==='runner'?{anim:'s_zombie_run',frames:8,loop:true}:{anim:'n_walking',frames:8,loop:true};
const hide=hideArg?hideArg.split(','):[];
const rows=[walk,{anim:'n_zombie_punching',frames:7},{anim:'n_zombie_reaction_hit',frames:4,to:.45},{anim:'s_zombie_death',frames:9,center:true},
  {anim:'s_zombie_crawl',frames:8,loop:true,center:true,hide:['LeftUpLeg','RightUpLeg',...hide]}];
const url=await p.evaluate(j=>window.bake(j),{who,rows,hide,height:1.08});
fs.writeFileSync(outFile,Buffer.from(url.split(',')[1],'base64'));console.log('ok',outFile);await b.close();})();
