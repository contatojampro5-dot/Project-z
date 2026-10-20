// -- src/rendering/Ambience.js --

class Ambience {
  constructor(assets) {
    this.assets=assets;
    const rand=mulberry32(99812);
    this.specks=Array.from({length:85},()=>({x:rand(),y:rand(),size:1+rand()*2,speed:.006+rand()*.015,phase:rand()*6.28,opacity:.07+rand()*.22}));
    this.time=0;
  }
  update(dt) { this.time+=dt; }
  draw(ctx,viewport,camera,world,mode='menu') {
    const { width:w,height:h }=viewport;
    ctx.save();camera.apply(ctx);
    const pulse=0.5+Math.sin(this.time*2.6)*.5;
    const circle=(x,y,r,color,alpha)=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,color.replace('ALPHA',String(alpha)));
      g.addColorStop(1,color.replace('ALPHA','0'));
      ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    };
    // Luz de apresentação apenas no menu (o combate tem personagem independente).
    if(mode==='menu') circle(592,574,96,'rgba(225,76,84,ALPHA)',.14+pulse*.06);
    const sprite=this.assets.get('survivor');
    if(sprite && mode==='menu') {
      const x=592,y=565+Math.sin(this.time*2.1)*1.2;
      ctx.fillStyle='rgba(8,18,22,.34)';ctx.fillRect(x-19, y+24,38,9);
      ctx.drawImage(sprite,Math.round(x-24),Math.round(y-29),48,56);
    } else if(mode==='menu') {
      ctx.fillStyle='#a6d66e';ctx.fillRect(585,553,14,22);
    }
    // Lanternas brilham em pulsação
    for(const light of [{x:425,y:384},{x:755,y:374},{x:758,y:767}]){
      circle(light.x,light.y,54,'rgba(240,61,72,ALPHA)',.18+pulse*.14);
    }
    ctx.restore();
    // Poeria/partículas em screen space. Não requer simulação de colisão.
    ctx.save();
    ctx.fillStyle='#d6eee0';
    for(const p of this.specks) {
      const px=(p.x*w+Math.sin(this.time*.48+p.phase)*19)%w;
      const py=((p.y+this.time*p.speed)%1)*h;
      ctx.globalAlpha=p.opacity*(mode==='menu'?.85:.45);
      ctx.fillRect(Math.round(px),Math.round(py),p.size,p.size);
    }
    ctx.globalAlpha=1;ctx.restore();
  }
}

