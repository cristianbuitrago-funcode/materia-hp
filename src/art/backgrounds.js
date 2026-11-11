// Fondos con profundidad dibujados por código.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';

export function drawSky(scene, top, bottom) {
  const g = scene.add.graphics();
  if (scene.sys.game.renderer.type === Phaser.WEBGL) {
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, W, H);
  } else {
    // Sin WebGL no hay degradados: se pinta por franjas.
    const a = Phaser.Display.Color.IntegerToColor(top), b = Phaser.Display.Color.IntegerToColor(bottom);
    const bands = 48;
    for (let i = 0; i < bands; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, bands - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (H / bands) * i, W, H / bands + 1);
    }
  }
  return g;
}

// Sol con rayos que giran lentamente.
export function addSun(scene, x, y, r = 110) {
  const rays = scene.add.graphics({ x, y });
  rays.fillStyle(0xffe680, 0.55);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rays.fillTriangle(
      Math.cos(a - 0.09) * r * 1.1, Math.sin(a - 0.09) * r * 1.1,
      Math.cos(a + 0.09) * r * 1.1, Math.sin(a + 0.09) * r * 1.1,
      Math.cos(a) * r * 2, Math.sin(a) * r * 2,
    );
  }
  scene.tweens.add({ targets: rays, angle: 360, duration: 60000, repeat: -1 });
  const sun = scene.add.graphics({ x, y });
  sun.fillStyle(0xfff3b0, 1); sun.fillCircle(0, 0, r * 1.08);
  sun.fillStyle(theme.c.yellow, 1); sun.fillCircle(0, 0, r);
  return sun;
}

// Nubes que cruzan el cielo sin parar.
export function addClouds(scene, count = 5, { yMin = 60, yMax = 380, tint = 0xffffff, alpha = 0.95 } = {}) {
  for (let i = 0; i < count; i++) {
    const scale = 0.6 + Math.random() * 0.8;
    const y = yMin + ((yMax - yMin) * i) / Math.max(1, count - 1);
    const c = scene.add.image(Math.random() * W, y, 'cloud').setScale(scale).setTint(tint).setAlpha(alpha);
    const speed = 12 + scale * 14; // px por segundo: las nubes grandes (cercanas) van más rápido
    const travel = () => {
      scene.tweens.add({
        targets: c, x: W + 260, duration: ((W + 260 - c.x) / speed) * 1000,
        onComplete: () => { c.x = -260; travel(); },
      });
    };
    travel();
  }
}

// Capa de colinas. `humps` son [x, radioX, radioY] apoyados en la base `y`.
export function drawHills(scene, color, y, humps) {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  for (const [x, rx, ry] of humps) g.fillEllipse(x, y, rx * 2, ry * 2);
  g.fillRect(0, y, W, H - y);
  return g;
}

export function drawTree(g, x, y, s = 1, leaf = 0x2e8b57, leafLight = 0x5fd068) {
  g.fillStyle(0x7a5236, 1); g.fillRoundedRect(x - 12 * s, y - 70 * s, 24 * s, 76 * s, 8 * s);
  g.fillStyle(leaf, 1); g.fillCircle(x, y - 120 * s, 70 * s);
  g.fillStyle(leafLight, 1); g.fillCircle(x - 22 * s, y - 140 * s, 34 * s);
}

// Paisaje alegre usado en el título, el perfil y el mapa.
export function drawMeadow(scene, { sun = true, clouds = 5 } = {}) {
  drawSky(scene, theme.c.sky, theme.c.skyLight);
  if (sun) addSun(scene, 1640, 190);
  addClouds(scene, clouds);
  drawHills(scene, 0x8fdcb0, 700, [[260, 520, 190], [1000, 620, 240], [1720, 480, 170]]);
  const mid = drawHills(scene, 0x4cc38a, 820, [[520, 640, 170], [1500, 700, 200]]);
  drawTree(mid, 1240, 640, 1.1); drawTree(mid, 1370, 660, 0.8); drawTree(mid, 700, 668, 0.9);
  drawHills(scene, theme.c.green, 940, [[200, 560, 130], [1100, 800, 120], [1800, 420, 150]]);
}
