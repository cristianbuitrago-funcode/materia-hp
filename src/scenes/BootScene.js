// Carga inicial: genera todas las texturas y muestra una barra de progreso.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { createAllTextures } from '../art/textures.js';
import { label } from '../ui/widgets.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    this.cameras.main.setBackgroundColor(theme.c.greenDark);
    label(this, W / 2, H / 2 - 90, 'Preparando la aventura…', { size: 64, color: '#FFFFFF' });
    const bw = 700;
    const bar = this.add.graphics();
    const draw = (p) => {
      bar.clear();
      bar.fillStyle(0x000000, 0.25); bar.fillRoundedRect(W / 2 - bw / 2, H / 2, bw, 50, 25);
      bar.fillStyle(theme.c.yellow, 1); bar.fillRoundedRect(W / 2 - bw / 2 + 6, H / 2 + 6, Math.max(38, (bw - 12) * p), 38, 19);
    };
    draw(0);
    createAllTextures(this, draw)
      .then(() => this.scene.start('Title'))
      .catch((err) => {
        console.error(err);
        label(this, W / 2, H / 2 + 130, 'No se pudo cargar el juego. Recarga la página.', { size: 40, color: '#FFFFFF' });
      });
  }
}
