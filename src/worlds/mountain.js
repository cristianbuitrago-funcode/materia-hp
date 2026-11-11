// Mundo 4: La Montaña de Residuos. Un botadero que se encoge hasta volverse
// una colina verde. Cinco lugares: la entrada, el taller de reúso, la banda
// de separación, la cima y el cráter de Basurón.
import { W, H } from '../config/theme.js';
import { drawSky, addClouds } from '../art/backgrounds.js';
import { sign, veil, recyclingPlant } from './kit.js';
import { gfx, bake, bakeItem, trashPile, litter, flower, tree, smog, bird, haze, rnd } from './kit.js';

const BITS = [0x90caf9, 0xffe082, 0xef9a9a, 0xce93d8, 0xa5d6a7, 0xffffff, 0xffab91, 0xb0bec5];

// Montón gigante de basura de ancho w y alto h, apoyado en (x, y).
function heap(scene, x, y, w, h, seed) {
  return bakeItem(scene, gfx(scene, x, y, (g) => {
    const pts = [{ x: -w / 2, y: 0 }];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const up = Math.sin(t * Math.PI) ** 0.8;
      pts.push({ x: -w / 2 + w * t, y: -h * up - rnd(seed + i) * 30 });
    }
    pts.push({ x: w / 2, y: 0 });
    g.fillStyle(0x6f6156, 1); g.fillPoints(pts, true);
    g.fillStyle(0x857567, 1);
    g.fillPoints(pts.map((p) => ({ x: p.x * 0.72 - w * 0.06, y: p.y * 0.8 })), true);
    for (let i = 0; i < 46; i++) {
      const t = 0.08 + rnd(seed * 7 + i) * 0.84;
      const top = -h * Math.sin(t * Math.PI) ** 0.8;
      const bx = -w / 2 + w * t, by = top * (0.12 + rnd(seed * 3 + i) * 0.8);
      g.fillStyle(BITS[i % BITS.length], 0.95);
      if (i % 3 === 0) g.fillCircle(bx, by, 9 + rnd(i) * 10);
      else g.fillRoundedRect(bx - 14, by - 10, 22 + rnd(i) * 16, 16 + rnd(i + 2) * 10, 4);
    }
  }), w + 60, h + 60);
}

function compostBin(scene, x, y, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-60 * s, -80 * s, 120 * s, 80 * s, 8 * s);
    g.fillStyle(0x5d4037, 1); for (let i = 0; i < 3; i++) g.fillRect(-60 * s, (-64 + i * 24) * s, 120 * s, 6 * s);
    g.fillStyle(0x6d4c41, 1); g.fillEllipse(0, -80 * s, 110 * s, 34 * s);
    g.fillStyle(0x7cb342, 1); g.fillCircle(-20 * s, -92 * s, 12 * s); g.fillCircle(14 * s, -96 * s, 14 * s);
  });
}

const PLACES = [
  // 0 · La entrada
  (scene, BASE) => {
    const fence = gfx(scene, 0, BASE, (g) => {
      g.lineStyle(5, 0x78909c, 1); g.lineBetween(0, -60, W, -60); g.lineBetween(0, -30, W, -30);
      g.fillStyle(0x546e7a, 1); for (let x = 20; x < W; x += 120) g.fillRect(x, -90, 10, 92);
    });
    const truck = gfx(scene, 1690, BASE + 60, (g) => {
      g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 4, 400, 34);
      g.fillStyle(0x78909c, 1); g.fillRoundedRect(-190, -170, 250, 150, 10);
      g.fillStyle(0xff8a3d, 1); g.fillRoundedRect(64, -130, 120, 110, 12);
      g.fillStyle(0xbfe6fa, 1); g.fillRoundedRect(110, -116, 62, 44, 6);
      g.fillStyle(0x263238, 1); g.fillCircle(-120, -14, 30); g.fillCircle(120, -14, 30);
      g.fillStyle(0x90a4ae, 1); g.fillCircle(-120, -14, 12); g.fillCircle(120, -14, 12);
    });
    return [fence, truck, ...sign(scene, 812, BASE - 24, 'BOTADERO', 0x6d4c41)];
  },
  // 1 · El taller de reúso
  (scene, BASE) => {
    const shed = gfx(scene, 1560, BASE + 20, (g) => {
      g.fillStyle(0x26a69a, 1); g.fillRoundedRect(-210, -220, 420, 220, 8);
      g.fillStyle(0xef5350, 1); g.fillTriangle(-240, -216, 240, -216, 0, -320);
      g.fillStyle(0x004d40, 1); g.fillRect(-190, -150, 170, 8); g.fillRect(-190, -80, 170, 8);
      [[-170, 0xffd166], [-120, 0x90caf9], [-70, 0xf48fb1]].forEach(([x, c]) => { g.fillStyle(c, 1); g.fillRoundedRect(x, -190, 34, 40, 8); g.fillRoundedRect(x, -120, 34, 40, 8); });
      g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(40, -130, 100, 130, 8);
    });
    const tires = gfx(scene, 470, BASE + 50, (g) => {
      [0, -44, -88].forEach((y) => { g.fillStyle(0x263238, 1); g.fillEllipse(0, y - 20, 150, 50); g.fillStyle(0x90a4ae, 1); g.fillEllipse(0, y - 22, 60, 16); });
    });
    return [shed, tires, ...sign(scene, 1560, BASE - 120, 'TALLER', 0x00796b)];
  },
  // 2 · La banda de separación
  (scene, BASE) => {
    const belt = gfx(scene, 0, BASE - 40, (g) => {
      g.fillStyle(0x546e7a, 1); for (let x = 460; x < 1640; x += 230) g.fillRect(x, 0, 16, 70);
      g.fillStyle(0x263238, 1); g.fillRoundedRect(400, -34, 1260, 40, 20);
      g.fillStyle(0x90a4ae, 1); for (let x = 430; x < 1650; x += 70) g.fillCircle(x, -14, 12);
      [[520, 0x90caf9], [760, 0xffe082], [1280, 0xef9a9a], [1500, 0xa5d6a7]].forEach(([x, c]) => { g.fillStyle(c, 1); g.fillRoundedRect(x - 22, -66, 44, 32, 6); });
    });
    const hopper = (x, c) => gfx(scene, x, BASE + 40, (g) => { g.fillStyle(c, 1); g.fillPoints([{ x: -80, y: -120 }, { x: 80, y: -120 }, { x: 46, y: 0 }, { x: -46, y: 0 }], true); g.fillStyle(0x000000, 0.2); g.fillRect(-80, -120, 160, 14); });
    return [belt, hopper(1760, 0x1e88e5), hopper(470, 0x43a047)];
  },
  // 3 · La cima
  (scene, BASE) => {
    const mist = gfx(scene, 0, BASE - 10, (g) => { g.fillStyle(0xffffff, 0.75); [[160, 300], [520, 380], [1420, 360], [1780, 320]].forEach(([x, w]) => { g.fillEllipse(x, 0, w, 70); g.fillEllipse(x + 60, -26, w * 0.6, 60); }); });
    const antenna = gfx(scene, 1720, BASE + 20, (g) => {
      g.lineStyle(8, 0x546e7a, 1); g.lineBetween(-50, 0, 0, -360); g.lineBetween(50, 0, 0, -360);
      [[-38, -80], [-26, -170], [-13, -260]].forEach(([x, y]) => g.lineBetween(x, y, -x, y));
      g.fillStyle(0xef5350, 1); g.fillCircle(0, -366, 12);
    });
    const flag = gfx(scene, 420, BASE + 30, (g) => { g.fillStyle(0x90a4ae, 1); g.fillRect(-5, -260, 10, 260); g.fillStyle(0x2bb673, 1); g.fillTriangle(5, -260, 110, -225, 5, -190); });
    return [mist, antenna, flag];
  },
  // 4 · El cráter (guarida de Basurón)
  (scene, BASE) => {
    const goo = gfx(scene, 0, 0, (g) => { g.fillStyle(0x9bc53d, 0.9); [[480, BASE + 140, 280], [1500, BASE + 170, 340], [820, BASE + 260, 180]].forEach(([x, y, w]) => g.fillEllipse(x, y, w, w * 0.22)); g.fillStyle(0xcfe87a, 0.9); g.fillEllipse(460, BASE + 134, 90, 16); g.fillEllipse(1540, BASE + 164, 120, 20); });
    const spike = (x, s) => gfx(scene, x, BASE + 30, (g) => { g.fillStyle(0x4e3b31, 1); g.fillTriangle(-90 * s, 0, 90 * s, 0, 20 * s, -330 * s); g.fillStyle(0x6d5548, 1); g.fillTriangle(-90 * s, 0, -10 * s, 0, 20 * s, -330 * s); });
    return [goo, spike(180, 1), spike(1780, 1.15), spike(380, 0.6), veil(scene, 0x2b1a12, 0.3)];
  },
];

export function buildMountain(scene, place = 0) {
  const BASE = 660;
  drawSky(scene, 0xa99bc9, 0xf6dcb2);
  addClouds(scene, 3, { yMax: 220, tint: 0xfff1dc, alpha: 0.8 });
  const far = scene.add.graphics();
  far.fillStyle(0x9a8aa8, 1);
  [[200, 520, 190], [900, 700, 230], [1650, 560, 200]].forEach(([x, w, h]) => far.fillEllipse(x, BASE, w * 2, h * 2));
  far.fillStyle(0x8a7a6a, 1); far.fillRect(0, BASE, W, H - BASE);
  far.fillStyle(0x7b6b5c, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(100 + i * 160 + rnd(i) * 70, BASE + 110 + rnd(i + 4) * 260, 120, 16);

  bake(scene, [far, ...PLACES[place](scene, BASE)]);

  // Se crea todo en orden de dibujo (del fondo al frente); el orden en que las
  // cosas aparecen o desaparecen al limpiar lo dan las listas `dirty` y `clean`.

  // Fondo recuperado: colina verde con la planta de reciclaje y árboles.
  const hill = gfx(scene, 1000, BASE + 10, (g) => {
    g.fillStyle(0x58b877, 1); g.fillEllipse(0, 0, 1500, 520);
    g.fillStyle(0x6fcc8b, 1); g.fillEllipse(-200, -60, 700, 300);
    g.fillStyle(0x8a7a6a, 1); g.fillRect(-760, 4, 1520, 300);
  });
  const plant = scene.add.container(1440, BASE - 150, recyclingPlant(scene, 0, 0));
  const treeA = tree(scene, 600, BASE - 150, 0.9);
  const treeB = tree(scene, 1800, BASE - 40, 0.8, 0x3fae6a, 0x8be04e);

  // La montaña son tres montones en el mismo sitio: al limpiar se va el más grande y queda el siguiente.
  const big = heap(scene, 1000, BASE + 20, 1500, 520, 1);
  const mid = heap(scene, 1000, BASE + 20, 1100, 370, 2);
  const small = heap(scene, 1000, BASE + 20, 720, 220, 3);

  const dirty = [
    small, litter(scene, 1650, BASE + 150, 'bag', 1.6, 12), trashPile(scene, 300, BASE + 90, 1.2), mid,
    smog(scene, 1150, 150, 1.2, 0x5f554d), trashPile(scene, 1720, BASE + 60, 1.1), litter(scene, 520, BASE + 160, 'can', 1.6, 80),
    smog(scene, 800, 200, 1.5, 0x6b5f55), trashPile(scene, 760, BASE + 130, 0.9), big,
  ];
  const clean = [
    hill, flower(scene, 420, BASE + 60, 0xffd23f, 1.3), treeA, compostBin(scene, 1230, BASE + 150, 0.95),
    plant, bird(scene, 500, 230), flower(scene, 1700, BASE + 90, 0xff6fa5, 1.3), treeB,
    compostBin(scene, 810, BASE + 150, 0.9), flower(scene, 880, BASE + 40, 0xb388ff, 1.2), bird(scene, 1300, 180),
  ];
  return { dirty, clean, haze: haze(scene, 0x6b5a4a), hazeMax: 0.34 };
}
