// Mapa de mundos: cinco escenarios unidos por un camino.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { drawSky, addClouds, drawHills, drawTree } from '../art/backgrounds.js';
import { Button, label, panel, toast, chip, darker } from '../ui/widgets.js';
import { enterScene, goTo, openOverlay } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { WORLDS } from '../config/worlds.js';
import { getAgeMode } from '../config/ageModes.js';
import { audio } from '../core/AudioManager.js';

const NODES = { city: [300, 640], forest: [640, 400], ocean: [980, 660], mountain: [1320, 410], future: [1650, 640] };

const SECTIONS = [
  { label: 'Álbum', icon: 'ic-book', color: 0x26a69a, phase: 5, text: 'Aquí guardarás todos los residuos que aprendas, con datos curiosos.' },
  { label: 'Tienda', icon: 'ic-shop', color: theme.c.orange, phase: 5, text: 'Aquí cambiarás tus monedas ecológicas por personajes y accesorios.' },
  { label: 'Insignias', icon: 'ic-medal', color: 0xf9a825, phase: 5, text: 'Aquí brillarán las insignias que ganes como guardián.' },
  { label: 'Perfil', icon: 'ic-user', color: theme.c.blue, phase: 5, text: 'Aquí verás tu nivel, tu experiencia y todo lo que has logrado.' },
  { label: 'Adultos', icon: 'ic-family', color: theme.c.purple, phase: 7, text: 'Aquí los padres y docentes verán lo que cada guardián ha aprendido.', title: 'Padres y docentes' },
];

export class WorldMapScene extends Phaser.Scene {
  constructor() { super('WorldMap'); }

  create() {
    if (!gameState.hasProfile) { this.scene.start('Title'); return; }
    enterScene(this);
    audio.setTheme('main');
    audio.startMusic();
    this.drawLand();
    this.drawPath();
    WORLDS.forEach((w) => this.addNode(w));
    this.addHud();
    this.addNavBar();
  }

  drawLand() {
    drawSky(this, theme.c.sky, theme.c.skyLight);
    addClouds(this, 4, { yMax: 220 });
    drawHills(this, 0x8fdcb0, 330, [[300, 600, 150], [1100, 700, 190], [1750, 420, 130]]);
    const land = drawHills(this, 0x59c98b, 420, [[600, 900, 120], [1500, 800, 110]]);
    land.fillStyle(0x4cbb7e, 1);
    [[160, 880, 260, 90], [820, 500, 300, 80], [1500, 860, 340, 100], [1160, 800, 220, 70]].forEach(([x, y, w, h]) => land.fillEllipse(x, y, w, h));
    [[120, 480, 0.8], [470, 800, 0.9], [830, 300, 0.7], [1150, 560, 0.8], [1500, 300, 0.7], [1820, 420, 0.9], [1800, 850, 0.8]].forEach(([x, y, s]) => drawTree(land, x, y, s));
  }

  drawPath() {
    const pts = WORLDS.map((w) => new Phaser.Math.Vector2(...NODES[w.id]));
    const curve = new Phaser.Curves.Spline(pts);
    const g = this.add.graphics();
    const dots = curve.getSpacedPoints(46);
    g.fillStyle(0x000000, 0.12); dots.forEach((p) => g.fillCircle(p.x, p.y + 30, 17));
    g.fillStyle(theme.c.cream, 1); dots.forEach((p) => g.fillCircle(p.x, p.y + 24, 15));
  }

  addNode(world) {
    const [x, y] = NODES[world.id];
    const unlocked = gameState.isWorldUnlocked(world.id);
    const color = unlocked ? world.color : theme.c.grey;
    this.add.ellipse(x, y + 112, 250, 60, 0x000000, 0.2);
    const b = new Button(this, x, y, {
      width: 230, height: 230, radius: 115, color, sound: unlocked ? 'click' : 'locked',
      onClick: () => this.openWorld(world, unlocked, b),
    });
    b.face.add(this.add.circle(0, 0, 92, 0xffffff, unlocked ? 0.92 : 0.5));
    const icon = this.add.image(0, 0, `world-${world.id}`).setDisplaySize(150, 150);
    b.face.add(icon);
    if (!unlocked) {
      icon.setTint(0x777777).setAlpha(0.55);
      b.face.add(this.add.circle(0, 0, 54, theme.c.ink, 0.85));
      b.face.add(this.add.image(0, 0, 'ic-lock').setDisplaySize(70, 70));
    }
    // Número del mundo
    b.face.add(this.add.circle(-86, -86, 36, darker(color, 20)).setStrokeStyle(5, 0xffffff));
    b.face.add(label(this, -86, -86, String(world.order), { size: 40, color: '#FFFFFF' }));
    label(this, x, y + 172, world.short, { size: 46, color: '#FFFFFF', stroke: unlocked ? '#17324D' : '#5F7183', strokeThickness: 12 });

    if (unlocked) {
      // Un punto por misión: verde brillante si ya se terminó.
      const { done, total } = gameState.worldStatus(world.id);
      for (let i = 0; i < total; i++) {
        this.add.circle(x - 54 + i * 36, y + 232, 13, i < done ? 0xffd23f : 0x1f5d3c, i < done ? 1 : 0.35).setStrokeStyle(4, 0xffffff, i < done ? 1 : 0.5);
      }
      this.tweens.add({ targets: b, y: y - 12, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // El avatar del jugador marca el mundo más avanzado que tiene abierto.
    const last = WORLDS.filter((w) => gameState.isWorldUnlocked(w.id)).pop();
    if (last.id === world.id) {
      const me = this.add.image(x + 96, y - 150, `avatar-${gameState.profile.avatar}`).setDisplaySize(120, 120);
      this.tweens.add({ targets: me, y: y - 176, duration: 520, yoyo: true, repeat: -1, ease: 'Quad.out' });
    }
  }

  openWorld(world, unlocked, button) {
    if (unlocked) { goTo(this, 'MissionIntro', { worldId: world.id }); return; }
    this.tweens.add({ targets: button, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => button.setAngle(0) });
    toast(this, 'Este mundo está cerrado. ¡Termina el mundo anterior para abrirlo!', { who: 'eco' });
  }

  addHud() {
    const p = gameState.profile, mode = getAgeMode(p.ageMode);
    const card = this.add.container(310, 100);
    card.add(panel(this, 0, 0, 540, 140, { radius: 70, strokeWidth: 5 }));
    card.add(this.add.circle(-200, 0, 62, mode.color));
    card.add(this.add.image(-200, 0, `avatar-${p.avatar}`).setDisplaySize(112, 112));
    card.add(label(this, -120, -26, p.nickname, { size: 44, origin: [0, 0.5] }));
    card.add(label(this, -120, 28, mode.name, { size: 32, origin: [0, 0.5], color: theme.hex.grey, bold: false }));

    chip(this, W - 620, 100, 'ic-star', `Nivel ${gameState.progress.level}`, { width: 300, tint: 0xf9a825 });
    chip(this, W - 340, 100, 'ic-coin', gameState.progress.ecoCoins, { width: 220 });
    new Button(this, W - 110, 100, { icon: 'ic-gear', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: () => openOverlay(this, 'Settings') });
  }

  addNavBar() {
    const bw = 330, gap = 28, total = SECTIONS.length * bw + (SECTIONS.length - 1) * gap;
    SECTIONS.forEach((s, i) => {
      new Button(this, W / 2 - total / 2 + bw / 2 + i * (bw + gap), H - 86, {
        label: s.label, icon: s.icon, width: bw, height: 104, fontSize: 42, color: s.color,
        onClick: () => goTo(this, 'ComingSoon', { title: s.title || s.label, icon: s.icon, phase: s.phase, text: s.text, from: 'WorldMap' }),
      });
    });
  }
}
