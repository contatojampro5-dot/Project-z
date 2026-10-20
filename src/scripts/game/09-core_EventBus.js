// -- src/core/EventBus.js --
class EventBus {
  #listeners = new Map();
  on(name, callback) {
    if (!this.#listeners.has(name)) this.#listeners.set(name, new Set());
    this.#listeners.get(name).add(callback);
    return () => this.off(name, callback);
  }
  off(name, callback) {
    this.#listeners.get(name)?.delete(callback);
    if (this.#listeners.get(name)?.size === 0) this.#listeners.delete(name);
  }
  emit(name, payload) {
    for (const callback of this.#listeners.get(name) ?? []) callback(payload);
  }
  clear() { this.#listeners.clear(); }
}

