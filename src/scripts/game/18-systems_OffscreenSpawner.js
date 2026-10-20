// -- src/systems/OffscreenSpawner.js --
// A câmera, não a posição do jogador, determina o que está sendo mostrado.
// Todos os tipos de entidade reutilizam o mesmo teste — inclusive em widescreen.
function isOutsideCamera(x,y,camera,margin=0){
  if(!camera||!camera.viewport||camera.zoom<=0)return false;
  const halfW=camera.viewport.width/(2*camera.zoom);
  const halfH=camera.viewport.height/(2*camera.zoom);
  return Math.abs(x-camera.x)>halfW+margin||Math.abs(y-camera.y)>halfH+margin;
}
function placeOutsideCamera(camera,random=Math.random,{radius=15,margin=48,reach=115,attempts=100,player=null,minPlayerDistance=0,accept=()=>true}={}){
  if(!camera||!camera.viewport||camera.zoom<=0)return null;
  const halfW=camera.viewport.width/(2*camera.zoom);
  const halfH=camera.viewport.height/(2*camera.zoom);
  const bounds=GAME.map;
  // Amostragem no perímetro (não num anel ao redor do jogador). Assim a posição
  // acompanha zoom, tamanho da tela e câmera suavizada, mesmo nas bordas do mapa.
  for(let i=0;i<attempts;i++){
    const side=Math.floor(random()*4);
    const offset=margin+radius+12+random()*reach;
    const along=random()*1.9-.95;
    const x=side===0?camera.x-halfW-offset:side===1?camera.x+halfW+offset:camera.x+along*halfW;
    const y=side===2?camera.y-halfH-offset:side===3?camera.y+halfH+offset:camera.y+along*halfH;
    if(x<radius+5||y<radius+5||x>bounds.width-radius-5||y>bounds.height-radius-5)continue;
    if(!isOutsideCamera(x,y,camera,margin+radius))continue;
    if(player&&Math.hypot(x-player.x,y-player.y)<minPlayerDistance)continue;
    if(!canOccupy(x,y,radius)||!accept(x,y))continue;
    return {x,y};
  }
  // Não forçamos uma posição visível em caso de mapa congestionado.
  return null;
}

