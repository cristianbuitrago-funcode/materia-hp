// Sección que ya tiene su lugar en la navegación pero se construye en una fase posterior.
import Phaser from 'phaser';
import { W, theme } from '../config/theme.js';
import { drawMeadow } from '../art/backgrounds.js';
import { Button, label, panel } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { enterScene, goTo } from '../core/Navigation.js';

export class ComingSoonScene extends Phaser.Scene {
  constructor() { super('ComingSoon'); }

  create(data) {
    enterScene(this);
    const from = data.from || 'Title';
    drawMeadow(this, { sun: false, clouds: 3 });
    panel(this, W / 2 + 160, 470, 1100, 560, { radius: 70 });
    this.add.circle(W / 2 + 160, 290, 90, theme.c.green).setStrokeStyle(8, 0xffffff);
    this.add.image(W / 2 + 160, 290, data.icon || 'ic-star').setDisplaySize(110, 110);
    label(this, W / 2 + 160, 430, data.title || 'Muy pronto', { size: 76, color: theme.hex.greenDark });
    label(this, W / 2 + 160, 550, data.text || '', { size: 40, bold: false, wrap: 940, lineSpacing: 6 });
    label(this, W / 2 + 160, 670, `En construcción · llega en la fase ${data.phase}`, { size: 34, color: theme.hex.grey });
    const r = new Character(this, 330, 960, 'reciclin', { scale: 1.05 });
    r.talk('happy', 1200);
    new Button(this, W / 2 + 160, 900, { label: 'Volver', icon: 'ic-back', width: 400, height: 120, fontSize: 54, color: theme.c.orange, onClick: () => goTo(this, from) });
    this.onCancel = () => goTo(this, from);
    this.onDefaultAction = this.onCancel;
  }
}
