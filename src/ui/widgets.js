// Piezas básicas de interfaz: texto, paneles, botones, avisos y fichas del HUD.
import Phaser from 'phaser';
import { theme, W } from '../config/theme.js';
import { audio } from '../core/AudioManager.js';

export function label(scene, x, y, text, opts = {}) {
  const o = { size: 40, color: theme.hex.ink, bold: true, align: 'center', origin: 0.5, wrap: 0, stroke: null, strokeThickness: 0, ...opts };
  const style = {
    fontFamily: theme.font, fontSize: `${o.size}px`, fontStyle: o.bold ? 'bold' : 'normal',
    color: o.color, align: o.align, padding: { top: 8, bottom: 4, left: 4, right: 4 },
  };
  if (o.wrap) style.wordWrap = { width: o.wrap };
  if (o.stroke) { style.stroke = o.stroke; style.strokeThickness = o.strokeThickness || 8; }
  const t = scene.add.text(x, y, text, style);
  if (Array.isArray(o.origin)) t.setOrigin(o.origin[0], o.origin[1]); else t.setOrigin(o.origin);
  if (o.lineSpacing) t.setLineSpacing(o.lineSpacing);
  return t;
}

export function darker(color, amount = 28) {
  return Phaser.Display.Color.IntegerToColor(color).darken(amount).color;
}

// Panel redondeado con sombra suave.
export function panel(scene, x, y, w, h, { fill = theme.c.cream, stroke = theme.c.ink, radius = 44, strokeWidth = 6, shadow = true } = {}) {
  const g = scene.add.graphics({ x, y });
  if (shadow) { g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-w / 2 + 6, -h / 2 + 14, w, h, radius); }
  g.fillStyle(fill, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  if (strokeWidth) { g.lineStyle(strokeWidth, stroke, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius); }
  return g;
}

const DEPTH = 12; // "grosor" del botón 3D

// Botón grande con relieve. Funciona con ratón, toque y teclado.
export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts = {}) {
    super(scene, x, y);
    const o = {
      width: 360, height: 110, color: theme.c.green, label: '', icon: null, iconSize: 0,
      fontSize: 46, textColor: '#FFFFFF', radius: 40, sound: 'click', onClick: null, ...opts,
    };
    this.o = o;
    this.enabled = true;
    const w = o.width, h = o.height, r = Math.min(o.radius, h / 2);
    const dark = darker(o.color);

    this.ring = scene.add.graphics();
    this.ring.lineStyle(10, theme.c.yellow, 1);
    this.ring.strokeRoundedRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + DEPTH + 24, r + 12);
    this.ring.lineStyle(4, theme.c.ink, 1);
    this.ring.strokeRoundedRect(-w / 2 - 18, -h / 2 - 18, w + 36, h + DEPTH + 36, r + 18);
    this.ring.setVisible(false);

    const base = scene.add.graphics();
    base.fillStyle(dark, 1); base.fillRoundedRect(-w / 2, -h / 2 + DEPTH, w, h, r);

    this.face = scene.add.container(0, 0);
    const g = scene.add.graphics();
    g.fillStyle(o.color, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    if (r < Math.min(w, h) / 2 || h <= 130) { // brillo superior (no cabe dentro de un botón circular grande)
      g.fillStyle(0xffffff, 0.2); g.fillRoundedRect(-w / 2 + 12, -h / 2 + 8, w - 24, Math.min(h * 0.36, 60), Math.max(8, r - 12));
    } else {
      g.fillStyle(0xffffff, 0.22); g.fillEllipse(-w * 0.16, -h * 0.3, w * 0.34, h * 0.14);
    }
    g.lineStyle(5, dark, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    this.face.add(g);

    const iconSize = o.icon ? (o.iconSize || Math.min(h * 0.62, 90)) : 0;
    let text = null;
    if (o.label) {
      text = label(scene, 0, 0, o.label, { size: o.fontSize, color: o.textColor, stroke: '#00000033', strokeThickness: 0 });
      text.setShadow(0, 3, 'rgba(0,0,0,0.25)', 0, false, true);
    }
    const gap = o.icon && text ? 18 : 0;
    const total = iconSize + gap + (text ? text.width : 0);
    if (o.icon) {
      this.icon = scene.add.image(-total / 2 + iconSize / 2, 0, o.icon).setDisplaySize(iconSize, iconSize);
      this.face.add(this.icon);
    }
    if (text) { text.x = -total / 2 + iconSize + gap + text.width / 2; this.face.add(text); this.text = text; }

    this.add([this.ring, base, this.face]);
    this.setSize(w, h + DEPTH);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => this.hover(true));
    this.on('pointerout', () => { this.face.y = 0; this.hover(false); });
    this.on('pointerdown', () => { if (this.enabled) this.face.y = DEPTH - 3; });
    this.on('pointerup', () => { if (this.face.y > 0) { this.face.y = 0; this.activate(); } });

    scene.add.existing(this);
    if (scene.focus) scene.focus.add(this);
  }

  hover(on) {
    if (!this.enabled) return;
    this.scene.tweens.add({ targets: this, scale: on ? 1.05 : 1, duration: 120, ease: 'Sine.out' });
  }

  setFocused(on) {
    this.ring.setVisible(on);
    this.hover(on);
  }

  setEnabled(on) {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.5);
    return this;
  }

  activate() {
    if (!this.enabled) return;
    audio.sfx(this.o.sound);
    if (this.o.onClick) this.o.onClick(this);
  }
}

// Aviso breve en la parte superior (con el personaje que lo dice, si se indica).
export function toast(scene, message, { who = null, duration = 3200 } = {}) {
  if (scene._toast) scene._toast.destroy();
  const c = scene.add.container(W / 2, -160).setDepth(1000);
  const text = label(scene, who ? 60 : 0, 0, message, { size: 38, wrap: 900 });
  const w = Math.max(520, text.width + (who ? 240 : 100)), h = Math.max(130, text.height + 50);
  c.add(panel(scene, 0, 0, w, h, { radius: 50 }));
  if (who) { text.x = 65; c.add(scene.add.image(-w / 2 + 90, 0, `${who}-happy`).setDisplaySize(130, 150)); }
  c.add(text);
  scene._toast = c;
  scene.tweens.add({ targets: c, y: 40 + h / 2, duration: 380, ease: 'Back.out' });
  scene.time.delayedCall(duration, () => {
    if (!c.active) return;
    scene.tweens.add({ targets: c, y: -200, duration: 300, ease: 'Back.in', onComplete: () => c.destroy() });
  });
  return c;
}

// Ficha del HUD: icono + valor (monedas, nivel…).
export function chip(scene, x, y, icon, value, { width = 220, tint = null } = {}) {
  const c = scene.add.container(x, y);
  c.add(panel(scene, 0, 0, width, 84, { radius: 42, strokeWidth: 5 }));
  const img = scene.add.image(-width / 2 + 50, 0, icon).setDisplaySize(62, 62);
  if (tint !== null) img.setTint(tint);
  const text = label(scene, 30, 0, String(value), { size: 42 });
  c.add([img, text]);
  c.valueText = text;
  return c;
}
