// -- src/systems/AssetManager.js --
class AssetManager {
  constructor(manifest = {}) { this.manifest = manifest; this.images = new Map(); this.failures = []; }
  async preload(onProgress = () => {}) {
    const entries = Object.entries(this.manifest);
    if (!entries.length) { onProgress(1); return; }
    let count = 0;
    await Promise.all(entries.map(async ([key, url]) => {
      try {
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
        if (img.decode) await img.decode();
        else await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        this.images.set(key, img);
      } catch (error) { this.failures.push({ key, url, error }); }
      onProgress(++count / entries.length);
    }));
  }
  get(key) { return this.images.get(key) ?? null; }
  has(key) { return this.images.has(key); }
}

