// Caja de diálogo con nombre del personaje y texto que aparece letra a letra
// (hace las veces de subtítulo de todo lo que dicen los personajes).
import Phaser from 'phaser';
import { W, H, theme, CAST } from '../config/theme.js';
import { label, panel, darker } from './widgets.js';
import { audio } from '../core/AudioManager.js';

export class DialogBox extends Phaser.GameObjects.Container {
  constructor(scene, { width = 1500, height = 250, y = H - 170 } = {}) {
    super(scene, W / 2, y);
    this.w = width; this.h = height;
    this.add(panel(scene, 0, 0, width, height, { radius: 56 }));
    this.tag = scene.add.graphics();
    this.nameText = label(scene, -width / 2 + 190, -height / 2, '', { size: 40, color: '#FFFFFF' });
    this.text = label(scene, -width / 2 + 60, -height / 2 + 62, '', { size: 44, origin: [0, 0], align: 'left', wrap: width - 420, lineSpacing: 6 });
    this.add([this.tag, this.nameText, this.text]);
    this.full = '';
    this.typing = null;
    // Tocar la caja también avanza el diálogo.
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });
    scene.add.existing(this);
    this.once('destroy', () => { if (this.typing) this.typing.remove(); });
  }

  say(who, text, onDone = () => {}) {
    const cast = CAST[who];
    this.tag.clear();
    this.tag.fillStyle(darker(cast.color), 1); this.tag.fillRoundedRect(-this.w / 2 + 40, -this.h / 2 - 30, 300, 72, 36);
    this.tag.fillStyle(cast.color, 1); this.tag.fillRoundedRect(-this.w / 2 + 40, -this.h / 2 - 36, 300, 72, 36);
    this.nameText.setText(cast.name).setY(-this.h / 2 - 2);
    this.full = text;
    this.onDone = onDone;
    this.text.setText('');
    if (this.typing) this.typing.remove();
    let i = 0;
    this.typing = this.scene.time.addEvent({
      delay: 28, repeat: text.length - 1,
      callback: () => {
        i++;
        this.text.setText(text.slice(0, i));
        if (i % 3 === 0) audio.sfx('talk');
        if (i >= text.length) this.finish();
      },
    });
  }

  get isTyping() { return !!this.typing; }

  // Muestra todo el texto de inmediato.
  finish() {
    if (!this.typing) return;
    this.typing.remove();
    this.typing = null;
    this.text.setText(this.full);
    this.onDone();
  }
}
