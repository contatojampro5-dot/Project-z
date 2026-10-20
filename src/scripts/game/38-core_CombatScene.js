// -- src/core/CombatScene.js --




















// Independent targeting system: choose a target for the NEXT shot only.
// Bullets already in flight keep their vx/vy and never home toward targets.
const ANTONIO_LINES = Object.freeze([{"id":1,"text":"Meu Deus... que desgraça é essa?","category":"primeiro-contato","priority":80,"once":true,"voice":"voices/antonio/antonio_001.wav"},{"id":2,"text":"Tá, tá... ninguém entra em pânico.","category":"primeiro-contato","priority":51,"once":true,"voice":"voices/antonio/antonio_002.wav"},{"id":3,"text":"AI! Você me mordeu, desgraçado!","category":"primeiro-contato","priority":94,"once":true,"voice":"voices/antonio/antonio_003.wav"},{"id":4,"text":"Tá... acho que ele não levanta mais.","category":"primeiro-contato","priority":51,"once":true,"voice":"voices/antonio/antonio_004.wav"},{"id":5,"text":"Gente, precisa vir todo mundo?","category":"primeiro-contato","priority":51,"once":true,"voice":"voices/antonio/antonio_005.wav"},{"id":6,"text":"Tá bom... acho que eu consigo fazer isso.","category":"primeiro-contato","priority":51,"once":true,"voice":"voices/antonio/antonio_006.wav"},{"id":7,"text":"Ah, pronto. Chamaram a família inteira.","category":"horda","priority":63,"once":false,"voice":"voices/antonio/antonio_007.wav"},{"id":8,"text":"Meu Deus! De onde tá saindo tanta gente?","category":"horda","priority":63,"once":false,"voice":"voices/antonio/antonio_008.wav"},{"id":9,"text":"Tá de brincadeira comigo, né?!","category":"horda","priority":92,"once":false,"voice":"voices/antonio/antonio_009.wav"},{"id":10,"text":"Não, não! Eu não devia ter entrado aqui!","category":"horda","priority":95,"once":false,"voice":"voices/antonio/antonio_010.wav"},{"id":11,"text":"Tem gente atrás também?! Ah, não!","category":"horda","priority":91,"once":false,"voice":"voices/antonio/antonio_011.wav"},{"id":12,"text":"Rapaz... eu tô muito ferrado.","category":"horda","priority":80,"once":false,"voice":"voices/antonio/antonio_012.wav"},{"id":13,"text":"Eu não sei como, mas eu tô vivo!","category":"horda","priority":75,"once":false,"voice":"voices/antonio/antonio_013.wav"},{"id":14,"text":"Isso! Vem um de cada vez... UM DE CADA VEZ!","category":"horda","priority":72,"once":false,"voice":"voices/antonio/antonio_014.wav"},{"id":15,"text":"Acabou? ...Acabou mesmo?","category":"horda","priority":51,"once":true,"voice":"voices/antonio/antonio_015.wav"},{"id":16,"text":"Eu devia ter ficado quieto.","category":"horda","priority":51,"once":false,"voice":"voices/antonio/antonio_016.wav"},{"id":17,"text":"Você tem cara de Johnny. Pronto, é Johnny.","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_017.wav"},{"id":18,"text":"Ô, Johnny! Fala pro pessoal fazer uma fila!","category":"apelidos","priority":51,"once":false,"voice":"voices/antonio/antonio_018.wav"},{"id":19,"text":"Ih, o Juninho é atleta! Corre, desgraçado!","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_019.wav"},{"id":20,"text":"Juninho, pelo amor de Deus! Você de novo?","category":"apelidos","priority":51,"once":false,"voice":"voices/antonio/antonio_020.wav"},{"id":21,"text":"Por que esse aí tá inchado? ...Vou chamar de Pipoca.","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_021.wav"},{"id":22,"text":"SAI! O Pipoca vai estourar!","category":"apelidos","priority":98,"once":false,"voice":"voices/antonio/antonio_022.wav"},{"id":23,"text":"CÊ TÁ CUSPINDO EM MIM?! Ah, não, Cuspinho!","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_023.wav"},{"id":24,"text":"Ô, Cuspinho! Aprende a ter educação!","category":"apelidos","priority":51,"once":false,"voice":"voices/antonio/antonio_024.wav"},{"id":25,"text":"Meu amigo... olha o tamanho desse Armário!","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_025.wav"},{"id":26,"text":"Mas esse Armário não cai nunca?!","category":"apelidos","priority":51,"once":false,"voice":"voices/antonio/antonio_026.wav"},{"id":27,"text":"É impressão minha ou esse cara tá chamando os vizinhos?","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_027.wav"},{"id":28,"text":"Ah, pronto. O Síndico chamou o condomínio inteiro!","category":"apelidos","priority":51,"once":false,"voice":"voices/antonio/antonio_028.wav"},{"id":29,"text":"Não. Não, não, não. Isso é uma Geladeira andando!","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_029.wav"},{"id":30,"text":"GELADEIRA, FICA LONGE DE MIM!","category":"apelidos","priority":93,"once":false,"voice":"voices/antonio/antonio_030.wav"},{"id":31,"text":"Meu Deus... isso aí é um Condomínio de zumbi!","category":"apelidos","priority":80,"once":true,"voice":"voices/antonio/antonio_031.wav"},{"id":32,"text":"PARA DE CHAMAR GENTE, CONDOMÍNIO!","category":"apelidos","priority":93,"once":false,"voice":"voices/antonio/antonio_032.wav"},{"id":33,"text":"Rapaz, eu tô ficando bom nisso!","category":"combate","priority":51,"once":true,"voice":"voices/antonio/antonio_033.wav"},{"id":34,"text":"Olha isso! Eu tô imparável!","category":"combate","priority":51,"once":true,"voice":"voices/antonio/antonio_034.wav"},{"id":35,"text":"Você não cansa de apanhar, não?","category":"combate","priority":51,"once":false,"voice":"voices/antonio/antonio_035.wav"},{"id":36,"text":"RAPAZ! Essa foi bonita!","category":"combate","priority":51,"once":true,"voice":"voices/antonio/antonio_036.wav"},{"id":37,"text":"Toma essa lembrancinha!","category":"combate","priority":51,"once":false,"voice":"voices/antonio/antonio_037.wav"},{"id":38,"text":"Morreu? ...Morreu mesmo?! Graças a Deus!","category":"combate","priority":85,"once":true,"voice":"voices/antonio/antonio_038.wav"},{"id":39,"text":"Pronto. Agora me deixa em paz.","category":"combate","priority":51,"once":true,"voice":"voices/antonio/antonio_039.wav"},{"id":40,"text":"Opa... agora sim ficou interessante.","category":"combate","priority":51,"once":true,"voice":"voices/antonio/antonio_040.wav"},{"id":41,"text":"Ah, não. Logo agora?","category":"recursos","priority":66,"once":false,"voice":"voices/antonio/antonio_041.wav"},{"id":42,"text":"Alguém tem uma bala sobrando aí?!","category":"recursos","priority":89,"once":false,"voice":"voices/antonio/antonio_042.wav"},{"id":43,"text":"Calma, calma! Deixa eu recarregar!","category":"recursos","priority":78,"once":false,"voice":"voices/antonio/antonio_043.wav"},{"id":44,"text":"Não, não, não... ainda não!","category":"recursos","priority":96,"once":false,"voice":"voices/antonio/antonio_044.wav"},{"id":45,"text":"AI! Caramba... essa quase me matou!","category":"recursos","priority":97,"once":false,"voice":"voices/antonio/antonio_045.wav"},{"id":46,"text":"Nossa... eu precisava disso.","category":"recursos","priority":68,"once":false,"voice":"voices/antonio/antonio_046.wav"},{"id":47,"text":"Munição! Finalmente!","category":"recursos","priority":51,"once":false,"voice":"voices/antonio/antonio_047.wav"},{"id":48,"text":"Opa! Essa aqui eu vou guardar.","category":"recursos","priority":51,"once":true,"voice":"voices/antonio/antonio_048.wav"},{"id":49,"text":"Ah, não... tem mais?!","category":"ondas","priority":72,"once":false,"voice":"voices/antonio/antonio_049.wav"},{"id":50,"text":"Isso aqui não vai acabar nunca?","category":"ondas","priority":63,"once":true,"voice":"voices/antonio/antonio_050.wav"},{"id":51,"text":"QUE TAMANHO É ESSE?!","category":"ondas","priority":100,"once":false,"voice":"voices/antonio/antonio_051.wav"},{"id":52,"text":"ISSO! Tá sentindo agora, né?","category":"ondas","priority":75,"once":true,"voice":"voices/antonio/antonio_052.wav"},{"id":53,"text":"Eu já perdi a conta de quantos eu matei.","category":"ondas","priority":63,"once":true,"voice":"voices/antonio/antonio_053.wav"},{"id":54,"text":"Tá quieto demais... eu não gosto disso.","category":"ondas","priority":51,"once":false,"voice":"voices/antonio/antonio_054.wav"},{"id":55,"text":"Até a Zona Leste tá assim... meu Deus.","category":"cidade","priority":51,"once":true,"voice":"voices/antonio/antonio_055.wav"},{"id":56,"text":"Não tem ninguém trabalhando aqui hoje, né?","category":"cidade","priority":51,"once":true,"voice":"voices/antonio/antonio_056.wav"},{"id":57,"text":"Eu preferia estar preso no trânsito da Radial agora.","category":"cidade","priority":51,"once":true,"voice":"voices/antonio/antonio_057.wav"},{"id":58,"text":"Nem pra ter uma padaria aberta, cara...","category":"cidade","priority":51,"once":true,"voice":"voices/antonio/antonio_058.wav"},{"id":59,"text":"Eu tô conversando com zumbi... acho que tô ficando maluco.","category":"reflexao","priority":51,"once":true,"voice":"voices/antonio/antonio_059.wav"},{"id":60,"text":"O pior é que eu já tô reconhecendo alguns.","category":"reflexao","priority":51,"once":true,"voice":"voices/antonio/antonio_060.wav"},{"id":61,"text":"Rapaz... olha esse carro. Antes eu só via um desses na internet.","category":"veiculos","priority":38,"once":true,"voice":"voices/antonio/antonio_061.wav"},{"id":62,"text":"Ô, essa caminhonete aqui é bonita, hein? Dá até vontade de levar pra casa.","category":"veiculos","priority":38,"once":true,"voice":"voices/antonio/antonio_062.wav"},{"id":63,"text":"Pelo menos o apocalipse trouxe uma vantagem: agora eu posso escolher o carro que eu quiser.","category":"veiculos","priority":38,"once":true,"voice":"voices/antonio/antonio_063.wav"},{"id":64,"text":"É... só falta achar a chave. E um posto funcionando.","category":"veiculos","priority":38,"once":true,"voice":"voices/antonio/antonio_064.wav"},{"id":65,"text":"Ai, caramba! Calma aí, que esse carro não é meu!","category":"veiculos","priority":38,"once":false,"voice":"voices/antonio/antonio_065.wav"},{"id":66,"text":"Nossa... esse aí não tem nem mais o que roubar.","category":"veiculos","priority":38,"once":true,"voice":"voices/antonio/antonio_066.wav"},{"id":67,"text":"Quando essa bagunça acabar, eu vou dar um rolê nesse aqui. Se ainda tiver gasolina.","category":"veiculos","priority":38,"once":true,"voice":"voices/antonio/antonio_067.wav"},{"id":68,"text":"Será que se eu pegar uns cem mil aqui ainda dá pra comprar uma casa?","category":"comercio","priority":38,"once":true,"voice":"voices/antonio/antonio_068.wav"},{"id":69,"text":"Engraçado... tanto dinheiro guardado e agora não serve pra comprar nem um pão.","category":"comercio","priority":38,"once":true,"voice":"voices/antonio/antonio_069.wav"},{"id":70,"text":"Será que ainda tão cobrando minhas parcelas?","category":"comercio","priority":38,"once":true,"voice":"voices/antonio/antonio_070.wav"},{"id":71,"text":"Pô, se tivesse um salgadinho e uma Coca gelada agora...","category":"comercio","priority":38,"once":true,"voice":"voices/antonio/antonio_071.wav"},{"id":72,"text":"Se eu soubesse que ia acabar o mundo, tinha comprado tudo no crédito.","category":"comercio","priority":38,"once":true,"voice":"voices/antonio/antonio_072.wav"},{"id":73,"text":"Cara... cadê todo mundo? Não é possível que só tenha sobrado eu.","category":"reflexao","priority":38,"once":true,"voice":"voices/antonio/antonio_073.wav"},{"id":74,"text":"Como é que isso aconteceu tão rápido? Ontem tava tudo normal...","category":"reflexao","priority":38,"once":true,"voice":"voices/antonio/antonio_074.wav"},{"id":75,"text":"Olha isso... os carros ficaram. Mas pra onde foram as pessoas?","category":"reflexao","priority":38,"once":true,"voice":"voices/antonio/antonio_075.wav"},{"id":76,"text":"Será que tem alguém procurando por mim? ...Será que ainda tem alguém?","category":"reflexao","priority":38,"once":true,"voice":"voices/antonio/antonio_076.wav"},{"id":77,"text":"Eu nem sei mais por que eu tô correndo. Só sei que não posso parar.","category":"reflexao","priority":38,"once":true,"voice":"voices/antonio/antonio_077.wav"},{"id":78,"text":"Incrível. Acabou o mundo e ainda tem trânsito em São Paulo.","category":"cidade","priority":38,"once":true,"voice":"voices/antonio/antonio_078.wav"},{"id":79,"text":"Cadê a polícia quando a gente precisa? ...Ah. Tá aqui.","category":"cidade","priority":38,"once":true,"voice":"voices/antonio/antonio_079.wav"},{"id":80,"text":"Ô, ambulância! Faz um favor, me atende rapidinho!","category":"cidade","priority":38,"once":true,"voice":"voices/antonio/antonio_080.wav"}]);

// G.3.0.8 — Silent caption director. Tracks are reserved but intentionally not played
// until real voice assets exist, so a caption never triggers unrelated audio.
class DialogueDirector {
  constructor(){
    this.catalog=ANTONIO_LINES;
    this.active=null;
    this.clock=0;
    this.lastFinished=-17;
    this.lastById=new Map();
    this.spoken=new Set();
    this.pending=[];
    this.followup=null;
    this.displaySerial=0;
  }
  line(id){return this.catalog[id-1];}
  request(id,{urgent=false,delay=0}={}){
    const line=this.line(id);
    if(!line || (line.once&&this.spoken.has(id)))return false;
    const last=this.lastById.get(id);
    if(last!=null && this.clock-last< (line.once?99999:80))return false;
    if(this.active?.id===id || this.pending.some(v=>v.id===id))return false;
    const item={id,priority:line.priority,created:this.clock,due:this.clock+delay,urgent};
    if(urgent && this.active && this.active.priority+23 < item.priority && this.clock-this.active.started>1.0){
      // Only truly dangerous events may replace a lower-priority ambient comment.
      this.active=null;this.lastFinished=this.clock-3;
    }
    this.pending.push(item);
    this.pending.sort((a,b)=>b.priority-a.priority||a.created-b.created);
    if(this.pending.length>7)this.pending.length=7;
    return true;
  }
  follow(first,second){if(this.request(first))this.followup={after:first,next:second,expires:this.clock+28};}
  update(dt,{blocked=false}={}){
    if(blocked||dt<=0)return;
    this.clock+=dt;
    if(this.active && this.clock>=this.active.until){
      this.lastFinished=this.clock;
      const justEnded=this.active.id;
      this.active=null;
      if(this.followup?.after===justEnded){
        const pair=this.followup;this.followup=null;
        if(this.clock<pair.expires)this.request(pair.next,{delay:1.8});
      }
    }
    this.pending=this.pending.filter(v=>this.clock-v.created<19);
    if(this.active || !this.pending.length)return;
    const idx=this.pending.findIndex(v=>v.due<=this.clock && (v.urgent?this.clock-this.lastFinished>=2.1:this.clock-this.lastFinished>=10.5));
    if(idx<0)return;
    const item=this.pending.splice(idx,1)[0];
    const line=this.line(item.id);
    if(line.once && this.spoken.has(line.id))return;
    const duration=Math.max(2.45,Math.min(5.5,1.1+line.text.length/18));
    this.active={...line,started:this.clock,until:this.clock+duration};
    this.spoken.add(line.id);
    this.lastById.set(line.id,this.clock);
    this.displaySerial++;
  }
  hide(){this.active=null;this.pending=[];this.followup=null;}
}

class AutoFireTargeting {
  static acquire(run,camera) {
    if(!run||run.over||!run.player.alive)return null;
    const player=run.player;
    const maxRange=Math.max(0,run.gun.config.range-24);
    const maxRange2=maxRange*maxRange;
    let closest=null,bestDist2=Infinity;
    for(const enemy of run.enemies){
      if(!enemy.alive||enemy.hp<=0)continue;
      const dx=enemy.x-player.x,dy=enemy.y-player.y;
      const dist2=dx*dx+dy*dy;
      if(dist2<1||dist2>maxRange2||dist2>=bestDist2)continue;
      // Avoid firing blindly into enemies behind solid structures.
      if(segmentHitsWall(player.x,player.y,enemy.x,enemy.y,3))continue;
      const at=camera.worldToScreen(enemy.x,enemy.y);
      if(at.x < -40||at.y < -40||at.x>camera.viewport.width+40||at.y>camera.viewport.height+40)continue;
      closest=enemy;bestDist2=dist2;
    }
    if(!closest)return null;
    const dx=closest.x-player.x,dy=closest.y-player.y;
    const distance=Math.sqrt(bestDist2);
    const speed=Math.max(1,run.gun.config.speed);
    // Predict target's position at impact; capped so erratic changes do not overlead.
    let travel=Math.min(.38,distance/speed);
    let leadX=(closest._autoVX||0)*travel;
    let leadY=(closest._autoVY||0)*travel;
    const leadSize=Math.hypot(leadX,leadY);
    if(leadSize>76){leadX*=76/leadSize;leadY*=76/leadSize;}
    const aimX=closest.x+leadX,aimY=closest.y+leadY;
    const blocked=segmentHitsWall(player.x,player.y,aimX,aimY,3);
    const actualX=blocked?dx:aimX-player.x;
    const actualY=blocked?dy:aimY-player.y;
    const length=Math.hypot(actualX,actualY)||1;
    return {target:closest,aim:{x:actualX/length,y:actualY/length,active:true}};
  }
}

// -- G.3.1.13 / NOTCH LAB INTEGRADO / isolated iPhone 11 Pro experiments --
class ProjectZNotchFX {
  constructor(game){
    this.game=game;
    this.host=game.fullscreen.host;
    this.kind='idle';this.priority=0;this.until=0;this.cooldown=new Map();this.lastGlobal=-30;
    this.critical=false;this.criticalLatched=false;this.lastScannerCount=0;
    this.lastHordeWave=0;this.lastSpeechId=null;this.lastRadioDistrict='center';
    this.timer=null;
    this.duration={scanner:7600,horde:8900,boss:5200,low:4200,radio:8000,speech:7000,hit:3200};
    this.priorityMap={idle:0,speech:12,scanner:28,radio:34,hit:42,horde:68,low:86,boss:100};
    this.rgb={scanner:'106,207,189',horde:'252,83,79',boss:'247,52,74',low:'255,55,58',radio:'111,178,255',speech:'226,192,132',hit:'255,117,80'};
    this.template={scanner:['SENSOR ATIVO','MOVIMENTO DETECTADO','Infectados próximos · mantenha distância'],horde:['ALERTA / HORDA','HORDA EM APROXIMAÇÃO','Múltiplos infectados nas ruas próximas'],boss:['RISCO EXTREMO','CHEFE DETECTADO','Uma ameaça de grande porte entrou na região'],low:['SINAIS VITAIS','VIDA EM ESTADO CRÍTICO','Encontre cobertura e suprimentos'],radio:['RÁDIO / INTERFERÊNCIA','TRANSMISSÃO INTERCEPTADA','Sinal de emergência na região'],speech:['ANTÔNIO','“Preciso continuar vivo.”','Transmissão do sobrevivente'],hit:['IMPACTO','DANO RECEBIDO','Recue e procure um local seguro']};
    const eq=Array.from({length:15},(_,i)=>`<i style="--m:${(.36+(1-Math.abs(i-7)/9)*.62).toFixed(2)};--d:${(-((i*.37)%.85)).toFixed(2)}s"></i>`).join('');
    const drips=Array.from({length:9},(_,i)=>`<i style="left:${4+i*11.5}%;--h:${28+((i*13)%5)*8}px;--d:${((i*.43)%1.5).toFixed(2)}s"></i>`).join('');
    this.node=document.createElement('section');this.node.className='pz-notch-system';this.node.id='pz-notch-system';this.node.dataset.fx='idle';
    this.node.setAttribute('aria-label','Alertas visuais do NOTCH LAB integrados');
    this.node.innerHTML=`<div class="pz-notch-emitter" aria-hidden="true"><div class="pz-notch-edges"></div><div class="pz-notch-halo"></div><div class="pz-notch-sweep"></div><div class="pz-notch-noise"></div><div class="pz-notch-fx pz-notch-cone"></div><div class="pz-notch-fx pz-notch-drips">${drips}</div><div class="pz-notch-fx pz-notch-bolts"><i style="--r:0deg;--bh:270px;--d:0s"></i><i style="--r:34deg;--bh:185px;--d:.22s"></i><i style="--r:-34deg;--bh:185px;--d:.42s"></i></div><svg class="pz-notch-ecg l" viewBox="0 0 150 60"><path pathLength="1" d="M0 32 H20 q6 -8 12 0 H44 l6 6 l8 -34 l8 44 l6 -16 H100 q10 -14 20 0 H150"/></svg><svg class="pz-notch-ecg r" viewBox="0 0 150 60"><path pathLength="1" d="M0 32 H20 q6 -8 12 0 H44 l6 6 l8 -34 l8 44 l6 -16 H100 q10 -14 20 0 H150"/></svg><div class="pz-notch-fx pz-notch-eq">${eq}</div><div class="pz-notch-fx pz-notch-line"></div><div class="pz-notch-fx pz-notch-burst"></div><div class="pz-notch-fx pz-notch-burst b2"></div></div><div class="pz-notch-card" role="status" aria-live="polite"><div class="pz-n-label" data-n-label></div><div class="pz-n-title" data-n-title></div><div class="pz-n-desc" data-n-desc></div><div class="pz-n-progress"><i></i></div></div>`;
    this.host.appendChild(this.node);
    this.safeProbe=document.createElement('div');
    this.safeProbe.setAttribute('aria-hidden','true');
    this.safeProbe.style.cssText='position:absolute;pointer-events:none;visibility:hidden;width:0;height:0;padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
    this.node.appendChild(this.safeProbe);
    this.onViewportChange=()=>this.syncNotchSide();
    window.addEventListener('resize',this.onViewportChange,{passive:true});
    window.addEventListener('orientationchange',this.onViewportChange,{passive:true});
    this.syncNotchSide();
  }
  syncNotchSide(){
    const landscape=window.innerWidth>window.innerHeight&&window.innerHeight<=540;
    if(!landscape){this.node.classList.remove('pz-notch-right');return;}
    const styles=getComputedStyle(this.safeProbe);
    const insetLeft=parseFloat(styles.paddingLeft)||0;
    const insetRight=parseFloat(styles.paddingRight)||0;
    // Safari can return symmetric insets in landscape; orientation resolves that case.
    const orientation=typeof window.orientation==='number'?window.orientation:(screen.orientation?.angle||0);
    const useRight=insetRight>insetLeft+3 || (Math.abs(insetRight-insetLeft)<=3&&orientation===-90);
    this.node.classList.toggle('pz-notch-right',useRight);
  }
  clear(){
    clearTimeout(this.timer);this.timer=null;
    this.kind='idle';this.priority=0;this.until=0;
    this.node.classList.remove('is-active');
    this.host.classList.remove('pz-notch-isolated');
    this.refreshPersistent();
  }
  refreshPersistent(){
    // CRONOS P1: no other low-life visual effects outside the original HP bar.
    this.node.classList.remove('is-persistent');
    if(this.kind==='idle')this.node.dataset.fx='idle';
  }
  fire(key,{title='',body='',duration=0}={}){
    // CRONOS P1: no low-health text card. Keep the existing boss warning.
    if(key!=='boss')return false;
    if(!this.template[key]||this.game.scenes.name!=='field'||this.game.ui?.modal||this.game.previewPaused)return false;
    const r=this.game.scenes.current?.run;
    if(!r||r.over||r.progress.selecting||r.discovery.selecting)return false;
    const now=performance.now()/1000;
    const priority=this.priorityMap[key]||0;
    if(now<this.until&&priority<this.priority)return false;
    if(now-(this.cooldown.get(key)||-999)<({hit:13,speech:44,scanner:35,radio:70,horde:14,low:22,boss:2}[key]||18))return false;
    if(priority<80&&now-this.lastGlobal<7)return false;
    clearTimeout(this.timer);
    this.node.classList.remove('is-active','is-persistent');
    void this.node.offsetWidth; // restart CSS effects, no per-frame JS allocations
    this.kind=key;this.priority=priority;this.cooldown.set(key,now);this.lastGlobal=now;
    const ms=Math.max(1800,duration||this.duration[key]);
    this.until=now+ms/1000;
    this.node.dataset.fx=key;
    this.node.style.setProperty('--pz-neon',this.rgb[key]);
    this.node.style.setProperty('--pz-alert-duration',ms+'ms');
    this.node.querySelector('[data-n-label]').textContent=this.template[key][0];
    this.node.querySelector('[data-n-title]').textContent=title||this.template[key][1];
    this.node.querySelector('[data-n-desc]').textContent=body||this.template[key][2];
    this.node.classList.add('is-active');
    this.host.classList.add('pz-notch-isolated');
    this.timer=setTimeout(()=>this.clear(),ms);
    return true;
  }
  onWave(wave){
    // R2: wave/horde warnings disabled for now; boss warning remains active elsewhere.
    this.lastHordeWave=Math.max(this.lastHordeWave,wave||0);
  }
  onBoss(boss){this.fire('boss',{title:String(boss?.name||'CHEFE').toUpperCase()+' DETECTADO',body:'Ameaça de grande porte se aproximando'});}
  onDamage(hp,maxHp){
    // CRONOS P1: damage changes HP normally. The HUD controls the critical state.
    this.critical=false;this.criticalLatched=false;
    this.refreshPersistent();
  }
  update(run){
    if(!run||run.over||this.game.previewPaused||this.game.ui?.modal||run.progress.selecting||run.discovery.selecting){
      if(this.kind!=='idle')this.clear();
      return;
    }
    // CRONOS P1: health feedback belongs exclusively to the HP bar.
    // R2: scanner / radio / speech / generic hit warnings intentionally disabled.
  }
  destroy(){
    window.removeEventListener('resize',this.onViewportChange);
    window.removeEventListener('orientationchange',this.onViewportChange);
    this.clear();this.node.remove();
  }
}

// Q.02.5 — Feedback visual de eliminações, sem interferir na física nem no dano.
class KillFeedback {
  constructor(){this.floats=[];this.streak=0;this.streakTime=0;this.maxFloats=28;}
  kill(x,y,combo,xp){
    this.streak=combo;this.streakTime=3.0;
    if(this.floats.length>=this.maxFloats)this.floats.shift();
    this.floats.push({x,y,age:0,life:1.05,label:'+'+xp+' XP',combo});
  }
  update(dt){
    this.streakTime=Math.max(0,this.streakTime-dt);if(this.streakTime===0)this.streak=0;
    for(const f of this.floats)f.age+=dt;
    this.floats=this.floats.filter(f=>f.age<f.life);
  }
  drawWorld(ctx){
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    for(const f of this.floats){
      const t=f.age/f.life,alpha=Math.min(1,(1-t)*2.7);
      ctx.globalAlpha=alpha;ctx.font='bold 12px monospace';
      ctx.lineWidth=3;ctx.strokeStyle='#101318';ctx.fillStyle=f.combo>=5?'#ffd879':'#d6f0e2';
      ctx.strokeText(f.label,f.x,f.y-29-t*29);ctx.fillText(f.label,f.x,f.y-29-t*29);
    }
    ctx.restore();
  }
  drawHUD(ctx,w,h){
    if(this.streak<2||this.streakTime<=0)return;
    const alpha=Math.min(1,this.streakTime*2),size=this.streak>=10?25:this.streak>=5?22:19;
    ctx.save();ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='top';
    ctx.font='900 '+size+'px monospace';ctx.lineWidth=5;ctx.strokeStyle='#101318';
    ctx.fillStyle=this.streak>=10?'#ffb46d':this.streak>=5?'#ffe08a':'#e4eee8';
    const label='COMBO x'+this.streak;const y=(w>=901&&h>=550)?235:Math.max(49,Math.min(84,h*.14));
    ctx.strokeText(label,w/2,y);ctx.fillText(label,w/2,y);ctx.restore();
  }
}


// PROJECT Z / BLOCO 4 — recuperar ambiente visual sem substituir mundo/sprites/UI.
// CRONOS C4: ONE 600-second clock for visuals AND nocturnal gameplay.
// 00:00-01:40 golden hour (starts immediately)
// 01:40-03:20 sunset / transition into night
// 03:20-05:20 deep night
// 05:20-06:20 dawn
// 06:20-07:30 morning golden hour
// 07:30-10:00 daytime, looping back to sunset.
class Q04Environment {
  constructor(){this.lastWeather='clear';}
  smooth(v){const k=Math.max(0,Math.min(1,v));return k*k*(3-2*k);}
  get(t,previewVisual=false){
    // C4A: only visual rendering consults the phase preview; game simulation
    // continues to use the actual survival clock, including nocturnal AI.
    const override=previewVisual?window.__PROJECT_Z_CLIMATE_PREVIEW__:null;
    const solarTime=override&&Number.isFinite(override.time)?override.time:t;
    const cycle=((solarTime%600)+600)%600;
    const smooth=this.smooth;
    let dark=0,golden=0,solar=0.58,phase='day';
    if(cycle<100){
      phase='sunset';golden=1;solar=.48-.08*smooth(cycle/100);
    }else if(cycle<200){
      phase='dusk';const k=smooth((cycle-100)/100);
      dark=k;golden=1-k;solar=.40*(1-k);
    }else if(cycle<320){
      phase='night';dark=1;golden=0;solar=0;
    }else if(cycle<380){
      phase='dawn';const k=smooth((cycle-320)/60);
      dark=1-k;golden=k*.85;solar=.36*k;
    }else if(cycle<450){
      phase='morning-golden';const k=smooth((cycle-380)/70);
      golden=.85-.85*k;solar=.36+.22*k;
    }else{
      phase='day';solar=.58-.10*smooth((cycle-450)/150);
      // Sun warms naturally near the next cycle rather than snapping colors.
      golden=smooth((cycle-565)/35);
    }
    const wet=Math.max(0,Math.min(1,(Math.sin(t/79+.7)+Math.sin(t/137+2.2)*.5-.35)*.9));
    const fog=Math.max(0,Math.min(1,(Math.sin(t/113+1.4)+Math.sin(t/197)*.35-.25)*.55));
    // Night creatures only see 3:20-6:20 as night (same 3-minute total).
    return {cycle,phase,dark,golden,solar,wet,fog,night:cycle>=200&&cycle<380};
  }
  draw(ctx,viewport,run,camera,world){
    if(!run)return;
    const w=viewport.width,h=viewport.height;
    if(w<1||h<1)return;
    const t=run.elapsed||0,env=this.get(t,true);
    const settings=window.__projectZGame?.save?.settings||GRAPHIC_DEFAULTS;
    const weatherMul=GRAPHIC_SCALE[graphicLevel(settings.weatherQuality)];
    ctx.save();
    // Soft blue-bluegray ambient, NOT the old 55% opaque nighttime filter.
    if(env.dark>.001){
      ctx.fillStyle=`rgba(21,41,72,${(.12*env.dark).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle=`rgba(2,10,22,${(.065*env.dark).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
      // Low-level cool skylight restores blue midtones without flattening detail.
      ctx.globalCompositeOperation='screen';
      ctx.fillStyle=`rgba(61,104,160,${(.032*env.dark).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
      // Moonlight enters from the UPPER-RIGHT (beach side), but stays restrained.
      const moonWash=ctx.createLinearGradient(w*1.02,-8,w*.34,h*.92);
      moonWash.addColorStop(0,`rgba(196,220,255,${(.09*env.dark).toFixed(3)})`);
      moonWash.addColorStop(.28,`rgba(142,177,236,${(.05*env.dark).toFixed(3)})`);
      moonWash.addColorStop(.76,'rgba(96,132,201,0)');
      ctx.fillStyle=moonWash;ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='source-over';
      // Darken the beach specifically at night, rather than lifting it with the city.
      if(world?.border?.shore){
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(w,0);
        let first=true;
        for(let sy=0;sy<=h+8;sy+=10){
          const wy=camera.screenToWorld(0,sy).y;
          const shoreWx=world.border.shore(wy);
          const sx=camera.worldToScreen(shoreWx,wy).x;
          const clipped=Math.max(0,Math.min(w,sx));
          if(first){ctx.lineTo(clipped,0);first=false;}else ctx.lineTo(clipped,sy);
        }
        ctx.lineTo(w,h);ctx.closePath();
        ctx.clip();
        ctx.globalCompositeOperation='multiply';
        const beachShade=ctx.createLinearGradient(w*.58,0,w,0);
        beachShade.addColorStop(0,`rgba(32,42,58,${(.06*env.dark).toFixed(3)})`);
        beachShade.addColorStop(.55,`rgba(18,25,39,${(.16*env.dark).toFixed(3)})`);
        beachShade.addColorStop(1,`rgba(8,12,22,${(.28*env.dark).toFixed(3)})`);
        ctx.fillStyle=beachShade;ctx.fillRect(0,0,w,h);
        // Silver moon reflection over the water, strongest near the shoreline band.
        ctx.globalCompositeOperation='screen';
        for(let sy=0;sy<=h;sy+=8){
          const wy=camera.screenToWorld(0,sy).y;
          const shoreWx=world.border.shore(wy);
          const shoreSx=camera.worldToScreen(shoreWx,wy).x;
          const base=Math.max(shoreSx+12,w*.60);
          const wav=((sy*13+t*28)%37)/37;
          const len=28+wav*86;
          const alpha=(.028+(.032*(1-Math.abs((sy-h*.36)/(h*.46))))) * env.dark;
          ctx.fillStyle=`rgba(202,223,255,${alpha.toFixed(3)})`;
          ctx.fillRect(base+8*Math.sin(sy*.06+t*.03),sy,Math.max(0,Math.min(len,w-base-6)),2);
          if((sy/8)%3===0){
            ctx.fillStyle=`rgba(130,168,224,${(alpha*.45).toFixed(3)})`;
            ctx.fillRect(base+16+6*Math.cos(sy*.05+t*.02),sy+2,Math.max(0,Math.min(len*.55,w-base-18)),1);
          }
        }
        // Soft moon bloom over the upper-right beach / water area.
        const moonBloom=ctx.createRadialGradient(w*.97,h*.12,0,w*.94,h*.16,Math.max(w,h)*.52);
        moonBloom.addColorStop(0,`rgba(188,214,255,${(.08*env.dark).toFixed(3)})`);
        moonBloom.addColorStop(.4,`rgba(136,171,232,${(.03*env.dark).toFixed(3)})`);
        moonBloom.addColorStop(1,'rgba(96,132,201,0)');
        ctx.fillStyle=moonBloom;ctx.fillRect(0,0,w,h);
        ctx.restore();
      }
      // Leve dessaturação noturna: cenário perde um pouco da cor e fica mais acinzentado.
      // Isso vale também para praia, guarda-sóis e props, sem apagar luzes quentes posteriores.
      ctx.globalCompositeOperation='saturation';
      ctx.fillStyle=`rgba(132,138,148,${(.32*env.dark).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation='source-over';
      ctx.fillStyle=`rgba(154,160,170,${(.018*env.dark).toFixed(3)})`;
      ctx.fillRect(0,0,w,h);
    }
    // CRONOS C4F: base da C4C preservada, com reforço real no ponto onde a lanterna está mirando.
    if(env.dark>.015&&run.player){
      const p=camera.worldToScreen(run.player.x,run.player.y);
      const angle=Number.isFinite(run.player.facing)?run.player.facing:0;
      const range=238*camera.zoom;
      const grad=ctx.createRadialGradient(p.x,p.y,5,p.x,p.y,range);
      grad.addColorStop(0,'rgba(247,224,183,.13)');
      grad.addColorStop(.30,'rgba(229,214,188,.09)');
      grad.addColorStop(.72,'rgba(207,207,195,.035)');
      grad.addColorStop(1,'rgba(196,204,202,0)');
      ctx.globalCompositeOperation='screen';
      ctx.fillStyle=grad;
      for(let i=-6;i<=6;i++){
        const step=.105,center=angle+i*step;
        const feather=Math.pow(Math.max(0,1-Math.abs(i)/7),1.65);
        ctx.globalAlpha=env.dark*.85*feather;
        ctx.beginPath();ctx.moveTo(p.x,p.y);
        ctx.arc(p.x,p.y,range,center-step*.52,center+step*.52);
        ctx.closePath();ctx.fill();
      }
      // Ponto de impacto da luz: área à frente fica mais iluminada "de verdade".
      const hitX=p.x+Math.cos(angle)*range*.66;
      const hitY=p.y+Math.sin(angle)*range*.66;
      const hitRadius=68*camera.zoom;
      // Base de iluminação mais aberta, levantando o valor tonal na região visada.
      const hitBase=ctx.createRadialGradient(hitX,hitY,0,hitX,hitY,hitRadius);
      hitBase.addColorStop(0,'rgba(255,243,220,.15)');
      hitBase.addColorStop(.42,'rgba(240,233,223,.08)');
      hitBase.addColorStop(1,'rgba(224,228,232,0)');
      ctx.fillStyle=hitBase;
      ctx.globalAlpha=env.dark*.88;
      ctx.beginPath();ctx.arc(hitX,hitY,hitRadius,0,Math.PI*2);ctx.fill();
      // Um segundo passe em soft-light faz parecer que a superfície recebeu luz, e não só fumaça/lens flare.
      ctx.globalCompositeOperation='soft-light';
      const hitSurface=ctx.createRadialGradient(hitX,hitY,0,hitX,hitY,hitRadius*1.18);
      hitSurface.addColorStop(0,'rgba(255,236,206,.20)');
      hitSurface.addColorStop(.34,'rgba(239,233,228,.10)');
      hitSurface.addColorStop(1,'rgba(220,225,230,0)');
      ctx.fillStyle=hitSurface;
      ctx.globalAlpha=env.dark*.72;
      ctx.beginPath();ctx.arc(hitX,hitY,hitRadius*1.18,0,Math.PI*2);ctx.fill();
      // Leve faixa alongada na direção da mira para dar leitura melhor de chão/objetos no centro do cone.
      ctx.globalCompositeOperation='screen';
      const stripW=42*camera.zoom, stripL=98*camera.zoom;
      ctx.save();
      ctx.translate(hitX,hitY);
      ctx.rotate(angle);
      const strip=ctx.createLinearGradient(-stripL*.5,0,stripL*.5,0);
      strip.addColorStop(0,'rgba(255,238,212,0)');
      strip.addColorStop(.5,'rgba(248,236,219,.11)');
      strip.addColorStop(1,'rgba(255,238,212,0)');
      ctx.fillStyle=strip;
      ctx.globalAlpha=env.dark*.76;
      ctx.fillRect(-stripL*.5,-stripW*.5,stripL,stripW);
      ctx.restore();
      // Faint proximity visibility, even when not aiming at a point.
      ctx.globalAlpha=env.dark*.44;
      const near=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,92*camera.zoom);
      near.addColorStop(0,'rgba(216,220,212,.10)');near.addColorStop(1,'rgba(216,220,212,0)');
      ctx.fillStyle=near;ctx.beginPath();ctx.arc(p.x,p.y,92*camera.zoom,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    }
    if(env.fog>.03){ctx.fillStyle=`rgba(145,171,189,${(env.fog*.07*weatherMul).toFixed(3)})`;ctx.fillRect(0,0,w,h);}
    if(env.wet>.08){
      ctx.strokeStyle=`rgba(190,212,230,${(.14+env.wet*.30).toFixed(3)})`;ctx.lineWidth=1.2;
      const count=Math.min(190,Math.floor(w*h/7800*env.wet*weatherMul)),shift=t*330;
      for(let i=0;i<count;i++){
        const x=((i*127.7+shift*.31)%(w+50)+w+50)%(w+50)-20;
        const y=((i*239.3+shift)%(h+40)+h+40)%(h+40)-20;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+PZ_WIND.x*13,y+17);ctx.stroke(); // C4 · Poseidon: inclinação segue o vento
      }
    }
    // Do not leak preview lighting into enemy/night behaviors through shared state.
    ctx.restore();run.q04Environment=this.get(t);
  }
}
const Q04_ENVIRONMENT=new Q04Environment();

// CRONOS C4A — manual, visual-only lighting preview, no gameplay clock changes.
const PROJECT_Z_CLIMATE_STATES=Object.freeze([
  {key:'dusk',label:'ANOITECENDO',time:160,icon:'◐'},
  {key:'night',label:'NOITE',time:260,icon:'☾'},
  {key:'dawn',label:'AMANHECER',time:347,icon:'◓'},
  {key:'morning',label:'GOLDEN MANHÃ',time:393,icon:'☀'},
  {key:'day',label:'DIA',time:510,icon:'☼'},
  {key:'sunset',label:'GOLDEN HOUR',time:30,icon:'☀'},
]);
window.__PROJECT_Z_CLIMATE_PREVIEW__=null;
function cycleProjectZClimatePreview(){
  const current=window.__PROJECT_Z_CLIMATE_PREVIEW__;
  const idx=current?PROJECT_Z_CLIMATE_STATES.findIndex(s=>s.key===current.key):-1;
  const next=idx===PROJECT_Z_CLIMATE_STATES.length-1?null:PROJECT_Z_CLIMATE_STATES[idx+1];
  window.__PROJECT_Z_CLIMATE_PREVIEW__=next;
  return next;
}

// Small, restrained streetlights; decorative only and never replace the original map.
class Q04NightLights {
  draw(ctx,viewport,run,camera,world){
    const env=Q04_ENVIRONMENT.get(run.elapsed||0,true);if(env.dark<.1)return;
    const count=(world.lampLights?.length||0)+(world.lights?.length||0)+(world.fireLights?.length||0);
    if(this.world!==world||this.count!==count){
      this.world=world;this.count=count;
      this.lights=[...(world.lampLights||[]),...(world.lights||[]),...(world.fireLights||[])];
    }
    const lights=this.lights;
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const lamp of lights){
      const p=camera.worldToScreen(lamp.x,lamp.y),rad=(lamp.radius||100)*camera.zoom*1.6;
      if(p.x+rad<0||p.y+rad<0||p.x-rad>viewport.width||p.y-rad>viewport.height)continue;
      const multiplier=GRAPHIC_SCALE[graphicLevel(window.__projectZGame?.save?.settings?.lightingQuality)];
      const alpha=Math.min(.36,env.dark*(lamp.strength||.2)*1.12*multiplier);
      const hot=String(lamp.color||'').toLowerCase().includes('ff7');
      const grad=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,rad);
      if(hot){
        grad.addColorStop(0,`rgba(255,150,67,${alpha})`);
        grad.addColorStop(.45,`rgba(255,109,55,${alpha*.24})`);
        grad.addColorStop(1,'rgba(255,109,55,0)');
      }else{
        grad.addColorStop(0,`rgba(255,211,155,${alpha})`);
        grad.addColorStop(.45,`rgba(255,185,129,${alpha*.22})`);
        grad.addColorStop(1,'rgba(255,185,129,0)');
      }
      ctx.fillStyle=grad;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
}
const Q04_LIGHTING=new Q04NightLights();

// CRONOS C4 — actual world-space directional shadows, not a screen-wide golden filter.
class Q04SolarLighting {
  constructor(){
    this.central=[
      {x:52,y:58,w:272,h:204},
      {x:820,y:64,w:238,h:164},
      {x:52,y:835,w:254,h:169},
      {x:836,y:835,w:233,h:160},
      ...DISTRICT_BUILDINGS.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h}))
    ];
  }
  draw(ctx,viewport,run,camera,world){
    if(!run)return;
    const env=Q04_ENVIRONMENT.get(run.elapsed||0,true);
    const strength=Math.max(0,Math.min(1,env.solar+env.golden*.18))*(1-env.dark*.94);
    if(strength<.025)return;
    const quality=graphicLevel(window.__projectZGame?.save?.settings?.shadowsQuality);
    const buildings=this.central.concat(world?.border?.buildingRects||[]);
    const vx=camera.viewport.width/camera.zoom/2+170,vy=camera.viewport.height/camera.zoom/2+170;
    const left=camera.x-vx,right=camera.x+vx,top=camera.y-vy,bottom=camera.y+vy;
    const isGolden=env.golden>.03;
    ctx.save();camera.apply(ctx);
    for(const b of buildings){
      if(b.x>right||b.x+b.w<left||b.y>bottom||b.y+b.h<top)continue;
      const x=b.x,y=b.y,w=b.w,h=b.h;
      // Sun comes FROM THE BEACH (+X). World-space shadow extends to the west.
      // Medium-sized cast shadow depends on solar elevation; no physics/colliders modified.
      const len=(isGolden?Math.min(108,Math.max(28,Math.max(w,h)*.28)):Math.min(38,Math.max(12,Math.max(w,h)*.12)))*strength/.65;
      if(quality!=='low'&&len>3){
        ctx.fillStyle=`rgba(8,17,31,${(.15+.18*env.golden)*strength/.65})`;
        ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x,y+h-4);
        ctx.lineTo(x-len,y+h+len*.19);ctx.lineTo(x-len,y+len*.19+8);ctx.closePath();ctx.fill();
        // Penumbra: offset lighter extension gives the shadow a softer boundary.
        if(quality==='high'){
          ctx.fillStyle=`rgba(12,21,33,${(.065*strength).toFixed(3)})`;
          ctx.beginPath();ctx.moveTo(x-len*.7,y+len*.18+8);ctx.lineTo(x-len*.7,y+h+len*.18);
          ctx.lineTo(x-len-9,y+h+len*.2);ctx.lineTo(x-len-9,y+len*.2+8);ctx.closePath();ctx.fill();
        }
      }
      // The rooftop receives actual directional illumination, rather than
      // a fullscreen golden color filter. East = beach-facing illuminated area.
      const roofLight=ctx.createLinearGradient(x+w,y,x,y);
      const warm=(.06+env.golden*.22)*strength;
      roofLight.addColorStop(0,`rgba(255,208,130,${warm.toFixed(3)})`);
      roofLight.addColorStop(.26,`rgba(253,185,109,${(warm*.48).toFixed(3)})`);
      roofLight.addColorStop(.66,'rgba(255,184,114,0)');
      roofLight.addColorStop(1,`rgba(11,19,31,${(.04*strength).toFixed(3)})`);
      ctx.fillStyle=roofLight;
      ctx.fillRect(x+12,y+9,Math.max(0,w-24),Math.max(0,h-22));
      // Dynamic east-facing facade strip stays attached to the actual building.
      // Opposite edge is occluded; front-facing beach edge catches low sun.
      const sideAlpha=(.12+env.golden*.23)*strength;
      const edge=ctx.createLinearGradient(x+w-21,y,x+w+3,y);
      edge.addColorStop(0,'rgba(255,192,113,0)');
      edge.addColorStop(.65,`rgba(255,197,116,${(sideAlpha*.5).toFixed(3)})`);
      edge.addColorStop(1,`rgba(255,230,169,${sideAlpha.toFixed(3)})`);
      ctx.fillStyle=edge;ctx.fillRect(x+w-21,y+7,24,Math.max(8,h-15));
      // At night, beach-facing facades still catch a restrained cool rim from the moon.
      if(env.dark>.04){
        const moonEdge=ctx.createLinearGradient(x+w-18,y,x+w+4,y+10);
        moonEdge.addColorStop(0,'rgba(182,212,255,0)');
        moonEdge.addColorStop(.68,`rgba(161,199,255,${(.026*env.dark).toFixed(3)})`);
        moonEdge.addColorStop(1,`rgba(229,240,255,${(.060*env.dark).toFixed(3)})`);
        ctx.fillStyle=moonEdge;ctx.fillRect(x+w-18,y+8,22,Math.max(8,h-18));
        const roofMoon=ctx.createLinearGradient(x+w,y,x,y+12);
        roofMoon.addColorStop(0,`rgba(172,202,248,${(.040*env.dark).toFixed(3)})`);
        roofMoon.addColorStop(.42,`rgba(112,149,206,${(.015*env.dark).toFixed(3)})`);
        roofMoon.addColorStop(1,'rgba(96,132,201,0)');
        ctx.fillStyle=roofMoon;ctx.fillRect(x+12,y+9,Math.max(0,w-24),Math.max(0,h-22));
      }
      ctx.fillStyle=`rgba(8,16,28,${(.07+.10*env.golden)*strength + (.026*env.dark).toFixed?0:0})`;
      ctx.fillStyle=`rgba(8,16,28,${((.07+.10*env.golden)*strength + .03*env.dark).toFixed(3)})`;
      ctx.fillRect(x+2,y+7,8,Math.max(0,h-16));
    }
    ctx.restore();
    // Light on people, cars, buildings and street is kept intentionally restrained.
    if(env.golden>.005){
      ctx.save();
      ctx.globalCompositeOperation='screen';
      ctx.fillStyle=`rgba(248,164,84,${(.024*env.golden).toFixed(3)})`;
      ctx.fillRect(0,0,viewport.width,viewport.height);
      ctx.restore();
    }
  }
}
const Q04_SUNLIGHT=new Q04SolarLighting();

// Horde flanking supplements the original navigation; it never changes boss rules,
// player movement or the inherent speed/resistance of ordinary zombies at night.
class Q04HordeTactics {
  constructor(){this.noise=null;this.time=0;}
  shot(player){this.noise={x:player.x,y:player.y,life:3.0};}
  update(dt){if(this.noise){this.noise.life-=dt;if(this.noise.life<=0)this.noise=null;}}
  steer(enemy,player,preferred,original,spatial){
    const result=original.steer(enemy,player,preferred)||preferred;
    if(!result||enemy.kind!=='normal'||!Number.isFinite(enemy.x))return result;
    const near=spatial.query(enemy.x,enemy.y,84).filter(e=>e.alive&&e.kind==='normal').length;
    if(near<4)return result;
    const dx=player.x-enemy.x,dy=player.y-enemy.y,d=Math.hypot(dx,dy)||1;
    if(d<75||d>270)return result;
    // Subtle two-sided flanking for crowds, with no teleportation and no speed boost.
    const side=enemy.evadeSide||1,alerted=!!this.noise&&Math.hypot(this.noise.x-enemy.x,this.noise.y-enemy.y)<520;
    const strength=Math.min(.34,.07+(near-3)*.035+(alerted?.045:0));
    const x=result.x+(-dy/d)*side*strength,y=result.y+(dx/d)*side*strength;
    const len=Math.hypot(x,y)||1;return {x:x/len,y:y/len};
  }
}

class MidnightArt {
  constructor(){
    this.frames={};
    for(const pose of ['walk','charge','attack','hurt','flee']){
      const sheet=document.createElement('canvas');sheet.width=48*6;sheet.height=48;
      const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;
      for(let i=0;i<6;i++)this.paint(c,i*48,0,pose,i);
      this.frames[pose]=sheet;
    }
  }
  paint(c,ox,oy,pose,i){
    c.save();c.translate(ox+24,oy+24);
    const swing=Math.sin(i*Math.PI/3),charge=pose==='charge',leap=pose==='attack';
    const crouch=charge?3:leap?-3:0;
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(-15,12,31,5);
    c.fillStyle='#161e24';c.fillRect(-14,5+crouch,8,11);c.fillRect(6,5+crouch,8,11);
    c.fillStyle='#343b40';c.fillRect(-12,8+crouch+Math.round(swing*2),6,9);c.fillRect(6,8+crouch-Math.round(swing*2),6,9);
    c.fillStyle='#0c1219';c.fillRect(-13,-10+crouch,26,24);c.fillRect(-9,-15+crouch,19,7);
    c.fillStyle='#303942';c.fillRect(-11,-10+crouch,21,14);
    c.fillStyle='#465057';c.fillRect(-9,-9+crouch,4,11);c.fillRect(5,-8+crouch,3,8);
    c.fillStyle='#151d24';c.fillRect(-20,-8+crouch,8,16);c.fillRect(12,-8+crouch,8,16);
    c.fillStyle='#3b4449';c.fillRect(-22,-1+crouch+Math.round(swing*2),7,12);c.fillRect(15,-1+crouch-Math.round(swing*2),7,12);
    c.fillStyle='#b8a898';
    for(let j=0;j<3;j++){c.fillRect(-23+j*2,10+crouch+Math.round(swing*2),1,6+j%2*2);c.fillRect(20+j*2,10+crouch-Math.round(swing*2),1,6+j%2*2);}
    c.fillStyle='#11191e';c.fillRect(-8,-17+crouch,17,12);c.fillRect(-5,-20+crouch,11,4);
    c.fillStyle=pose==='hurt'?'#ff9e62':'#d9ed9d';c.fillRect(-5,-13+crouch,3,2);c.fillRect(4,-13+crouch,3,2);
    c.fillStyle='#69747a';c.fillRect(-6,-18+crouch,10,2);
    if(leap){c.fillStyle='#8c9494';c.fillRect(-16,19,6,2);c.fillRect(10,19,6,2);}
    c.restore();
  }
  draw(ctx,enemy){
    const pose=enemy.retreating?'flee':(this.frames[enemy.animation]?enemy.animation:'walk');
    const frame=Math.floor((enemy.stride||0)*.52)%6;
    ctx.save();ctx.translate(enemy.x,enemy.y);ctx.rotate((enemy.heading||0)+Math.PI/2);
    ctx.imageSmoothingEnabled=false;
    const scale=1.20;
    ctx.drawImage(this.frames[pose],frame*48,0,48,48,-24*scale,-24*scale,48*scale,48*scale);
    if(enemy.exposure>.7){
      ctx.globalCompositeOperation='screen';ctx.fillStyle=`rgba(255,136,63,${Math.min(.6,(enemy.exposure-.7)*.15)})`;
      ctx.beginPath();ctx.ellipse(0,0,13,17,0,0,Math.PI*2);ctx.fill();
    }
    if(enemy.state==='windup'||enemy.state==='claw'){
      ctx.strokeStyle='rgba(255,112,76,.72)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,30,-.7,.7);ctx.stroke();
    }
    ctx.restore();
  }
}
const Q11_MIDNIGHT_ART=new MidnightArt();

class Midnight extends Enemy {
  constructor(x,y,seed=0,packIndex=0){
    super(x,y,seed,'runner');
    this.kind='midnight';this.template={...this.template,sprite:'runner'};
    this.radius=15;this.maxHp=65;this.hp=65;this.speed=173;this.damage=22;this.xp=0;
    this.packIndex=packIndex;this.state='stalk';this.stateTime=1.2+Math.random()*1.5;
    this.exposure=0;this.sunburn=0;this.jumpVX=0;this.jumpVY=0;
    this.retreating=false;this.lightDeath=false;this.animation='walk';this.heading=0;
  }
  hit(damage,impact=null){
    const died=super.hit(damage,{...(impact||{}),zone:null});
    this.amputationEvents.length=0;
    if(this.alive&&this.hp<this.maxHp*.27&&this.state!=='leap'){
      this.state='retreat';this.stateTime=2.5;
    }
    return died;
  }
  update(dt,player,others=[],context={}){
    if(!this.alive)return 0;
    const env=context.midnightEnvironment||{night:true,dark:1,cycle:500};
    const dx=player.x-this.x,dy=player.y-this.y,dist=Math.hypot(dx,dy)||1;
    const facing=Number.isFinite(player.facing)?player.facing:0;
    const cone=Math.cos(Math.atan2(-dy,-dx)-facing);
    const flashlight=env.night&&dist<285&&cone>.72&&!segmentHitsStaticWall(player.x,player.y,this.x,this.y,3);
    const daylight=!env.night;
    this.exposure=Math.max(0,Math.min(4,this.exposure+dt*(daylight?2.5:flashlight?1.2:-.9)));
    if(this.exposure>1.25){
      const burn=dt*(daylight?23:8)*(this.exposure-1.25);
      if(this.hit(burn)){this.lightDeath=true;context.midnightBurn?.(this);return 0;}
    }
    this.flinch=Math.max(0,this.flinch-dt);
    this.hitStun=Math.max(0,this.hitStun-dt);
    if(Math.abs(this.hitVX)+Math.abs(this.hitVY)>.15){
      const decay=Math.exp(-dt*16),d=(1-decay)/16;
      const n=slideCircle(this.x,this.y,this.hitVX*d,this.hitVY*d,this.radius);
      this.x=n.x;this.y=n.y;this.hitVX*=decay;this.hitVY*=decay;
    }
    this.stateTime-=dt;
    this.stride+=dt*(this.state==='leap'?23:13);
    this.heading=Math.atan2(dy,dx);
    if(daylight){this.state='flee';this.retreating=true;}
    if(this.hitStun>0&&this.state!=='leap'){this.animation='hurt';return 0;}
    if(this.state==='windup'){
      this.animation='charge';
      if(this.stateTime<=0){
        this.state='leap';this.stateTime=.34;
        const leadX=player.x+(player._autoVX||0)*.16,leadY=player.y+(player._autoVY||0)*.16;
        const a=Math.atan2(leadY-this.y,leadX-this.x);
        this.jumpVX=Math.cos(a)*470;this.jumpVY=Math.sin(a)*470;
      }
      return 0;
    }
    if(this.state==='leap'){
      this.animation='attack';
      const n=slideCircle(this.x,this.y,this.jumpVX*dt,this.jumpVY*dt,this.radius);
      const blocked=Math.hypot(n.x-this.x,n.y-this.y)<this.speed*dt*.3;
      this.x=n.x;this.y=n.y;
      if(Math.hypot(player.x-this.x,player.y-this.y)<this.radius+player.radius+4){
        this.state='recover';this.stateTime=1.35;return 19;
      }
      if(this.stateTime<=0||blocked){this.state='recover';this.stateTime=1.5;}
      return 0;
    }
    if(this.state==='claw'){
      this.animation='charge';
      if(this.stateTime<=0){this.state='recover';this.stateTime=1.1;
        if(dist<this.radius+player.radius+22)return this.damage;
      }
      return 0;
    }
    if(this.state==='recover'){
      this.animation='hurt';if(this.stateTime<=0){this.state='stalk';this.stateTime=.8;}
      return 0;
    }
    if(this.state==='retreat'&&this.stateTime<=0){this.state='stalk';this.stateTime=1.2;}
    const side=this.packIndex%2?1:-1;
    const flank=(this.packIndex%3===0?0:side*.62);
    let vx=dx/dist-dy/dist*flank,vy=dy/dist+dx/dist*flank;
    if(this.state==='retreat'||this.state==='flee'){
      vx=-dx/dist+dy/dist*side*.3;vy=-dy/dist-dx/dist*side*.3;
    }
    const path=context.navigation?.steer(this,player,{x:vx,y:vy});
    if(path&&this.state!=='flee'&&this.state!=='retreat'){vx=path.x;vy=path.y;}
    const len=Math.hypot(vx,vy)||1,pace=this.state==='flee'?1.55:this.state==='retreat'?1.25:1;
    const n=slideCircle(this.x,this.y,vx/len*this.speed*pace*dt,vy/len*this.speed*pace*dt,this.radius);
    this.x=n.x;this.y=n.y;this.animation='walk';
    if(this.state==='stalk'&&this.stateTime<=0&&!daylight){
      if(dist<58){this.state='claw';this.stateTime=.52;}
      else if(dist<235&&dist>70){this.state='windup';this.stateTime=.55;}
      else this.stateTime=.65;
    }
    return 0;
  }
  draw(ctx){Q11_MIDNIGHT_ART.draw(ctx,this);}

}


class CombatScene {
  constructor(game){this.game=game;this.input=null;this.run=null;this.autoFireEnabled=false;this.autoTarget=null;}
  enter(){
    window.__PROJECT_Z_CLIMATE_PREVIEW__=null;
    const g=this.game,d=DIFFICULTIES[g.save.settings.difficulty],progress=new Progression();
    document.querySelector('#app').dataset.scene='field';
    this.run={dialogue:new DialogueDirector(),dialogueState:{visibleKinds:new Set(),nearCounts:{},lastSeenAt:0,lastKillAt:-999,killCombo:0,lastDamageHp:d.hp,lastAmmo:12,lastReserve:60,coasting:0,nearVehicle:null,lastCarHit:0,quietTime:0,clearTransition:false,previousWave:1,zoneTriggers:new Set(),worldScan:0,nearbyEnemyCount:0,nearbyCarCount:0},difficulty:d.id,player:new Player(d.hp,progress),gun:new Pistol(progress),progress,waves:new WaveDirector(d.enemies*HORDE_BALANCE[d.id].spawn,HORDE_BALANCE[d.id].alive),enemies:[],boss:null,bossPending:null,bossQueue:[],enemyAttacks:new EnemyAttacks(),navigation:new EnemyNavigation(),spatial:new SpatialHash(96),effects:new CombatEffects(),killFeedback:new KillFeedback(),noticeText:'',noticeTextTime:0,loot:new LootSystem(d.resources),grenades:new GrenadeSystem(),gear:new SurvivalGear(progress),barrels:new ExplosiveBarrels(),discovery:new DiscoverySystem(g.save),district:districtAt(592,575),visited:new Set(['center']),elapsed:0,kills:0,enemyCounter:0,over:false,recorded:false,hitPulse:0,notice:0,lootToast:'',lootToastTime:0};
    this.run.midnightSpawnClock=1.4;
    this.run.midnightPackId=0;
    this.run.hordeTactics=new Q04HordeTactics();
    this.run.q04Environment=Q04_ENVIRONMENT.get(0);
    this.run.destructibles=new WorldDestruction(this.run);
    this.run.destructibles.onVehicleBlast=o=>{
      const x=o.rect.x+o.rect.w/2,y=o.rect.y+o.rect.h/2;
      // O carro causador não bloqueia sua própria explosão. Nenhuma reação em cadeia.
      this.areaExplosion(x,y,112,105,{source:'vehicle',playerScale:.48,ignoreObstacle:o.collider});
      this.run.destructibles.blast(x,y,112,92);
    };
    this.autoFireEnabled=false;this.autoTarget=null;
    g.previewPaused=false;g.camera.resize(g.renderer.width,g.renderer.height,'field');
    pzSurvivorSetup(this); // A4: vida, velocidade e habilidade do sobrevivente escolhido
    g.camera.jumpTo(this.run.player.x,this.run.player.y);
    PZ_AUTO_QUALITY.reset();
    g.audio.setMode('field');g.canvas.classList.add('is-interactive');
    g.ui.setView('field');this.input=new DualStickInput(g.root,g.canvas);
    // Restore keyboard focus from the cinematic iframe.
    g.canvas.focus({preventScroll:true});
    this.run.loot.seedNear(this.run.player,g.camera);
    this.run.waves.update(.04,()=>this.spawnEnemy(),this.run.enemies.length);
    this.run.dialogue.request(2,{delay:1.5});
    g.ui.updateHUD(this.run);
  }
  spawnEnemy(){
    const r=this.run;
    if(!r||r.over||r.enemies.length>=maxAliveForWave(r.waves.wave,r.waves.activeMultiplier))return false;
    const pos=placeOutsideCamera(this.game.camera,Math.random,{
      radius:19,margin:65,reach:115,attempts:100,
      player:r.player,minPlayerDistance:185,
      accept:(x,y)=>!r.enemies.some(e=>e.alive&&Math.hypot(e.x-x,e.y-y)<e.radius+31),
    });
    if(!pos)return false;
    const kind=enemyKindForWave(r.waves.wave);
    const enemy=new Enemy(pos.x,pos.y,++r.enemyCounter,kind);
    const multiplier=1+Math.max(0,r.waves.wave-1)*.085;
    enemy.hp=Math.ceil(enemy.hp*multiplier);enemy.maxHp=enemy.hp;
    r.enemies.push(enemy);
    return true;
  }
  // Um novo encontro fica pendente caso ainda haja um chefe vivo.
  scheduleBoss(wave){
    if(!bossKindForWave(wave))return false;
    const r=this.run;
    r.bossQueue??=[];
    if(r.boss?.wave===wave||r.bossPending===wave||r.bossQueue.includes(wave))return false;
    if(r.bossPending)r.bossQueue.push(wave);
    else r.bossPending=wave;
    return this.trySpawnBoss();
  }
  trySpawnBoss(){
    const r=this.run;
    if(!r||!r.bossPending||(r.boss&&r.boss.alive)||r.over)return false;
    const pos=placeOutsideCamera(this.game.camera,Math.random,{
      radius:36,margin:86,reach:115,attempts:110,
      player:r.player,minPlayerDistance:265,
    });
    if(pos){
      const boss=new Boss(pos.x,pos.y,r.bossPending);
      r.boss=boss;r.enemies.push(boss);r.bossPending=r.bossQueue?.shift()??null;
      r.discovery.notice(boss.kind);
      r.noticeText=`⚠ ${boss.name} — CHEFE NA ÁREA`;
      r.noticeTextTime=3.4;
      this.game.audio.effect('bossSpawn');
      this.game.audio.effect(boss.kind==='colossus'?'colossusGrowl':'hiveGrowl',{x:boss.x,y:boss.y});
      this.game.ui.updateHUD(r);
      r.dialogue.request(51,{urgent:true});this.game.notchFX?.onBoss(boss);this.game.events.emit('boss:spawn',boss);
      return true;
    }
    return false;
  }
  explosionOccluded(ax,ay,bx,by,ignoreObstacle=null){
    const nearby=nearbyObstacles(Math.min(ax,bx)-2,Math.min(ay,by)-2,Math.max(ax,bx)+2,Math.max(ay,by)+2);
    return nearby.some(o=>o!==ignoreObstacle&&!o.barrel&&segmentRectHit(ax,ay,bx,by,o.carShape ? {carShape:{...o.carShape,halfW:o.carShape.halfW+2,halfH:o.carShape.halfH+2}} : {x:o.x-2,y:o.y-2,w:o.w+4,h:o.h+4}));
  }
  // G.3.1.6: a explosão tem área real: infectados e Antônio recebem dano.
  // Parede e carros entre a origem e o alvo impedem o dano.
  areaExplosion(x,y,radius,baseDamage,{source='explosion',playerScale=.54,ignoreObstacle=null}={}){
    const r=this.run,g=this.game;
    if(!r||r.over)return {hits:0,kills:0,playerHit:false};
    r.worldFX?.explosion(x,y,radius);
    const victims=r.enemies;let hits=0,kills=0;
    for(const enemy of victims){
      if(!enemy.alive)continue;
      const dx=enemy.x-x,dy=enemy.y-y,dist=Math.hypot(dx,dy);
      if(dist>radius+enemy.radius||this.explosionOccluded(x,y,enemy.x,enemy.y,ignoreObstacle))continue;
      const falloff=Math.max(.27,1-.73*Math.min(1,dist/Math.max(1,radius)));
      const died=enemy.hit(baseDamage*falloff,{dx:dx||1,dy:dy||0});
      hits++;if(died)kills++;
      if(hits<=22){r.effects.emit(enemy.x,enemy.y,died?'kill':'hit',died?4:2);
        if(died)r.effects.emitSevered(enemy,dx,dy,baseDamage*falloff,true);
        r.effects.emitBlood(enemy.x,enemy.y,(dx||1)/(dist||1),dy/(dist||1),died);}
      this.creditKill(enemy,died);
    }
    const p=r.player,dist=Math.hypot(p.x-x,p.y-y);
    let playerHit=false;
    if(p.alive&&dist<radius+p.radius&&!this.explosionOccluded(x,y,p.x,p.y,ignoreObstacle)){
      const falloff=Math.max(.24,1-.76*Math.min(1,dist/Math.max(1,radius)));
      playerHit=this.hurtPlayer(baseDamage*falloff*playerScale,false,source);
      // hurtPlayer retorna true só quando mata; guardar se houve contato de fato.
      playerHit=true;
    }
    r.enemyAttacks.blast(x,y,radius,'#ed8c75');
    r.effects.emit(x,y,'boss',Math.min(24,Math.floor(radius/5)));
    g.audio.effect('explosion');g.haptics?.pulse('explosions');
    return {hits,kills,playerHit};
  }
  detonateBarrel(barrel){
    return this.run?.barrels?.detonate(barrel,(x,y,radius,damage)=>{
      this.run?.effects?.emitDebris(x,y,1.1);
      this.areaExplosion(x,y,radius,damage,{source:'barrel',playerScale:.48});
      this.run?.destructibles?.blast(x,y,radius,damage);
    });
  }
  enemyContext(){
    const r=this.run,g=this.game;
    return {
      shoot:(...args)=>r.enemyAttacks.shoot(...args),
      blast:(...args)=>{r.enemyAttacks.blast(...args);r.effects.emit(args[0],args[1],'boss',16);g.audio.effect('explosion');},
      bomberExplosion:(x,y,bomber)=>this.areaExplosion(x,y,82,Math.max(60,bomber.damage*2.4),{source:'bomber',playerScale:.55}),
      summon:(x,y,count,kind)=>{
        for(let i=0;i<count;i++){
          if(r.enemies.length+r.pendingSpawns.length>=maxAliveForWave(r.waves.wave,r.waves.activeMultiplier))break;
          const pos=placeOutsideCamera(g.camera,Math.random,{
            radius:(ENEMY_TYPES[kind]?.radius||13)+3,margin:55,reach:96,attempts:75,
            player:r.player,minPlayerDistance:185,
          });
          if(pos)r.pendingSpawns.push(new Enemy(pos.x,pos.y,++r.enemyCounter,kind));
        }
      },
      navigation:{steer:(enemy,player,preferred)=>r.hordeTactics?.steer(enemy,player,preferred,r.navigation,r.spatial)||r.navigation.steer(enemy,player,preferred)},
      nearby:(x,y,radius)=>r.spatial.query(x,y,radius),
      midnightEnvironment:r.q04Environment,
      midnightBurn:enemy=>{r.effects.emit(enemy.x,enemy.y,'kill',9);},
      sound:(type,position={})=>g.audio.effect(type,position),
      warn:(message,seconds=1.3)=>{r.noticeText=message;r.noticeTextTime=seconds;}
    };
  }
  hurtPlayer(amount,slow=false,killer=null){
    const r=this.run,g=this.game;
    if(!amount||slow||r.over)return false;
    if(r.player.takeDamage(amount*DIFFICULTIES[r.difficulty].damage)){
      r.player.lastHurtAt=r.elapsed;
      const report=r.player.lastDamageReport||{};
      r.hitPulse=report.healthDamage>0?.35:0;
      r.effects.emit(r.player.x,r.player.y,report.shieldBroken?'boss':'hit',report.shieldBroken?12:report.absorbed>0?4:9);
      g.audio.effect('hurt');
      if(report.shieldBroken)this.notify('ESCUDO QUEBRADO',1.2);
      if(r.player.hp>0){g.notchFX?.onDamage(r.player.hp,r.player.maxHp);r.dialogue.request(3,{urgent:true});if(r.player.hp/r.player.maxHp<.18)r.dialogue.request(45,{urgent:true});}
      if(!r.player.alive){if(killer)g.save.recordInfectedDeath(killer);this.finishRun();return true;}
    }
    return false;
  }
  chooseUpgrade(id){
    const r=this.run;
    if(!r||r.over||!r.progress.selecting||r.discovery.selecting||this.game.previewPaused)return false;
    const prevGun={model:r.gun.model,ammo:r.gun.ammo};
    const item=r.progress.choose(id);if(!item)return false;
    if(item.id==='vest')r.player.addVest();
    r.gun.applyUpgrade(item);
    if(item.type==='weapon'&&r.gun.model!==prevGun.model){
      r.c3WeaponSlots??=[{model:prevGun.model,ammo:prevGun.ammo},null];
      const current=r.c3WeaponSlot||0,other=1-current;
      r.c3WeaponSlots[other]=prevGun;r.c3WeaponSlots[current]={model:r.gun.model,ammo:r.gun.ammo};
      r.progress.weapon=r.gun.model;
    }
    if(item.type==='special')r.gear.onUpgrade();
    r.player.invulnerable=Math.max(r.player.invulnerable,.65);
    this.game.audio.effect('upgrade');r.dialogue.request(40);
    if(r.progress.pending>0)r.progress.beginChoice();
    this.input?.clear();this.game.ui.render();this.game.ui.updateHUD(r);
    return true;
  }
  useMedkit(){
    const r=this.run;if(!r||r.over||r.backpackOpen||this.game.previewPaused||r.progress.selecting||r.discovery.selecting)return false;
    const started=r.player.startMedkit();
    if(started){this.notify('APLICANDO KIT MÉDICO · 3 SEGUNDOS',1.5);this.game.ui.updateHUD(r);}
    return started;
  }
  toggleBackpack(){
    if(!this.run||this.run.over)return false;
    this.run.backpackOpen=!this.run.backpackOpen;this.run.bagSelectedSlot=null;
    this.game.ui.render();this.game.ui.updateHUD(this.run);return true;
  }
  selectBagSlot(index){
    const r=this.run;if(!r||!r.backpackOpen)return false;
    index=Number(index);if(!Number.isInteger(index)||index<0||index>=r.player.backpack.capacity)return false;
    if(r.bagSelectedSlot===null||r.bagSelectedSlot===undefined){r.bagSelectedSlot=index;}
    else{r.player.backpack.moveSlot(r.bagSelectedSlot,index);r.bagSelectedSlot=null;}
    this.game.ui.render();this.game.ui.updateHUD(r);return true;
  }

  // Se a mochila estiver cheia, a troca só ocorre se o acessório anterior
  // couber nela ou puder ser deixado intacto no chão. Nenhum item é perdido.
  equipBagAttachment(index){
    const r=this.run;if(!r?.backpackOpen)return false;
    index=Number(index);if(!Number.isInteger(index)||index<0||index>=r.player.backpack.capacity)return false;
    const picked=r.player.backpack.slots[index],parsed=b3ParseAccessory(picked?.type);
    if(!parsed)return false;
    if(!r.gun.attachmentSlots.includes(parsed.slot)){
      r.noticeText='ACESSÓRIO INCOMPATÍVEL COM ESTA ARMA';r.noticeTextTime=2;this.game.ui.render();return false;
    }
    const oldTier=r.gun.attachments.get(r.gun.model,parsed.slot);
    if(oldTier===parsed.tier)return false;
    const oldType=oldTier?b3AccessoryType(parsed.slot,oldTier):null;
    // Simulação segura da troca na mochila antes de mudar a arma.
    const copy=new SurvivalBackpack(r.player.backpack.capacity);
    copy.slots=r.player.backpack.slots.map(s=>s?{...s}:null);
    if(!copy.remove(picked.type))return false;
    let willDrop=false;
    if(oldType&&!copy.add(oldType))willDrop=true;
    let dropPoint=null;
    if(willDrop){
      for(const [dx,dy] of [[24,0],[-24,0],[0,24],[0,-24],[34,34],[-34,34],[34,-34],[-34,-34]]){
        const x=r.player.x+dx,y=r.player.y+dy;
        if(canOccupy(x,y,17)&&!r.loot.items.some(o=>Math.hypot(o.x-x,o.y-y)<30)){dropPoint={x,y};break;}
      }
      if(!dropPoint){r.noticeText='SEM ESPAÇO PARA O ACESSÓRIO ANTERIOR';r.noticeTextTime=2;this.game.ui.render();return false;}
    }
    const result=r.gun.equipAttachment(parsed.slot,parsed.tier);
    if(!result.ok)return false;
    if(!r.player.backpack.remove(picked.type))throw Error('Falha de integridade do inventário');
    if(oldType){
      if(willDrop){
        const dropped=r.loot.addAccessory(dropPoint.x,dropPoint.y,parsed.slot,oldTier);
        if(!dropped)throw Error('Não foi possível posicionar o acessório anterior');
      }else if(!r.player.backpack.add(oldType))throw Error('Falha de devolução do acessório');
    }
    r.bagSelectedSlot=null;
    this.notify(`${B3_ACCESSORY_NAMES[parsed.slot]} NÍVEL ${parsed.tier} INSTALADO`,1.8);
    this.game.ui.render();this.game.ui.updateHUD(r);return true;
  }
  // Desmontagem explícita, preservando o acessório anterior.
  removeGunAttachment(slot){
    const r=this.run;if(!r?.backpackOpen)return false;
    const tier=r.gun.attachments.get(r.gun.model,slot);
    if(!tier||!r.player.backpack.canAdd(b3AccessoryType(slot,tier)))return false;
    const result=r.gun.attachments.remove(r.gun.model,slot);
    if(!result.ok)return false;
    r.player.backpack.add(b3AccessoryType(slot,tier));
    if(slot==='mag')r.gun.ammo=Math.min(r.gun.ammo,r.gun.magazine);
    this.game.ui.render();this.game.ui.updateHUD(r);return true;
  }
  selectConsumable(type){
    const r=this.run;if(!r||!['shield','medkit'].includes(type))return false;
    r.player.selectedConsumable=type;this.game.ui.updateHUD(r);return true;
  }
  useSelectedConsumable(){
    const r=this.run;if(!r)return false;
    return r.player.selectedConsumable==='medkit'?this.useMedkit():this.useShieldCell();
  }
  useShieldCell(){
    const r=this.run;if(!r||r.over||r.backpackOpen||this.game.previewPaused||r.progress.selecting||r.discovery.selecting)return false;
    const started=r.player.startShieldCharge();
    if(started){this.notify('RECARREGANDO ESCUDO · 3 SEGUNDOS',1.5);this.game.ui.updateHUD(r);}
    return started;
  }
  toggleAutoFire(){
    const r=this.run;
    if(!r||r.over)return false;
    this.autoFireEnabled=!this.autoFireEnabled;
    if(!this.autoFireEnabled)this.autoTarget=null;
    this.game.ui?.updateAutoFireButton(this);
    return this.autoFireEnabled;
  }
  activateSpecial(){
    const r=this.run;if(!r||r.over||this.game.previewPaused||this.game.ui?.modal||r.backpackOpen||r.progress.selecting||r.discovery.selecting)return false;
    const p=r.player;
    const ok=pzActivateSpecial(this); // A4: habilidade de cada sobrevivente
    if(ok)this.game.ui.updateHUD(r);return ok;
  }
  interact(){
    const r=this.run;if(!r||r.over||this.game.previewPaused||this.game.ui?.modal)return false;
    // The current world already picks up supplies by proximity: don't replace that mechanic.
    const near=r.loot?.items?.some(item=>Math.hypot(item.x-r.player.x,item.y-r.player.y)<60);
    if(near)this.notify('SUPRIMENTOS · APROXIME-SE PARA COLETAR',1.3);
    return Boolean(near);
  }
  selectWeapon(index){
    const r=this.run;if(!r||r.over||this.game.previewPaused||this.game.ui?.modal||r.backpackOpen||r.progress.selecting||r.discovery.selecting)return false;
    if(!r.c3WeaponSlots)r.c3WeaponSlots=[{model:r.gun.model,ammo:r.gun.ammo},null];
    if(index===r.c3WeaponSlot)return true;
    const target=r.c3WeaponSlots[index];if(!target)return false;
    r.c3WeaponSlots[r.c3WeaponSlot||0]={model:r.gun.model,ammo:r.gun.ammo};
    const prev=r.c3WeaponSlots[index];
    r.gun.model=prev.model;r.gun.ammo=Math.min(r.gun.magazine,prev.ammo);r.gun.reloadRemaining=0;r.gun.cooldown=0;
    r.c3WeaponSlot=index;r.progress.weapon=r.gun.model;
    this.notify('ARMA · '+r.gun.config.name,1.1);this.game.ui.updateHUD(r);return true;
  }
  swapWeapon(){return this.selectWeapon((this.run?.c3WeaponSlot||0)===0?1:0);}
  useGrenade(){
    const r=this.run,g=this.game;
    if(!r||r.over||r.progress.selecting||r.discovery.selecting||g.previewPaused||g.ui.modal)return false;
    const outcome=r.grenades.throw(r.player,r.enemies,g.camera);
    if(outcome.ok){g.audio.effect('grenadeThrow',{x:r.player.x,y:r.player.y});r.dialogue.request(37);}
    else if(outcome.reason!=='AGUARDE')this.notify(outcome.reason,1.3);
    g.ui.updateHUD(r);
    return outcome.ok;
  }
  notify(label,seconds=1.5){
    if(!this.run)return;
    this.run.lootToast=label;
    this.run.lootToastTime=seconds;
  }
  observeDialogue(dt,axes,{blocked=false}={}){
    const r=this.run;
    if(!r?.dialogue || blocked || r.over)return;
    const D=r.dialogue,S=r.dialogueState,p=r.player;
    D.update(dt);
    S.worldScan=(S.worldScan||0)+dt;
    if(S.worldScan<.48)return;
    S.worldScan=0;
    const nearby=r.enemies.filter(e=>e.alive && Math.hypot(e.x-p.x,e.y-p.y)<320);
    const n=nearby.length,prev=S.nearbyEnemyCount||0;
    S.nearbyEnemyCount=n;
    const close=nearby.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<135);
    const sectors=new Set(close.map(e=>Math.floor(((Math.atan2(e.y-p.y,e.x-p.x)+Math.PI)/(Math.PI*2))*8)%8));
    const surround=close.length>=5&&sectors.size>=4;
    const pressed=axes?.move && Math.hypot(axes.move.x,axes.move.y)>.5;
    const stuck=pressed && Math.hypot(p.x-S.lastPosX,p.y-S.lastPosY)<2.5;
    const walls=nearbyObstacles(p.x-48,p.y-48,p.x+48,p.y+48);
    if(n>0) S.lastSeenAt=D.clock;
    if(n>=5 && prev<5)D.request(5);
    if(n>=7 && prev<7)D.request(7);
    if(n>=12 && prev<12)D.request(8);
    if(n>=17 && prev<17)D.request(12);
    if(surround){D.request(9,{urgent:true}); if(stuck && walls.length)D.request(10,{urgent:true});}
    if(close.length>=5 && sectors.has(0)&&sectors.has(3))D.request(11,{urgent:true});
    if(prev>=8&&n<=3){D.request(13);D.request(15);}
    if(n<=2&&prev>=5)D.request(39);
    if(n>=5 && r.kills>7)D.request(14);
    const intro={normal:17,runner:19,bomber:21,spitter:23,tank:25,summoner:27,colossus:29,hive:31};
    const repeat={normal:18,runner:20,bomber:22,spitter:24,tank:26,summoner:28,colossus:30,hive:32};
    for(const enemy of nearby){
      const kind=enemy.kind;
      if(!S.visibleKinds.has(kind)){
        S.visibleKinds.add(kind);
        if(S.visibleKinds.size===1)D.request(1,{urgent:true});
        D.request(intro[kind],{delay:kind==='normal'?5:1});
      }else if(n>0 && D.spoken.has(intro[kind])){
        if(kind==='bomber' && enemy.fuse>=0)D.request(22,{urgent:true});
        else if(kind==='tank'&&enemy.hp<enemy.maxHp*.5)D.request(26);
        else if(kind==='summoner'&&n>9)D.request(28);
        else if(kind==='hive'&&n>13)D.request(32,{urgent:true});
        else if(kind==='colossus'&&Math.hypot(enemy.x-p.x,enemy.y-p.y)<110)D.request(30,{urgent:true});
        else if(n>=3 && (Math.floor(D.clock)%13===0))D.request(repeat[kind]);
      }
    }
    if(r.gun.ammo <= Math.max(2,Math.floor(r.gun.magazine*.18))&&r.gun.ammo>0)D.request(41);
    if(r.gun.ammo===0 && r.gun.reserve<=0)D.request(42,{urgent:true});
    if(r.gun.reloadRemaining>0&&close.length>=3)D.request(43,{urgent:true});
    if(p.hp/p.maxHp<.30)D.request(44,{urgent:true});
    if(r.boss?.alive && r.boss.hp<r.boss.maxHp*.30)D.request(52);
    if(r.waves.phase==='rest'&&n<=2){D.request(54);if(D.spoken.has(15))D.request(16);}
    if(r.elapsed>=30 && n<=3 && r.waves.wave<=3)D.request(6);
    if(r.elapsed>=95 && n<=2)D.request(59);
    if(r.elapsed>=180 && n<=2)D.request(60);
    // Place-aware ambient jokes are only spoken in relatively safe situations.
    const safe=n<=4 && close.length<=1 && !r.boss?.alive;
    // Touching a civilian vehicle can trigger a short reaction even under pressure.
    const touchingCar=ABANDONED_VEHICLES.find(v=>Math.hypot(v.x-p.x,v.y-p.y)<65);
    if(touchingCar&&stuck&&D.clock-(S.lastCarHit||-30)>25){
      S.lastCarHit=D.clock;D.request(65);
    }
    if(!safe)return;
    if(r.elapsed>=42 && n===0)D.request(73);
    if(r.elapsed>=115 && n===0)D.request(74);
    if(r.elapsed>=185 && n===0)D.request(76);
    if(r.elapsed>=230 && n<=1)D.request(77);
    const vehicles=ABANDONED_VEHICLES.filter(v=>Math.hypot(v.x-p.x,v.y-p.y)<245);
    const near=vehicles.filter(v=>Math.hypot(v.x-p.x,v.y-p.y)<115).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    if(vehicles.length>=4){D.request(63);D.request(78);}
    if(near.length){
      const car=near[0];
      if(car.kind==='pickup')D.request(62);
      else if(['bronze','burgundy','navy'].includes(car.paint))D.request(61);
      else D.request(67);
      if(D.spoken.has(63))D.request(64);
      if(car.paint==='rust')D.request(66);
      if(stuck&&Math.hypot(car.x-p.x,car.y-p.y)<65)D.request(65);
      if(n===0&&vehicles.length>=2)D.request(75);
    }
    const buildings=[{x:52,y:58,w:272,h:204,name:'BANCO TIETÊ'},{x:820,y:64,w:238,h:164,name:'BANCO PAULISTA'},{x:52,y:835,w:254,h:169,name:'FRIGORÍFICO VILA'},{x:836,y:835,w:233,h:160,name:'CASAS DO BRÁS'},...DISTRICT_BUILDINGS];
    for(const b of buildings){
      const ex=Math.max(b.x,Math.min(p.x,b.x+b.w)),ey=Math.max(b.y,Math.min(p.y,b.y+b.h));
      if(Math.hypot(p.x-ex,p.y-ey)>115)continue;
      const label=b.name.toUpperCase();
      if(label==='BANCO TIETÊ'||label==='BANCO PAULISTA'){D.request(68);if(D.spoken.has(68))D.request(69);}
      else if(label==='CASAS DO BRÁS')D.request(70);
      else if(label==='HIPER LESTE'||label==='MERCADÃO 24H')D.request(71);
      else if(label==='PARADA 24H'||label==='DROGARIA SÉ'||label==='CANTINA BIXIGA'||label==="HABIB'S")D.request(72);
      else if(label==='FRIGORÍFICO VILA')D.request(58);
    }
    if(Math.hypot(p.x-571,p.y-726)<108)D.request(79);
    if(Math.hypot(p.x-979,p.y-1644)<108 && p.hp<p.maxHp)D.request(80);
  }
  creditKill(target,died){
    const r=this.run;if(!r||!died)return;
    if(target.deadByExplosion)return;
    r.kills++;this.game.save.recordCharacterKill();if(target.kind!=='midnight')this.game.save.recordInfectedKill(target.kind);
    const ds=r.dialogueState;const clock=r.dialogue.clock;ds.killCombo=(clock-ds.lastKillAt<3)?ds.killCombo+1:1;ds.lastKillAt=clock;
    // Bônus aprovado: +2% de XP por eliminação consecutiva, limite +30%.
    const baseXP=target.xp??5;
    const earnedXP=Math.round(baseXP*(1+Math.min(15,ds.killCombo-1)*.02));
    r.progress.gain(earnedXP);
    if(r.kills===1)r.dialogue.request(4);
    r.killFeedback?.kill(target.x,target.y,ds.killCombo,earnedXP);
    if(ds.killCombo===5)r.dialogue.request(33);if(ds.killCombo===10)r.dialogue.request(34);
    if(!target.isBoss&&target.maxHp>=50&&target.hp<=0)r.dialogue.request(35);
    if(!target.isBoss)this.game.audio.effect('zombieDeath',{x:target.x,y:target.y});
    if(target.isBoss){r.noticeText=`${target.name} DERROTADO · +${target.xp} XP`;r.noticeTextTime=3.2;this.game.audio.effect('bossDown');this.game.events.emit('boss:defeated',target);r.dialogue.request(38,{urgent:true});}
  }
  update(dt){
    const r=this.run,g=this.game;if(!r||r.over)return;
    // C2 · Ártemis: pausa de impacto — o mundo congela por poucos milissegundos num abate forte.
    if(r.hitStop>0){r.hitStop=Math.max(0,r.hitStop-dt);return;}
    r.casings??=new ShellCasings();r.worldFX??=new WorldFX();
    // Supports restored runs and integration harnesses built with an older state shape.
    r.navigation??=new EnemyNavigation();r.spatial??=new SpatialHash(96);r.effects??=new CombatEffects();
    const slow=r.progress.selecting||r.discovery.selecting||r.backpackOpen;
    const worldDt=r.backpackOpen?0:dt*(slow?.1:1); // Bloco 3: pausa TOTAL da mochila
    r.killFeedback?.update(worldDt);if(r.killFeedback?.streak===0)r.dialogueState.killCombo=0;
    for(const k of Object.keys(r.player.defenseFX||{}))r.player.defenseFX[k]=Math.max(0,r.player.defenseFX[k]-worldDt);
    const midnightEnv=Q04_ENVIRONMENT.get(r.elapsed+worldDt);
    r.q04Environment=midnightEnv;
    if(worldDt>0&&midnightEnv.night){
      r.midnightSpawnClock-=worldDt;
      if(r.midnightSpawnClock<=0){
        const active=r.enemies.filter(e=>e.kind==='midnight'&&e.alive).length;
        if(active<6){
          const pos=placeOutsideCamera(g.camera,Math.random,{radius:18,margin:74,reach:100,attempts:80,player:r.player,minPlayerDistance:210,accept:(x,y)=>!r.enemies.some(e=>e.alive&&Math.hypot(e.x-x,e.y-y)<38)});
          if(pos){r.enemies.push(new Midnight(pos.x,pos.y,++r.enemyCounter,r.midnightPackId++));}
        }
        r.midnightSpawnClock=3.2+Math.random()*2.2;
      }
    }else if(!midnightEnv.night)r.midnightSpawnClock=1.4;
    r.elapsed+=worldDt;r.hitPulse=Math.max(0,r.hitPulse-worldDt);r.notice=Math.max(0,r.notice-worldDt);r.noticeTextTime=Math.max(0,r.noticeTextTime-dt);r.lootToastTime=Math.max(0,r.lootToastTime-dt);
    const axes=slow?{move:{x:0,y:0},aim:{x:0,y:0,active:false}}:this.input.getAxes(g.camera,r.player);
    let autoAimActive=false;
    // Manual aim (right stick, mouse or physical controls) always takes precedence.
    if(!slow&&this.autoFireEnabled&&!axes.aim.active&&g.controlMode==='touch'){
      const acquired=AutoFireTargeting.acquire(r,g.camera);
      this.autoTarget=acquired?.target||null;
      if(acquired){axes.aim=acquired.aim;autoAimActive=true;}
    }else this.autoTarget=null;
    const lastPlayerX=r.player.x,lastPlayerY=r.player.y;
    if(!axes.aim.active&&Math.hypot(axes.move.x,axes.move.y)>.11)r.player.facing=Math.atan2(axes.move.y,axes.move.x);
    if(r.player.specialRemaining>0){r.player.specialRemaining=Math.max(0,r.player.specialRemaining-worldDt);if(r.player.specialRemaining===0){pzSpecialEnded(r.player);r.player.specialCooldown=pzSpecialCooldown(r.player);}}
    else r.player.specialCooldown=Math.max(0,r.player.specialCooldown-worldDt);
    r.player.move(axes.move,worldDt);
    g.audio.setListener?.(r.player.x,r.player.y);
    if(!slow&&Math.hypot(r.player.x-lastPlayerX,r.player.y-lastPlayerY)>1){
      r.stepAudio=(r.stepAudio||0)+worldDt;
      if(r.stepAudio>.31){g.audio.effect('step',{x:r.player.x,y:r.player.y});r.stepAudio=0;}
    }else r.stepAudio=0;
    const previousWave=r.waves.wave,previousPhase=r.waves.phase;
    r.waves.update(worldDt,()=>this.spawnEnemy(),r.enemies.length);
    if(r.waves.wave!==previousWave||r.waves.phase!==previousPhase){
      r.notice=2.2;g.audio.effect('wave');
      if(r.waves.wave!==previousWave){
        g.events.emit('wave:new',r.waves.wave);
        g.notchFX?.onWave(r.waves.wave);
        this.scheduleBoss(r.waves.wave);
        if(r.waves.wave===2)r.dialogue.request(49);
        if(r.waves.wave===5)r.dialogue.request(50);
        if(r.waves.wave>=8)r.dialogue.request(53);
      }
    }
    r.navigation.update(r.player);
    r.spatial.rebuild(r.enemies);
    r.hordeTactics?.update(worldDt);
    const wasReloading=r.gun.reloadRemaining>0;
    r.gun.update(worldDt,r.player,r.player.medkitCharge>0?{x:0,y:0,active:false}:axes.aim,r.enemies,()=>{
      g.haptics?.pulse('shots');
      g.audio.effect(r.gun.model==='shotgun'?'shotgun':r.gun.model==='rifle'||r.gun.model==='sniper'?'rifleShot':'shot');
      r.hordeTactics?.shot(r.player);
      const fx=r.player.x+Math.cos(r.player.facing)*weaponMuzzleLength(r.gun.model);
      const fy=r.player.y+Math.sin(r.player.facing)*weaponMuzzleLength(r.gun.model);
      r.effects.emit(fx,fy,'shot',r.gun.model==='sniper'?14:3);
      const feel=weaponFeel(r.gun.model);
      r.player._recoil=feel.recoil;
      g.audio.body?.(r.gun.model);
      if(feel.eject==='fire')r.casings.spawn(r.player.x+Math.cos(r.player.facing)*7,r.player.y+Math.sin(r.player.facing)*7,r.player.facing,feel.casing);
      if(r.gun.model==='sniper'){
        // Recuo físico leve, independente de FPS; respeita paredes.
        const kick=slideCircle(r.player.x,r.player.y,-Math.cos(r.player.facing)*12,-Math.sin(r.player.facing)*12,r.player.radius);
        r.player.x=kick.x;r.player.y=kick.y;
        // Explosão curta de gases e faíscas, sem tremer a câmera inteira.
        r.effects.emit(fx,fy,'kill',12);
        r.effects.emit(fx+Math.cos(r.player.facing)*17,fy+Math.sin(r.player.facing)*17,'shot',8);
      }
    },(target,died,impact)=>{
      // No disparo de escopeta, vários chumbos atingem o mesmo zumbi num frame.
      // O dano de TODOS conta, mas a mixagem e o sangue não se multiplicam 9x.
      const repeatedPellet=impact.weapon==='shotgun'&&target._lastShotImpact===impact.shotId;
      if(impact.weapon==='shotgun')target._lastShotImpact=impact.shotId;
      if(!repeatedPellet||died){
        g.audio.effect(died?'kill':'hit');
        r.effects.emitBlood(impact.x,impact.y,impact.dx,impact.dy,died);
        r.effects.emit(target.x,target.y,died?'kill':'hit',died?3:1);
        if(impact.weapon==='sniper'){
          // Rastro direcional e explosão de impacto; amplifica apenas o visual.
          r.effects.emitBlood(impact.x,impact.y,impact.dx,impact.dy,true);
          r.effects.emit(impact.x,impact.y,'kill',died?16:9);
          if(died&&target.kind!=='midnight'){
            r.effects.emitSevered(target,impact.dx,impact.dy,Math.max(125,impact.damage),true);
            r.effects.emitBlood(target.x,target.y,impact.dx,impact.dy,true);
          }
        }else if(died&&target.kind!=='midnight')r.effects.emitSevered(target,impact.dx,impact.dy,Math.max(48,impact.damage),true);
      }
      const stop=weaponFeel(impact.weapon).stop;
      if(died&&stop>0&&!g.save.settings.reducedMotion&&r.elapsed-(r.lastHitStop??-9)>.3){r.hitStop=stop;r.lastHitStop=r.elapsed;}
      this.creditKill(target,died);
    },r.spatial,autoAimActive,r.barrels,barrel=>this.detonateBarrel(barrel),
       (ax,ay,bx,by,bullet)=>{
         const hit=r.destructibles.projectile(ax,ay,bx,by,bullet);
         // C4 · Héstia: marca de tiro e faísca onde a bala bate no cenário.
         if(hit){const mx=(ax+bx)/2,my=(ay+by)/2;r.worldFX?.bulletHole(mx,my);r.effects.emit(mx,my,'shot',2);}
         return hit;
       });
    if(!wasReloading&&r.gun.reloadRemaining>0){
      g.audio.effect('reload');
      const feel=weaponFeel(r.gun.model);
      if(feel.eject==='reload')r.casings.spawn(r.player.x,r.player.y,r.player.facing,feel.casing,r.gun.model==='shotgun'?2:6);
      else r.casings.spawn(r.player.x,r.player.y+4,r.player.facing,'mag',1); // C5 · Ártemis: pente vazio cai no chão
    }
    r.player._recoil=(r.player._recoil||0)*Math.exp(-worldDt*24);
    if(r.gun.ammo<=0&&r.gun.reserve<=0&&axes.aim.active)g.audio.effect('dryFire');
    // As criações de invocadores entram depois da atualização, sem modificar o iterador.
    r.pendingSpawns=[];
    const context=this.enemyContext();
    for(const enemy of r.enemies){
      if(!enemy.alive)continue;
      const previousX=enemy.x,previousY=enemy.y;
      const damage=enemy.update(worldDt,r.player,r.enemies,context);
      // Estimate enemy motion only for aiming the next shot, never existing bullets.
      if(worldDt>.00001){
        enemy._autoVX=(enemy.x-previousX)/worldDt;
        enemy._autoVY=(enemy.y-previousY)/worldDt;
      }
      if(damage&&!slow)g.audio.effect('zombieAttack',{x:enemy.x,y:enemy.y});
      // C6 · Atena: primeira onda 20% mais branda no fácil e no médio (aprendizado).
      const scaled=damage&&r.waves.wave===1&&r.difficulty!=='hardcore'?damage*.8:damage;
      if(scaled&&this.hurtPlayer(scaled,slow,enemy.kind))break;
    }
    if(r.pendingSpawns.length)r.enemies.push(...r.pendingSpawns);
    // C2 · Ares: a horda ocupa espaço — ninguém se empilha, nem parado junto ao jogador.
    if(worldDt>0)separateCrowd(r.enemies,r.spatial,worldDt);
    pzSurvivorUpdate(this,worldDt); // A4: socos do San, minas da Hanna, regeneração da Hadassa
    // Equipamentos usam a física e o sistema de dano reais (não afetam a câmera).
    r.gear?.update(worldDt,r,{
      onHit:(target,died,source)=>{
        r.effects.emitBlood(target.x,target.y,Math.cos(target.heading||0),Math.sin(target.heading||0),died);
        r.effects.emit(target.x,target.y,died?'kill':'hit',died?3:1);
        if(died&&target.kind!=='midnight')r.effects.emitSevered(target,source?.dx||1,source?.dy||0,source?.damage||30,source==='explosive');
        this.creditKill(target,died);
      },
      onExplode:(x,y,radius)=>{r.worldFX?.explosion(x,y,radius);g.audio.effect('explosion');r.effects.emit(x,y,'boss',Math.min(24,Math.round(radius/5)));},
      onSwing:()=>g.audio.effect('hit')
    });
    r.barrels?.update(worldDt);
    r.destructibles?.update(worldDt);
    r.enemyAttacks.update(worldDt,r.player,damage=>this.hurtPlayer(damage,slow));
    let grenadeKills=0;
    r.grenades.update(worldDt,r.enemies,(target,died)=>{
      if(died)grenadeKills++;
      g.audio.effect(died?'kill':'hit');r.effects.emit(target.x,target.y,died?'kill':'hit',died?9:4);if(died&&target.kind!=='midnight')r.effects.emitSevered(target,target.x-r.player.x,target.y-r.player.y,55,true);this.creditKill(target,died);
    },({x,y})=>{r.worldFX?.explosion(x,y,110);g.audio.effect('explosion');r.effects.emit(x,y,'boss',26);});
    if(grenadeKills>=3)r.dialogue.request(36);
    // Q.02.3: processa amputações após TODAS as fontes de dano da simulação.
    for(const e of r.enemies){
      if(!e.amputationEvents?.length)continue;
      for(const region of e.amputationEvents.splice(0)){
        r.effects.emitAmputatedLeg(e,e.hitDirX||1,e.hitDirY||0,region.endsWith('Arm')?'arm':'leg');
        r.effects.emitBlood(e.x,e.y,e.hitDirX||1,e.hitDirY||0,false);
      }
    }
    r.effects.update(worldDt);
    r.casings.update(worldDt);
    // C5 · Hermes: dicas de controle somem depois de 30 s de partida.
    document.getElementById('app')?.classList.toggle('pz-hint-gone',r.elapsed>30);
    // C6 · Atena: primeiro minuto guiado.
    if(!r._guide1&&r.elapsed>9){r._guide1=true;this.notify('OBJETIVO · SOBREVIVA ÀS ONDAS E JUNTE MUNIÇÃO E KITS',3);}
    if(!r._guide2&&r.waves.phase==='rest'){r._guide2=true;this.notify('INTERVALO · RECARREGUE, CURE-SE E EXPLORE',3);}
    // C5 · Ártemis: nome da arma aparece sobre o personagem ao trocar.
    if(r._lastModel===undefined)r._lastModel=r.gun.model;
    if(r._lastModel!==r.gun.model){r._lastModel=r.gun.model;r.swapLabel={text:r.gun.config.name,t:1.5};}
    if(r.swapLabel)r.swapLabel.t-=dt;
    r.worldFX.update(worldDt,r,g.camera,g.world,Q04_ENVIRONMENT.get(r.elapsed||0,true));
    r.enemies=r.enemies.filter(e=>e.alive&&!(e.kind==='midnight'&&e.retreating&&Math.hypot(e.x-r.player.x,e.y-r.player.y)>420));
    if(r.boss&&!r.boss.alive)r.boss=null;
    if(r.bossPending)this.trySpawnBoss();
    g.audio.updateThreats?.(worldDt,r.enemies,r.player,{slow,paused:g.previewPaused||Boolean(g.ui.modal)});
    g.audio.updateEnvironment?.(worldDt,Q04_ENVIRONMENT.get(r.elapsed),{paused:slow||r.backpackOpen||g.previewPaused||Boolean(g.ui.modal)});
    const pressure=Math.min(1,r.enemies.length/35);
    g.audio.setIntensity(pressure);
    const track=r.boss?.alive?'boss':pressure>.68?'horde':'field';
    g.audio.setMode(track);
    // Os recursos e fusíveis seguem o tempo do mundo, inclusive em câmera lenta.
    if(!r.backpackOpen&&r.player.updateMedkit(worldDt)){this.notify('VIDA RECUPERADA · KIT MÉDICO',1.6);g.audio.effect('pickup');}
    if(!r.backpackOpen&&r.player.updateShieldCharge(worldDt)){this.notify('ESCUDO +1 BARRA',1.5);g.audio.effect('pickup');}
    r.loot.update(worldDt,{player:r.player,gun:r.gun,grenades:r.grenades,wave:r.waves.wave,camera:g.camera,onPickup:result=>{
      this.notify(result.label,1.9);g.audio.effect(result.type==='ammo'?'ammo':'pickup');
      if(result.type==='heart'||result.type==='fullHeart')r.dialogue.request(46);
      if(result.type==='ammo')r.dialogue.request(47);
      if(result.type==='grenade')r.dialogue.request(48);
    }});
    const district=districtAt(r.player.x,r.player.y);
    if(district.id!==r.district.id){
      r.district=district;
      this.notify('ZONA DESCOBERTA · '+district.name,2.8);
      r.visited.add(district.id);
      const zoneLine={suburb:55,industry:56,highway:57}[district.id];
      if(zoneLine)r.dialogue.request(zoneLine);
    }
    if(!r.over&&!slow&&!g.previewPaused&&!g.ui.modal){
      // Só abre o registro quando um inimigo realmente fica visível, não ao gerá-lo fora da tela.
      for(const enemy of r.enemies){
        if(!enemy.alive||enemy.kind==='midnight')continue;
        const pos=g.camera.worldToScreen(enemy.x,enemy.y);
        if(pos.x>=28&&pos.y>=28&&pos.x<=g.camera.viewport.width-28&&pos.y<=g.camera.viewport.height-28){
          r.discovery.notice(enemy.kind);
        }
      }
      // C6 · Atena: o cartão de nova ameaça só abre numa pausa natural (início, intervalo
      // ou sem inimigo perto); antes disso, um aviso discreto não interrompe o combate.
      const nearest=r.enemies.reduce((m,e)=>e.alive?Math.min(m,Math.hypot(e.x-r.player.x,e.y-r.player.y)):m,1e9);
      const calm=r.elapsed<8||r.waves.phase==='rest'||nearest>280;
      if(!calm&&r.discovery.queue.length&&r._lastThreatNote!==r.discovery.queue[0]){
        r._lastThreatNote=r.discovery.queue[0];
        this.notify('NOVA AMEAÇA · '+(BESTIARY[r.discovery.queue[0]]?.name||'').toUpperCase()+' · REGISTRO NO INTERVALO',2.4);
      }
      if(calm&&r.discovery.activate()){
        this.input.clear();g.audio.effect('level');g.ui.render();
      }
    }
    if(!r.over&&!slow&&!r.discovery.selecting&&r.progress.pending>0){
      if(r.progress.beginChoice()){this.input.clear();g.audio.effect('level');g.ui.render();}
    }
    // Câmera estável: acompanha APENAS a posição do Antônio. Nunca usa facing,
    // que pode mudar dezenas de vezes por segundo com a mira automática.
    // O amortecimento é exponencial (independente da taxa de quadros), evitando
    // movimentos bruscos mesmo com hordas grandes e trocas rápidas de alvo.
    // C2 · Hefesto: câmera suave com antecipação na direção da mira manual
    // (nunca com a mira automática, que troca de alvo muitas vezes por segundo).
    const p=r.player,lookOn=axes.aim.active&&!autoAimActive&&!slow;
    const lookK=1-Math.exp(-dt*3.2);
    r.camLookX=(r.camLookX||0)+((lookOn?Math.cos(p.facing)*48:0)-(r.camLookX||0))*lookK;
    r.camLookY=(r.camLookY||0)+((lookOn?Math.sin(p.facing)*48:0)-(r.camLookY||0))*lookK;
    g.camera.setTarget(p.x+r.camLookX,p.y+r.camLookY);
    g.camera.follow(dt,7.5);
    r.dialogueState.lastPosX=lastPlayerX;r.dialogueState.lastPosY=lastPlayerY;
    if(r.waves.wave>g.save.characterProgress.bestWave)g.save.recordCharacterWave(r.waves.wave);
    this.observeDialogue(worldDt,axes,{blocked:slow||g.previewPaused||Boolean(g.ui.modal)});
    g.notchFX?.update(r);
    g.ui.updateHUD(r);
  }
  closeDiscovery(){
    const r=this.run;
    if(!r?.discovery.selecting)return false;
    r.discovery.close();this.input?.clear();this.game.ui.render();this.game.ui.updateHUD(r);
    return true;
  }
  finishRun(){
    const r=this.run;if(r.over)return;r.over=true;
    if(!r.recorded){this.game.save.registerRun({difficulty:r.difficulty,wave:r.waves.wave,seconds:Math.floor(r.elapsed),kills:r.kills});r.recorded=true;}
    r.dialogue?.hide();this.game.notchFX?.clear();this.input?.clear();this.game.audio.effect('death');this.game.audio.stopMusic();this.game.ui.render();
  }
  render(ctx,viewport){
    const g=this.game,r=this.run;
    PZ_AUTO_QUALITY.frame(g,this); // C6 · Hefesto: qualidade automática
    ctx.save();
    const wobble=r.effects.offset(g.save.settings.reducedMotion);ctx.translate(wobble.x,wobble.y);
    g.world.draw(ctx,g.camera,{wave:r.waves.wave,progress:r.waves.phase==='wave'?r.waves.progress:1,elapsed:r.elapsed});
    ctx.save();g.camera.apply(ctx);
    r.destructibles?.draw(ctx,g.assets,g.camera);
    r.effects.drawUnder(ctx);
    const diag=window.__PZ_DIAG||{};
    if(diag.fx!==false)r.worldFX?.drawGround(ctx,g.camera);
    r.casings?.draw(ctx);
    r.barrels?.drawUnder(ctx,g.assets,g.camera);
    r.gear?.drawUnder(ctx);
    r.loot.draw(ctx,g.camera,g.assets);
    r.grenades.draw(ctx);
    r.enemyAttacks.draw(ctx);
    r.gun.draw(ctx);
    // Q.02.2 R2: efeitos e membros no solo ficam ATRÁS dos personagens.
    // O personagem deve caminhar por cima dos restos, nunca por baixo deles.
    r.effects.drawOver(ctx);
    pzSurvivorDrawUnder(ctx,r);
    pzDrawTelegraphs(ctx,r); // C6 · Ares: avisos de ataque e fases do chefe
    const drawables=[...r.enemies,r.player].sort((a,b)=>a.y-b.y);
    for(const entity of drawables){
      // Skip entities entirely outside the current viewport with generous padding.
      const screen=g.camera.worldToScreen(entity.x,entity.y);
      if(screen.x<-105||screen.y<-105||screen.x>viewport.width+105||screen.y>viewport.height+105)continue;
      if(entity===r.player&&r.player._recoil>.05){
        // Recuo visual do sprite (não altera a posição real nem a câmera).
        ctx.save();ctx.translate(-Math.cos(r.player.facing)*r.player._recoil,-Math.sin(r.player.facing)*r.player._recoil);
        entity.draw(ctx,g.assets);ctx.restore();
      }else entity.draw(ctx,g.assets);
    }
    pzSurvivorDrawOver(ctx,r);
    pzDrawReloadAndSwap(ctx,r);
    r.gun.drawFlashes(ctx,r.q04Environment?.dark||0);
    if(diag.fx!==false)r.worldFX?.drawAir(ctx,g.camera);
    // Números de dano no espaço do mundo, desenhados acima dos personagens.
    // Mantidos inclusive no instante da morte, enquanto o inimigo ainda está no array.
    const now=performance.now();
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 13px monospace';
    for(let i=DAMAGE_POPUPS.length-1;i>=0;i--){
        const p=DAMAGE_POPUPS[i],elapsed=(now-p.at)/1000;
        if(elapsed>=.95){DAMAGE_POPUPS.splice(i,1);continue;}
        const alpha=Math.min(1,(.95-elapsed)/.23);
        if(g.save.settings.damageNumbers===false)continue;
        const value=Math.round(p.amount*10)/10;
        const label=p.headshot?'CRÍTICO '+String(value):String(value);
        const x=Math.round(p.x+p.offset),y=Math.round(p.y-22-elapsed*32);
        ctx.globalAlpha=alpha;
        ctx.lineWidth=3;ctx.strokeStyle='#171919';ctx.strokeText(label,x,y);
        ctx.fillStyle=p.headshot?'#ffb4a4':'#ffe1a0';ctx.fillText(label,x,y);
    }
    ctx.restore();
    r.barrels?.drawOver(ctx);
    r.gear?.drawOver(ctx);
    r.killFeedback?.drawWorld(ctx);
    ctx.restore();
    if(!g.save.settings.reducedMotion&&g.save.settings.shadowsQuality!=='low')g.ambience.draw(ctx,viewport,g.camera,g.world,'combat');
    ctx.restore();
    if(diag.env!==false){Q04_ENVIRONMENT.draw(ctx,viewport,r,g.camera,g.world);
    Q04_SUNLIGHT.draw(ctx,viewport,r,g.camera,g.world);}
    // C3 · Apolo: escuridão real + recortes de luz; depois o brilho colorido dos postes/fogo; depois feixe e gradação.
    PZ_LIGHTMAP.draw(ctx,viewport,r,g.camera,g.world);
    if(diag.env!==false)Q04_LIGHTING.draw(ctx,viewport,r,g.camera,g.world);
    if(diag.fx!==false)r.worldFX?.drawReflections(ctx,g.camera,g.world,r,PZ_LIGHTMAP.env?.dark||0,PZ_LIGHTMAP.flashOn||0);
    if(diag.fx!==false)r.worldFX?.drawGlow(ctx,g.camera);
    PZ_LIGHTMAP.drawAfter(ctx,viewport,r,g.camera);
    pzDrawThreatIndicators(ctx,viewport,r,g.camera);
    const grad=ctx.createLinearGradient(0,0,0,viewport.height);
    grad.addColorStop(0,'rgba(3,17,25,.26)');grad.addColorStop(.38,'rgba(3,17,25,0)');grad.addColorStop(1,'rgba(3,17,25,.12)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,viewport.width,viewport.height);
    r.killFeedback?.drawHUD(ctx,viewport.width,viewport.height);
    if(r.hitPulse>0){ctx.fillStyle=`rgba(231,85,88,${r.hitPulse*.28})`;ctx.fillRect(0,0,viewport.width,viewport.height);}
    // Q.05.7: sinais distintos de absorção, quebra, cura e recarga, sem interferir no dano.
    const fx=r.player.defenseFX||{};
    ctx.save();
    if(fx.shield>0){ctx.strokeStyle=`rgba(91,193,255,${Math.min(.8,fx.shield*1.8)})`;ctx.lineWidth=8;ctx.strokeRect(4,4,viewport.width-8,viewport.height-8);}
    if(fx.break>0){ctx.strokeStyle=`rgba(255,210,95,${fx.break*.72})`;ctx.lineWidth=12;ctx.setLineDash([20,13]);ctx.strokeRect(11,11,viewport.width-22,viewport.height-22);ctx.setLineDash([]);}
    if(fx.heal>0||fx.cell>0){const healing=fx.heal>0;const t=healing?fx.heal:fx.cell;ctx.fillStyle=healing?`rgba(77,226,151,${t*.09})`:`rgba(76,177,255,${t*.10})`;ctx.fillRect(0,0,viewport.width,viewport.height);}
    ctx.restore();
  }
  exit(){document.getElementById('app')?.classList.remove('pz-hint-gone');window.__PROJECT_Z_CLIMATE_PREVIEW__=null;this.run?.destructibles?.clear();this.input?.destroy();this.input=null;this.run=null;ACTIVE_BARREL_OBSTACLES=[];this.autoFireEnabled=false;this.autoTarget=null;this.game.canvas.classList.remove('is-interactive');}
}

function specialWeaponIcon(branch,tier){
  const glyph=branch==='melee'?(tier===1?'⚔':tier===2?'╱':'⚒'):branch==='traps'?(tier===1?'▣':tier===2?'▤':'◈'):(tier===1?'▥':tier===2?'⌖':'⊞');
  return `<span class="survival-icon survival-${branch}" aria-hidden="true">${glyph}</span>`;
}

