// Introducción de misiones de un mundo: su guía lo presenta y lista las misiones.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { drawSky, addClouds, drawHills } from '../art/backgrounds.js';
import { Button, label, panel, toast, darker } from '../ui/widgets.js';
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

    drawSky(this, world.sky[0], world.sky[1]);
    addClouds(this, 3, { yMax: 260, alpha: 0.7 });
    drawHills(this, darker(world.ground, 12), 800, [[400, 700, 150], [1500, 800, 190]]);
    drawHills(this, world.ground, 900, [[900, 1000, 110]]);

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
    world.missions.forEach((m, i) => {
      const y = 535 + i * 84;
      this.add.circle(cx - 420, y, 30, world.color);
      label(this, cx - 420, y, String(i + 1), { size: 36, color: '#FFFFFF' });
      label(this, cx - 366, y, m, { size: 40, origin: [0, 0.5], bold: false });
    });

    new Button(this, cx - 300, 970, { label: 'Volver', icon: 'ic-back', width: 340, height: 116, color: theme.c.greenDark, onClick: () => goTo(this, 'WorldMap') });
    new Button(this, cx + 220, 970, {
      label: '¡Comenzar!', icon: 'ic-play', width: 520, height: 130, fontSize: 62, color: theme.c.orange,
      // El juego de clasificación se construye en la fase 2.
      onClick: () => toast(this, '¡Bip, bip! Estoy alistando las canecas. ¡El juego de clasificar llega muy pronto!', { who: 'reciclin', duration: 4200 }),
    });
    this.onCancel = () => goTo(this, 'WorldMap');
  }
}
