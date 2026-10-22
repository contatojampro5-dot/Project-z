// -- src/world/WorldBorder.js --
// Acabamento visual AO REDOR do mapa jogável (2800x2800). Somente decoração:
// não altera GAME.map, colisões, câmera, spawn nem movimentação.
// Direita = praia com deck; topo = cidade com barricadas; esquerda/baixo = cidade em chamas.
const WB_M=1280;
const PZ_BEACH_AV=100; // ATLAS A9: largura da avenida beira-mar

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
    if(cluster.edge==='top')return {x:cluster.at+z.side+sway,y:-Math.max(76,away+24),heading:Math.PI/2}; // A9: atrás do muro
    if(cluster.edge==='bottom')return {x:cluster.at+z.side+sway,y:this.height+Math.max(74,away+22),heading:-Math.PI/2};
    return {x:-Math.max(66,away+18),y:cluster.at+z.side+sway,heading:0};
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
        // R30: mesmas folhas novas dos infectados comuns da cidade (operário, executivo, paciente).
        // A fileira da frente arranha a barricada (ataque); as de trás andam no lugar, empurrando.
        const NS=typeof PZ_SPRITES!=='undefined'?PZ_SPRITES.normal:null;
        const nimg=NS&&assets.get(NS.variants[Math.floor(z.style*NS.variants.length)%NS.variants.length]);
        if(nimg&&nimg.width){
          const dir=((Math.round(p.heading/(Math.PI/4))%8)+8)%8;
          const speed=.8+z.style*.5;
          let anim='walk',fr=0;
          if(z.row===0&&!still){anim='attack';fr=Math.floor(time*8*speed+z.phase*3)%NS.anims.attack.frames;}
          else fr=still?0:Math.floor(time*7*speed+z.gait*3)%NS.anims.walk.frames;
          const fy=p.y+11,k=typeof PZ_ENTITY_SCALE!=='undefined'?PZ_ENTITY_SCALE:1;
          ctx.save();ctx.translate(p.x,fy);ctx.scale(k,k);ctx.translate(-p.x,-fy);
          pzBlit(ctx,nimg,NS,anim,fr,dir,p.x,p.y);
          ctx.restore();
          continue;
        }
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
    // R27: cidade lá fora mais em chamas — uma camada de focos mais ao fundo (prédios e quarteirões
    // inteiros queimando), espaçada para não virar um mar de fogo, e alguns focos isolados no meio.
    const deep=mulberry32(77031);
    for(const x of lineAnchors(120,W-120,250,40)){
      if(deep()<.62)addCluster(x,-420-deep()*260,2+Math.floor(deep()*3),110,80,1.0,.4);
      if(deep()<.62)addCluster(x,H+420+deep()*260,2+Math.floor(deep()*3),110,80,1.0,.4);
    }
    for(const y of lineAnchors(120,H-120,250,40)){
      if(deep()<.62)addCluster(-420-deep()*260,y,2+Math.floor(deep()*3),80,110,1.0,.4);
    }
    for(let i=0;i<26;i++){const side=Math.floor(deep()*3),d=330+deep()*700;
      const [cx,cy]=side===0?[160+deep()*(W-320),-d]:side===1?[160+deep()*(W-320),H+d]:[-d,160+deep()*(H-320)];
      addCluster(cx,cy,1+Math.floor(deep()*2),40,40,.8,.15);}
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
    // ATLAS A9 · Hefesto — muro de quarentena de concreto pré-moldado (placas tipo "T-wall") no lugar
    // da fileira de módulos. As bocas das avenidas continuam fechadas pelos bloqueios pesados (ônibus/caminhão).
    const W=this.W,H=this.H;
    const mouths=side==='left'?[[401,754],[1777,2053]]:side==='top'?[[398,748],[1847,2055]]:[[401,745],[1847,2055]];
    const lo=side==='left'?-66:-120,hi=side==='left'?H+66:W;
    const draw=(fn,a,b)=>{ctx.save();
      if(side==='left'){ctx.translate(-64,a);ctx.transform(0,1,1,0,0,0);}
      else ctx.translate(a,side==='top'?-62:H+8);
      fn(ctx,Math.max(0,b-a));ctx.restore();};
    // calçada junto ao muro (lado de dentro) com sarjeta
    if(side==='left'){r(ctx,-30,lo,30,hi-lo,'#2a2a2d');r(ctx,-6,lo,6,hi-lo,'#1d1e21');}
    else if(side==='top'){r(ctx,lo,-10,hi-lo,10,'#2a2a2d');}
    else{r(ctx,lo,H,hi-lo,6,'#2a2a2d');}
    const runs=[];let cur=lo;
    for(const [a,b] of mouths){if(a>cur)runs.push([cur,a]);cur=Math.max(cur,b);}
    if(cur<hi)runs.push([cur,hi]);
    for(const [a,b] of mouths)draw((c,len)=>this.heavyBlock(c,len,rand),a,b);
    for(const [a,b] of runs)this.wallRun(ctx,side,a,b,rand);
    for(const [a,b] of mouths){this.wallPillar(ctx,side,a-10);this.wallPillar(ctx,side,b-4);}
    // torres de refletor atrás do muro, mirando para dentro da zona
    for(let u=lo+260;u<hi-120;u+=470+Math.floor(rand()*120)){
      if(mouths.some(([a,b])=>u>a-60&&u<b+60))continue;
      this.floodTower(ctx,side,u,rand);
    }
  }
  // Uma corrida contínua de placas de concreto entre a e b (ao longo da borda).
  wallRun(ctx,side,a,b,rand){
    const P=24,H=this.H;
    const tags=['#d2443c','#e8c547','#3fa1d8','#e6e6e6','#7fcf5a','#c45ad1','#f08a3c'];
    const shade=(rgb,k)=>`rgb(${rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*k)))).join(',')})`;
    const base=[132,127,118];
    if(side==='left'){
      // visto de cima: o topo das placas, o pé em "T" para dentro e a sombra no chão
      const x0=-54,x1=-32;
      for(let u=a;u<b;u+=P){const w=Math.min(P,b-u),t=.88+rand()*.2;
        ctx.fillStyle=shade(base,t*1.08);ctx.fillRect(x0,u,x1-x0,w);
        ctx.fillStyle=shade(base,t*.82);ctx.fillRect(x1,u,4,w); // borda do topo (chanfro)
        ctx.fillStyle=shade(base,t*.7);ctx.fillRect(x1+4,u+3,7,w-6); // pé do T
        ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x0,u,x1-x0+4,1.2);
        ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(x0,u+1.2,x1-x0,.6);
        for(let i=0;i<3;i++){ctx.fillStyle=`rgba(20,18,16,${(.08+rand()*.12).toFixed(2)})`;ctx.fillRect(x0+rand()*18,u+rand()*w,2+rand()*6,1+rand()*3);}
        if(rand()<.3){ctx.fillStyle='rgba(70,90,50,.35)';ctx.fillRect(x0+rand()*16,u+rand()*w,3,2);}
        ctx.fillStyle='#2b2a28';ctx.fillRect(x0+5,u+w/2-1,2,2);ctx.fillRect(x1-7,u+w/2-1,2,2); // olhais de içamento
      }
      const g=ctx.createLinearGradient(-21,0,-2,0);g.addColorStop(0,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(-21,a,19,b-a);
      ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x0-6,a,6,b-a);
      this.razorWire(ctx,'v',-43,a,b,rand);
      return;
    }
    const top=side==='top';
    const y0=top?-66:H+4,capH=10,faceH=46,yF=y0+capH;
    for(let u=a;u<b;u+=P){
      const w=Math.min(P,b-u),t=.86+rand()*.22;
      // topo
      ctx.fillStyle=shade(base,t*1.12);ctx.fillRect(u,y0,w,capH);
      ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(u,yF-1.5,w,1.5);
      // face vertical com luz do céu em cima e sujeira embaixo
      const g=ctx.createLinearGradient(0,yF,0,yF+faceH);g.addColorStop(0,shade(base,t*.98));g.addColorStop(.7,shade(base,t*.8));g.addColorStop(1,shade([96,84,70],t*.8));
      ctx.fillStyle=g;ctx.fillRect(u,yF,w,faceH);
      ctx.fillStyle='rgba(0,0,0,.32)';ctx.fillRect(u,yF,w,2); // sombra do beiral
      // textura de concreto
      for(let i=0;i<10;i++){ctx.fillStyle=rand()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.08)';ctx.fillRect(u+rand()*w,yF+rand()*faceH,1+rand()*2,1);}
      // escorridos de chuva e ferrugem dos olhais
      for(let i=0;i<1+Math.floor(rand()*3);i++){ctx.fillStyle=`rgba(28,26,24,${(.08+rand()*.12).toFixed(2)})`;ctx.fillRect(u+2+rand()*(w-6),yF+2,2+rand()*3,10+rand()*28);}
      ctx.fillStyle='#2a2826';ctx.fillRect(u+5,yF+5,2.5,2.5);ctx.fillRect(u+w-8,yF+5,2.5,2.5);
      if(rand()<.55){const rx=u+5+(rand()<.5?0:w-13);const rg=ctx.createLinearGradient(0,yF+7,0,yF+30);rg.addColorStop(0,'rgba(130,64,28,.5)');rg.addColorStop(1,'rgba(130,64,28,0)');ctx.fillStyle=rg;ctx.fillRect(rx+.5,yF+7,1.5,14+rand()*14);}
      // lascas na quina
      if(rand()<.25){ctx.fillStyle=shade(base,t*1.25);ctx.fillRect(u+rand()*w,yF+faceH-4-rand()*20,2,2);}
      // limo no pé
      if(rand()<.3)for(let i=0;i<6;i++){ctx.fillStyle=`rgba(${60+rand()*20|0},${84+rand()*20|0},${44},.45)`;ctx.fillRect(u+rand()*w,yF+faceH-1-rand()*6,1.5,1.5);}
      // pichação, cartaz, estêncil ou faixa de alerta
      const k=rand();
      if(k<.2){const col=tags[Math.floor(rand()*tags.length)];ctx.lineCap='round';
        const pts=[];for(let i=0;i<5;i++)pts.push([u+3+rand()*(w-4),yF+14+rand()*22]);
        for(const [lw,cc] of [[3,'rgba(10,10,12,.7)'],[1.6,col]]){ctx.strokeStyle=cc;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.quadraticCurveTo(pts[i-1][0]+(rand()-.5)*8,pts[i-1][1]-6,...pts[i]);ctx.stroke();}
        ctx.lineCap='butt';}
      else if(k<.27&&w>18){const px=u+4+rand()*(w-16),py=yF+12+rand()*14;
        ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(px+1,py+1,11,14);ctx.fillStyle=rand()<.5?'#d8d1bd':'#d9c76a';ctx.fillRect(px,py,11,14);
        ctx.fillStyle='#3b3a36';ctx.fillRect(px+2,py+2,7,5);ctx.fillStyle='rgba(60,58,52,.7)';for(let l=py+9;l<py+13;l+=2)ctx.fillRect(px+2,l,7,.8);
        ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.moveTo(px+11,py+14);ctx.lineTo(px+7,py+14);ctx.lineTo(px+11,py+10);ctx.fill();}
      else if(k<.34){ctx.fillStyle='rgba(210,200,180,.55)';ctx.font='bold 5px monospace';ctx.fillText('Q-'+(100+Math.floor(rand()*800)),u+3,yF+faceH-8);}
      else if(k<.4){for(let i=0;i<w;i+=6){ctx.fillStyle='#d9b23a';ctx.beginPath();ctx.moveTo(u+i,yF+faceH-2);ctx.lineTo(u+i+3,yF+faceH-2);ctx.lineTo(u+i+6,yF+faceH-9);ctx.lineTo(u+i+3,yF+faceH-9);ctx.fill();}
        ctx.fillStyle='rgba(20,18,14,.35)';ctx.fillRect(u,yF+faceH-9,w,7);}
      // junta entre placas
      ctx.fillStyle='#24221f';ctx.fillRect(u,y0,1.3,capH+faceH);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(u+1.3,y0,.6,capH+faceH);
    }
    // faixa "ZONA DE QUARENTENA" pintada a cada tanto
    ctx.font='bold 9px monospace';
    for(let u=a+140;u<b-160;u+=620+Math.floor(rand()*200)){
      ctx.fillStyle='rgba(176,38,36,.75)';ctx.fillRect(u,yF+16,150,13);ctx.fillStyle='rgba(235,226,210,.85)';ctx.fillText('ZONA DE QUARENTENA',u+8,yF+26);
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(u+60,yF+16,30,13);
    }
    // ATLAS A9: frases políticas, pixo e lambe-lambes por cima do concreto
    for(let u=a+40;u<b-60;u+=150+Math.floor(rand()*170)){
      const k=rand();
      if(k<.5){const t=PZ_POLITICS[Math.floor(rand()*PZ_POLITICS.length)];
        pzSpray(ctx,u,yF+22+rand()*16,t,{color:PZ_SPRAY_COLORS[Math.floor(rand()*PZ_SPRAY_COLORS.length)],size:9+rand()*6,rot:(rand()-.5)*.12,rand});}
      else if(k<.78)pzPosterCluster(ctx,u,yF+5,40+rand()*30,faceH-12,rand);
      else pzPixo(ctx,u,yF+16,PZ_TAGS[Math.floor(rand()*PZ_TAGS.length)]+' '+PZ_TAGS[Math.floor(rand()*PZ_TAGS.length)],{size:10});
    }
    // sombra de contato no chão
    if(top){const g=ctx.createLinearGradient(0,yF+faceH,0,0);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(a,yF+faceH,b-a,-(yF+faceH));}
    else{const g=ctx.createLinearGradient(0,H,0,y0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.5)');ctx.fillStyle=g;ctx.fillRect(a,H,b-a,y0-H);
      const g2=ctx.createLinearGradient(0,yF+faceH,0,yF+faceH+18);g2.addColorStop(0,'rgba(0,0,0,.45)');g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;ctx.fillRect(a,yF+faceH,b-a,18);}
    this.razorWire(ctx,'h',y0+2,a,b,rand);
  }
  // Concertina (arame laminado em espiral) sobre o muro, com suportes em "Y".
  razorWire(ctx,dir,c,a,b,rand){
    for(let u=a+12;u<b;u+=46){
      ctx.strokeStyle='#26282b';ctx.lineWidth=1.4;ctx.beginPath();
      if(dir==='h'){ctx.moveTo(u,c);ctx.lineTo(u,c-11);ctx.lineTo(u-4,c-15);ctx.moveTo(u,c-11);ctx.lineTo(u+4,c-15);}
      else{ctx.moveTo(c,u);ctx.lineTo(c,u-9);}
      ctx.stroke();
    }
    for(const [col,lw,off] of [['rgba(15,16,18,.6)',1.6,1],['#6f757b',.9,0],['rgba(220,226,232,.55)',.5,-.6]]){
      ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();
      for(let u=a;u<b;u+=5.5){
        const cx=dir==='h'?u+off:c+off,cy=dir==='h'?c-8+off:u-5+off,a0=dir==='h'?Math.PI*.15:Math.PI*.65;
        ctx.moveTo(cx+5.5*Math.cos(a0),cy+(dir==='h'?6:5)*Math.sin(a0));
        ctx.ellipse(cx,cy,5.5,dir==='h'?6:5,0,a0,a0+Math.PI*1.7);
      }
      ctx.stroke();
    }
    // farrapos presos no arame
    for(let u=a+30;u<b;u+=90+rand()*160){ctx.fillStyle=['#5d4a3a','#3d4a5a','#6a2a2a','#c8c2b0'][Math.floor(rand()*4)];
      if(dir==='h')ctx.fillRect(u,c-12+rand()*6,3+rand()*4,2+rand()*3);else ctx.fillRect(c-4+rand()*6,u,2+rand()*3,3+rand()*4);}
  }
  wallPillar(ctx,side,u){
    const H=this.H;
    if(side==='left'){r(ctx,-58,u,30,14,'#8d887f');r(ctx,-58,u,30,3,'#a9a49a');r(ctx,-28,u+2,6,12,'rgba(0,0,0,.4)');return;}
    const y0=side==='top'?-74:H-4;
    r(ctx,u,y0,14,12,'#a9a49a');
    const g=ctx.createLinearGradient(0,y0+12,0,y0+66);g.addColorStop(0,'#8a857c');g.addColorStop(1,'#5d564c');ctx.fillStyle=g;ctx.fillRect(u,y0+12,14,54);
    for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#d9b23a':'#1d1c1a';ctx.fillRect(u,y0+44+i*4,14,4);}
    r(ctx,u+5,y0-4,4,4,'#c93a3a');
  }
  // Torre de refletor: mastro treliçado atrás do muro com dois projetores apontados para dentro.
  floodTower(ctx,side,u,rand){
    const H=this.H;
    let bx,by,gx,gy;
    if(side==='top'){bx=u;by=-128;gx=u;gy=96;}
    else if(side==='bottom'){bx=u;by=H+132;gx=u;gy=H-92;}
    else{bx=-128;by=u;gx=96;gy=u;}
    const Hm=96,hx=bx,hy=by-Hm;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(bx-10,by-3,22,8);
    ctx.fillStyle='#4b4e52';ctx.fillRect(bx-7,by-4,14,6);
    // treliça
    ctx.strokeStyle='#3a3d41';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(bx-5,by-2);ctx.lineTo(bx-2,hy+4);ctx.moveTo(bx+5,by-2);ctx.lineTo(bx+2,hy+4);ctx.stroke();
    ctx.strokeStyle='#5a5e63';ctx.lineWidth=.7;ctx.beginPath();
    for(let k=0;k<9;k++){const y1=by-2-k*(Hm-6)/9,y2=by-2-(k+1)*(Hm-6)/9,w1=5-3*k/9,w2=5-3*(k+1)/9;ctx.moveTo(bx-w1,y1);ctx.lineTo(bx+w2,y2);ctx.moveTo(bx+w1,y1);ctx.lineTo(bx-w2,y2);}
    ctx.stroke();
    // plataforma e projetores
    r(ctx,hx-12,hy,24,4,'#2b2d30');r(ctx,hx-12,hy,24,1,'#6d7176');
    for(const s of [-1,1]){r(ctx,hx+s*7-4,hy-7,8,7,'#1d1f22');r(ctx,hx+s*7-3,hy-2,6,2,'#e8eef4');}
    r(ctx,hx-1,hy+4,2,6,'#d23a3a');
    this.floods.push({x:hx,y:hy-1,gx,gy,R:230,flicker:rand()<.2?4+rand()*3:0,phase:rand()*6});
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
    // A10: ônibus municipal vermelho (cor da Zona Leste) atravessado, teto claro com escotilhas e ar-condicionado
    sh(6,-70,bw,52);r(c,6,-70,bw,52,'#a3231f');r(c,9,-67,bw-6,46,'#d9d6cc');
    for(let x=24;x<bw-20;x+=44){r(c,x,-60,16,12,'#8f8b84');r(c,x+2,-58,12,8,'#6a675f');}
    r(c,9,-67,bw-6,3,'#20262c');r(c,9,-24,bw-6,3,'#20262c');
    r(c,6,-70,6,52,'#c32b25');r(c,bw,-70,6,52,'#c32b25');
    c.fillStyle='rgba(20,18,16,.55)';c.beginPath();c.ellipse(bw*.55,-44,bw*.22,16,0,0,Math.PI*2);c.fill(); // teto queimado
    c.fillStyle='#e8e2d4';c.font='bold 6px Arial';c.fillText('SP TRANSPORTE',16,-30);
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
  shore(y){return 2800+520+70*Math.sin(y/260)+38*Math.sin(y/97+1.3)+22*Math.sin(y/41+.4);}
  // ATLAS A9 · Deméter — praia realista: calçadão de pedra portuguesa em ondas, meio-fio de granito,
  // areia com grão, marcas de vento, linha de maré com algas, areia molhada, mar com degradê de
  // profundidade, cáusticas no raso, molhe de pedras, píer, barcos, quiosques, palmeiras de verdade.
  // Na divisa do mapa: barreiras de concreto tipo "new jersey" com concertina (interdição da orla).
  pzNoiseTile(key,size,fn){
    this._tiles??={};if(this._tiles[key])return this._tiles[key];
    const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),img=x.createImageData(size,size),d=img.data,rnd=mulberry32(size*31+key.length*7);
    for(let i=0;i<size*size;i++){const v=fn(rnd,i%size,Math.floor(i/size));d[i*4]=v[0];d[i*4+1]=v[1];d[i*4+2]=v[2];d[i*4+3]=v[3]??255;}
    x.putImageData(img,0,0);return this._tiles[key]=c;
  }
  // ATLAS A9: avenida beira-mar entre a cidade e o calçadão (fora da área jogável, bloqueada pela barreira).
  paintAvenue(ctx){
    const W=this.W,H=this.H,M=this.M,Y0=-M,Y1=H+M,AV=PZ_BEACH_AV,rand=mulberry32(5150);
    const a0=W+14,a1=W+AV-12,mid=(a0+a1)/2;
    r(ctx,W,Y0,AV,Y1-Y0,'#47423f');                       // calçada estreita / sarjeta
    r(ctx,a0,Y0,a1-a0,Y1-Y0,'#1d1f24');                    // asfalto
    asphaltVariation(ctx,a0,Y0,a1-a0,Y1-Y0,9911);
    r(ctx,a0-3,Y0,3,Y1-Y0,'#6a6562');r(ctx,a1,Y0,4,Y1-Y0,'#77726c');r(ctx,a1+4,Y0,2,Y1-Y0,'#2a2826'); // meio-fio
    // faixa dupla amarela no meio e faixas de bordo brancas
    r(ctx,mid-3,Y0,2,Y1-Y0,'#c9a43a');r(ctx,mid+1,Y0,2,Y1-Y0,'#c9a43a');
    r(ctx,a0+4,Y0,1.5,Y1-Y0,'rgba(220,214,200,.55)');r(ctx,a1-5.5,Y0,1.5,Y1-Y0,'rgba(220,214,200,.55)');
    // cruzamentos com as ruas que descem para a praia: pista contínua + faixas de pedestre
    for(const [y0,y1] of [[401,754],[1777,2053]]){
      r(ctx,W,y0+13,a0-W,y1-y0-26,'#1d1f24');
      for(const yy of [y0-18,y1+4])for(let x=a0+3;x<a1-6;x+=9)r(ctx,x,yy,5,14,'rgba(214,208,196,.7)');
      r(ctx,mid-3,y0,6,y1-y0,'#1d1f24');
    }
    // sujeira, manchas de óleo, bueiros, buracos
    for(let i=0;i<260;i++){const y=Y0+rand()*(Y1-Y0),x=a0+rand()*(a1-a0);ctx.fillStyle=rand()<.5?'rgba(5,6,8,.3)':'rgba(120,110,96,.12)';ctx.beginPath();ctx.ellipse(x,y,3+rand()*9,2+rand()*4,rand()*3,0,Math.PI*2);ctx.fill();}
    for(let y=Y0+90;y<Y1;y+=380){r(ctx,a1-14,y,10,6,'#121316');for(let k=0;k<10;k+=2)r(ctx,a1-14+k,y+1,1,4,'#2e3034');}
    for(let i=0;i<40;i++)crack(ctx,a0+rand()*(a1-a0),Y0+rand()*(Y1-Y0),8+rand()*18,'#0d0f12');
    // carros abandonados e batidos na avenida
    const kinds=['sedan','hatch','pickup','van'],paints=['white','slate','gray','navy','burgundy','yellow','teal','rust'];
    for(let y=Y0+140;y<Y1-80;y+=150+rand()*230){
      if((y>380&&y<770)||(y>1760&&y<2070))continue;
      const lane=rand()<.5?a0+20:a1-20,ang=(lane<mid?Math.PI:0)+(rand()-.5)*(rand()<.25?1.6:.25);
      civilianCar(ctx,lane,y,{kind:kinds[Math.floor(rand()*4)],angle:ang,paint:paints[Math.floor(rand()*paints.length)]});
      if(rand()<.2){ctx.fillStyle='rgba(8,8,10,.5)';ctx.beginPath();ctx.ellipse(lane,y,30,40,0,0,Math.PI*2);ctx.fill();}
    }
    // ônibus atravessado perto de um cruzamento
    ctx.save();ctx.translate(mid,1180);ctx.rotate(.5);r(ctx,-16,-58,40,124,'rgba(0,0,0,.35)');r(ctx,-20,-62,40,124,'#c9c2b0');r(ctx,-20,-62,40,10,'#2f6f9a');for(let k=-46;k<54;k+=14)r(ctx,-18,k,36,8,'#20262c');r(ctx,-20,30,40,30,'rgba(20,16,12,.55)');ctx.restore();
  }
  paintBeach(ctx){
    this.paintAvenue(ctx);
    const AV=PZ_BEACH_AV,S0=this.shore;
    // o resto da praia é pintado deslocado para depois da avenida
    ctx.save();ctx.translate(AV,0);this.shore=y=>S0.call(this,y)-AV;
    try{this.paintBeachBody(ctx);}finally{this.shore=S0;ctx.restore();}
    this.jerseyLine(ctx,this.W+2,-70,this.H+70,mulberry32(4242));
    for(const l of this.lamps)if(l.__beach){l.x+=AV;delete l.__beach;}
  }
  paintBeachBody(ctx){
    const W=this.W,H=this.H,M=this.M,Y0=-M,Y1=H+M;
    const rand=mulberry32(7777);
    const X=W,PROM=112;
    const band=(off,toX,step=8)=>{ctx.beginPath();ctx.moveTo(toX,Y0);for(let y=Y0;y<=Y1+step;y+=step)ctx.lineTo(this.shore(y)+off,y);ctx.lineTo(toX,Y1);ctx.closePath();};
    const blur=v=>{try{ctx.filter=v?`blur(${v}px)`:'none';}catch(e){}};
    // ---------- mar ----------
    r(ctx,X,Y0,M,Y1-Y0,'#0d3450');
    blur(9);
    for(const [off,col] of [[-4,'#86d3c6'],[26,'#5fbdb4'],[70,'#3aa0a8'],[140,'#2a8198'],[240,'#1f6585'],[380,'#175070'],[560,'#11405e'],[760,'#0d3450']]){ctx.fillStyle=col;band(off,X+M+40);ctx.fill();}
    blur(0);
    // ondulação da superfície e reflexos do céu
    const wt=this.pzNoiseTile('agua',128,(r,x,y)=>{const n=r();const s=Math.sin(x*.35+Math.sin(y*.22)*2)*.5+.5;return n<.04?[255,255,255,70]:[8,40,60,Math.round(s*38*r())];});
    ctx.save();band(0,X+M+40);ctx.clip();ctx.globalAlpha=.8;ctx.fillStyle=ctx.createPattern(wt,'repeat');ctx.fillRect(X,Y0,M,Y1-Y0);ctx.globalAlpha=1;
    // cáusticas no raso
    ctx.strokeStyle='rgba(214,252,244,.16)';ctx.lineWidth=1.2;
    for(let i=0;i<1600;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=s+8+rand()*150;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+4,y-3+rand()*6,x+8+rand()*6,y+(rand()-.5)*4);ctx.stroke();}
    // cristas de ondas lá fora
    for(let i=0;i<260;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=s+200+rand()*900;ctx.fillStyle=`rgba(235,248,250,${(.08+rand()*.14).toFixed(2)})`;ctx.fillRect(x,y,10+rand()*30,2);}
    ctx.restore();
    // ---------- areia ----------
    const st=this.pzNoiseTile('areia',160,(r,x,y)=>{const n=r(),b=176+Math.round((r()-.5)*24);return n<.02?[132,108,78]:n<.05?[206,196,176]:[b,Math.round(b*.88),Math.round(b*.7)];});
    ctx.save();ctx.beginPath();ctx.moveTo(X+PROM,Y0);for(let y=Y0;y<=Y1+8;y+=8)ctx.lineTo(this.shore(y)+2,y);ctx.lineTo(X+PROM,Y1);ctx.closePath();ctx.clip();
    ctx.fillStyle=ctx.createPattern(st,'repeat');ctx.fillRect(X,Y0,M,Y1-Y0);
    // areia mais clara e solta junto ao calçadão, mais escura e compacta perto do mar
    let g=ctx.createLinearGradient(X+PROM,0,X+PROM+90,0);g.addColorStop(0,'rgba(255,248,230,.25)');g.addColorStop(1,'rgba(255,248,230,0)');ctx.fillStyle=g;ctx.fillRect(X+PROM,Y0,90,Y1-Y0);
    blur(6);
    ctx.fillStyle='rgba(120,92,58,.18)';band(-150,X+M+40);ctx.fill();
    ctx.fillStyle='rgba(96,74,48,.42)';band(-62,X+M+40);ctx.fill();
    ctx.fillStyle='rgba(70,58,44,.35)';band(-26,X+M+40);ctx.fill();
    blur(0);
    // marcas de vento na areia seca
    ctx.lineWidth=1.4;
    for(let i=0;i<2600;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=X+PROM+10+rand()*Math.max(10,s-X-PROM-170);
      ctx.strokeStyle=rand()<.5?'rgba(140,110,70,.2)':'rgba(255,246,226,.18)';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+3,y+5,x+1,y+11+rand()*6);ctx.stroke();}
    // linha da maré alta: algas, gravetos, conchas
    for(let i=0;i<1500;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y)-96+Math.sin(y/53)*10+(rand()-.5)*14;
      const k=rand();ctx.fillStyle=k<.5?'rgba(52,48,30,.7)':k<.75?'rgba(84,70,44,.7)':k<.9?'rgba(36,60,40,.65)':'#efe6d2';
      ctx.fillRect(s,y,k<.9?2+rand()*5:2,2);}
    // brilho da areia molhada (espelho do céu) e espuma seca
    for(let i=0;i<700;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y)-8-rand()*36;ctx.fillStyle=`rgba(225,240,245,${(.08+rand()*.14).toFixed(2)})`;ctx.fillRect(s,y,6+rand()*16,2);}
    // pegadas (pares) indo e voltando do mar, e marcas de pneu de quadriciclo
    for(let t=0;t<34;t++){let y=Y0+rand()*(Y1-Y0),x=X+PROM+20+rand()*60;const tgt=this.shore(y)-30,dy=(rand()-.5)*.6;
      for(let k=0;x<tgt;k++){x+=9;y+=dy*9+(rand()-.5)*2;ctx.fillStyle='rgba(110,86,56,.38)';ctx.beginPath();ctx.ellipse(x,y+(k%2?3:-3),2.4,1.5,.2,0,Math.PI*2);ctx.fill();}}
    for(let t=0;t<3;t++){const y0=rand()*H;ctx.strokeStyle='rgba(120,92,60,.22)';ctx.lineWidth=3;ctx.setLineDash([2,2]);
      for(const o of [-6,6]){ctx.beginPath();for(let k=0;k<=40;k++){const yy=y0+k*30,xx=X+PROM+120+Math.sin(yy/140+t)*60;k?ctx.lineTo(xx+o,yy):ctx.moveTo(xx+o,yy);}ctx.stroke();}ctx.setLineDash([]);}
    // vegetação de restinga junto ao calçadão
    for(let i=0;i<260;i++){const y=Y0+rand()*(Y1-Y0),x=X+PROM+6+rand()*70;this.grass(ctx,x,y,rand);}
    ctx.restore();
    // ---------- calçadão de pedra portuguesa ----------
    r(ctx,X,Y0,PROM,Y1-Y0,'#c4beb1');
    ctx.save();ctx.beginPath();ctx.rect(X,Y0,PROM,Y1-Y0);ctx.clip();
    ctx.fillStyle='#232323';
    for(let k=0;k<3;k++){const cx=X+22+k*34;ctx.beginPath();
      for(let y=Y0;y<=Y1;y+=4)ctx.lineTo(cx+Math.sin(y/19+k*1.7)*10,y);
      for(let y=Y1;y>=Y0;y-=4)ctx.lineTo(cx+Math.sin(y/19+k*1.7)*10+10,y);
      ctx.closePath();ctx.fill();}
    const pt=this.pzNoiseTile('pedra',64,(r,x,y)=>{const e=((x+Math.floor(r()*2))%5===0)||((y+Math.floor(r()*2))%5===0);return e?[60,56,50,110]:[0,0,0,Math.round(r()*26)];});
    ctx.fillStyle=ctx.createPattern(pt,'repeat');ctx.fillRect(X,Y0,PROM,Y1-Y0);
    // pedras soltas, manchas de sujeira e sangue seco
    for(let i=0;i<500;i++){ctx.fillStyle=rand()<.6?'rgba(40,36,30,.18)':'rgba(255,255,255,.12)';ctx.fillRect(X+rand()*PROM,Y0+rand()*(Y1-Y0),3+rand()*8,2+rand()*5);}
    for(let i=0;i<40;i++){const y=Y0+rand()*(Y1-Y0),x=X+20+rand()*80;ctx.fillStyle='rgba(98,22,20,.22)';ctx.beginPath();ctx.ellipse(x,y,6+rand()*10,3+rand()*5,rand()*3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    // meio-fio de granito entre calçadão e areia
    for(let y=Y0;y<Y1;y+=30){const t=.9+rand()*.2;ctx.fillStyle=`rgb(${Math.round(150*t)},${Math.round(146*t)},${Math.round(138*t)})`;ctx.fillRect(X+PROM-4,y,8,29);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(X+PROM-4,y,2,29);}
    ctx.fillStyle='rgba(60,46,30,.35)';ctx.fillRect(X+PROM+4,Y0,5,Y1-Y0);
    // ---------- barreira da orla na divisa do mapa ----------
    // ---------- objetos ----------
    // postes do calçadão (acendem à noite)
    for(let y=Y0+120;y<Y1-60;y+=260){streetlightPole(ctx,X+8,y);this.lamps.push({__beach:1,x:X+8,y,flicker:rand()<.2?5+rand()*3:0,phase:rand()*6});}
    // bancos de concreto e lixeiras
    for(let y=Y0+250;y<Y1;y+=520){r(ctx,X+70,y+3,16,40,'rgba(0,0,0,.25)');r(ctx,X+66,y,14,40,'#a7a196');r(ctx,X+66,y,14,3,'#c9c3b8');r(ctx,X+68,y+4,2,32,'#8c8679');
      r(ctx,X+40,y+70,9,9,'#2f5d43');r(ctx,X+40,y+70,9,2,'#4c8a65');}
    // quiosques na areia
    for(let y=Y0+420;y<Y1-200;y+=760+rand()*200)this.kiosk(ctx,X+PROM+30,y,rand);
    // molhe de pedras
    this.jetty(ctx,1820,rand);this.jetty(ctx,-760,rand);
    // píeres
    for(const py of [980,2250,-420,3250])this.pier(ctx,X,py,rand);
    // palmeiras (das de trás para as da frente)
    const palms=[];for(let y=Y0+60;y<Y1-40;y+=150+rand()*130)palms.push([X+PROM+40+rand()*110,y]);
    for(const [x,y] of palms)this.palmShadow(ctx,x,y,rand);
    for(const [x,y] of palms)this.palm(ctx,x,y,rand);
    // guarda-sóis, cangas, cadeiras e coisas largadas na fuga
    const cols=['#d9483b','#e8c24a','#3a8fd0','#e8e2d4','#2f9e6e'];
    for(let i=0;i<26;i++){const y=-M+160+i*185+rand()*60,s=this.shore(y);if(y>-60&&y<H+60&&rand()<.2)continue;const x=X+PROM+150+rand()*Math.max(40,s-X-PROM-300);this.umbrella(ctx,x,y,cols[i%cols.length],rand);}
    for(let i=0;i<90;i++){const y=Y0+rand()*(Y1-Y0),s=this.shore(y),x=X+PROM+60+rand()*Math.max(20,s-X-PROM-160),k=rand();
      if(k<.35){ctx.fillStyle=['#e86a5a','#5aa0e8','#f2d35a','#7ad08a'][Math.floor(rand()*4)];ctx.fillRect(x,y,3,5);ctx.fillRect(x+4,y+1,3,5);} // chinelos
      else if(k<.55){r(ctx,x+2,y+2,12,9,'rgba(0,0,0,.2)');r(ctx,x,y,12,9,rand()<.5?'#e8e8e8':'#3a7fd0');r(ctx,x,y,12,2,'#c8c8c8');} // isopor
      else if(k<.7){ctx.fillStyle='rgba(150,30,28,.35)';ctx.beginPath();ctx.ellipse(x,y,5+rand()*8,3+rand()*4,rand()*3,0,Math.PI*2);ctx.fill();}
      else{ctx.fillStyle='#5b4a33';ctx.fillRect(x,y,8+rand()*10,2);}}
    // barcos: alguns na água, alguns encalhados na areia molhada
    for(let i=0;i<12;i++){const y=-M+300+i*420+rand()*100,s=this.shore(y);const inWater=rand()<.65;this.boat(ctx,inWater?s+40+rand()*260:s-40-rand()*30,y,rand,inWater);}
    // posto de salvamento
    this.tower(ctx,X+PROM+190,1380);this.tower(ctx,X+PROM+170,2600);this.tower(ctx,X+PROM+180,160);
    // tom geral mais sujo/encoberto para casar com a cidade
    ctx.fillStyle='rgba(22,26,32,.16)';ctx.fillRect(X,Y0,M,Y1-Y0);
  }
  jerseyLine(ctx,x,y0,y1,rand){
    for(let y=y0;y<y1;y+=31){const h=Math.min(30,y1-y);
      r(ctx,x+3,y+3,16,h,'rgba(0,0,0,.35)');
      const g=ctx.createLinearGradient(x,0,x+16,0);g.addColorStop(0,'#77736c');g.addColorStop(.45,'#b8b3a9');g.addColorStop(1,'#6b675f');ctx.fillStyle=g;ctx.fillRect(x,y,16,h);
      if(rand()<.5){for(let k=0;k<h;k+=10){ctx.fillStyle=(k/10)%2?'#e9e5da':'#c23a34';ctx.fillRect(x+4,y+k,8,Math.min(10,h-k));}}
      for(let i=0;i<4;i++){ctx.fillStyle='rgba(30,28,24,.2)';ctx.fillRect(x+rand()*14,y+rand()*h,2,2+rand()*5);}
      ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(x,y+h,16,1);
    }
    this.razorWire(ctx,'v',x+8,y0,y1,rand);
    // placas de interdição presas na barreira
    ctx.font='bold 6px monospace';
    for(let y=y0+180;y<y1-40;y+=520){r(ctx,x+18,y,30,16,'rgba(0,0,0,.3)');r(ctx,x+16,y-2,30,16,'#e9e2cf');r(ctx,x+16,y-2,30,4,'#c23a34');ctx.fillStyle='#2a2522';ctx.fillText('PRAIA',x+19,y+7);ctx.fillText('FECHADA',x+17,y+12);}
  }
  lamp(ctx,x,y){streetlightPole(ctx,x,y);}
  grass(ctx,x,y,rand){for(let i=0;i<7;i++){ctx.strokeStyle=['#6b8a48','#86a45a','#4f6a36','#9a9a5a'][Math.floor(rand()*4)];ctx.lineWidth=1.2;const bx=x+(rand()-.5)*20,by=y+(rand()-.5)*12;ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+(rand()-.5)*6,by-5,bx+(rand()-.5)*8,by-8-rand()*6);ctx.stroke();}}
  palmShadow(ctx,x,y,rand){
    ctx.save();ctx.fillStyle='rgba(70,50,28,.22)';ctx.translate(x+30,y+6);ctx.scale(1,.55);
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;ctx.beginPath();ctx.ellipse(Math.cos(a)*20,Math.sin(a)*20,22,5,a,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    ctx.strokeStyle='rgba(70,50,28,.22)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+30,y+6);ctx.stroke();
  }
  palm(ctx,x,y,rand){
    const lean=(rand()-.5)*34,Hh=56+rand()*34,cx=x+lean,cy=y-Hh;
    // tronco curvo com anéis
    const N=14;for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N;
      const px=(t)=>x+lean*t*t,py=(t)=>y-Hh*t,wd=5.5-2.2*t0;
      ctx.fillStyle=i%2?'#7b5a3b':'#8d6b47';ctx.beginPath();ctx.moveTo(px(t0)-wd,py(t0));ctx.lineTo(px(t0)+wd,py(t0));ctx.lineTo(px(t1)+wd-.3,py(t1));ctx.lineTo(px(t1)-wd+.3,py(t1));ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(40,26,14,.45)';ctx.fillRect(px(t0)-wd,py(t0)-1,wd*2,1.2);
      ctx.fillStyle='rgba(255,230,190,.18)';ctx.fillRect(px(t0)-wd,py(t1),1.6,py(t0)-py(t1));}
    // folhas: primeiro as de trás, depois as da frente
    const n=10+Math.floor(rand()*3),fr=[];
    for(let i=0;i<n;i++)fr.push({a:i/n*Math.PI*2+rand()*.3,L:30+rand()*16,droop:8+rand()*12,dry:rand()<.12});
    fr.sort((p,q)=>Math.sin(p.a)-Math.sin(q.a));
    for(const f of fr){
      const ex=cx+Math.cos(f.a)*f.L,ey=cy+Math.sin(f.a)*f.L*.62+f.droop*(f.dry?2:1),mx=cx+Math.cos(f.a)*f.L*.5,my=cy+Math.sin(f.a)*f.L*.3-6;
      const front=Math.sin(f.a)>0,dark=f.dry?'#6d5a32':front?'#2f6a34':'#24522a',light=f.dry?'#9a8148':front?'#5ea14e':'#3f7d3c';
      const P=(t)=>[(1-t)*(1-t)*cx+2*(1-t)*t*mx+t*t*ex,(1-t)*(1-t)*cy+2*(1-t)*t*my+t*t*ey];
      // folíolos
      for(let t=.12;t<=1;t+=.07){const [px,py]=P(t),[qx,qy]=P(Math.min(1,t+.05)),ang=Math.atan2(qy-py,qx-px),len=(1-t)*8+3;
        for(const sd of[-1,1]){const aa=ang+sd*1.05;ctx.strokeStyle=sd>0?dark:light;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(aa)*len-Math.cos(ang)*2,py+Math.sin(aa)*len+2.5);ctx.stroke();}}
      ctx.strokeStyle=f.dry?'#7a6438':'#3c5a2c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
    }
    for(let i=0;i<3;i++){ctx.fillStyle=i?'#5b4426':'#6e5530';ctx.beginPath();ctx.arc(cx-3+i*3,cy+3+(i%2),2.6,0,Math.PI*2);ctx.fill();}
  }
  umbrella(ctx,x,y,col,rand){
    ctx.save();ctx.translate(x,y);
    // canga e cadeiras embaixo
    const towel=['#c84a8a','#3a8fd0','#e8a03a','#2f9e6e'][Math.floor(rand()*4)];
    ctx.save();ctx.rotate((rand()-.5)*.6);r(ctx,-14,6,26,40,towel);for(let k=0;k<40;k+=6)r(ctx,-14,6+k,26,2,'rgba(255,255,255,.35)');ctx.restore();
    for(const sx of [-36,28]){if(rand()<.3)continue;ctx.save();ctx.translate(sx,30);ctx.rotate((rand()-.5)*.5+(rand()<.15?1.4:0));r(ctx,2,2,14,30,'rgba(0,0,0,.2)');r(ctx,0,0,14,30,'#ece7da');for(let k=2;k<30;k+=4)r(ctx,1,k,12,1.5,col);r(ctx,0,0,14,8,'#d8d2c4');ctx.restore();}
    // sombra no chão
    ctx.fillStyle='rgba(60,42,22,.28)';ctx.beginPath();ctx.ellipse(-16,30,30,16,0,0,Math.PI*2);ctx.fill();
    // haste e lona com gomos
    r(ctx,-1,0,2,26,'#5a5550');
    ctx.translate(0,-2);
    for(let i=0;i<8;i++){const a0=i/8*Math.PI*2,a1=(i+1)/8*Math.PI*2;const g=ctx.createRadialGradient(-8,-8,2,0,0,32);const c=i%2?'#f2eee2':col;g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,.25)');
      ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,30,a0,a1);ctx.closePath();ctx.fill();ctx.fillStyle=g;ctx.globalAlpha=.4;ctx.fill();ctx.globalAlpha=1;}
    ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*30,Math.sin(a)*30);ctx.stroke();}
    ctx.fillStyle='#3a3530';ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  boat(ctx,x,y,rand,inWater=true){
    ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/2+(rand()-.5)*.9+(inWater?0:Math.PI*(rand()<.5?0:1)));
    const L=70+rand()*30,Wd=22+rand()*6,hull=['#e8e2d4','#2f6f9a','#c8462f','#e9c547','#3f7f58'][Math.floor(rand()*5)];
    const shape=(s)=>{ctx.beginPath();ctx.moveTo(-L/2*s,-Wd/2*s);ctx.lineTo(L*.22*s,-Wd/2*s);ctx.quadraticCurveTo(L/2*s,-Wd*.35*s,L/2*s+4,0);ctx.quadraticCurveTo(L/2*s,Wd*.35*s,L*.22*s,Wd/2*s);ctx.lineTo(-L/2*s,Wd/2*s);ctx.closePath();};
    if(inWater){ctx.fillStyle='rgba(4,24,40,.35)';ctx.save();ctx.translate(6,8);shape(1.04);ctx.fill();ctx.restore();
      ctx.strokeStyle='rgba(240,250,250,.5)';ctx.lineWidth=2.5;shape(1.08);ctx.stroke();}
    else{ctx.fillStyle='rgba(60,42,22,.3)';ctx.save();ctx.translate(5,6);shape(1);ctx.fill();ctx.restore();}
    ctx.fillStyle=hull;shape(1);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-L/2,Wd/2-4,L*.7,4);
    ctx.fillStyle='#8a6440';shape(.82);ctx.fill();
    ctx.fillStyle='#6a4a2e';for(const bx of[-L*.25,0,L*.2])ctx.fillRect(bx-3,-Wd*.4,6,Wd*.8);
    ctx.fillStyle='rgba(30,40,40,.35)';ctx.fillRect(-L*.4,-Wd*.3,L*.3,Wd*.6); // água da chuva no fundo
    r(ctx,-L/2-9,-4,9,8,'#2a2d31');r(ctx,-L/2-12,-2,4,4,'#15171a'); // motor de popa
    ctx.restore();
  }
  kiosk(ctx,x,y,rand){
    r(ctx,x+10,y+12,62,60,'rgba(60,42,22,.3)');
    r(ctx,x+6,y+42,50,24,'#6b5a48');r(ctx,x+8,y+44,46,6,'#2b2622');
    // telhado de telha em quatro águas
    const s=58;ctx.save();ctx.translate(x,y);
    const tri=(a,b,c,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.lineTo(...c);ctx.closePath();ctx.fill();};
    tri([0,0],[s,0],[s/2,s/2-6],'#b4583a');tri([s,0],[s,s-8],[s/2,s/2-6],'#9a4a30');tri([0,s-8],[s,s-8],[s/2,s/2-6],'#c86844');tri([0,0],[0,s-8],[s/2,s/2-6],'#a8533a');
    ctx.strokeStyle='rgba(60,24,14,.35)';ctx.lineWidth=1;for(let k=4;k<s/2;k+=4){ctx.beginPath();ctx.rect(k,k,s-2*k,s-8-2*k);ctx.stroke();}
    ctx.fillStyle='#e9e2cf';ctx.fillRect(4,s-6,s-8,8);ctx.fillStyle='#2a6a8a';ctx.font='bold 6px monospace';ctx.fillText(rand()<.5?'COCO GELADO':'QUIOSQUE 7',7,s);
    ctx.restore();
  }
  jetty(ctx,y,rand){
    const s=this.shore(y);
    for(let i=0;i<150;i++){const t=rand(),x=s-30+t*430,yy=y+(rand()-.5)*(46-t*10),rr=7+rand()*9;
      ctx.fillStyle='rgba(8,30,44,.45)';ctx.beginPath();ctx.ellipse(x+4,yy+5,rr,rr*.8,0,0,Math.PI*2);ctx.fill();
      const g=ctx.createRadialGradient(x-rr*.4,yy-rr*.4,1,x,yy,rr);g.addColorStop(0,'#9a958c');g.addColorStop(.6,'#6a665f');g.addColorStop(1,'#3e3b37');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,yy,rr,rr*.8,rand()*3,0,Math.PI*2);ctx.fill();
      if(rand()<.3){ctx.fillStyle='rgba(40,70,40,.5)';ctx.fillRect(x-rr*.5,yy+rr*.2,rr,2);}}
    ctx.strokeStyle='rgba(240,250,250,.55)';ctx.lineWidth=2;
    for(const sd of[-1,1]){ctx.beginPath();for(let k=0;k<=30;k++){const x=s+40+k*13,yy=y+sd*(28-k*.2)+Math.sin(k*1.7)*3;k?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();}
  }
  tower(ctx,x,y){
    r(ctx,x+14,y+16,58,52,'rgba(60,42,22,.3)');
    for(const [px,py] of [[4,40],[46,40],[4,58],[46,58]])r(ctx,x+px,y+py,4,14,'#6b6f73');
    r(ctx,x,y+12,54,40,'#e9e5da');r(ctx,x,y+12,54,6,'#c23a34');r(ctx,x+6,y+22,42,18,'#3a6f9a');r(ctx,x+8,y+24,38,3,'rgba(255,255,255,.35)');
    r(ctx,x-3,y,60,14,'#c23a34');r(ctx,x-3,y,60,3,'#e05a50');r(ctx,x+20,y+3,14,8,'#e9e5da');r(ctx,x+25,y+4,4,6,'#c23a34');r(ctx,x+23,y+6,8,2,'#c23a34');
    for(let k=0;k<5;k++)r(ctx,x+24,y+52+k*4,8,2,'#8a8e92'); // escada
  }
  pier(ctx,X,y,rand){
    const len=640,w=56,x0=X+112;
    r(ctx,x0+10,y+14,len,w,'rgba(4,24,40,.38)');
    for(let x=0;x<len;x+=44){for(const yy of[-4,w-4]){ctx.fillStyle='#2a1d12';ctx.beginPath();ctx.arc(x0+x+5,y+yy+4,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(240,250,250,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x0+x+5,y+yy+6,7,0,Math.PI);ctx.stroke();}}
    for(let x=0;x<len;x+=6){const t=.85+rand()*.25;ctx.fillStyle=`rgb(${Math.round(132*t)},${Math.round(94*t)},${Math.round(60*t)})`;ctx.fillRect(x0+x,y,5.4,w);
      if(rand()<.05){ctx.fillStyle='#14100c';ctx.fillRect(x0+x,y+rand()*w,5.4,6+rand()*10);} // tábua faltando
      ctx.fillStyle='rgba(30,20,12,.5)';ctx.fillRect(x0+x+1,y+6,1,1);ctx.fillRect(x0+x+1,y+w-7,1,1);}
    r(ctx,x0,y-3,len,4,'#5a3f27');r(ctx,x0,y+w-1,len,4,'#5a3f27');
    for(let x=0;x<len;x+=22){r(ctx,x0+x,y-6,3,6,'#4a3420');r(ctx,x0+x,y+w-1,3,6,'#4a3420');}
    r(ctx,x0+len,y-4,10,w+8,'#3b2616');
    this.boat(ctx,x0+len-110,y+w+26,rand,true);
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
    // ATLAS A9: arrebentação — lâmina d'água que sobe e desce na areia, espuma rendada e brilhos.
    if(x1>W){
      const ya=Math.max(y0,-WB_M),yb=Math.min(y1,H+WB_M),Y=[];
      for(let y=Math.floor(ya/12)*12;y<=yb+12;y+=12)Y.push(y);
      const swash=(y)=>Math.sin(t*.55+y*.004)*16+Math.sin(t*.9+y*.013)*5;
      // lâmina fina (água rasa avançando sobre a areia)
      ctx.fillStyle='rgba(150,214,214,.32)';ctx.beginPath();
      Y.forEach((y,i)=>{const x=this.shore(y)-18-swash(y);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
      for(let i=Y.length-1;i>=0;i--)ctx.lineTo(this.shore(Y[i])+6,Y[i]);
      ctx.closePath();ctx.fill();
      // espuma: borda da lâmina + duas linhas de onda chegando, tracejadas para parecer renda
      for(let k=0;k<4;k++){
        ctx.strokeStyle=`rgba(246,252,252,${(.85-k*.18).toFixed(2)})`;ctx.lineWidth=k?2.4-k*.4:3;
        ctx.setLineDash(k?[10+k*4,4+k*3,3,5]:[]);ctx.lineDashOffset=-t*(6+k*3);
        ctx.beginPath();
        Y.forEach((y,i)=>{const x=k===0?this.shore(y)-18-swash(y):this.shore(y)+k*30-((t*14+k*20+y*.02)%40)+Math.sin(t*.7+y*.02+k)*5;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,255,255,.6)';
      for(let i=0;i<70;i++){
        const gy=ya+((i*977)%1000)/1000*(yb-ya),gx=this.shore(gy)+60+((i*613)%1000)/1000*700;
        if(Math.sin(t*1.6+i*2.1)>.8)ctx.fillRect(Math.round(gx/2)*2,Math.round(gy/2)*2,5,2);
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
    pzSPGround(ctx,{x:0,y:0,w:1152,h:1152,id:'center'}); // A10: rua de São Paulo
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
    pzSPGround(ctx,zone); // A10: rua de São Paulo
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

