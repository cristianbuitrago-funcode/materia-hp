// Mundo 1: La Ciudad Contaminada. Cinco lugares: el parque, el colegio,
// la oficina, el punto de basuras y el callejón de Ratasura.
import { W, H } from '../config/theme.js';
import { drawSky, addSun, addClouds } from '../art/backgrounds.js';
import { gfx, bake, sign, veil, bricks, fountain, trashPile, litter, flower, tree, smog, bird, haze } from './kit.js';

const BASE = 650;

function building(g, x, base, w, h, color, win = 0xffe9a8) {
  g.fillStyle(color, 1); g.fillRoundedRect(x, base - h, w, h, 10);
  g.fillStyle(0x000000, 0.12); g.fillRect(x + w - 22, base - h + 8, 22, h - 8);
  g.fillStyle(win, 0.95);
  for (let wx = x + 22; wx < x + w - 60; wx += 58) for (let wy = base - h + 30; wy < base - 60; wy += 70) g.fillRoundedRect(wx, wy, 30, 38, 5);
}

// Contenedor grande de basura.
function dumpster(scene, x, y, color) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 4, 270, 30);
    g.fillStyle(0x263238, 1); g.fillCircle(-80, -6, 16); g.fillCircle(80, -6, 16);
    g.fillStyle(color, 1); g.fillPoints([{ x: -120, y: -150 }, { x: 120, y: -150 }, { x: 104, y: -14 }, { x: -104, y: -14 }], true);
    g.fillStyle(0x000000, 0.18); g.fillRect(-116, -100, 232, 10);
    g.fillStyle(0x37474f, 1); g.fillRoundedRect(-130, -176, 260, 32, 10);
  });
}

const PLACES = [
  // 0 · El parque
  (scene, near) => {
    building(near, 820, BASE, 250, 300, 0x7fb8e6);
    const lawn = gfx(scene, 960, BASE + 26, (g) => { g.fillStyle(0x6cc48a, 1); g.fillEllipse(0, 0, 2000, 150); g.fillStyle(0x5cb87a, 1); g.fillEllipse(-300, 10, 700, 60); });
    const swings = gfx(scene, 1500, BASE + 40, (g) => {
      g.lineStyle(12, 0xef5350, 1); g.lineBetween(-130, 0, -90, -190); g.lineBetween(-50, 0, -90, -190); g.lineBetween(130, 0, 90, -190); g.lineBetween(50, 0, 90, -190); g.lineBetween(-90, -190, 90, -190);
      g.lineStyle(5, 0x455a64, 1); [-40, -10, 20, 50].forEach((x) => g.lineBetween(x, -188, x, -60));
      g.fillStyle(0xffd23f, 1); g.fillRoundedRect(-46, -66, 42, 12, 4); g.fillRoundedRect(14, -66, 42, 12, 4);
    });
    return [lawn, tree(scene, 330, BASE + 20, 1.1), tree(scene, 1250, BASE + 14, 0.9, 0x3fae6a, 0x8be04e), tree(scene, 1760, BASE + 20, 1.05),
      fountain(scene, 640, BASE + 60, 1), swings, ...sign(scene, 812, BASE - 24, 'PARQUE')];
  },
  // 1 · El colegio
  (scene, near) => {
    building(near, 300, BASE, 230, 300, 0xf4a261);
    building(near, 820, BASE, 250, 350, 0x7fb8e6);
    near.fillStyle(0xffd166, 1); near.fillRoundedRect(1370, BASE - 230, 400, 230, 8);
    near.fillStyle(0xd1495b, 1); near.fillTriangle(1350, BASE - 228, 1790, BASE - 228, 1570, BASE - 340);
    near.fillStyle(0x8d6e63, 1); near.fillRoundedRect(1535, BASE - 120, 70, 120, 8);
    near.fillStyle(0xbfe6fa, 1); [1400, 1470, 1640, 1710].forEach((x) => near.fillRoundedRect(x, BASE - 180, 46, 56, 6));
    near.fillStyle(0x9aa7b1, 1); near.fillRect(1820, BASE - 330, 8, 330);
    near.fillStyle(0x2bb673, 1); near.fillTriangle(1828, BASE - 330, 1900, BASE - 305, 1828, BASE - 280);
    const hopscotch = gfx(scene, 800, BASE + 150, (g) => {
      [[0, 0, 0xef5350], [0, -46, 0xffd23f], [-26, -92, 0x42a5f5], [26, -92, 0x66bb6a], [0, -138, 0xff8a3d]].forEach(([x, y, c]) => { g.fillStyle(c, 0.9); g.fillRoundedRect(x - 24, y - 20, 48, 40, 6); });
    });
    return [hopscotch, tree(scene, 120, BASE + 6, 1.0), ...sign(scene, 1570, BASE - 110, 'COLEGIO', 0xd1495b)];
  },
  // 2 · La oficina
  (scene, near) => {
    const tower = (x, w, h, c) => {
      near.fillStyle(c, 1); near.fillRoundedRect(x, BASE - h, w, h, 8);
      near.fillStyle(0xbfe6fa, 0.9);
      for (let wy = BASE - h + 22; wy < BASE - 40; wy += 46) near.fillRect(x + 14, wy, w - 28, 26);
      near.fillStyle(0xffffff, 0.25); near.fillRect(x + 14, BASE - h + 22, 30, h - 62);
    };
    tower(250, 240, 440, 0x3f6fa8); tower(520, 200, 330, 0x5c8fc7); tower(1230, 260, 470, 0x2f5d94); tower(1520, 220, 360, 0x4a7fb8);
    near.fillStyle(0x455a64, 1); near.fillRoundedRect(330, BASE - 100, 80, 100, 6); near.fillRoundedRect(1320, BASE - 100, 80, 100, 6);
    const busStop = gfx(scene, 1780, BASE + 40, (g) => {
      g.fillStyle(0x455a64, 1); g.fillRect(-90, -170, 10, 170); g.fillRect(80, -170, 10, 170);
      g.fillStyle(0x1e88e5, 1); g.fillRoundedRect(-110, -190, 220, 26, 8);
      g.fillStyle(0xbfe6fa, 0.6); g.fillRect(-80, -160, 160, 90);
      g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-70, -56, 140, 14, 5);
    });
    return [busStop, ...sign(scene, 812, BASE - 24, 'OFICINAS', 0x2f5d94)];
  },
  // 3 · El punto de basuras
  (scene, near) => {
    building(near, 300, BASE, 230, 300, 0xa9b4bf);
    building(near, 1500, BASE, 250, 330, 0xb9a79a);
    bricks(near, 420, BASE - 210, 1100, 210);
    near.fillStyle(0x6d4c41, 1); near.fillRect(420, BASE - 222, 1100, 14);
    const lamp = gfx(scene, 900, BASE + 30, (g) => {
      g.fillStyle(0x455a64, 1); g.fillRect(-6, -330, 12, 330); g.fillRoundedRect(-6, -340, 80, 12, 6);
      g.fillStyle(0xfff3b0, 1); g.fillEllipse(62, -322, 44, 22);
    });
    return [lamp, dumpster(scene, 560, BASE + 44, 0x43a047), dumpster(scene, 1290, BASE + 44, 0x1e88e5), dumpster(scene, 1660, BASE + 50, 0x78909c),
      ...sign(scene, 1232, BASE - 24, 'BASURAS', 0x6d4c41)];
  },
  // 4 · El callejón (guarida de Ratasura)
  (scene, near) => {
    bricks(near, 0, BASE - 560, 760, 560, 0x8a5240, 0x5e3528);
    bricks(near, 1180, BASE - 560, 740, 560, 0x7c4a3a, 0x5e3528);
    near.fillStyle(0x263238, 1);
    [[120, 330], [430, 330], [1340, 300], [1650, 300]].forEach(([x, y]) => near.fillRoundedRect(x, BASE - y, 130, 150, 8));
    near.fillStyle(0xffe082, 0.75); near.fillRoundedRect(440, BASE - 320, 110, 130, 6);
    near.fillStyle(0x546e7a, 1); near.fillRect(700, BASE - 560, 22, 560); near.fillRect(1196, BASE - 560, 22, 560);
    const manhole = gfx(scene, 960, BASE + 190, (g) => {
      g.fillStyle(0x37474f, 1); g.fillEllipse(0, 0, 260, 70); g.fillStyle(0x263238, 1); g.fillEllipse(0, 0, 210, 50);
      g.lineStyle(5, 0x546e7a, 1); [-60, -20, 20, 60].forEach((x) => g.lineBetween(x, -20, x, 20));
    });
    return [manhole, veil(scene, 0x2a1f4a, 0.3)];
  },
];

export function buildCity(scene, place = 0) {
  const lair = place === 4;
  drawSky(scene, lair ? 0x4b4f86 : 0x6ec1f2, lair ? 0xf2b48c : 0xd9f1ff);
  if (!lair) addSun(scene, 1660, 200, 90);
  addClouds(scene, 3, { yMax: 230, alpha: lair ? 0.5 : 0.95 });

  const far = scene.add.graphics();
  [[40, 150, 300, 0x9fb3c8], [230, 190, 400, 0xb0bfd0], [470, 160, 330, 0x9fb3c8], [700, 200, 440, 0xb0bfd0], [960, 170, 360, 0x9fb3c8],
    [1180, 210, 420, 0xb0bfd0], [1440, 160, 320, 0x9fb3c8], [1650, 220, 390, 0xb0bfd0]].forEach(([x, w, h, c]) => building(far, x, BASE, w, h, c, 0xe8f1f8));

  const near = scene.add.graphics();
  // Andén y calle (se crean antes que los elementos del lugar, que se apoyan encima).
  const ground = scene.add.graphics();
  ground.fillStyle(0xcfd6dc, 1); ground.fillRect(0, BASE, W, 56);
  ground.fillStyle(0xaab4bf, 1); ground.fillRect(0, BASE + 56, W, 10);
  ground.fillStyle(0x8e9aa5, 1); ground.fillRect(0, BASE + 66, W, H - BASE - 66);
  ground.fillStyle(0xffffff, 0.5);
  for (let x = 40; x < W; x += 220) ground.fillRoundedRect(x, BASE + 120, 110, 14, 7);

  const props = PLACES[place](scene, near);
  bake(scene, [far, near, ground, ...props]);

  const dirty = [
    litter(scene, 1320, BASE + 150, 'paper', 1.6, 20), litter(scene, 820, BASE + 110, 'can', 1.4, 80), litter(scene, 1760, BASE + 180, 'bottle', 1.4, -70),
    trashPile(scene, 250, BASE + 60, 1.1), smog(scene, 1300, 240, 1.3), trashPile(scene, 1240, BASE + 50, 0.9),
    smog(scene, 420, 190, 1.5), trashPile(scene, 1720, BASE + 70, 1.2), smog(scene, 900, 300, 1.1, 0x7a7280),
    trashPile(scene, 760, BASE + 44, 0.8),
  ];
  const clean = [
    flower(scene, 60, BASE + 40, 0xff6fa5, 1.2), flower(scene, 220, BASE + 50, 0xffd23f, 1.2), bird(scene, 500, 260),
    flower(scene, 1300, BASE + 130, 0xff8a3d, 1.1), flower(scene, 1800, BASE + 136, 0xb388ff, 1.2), bird(scene, 1200, 330),
    flower(scene, 760, BASE + 130, 0xff6fa5, 1.1), flower(scene, 1230, BASE + 140, 0xffd23f, 1.0),
  ];
  return { dirty, clean, haze: haze(scene, 0x6f6a78), hazeMax: 0.4 };
}
