// Mundo 4: La Montaña de Residuos. Un botadero que se encoge hasta
// convertirse en una colina verde con una planta de reciclaje.
import { W, H } from '../config/theme.js';
import { drawSky, addClouds } from '../art/backgrounds.js';
import { label } from '../ui/widgets.js';
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

function recyclingPlant(scene, x, y) {
  const c = scene.add.container(x, y);
  c.add(gfx(scene, 0, 0, (g) => {
    g.fillStyle(0x000000, 0.15); g.fillEllipse(0, 0, 520, 40);
    g.fillStyle(0xeceff1, 1); g.fillRoundedRect(-230, -210, 460, 210, 10);
    g.fillStyle(0x1e88e5, 1); g.fillRect(-230, -210, 460, 44);
    for (let i = 0; i < 3; i++) g.fillTriangle(-230 + i * 153, -210, -230 + i * 153, -276, -77 + i * 153, -210);
    g.fillStyle(0x90a4ae, 1); g.fillRoundedRect(-200, -110, 130, 110, 6);
    g.fillStyle(0xbfe6fa, 1); g.fillRoundedRect(-40, -130, 70, 60, 6); g.fillRoundedRect(60, -130, 70, 60, 6); g.fillRoundedRect(150, -130, 56, 60, 6);
  }));
  c.add(label(scene, 0, -188, 'RECICLAJE', { size: 30, color: '#FFFFFF' }));
  return c;
}

function compostBin(scene, x, y, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-60 * s, -80 * s, 120 * s, 80 * s, 8 * s);
    g.fillStyle(0x5d4037, 1); for (let i = 0; i < 3; i++) g.fillRect(-60 * s, (-64 + i * 24) * s, 120 * s, 6 * s);
    g.fillStyle(0x6d4c41, 1); g.fillEllipse(0, -80 * s, 110 * s, 34 * s);
    g.fillStyle(0x7cb342, 1); g.fillCircle(-20 * s, -92 * s, 12 * s); g.fillCircle(14 * s, -96 * s, 14 * s);
  });
}

export function buildMountain(scene) {
  const BASE = 660;
  drawSky(scene, 0xa99bc9, 0xf6dcb2);
  addClouds(scene, 3, { yMax: 220, tint: 0xfff1dc, alpha: 0.8 });
  const far = scene.add.graphics();
  far.fillStyle(0x9a8aa8, 1);
  [[200, 520, 190], [900, 700, 230], [1650, 560, 200]].forEach(([x, w, h]) => far.fillEllipse(x, BASE, w * 2, h * 2));
  far.fillStyle(0x8a7a6a, 1); far.fillRect(0, BASE, W, H - BASE);
  far.fillStyle(0x7b6b5c, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(100 + i * 160 + rnd(i) * 70, BASE + 110 + rnd(i + 4) * 260, 120, 16);

  bake(scene, [far]);

  // Se crea todo en orden de dibujo (del fondo al frente); el orden en que las
  // cosas aparecen o desaparecen al limpiar lo dan las listas `dirty` y `clean`.

  // Fondo recuperado: colina verde con la planta de reciclaje y árboles.
  const hill = gfx(scene, 1000, BASE + 10, (g) => {
    g.fillStyle(0x58b877, 1); g.fillEllipse(0, 0, 1500, 520);
    g.fillStyle(0x6fcc8b, 1); g.fillEllipse(-200, -60, 700, 300);
    g.fillStyle(0x8a7a6a, 1); g.fillRect(-760, 4, 1520, 300);
  });
  const plant = recyclingPlant(scene, 1440, BASE - 150);
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
