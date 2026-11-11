// Mundo 2: El Bosque Perdido. Cinco lugares: el sendero, el campamento,
// el claro, el río y el pantano de Moscardón.
import { W, H } from '../config/theme.js';
import { drawSky, addClouds } from '../art/backgrounds.js';
import { sign, veil } from './kit.js';
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

// Elementos propios de cada lugar. `ground` es el suelo, para pintar encima caminos y agua.
const PLACES = [
  // 0 · El sendero
  (scene, ground, BASE) => {
    ground.fillStyle(0xd9b98a, 1);
    ground.fillPoints([{ x: 640, y: H }, { x: 1400, y: H }, { x: 1230, y: 860 }, { x: 1180, y: 740 }, { x: 1130, y: BASE + 6 }, { x: 1040, y: BASE + 6 }, { x: 1000, y: 740 }, { x: 900, y: 860 }], true);
    ground.fillStyle(0xc7a273, 1);
    [[1020, 800, 26], [1120, 900, 34], [900, 980, 30], [1250, 1000, 36], [1090, 700, 18]].forEach(([x, y, r]) => ground.fillEllipse(x, y, r * 2.4, r));
    return sign(scene, 812, BASE - 14, 'SENDERO', 0x7a5236);
  },
  // 1 · El campamento
  (scene, ground, BASE) => {
    const tent = (x, y, c, c2) => gfx(scene, x, y, (g) => {
      g.fillStyle(0x000000, 0.14); g.fillEllipse(0, 4, 330, 34);
      g.fillStyle(c, 1); g.fillTriangle(-150, 0, 150, 0, 0, -200);
      g.fillStyle(c2, 1); g.fillTriangle(-40, 0, 40, 0, 0, -120);
      g.lineStyle(5, 0x5d4037, 1); g.lineBetween(0, -200, 0, -224);
    });
    const fire = gfx(scene, 810, BASE + 170, (g) => {
      g.fillStyle(0x5d4037, 1); g.fillRoundedRect(-52, -14, 104, 16, 8); g.fillRoundedRect(-40, -26, 80, 14, 7);
      g.fillStyle(0xff8a3d, 1); g.fillTriangle(-30, -24, 30, -24, 0, -100);
      g.fillStyle(0xffd23f, 1); g.fillTriangle(-16, -24, 16, -24, 2, -66);
    });
    const log = gfx(scene, 1230, BASE + 160, (g) => { g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-60, -30, 120, 30, 14); g.fillStyle(0xd7b899, 1); g.fillEllipse(58, -15, 16, 30); });
    return [tent(540, BASE + 50, 0xff8a3d, 0xb85a1c), tent(1420, BASE + 44, 0x42a5f5, 0x1565c0), fire, log, ...sign(scene, 1232, BASE - 14, 'CAMPING', 0x7a5236)];
  },
  // 2 · El claro
  (scene, ground, BASE) => {
    ground.fillStyle(0x7fd08f, 1); ground.fillEllipse(960, BASE + 110, 1500, 240);
    ground.fillStyle(0x94dba1, 1); ground.fillEllipse(900, BASE + 90, 800, 110);
    const stump = gfx(scene, 810, BASE + 170, (g) => { g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-44, -56, 88, 60, 10); g.fillStyle(0xd7b899, 1); g.fillEllipse(0, -56, 88, 26); g.lineStyle(3, 0xa1887f, 1); g.strokeEllipse(0, -56, 50, 14); });
    const fallen = gfx(scene, 1500, BASE + 60, (g) => { g.fillStyle(0x7a5236, 1); g.fillRoundedRect(-170, -50, 340, 50, 24); g.fillStyle(0xd7b899, 1); g.fillEllipse(168, -25, 26, 50); g.fillStyle(0x4cae6e, 1); g.fillEllipse(-60, -52, 90, 18); });
    return [stump, fallen, bush(scene, 520, BASE + 50, 1.0, 0x3fae6a, 0xff6fa5)];
  },
  // 3 · El río
  (scene, ground, BASE) => {
    ground.fillStyle(0x4fb7e8, 1);
    ground.fillPoints([{ x: 1150, y: BASE + 4 }, { x: 1300, y: BASE + 4 }, { x: 1330, y: 800 }, { x: 1180, y: 940 }, { x: 900, y: H }, { x: 300, y: H }, { x: 760, y: 900 }, { x: 1010, y: 780 }], true);
    ground.fillStyle(0xa6e0f7, 0.8);
    [[1200, 700, 60], [1120, 830, 90], [860, 960, 120], [620, 1040, 110]].forEach(([x, y, w]) => ground.fillEllipse(x, y, w, 10));
    ground.fillStyle(0x90a4ae, 1); [[1010, 820, 34], [1290, 880, 28], [760, 990, 40]].forEach(([x, y, r]) => ground.fillEllipse(x, y, r * 2, r));
    const bridge = gfx(scene, 1220, BASE + 100, (g) => {
      g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-190, -16, 380, 26, 8);
      g.lineStyle(8, 0x6d4c41, 1); [-170, -90, -10, 70, 150].forEach((x) => g.lineBetween(x, -16, x, -70)); g.lineBetween(-180, -66, 180, -66);
    });
    return [bridge, ...sign(scene, 812, BASE - 14, 'RÍO', 0x1e88e5)];
  },
  // 4 · El pantano (guarida de Moscardón)
  (scene, ground, BASE) => {
    ground.fillStyle(0x3d5a45, 1); ground.fillEllipse(960, BASE + 190, 1700, 330);
    ground.fillStyle(0x4f7359, 1); [[620, BASE + 150, 90], [1300, BASE + 210, 110], [980, BASE + 300, 80]].forEach(([x, y, w]) => ground.fillEllipse(x, y, w, 24));
    const dead = (x, y, s) => gfx(scene, x, y, (g) => {
      g.fillStyle(0x4e3b31, 1); g.fillRoundedRect(-16 * s, -300 * s, 32 * s, 304 * s, 10 * s);
      g.lineStyle(14 * s, 0x4e3b31, 1); g.lineBetween(0, -200 * s, -90 * s, -290 * s); g.lineBetween(0, -150 * s, 100 * s, -250 * s); g.lineBetween(0, -260 * s, 60 * s, -340 * s);
    });
    return [dead(520, BASE + 60, 1.1), dead(1420, BASE + 50, 1.25), veil(scene, 0x2f3d1f, 0.3)];
  },
];

export function buildForest(scene, place = 0) {
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
  const props = PLACES[place](scene, ground, BASE);

  // Árboles grandes en primer plano
  fixed.push(ground,
    tree(scene, 70, 760, 2.1, 0x2a7d4f, 0x4fbf7a, 0x5d4037), tree(scene, 1860, 780, 2.2, 0x2a7d4f, 0x4fbf7a, 0x5d4037),
    bush(scene, 330, BASE + 60, 1.1), bush(scene, 1640, BASE + 70, 1.2), ...props);
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
