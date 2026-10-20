// -- src/core/GameLoop.js --
class GameLoop {
  constructor({ update, render, step = 1 / 60, maxDelta = 0.1 }) {
    this.update = update;
    this.render = render;
    this.step = step;
    this.maxDelta = maxDelta;
    this.accumulator = 0;
    this.previous = null;
    this.frame = null;
    this.running = false;
    this.paused = false;
    this.tick = this.tick.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.previous = null;
    this.frame = requestAnimationFrame(this.tick);
  }
  tick(timeMs) {
    if (!this.running) return;
    const now = timeMs / 1000;
    const delta = this.previous === null ? 0 : Math.min(now - this.previous, this.maxDelta);
    this.previous = now;
    const profile=typeof this.onFrame==='function';
    const started=profile?performance.now():0;
    let updates=0;
    if (!this.paused) {
      this.accumulator += Math.max(0, delta);
      while (this.accumulator >= this.step && updates < 8) {
        this.update(this.step);
        this.accumulator -= this.step;
        updates++;
      }
      if (updates === 8) this.accumulator = 0;
    } else this.accumulator = 0;
    const renderStart=profile?performance.now():0;
    this.render(this.accumulator / this.step);
    if(profile)this.onFrame({timestamp:timeMs,logicMs:renderStart-started,renderMs:performance.now()-renderStart,updates,paused:this.paused});
    this.frame = requestAnimationFrame(this.tick);
  }
  setPaused(paused) {
    this.paused = Boolean(paused);
    this.accumulator = 0;
    this.previous = null;
  }
  stop() {
    this.running = false;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.previous = null;
  }
}

