// Compatibilidad con teclado: Tab o flechas mueven el foco entre botones,
// Enter o Espacio activan el botón enfocado.
export class FocusManager {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.current = null;
    this.onKey = (e) => this.handle(e);
    scene.input.keyboard.on('keydown', this.onKey);
    scene.events.once('shutdown', () => {
      scene.input.keyboard.off('keydown', this.onKey);
      this.items = [];
      this.current = null;
    });
  }

  add(item) { this.items.push(item); }

  usable(item) {
    if (!item.active || !item.enabled) return false;
    for (let o = item; o; o = o.parentContainer) if (!o.visible) return false;
    return true;
  }

  handle(e) {
    if (this.scene._leaving) return;
    const k = e.key;
    if (k === 'Tab' || k === 'ArrowRight' || k === 'ArrowDown') {
      e.preventDefault(); this.move(k === 'Tab' && e.shiftKey ? -1 : 1);
    } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
      e.preventDefault(); this.move(-1);
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (this.current && this.usable(this.current)) this.current.activate();
      else if (this.scene.onDefaultAction) this.scene.onDefaultAction();
    } else if (k === 'Escape' && this.scene.onCancel) {
      this.scene.onCancel();
    }
  }

  move(dir) {
    const list = this.items.filter((i) => this.usable(i));
    if (!list.length) return;
    const idx = list.indexOf(this.current);
    const next = list[idx === -1 ? (dir > 0 ? 0 : list.length - 1) : (idx + dir + list.length) % list.length];
    this.focus(next);
  }

  focus(item) {
    if (this.current && this.current.active) this.current.setFocused(false);
    this.current = item;
    if (item) item.setFocused(true);
  }

  clear() { this.focus(null); }
}
