// -- src/core/SceneManager.js --
class SceneManager {
  constructor(context) { this.context = context; this.scenes = new Map(); this.current = null; this.name = null; }
  register(name, scene) { this.scenes.set(name, scene); return this; }
  go(name, params = {}) {
    const next = this.scenes.get(name);
    if (!next) throw new Error(`Cena inexistente: ${name}`);
    this.current?.exit?.();
    this.name = name;
    this.current = next;
    next.enter?.(params, this.context);
  }
  update(dt) { this.current?.update?.(dt); }
  render(ctx, viewport) { this.current?.render?.(ctx, viewport); }
  dispose() { this.current?.exit?.(); this.scenes.clear(); }
}

