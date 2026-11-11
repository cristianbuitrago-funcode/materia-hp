// Introducción de misiones de un mundo: su guía lo presenta y lista las misiones.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { buildWorld } from '../worlds/index.js';
import { audio } from '../core/AudioManager.js';
import { Button, label, panel, toast, darker } from '../ui/widgets.js';
import { missionId } from '../config/missions.js';
import { startMission } from '../game/missionUi.js';
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

    const status = gameState.worldStatus(world.id);
    buildWorld(this, world.id, status.clean);
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
    label(this, cx - 450, 440, 'Misiones', { size: 44, origin: [0, 0.5] });
    // Cuánto se ha recuperado este mundo (una cuarta parte por misión).
    const pct = Math.round(status.clean * 100);
    const bar = this.add.graphics();
    bar.fillStyle(0xd9d2bd, 1); bar.fillRoundedRect(cx + 70, 428, 380, 26, 13);
    if (pct > 0) { bar.fillStyle(theme.c.green, 1); bar.fillRoundedRect(cx + 70, 428, Math.max(26, 3.8 * pct), 26, 13); }
    label(this, cx + 50, 441, pct >= 100 ? '¡Recuperado!' : `Recuperado: ${pct} %`, { size: 32, origin: [1, 0.5], color: theme.hex.greenDark });

    // Las cuatro misiones: terminada (con estrellas), disponible o cerrada.
    this.nextIndex = -1;
    world.missions.forEach((title, i) => {
      const y = 524 + i * 96;
      const done = gameState.missionState(missionId(world.id, i));
      const open = gameState.isMissionUnlocked(world.id, i);
      if (open && !done && this.nextIndex < 0) this.nextIndex = i;
      const row = new Button(this, cx, y, {
        width: 960, height: 82, radius: 34, sound: open ? 'click' : 'locked',
        color: done ? theme.c.green : open ? theme.c.orange : theme.c.grey,
        onClick: () => (open ? startMission(this, world.id, i) : this.locked(row)),
      });
      const f = row.face;
      f.add(this.add.circle(-430, 0, 28, 0xffffff, 0.92));
      f.add(label(this, -430, 0, String(i + 1), { size: 36, color: theme.hex.ink }));
      f.add(label(this, -384, 0, title, { size: title.length > 40 ? 30 : 36, color: '#FFFFFF', origin: [0, 0.5] }));
      if (done) {
        for (let k = 0; k < 3; k++) f.add(this.add.image(350 + k * 44, 0, 'ic-star').setDisplaySize(40, 40).setTint(k < done.stars ? 0xffd23f : 0x0f5c36).setAlpha(k < done.stars ? 1 : 0.4));
      } else {
        f.add(this.add.image(430, 0, open ? 'ic-play' : 'ic-lock').setDisplaySize(44, 44));
      }
      if (open && !done) this.tweens.add({ targets: row, scale: 1.03, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });

    new Button(this, cx, 975, { label: 'Volver al mapa', icon: 'ic-back', width: 520, height: 110, color: theme.c.greenDark, onClick: () => goTo(this, 'WorldMap') });
    this.onCancel = () => goTo(this, 'WorldMap');
    // Enter empieza la siguiente misión pendiente (o repite la primera si ya están todas).
    this.onDefaultAction = () => startMission(this, world.id, this.nextIndex < 0 ? 0 : this.nextIndex);
  }

  locked(row) {
    this.tweens.add({ targets: row, x: row.x + 12, duration: 55, yoyo: true, repeat: 3 });
    toast(this, 'Termina la misión anterior para abrir esta.', { who: 'reciclin' });
  }
}
