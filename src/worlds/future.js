// Mundo 5: El Futuro Sostenible. Cinco lugares: el barrio solar, la huerta
// comunitaria, la planta de reciclaje, la plaza central y la fábrica gris de Contaminator.
import { W, H } from '../config/theme.js';
import { drawSky, addSun, addClouds } from '../art/backgrounds.js';
import { sign, veil, fountain, recyclingPlant } from './kit.js';
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

// Estos elementos van delante de las colinas, así que cada lugar los crea él mismo y los convierte en imagen.
const PLACES = [
  // 0 · El barrio solar
  (scene, BASE) => {
    turbine(scene, 250, BASE - 60, 1.1);
    turbine(scene, 1790, BASE - 90, 1);
    bake(scene, [ecoHouse(scene, 560, BASE + 30, 0xd6f0ff, 0.95), ecoHouse(scene, 1330, BASE + 20, 0xffd6c9, 0.9), ecoHouse(scene, 1600, BASE + 36, 0xfff3d6, 1.05), tree(scene, 800, BASE + 30, 0.8)]);
  },
  // 1 · La huerta comunitaria
  (scene, BASE) => {
    turbine(scene, 250, BASE - 60, 1.1);
    const greenhouse = gfx(scene, 1520, BASE + 20, (g) => {
      g.fillStyle(0xbfe6fa, 0.75); g.fillEllipse(0, 0, 460, 400); g.fillStyle(0x4bbf7b, 1); g.fillRect(-240, 0, 480, 210);
      g.lineStyle(7, 0xffffff, 0.95); g.strokeEllipse(0, 0, 460, 400); g.lineBetween(0, -200, 0, 0); g.lineBetween(-120, -170, -120, 0); g.lineBetween(120, -170, 120, 0); g.lineBetween(-224, -60, 224, -60);
      g.fillStyle(0x43a047, 1); [-150, -60, 40, 140].forEach((x) => g.fillCircle(x, -18, 26));
    });
    const scarecrow = gfx(scene, 560, BASE + 60, (g) => {
      g.fillStyle(0x8d6e63, 1); g.fillRect(-6, -200, 12, 200); g.fillRect(-80, -150, 160, 10);
      g.fillStyle(0xef5350, 1); g.fillRoundedRect(-44, -156, 88, 80, 10);
      g.fillStyle(0xffe0b2, 1); g.fillCircle(0, -186, 30); g.fillStyle(0xffd23f, 1); g.fillTriangle(-44, -206, 44, -206, 0, -250);
    });
    bake(scene, [greenhouse, scarecrow, garden(scene, 810, BASE + 190), garden(scene, 1240, BASE + 190), ...sign(scene, 812, BASE - 24, 'HUERTA')]);
  },
  // 2 · La planta de reciclaje
  (scene, BASE) => {
    turbine(scene, 250, BASE - 60, 1.1);
    turbine(scene, 520, BASE - 100, 0.8);
    const van = gfx(scene, 620, BASE + 70, (g) => {
      g.fillStyle(0x000000, 0.15); g.fillEllipse(0, 4, 320, 30);
      g.fillStyle(0x66bb6a, 1); g.fillRoundedRect(-150, -130, 300, 110, 22);
      g.fillStyle(0xbfe6fa, 1); g.fillRoundedRect(40, -116, 90, 46, 10);
      g.fillStyle(0xffffff, 1); g.fillCircle(-70, -76, 30); g.fillStyle(0x2e7d32, 1); g.fillCircle(-70, -76, 16);
      g.fillStyle(0x263238, 1); g.fillCircle(-90, -14, 26); g.fillCircle(90, -14, 26);
    });
    bake(scene, [...recyclingPlant(scene, 1500, BASE + 30), van]);
  },
  // 3 · La plaza central
  (scene, BASE) => {
    turbine(scene, 250, BASE - 60, 1.1);
    turbine(scene, 1790, BASE - 90, 1);
    const tower = gfx(scene, 1500, BASE + 30, (g) => {
      g.fillStyle(0xfff3d6, 1); g.fillRoundedRect(-70, -420, 140, 420, 8);
      g.fillStyle(0xd1495b, 1); g.fillTriangle(-90, -416, 90, -416, 0, -520);
      g.fillStyle(0xffffff, 1); g.fillCircle(0, -330, 48); g.lineStyle(6, 0x17324d, 1); g.strokeCircle(0, -330, 48); g.lineBetween(0, -330, 0, -362); g.lineBetween(0, -330, 24, -322);
      g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-30, -90, 60, 90, 8);
    });
    const bikes = gfx(scene, 800, BASE + 180, (g) => {
      g.lineStyle(7, 0x455a64, 1); g.strokeCircle(-40, -30, 28); g.strokeCircle(40, -30, 28);
      g.lineStyle(7, 0x1e88e5, 1); g.lineBetween(-40, -30, -10, -70); g.lineBetween(-10, -70, 30, -70); g.lineBetween(30, -70, 40, -30); g.lineBetween(-10, -70, 6, -30); g.lineBetween(30, -70, 24, -90);
    });
    bake(scene, [tower, fountain(scene, 600, BASE + 70, 1.1), bikes, ecoHouse(scene, 1250, BASE + 20, 0xd6f0ff, 0.8), ...sign(scene, 1232, BASE - 24, 'PLAZA')]);
  },
  // 4 · La fábrica gris (guarida de Contaminator)
  (scene, BASE) => {
    const factory = gfx(scene, 620, BASE + 40, (g) => {
      g.fillStyle(0x546e7a, 1); g.fillRect(-300, -260, 600, 260);
      for (let i = 0; i < 4; i++) g.fillTriangle(-300 + i * 150, -260, -300 + i * 150, -340, -150 + i * 150, -260);
      g.fillStyle(0x37474f, 1); [[-250, 480], [-150, 560], [-50, 430]].forEach(([x, h]) => g.fillRect(x, -h, 60, h - 260));
      g.fillStyle(0xffd23f, 0.8); for (let x = -260; x < 260; x += 90) g.fillRect(x, -200, 50, 60);
      g.fillStyle(0x263238, 1); g.fillRoundedRect(140, -130, 120, 130, 8);
    });
    const factory2 = gfx(scene, 1620, BASE + 30, (g) => {
      g.fillStyle(0x607d8b, 1); g.fillRect(-220, -200, 440, 200);
      g.fillStyle(0x455a64, 1); g.fillRect(90, -420, 70, 220); g.fillRect(-190, -200, 440, 20);
      g.fillStyle(0xffd23f, 0.8); for (let x = -180; x < 60; x += 80) g.fillRect(x, -140, 44, 54);
    });
    bake(scene, [factory, factory2, veil(scene, 0x2c2540, 0.3)]);
    smog(scene, 420, 150, 1.3, 0x4a4553, 0.9); smog(scene, 1760, 190, 1.2, 0x4a4553, 0.9);
  },
];

export function buildFuture(scene, place = 0) {
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

  PLACES[place](scene, BASE);

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
