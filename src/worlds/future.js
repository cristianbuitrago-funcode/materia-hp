// Mundo 5: El Futuro Sostenible. Energía limpia, casas con paneles solares y huertas.
import { W, H } from '../config/theme.js';
import { drawSky, addSun, addClouds } from '../art/backgrounds.js';
import { gfx, bake, trashPile, litter, flower, tree, bush, smog, bird, butterfly, haze } from './kit.js';

function turbine(scene, x, y, s = 1) {
  gfx(scene, x, y, (g) => {
    g.fillStyle(0xeceff1, 1); g.fillPoints([{ x: -9 * s, y: 0 }, { x: 9 * s, y: 0 }, { x: 5 * s, y: -260 * s }, { x: -5 * s, y: -260 * s }], true);
    g.fillStyle(0xb0bec5, 1); g.fillRect(3 * s, -260 * s, 4 * s, 260 * s);
  });
  const blades = gfx(scene, x, y - 260 * s, (g) => {
    g.fillStyle(0xffffff, 1);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, c = Math.cos(a), n = Math.sin(a);
      g.fillPoints([{ x: -n * 9 * s, y: c * 9 * s }, { x: c * 130 * s, y: n * 130 * s }, { x: n * 9 * s, y: -c * 9 * s }], true);
    }
    g.fillStyle(0x90a4ae, 1); g.fillCircle(0, 0, 11 * s);
  });
  scene.tweens.add({ targets: blades, angle: 360, duration: 5000 / s, repeat: -1 });
}

function ecoHouse(scene, x, y, wall, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(wall, 1); g.fillRoundedRect(-110 * s, -150 * s, 220 * s, 150 * s, 10 * s);
    g.fillStyle(0x455a64, 1); g.fillTriangle(-134 * s, -146 * s, 134 * s, -146 * s, 0, -250 * s);
    // Paneles solares
    g.fillStyle(0x1565c0, 1); g.fillPoints([{ x: -70 * s, y: -164 * s }, { x: -6 * s, y: -164 * s }, { x: -22 * s, y: -216 * s }, { x: -54 * s, y: -192 * s }], true);
    g.fillPoints([{ x: 8 * s, y: -164 * s }, { x: 72 * s, y: -164 * s }, { x: 56 * s, y: -192 * s }, { x: 22 * s, y: -216 * s }], true);
    g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-24 * s, -84 * s, 48 * s, 84 * s, 8 * s);
    g.fillStyle(0xbfe6fa, 1); g.fillRoundedRect(-90 * s, -110 * s, 46 * s, 46 * s, 6 * s); g.fillRoundedRect(44 * s, -110 * s, 46 * s, 46 * s, 6 * s);
  });
}

// Terreno sin recuperar: tierra seca con un tocón.
function barren(scene, x, y, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0xa58b6f, 1); g.fillEllipse(0, 0, 320 * s, 90 * s);
    g.fillStyle(0x8c7359, 1); g.fillEllipse(-40 * s, 6 * s, 150 * s, 36 * s);
    g.fillStyle(0x6d4c35, 1); g.fillRoundedRect(30 * s, -50 * s, 44 * s, 54 * s, 6 * s);
    g.fillStyle(0xbf9d76, 1); g.fillEllipse(52 * s, -50 * s, 44 * s, 16 * s);
  });
}

function rainbow(scene, x, y, r) {
  return gfx(scene, x, y, (g) => {
    [0xef5350, 0xff9800, 0xffd23f, 0x66bb6a, 0x42a5f5, 0x7e57c2].forEach((c, i) => {
      g.lineStyle(22, c, 0.75);
      g.beginPath(); g.arc(0, 0, r - i * 22, Math.PI, Math.PI * 2); g.strokePath();
    });
  });
}

// Huerta comunitaria: surcos con plantas.
function garden(scene, x, y) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-150, -50, 300, 60, 12);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x6d4c41, 1); g.fillRect(-140 + i * 48, -44, 6, 48);
      g.fillStyle(i % 2 ? 0x7cb342 : 0x43a047, 1); g.fillCircle(-116 + i * 48, -52, 18);
      g.fillStyle(i % 2 ? 0xef5350 : 0xff9800, 1); g.fillCircle(-110 + i * 48, -46, 7);
    }
  });
}

export function buildFuture(scene) {
  const BASE = 650;
  drawSky(scene, 0x4fc3f7, 0xfff6c9);
  addSun(scene, 1640, 190, 100);
  addClouds(scene, 3, { yMax: 220 });
  // Lo primero que se dibuja de lo "limpio" es el arcoíris, detrás de las colinas.
  const bow = rainbow(scene, 760, BASE + 40, 520);

  const hills = scene.add.graphics();
  hills.fillStyle(0x9be0b0, 1); hills.fillEllipse(300, BASE + 40, 1100, 380); hills.fillEllipse(1500, BASE + 50, 1300, 440);
  hills.fillStyle(0x5cc98a, 1); hills.fillEllipse(900, BASE + 70, 1500, 320);
  hills.fillStyle(0x4bbf7b, 1); hills.fillRect(0, BASE + 20, W, H - BASE);
  // Ciclorruta
  hills.fillStyle(0xe8dcc0, 1); hills.fillRoundedRect(-20, BASE + 120, W + 40, 46, 20);
  hills.fillStyle(0xffffff, 0.8);
  for (let x = 30; x < W; x += 150) hills.fillRoundedRect(x, BASE + 140, 70, 7, 3);
  bake(scene, [hills]);

  turbine(scene, 250, BASE - 60, 1.1);
  turbine(scene, 520, BASE - 100, 0.8);
  turbine(scene, 1790, BASE - 90, 1);
  ecoHouse(scene, 960, BASE + 30, 0xfff3d6, 1.05);
  ecoHouse(scene, 1330, BASE + 20, 0xffd6c9, 0.9);
  tree(scene, 1560, BASE + 30, 0.9);

  const dirty = [
    litter(scene, 1150, BASE + 110, 'paper', 1.5, 10), barren(scene, 700, BASE + 70, 1), litter(scene, 420, BASE + 110, 'bottle', 1.4, 75),
    trashPile(scene, 1700, BASE + 100, 0.9), barren(scene, 1480, BASE + 220, 1.2), smog(scene, 1100, 240, 1.2, 0x8a8490, 0.7),
    barren(scene, 330, BASE + 230, 1.3), trashPile(scene, 560, BASE + 60, 0.8),
  ];
  const clean = [
    tree(scene, 700, BASE + 60, 0.8, 0x3fae6a, 0x8be04e), flower(scene, 1150, BASE + 100, 0xff6fa5, 1.2), bow,
    garden(scene, 1480, BASE + 240), butterfly(scene, 600, 420, 0xff8a3d, 1.2), tree(scene, 330, BASE + 220, 1.0),
    flower(scene, 560, BASE + 80, 0xffd23f, 1.2), bird(scene, 1000, 240), bush(scene, 1720, BASE + 100, 0.9, 0x3fae6a, 0xe53935),
    flower(scene, 1820, BASE + 240, 0xb388ff, 1.3), butterfly(scene, 1400, 360, 0x42a5f5, 1.2), bird(scene, 300, 300),
  ];
  return { dirty, clean, haze: haze(scene, 0x8a8490), hazeMax: 0.22 };
}
