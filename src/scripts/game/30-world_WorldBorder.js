// -- src/world/WorldBorder.js --
// Acabamento visual AO REDOR do mapa jogável (2800x2800). Somente decoração:
// não altera GAME.map, colisões, câmera, spawn nem movimentação.
// Direita = praia com deck; topo = cidade com barricadas; esquerda/baixo = cidade em chamas.
const WB_M=1280;

// CRONOS C2 — ambient-only barricade crowds, no Entity/Enemy objects.
// Reuses the same normal-infected atlas; fixed seeded clusters, virtual anim ticks,
// no physics, no collision, no XP and no impact on pathfinding or combat.
class ExternalBarricadeCrowd {
  constructor(width,height){
    this.width=width;this.height=height;
    this.clusters=[
      {edge:'top',at:569,seed:103},
      {edge:'left',at:578,seed:219},
      {edge:'top',at:1950,seed:337},
      {edge:'bottom',at:581,seed:451},
      {edge:'left',at:1919,seed:569},
    ].map(c=>({...c,members:this.buildMembers(c.seed)}));
  }
  buildMembers(seed){
    const rng=mulberry32(seed),members=[];
    // Localized tight rows; density rises with waves without spreading around the perimeter.
    for(let i=0;i<34;i++){
      const row=Math.floor(i/7),lane=i%7;
      members.push({
        side:(lane-3)*25+(row%2)*11+(rng()-.5)*9,
        away:53+row*23+(rng()-.5)*7,
        phase:rng()*Math.PI*2,
        gait:rng()*Math.PI*2,
        style:rng(),
        row
      });
    }
    return members;
  }
  configuration(wave=1,progress=0){
    const safeWave=Math.max(1,Math.min(60,Math.floor(Number(wave)||1)));
    const fraction=Math.max(0,Math.min(1,Number(progress)||0));
    const total=Math.min(125,12+(safeWave-1)*7+Math.floor(fraction*6));
    const groups=Math.min(this.clusters.length,2+Math.floor((safeWave-1)/3));
    const base=Math.floor(total/groups),extra=total%groups;
    return {wave:safeWave,total,groups,perCluster:this.clusters.map((_,i)=>i<groups?Math.min(34,base+(i<extra?1:0)):0)};
  }
  worldPosition(cluster,z,time){
    // Three simple visual states: front push, back pressure, and a staggered surge.
    const t=time* (z.row===0?2.3:1.25)+z.phase;
    const push=z.row===0?4.2+Math.sin(t)*3.4:Math.max(0,Math.sin(t))*3;
    const surge=z.row>0?Math.max(0,Math.sin(time*.72+z.phase))*8:0;
    // Shared cyclic exchange: rear line takes over pressing while front line falls back.
    const rotation=(1-Math.cos(time*.64+cluster.seed*.01))*.5;
    const exchange=z.row===0?24*rotation:z.row===1?-24*rotation:0;
    const away=z.away+exchange-push-surge;
    const sway=Math.sin(time*(.45+z.style*.32)+z.gait)*(z.row===0?1.5:4.5);
    if(cluster.edge==='top')return {x:cluster.at+z.side+sway,y:-away,heading:Math.PI/2};
    if(cluster.edge==='bottom')return {x:cluster.at+z.side+sway,y:this.height+away,heading:-Math.PI/2};
    return {x:-away,y:cluster.at+z.side+sway,heading:0};
  }
  draw(ctx,assets,bounds,externalState={},still=false){
    const atlas=assets?.get('zombieAtlas');
    const image=assets?.get('zombie');
    if(!atlas&&!image)return;
    const {perCluster}=this.configuration(externalState.wave,externalState.progress);
    const time=still?0:Math.max(0,Number(externalState.elapsed)||0);
    const frame=Math.floor(time*5)%4;
    ctx.save();ctx.imageSmoothingEnabled=false;
    for(let g=0;g<this.clusters.length;g++){
      const cluster=this.clusters[g],count=perCluster[g];
      if(!count)continue;
      // Cluster-level visibility test keeps overhead independent of distant mobs.
      const cx=cluster.edge==='left'?-113:cluster.at;
      const cy=cluster.edge==='top'?-113:cluster.edge==='bottom'?this.height+113:cluster.at;
      if(cx<bounds.x0-180||cx>bounds.x1+180||cy<bounds.y0-180||cy>bounds.y1+180)continue;
      // Back rows are rendered first, as in real crowds pressed against a wall.
      for(let i=count-1;i>=0;i--){
        const z=cluster.members[i],p=this.worldPosition(cluster,z,time);
        if(p.x<bounds.x0-35||p.x>bounds.x1+35||p.y<bounds.y0-35||p.y>bounds.y1+35)continue;
        ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
        ctx.fillStyle='rgba(4,7,8,.38)';ctx.beginPath();ctx.ellipse(0,13,13,5,0,0,Math.PI*2);ctx.fill();
        // Same 8-direction/4-frame atlas as enemies inside the city.
        const direction=((Math.round(p.heading/(Math.PI/4))%8)+8)%8;
        const pose=(frame+Math.floor(z.gait))%4;
        const bob=still?0:Math.sin(time*6+z.gait)*.9;
        if(atlas)ctx.drawImage(atlas,direction*48,pose*56,48,56,-21,-27+bob,42,49);
        else ctx.drawImage(image,-17,-22+bob,34,39);
        // Arms/hands extended toward the barricades (drawn over the genuine atlas).
        // Directional transform ensures both arms point at the actual city boundary.
        ctx.rotate(p.heading);
        const beat=still?0:Math.sin(time*2.8+z.phase);
        const reach=11+(z.row===0?4:2)+beat*2;
        ctx.fillStyle='#425b50';
        ctx.fillRect(4,-12,reach,5);ctx.fillRect(4,7,reach,5);
        ctx.fillStyle='#9e9b7d';
        ctx.fillRect(4+reach,-12,5,5);ctx.fillRect(4+reach,7,5,5);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

class WorldBorder{
  constructor(){
    const W=GAME.map.width,H=GAME.map.height,M=WB_M;
    this.W=W;this.H=H;this.M=M;
    this.fires=[];
    this.lamps=[];this.floods=[]; // ATLAS A9: luzes reais das bordas (postes e refletores)
    this.buildingRects=[]; // CRONOS C4: only visual geometry for sun-facing edge + ground shadows.
    this.crowd=new ExternalBarricadeCrowd(W,H);
    this.roads=this.planRoads();
    this.strips=[
      this.strip(-M,-M,W+M,M,c=>this.paintCity(c,'top')),
      this.strip(-M,H,W+M,M,c=>this.paintCity(c,'bottom')),
      this.strip(-M,0,M,H,c=>this.paintCity(c,'left')),
      this.strip(W,-M,M,H+2*M,c=>this.paintBeach(c)),
    ];
    this.seedPerimeterInferno();
    this.fires.sort((a,b)=>a.y-b.y);
  }
  seedPerimeterInferno(){
    // CRONOS C2B: incêndios externos mais controlados.
    // Objetivos: não sobrepor os zumbis nas barricadas, remover o fogo da praia,
    // reduzir a quantidade total e variar entre focos menores e maiores.
    const W=this.W,H=this.H;
    const rand=mulberry32(94222);
    const addCluster=(cx,cy,count,sx,sy,base=.92,bigChance=.18)=>{
      for(let i=0;i<count;i++){
        const sizeBias=i===0&&rand()<bigChance?1.28:1;
        this.fires.push({
          x:cx+(rand()-.5)*sx,
          y:cy+(rand()-.5)*sy,
          s:(base+(rand()-.5)*.28+rand()*.34)*sizeBias,
          p:rand()*9,
          big:(sizeBias>1.1||rand()<bigChance*.45)?1:0
        });
      }
    };
    const lineAnchors=(from,to,step,jitter=18)=>{
      const arr=[];
      for(let v=from;v<=to;v+=step)arr.push(v+(rand()-.5)*jitter);
      return arr;
    };
    // TOPO: focos mais recuados, atrás da multidão externa.
    for(const x of lineAnchors(180,W-180,330,20)){
      addCluster(x,-235,2+Math.floor(rand()*2),84,64,.82,.08);
      if(rand()<.7)addCluster(x+(rand()-.5)*55,-285,1+Math.floor(rand()*2),78,54,1.06,.32);
    }
    // BASE: também recuado e menos denso.
    for(const x of lineAnchors(180,W-180,320,18)){
      addCluster(x,H+225,2+Math.floor(rand()*2),88,66,.84,.1);
      if(rand()<.75)addCluster(x+(rand()-.5)*60,H+282,1+Math.floor(rand()*2),82,58,1.12,.34);
    }
    // ESQUERDA: corredor urbano em chamas, mas sem encostar na linha da barricada.
    for(const y of lineAnchors(180,H-180,310,20)){
      addCluster(-225,y,2+Math.floor(rand()*2),66,88,.84,.1);
      if(rand()<.78)addCluster(-285,y+(rand()-.5)*60,1+Math.floor(rand()*2),60,82,1.12,.36);
    }
    // Sem fogo na direita/praia.
    // Sem focos extras nos acessos para não cobrir os zumbis externos.
  }

  strip(x,y,w,h,painter){
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(w/2);canvas.height=Math.ceil(h/2);
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
    ctx.scale(.5,.5);ctx.translate(-x,-y);
    painter(ctx);
    return {x,y,w,h,canvas};
  }
  // ---------- planejamento ----------
  planRoads(){
    const W=this.W,H=this.H,M=this.M;
    // Continuação VISUAL das ruas reais que já chegam nas bordas do mapa jogável.
    // Não inventamos novas saídas jogáveis: apenas estendemos o desenho existente.
    // v: [x0,x1,y0,y1]  /  h: [y0,y1,x0,x1]
    return {
      // Aberturas no mapa: mesmas coordenadas externas das vias originais.
      // Duas avenidas verticais no topo e na base, duas ruas na esquerda.
      // Ruas secundárias só aparecem FORA dos limites e cruzam a malha exterior.
      v:[
        [398,748,-M,0], [1847,2055,-M,0],
        [401,745,H,H+M], [1847,2055,H,H+M],
        [-880,-610,-M,H+M],
      ],
      h:[
        [401,754,-M,0], [1777,2053,-M,0],
        [-810,-555,-M,W], [H+545,H+800,-M,W],
      ],
    };
  }
  onRoad(x,y,w,h,pad){
    for(const [a,b,c,d] of this.roads.v)if(x<b+pad&&x+w>a-pad&&y<d&&y+h>c)return true;
    for(const [a,b,c,d] of this.roads.h)if(y<b+pad&&y+h>a-pad&&x<d&&x+w>c)return true;
    return false;
  }
  // ---------- cidade (topo / esquerda / baixo) ----------
  paintCity(ctx,side){
    const W=this.W,H=this.H,M=this.M;
    const rect=side==='top'?[-M,-M,W+M,M]:side==='bottom'?[-M,H,W+M,M]:[-M,0,M,H];
    const [X,Y,Sw,Sh]=rect;
    const burn=side==='top'?.35:1;
    const rand=mulberry32(side==='top'?9101:side==='bottom'?9202:9303);
    // chão
    r(ctx,X,Y,Sw,Sh,'#27282b');
    for(let y=Y;y<Y+Sh;y+=16)for(let x=X;x<X+Sw;x+=16){
      const v=rand();
      if(v<.28)r(ctx,x,y,16,16,'#26292b');else if(v<.48)r(ctx,x,y,16,16,'#303034');
      if(rand()<.2)r(ctx,x+Math.floor(rand()*14),y+Math.floor(rand()*14),2,2,'#575559');
      if(rand()<.04)r(ctx,x+3,y+8,8,3,'#403539');
    }
    // vias
    const inStrip=(x0,y0,x1,y1)=>x1>X&&x0<X+Sw&&y1>Y&&y0<Y+Sh;
    const V=this.roads.v.filter(a=>inStrip(a[0],a[2],a[1],a[3])),Hh=this.roads.h.filter(a=>inStrip(a[2],a[0],a[3],a[1]));
    // Mesma espessura de borda e asfalto que as avenidas internas, sem diagonais.
    for(const [a,b,c,d] of V){
      const y0=Math.max(c,Y),y1=Math.min(d,Y+Sh);if(y1<=y0)continue;
      const edge= b-a>=310?16:13;
      r(ctx,a,y0,b-a,y1-y0,C.dark);
      const asphalt=a===398?C.road:(a===1847&&c<0?'#1b1d22':a===1847?'#222126':a===401?'#1b1d22':C.road);
      r(ctx,a+edge,y0,b-a-edge*2,y1-y0,asphalt);asphaltVariation(ctx,a+edge,y0,b-a-edge*2,y1-y0,a*31+y0*7+11);
      for(const x of [a+4,b-14]){r(ctx,x,y0,10,y1-y0,'#4a4749');r(ctx,x+2,y0,2,y1-y0,'#797276');}
    }
    for(const [a,b,c,d] of Hh){
      const x0=Math.max(c,X),x1=Math.min(d,X+Sw);if(x1<=x0)continue;
      const edge=b-a>=310?16:13;
      r(ctx,x0,a,x1-x0,b-a,C.dark);
      const asphalt=a===401?C.road:a===1777?'#1b1d22':C.road;
      r(ctx,x0,a+edge,x1-x0,b-a-edge*2,asphalt);asphaltVariation(ctx,x0,a+edge,x1-x0,b-a-edge*2,a*17+x0*5+23);
      for(const y of [a+4,b-14]){r(ctx,x0,y,x1-x0,10,'#4a4749');r(ctx,x0,y+2,x1-x0,2,'#797276');}
    }
    // Cruzamentos são um único pavimento contínuo, incluindo seus cantos.
    for(const [va,vb,vc,vd] of V)for(const [ha,hb,hc,hd] of Hh){
      const ix=Math.max(va,hc,X),ex=Math.min(vb,hd,X+Sw);
      const iy=Math.max(vc,ha,Y),ey=Math.min(vd,hb,Y+Sh);
      if(ex>ix&&ey>iy)r(ctx,ix,iy,ex-ix,ey-iy,(va===1847&&vc>=H)?'#222126':C.road);
    }
    // Marcas acompanham precisamente o eixo E o padrão das ruas originais.
    const phased=(start,step,anchor)=>start+((anchor-start)%step+step)%step;
    for(const [a,b,c,d] of V){
      const cy0=Math.max(c,Y),cy1=Math.min(d,Y+Sh),cx=(a+b)/2;
      const main=a===398||a===401,suburb=a===1847;
      const step=main?(c<0?58:72):(suburb?(c<0?68:74):68);
      const anchor=main?(c<0?16:1160):(suburb?(c<0?0:1152):0);
      const markH=main?(c<0?31:38):(c<0?35:40);
      const size=main?4:4;
      const laneXs=a===398?[568,578]:a===401?[575]:a===1847?[1950]:[cx];
      for(let y=phased(cy0,step,anchor);y<cy1;y+=step){
        if(Hh.some(([ha,hb,hc,hd])=>cx>hc&&cx<hd&&y+markH>ha-8&&y<hb+8))continue;
        for(const mx of laneXs)r(ctx,mx,y,size,markH,'#9f9584');
      }
    }
    for(const [a,b,c,d] of Hh){
      const xx0=Math.max(c,X),xx1=Math.min(d,X+Sw),cy=(a+b)/2;
      const center=a===401,industry=a===1777;
      const step=center?60:industry?75:70;
      const anchor=center?8:industry?0:0,markW=center?31:industry?38:32;
      const laneYs=center?[564,575]:industry?[1914]:[cy];
      for(let x=phased(xx0,step,anchor);x<xx1;x+=step){
        if(V.some(([va,vb,vc,vd])=>cy>vc&&cy<vd&&x+markW>va-8&&x<vb+8))continue;
        for(const my of laneYs)r(ctx,x,my,markW,center?4:5,'#9f9584');
      }
    }
    // prédios
    const placed=[];
    const attempts=side==='top'?520:620;
    const edge=130;
    const roofs=['#323337','#383438','#33363b','#3a3639','#527669','#6a6760','#586771','#756354','#486a66','#536d68'];
    const variants=['block','tower','round','mall','industrial','compound'];
    for(let i=0;i<attempts;i++){
      const w=130+Math.floor(rand()*210),h=110+Math.floor(rand()*150);
      const x=X+30+Math.floor(rand()*(Sw-w-90)),y=Y+30+Math.floor(rand()*(Sh-h-90));
      if(side==='top'&&(y+h>-edge||x+w>W-edge+40&&x<W+10))continue;
      if(side==='bottom'&&y<H+edge)continue;
      if(side==='left'&&x+w>-edge)continue;
      if(side==='top'&&x+w+30>W)continue;
      if(side==='bottom'&&x+w+30>W)continue;
      if(this.onRoad(x-24,y-24,w+66,h+60,22))continue;
      if(placed.some(p=>x<p.x+p.w+46&&x+w+46>p.x&&y<p.y+p.h+46&&y+h+46>p.y))continue;
      placed.push({x,y,w,h});
      this.buildingRects.push({x,y,w,h}); // Same geometry used by exterior facade rendering.
      const roof=roofs[Math.floor(rand()*roofs.length)];
      ctx.save();
      building(ctx,x,y,w,h,{roof:rand()<burn*.5?'#222326':roof,edge:'#666368',glow:'#e34b52',variant:variants[Math.floor(rand()*variants.length)],trim:'#7d7577'});
      ctx.restore();
      if(rand()<burn*.85)this.ruin(ctx,x,y,w,h,rand,burn);
    }
    // escombros, carros, árvores mortas, manchas
    const roadsList=[...V.map(a=>({vert:1,a:a[0],b:a[1],c:a[2],d:a[3]})),...Hh.map(a=>({vert:0,a:a[0],b:a[1],c:a[2],d:a[3]}))];
    const cars=['sedan','hatch','pickup','van'],paints=['slate','gray','bronze','olive','teal','burgundy','rust','navy','white','yellow'];
    const nCars=side==='top'?26:44;
    for(let i=0;i<nCars;i++){
      const rd=roadsList[Math.floor(rand()*roadsList.length)];
      let x,y,ang;
      if(rd.vert){x=rd.a+34+rand()*(rd.b-rd.a-68);y=Math.max(rd.c,Y)+rand()*(Math.min(rd.d,Y+Sh)-Math.max(rd.c,Y));ang=(rand()<.5?0:Math.PI)+(rand()-.5)*1.1;}
      else{y=rd.a+34+rand()*(rd.b-rd.a-68);x=Math.max(rd.c,X)+rand()*(Math.min(rd.d,X+Sw)-Math.max(rd.c,X));ang=(rand()<.5?Math.PI/2:-Math.PI/2)+(rand()-.5)*1.1;}
      if(x<X+60||x>X+Sw-60||y<Y+60||y>Y+Sh-60)continue;
      if(side==='top'&&y>-150)continue;if(side==='bottom'&&y<H+150)continue;if(side==='left'&&x>-150)continue;
      civilianCar(ctx,x,y,{kind:cars[i%4],angle:ang,paint:paints[Math.floor(rand()*paints.length)]});
      if(rand()<burn*.7){r(ctx,x-22,y-30,44,60,'rgba(8,8,10,.55)');if(rand()<.55)this.fires.push({x:x+(rand()-.5)*12,y:y+(rand()-.5)*20,s:.8+rand()*.5,p:rand()*9});}
    }
    for(let i=0;i<Math.floor(Sw*Sh/52000);i++){
      const x=X+rand()*Sw,y=Y+rand()*Sh;if(this.onRoad(x-20,y-20,40,40,4))continue;
      if(placed.some(p=>x>p.x-30&&x<p.x+p.w+60&&y>p.y-30&&y<p.y+p.h+60))continue;
      const t=rand();
      if(t<.3)crack(ctx,x,y,14+rand()*30,'#101418');
      else if(t<.55){tree(ctx,x,y,.8+rand()*.5,false);}
      else this.rubble(ctx,x,y,12+rand()*26,rand);
    }
    // fumaça no chão + manchas de queimado nas vias
    for(let i=0;i<Math.floor(Sw*Sh/90000*burn);i++){
      const x=X+rand()*Sw,y=Y+rand()*Sh;ctx.fillStyle='rgba(6,6,8,.22)';ctx.beginPath();ctx.ellipse(x,y,30+rand()*60,18+rand()*40,rand()*3,0,6.3);ctx.fill();
    }
    // postes
    for(const [a,b,c,d] of V){for(let y=Math.max(c,Y)+90;y<Math.min(d,Y+Sh)-40;y+=300){if(rand()<.7){streetlightPole(ctx,a+9,y);this.lamps.push({x:a+9,y,flicker:rand()<.25?5+rand()*3:0,phase:rand()*6});}}}
    this.paintBarricades(ctx,side,rand);
  }
  ruin(ctx,x,y,w,h,rand,burn){
    ctx.save();
    for(let i=0;i<8;i++){ctx.fillStyle=`rgba(4,4,5,${(.18+rand()*.3).toFixed(2)})`;ctx.beginPath();ctx.ellipse(x+rand()*w,y+rand()*h,18+rand()*40,12+rand()*28,rand()*3,0,6.3);ctx.fill();}
    // canto desabado
    const cw=w*(.25+rand()*.2),ch=h*(.25+rand()*.25),cx=rand()<.5?x:x+w-cw,cy=rand()<.5?y:y+h-ch;
    r(ctx,cx,cy,cw,ch,'#0d0e10');
    for(let i=0;i<10;i++)r(ctx,cx+rand()*cw,cy+rand()*ch,6+rand()*14,3+rand()*8,['#5c5650','#44403c','#6b5a4a','#2a2a2d'][Math.floor(rand()*4)]);
    for(let i=0;i<5;i++)line(ctx,[[cx+rand()*cw,cy+rand()*ch],[cx+rand()*cw,cy+rand()*ch]],'#7a4a38',2);
    // fogo no telhado
    const n=1+Math.floor(rand()*2.2*burn);
    for(let i=0;i<n;i++)if(rand()<.8)this.fires.push({x:x+w*.2+rand()*w*.6,y:y+h*.2+rand()*h*.6,s:1.1+rand()*.9,p:rand()*9,big:1});
    ctx.restore();
  }
  rubble(ctx,x,y,s,rand){
    r(ctx,x+4,y+5,s,s*.5,'rgba(0,0,0,.35)');
    for(let i=0;i<7;i++)r(ctx,x+(rand()-.5)*s*1.4,y+(rand()-.5)*s,4+rand()*s*.5,3+rand()*s*.3,['#5c5650','#44403c','#6b5a4a','#2a2a2d','#7a7068'][Math.floor(rand()*5)]);
  }
  // ---------- barricadas ----------
  paintBarricades(ctx,side,rand){
    const W=this.W,H=this.H;
    const mouths=side==='left'?[[401,754],[1777,2053]]:side==='top'?[[398,748],[1847,2055]]:[[401,745],[1847,2055]];
    const lo=side==='left'?0:-90,hi=side==='left'?H:W;
    const draw=(fn,a,b)=>{ctx.save();
      if(side==='left'){ctx.translate(-64,a);ctx.transform(0,1,1,0,0,0);}
      else ctx.translate(a,side==='top'?-62:H+8);
      fn(ctx,Math.max(0,b-a));ctx.restore();};
    const fillGap=(a,b)=>{ if(b-a<=0) return; draw((c,l)=>this.sealGap(c,l,rand),a,b); };
    // Base sólida ininterrupta ANTES dos módulos decorativos: sem brechas ópticas.
    // Não invade área jogável (topo y<0, esquerda x<0, base y>=H).
    if(side==='left'){
      r(ctx,-38,0,35,H,'#484543');
      r(ctx,-38,0,5,H,'#817e79');
      for(let y=4;y<H;y+=44){r(ctx,-35,y,29,3,'#252528');r(ctx,-22,y+15,10,5,'#af735c');}
    }else{
      const by=side==='top'?-38:H;
      r(ctx,lo,by,hi-lo,35,'#484543');
      r(ctx,lo,by,hi-lo,5,'#817e79');
      for(let x=lo+4;x<hi;x+=44){r(ctx,x,by+7,3,25,'#252528');r(ctx,x+15,by+18,10,5,'#af735c');}
    }
    // calçada / contenção junto à borda
    if(side==='left'){
      r(ctx,-100,0,100,H,'#2c2b2e');
      r(ctx,-18,0,18,H,'#1c1d20');
      for(let y=0;y<H;y+=32)r(ctx,-18,y,18,3,'rgba(255,255,255,.06)');
    }else{
      r(ctx,lo,side==='top'?-100:H,hi-lo,100,'#2c2b2e');
      r(ctx,lo,side==='top'?-18:H,hi-lo,18,'#1c1d20');
      for(let x=lo;x<hi;x+=32)r(ctx,x,side==='top'?-18:H,3,18,'rgba(255,255,255,.06)');
    }
    let cursor=lo;
    const types=['jersey','jersey','sand','container','hedgehog','jersey','crates'];
    while(cursor<hi){
      const mouth=mouths.find(([a,b])=>cursor<a?false:cursor<b);
      if(mouth){
        const [a,b]=mouth;
        fillGap(cursor,a);
        draw((c,len)=>this.heavyBlock(c,len,rand),a,b);
        cursor=b;
        continue;
      }
      const nextMouth=mouths.find(([a])=>a>cursor);
      const segmentEnd=nextMouth?nextMouth[0]:hi;
      while(cursor<segmentEnd){
        const remaining=segmentEnd-cursor;
        if(remaining<=20){ fillGap(cursor,segmentEnd); cursor=segmentEnd; break; }
        let len=Math.min(remaining,70+Math.floor(rand()*115));
        if(remaining-len>0 && remaining-len<26) len=remaining;
        if(len<34){ fillGap(cursor,segmentEnd); cursor=segmentEnd; break; }
        const t=types[Math.floor(rand()*types.length)];
        draw((c,l)=>this.module(c,t,l,rand),cursor,cursor+len);
        cursor+=len;
        const seam=Math.min(segmentEnd-cursor, rand()<.55?0:(6+Math.floor(rand()*10)));
        if(seam>0){ fillGap(cursor,cursor+seam); cursor+=seam; }
      }
    }
  }
  sealGap(c,len,rand){
    const w=Math.max(12,len);
    const sh=(x,y,ww,hh)=>{c.fillStyle='rgba(0,0,0,.38)';c.fillRect(x+6,y+8,ww,hh);};
    // base contínua para não sugerir passagem livre quando a colisão já bloqueia.
    r(c,0,16,w,30,'#42352b');
    r(c,0,16,w,4,'#74553c');
    for(let x=0;x<w;x+=18){
      const bw=Math.min(16,w-x);
      sh(x,20,bw,24);
      r(c,x,20,bw,24,rand()<.5?'#7a5c3a':'#6d6963');
      r(c,x,20,bw,3,rand()<.5?'#9a7a52':'#a8a299');
      if(bw>10)r(c,x+Math.max(1,Math.floor((bw-3)/2)),20,3,24,'#4d3a26');
    }
    for(let x=8;x<w-8;x+=26){
      r(c,x,6,10,10,'#7a7068');
      r(c,x+1,4,8,4,'#c93a3a');
    }
    c.strokeStyle='rgba(185,190,195,.9)';
    c.lineWidth=2;
    c.beginPath();
    c.moveTo(0,14);
    for(let x=0;x<w;x+=8)c.lineTo(x,14+((x/8)%2?-7:7));
    c.stroke();
  }
  // desenha no espaço local: eixo x = ao longo da borda; y = para fora (0..60)
  module(c,t,len,rand){
    const sh=(x,y,w,h)=>{c.fillStyle='rgba(0,0,0,.42)';c.fillRect(x+7,y+9,w,h);};
    if(t==='jersey'){
      for(let x=0;x<len-4;x+=40){const w=Math.min(38,len-x);sh(x,18,w,26);r(c,x,18,w,26,'#6d6963');r(c,x,18,w,6,'#a8a299');r(c,x,40,w,4,'#4b4743');r(c,x+w/2-6,28,12,4,'#d44');}
    }else if(t==='sand'){
      for(let row=0;row<2;row++)for(let x=row*10;x<len-10;x+=22){sh(x,16+row*14,22,16);r(c,x,16+row*14,20,15,row?'#7a6c48':'#8e7d52');r(c,x+2,18+row*14,14,3,'#ad9b6c');}
    }else if(t==='container'){
      const w=Math.min(len,92),col=['#8a3b32','#35566f','#46634a','#7b6a35'][Math.floor(rand()*4)];
      sh(0,6,w,40);r(c,0,6,w,40,col);for(let x=6;x<w-4;x+=8)r(c,x,8,2,36,'rgba(0,0,0,.28)');r(c,0,6,w,4,'rgba(255,255,255,.18)');r(c,0,42,w,4,'rgba(0,0,0,.35)');
    }else if(t==='hedgehog'){
      for(let x=18;x<len-10;x+=44){c.strokeStyle='#17191b';c.lineWidth=7;c.beginPath();c.moveTo(x-16,12);c.lineTo(x+16,48);c.moveTo(x+16,12);c.lineTo(x-16,48);c.moveTo(x-18,30);c.lineTo(x+18,30);c.stroke();c.strokeStyle='#7d8286';c.lineWidth=3;c.beginPath();c.moveTo(x-16,12);c.lineTo(x+16,48);c.moveTo(x+16,12);c.lineTo(x-16,48);c.stroke();}
    }else{ // crates + pallets
      for(let x=0;x<len-12;x+=34){const h=22+Math.floor(rand()*14);sh(x,14,30,h);r(c,x,14,30,h,'#7a5c3a');r(c,x,14,30,3,'#9a7a52');r(c,x+14,14,3,h,'#4d3a26');r(c,x,14+h-3,30,3,'#4d3a26');}
    }
    // arame farpado por cima
    c.strokeStyle='rgba(185,190,195,.85)';c.lineWidth=2;c.beginPath();c.moveTo(0,14);for(let x=0;x<len;x+=8)c.lineTo(x,14+((x/8)%2?-7:7));c.stroke();
  }
  heavyBlock(c,len,rand){
    // bloqueio total da via: caminhões/ônibus atravessados, barreiras e placas
    const sh=(x,y,w,h)=>{c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x+8,y+10,w,h);};
    // camada externa: ônibus queimado + caminhão
    const bw=Math.min(len*.55,190);
    sh(6,-70,bw,52);r(c,6,-70,bw,52,'#3b3a2c');r(c,6,-70,bw,5,'#5a573f');
    for(let x=14;x<bw-8;x+=26)r(c,x,-60,18,20,'#14181b');
    r(c,6,-70,bw,52,'rgba(0,0,0,.28)');
    const tx=bw+22,tw=Math.min(len-tx-6,150);
    if(tw>40){sh(tx,-62,tw,44);r(c,tx,-62,tw,44,'#46534f');r(c,tx,-62,tw*.28,44,'#2b3532');r(c,tx+tw*.3,-62,tw*.7,5,'#6a7873');}
    // carros batidos
    r(c,len-52,-96,40,70,'#4d2a2c');r(c,len-48,-92,32,24,'#161a1d');
    // linha de barreiras
    for(let x=0;x<len-6;x+=44){const w=Math.min(42,len-x);sh(x,18,w,26);r(c,x,18,w,26,'#6d6963');r(c,x,18,w,6,'#a8a299');r(c,x+w/2-7,28,14,5,'#d44');r(c,x+w/2-7,28,7,5,'#eee');}
    // placas "pare" + fitas
    for(const x of [4,len/2,len-14]){r(c,x,-2,4,22,'#2a2c30');c.fillStyle='#c93a3a';c.beginPath();c.arc(x+2,-6,10,0,6.3);c.fill();r(c,x-5,-8,14,4,'#f1eee6');}
    c.strokeStyle='rgba(185,190,195,.9)';c.lineWidth=2;c.beginPath();c.moveTo(0,10);for(let x=0;x<len;x+=8)c.lineTo(x,10+((x/8)%2?-8:8));c.stroke();
    c.fillStyle='#e9c545';for(let x=0;x<len;x+=26){c.fillRect(x,46,13,5);}
    this.fires.push({x:null,lx:len*.3,ly:-45,s:.7,p:rand()*9,heavy:true});
  }
  // ---------- praia (direita) ----------
  shore(y){return 2800+420+70*Math.sin(y/260)+38*Math.sin(y/97+1.3)+22*Math.sin(y/41+.4);}
  paintBeach(ctx){
    const W=this.W,H=this.H,M=this.M,Y0=-M,Y1=H+M;
    const rand=mulberry32(7777);
    const X=W;
    // água profunda
    r(ctx,X,Y0,M,Y1-Y0,'#143a52');
    // areia + água linha a linha
    for(let y=Y0;y<Y1;y+=2){
      const s=this.shore(y);
      // areia seca -> úmida
      const dry=s-110;
      r(ctx,X,y,dry-X,2,'#c2a878');
      r(ctx,dry,y,60,2,'#b49a6c');
      r(ctx,dry+60,y,s-dry-60,2,'#8f7c5c');
      // água rasa -> funda
      const seg=[[0,34,'#6fc3b8'],[34,80,'#4fb0ae'],[80,150,'#3a97a0'],[150,260,'#2a7b92'],[260,420,'#1f5f7c']];
      for(const [a,b,c] of seg)r(ctx,s+a,y,b-a,2,c);
    }
    // granulação
    for(let i=0;i<9000;i++){
      const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=X+110+rand()*(s-X-110);
      r(ctx,x,y,2+rand()*4,2,rand()<.5?'#d3bd8f':'#a98f62');
    }
    for(let i=0;i<5000;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=s+10+rand()*700;r(ctx,x,y,6+rand()*22,2,rand()<.5?'rgba(255,255,255,.10)':'rgba(5,30,48,.22)');}
    // pegadas e conchas
    for(let i=0;i<260;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=X+160+rand()*(s-X-200);r(ctx,x,y,4,4,rand()<.5?'#e6d9bd':'#b88f7a');}
    // deck de madeira junto à borda (promenade)
    for(let y=Y0;y<Y1;y+=2){
      r(ctx,X,y,112,2,((y/2)%11===0)?'#3b2616':'#8a5f3b');
    }
    for(let y=Y0;y<Y1;y+=22)for(let x=0;x<3;x++){const w=36;r(ctx,X+x*36+((y/22)%2?10:0),y,w-2,2,'#a47547');}
    for(let y=Y0;y<Y1;y+=88){r(ctx,X,y,112,4,'#4b3220');}
    r(ctx,X+110,Y0,6,Y1-Y0,'#3a2616');r(ctx,X+116,Y0,3,Y1-Y0,'#1b130c');
    for(let y=Y0;y<Y1;y+=4)if(rand()<.2)r(ctx,X+rand()*100,y,10+rand()*40,2,'#6f4a2e');
    // escadas do deck para a areia
    for(const sy of [180,820,1500,2200,2560]){for(let i=0;i<4;i++){r(ctx,X+112+i*8,sy,8,56,['#7a5233','#6a452b','#5b3a24','#4b301d'][i]);}}
    // píeres
    for(const py of [980,2250,-420,3250])this.pier(ctx,X,py,rand);
    // grades/guarda-corpo ao longo da borda do mapa (somente y dentro do mapa)
    this.railing(ctx,X,0,H,rand);
    // postes/bancos/lixeiras no deck
    for(let y=60;y<H;y+=280){this.lamp(ctx,X+96,y);}
    for(let y=-M+100;y<0;y+=280)this.lamp(ctx,X+96,y);
    for(let y=H+100;y<H+M;y+=280)this.lamp(ctx,X+96,y);
    for(let y=150;y<H;y+=520){r(ctx,X+60,y+8,14,64,'rgba(0,0,0,.35)');r(ctx,X+56,y,14,64,'#4a3626');r(ctx,X+56,y,14,6,'#6b503a');}
    // vegetação de duna
    for(let i=0;i<150;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=X+120+rand()*90;this.grass(ctx,x,y,rand);}
    // palmeiras
    for(let y=-M+80;y<Y1-80;y+=190+rand()*140){const s=this.shore(y);this.palm(ctx,X+170+rand()*90,y,rand);}
    // guarda-sóis, espreguiçadeiras, barco, torre
    const cols=['#d9483b','#e8c24a','#3a8fd0','#e8e2d4'];
    for(let i=0;i<22;i++){const y=-M+160+i*215+rand()*60,s=this.shore(y);if(y>-60&&y<H+60&&rand()<.25)continue;const x=X+230+rand()*Math.max(40,s-X-360);this.umbrella(ctx,x,y,cols[i%4],rand);}
    for(let i=0;i<10;i++){const y=-M+300+i*500+rand()*100,s=this.shore(y);this.boat(ctx,s-30-rand()*20,y,rand);}
    this.tower(ctx,X+260,1380);this.tower(ctx,X+240,2600);
    // pedras rasas e algas
    for(let i=0;i<70;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=s+30+rand()*260;r(ctx,x,y,10+rand()*20,8+rand()*10,'rgba(20,60,50,.45)');r(ctx,x+2,y,8,4,'rgba(255,255,255,.12)');}
    for(let i=0;i<40;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y);const x=s-20-rand()*60;r(ctx,x+6,y+6,34,24,'rgba(0,0,0,.28)');r(ctx,x,y,32,22,'#5b5d60');r(ctx,x+2,y,26,6,'#7c7e82');}
  }
  railing(ctx,X,y0,y1,rand){
    r(ctx,X,y0,14,y1-y0,'#1c1d20');
    for(let y=y0;y<y1;y+=40){r(ctx,X-2,y,10,10,'#3a3c40');r(ctx,X+2,y,4,10,'#8a8d91');}
    for(let y=y0;y<y1-22;y+=84){const hz=Math.floor(y/84)%2===0;r(ctx,X+14,y,18,hz?22:22,'rgba(0,0,0,.4)');r(ctx,X+4,y+4,22,18,hz?'#c93a3a':'#e9e5d8');r(ctx,X+4,y+4,22,4,'#f6f2e8');}
    // fita zebrada e cavaletes
    for(let y=y0+10;y<y1;y+=160){for(let i=0;i<5;i++)r(ctx,X+16,y+i*6,12,6,i%2?'#e9c545':'#1a1a1a');}
  }
  lamp(ctx,x,y){r(ctx,x+3,y+4,6,22,'rgba(0,0,0,.3)');r(ctx,x-2,y-11,5,27,'#26272b');r(ctx,x-7,y-15,15,7,'#171c21');r(ctx,x-5,y-11,11,2,'#e8d9b0');}
  grass(ctx,x,y,rand){for(let i=0;i<6;i++)r(ctx,x+(rand()-.5)*22,y+(rand()-.5)*14,2,6+rand()*8,['#5d7a40','#7a9a52','#486532'][Math.floor(rand()*3)]);}
  palm(ctx,x,y,rand){
    ctx.save();ctx.translate(x,y);
    r(ctx,-30,-14,92,52,'rgba(0,0,0,.2)');
    ctx.fillStyle='#6b4a2f';ctx.fillRect(-4,-4,8,8);
    for(let i=0;i<9;i++){const a=i/9*6.283+rand()*.2,l=44+rand()*14;
      ctx.strokeStyle='#2f6a3a';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*l,Math.sin(a)*l);ctx.stroke();
      ctx.strokeStyle='#4a9a4c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*l*.92,Math.sin(a)*l*.92);ctx.stroke();}
    ctx.fillStyle='#8a6a3a';ctx.beginPath();ctx.arc(4,4,5,0,6.3);ctx.fill();
    ctx.restore();
  }
  umbrella(ctx,x,y,col,rand){
    ctx.save();ctx.translate(x,y);r(ctx,-20,-16,60,50,'rgba(0,0,0,.25)');
    for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#f0ece0':col;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,32,i/8*6.283,(i+1)/8*6.283);ctx.closePath();ctx.fill();}
    r(ctx,-3,-3,6,6,'#2a2a2a');
    // espreguiçadeiras
    r(ctx,-48,40,22,46,'#e8e2d4');r(ctx,-48,40,22,10,col);r(ctx,34,40,22,46,'#e8e2d4');r(ctx,34,40,22,10,col);
    ctx.restore();
  }
  boat(ctx,x,y,rand){
    ctx.save();ctx.translate(x,y);ctx.rotate(rand()*.6-.3);
    r(ctx,-34+8,-14+8,92,32,'rgba(0,0,0,.28)');r(ctx,-34,-14,92,30,'#e8e2d4');r(ctx,-30,-10,84,22,'#8a5a38');r(ctx,-34,-14,92,4,'#d9483b');
    ctx.restore();
  }
  tower(ctx,x,y){r(ctx,x+8,y+10,60,58,'rgba(0,0,0,.3)');r(ctx,x,y,60,56,'#a47547');r(ctx,x,y,60,8,'#d9483b');r(ctx,x+6,y+14,48,30,'#7a5233');r(ctx,x+24,y+20,12,18,'#e8e2d4');r(ctx,x+28,y+22,4,14,'#d9483b');r(ctx,x+22,y+27,16,4,'#d9483b');}
  pier(ctx,X,y,rand){
    const len=640,w=60;
    r(ctx,X+112+8,y+10,len,w,'rgba(0,0,0,.3)');
    r(ctx,X+112,y,len,w,'#7a5233');
    for(let x=0;x<len;x+=12)r(ctx,X+112+x,y,2,w,'#3b2616');
    for(let x=0;x<len;x+=48){r(ctx,X+112+x,y-6,10,10,'#2a1b10');r(ctx,X+112+x,y+w-4,10,10,'#2a1b10');}
    r(ctx,X+112,y-2,len,3,'#a47547');r(ctx,X+112,y+w-2,len,3,'#a47547');
    r(ctx,X+112+len,y-4,10,w+8,'#3b2616');
    // barco atracado
    r(ctx,X+112+len-190+8,y+w+4+8,150,38,'rgba(0,0,0,.25)');r(ctx,X+112+len-190,y+w+4,150,36,'#e8e2d4');r(ctx,X+112+len-186,y+w+10,140,24,'#35566f');r(ctx,X+112+len-190,y+w+4,150,4,'#d9483b');
  }
  // ---------- animação ----------
  draw(ctx,camera,assets,externalState){
    const W=this.W,H=this.H;
    const vw=camera.viewport.width/camera.zoom,vh=camera.viewport.height/camera.zoom;
    const x0=camera.x-vw/2-4,x1=camera.x+vw/2+4,y0=camera.y-vh/2-4,y1=camera.y+vh/2+4;
    if(x0>=0&&y0>=0&&x1<=W&&y1<=H)return;
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    // campo distante (além das faixas desenhadas)
    ctx.fillStyle='#1c1d20';ctx.fillRect(x0,y0,x1-x0,y1-y0);
    if(x1>W){const sx=Math.max(W,x0);ctx.fillStyle='#143a52';ctx.fillRect(sx,y0,x1-sx,y1-y0);}
    for(const s of this.strips){
      const ix0=Math.max(s.x,Math.floor(x0/2)*2),iy0=Math.max(s.y,Math.floor(y0/2)*2),ix1=Math.min(s.x+s.w,Math.ceil(x1/2)*2),iy1=Math.min(s.y+s.h,Math.ceil(y1/2)*2);
      if(ix1<=ix0||iy1<=iy0)continue;
      ctx.drawImage(s.canvas,(ix0-s.x)/2,(iy0-s.y)/2,(ix1-ix0)/2,(iy1-iy0)/2,ix0,iy0,ix1-ix0,iy1-iy0);
    }
    const still=window.__projectZGame?.save?.settings?.reducedMotion;
    const t=still?0:performance.now()*.001;
    // espuma das ondas e brilhos
    if(x1>W){
      const ya=Math.max(y0,-WB_M),yb=Math.min(y1,H+WB_M);
      for(let k=0;k<3;k++){
        ctx.strokeStyle=`rgba(244,252,250,${(.62-k*.17).toFixed(2)})`;ctx.lineWidth=5-k;ctx.beginPath();
        let first=true;
        for(let y=Math.floor(ya/16)*16;y<=yb+16;y+=16){
          const off=Math.sin(t*.9+k*1.7+y*.011)*10+k*26+Math.sin(t*.5+y*.03)*4;
          const x=this.shore(y)+off-8;
          if(first){ctx.moveTo(x,y);first=false;}else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      ctx.fillStyle='rgba(255,255,255,.55)';
      for(let i=0;i<60;i++){
        const gy=ya+((i*977)%1000)/1000*(yb-ya),gx=this.shore(gy)+120+((i*613)%1000)/1000*600;
        if(Math.sin(t*1.6+i*2.1)>.82)ctx.fillRect(Math.round(gx/2)*2,Math.round(gy/2)*2,6,2);
      }
    }
    // CRONOS C2: ambiental, renderizado somente no exterior visível.
    this.crowd.draw(ctx,assets,{x0,y0,x1,y1},externalState,still);
    // R11: mantém o fogo exterior idêntico ao original, usando a função compartilhada.
    drawWorldBorderFireFX(ctx,this.fires,t,{x0,y0,x1,y1});
    ctx.restore();
  }
}

class World {
  constructor(assets) {
    this.assets = assets;
    this.width = GAME.map.width;
    this.height = GAME.map.height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1152;
    this.canvas.height = 1152;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    // Restrained sign lighting lives directly above real storefronts, not in traffic lanes.
    // 20% lower intensity vs. the previous exterior color treatment; never a siren.
    this.lights = [
      {x:224,y:230,color:'#c6545a',radius:165,strength:.24*.8,flicker:0,phase:0},       // Banco Tietê
      {x:942,y:194,color:'#c6545a',radius:148,strength:.22*.8,flicker:3.2,phase:1.3}, // Banco Paulista
      {x:174,y:975,color:'#c6545a',radius:152,strength:.21*.8,flicker:0,phase:0},     // Frigorífico Vila
      {x:972,y:966,color:'#bd555b',radius:152,strength:.22*.8,flicker:3.4,phase:.7},  // Casas do Brás
      {x:1490,y:264,color:'#c6545a',radius:158,strength:.22*.8,flicker:0,phase:0},   // Drogaria Sé
      {x:2388,y:298,color:'#c6545a',radius:158,strength:.21*.8,flicker:3.0,phase:2}, // Parada 24h
      {x:186,y:1543,color:'#bc5459',radius:157,strength:.22*.8,flicker:0,phase:0},   // Casas do Brás ind.
      {x:930,y:1553,color:'#cb5557',radius:158,strength:.20*.8,flicker:3.2,phase:1}, // Frigorífico Vila ind.
      {x:1440,y:1575,color:'#c6545a',radius:160,strength:.22*.8,flicker:0,phase:0}, // Banco Tietê rod.
      {x:2370,y:1558,color:'#c6545a',radius:160,strength:.20*.8,flicker:3.1,phase:2.1}, // Banco Paulista rod.
      {x:1480,y:2510,color:'#ce685c',radius:155,strength:.20*.8,flicker:0,phase:0}, // Posto
      {x:2380,y:2485,color:'#c6545a',radius:153,strength:.21*.8,flicker:2.8,phase:1.2}
    ];
    this.lampLights = [
      {x:406,y:390,color:'#ffe1b0',radius:84,strength:.23,flicker:0,phase:0},
      {x:740,y:390,color:'#ffe1b0',radius:84,strength:.22,flicker:5.0,phase:1.0},
      {x:406,y:760,color:'#ffe1b0',radius:86,strength:.23,flicker:0,phase:0},
      {x:740,y:760,color:'#ffe1b0',radius:86,strength:.22,flicker:6.2,phase:.6},
      {x:116,y:390,color:'#ffe1b0',radius:74,strength:.20,flicker:0,phase:0},
      {x:1008,y:390,color:'#ffe1b0',radius:76,strength:.19,flicker:7.4,phase:1.7},
      {x:390,y:118,color:'#ffe1b0',radius:78,strength:.20,flicker:7.8,phase:.4},
      {x:758,y:1032,color:'#ffe1b0',radius:82,strength:.20,flicker:6.8,phase:2.3},
      {x:1468,y:393,color:'#ffe1b0',radius:85,strength:.19,flicker:5.5,phase:.5},
      {x:2290,y:752,color:'#ffe1b0',radius:85,strength:.19,flicker:0,phase:0},
      {x:1758,y:393,color:'#ffe1b0',radius:83,strength:.18,flicker:0,phase:0},
      {x:393,y:1530,color:'#ffe1b0',radius:86,strength:.19,flicker:5.9,phase:1.2},
      {x:752,y:2160,color:'#ffe1b0',radius:88,strength:.20,flicker:0,phase:0},
      {x:392,y:2630,color:'#ffe1b0',radius:84,strength:.19,flicker:5.1,phase:2.2},
      {x:1843,y:1508,color:'#ffe1b0',radius:88,strength:.20,flicker:4.6,phase:2.2},
      {x:2059,y:2240,color:'#ffe1b0',radius:88,strength:.19,flicker:0,phase:0},
      {x:1843,y:2570,color:'#ffe1b0',radius:83,strength:.19,flicker:5.2,phase:.2}
    ];
    this.fireLights = [
      {x:879,y:683,color:'#ff7c38',radius:170,strength:.24,phase:1.3},
      {x:688,y:303,color:'#ff7a44',radius:150,strength:.21,phase:.5},
      {x:1637,y:903,color:'#ff7c38',radius:165,strength:.23,phase:2.1},
      {x:979,y:1644,color:'#ff7c38',radius:170,strength:.23,phase:1.6},
      {x:2184,y:2106,color:'#ff7c38',radius:165,strength:.22,phase:2.8}
    ];
    this.fogBanks = [
      {x:258,y:182,rx:180,ry:105,alpha:.10,phase:.2},
      {x:905,y:168,rx:160,ry:100,alpha:.10,phase:1.8},
      {x:574,y:918,rx:185,ry:92,alpha:.08,phase:1.1},
      {x:1540,y:420,rx:210,ry:110,alpha:.09,phase:2.7},
      {x:571,y:1540,rx:190,ry:120,alpha:.11,phase:.8},
      {x:2050,y:1960,rx:240,ry:120,alpha:.10,phase:2.2}
    ];
    this.paint();
    this.sectors = DISTRICTS.filter(z=>z.id!=='center').map(zone=>this.createSector(zone));
    try{this.border=new WorldBorder();}catch(e){console.warn('[PROJECT Z] Bordas visuais indisponíveis',e);this.border=null;}
  }
  paint() {
    const ctx = this.ctx; const rand = mulberry32(4612);
    r(ctx,0,0,1152,1152,'#27282b');
    // Chão com detalhes pixelados e manchas de vegetação
    for (let y=0;y<1152;y+=16) for(let x=0;x<1152;x+=16) {
      const v=rand();
      if(v<.28)r(ctx,x,y,16,16,'#26292b');
      else if(v<.48)r(ctx,x,y,16,16,'#303034');
      if(rand()<.24)r(ctx,x+Math.floor(rand()*14),y+Math.floor(rand()*14),2,2,'#575559');
      if(rand()<.045)r(ctx,x+3,y+8,8,3,'#403539');
    }
    // Asfalto das principais avenidas e calçadas
    r(ctx,398,0,350,1152,C.dark);r(ctx,414,0,318,1152,C.road);
    r(ctx,0,401,1152,353,C.dark);r(ctx,0,417,1152,322,C.road);
    asphaltVariation(ctx,414,0,318,1152,4401);asphaltVariation(ctx,0,417,1152,322,4402); // A7
    for(const xx of [402,730]){r(ctx,xx,0,10,1152,'#4a4749');r(ctx,xx+2,0,2,1152,'#797276');}
    for(const yy of [404,732]){r(ctx,0,yy,1152,10,'#4a4749');r(ctx,0,yy+2,1152,2,'#797276');}
    // Marcações de vias
    for(let y=16;y<1100;y+=58){ if(y<404||y>745){r(ctx,568,y,4,31,'#9f9584');r(ctx,578,y,4,31,'#9f9584');} }
    for(let x=8;x<1100;x+=60){if(x<390||x>748){r(ctx,x,564,31,4,'#9f9584');r(ctx,x,575,31,4,'#9f9584');}}
    // Faixas de pedestre nas quatro extremidades do cruzamento
    for(let i=0;i<9;i++){
      r(ctx,438+i*30,385,17,25,'#8b8582');r(ctx,438+i*30,745,17,25,'#8b8582');
      r(ctx,385,438+i*30,25,17,'#8b8582');r(ctx,743,438+i*30,25,17,'#8b8582');
    }
    // Janelas de céu aberto: canteiros e pequenas praças
    r(ctx,30,40,325,328,'#343536');r(ctx,45,50,293,290,'#393738');
    r(ctx,781,28,334,345,'#313337');r(ctx,799,42,290,310,'#383738');
    r(ctx,30,790,336,315,'#313133');r(ctx,46,805,300,270,'#353436');
    r(ctx,787,790,326,313,'#343335');r(ctx,799,803,300,279,'#3b3a3a');
    // Construções de arquitetura pixelada, agora com silhuetas mais variadas.
    building(ctx,52,58,272,204,{roof:'#323337',edge:'#626266',glow:'#e34b52',title:'BANCO TIETÊ',variant:'tower',trim:'#8d8586'});
    building(ctx,820,64,238,164,{roof:'#383438',edge:'#666068',glow:'#e34b52',title:'BANCO PAULISTA',variant:'round',trim:'#877d82'});
    building(ctx,52,835,254,169,{roof:'#33363b',edge:'#696569',glow:'#bb6669',title:'FRIGORÍFICO VILA',variant:'industrial',trim:'#82787a'});
    building(ctx,836,835,233,160,{roof:'#3a3639',edge:'#676266',glow:'#ed4f56',title:'CASAS DO BRÁS',variant:'mall',trim:'#8a7c81'});
    // Identidade paulistana: nomes de vias e placas urbanas espalhados pela malha central.
    roadStencil(ctx,72,548,'RUA DA MOOCA');
    roadStencil(ctx,816,548,'RUA MILÃO');
    roadStencil(ctx,70,612,'RUA BETÂNIA');
    roadStencil(ctx,804,612,'RUA SÃO PAULO');
    roadStencil(ctx,510,188,'AV. DO ESTADO',Math.PI/2);
    roadStencil(ctx,636,168,'RUA HERMILO ALVES',Math.PI/2);
    roadStencil(ctx,510,828,'RUA AZEVEDO JÚNIOR',Math.PI/2);
    roadStencil(ctx,636,820,'RUA VANDENKOOLK',Math.PI/2);
    laneMarking(ctx,470,520,'PARE',Math.PI/2);
    laneMarking(ctx,684,650,'PARE',-Math.PI/2);
    laneMarking(ctx,502,706,'ÔNIBUS');
    paulistaSign(ctx,86,432,'RUA DA MOOCA','MOOCA');
    paulistaSign(ctx,872,430,'RUA MILÃO','CENTRO');
    paulistaSign(ctx,445,92,'AV. DO ESTADO','VIADUTO',Math.PI/2);
    paulistaSign(ctx,708,870,'RUA VANDENKOOLK','BRÁS',Math.PI/2);
    // Sobreviventes isolados observando a cidade do alto.
    // Área urbanizada: gramados, trilhas, caixas de energia, postes
    for(let i=0;i<13;i++){
      const t=[[375,112],[355,272],[760,99],[1068,312],[92,342],[310,343],[806,346],[1093,72],[60,1050],[332,1050],[800,1030],[1077,1043],[1026,800]][i];
      tree(ctx,t[0],t[1],i%3===0?1.4:1.1,i%5===0);
    }
    // BLOCO 2: barricadas e caixas são desenhadas em tempo real pelo WorldDestruction.
    // O mesmo desenho original será preservado até cada peça ser destruída.
    // (as poças retangulares pintadas no chão saíram: as poças agora são todas dinâmicas, com forma orgânica)
    // Sujeira e fissuras nas ruas, determinísticas
    for(let i=0;i<115;i++) {
      const x=Math.floor(rand()*1152), y=Math.floor(rand()*1152);
      if(rand()>.43) crack(ctx,x,y,9+rand()*23,rand()<.5?'#1b3036':'#3c4f4e');
      else {r(ctx,x,y,3+rand()*8,2,'#71816c');if(rand()<.3)r(ctx,x+4,y-5,2,8,'#4f785f');}
    }
    // outdoors pintados diretamente no chão
    graffiti(ctx,459,868,'SEM SAÍDA','#b65b60');graffiti(ctx,790,518,'ISOLAMENTO','#d08a84');
    graffiti(ctx,83,549,'SP / Z-01','#c68f88');
    // G.3.0 — Asphalt texture, emergency road markings, reflections and believable debris.
    // These are ONLY visual decals, kept entirely outside collision and navigation.
    urbanGrime(ctx,{x:414,y:0,w:318,h:1152,seed:842,intensity:.65});
    urbanGrime(ctx,{x:0,y:417,w:1152,h:322,seed:1402,intensity:.65});
    roadDecals(ctx,414,0,318,1152,{vertical:true,seed:461});
    roadDecals(ctx,0,417,1152,322,{seed:533});
    // Worn evacuation arrows, Portuguese municipal notices, zebra-strip reflections.
    roadStencil(ctx,628,352,'SP-09 / INTERDITADO',-Math.PI/2);
    roadStencil(ctx,612,875,'EVACUAÇÃO',-Math.PI/2);
    roadStencil(ctx,147,608,'ÁREA ISOLADA');
    roadStencil(ctx,804,636,'ZONA VERMELHA');
    // Abandoned checkpoints: paint and tape, no new collision boxes.
    for(const [xx,yy] of [[416,348],[726,348],[416,789],[726,789]]){
      r(ctx,xx-9,yy-5,36,7,'#281f20');
      for(let k=0;k<5;k++)r(ctx,xx-8+k*7,yy-5,4,7,'#d18d5b');
      r(ctx,xx-8,yy+3,38,2,'#130e10');
    }
    // Police cordon near façades, with restrained red warning LEDs.
    // Surface water catches intermittent red sign light, not solid red fill.
    for(const [xx,yy,ww,hh] of [[470,410,80,7],[602,728,96,8],[738,614,31,10],[394,579,55,8]]){
      r(ctx,xx,yy,ww,hh,'rgba(159,58,61,.16)');
      r(ctx,xx+ww*.12,yy+1,ww*.55,1,'rgba(244,139,135,.36)');
    }
    // Carros abandonados, alguns angulados, com pontos de incêndio e postes paulistanos.
    const a=this.assets;
    const vehicles=[['carCoral',464,279,.06],['carTeal',697,304,-.18],['carAmber',490,853,.27],['carTeal',690,962,-.2],['carCoral',879,683,Math.PI/2],['carAmber',269,653,Math.PI/2],['carTeal',310,556,Math.PI/2],['carCoral',782,573,Math.PI/2]];
    // BLOCO 2: veículos móveis de estado são desenhados em tempo real, na posição original.
    // BLOCO 2: fogo e viatura renderizados acima dos veículos dinâmicos, como na FIX.1.
    // BLOCO 2: sprites originais das caixas são desenhados em tempo real.
    for(const lamp of this.lampLights)if(lamp.x<1152&&lamp.y<1152)streetlightPole(ctx,lamp.x,lamp.y);
    // Piso quebrado no centro
    for(let i=0;i<9;i++){
      const px=535+rand()*115,py=480+rand()*180;
      crack(ctx,px,py,18+rand()*25,'#182f37');
    }
    // Ponto de referência do sobrevivente com círculo pintado no solo
    ctx.strokeStyle='#9d5559';ctx.globalAlpha=.39;ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(592,575,43,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    r(ctx,565,614,55,3,'#8b4e52');
    r(ctx,572,628,42,2,'#e1d5d2');
  }
  createSector(zone) {
    const canvas=document.createElement('canvas');canvas.width=zone.w;canvas.height=zone.h;
    const ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
    const rand=mulberry32(zone.id==='suburb'?19481:zone.id==='industry'?62534:92733);
    const palette=zone.id==='suburb'?['#303236','#34373a','#37373a','#3d3a3b']:zone.id==='industry'?['#302d30','#39363a','#353337','#403436']:['#303136','#38383c','#37383d','#3c3538'];
    r(ctx,0,0,zone.w,zone.h,palette[0]);
    for(let y=0;y<zone.h;y+=16)for(let x=0;x<zone.w;x+=16){
      if(rand()<.76)r(ctx,x,y,16,16,palette[Math.floor(rand()*palette.length)]);
      if(rand()<.2)r(ctx,x+Math.floor(rand()*13),y+Math.floor(rand()*13),3,2,'#727073');
      if(rand()<.045)r(ctx,x+4,y+7,8,3,zone.id==='suburb'?'#5a4e4f':'#646061');
    }
    ctx.save();ctx.translate(-zone.x,-zone.y);
    const road=(x,y,w,h)=>{
      r(ctx,x-13,y-13,w+26,h+26,'#524c4e');
      r(ctx,x-6,y-6,w+12,h+12,'#0d1114');
      r(ctx,x,y,w,h,zone.id==='highway'?'#222126':'#1b1d22');
    };
    // Vias interligadas: a saída leste do Centro alcança o Subúrbio; a saída sul chega à Indústria.
    if(zone.id==='suburb'){
      road(1152,417,1648,322);road(1860,0,182,1152);
      for(let x=1170;x<2800;x+=76)r(ctx,x,574,42,4,'#a99f91');
      for(let y=0;y<1152;y+=68)if(y<390||y>760)r(ctx,1950,y,4,35,'#aea396');
    }else if(zone.id==='industry'){
      road(414,1152,318,1648);road(0,1790,1152,250);
      for(let y=1160;y<2800;y+=72)if(y<1770||y>2050)r(ctx,575,y,5,38,'#aea396');
      for(let x=0;x<1152;x+=75)if(x<400||x>752)r(ctx,x,1914,38,5,'#aea396');
    }else{
      road(1860,1152,182,1648);road(1152,1790,1648,250);
      for(let y=1152;y<2800;y+=74)if(y<1768||y>2062)r(ctx,1950,y,4,40,'#aea396');
      for(let x=1152;x<2800;x+=80)if(x<1830||x>2060)r(ctx,x,1914,38,5,'#aea396');
    }
    // Arquitetura e obstáculos compartilham a geometria com CollisionMap.
    for(const b of DISTRICT_BUILDINGS.filter(b=>b.zone===zone.id)){
      const variant = zone.id==='suburb'
        ? (b.name==='DROGARIA SÉ' ? 'tower' : b.name==='PARADA 24H' ? 'mall' : b.name==="HABIB'S" ? 'round' : 'compound')
        : zone.id==='industry'
          ? (b.name==='FRIGORÍFICO VILA' ? 'industrial' : b.name==='HIPER LESTE' ? 'mall' : b.name==='MERCADÃO 24H' ? 'compound' : 'tower')
          : (b.name==='BANCO TIETÊ' ? 'tower' : b.name==='BANCO PAULISTA' ? 'round' : b.name==='POSTO ESTADO' ? 'mall' : 'industrial');
      building(ctx,b.x,b.y,b.w,b.h,{roof:b.roof||(zone.id==='industry'?'#3a3538':zone.id==='highway'?'#36343b':'#343638'),edge:'#70696b',glow:zone.color,title:b.name,variant,trim:'#8a8082'});
      r(ctx,b.x+15,b.y+b.h-12,b.w-30,4,'#131416');
    }
    // Vias nomeadas do distrito, com placas urbanas e marcações mais críveis.
    if(zone.id==='suburb'){
      roadStencil(ctx,1220,552,'RUA HERMILO ALVES');
      roadStencil(ctx,2130,552,'RUA BETÂNIA');
      roadStencil(ctx,1982,118,'RUA SÃO PAULO',Math.PI/2);
      laneMarking(ctx,1885,690,'PARE',Math.PI/2);
      paulistaSign(ctx,1188,430,'RUA HERMILO ALVES','ZONA LESTE');
      paulistaSign(ctx,2130,430,'RUA BETÂNIA','BELÉM');
      paulistaSign(ctx,1918,90,'RUA SÃO PAULO','BRÁS',Math.PI/2);
    }else if(zone.id==='industry'){
      roadStencil(ctx,58,1896,'RUA AZEVEDO JÚNIOR');
      roadStencil(ctx,432,1978,'RUA JOSÉ ANTÔNIO LOGAREIRO');
      roadStencil(ctx,610,1248,'RUA VANDENKOOLK',Math.PI/2);
      laneMarking(ctx,525,2060,'ÔNIBUS');
      paulistaSign(ctx,90,1770,'RUA AZEVEDO JÚNIOR','INDÚSTRIA');
      paulistaSign(ctx,690,1200,'RUA VANDENKOOLK','GALPÕES',Math.PI/2);
    }else{
      roadStencil(ctx,1218,1896,'RUA DA MOOCA');
      roadStencil(ctx,2140,1896,'RUA MILÃO');
      roadStencil(ctx,1982,1290,'AV. DO ESTADO',Math.PI/2);
      laneMarking(ctx,1882,2030,'PARE',Math.PI/2);
      paulistaSign(ctx,1210,1770,'RUA DA MOOCA','MOOCA');
      paulistaSign(ctx,2140,1770,'RUA MILÃO','MOOCA');
      paulistaSign(ctx,1908,1270,'AV. DO ESTADO','ACESSO',Math.PI/2);
    }
    // Sobreviventes decorativos nos topos dos prédios.
    if(zone.id==='suburb'){
    }else if(zone.id==='industry'){
    }else{
    }
    for(const p of DISTRICT_PROPS.filter(p=>p.x>=zone.x&&p.x<zone.x+zone.w&&p.y>=zone.y&&p.y<zone.y+zone.h)){
      if(p.type==='garden'){
        r(ctx,p.x,p.y,p.w,p.h,'#3c4640');
        for(let i=0;i<5;i++)tree(ctx,p.x+8+i*13,p.y+14,1.1,true);
      }else{
        // BLOCO 2: prop aprovado desenhado em tempo real, sem alterar sua aparência.
      }
    }

    // Ambiência urbana extra: fachos de névoa, veículos incendiados e postes variados.
    if(zone.id==='suburb'){
      // BLOCO 2: camada dinâmica preserva fogo e viatura original.
      for(const [sx,sy,t,s] of [[1468,310,'MOOCA · SENTIDO CENTRO','ZONA LESTE'],[2290,310,'BELÉM · ACESSO','RUA BETÂNIA']])paulistaSign(ctx,sx,sy,t,s);
    }else if(zone.id==='industry'){
      // BLOCO 2: camada dinâmica preserva fogo e viatura original.
      // BLOCO 2: camada dinâmica preserva fogo e viatura original.
      paulistaSign(ctx,146,1520,'ÁREA INDUSTRIAL','ATENÇÃO');
      paulistaSign(ctx,864,2440,'CARGA E DESCARGA','BLOQUEADO');
    }else{
      // BLOCO 2: camada dinâmica preserva fogo e viatura original.
      // BLOCO 2: camada dinâmica preserva fogo e viatura original.
      paulistaSign(ctx,1442,1510,'MOOCA AUTO','SERVIÇOS');
      paulistaSign(ctx,2295,2440,'POSTO ESTADO','ÚLTIMO ABASTECIMENTO');
    }
    // BLOCO 2: carros de cada distrito são desenhados em tempo real.
    // Região estilizada, com vegetação, destroços e fissuras em distribuição determinística.
    for(let i=0;i<120;i++){
      const x=zone.x+rand()*zone.w,y=zone.y+rand()*zone.h;
      if(rand()<.37)tree(ctx,x,y,.6+rand()*.7,zone.id==='suburb');
      else crack(ctx,x,y,10+rand()*20,rand()<.5?'#191b20':'#373134');
    }
    urbanGrime(ctx,{x:zone.x,y:zone.y,w:zone.w,h:zone.h,seed:zone.id==='suburb'?116:zone.id==='industry'?246:816,intensity:.52});
    ctx.fillStyle=zone.color;ctx.font='bold 24px monospace';
    const label={suburb:'SP / ZONA LESTE · QUARENTENA',industry:'SP / DISTRITO INDUSTRIAL',highway:'SP / RODOVIA INTERDITADA'}[zone.id];
    const mark=zone.id==='suburb'?[1500,775]:zone.id==='industry'?[75,2155]:[2220,2135];
    // ATLAS A9: nome do distrito não é mais pintado no chão (o HUD já anuncia a zona).
    for(const lamp of this.lampLights)if(lamp.x>=zone.x&&lamp.x<zone.x+zone.w&&lamp.y>=zone.y&&lamp.y<zone.y+zone.h)streetlightPole(ctx,lamp.x,lamp.y);
    ctx.restore();return {...zone,canvas};
  }
  draw(ctx, camera, externalState) {
    ctx.save(); camera.apply(ctx);
    this.border?.draw(ctx,camera,this.assets,externalState);
    const viewW=camera.viewport.width/camera.zoom,viewH=camera.viewport.height/camera.zoom;
    const xMin=camera.x-viewW/2-80,xMax=camera.x+viewW/2+80,yMin=camera.y-viewH/2-80,yMax=camera.y+viewH/2+80;
    if(xMax>=0&&yMax>=0&&xMin<=1152&&yMin<=1152)ctx.drawImage(this.canvas,0,0);
    for(const s of this.sectors){
      if(xMin>s.x+s.w||xMax<s.x||yMin>s.y+s.h||yMax<s.y)continue;
      ctx.drawImage(s.canvas,s.x,s.y);
    }
    // HÉSTIA: a tela inicial também mantém todos os objetos originais.
    // Durante a partida, WorldDestruction usa os mesmos desenhos e gerencia dano.
    if(document.querySelector('#app')?.dataset.scene!=='field'){
      this.previewProps??=new WorldDestruction({effects:{},loot:{},navigation:{}});
      this.previewProps.draw(ctx,this.assets,camera);
    }
    const time=performance.now()*.001;
    ctx.globalCompositeOperation='screen';
    for(const l of this.lights) {
      const basePulse=.9+.1*Math.sin(time*2.8+(l.phase||0));
      const flick=l.flicker?(.42+.58*Math.max(0,Math.sin(time*l.flicker+(l.phase||0)))):1;
      const strength=l.strength*basePulse*flick;
      let glow=ctx.createRadialGradient(l.x,l.y,4,l.x,l.y,l.radius);
      glow.addColorStop(0,toRGBA(l.color,Math.min(.95,strength*1.15)));
      glow.addColorStop(.18,toRGBA(l.color,strength*.58));
      glow.addColorStop(.46,toRGBA(l.color,strength*.22));
      glow.addColorStop(1,toRGBA(l.color,0));
      ctx.fillStyle=glow;ctx.fillRect(l.x-l.radius,l.y-l.radius,l.radius*2,l.radius*2);
    }
    for(const lamp of this.lampLights){
      const flick=lamp.flicker?(.35+.65*Math.max(0,Math.sin(time*lamp.flicker+lamp.phase))):1;
      const strength=lamp.strength*flick;
      let glow=ctx.createRadialGradient(lamp.x,lamp.y,2,lamp.x,lamp.y,lamp.radius);
      glow.addColorStop(0,toRGBA(lamp.color,Math.min(.96,strength*1.5)));
      glow.addColorStop(.14,toRGBA(lamp.color,strength*.85));
      glow.addColorStop(.38,toRGBA(lamp.color,strength*.32));
      glow.addColorStop(1,toRGBA(lamp.color,0));
      ctx.fillStyle=glow;ctx.fillRect(lamp.x-lamp.radius,lamp.y-lamp.radius,lamp.radius*2,lamp.radius*2);
      ctx.fillStyle=toRGBA('#fff6e6',Math.min(.42,strength*.9));
      ctx.beginPath();ctx.arc(lamp.x,lamp.y,3+flick*2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=toRGBA(lamp.color,Math.min(.22,strength*.8));
      ctx.fillRect(lamp.x-4,lamp.y,lamp.radius*.24,2);
      ctx.fillRect(lamp.x-lamp.radius*.24,lamp.y, lamp.radius*.24,2);
    }
    const activeBurningCarSites=window.__projectZGame?.scenes?.current?.run?.destructibles?.initialBurningCars;
    for(const f of this.fireLights){
      if(activeBurningCarSites){
        const site=activeBurningCarSites.find(s=>Math.hypot(s.x-f.x,s.y-f.y)<24);
        if(site?.vehicle?.exploded && site.vehicle.burnTime<=0)continue;
      }
      const flare=.78+.22*Math.sin(time*5+f.phase)+.12*Math.sin(time*9+f.phase*.6);
      const glow=ctx.createRadialGradient(f.x,f.y,4,f.x,f.y,f.radius);
      glow.addColorStop(0,toRGBA(f.color,f.strength*flare*1.15));
      glow.addColorStop(.2,toRGBA(f.color,f.strength*.62*flare));
      glow.addColorStop(1,toRGBA(f.color,0));
      ctx.fillStyle=glow;ctx.fillRect(f.x-f.radius,f.y-f.radius,f.radius*2,f.radius*2);
    }
    ctx.globalCompositeOperation='source-over';
    for(const fog of this.fogBanks){
      const drift=Math.sin(time*.22+fog.phase)*18;
      const alpha=fog.alpha*(.84+.16*Math.sin(time*.41+fog.phase));
      const grad=ctx.createRadialGradient(fog.x+drift*.2,fog.y,10,fog.x+drift,fog.y,fog.rx);
      grad.addColorStop(0,`rgba(194,197,201,${alpha})`);
      grad.addColorStop(.52,`rgba(112,116,121,${alpha*.42})`);
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.ellipse(fog.x+drift,fog.y,fog.rx,fog.ry,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
}
function toRGBA(hex, alpha) {
  const v=hex.replace('#','');return `rgba(${parseInt(v.slice(0,2),16)},${parseInt(v.slice(2,4),16)},${parseInt(v.slice(4,6),16)},${alpha})`;
}

