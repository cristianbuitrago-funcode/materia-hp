// Resultados de la ronda: estrellas, aciertos y premios ganados.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { drawMeadow } from '../art/backgrounds.js';
import { Button, label, panel, toast } from '../ui/widgets.js';
import { getWorld } from '../config/worlds.js';
import { Character } from '../ui/Character.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { gameState, XP_PER_LEVEL } from '../core/GameState.js';
import { audio } from '../core/AudioManager.js';

const MESSAGES = {
  3: '¡Eres un gran guardián del planeta!',
  2: '¡Muy buen trabajo, guardián!',
  1: '¡Buen esfuerzo! Cada intento te enseña algo nuevo.',
};

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(data) {
    const s = data.summary;
    if (!s || !gameState.hasProfile) { this.scene.start('WorldMap'); return; }
    enterScene(this);
    drawMeadow(this, { sun: false, clouds: 3 });

    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: W }, y: -20, lifespan: 5000, frequency: 90, speedY: { min: 160, max: 320 }, speedX: { min: -60, max: 60 },
      scale: { min: 0.4, max: 0.8 }, tint: [0xffd23f, 0xff8a3d, 0x5cc8f5, 0xef5350, 0xffffff],
    });

    const eco = new Character(this, 300, 1000, 'eco', { scale: 1 });
    this.time.addEvent({ delay: 1500, loop: true, callback: () => eco.hop(60) });

    const cx = W / 2 + 190;
    panel(this, cx, 470, 1180, 780, { radius: 70 });
    label(this, cx, 150, '¡Misión cumplida!', { size: 92, color: '#FFFFFF', stroke: '#14804A', strokeThickness: 22 });

    // Estrellas: aparecen una por una.
    for (let i = 0; i < 3; i++) {
      const won = i < s.stars;
      const star = this.add.image(cx - 190 + i * 190, 320 - (i === 1 ? 26 : 0), 'ic-star').setDisplaySize(170, 170)
        .setTint(won ? 0xffc107 : 0xc9c2ad).setScale(0);
      this.tweens.add({
        targets: star, scale: 170 / star.width, duration: 380, ease: 'Back.out', delay: 400 + i * 320,
        onStart: () => { if (won) audio.sfx('coin'); },
      });
    }

    label(this, cx, 470, MESSAGES[s.stars], { size: 46, color: theme.hex.greenDark, wrap: 1050 });
    label(this, cx, 548, `Acertaste ${s.firstTry} de ${s.total} a la primera`, { size: 40, bold: false });

    this.prize(cx - 260, 650, 'ic-star', `+${s.xp} de experiencia`, 0xf9a825);
    this.prize(cx + 260, 650, 'ic-coin', `+${s.coins} monedas`);

    // Barra de experiencia hacia el siguiente nivel.
    const p = gameState.progress, into = p.experience % XP_PER_LEVEL;
    const bx = cx - 400, bw = 800;
    const bar = this.add.graphics();
    bar.fillStyle(0xd9d2bd, 1); bar.fillRoundedRect(bx, 752, bw, 34, 17);
    bar.fillStyle(theme.c.green, 1); bar.fillRoundedRect(bx, 752, Math.max(34, (bw * into) / XP_PER_LEVEL), 34, 17);
    label(this, cx, 812, data.leveledUp ? `¡Subiste al nivel ${data.level}!` : `Nivel ${p.level} · faltan ${XP_PER_LEVEL - into} para el nivel ${p.level + 1}`,
      { size: 34, color: data.leveledUp ? theme.hex.orange : theme.hex.grey });

    new Button(this, cx - 300, 970, { label: 'Mapa', icon: 'ic-back', width: 400, height: 120, fontSize: 52, color: theme.c.greenDark, onClick: () => goTo(this, 'WorldMap') });
    new Button(this, cx + 240, 970, { label: 'Jugar otra vez', icon: 'ic-play', width: 600, height: 130, fontSize: 56, color: theme.c.orange, onClick: () => goTo(this, 'Sorting', { worldId: data.worldId }) });
    this.onCancel = () => goTo(this, 'WorldMap');

    this.time.delayedCall(300, () => audio.sfx('fanfare'));
    const opened = data.unlockedWorld && getWorld(data.unlockedWorld);
    if (opened) this.time.delayedCall(1800, () => toast(this, `¡Abriste un mundo nuevo: ${opened.name}!`, { who: 'eco', duration: 4500 }));
  }

  prize(x, y, icon, text, tint = null) {
    const img = this.add.image(x - 190, y, icon).setDisplaySize(70, 70);
    if (tint !== null) img.setTint(tint);
    label(this, x - 140, y, text, { size: 44, origin: [0, 0.5] });
  }
}
