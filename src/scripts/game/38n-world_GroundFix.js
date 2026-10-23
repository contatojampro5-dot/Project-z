// -- src/world/GroundFix.js --
// R36b · Afrodite — limpeza do chão.
// 1) Os "quadrados verdes" no asfalto eram o corpo provisório antigo (retângulos) que o jogo ainda desenhava quando
//    o zumbi morria por carro, explosão ou fogo: o corpo de verdade (sprite da morte, 34b) já aparece, então o
//    provisório não é mais desenhado.
// 2) A bolinha roxa é o cuspe do Cuspidor (ataque de longe). Antes era só um círculo; agora é uma bolha de gosma
//    que treme, com brilho, rastro de gotas e sombra no chão, para dar para ver o que é e desviar.
{const _du=CombatEffects.prototype.drawUnder;
 CombatEffects.prototype.drawUnder=function(ctx){const keep=this.corpses;this.corpses=[];try{return _du.call(this,ctx);}finally{this.corpses=keep;}};}
EnemyAttacks.prototype.draw=function(ctx){
  const t=performance.now()*.001;
  ctx.save();
  for(const p of this.projectiles){
    const a=Math.atan2(p.dy,p.dx),wob=Math.sin(t*22+p.x*.05)*.18;
    // sombra no chão (a bolha voa um pouco acima)
    ctx.globalAlpha=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(p.x,p.y+9,5,2.2,0,0,Math.PI*2);ctx.fill();
    // rastro de gotas
    for(let i=1;i<=4;i++){const d=i*6.5,r=3.4-i*.62;ctx.globalAlpha=.55-i*.11;ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x-p.dx*d+Math.sin(t*15+i)*1.2,p.y-p.dy*d+Math.cos(t*13+i)*1.2,Math.max(.8,r),0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);
    ctx.shadowColor=p.color;ctx.shadowBlur=14;
    // bolha esticada no sentido do voo, tremendo
    const g=ctx.createRadialGradient(-1,-1.5,0,0,0,7);g.addColorStop(0,'#f4e6ff');g.addColorStop(.35,p.color);g.addColorStop(1,'#5b2f86');
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,6.6*(1+wob),4.8*(1-wob),0,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // pingo que escorre atrás e brilho
    ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(-5,-2.4);ctx.quadraticCurveTo(-11,0,-5,2.4);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(1.6,-1.8,1.7,1,-.4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  for(const f of this.flashes){const ratio=f.life/f.full;ctx.globalAlpha=ratio;ctx.strokeStyle=f.color;ctx.lineWidth=3+ratio*4;ctx.beginPath();ctx.arc(f.x,f.y,f.radius*(1-ratio*.3),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
};
