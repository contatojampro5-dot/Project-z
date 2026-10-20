// -- src/input/DualStickInput.js --
// Dois controles independentes, cada um captura seu próprio pointerId.
// Keyboard + mouse are development/fallback controls on desktop.
class DualStickInput {
  constructor(root, canvas){
    this.root=root;this.canvas=canvas;
    this.state={move:{x:0,y:0},aim:{x:0,y:0,active:false}};
    this.pointers={move:null,aim:null};this.keys=new Set();
    this.onDown=e=>this.pointerDown(e);this.onMove=e=>this.pointerMove(e);this.onUp=e=>this.pointerUp(e);
    this.onKeyDown=e=>this.keyDown(e);this.onKeyUp=e=>this.keyUp(e);
    this.onMouseMove=e=>this.mouseMove(e);this.onMouseDown=e=>this.mouseDown(e);
    this.onMouseUp=e=>this.mouseUp(e);this.onBlur=()=>this.clear();
    root.addEventListener('pointerdown',this.onDown);
    window.addEventListener('pointermove',this.onMove);window.addEventListener('pointerup',this.onUp);
    window.addEventListener('pointercancel',this.onUp);
    window.addEventListener('keydown',this.onKeyDown);window.addEventListener('keyup',this.onKeyUp);
    canvas.addEventListener('pointermove',this.onMouseMove);
    canvas.addEventListener('pointerdown',this.onMouseDown);
    window.addEventListener('pointerup',this.onMouseUp);
    window.addEventListener('blur',this.onBlur);
    this.mouseFiring=false;this.mousePoint=null;this.lastAim={x:0,y:-1};this.gamepad=null;
  }
  pointerDown(e){
    const zone=e.target.closest('[data-stick]');
    if(!zone||!this.root.contains(zone))return;
    const type=zone.dataset.stick;
    if(this.pointers[type]!==null)return;
    e.preventDefault();this.pointers[type]=e.pointerId;
    try{zone.setPointerCapture(e.pointerId);}catch{}
    this.updateStick(type,e.clientX,e.clientY);
  }
  pointerMove(e){
    for(const type of ['move','aim'])if(this.pointers[type]===e.pointerId){e.preventDefault();this.updateStick(type,e.clientX,e.clientY);}
  }
  pointerUp(e){for(const type of ['move','aim'])if(this.pointers[type]===e.pointerId){this.pointers[type]=null;this.state[type]={x:0,y:0,...(type==='aim'?{active:false}:{})};this.drawKnob(type,0,0);}}
  updateStick(type,clientX,clientY){
    const zone=this.root.querySelector(`[data-stick="${type}"]`);if(!zone)return;
    const rect=zone.getBoundingClientRect();const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const maximum=rect.width*.31;const dx=clientX-cx,dy=clientY-cy;
    const distance=Math.hypot(dx,dy)||1,power=Math.min(1,distance/maximum);
    const ax=distance<maximum*.14?0:dx/distance*power,ay=distance<maximum*.14?0:dy/distance*power;
    this.state[type]={x:ax,y:ay,...(type==='aim'?{active:Math.hypot(ax,ay)>.001}:{})};
    this.drawKnob(type,ax,ay);
  }
  drawKnob(type,x,y){const knob=this.root.querySelector(`[data-knob="${type}"]`);if(knob)knob.style.transform=`translate(${(x*34).toFixed(1)}px,${(y*34).toFixed(1)}px)`;}
  keyDown(e){
    if(e.target.closest?.('button,input,textarea,select,[contenteditable]'))return;
    if([...Object.values(window.__projectZGame?.save?.settings?.keybinds||KEYBIND_DEFAULTS),'ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space','KeyI','KeyJ','KeyK','KeyL'].includes(e.code)){
      e.preventDefault();this.keys.add(e.code);
    }
  }
  keyUp(e){this.keys.delete(e.code);}
  mouseMove(e){if(e.pointerType==='touch')return;const g=window.__projectZGame;if(g){g.controlMode='mouse';g.root.closest('.app')?.classList.remove('pz-pad-mode');}this.mousePoint={x:e.clientX,y:e.clientY};}
  mouseDown(e){if(e.pointerType!=='mouse'||e.button!==0)return;const g=window.__projectZGame;if(g){g.controlMode='mouse';g.root.closest('.app')?.classList.remove('pz-pad-mode');}this.mouseFiring=true;this.mousePoint={x:e.clientX,y:e.clientY};}
  mouseUp(e){if(e.pointerType!=='mouse')return;this.mouseFiring=false;}
  getAxes(camera,player){
    let move=this.state.move;
    if(this.pointers.move===null){
      let x=Number(this.keys.has(keyFor('right'))||this.keys.has('ArrowRight'))-Number(this.keys.has(keyFor('left'))||this.keys.has('ArrowLeft'));
      let y=Number(this.keys.has(keyFor('down'))||this.keys.has('ArrowDown'))-Number(this.keys.has(keyFor('up'))||this.keys.has('ArrowUp'));
      if(x||y){const l=Math.hypot(x,y);x/=l;y/=l;move={x,y};}
    }
    let aim=this.state.aim;
    const pad=window.__projectZGame?.gamepad?.axes();
    if(this.pointers.move===null&&pad?.move&&Math.hypot(pad.move.x,pad.move.y)>.07)move=pad.move;
    const kx=Number(this.keys.has('KeyL'))-Number(this.keys.has('KeyJ'));
    const ky=Number(this.keys.has('KeyK'))-Number(this.keys.has('KeyI'));
    if(this.pointers.aim===null&&(kx||ky)){
      const m=Math.hypot(kx,ky);aim={x:kx/m,y:ky/m,active:true,fire:false};this.lastAim={x:aim.x,y:aim.y};
    }else if(this.pointers.aim===null&&pad?.aim?.active){
      aim=pad.aim;this.lastAim={x:aim.x,y:aim.y};
    }
    if(this.pointers.aim===null&&this.mousePoint&&window.__projectZGame?.controlMode!=='pad'){
      const rect=this.canvas.getBoundingClientRect();
      const target=camera.screenToWorld(this.mousePoint.x-rect.left,this.mousePoint.y-rect.top);
      const dx=target.x-player.x,dy=target.y-player.y,l=Math.hypot(dx,dy)||1;
      aim={x:dx/l,y:dy/l,active:true,fire:this.mouseFiring};this.lastAim={x:aim.x,y:aim.y};
    }
    if(this.pointers.aim===null&&pad?.aim?.active)aim={...pad.aim,fire:pad.firing};
    return {move,aim};
  }
  clear(){this.pointers.move=this.pointers.aim=null;this.state.move={x:0,y:0};this.state.aim={x:0,y:0,active:false};this.keys.clear();this.mouseFiring=false;this.drawKnob('move',0,0);this.drawKnob('aim',0,0);}
  destroy(){this.clear();this.root.removeEventListener('pointerdown',this.onDown);window.removeEventListener('pointermove',this.onMove);window.removeEventListener('pointerup',this.onUp);window.removeEventListener('pointercancel',this.onUp);window.removeEventListener('keydown',this.onKeyDown);window.removeEventListener('keyup',this.onKeyUp);this.canvas.removeEventListener('pointermove',this.onMouseMove);this.canvas.removeEventListener('pointerdown',this.onMouseDown);window.removeEventListener('pointerup',this.onMouseUp);window.removeEventListener('blur',this.onBlur);}
}

