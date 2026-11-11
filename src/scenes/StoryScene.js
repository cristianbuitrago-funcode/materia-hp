// Historia inicial: ECO, RECICLÍN y CONTAMINATOR se presentan.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { drawSky, addClouds, drawHills } from '../art/backgrounds.js';
import { Button } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { DialogBox } from '../ui/DialogBox.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { INTRO_STORY } from '../config/story.js';

const SPOT = { eco: 430, guest: 1490 };

export class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }

  create() {
    enterScene(this);
    this.index = -1;
    this.drawPollutedCity();

    this.cast = {
      eco: new Character(this, SPOT.eco, 800, 'eco', { scale: 1.05 }),
      reciclin: new Character(this, W + 400, 810, 'reciclin', { scale: 1 }),
      contaminator: new Character(this, W + 400, 800, 'contaminator', { scale: 1.05 }),
    };
    this.guest = null;

    this.dialog = new DialogBox(this);
    this.dialog.on('pointerup', () => this.advance());
    this.nextBtn = new Button(this, W / 2 + 580, H - 150, { label: 'Seguir', icon: 'ic-next', width: 300, height: 104, color: theme.c.orange, onClick: () => this.advance() });
    new Button(this, W - 190, 90, { label: 'Saltar', width: 260, height: 90, fontSize: 40, color: theme.c.greenDark, onClick: () => this.finish() });

    this.onDefaultAction = () => this.advance();
    this.time.delayedCall(350, () => this.advance());
  }

  drawPollutedCity() {
    drawSky(this, 0x8fa3b8, 0xe6d9c3);
    addClouds(this, 4, { tint: 0xb9b3c2, alpha: 0.85, yMax: 300 });
    const far = this.add.graphics();
    far.fillStyle(0x7c8a99, 1);
    [[80, 380, 200], [300, 300, 170], [520, 420, 220], [800, 340, 180], [1040, 440, 210], [1300, 320, 190], [1540, 400, 200], [1760, 350, 170]]
      .forEach(([x, y, w]) => far.fillRoundedRect(x, y, w, 500, 10));
    const near = this.add.graphics();
    [[0, 520, 260], [250, 470, 230], [640, 540, 280], [980, 500, 240], [1380, 530, 300], [1700, 480, 240]].forEach(([x, y, w]) => {
      near.fillStyle(0x566573, 1); near.fillRoundedRect(x, y, w, 420, 12);
      near.fillStyle(0xffe9a8, 0.8);
      for (let wx = x + 30; wx < x + w - 50; wx += 62) for (let wy = y + 36; wy < 800; wy += 76) near.fillRoundedRect(wx, wy, 30, 38, 5);
    });
    drawHills(this, 0x8d99a6, 830, []);
    // Basura regada por la calle (formas simples; los residuos reales llegan en la fase 2).
    const trash = this.add.graphics();
    const colors = [0x90caf9, 0xffe082, 0xef9a9a, 0xce93d8, 0xb0bec5, 0xa5d6a7];
    for (let i = 0; i < 26; i++) {
      const x = 60 + i * 72 + (i % 3) * 14, y = 850 + ((i * 53) % 60);
      trash.fillStyle(colors[i % colors.length], 1);
      if (i % 2) trash.fillRoundedRect(x, y, 34, 24, 6); else trash.fillCircle(x, y + 10, 15);
    }
  }

  advance() {
    if (this._leaving) return;
    if (this.dialog.isTyping) { this.dialog.finish(); return; }
    this.index++;
    if (this.index >= INTRO_STORY.length) { this.finish(); return; }
    const line = INTRO_STORY[this.index];
    this.present(line.who);
    const speaker = this.cast[line.who];
    for (const c of Object.values(this.cast)) c.stopTalking();
    speaker.talk(line.expr, line.text.length * 28);
    speaker.hop(30);
    this.dialog.say(line.who, line.text, () => speaker.stopTalking());
  }

  // ECO está siempre a la izquierda; el invitado (RECICLÍN o CONTAMINATOR) entra por la derecha.
  present(who) {
    for (const [key, c] of Object.entries(this.cast)) {
      // Quien habla se acerca; los demás se alejan y se oscurecen un poco.
      c.sprite.setTint(key === who ? 0xffffff : 0xb8c0c8);
      this.tweens.add({ targets: c, scale: c.baseScale * (key === who ? 1.06 : 0.92), duration: 220 });
    }
    if (who === 'eco' || this.guest === who) return;
    if (this.guest) this.tweens.add({ targets: this.cast[this.guest], x: W + 400, duration: 420, ease: 'Back.in' });
    this.guest = who;
    this.tweens.add({ targets: this.cast[who], x: SPOT.guest, duration: 520, ease: 'Back.out' });
  }

  finish() {
    gameState.markStorySeen();
    goTo(this, 'Profile');
  }
}
