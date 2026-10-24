// -- src/core/MidnightSprites.js --
// ATLAS A5.3 · carregado depois da classe Midnight (38-core_CombatScene).
// ---------- Notívago (classe Midnight): estados próprios → animações próprias ----------
if(typeof Midnight!=='undefined'){
  const _pzMidDraw=Midnight.prototype.draw;
  Midnight.prototype.draw=function(ctx){
    const assets=window.__PZ_ASSETS__;const S=pzSpriteSheet(this,assets);if(!S)return _pzMidDraw.call(this,ctx);
    const{spec,img}=S,A=spec.anims,TAU=Math.PI*2,st=this.state;let anim='walk',frame=Math.floor(this.stride/TAU*A.walk.frames)%A.walk.frames;
    const burning=this.exposure>1.25;
    if(burning&&!this.retreating){anim='burn';frame=Math.min(A.burn.frames-1,Math.floor((this.exposure-1.25)/2.75*A.burn.frames));}
    else if(this.retreating||st==='flee'||st==='retreat'){anim='flee';frame=Math.floor(this.stride/TAU*A.flee.frames)%A.flee.frames;}
    else if(st==='windup'){anim='attack';frame=Math.min(3,Math.floor((1-this.stateTime/.55)*4));}
    else if(st==='leap'){anim='attack';frame=4+Math.min(3,Math.floor((1-this.stateTime/.34)*4));}
    else if(st==='claw'){anim='claw';frame=Math.min(A.claw.frames-1,Math.floor((1-this.stateTime/.52)*A.claw.frames));}
    else if(st==='recover'||this.hitStun>0){anim='hit';frame=Math.min(3,Math.floor((this.flinch>0?1-this.flinch/.15:.7)*4));}
    else if(st==='stalk'&&this.animation!=='walk'){anim='idle';frame=Math.floor(this.stride/TAU*A.idle.frames)%A.idle.frames;}
    const dir=pzDir8(this.heading);
    ctx.save();
    pzFlinchGlow(ctx,this.flinch>0?1.7:1,a=>pzBlit(ctx,img,spec,anim,frame,dir,this.x,this.y,a));
    // a lanterna faz a pele rachar em brasa: brilho por cima, proporcional à exposição
    if(this.exposure>.7){ctx.globalCompositeOperation='lighter';const k=Math.min(1,(this.exposure-.7)/2);
      const g=ctx.createRadialGradient(this.x,this.y-18,2,this.x,this.y-18,26);g.addColorStop(0,`rgba(255,120,50,${(.45*k).toFixed(3)})`);g.addColorStop(1,'rgba(255,80,30,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y-18,26,0,TAU);ctx.fill();}
    ctx.restore();
    if(st==='windup'||st==='claw'){ctx.save();ctx.strokeStyle='rgba(255,112,76,.72)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.x,this.y,30,this.heading-.7,this.heading+.7);ctx.stroke();ctx.restore();}
  };
}
