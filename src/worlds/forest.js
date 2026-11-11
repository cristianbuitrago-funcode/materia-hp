// Mundo 2: El Bosque Perdido. Pinos, sendero y animales que regresan.
import { W, H } from '../config/theme.js';
import { drawSky, addClouds } from '../art/backgrounds.js';
import { gfx, bake, trashPile, litter, flower, tree, pine, bush, smog, bird, butterfly, haze, rnd } from './kit.js';

function rabbit(scene, x, y, s = 1) {
  const g = gfx(scene, x, y, (g) => {
    g.fillStyle(0x000000, 0.14); g.fillEllipse(0, 0, 110 * s, 20 * s);
    g.fillStyle(0xf5efe6, 1);
    g.fillEllipse(0, -34 * s, 84 * s, 66 * s); g.fillCircle(38 * s, -74 * s, 30 * s);
    g.fillEllipse(30 * s, -122 * s, 16 * s, 56 * s); g.fillEllipse(52 * s, -118 * s, 16 * s, 52 * s);
    g.fillCircle(-42 * s, -30 * s, 14 * s);
    g.fillStyle(0xffb6c1, 1); g.fillEllipse(31 * s, -120 * s, 7 * s, 36 * s); g.fillCircle(64 * s, -70 * s, 5 * s);
    g.fillStyle(0x17324d, 1); g.fillCircle(46 * s, -80 * s, 5 * s);
  });
  scene.tweens.add({ targets: g, y: y - 26, duration: 300, yoyo: true, repeat: -1, repeatDelay: 1600, ease: 'Quad.out' });
  return g;
}

function mushroom(scene, x, y, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0xfff3e0, 1); g.fillRoundedRect(-9 * s, -30 * s, 18 * s, 32 * s, 6 * s);
    g.fillStyle(0xe53935, 1); g.fillEllipse(0, -36 * s, 62 * s, 38 * s); g.fillRect(-31 * s, -36 * s, 62 * s, 2 * s);
    g.fillStyle(0xffffff, 1); g.fillCircle(-12 * s, -42 * s, 6 * s); g.fillCircle(12 * s, -46 * s, 5 * s); g.fillCircle(2 * s, -32 * s, 4 * s);
  });
}

export function buildForest(scene) {
  const BASE = 640;
  drawSky(scene, 0x8fd6c0, 0xeaf8d2);
  addClouds(scene, 2, { yMax: 160, alpha: 0.8 });
  // Rayos de sol entre los árboles
  const rays = scene.add.graphics();
  rays.fillStyle(0xfff8c4, 0.22);
  [[500, 380], [900, 320], [1350, 400]].forEach(([x, w]) => rays.fillTriangle(x, 0, x + 90, 0, x - w / 2, BASE));

  const fixed = [rays];
  for (let i = 0; i < 16; i++) fixed.push(pine(scene, 40 + i * 124 + rnd(i) * 40, BASE - 10, 1.25 + rnd(i + 3) * 0.5, 0x7cc3a0, 0x7cc3a0));
  for (let i = 0; i < 11; i++) fixed.push(pine(scene, 90 + i * 178 + rnd(i + 20) * 60, BASE + 16, 1.5 + rnd(i + 9) * 0.5, 0x3f9a6c));

  const ground = scene.add.graphics();
  ground.fillStyle(0x4cae6e, 1); ground.fillRect(0, BASE, W, H - BASE);
  ground.fillStyle(0x3d9a5f, 1); ground.fillEllipse(400, BASE + 10, 900, 90); ground.fillEllipse(1500, BASE + 14, 1000, 100);
  // Sendero que se pierde en el bosque
  ground.fillStyle(0xd9b98a, 1);
  ground.fillPoints([{ x: 640, y: H }, { x: 1400, y: H }, { x: 1230, y: 860 }, { x: 1180, y: 740 }, { x: 1130, y: BASE + 6 }, { x: 1040, y: BASE + 6 }, { x: 1000, y: 740 }, { x: 900, y: 860 }], true);
  ground.fillStyle(0xc7a273, 1);
  [[1020, 800, 26], [1120, 900, 34], [900, 980, 30], [1250, 1000, 36], [1090, 700, 18]].forEach(([x, y, r]) => ground.fillEllipse(x, y, r * 2.4, r));

  // Árboles grandes en primer plano
  fixed.push(ground,
    tree(scene, 70, 760, 2.1, 0x2a7d4f, 0x4fbf7a, 0x5d4037), tree(scene, 1860, 780, 2.2, 0x2a7d4f, 0x4fbf7a, 0x5d4037),
    bush(scene, 330, BASE + 60, 1.1), bush(scene, 1640, BASE + 70, 1.2));
  bake(scene, fixed);

  const dirty = [
    litter(scene, 1500, BASE + 120, 'can', 1.5, 75), litter(scene, 480, BASE + 130, 'bottle', 1.5, -80), litter(scene, 1090, BASE + 90, 'paper', 1.5),
    trashPile(scene, 820, BASE + 70, 0.9), litter(scene, 250, BASE + 20, 'bag', 1.3, 10), trashPile(scene, 1400, BASE + 60, 1.0),
    smog(scene, 700, 230, 1.2, 0x8a7d5c, 0.7), trashPile(scene, 560, BASE + 40, 0.8), litter(scene, 1700, BASE + 30, 'bag', 1.4, -12),
    trashPile(scene, 1120, BASE + 130, 1.2),
  ];
  const clean = [
    flower(scene, 760, BASE + 80, 0xff6fa5, 1.2), mushroom(scene, 1420, BASE + 90, 1.3), butterfly(scene, 520, 420, 0xff8a3d, 1.3),
    flower(scene, 1480, BASE + 40, 0xffd23f, 1.2), bush(scene, 560, BASE + 44, 0.9, 0x3fae6a, 0xe53935), rabbit(scene, 1225, BASE + 170, 1),
    flower(scene, 420, BASE + 110, 0xb388ff, 1.3), butterfly(scene, 1500, 380, 0x42a5f5, 1.3), bird(scene, 800, 200, 0x17324d, 1.1),
    flower(scene, 1620, BASE + 130, 0xff8a3d, 1.3), mushroom(scene, 300, BASE + 130, 1.2), butterfly(scene, 1050, 480, 0xff6fa5, 1.1),
  ];
  return { dirty, clean, haze: haze(scene, 0x7a6a4a), hazeMax: 0.34 };
}
