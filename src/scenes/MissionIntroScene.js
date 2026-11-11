// Introducción de misiones de un mundo: su guía lo presenta y lista las misiones.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { buildWorld } from '../worlds/index.js';
import { audio } from '../core/AudioManager.js';
import { Button, label, panel, darker } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { getWorld } from '../config/worlds.js';

export class MissionIntroScene extends Phaser.Scene {
  constructor() { super('MissionIntro'); }

  create(data) {
    const world = getWorld(data.worldId);
    if (!world || !gameState.isWorldUnlocked(world.id)) { this.scene.start('WorldMap'); return; }
    enterScene(this);
    this.world = world;
    const hex = '#' + darker(world.color, 35).toString(16).padStart(6, '0');

    const progress = gameState.worldProgress(world.id);
    buildWorld(this, world.id, progress.clean);
    audio.setTheme(world.id);
    audio.startMusic();

    // Guía con globo de diálogo
    const guide = new Character(this, 380, 1010, world.guide, { scale: 1.05 });
    guide.talk('happy', 1600);
    const bubble = this.add.container(420, 300);
    const bg = panel(this, 0, 0, 660, 300, { radius: 60 });
    bg.fillStyle(theme.c.cream, 1); bg.fillTriangle(-80, 140, 10, 140, -70, 215);
    bg.lineStyle(6, theme.c.ink, 1); bg.lineBetween(-80, 150, -70, 215); bg.lineBetween(-70, 215, 10, 150);
    bubble.add([bg, label(this, 0, 0, world.intro, { size: 40, wrap: 580, lineSpacing: 6 })]);
    bubble.setScale(0);
    this.tweens.add({ targets: bubble, scale: 1, duration: 420, ease: 'Back.out', delay: 250 });

    // Tarjeta del mundo
    const cx = 1300;
    panel(this, cx, 480, 1040, 800, { radius: 64 });
    this.add.circle(cx - 400, 190, 96, world.color).setStrokeStyle(8, 0xffffff);
    this.add.image(cx - 400, 190, `world-${world.id}`).setDisplaySize(140, 140);
    label(this, cx - 280, 150, `Mundo ${world.order}`, { size: 38, color: theme.hex.grey, origin: [0, 0.5] });
    label(this, cx - 280, 212, world.name, { size: 60, color: hex, origin: [0, 0.5] });
    label(this, cx, 350, world.description, { size: 36, bold: false, wrap: 900, lineSpacing: 6 });
    label(this, cx - 450, 455, 'Misiones', { size: 44, origin: [0, 0.5] });
    // Cuánto se ha recuperado este mundo.
    const pct = Math.round(progress.clean * 100);
    const bar = this.add.graphics();
    bar.fillStyle(0xd9d2bd, 1); bar.fillRoundedRect(cx + 70, 444, 380, 26, 13);
    if (pct > 0) { bar.fillStyle(theme.c.green, 1); bar.fillRoundedRect(cx + 70, 444, Math.max(26, 3.8 * pct), 26, 13); }
    label(this, cx + 50, 457, pct >= 100 ? '¡Recuperado!' : `Recuperado: ${pct} %`, { size: 32, origin: [1, 0.5], color: theme.hex.greenDark });
    world.missions.forEach((m, i) => {
      const y = 535 + i * 84;
      this.add.circle(cx - 420, y, 30, world.color);
      label(this, cx - 420, y, String(i + 1), { size: 36, color: '#FFFFFF' });
      label(this, cx - 366, y, m, { size: 40, origin: [0, 0.5], bold: false });
    });

    new Button(this, cx - 300, 970, { label: 'Volver', icon: 'ic-back', width: 340, height: 116, color: theme.c.greenDark, onClick: () => goTo(this, 'WorldMap') });
    new Button(this, cx + 220, 970, {
      label: '¡Comenzar!', icon: 'ic-play', width: 520, height: 130, fontSize: 62, color: theme.c.orange,
      onClick: () => goTo(this, 'Sorting', { worldId: world.id }),
    });
    this.onCancel = () => goTo(this, 'WorldMap');
    this.onDefaultAction = () => goTo(this, 'Sorting', { worldId: world.id });
  }
}
