// Caneca en pantalla: destino de arrastre, botón táctil y elemento enfocable con teclado.
import Phaser from 'phaser';
import { theme } from '../config/theme.js';
import { label, panel } from '../ui/widgets.js';

const HEX = { white: '#1565C0', black: '#23272D', green: '#0F6A3A' };

export class BinTarget extends Phaser.GameObjects.Container {
  constructor(scene, x, y, bin, onChoose) {
    super(scene, x, y);
    this.bin = bin;
    this.enabled = true;
    this.onChoose = onChoose;
    this.homeY = y;

    // Resplandor de pista (se enciende cuando el jugador necesita ayuda).
    this.glow = scene.add.ellipse(0, -90, 430, 470, theme.c.yellow, 0.55).setVisible(false);
    this.ring = scene.add.graphics();
    this.ring.lineStyle(10, theme.c.yellow, 1); this.ring.strokeRoundedRect(-205, -280, 410, 545, 50);
    this.ring.lineStyle(4, theme.c.ink, 1); this.ring.strokeRoundedRect(-211, -286, 422, 557, 54);
    this.ring.setVisible(false);

    this.shadow = scene.add.ellipse(0, 86, 300, 50, 0x000000, 0.2);
    this.image = scene.add.image(0, 84, `bin-${bin.id}`).setOrigin(0.5, 1).setDisplaySize(290, 348);
    const plate = panel(scene, 0, 178, 380, 150, { radius: 40, stroke: bin.accent, strokeWidth: 7 });
    const name = label(scene, 0, 148, bin.name, { size: 46, color: HEX[bin.id] });
    const title = label(scene, 0, 204, bin.title, { size: 32, color: theme.hex.ink, bold: false });
    this.add([this.glow, this.ring, this.shadow, this.image, plate, name, title]);

    this.setSize(400, 530);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.setHover(true));
    this.on('pointerout', () => this.setHover(false));
    this.on('pointerup', () => this.activate());
    scene.add.existing(this);
    if (scene.focus) scene.focus.add(this);
  }

  // Boca de la caneca en coordenadas de la escena (a donde vuela el residuo).
  get mouth() { return { x: this.x, y: this.y - 250 }; }

  contains(px, py) {
    return Math.abs(px - this.x) < 200 && py > this.y - 320 && py < this.y + 270;
  }

  setHover(on) {
    if (this._hover === on) return;
    this._hover = on;
    this.scene.tweens.add({ targets: this.image, scaleX: this.baseScale().x * (on ? 1.08 : 1), scaleY: this.baseScale().y * (on ? 1.08 : 1), duration: 120 });
  }

  baseScale() {
    if (!this._base) this._base = { x: this.image.scaleX, y: this.image.scaleY };
    return this._base;
  }

  setFocused(on) {
    this.ring.setVisible(on);
    this.setHover(on);
  }

  setHint(on) {
    if (this.hintTween) { this.hintTween.remove(); this.hintTween = null; }
    this.glow.setVisible(on).setAlpha(0.55).setScale(1);
    if (on) this.hintTween = this.scene.tweens.add({ targets: this.glow, alpha: 0.15, scale: 1.08, duration: 520, yoyo: true, repeat: -1 });
  }

  // La caneca "traga" con un rebote, o niega con una sacudida.
  react(correct) {
    const b = this.baseScale();
    this.image.setScale(b.x, b.y);
    this._hover = false;
    if (correct) {
      this.scene.tweens.add({ targets: this.image, scaleY: b.y * 0.86, scaleX: b.x * 1.1, duration: 110, yoyo: true, ease: 'Quad.out' });
    } else {
      this.scene.tweens.add({ targets: this, x: this.x + 14, duration: 55, yoyo: true, repeat: 3 });
    }
  }

  activate() {
    if (this.enabled) this.onChoose(this.bin.id);
  }
}
