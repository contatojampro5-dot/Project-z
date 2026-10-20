// -- src/rendering/Camera.js --

class Camera {
  constructor(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.x = worldWidth / 2;
    this.y = worldHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.zoom = 1;
    this.viewport = { width: 1, height: 1 };
  }
  resize(width, height, scene = 'menu') {
    this.viewport = { width, height };
    // Ajusta campo de visão ao tamanho real da tela sem distorcer o mapa.
    const portrait = height > width;
    this.zoom = portrait ? clamp(width / 440, 0.68, 1.05) : clamp(width / 850, 0.75, 1.65);
    if (scene === 'menu' && portrait) this.zoom *= 1.15;
    this.setTarget(this.targetX, this.targetY);
    this.clampCurrent();
  }
  clampPosition(x, y) {
    const halfW = this.viewport.width / (this.zoom * 2);
    const halfH = this.viewport.height / (this.zoom * 2);
    const xMin = Math.min(halfW, this.worldWidth / 2), xMax = Math.max(this.worldWidth - halfW, this.worldWidth / 2);
    const yMin = Math.min(halfH, this.worldHeight / 2), yMax = Math.max(this.worldHeight - halfH, this.worldHeight / 2);
    return { x: clamp(x, xMin, xMax), y: clamp(y, yMin, yMax) };
  }
  setTarget(x, y) { this.targetX = x; this.targetY = y; }
  jumpTo(x, y) { this.setTarget(x, y); this.x = this.targetX; this.y = this.targetY; }
  clampCurrent() { /* A câmera pode mostrar cenário além do limite jogável. */ }
  update(dt, smoothness = 4.2) {
    this.x = this.targetX;
    this.y = this.targetY;
  }
  // C2 · Hefesto: seguimento suave (exponencial, independente da taxa de quadros).
  follow(dt, rate = 7) {
    const k = 1 - Math.exp(-Math.max(0, dt) * rate);
    this.x += (this.targetX - this.x) * k;
    this.y += (this.targetY - this.y) * k;
  }
  worldToScreen(wx, wy) { return { x: (wx - this.x) * this.zoom + this.viewport.width / 2, y: (wy - this.y) * this.zoom + this.viewport.height / 2 }; }
  screenToWorld(sx, sy) { return { x: (sx - this.viewport.width / 2) / this.zoom + this.x, y: (sy - this.viewport.height / 2) / this.zoom + this.y }; }
  apply(ctx) { ctx.translate(this.viewport.width / 2, this.viewport.height / 2); ctx.scale(this.zoom, this.zoom); ctx.translate(-this.x, -this.y); }
}

