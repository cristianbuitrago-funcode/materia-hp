// Insignias y logros: las ganadas brillan; las pendientes dicen cómo conseguirlas.
import Phaser from 'phaser';
import { theme } from '../config/theme.js';
import { label, panel } from '../ui/widgets.js';
import { openSection } from '../ui/section.js';
import { gameState } from '../core/GameState.js';
import { BADGES } from '../game/rewards.js';

export class BadgesScene extends Phaser.Scene {
  constructor() { super('Badges'); }

  create() {
    const have = gameState.rewards.unlockedBadges;
    openSection(this, 'Insignias', `Tienes ${have.length} de ${BADGES.length} insignias`);
    BADGES.forEach((b, i) => {
      const x = 216 + (i % 5) * 372, y = 420 + Math.floor(i / 5) * 400;
      const earned = have.includes(b.id);
      panel(this, x, y, 350, 370, { radius: 50, fill: earned ? theme.c.cream : 0xe7eaee, stroke: earned ? b.color : theme.c.grey, strokeWidth: 7 });
      this.add.circle(x, y - 78, 84, earned ? b.color : 0xb6bfc7).setStrokeStyle(8, 0xffffff);
      const icon = this.add.image(x, y - 78, b.icon).setDisplaySize(110, 110);
      if (!earned) {
        icon.setTintFill(0xffffff).setAlpha(0.45);
        this.add.circle(x + 62, y - 20, 30, theme.c.ink, 0.85);
        this.add.image(x + 62, y - 20, 'ic-lock').setDisplaySize(36, 36);
      } else {
        this.add.circle(x + 62, y - 20, 30, theme.c.green).setStrokeStyle(5, 0xffffff);
        this.add.image(x + 62, y - 20, 'ic-check').setDisplaySize(34, 34);
        this.tweens.add({ targets: icon, angle: { from: -5, to: 5 }, duration: 1400 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      label(this, x, y + 56, b.name, { size: 30, wrap: 320, color: earned ? theme.hex.ink : theme.hex.grey, lineSpacing: -4 });
      label(this, x, y + 130, earned ? '¡Conseguida!' : b.how, { size: 24, bold: false, wrap: 310, color: earned ? theme.hex.greenDark : theme.hex.grey, lineSpacing: -2 });
    });
  }
}
