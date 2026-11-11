// Mundo 3: El Océano en Peligro. Cinco lugares: la orilla, el muelle,
// el arrecife, mar abierto y la fosa de Plastipulpo.
import { W, H } from '../config/theme.js';
import { drawSky } from '../art/backgrounds.js';
import { sign, veil } from './kit.js';
import { gfx, bake, litter, fish, haze, rnd } from './kit.js';

function coral(scene, x, y, color, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(color, 1);
    [[0, 0, 150], [-34, -30, 100], [34, -20, 110], [-58, -6, 60], [60, -4, 56]].forEach(([dx, dy, h]) => {
      g.fillRoundedRect((dx - 13) * s, (dy - h) * s, 26 * s, h * s, 13 * s);
      g.fillCircle(dx * s, (dy - h) * s, 17 * s);
    });
    g.fillStyle(0xffffff, 0.25);
    [[0, -120], [-34, -100], [34, -96]].forEach(([dx, dy]) => g.fillCircle((dx - 4) * s, dy * s, 6 * s));
  });
}

function seaweed(scene, x, y, s = 1, color = 0x2e9e6b) {
  const g = gfx(scene, x, y, (g) => {
    g.fillStyle(color, 1);
    for (let i = 0; i < 6; i++) g.fillEllipse((i % 2 ? 12 : -12) * s, (-22 - i * 40) * s, 34 * s, 56 * s);
  });
  scene.tweens.add({ targets: g, angle: { from: -6, to: 6 }, duration: 2200 + rnd(x) * 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return g;
}

function turtle(scene, x, y, s = 1) {
  const c = scene.add.container(x, y);
  c.add(gfx(scene, 0, 0, (g) => {
    g.fillStyle(0x7cb342, 1);
    g.fillEllipse(88 * s, -6 * s, 60 * s, 42 * s); // cabeza
    g.fillEllipse(-50 * s, 34 * s, 70 * s, 28 * s); g.fillEllipse(44 * s, 40 * s, 80 * s, 30 * s); // aletas
    g.fillEllipse(-92 * s, 0, 34 * s, 18 * s);
    g.fillStyle(0x558b2f, 1); g.fillEllipse(0, 0, 160 * s, 104 * s);
    g.fillStyle(0x8bc34a, 1);
    [[-36, -10, 24], [10, -18, 28], [44, 8, 20], [-6, 22, 22], [-52, 20, 16]].forEach(([dx, dy, r]) => g.fillCircle(dx * s, dy * s, r * s));
    g.fillStyle(0xffffff, 1); g.fillCircle(100 * s, -12 * s, 9 * s);
    g.fillStyle(0x17324d, 1); g.fillCircle(103 * s, -12 * s, 5 * s);
  }));
  scene.tweens.add({ targets: c, x: x + 260, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: c, y: y - 40, angle: -5, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return c;
}

// Residuo que flota a la deriva.
function drifting(scene, obj) {
  scene.tweens.add({ targets: obj, y: obj.y - 36, angle: obj.angle + 14, duration: 2400 + rnd(obj.x) * 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return obj;
}

const PLACES = [
  // 0 · La orilla
  (scene, back, SAND) => {
    const boat = gfx(scene, 1480, 250, (g) => {
      g.fillStyle(0x8d6e63, 1); g.fillPoints([{ x: -190, y: -60 }, { x: 190, y: -60 }, { x: 130, y: 20 }, { x: -130, y: 20 }], true);
      g.fillStyle(0x6d4c41, 1); g.fillRect(-190, -60, 380, 14);
      g.lineStyle(6, 0x455a64, 1); g.lineBetween(120, 20, 150, SAND - 250 + 20);
    });
    const anchor = gfx(scene, 1632, SAND + 40, (g) => {
      g.lineStyle(12, 0x455a64, 1); g.lineBetween(0, -90, 0, -10); g.lineBetween(-30, -70, 30, -70);
      g.beginPath(); g.arc(0, -40, 40, 0.2, Math.PI - 0.2); g.strokePath(); g.strokeCircle(0, -100, 12);
    });
    const star = (x, y, c) => gfx(scene, x, y, (g) => {
      g.fillStyle(c, 1);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 - Math.PI / 2; g.fillTriangle(Math.cos(a) * 44, Math.sin(a) * 44, Math.cos(a + 1.9) * 16, Math.sin(a + 1.9) * 16, Math.cos(a - 1.9) * 16, Math.sin(a - 1.9) * 16); }
      g.fillCircle(0, 0, 18);
    });
    return [boat, anchor, star(810, SAND + 190, 0xff8a3d), star(1240, SAND + 250, 0xef5350)];
  },
  // 1 · El muelle
  (scene, back, SAND) => {
    const post = (x) => gfx(scene, x, SAND + 70, (g) => {
      g.fillStyle(0x6d4c41, 1); g.fillRect(-26, -640, 52, 640);
      g.fillStyle(0x8d6e63, 1); g.fillRect(-26, -640, 16, 640);
      g.fillStyle(0x2e9e6b, 0.9); g.fillEllipse(0, -30, 70, 40); g.fillEllipse(-10, -220, 40, 26);
    });
    const beam = gfx(scene, 0, 0, (g) => { g.fillStyle(0x5d4037, 1); g.fillRect(380, 196, 1420, 30); g.lineStyle(6, 0xd7b899, 1); g.lineBetween(470, 240, 760, 300); g.lineBetween(760, 300, 1270, 240); });
    return [beam, post(470), post(770), post(1270), post(1710)];
  },
  // 2 · El arrecife
  (scene, back, SAND) => {
    const arch = gfx(scene, 500, SAND + 60, (g) => {
      g.fillStyle(0x4d7191, 1); g.fillEllipse(0, -120, 420, 420);
      g.fillStyle(0x1a6bb0, 1); g.fillEllipse(0, -70, 220, 260); // hueco del arco (color del agua)
      g.fillStyle(0x4d7191, 1); g.fillRect(-210, -40, 420, 60);
    });
    const tubes = (x, c) => gfx(scene, x, SAND + 60, (g) => {
      [[-40, 120], [0, 170], [42, 100]].forEach(([dx, h]) => { g.fillStyle(c, 1); g.fillRoundedRect(dx - 20, -h, 40, h, 18); g.fillStyle(0x000000, 0.25); g.fillEllipse(dx, -h + 6, 26, 12); });
    });
    const rock = gfx(scene, 1700, SAND + 70, (g) => { g.fillStyle(0x4d7191, 1); g.fillEllipse(0, -70, 320, 240); g.fillStyle(0x6289a8, 1); g.fillEllipse(-40, -110, 150, 90); });
    return [arch, rock, tubes(790, 0xffd166), tubes(1250, 0xf48fb1)];
  },
  // 3 · Mar abierto
  (scene, back, SAND) => {
    const whale = gfx(scene, 560, 360, (g) => {
      g.fillStyle(0x0b4a86, 0.75); g.fillEllipse(0, 0, 420, 150); g.fillTriangle(-190, 0, -300, -70, -300, 60); g.fillTriangle(40, -60, 90, -120, 110, -50);
    });
    const ship = gfx(scene, 1540, SAND + 70, (g) => {
      g.fillStyle(0x5d4037, 1); g.fillPoints([{ x: -230, y: -150 }, { x: 200, y: -110 }, { x: 150, y: 0 }, { x: -180, y: 0 }], true);
      g.fillStyle(0x4e342e, 1); g.fillRect(-20, -330, 16, 200); g.fillTriangle(-4, -320, 110, -250, -4, -220);
      g.fillStyle(0x0b3f7d, 1); g.fillCircle(-100, -80, 20); g.fillCircle(-20, -74, 20); g.fillCircle(60, -66, 20);
    });
    return [whale, ship];
  },
  // 4 · La fosa (guarida de Plastipulpo)
  (scene, back, SAND) => {
    const wall = (flip) => gfx(scene, flip ? W : 0, 0, (g) => {
      const k = flip ? -1 : 1;
      g.fillStyle(0x12233f, 1); g.fillPoints([{ x: 0, y: 0 }, { x: 420 * k, y: 0 }, { x: 300 * k, y: 260 }, { x: 380 * k, y: 520 }, { x: 240 * k, y: SAND + 60 }, { x: 0, y: SAND + 60 }], true);
      g.fillStyle(0x1c3559, 1); g.fillPoints([{ x: 0, y: 200 }, { x: 250 * k, y: 300 }, { x: 180 * k, y: 600 }, { x: 0, y: 700 }], true);
    });
    const vent = (x) => gfx(scene, x, SAND + 60, (g) => { g.fillStyle(0x263238, 1); g.fillTriangle(-70, 0, 70, 0, 0, -120); g.fillStyle(0x9bc53d, 0.5); g.fillCircle(0, -150, 30); g.fillCircle(-16, -210, 20); g.fillCircle(14, -260, 14); });
    return [wall(false), wall(true), vent(780), vent(1260), veil(scene, 0x050b24, 0.38)];
  },
];

export function buildOcean(scene, place = 0) {
  const SAND = 700;
  drawSky(scene, 0x25a4e6, 0x0b3f7d);
  // Rayos de luz desde la superficie
  const rays = scene.add.graphics();
  rays.fillStyle(0xffffff, 0.07);
  [[300, 500], [760, 420], [1250, 560], [1650, 380]].forEach(([x, w]) => rays.fillTriangle(x, 0, x + 140, 0, x - w / 2 + 70, SAND + 80));
  scene.tweens.add({ targets: rays, alpha: 0.5, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // Rocas lejanas y fondo de arena
  const back = scene.add.graphics();
  back.fillStyle(0x0d4f8f, 1);
  [[200, 300, 200], [700, 380, 150], [1300, 420, 230], [1750, 300, 180]].forEach(([x, w, h]) => back.fillEllipse(x, SAND + 20, w * 2, h * 2));
  back.fillStyle(0xe6c98c, 1); back.fillRect(0, SAND + 30, W, H - SAND);
  back.fillStyle(0xf0d9a4, 1);
  [[300, 700, 70], [1100, 900, 80], [1750, 600, 60]].forEach(([x, w, h]) => back.fillEllipse(x, SAND + 34, w, h));
  back.fillStyle(0xd4b376, 1);
  for (let i = 0; i < 14; i++) back.fillEllipse(80 + i * 140 + rnd(i) * 60, SAND + 130 + rnd(i + 5) * 220, 70, 12);
  back.fillStyle(0x6d7f8f, 1); back.fillEllipse(1840, SAND + 40, 220, 150); back.fillEllipse(40, SAND + 50, 200, 130);
  bake(scene, [back, ...PLACES[place](scene, back, SAND)]);

  seaweed(scene, 150, SAND + 50, 1.2);
  seaweed(scene, 1790, SAND + 40, 1.3, 0x3fae6a);
  seaweed(scene, 420, SAND + 44, 0.8, 0x43a57a);

  // Burbujas que suben sin parar
  scene.add.particles(0, 0, 'dot', {
    x: { min: 0, max: W }, y: H + 20, lifespan: 9000, frequency: 420, speedY: { min: -150, max: -80 }, speedX: { min: -14, max: 14 },
    scale: { min: 0.25, max: 0.7 }, alpha: { start: 0.45, end: 0 },
  });

  const dirty = [
    drifting(scene, litter(scene, 1560, 420, 'bottle', 1.6, 60)), drifting(scene, litter(scene, 420, 300, 'can', 1.5, -40)),
    litter(scene, 900, SAND + 70, 'can', 1.5, 85), drifting(scene, litter(scene, 700, 420, 'bag', 1.9, 12)),
    litter(scene, 1380, SAND + 90, 'bottle', 1.6, -85), drifting(scene, litter(scene, 1250, 260, 'bag', 1.6, -16)),
    coral(scene, 520, SAND + 60, 0x8f9aa3, 1.1), drifting(scene, litter(scene, 1750, 300, 'bag', 2.1, 8)),
    coral(scene, 1560, SAND + 70, 0x9aa3ab, 1.3), drifting(scene, litter(scene, 240, 470, 'bag', 2.2, -8)),
  ];
  const clean = [
    coral(scene, 520, SAND + 60, 0xff7f9f, 1.1), fish(scene, 380, 330, 0xffb300, 1.1, 1),
    coral(scene, 1560, SAND + 70, 0xff9e40, 1.3), fish(scene, 760, 520, 0xff7043, 0.9, -1, 300),
    coral(scene, 1000, SAND + 40, 0xb388ff, 0.8), turtle(scene, 1290, 340, 0.9),
    fish(scene, 1100, 400, 0x4dd0e1, 0.8, 1, 300), coral(scene, 250, SAND + 70, 0xffd166, 0.8),
    fish(scene, 220, 220, 0xf06292, 0.7, 1, 520), fish(scene, 1700, 480, 0xffd23f, 1, -1, 360),
  ];
  return { dirty, clean, haze: haze(scene, 0x4a5a2e), hazeMax: 0.4 };
}
