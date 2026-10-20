// -- src/rendering/Renderer.js --

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!this.ctx) throw new Error('Canvas 2D indisponível neste navegador.');
    this.width = 1; this.height = 1; this.dpr = 1;
    this.resize();
  }
  resize() {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, GAME.maxDevicePixelRatio);
    const w = Math.round(width * dpr), h = Math.round(height * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
    this.width=width;this.height=height;this.dpr=dpr;
    this.ctx.imageSmoothingEnabled=false;
  }
  begin() {
    const ctx=this.ctx;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#090b0e';ctx.fillRect(0,0,this.width,this.height);
    return ctx;
  }
}

