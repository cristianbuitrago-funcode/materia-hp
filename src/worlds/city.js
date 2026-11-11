// Mundo 1: La Ciudad Contaminada. Calles, parque, colegio y tienda.
import { W, H } from '../config/theme.js';
import { drawSky, addSun, addClouds } from '../art/backgrounds.js';
import { label } from '../ui/widgets.js';
import { gfx, bake, trashPile, litter, flower, tree, smog, bird, haze } from './kit.js';

function building(g, x, base, w, h, color, win = 0xffe9a8) {
  g.fillStyle(color, 1); g.fillRoundedRect(x, base - h, w, h, 10);
  g.fillStyle(0x000000, 0.12); g.fillRect(x + w - 22, base - h + 8, 22, h - 8);
  g.fillStyle(win, 0.95);
  for (let wx = x + 22; wx < x + w - 60; wx += 58) for (let wy = base - h + 30; wy < base - 60; wy += 70) g.fillRoundedRect(wx, wy, 30, 38, 5);
}

export function buildCity(scene) {
  const BASE = 650;
  drawSky(scene, 0x6ec1f2, 0xd9f1ff);
  addSun(scene, 1660, 200, 90);
  addClouds(scene, 3, { yMax: 230 });

  const far = scene.add.graphics();
  [[40, 150, 300, 0x9fb3c8], [230, 190, 400, 0xb0bfd0], [470, 160, 330, 0x9fb3c8], [700, 200, 440, 0xb0bfd0], [960, 170, 360, 0x9fb3c8],
    [1180, 210, 420, 0xb0bfd0], [1440, 160, 320, 0x9fb3c8], [1650, 220, 390, 0xb0bfd0]].forEach(([x, w, h, c]) => building(far, x, BASE, w, h, c, 0xe8f1f8));

  const near = scene.add.graphics();
  building(near, 300, BASE, 230, 300, 0xf4a261);
  building(near, 820, BASE, 250, 350, 0x7fb8e6);
  building(near, 1120, BASE, 210, 260, 0xe98a9b);
  // Tienda con toldo
  near.fillStyle(0xfff3d6, 1); near.fillRoundedRect(560, BASE - 190, 230, 190, 8);
  near.fillStyle(0x8d6e63, 1); near.fillRect(650, BASE - 100, 54, 100);
  near.fillStyle(0xbfe6fa, 1); near.fillRect(578, BASE - 110, 56, 60); near.fillRect(720, BASE - 110, 56, 60);
  for (let i = 0; i < 6; i++) { near.fillStyle(i % 2 ? 0xffffff : 0xef5350, 1); near.fillRect(552 + i * 41, BASE - 190, 41, 46); }
  const shopSign = label(scene, 675, BASE - 226, 'TIENDA', { size: 30, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 8 });
  // Colegio
  near.fillStyle(0xffd166, 1); near.fillRoundedRect(1370, BASE - 230, 400, 230, 8);
  near.fillStyle(0xd1495b, 1); near.fillTriangle(1350, BASE - 228, 1790, BASE - 228, 1570, BASE - 340);
  near.fillStyle(0x8d6e63, 1); near.fillRoundedRect(1535, BASE - 120, 70, 120, 8);
  near.fillStyle(0xbfe6fa, 1);
  [1400, 1470, 1640, 1710].forEach((x) => near.fillRoundedRect(x, BASE - 180, 46, 56, 6));
  near.fillStyle(0x9aa7b1, 1); near.fillRect(1820, BASE - 330, 8, 330);
  near.fillStyle(0x2bb673, 1); near.fillTriangle(1828, BASE - 330, 1900, BASE - 305, 1828, BASE - 280);
  const schoolSign = label(scene, 1570, BASE - 262, 'COLEGIO', { size: 32, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 8 });

  // Parque y suelo: andén y plaza
  const ground = scene.add.graphics();
  ground.fillStyle(0x6cc48a, 1); ground.fillEllipse(130, BASE + 10, 420, 150);
  ground.fillStyle(0xcfd6dc, 1); ground.fillRect(0, BASE, W, 56);
  ground.fillStyle(0xaab4bd, 1); ground.fillRect(0, BASE + 56, W, 10);
  ground.fillStyle(0x8e9aa5, 1); ground.fillRect(0, BASE + 66, W, H - BASE - 66);
  ground.fillStyle(0xffffff, 0.5);
  for (let x = 40; x < W; x += 220) ground.fillRoundedRect(x, BASE + 120, 110, 14, 7);
  bake(scene, [far, near, shopSign, schoolSign, ground, tree(scene, 120, BASE + 6, 1.0)]);

  const dirty = [
    litter(scene, 1320, BASE + 150, 'paper', 1.6, 20), litter(scene, 820, BASE + 110, 'can', 1.4, 80), litter(scene, 1760, BASE + 180, 'bottle', 1.4, -70),
    trashPile(scene, 250, BASE + 60, 1.1), smog(scene, 1300, 240, 1.3), trashPile(scene, 1240, BASE + 50, 0.9),
    smog(scene, 420, 190, 1.5), trashPile(scene, 1720, BASE + 70, 1.2), smog(scene, 900, 300, 1.1, 0x7a7280),
    trashPile(scene, 760, BASE + 44, 0.8),
  ];
  const clean = [
    flower(scene, 60, BASE + 40, 0xff6fa5, 1.2), tree(scene, 1250, BASE + 4, 0.75), flower(scene, 220, BASE + 50, 0xffd23f, 1.2),
    bird(scene, 500, 260), flower(scene, 1300, BASE + 30, 0xff8a3d, 1.1), tree(scene, 770, BASE + 4, 0.7, 0x3fae6a, 0x8be04e),
    flower(scene, 1800, BASE + 36, 0xb388ff, 1.2), bird(scene, 1200, 330), flower(scene, 700, BASE + 30, 0xff6fa5, 1.1),
    gfx(scene, 960, BASE + 56, (g) => { // banca del parque
      g.fillStyle(0x8d6e63, 1); g.fillRoundedRect(-80, -52, 160, 16, 6); g.fillRoundedRect(-80, -84, 160, 14, 6);
      g.fillStyle(0x5d4037, 1); g.fillRect(-66, -40, 12, 40); g.fillRect(54, -40, 12, 40);
    }),
  ];
  return { dirty, clean, haze: haze(scene, 0x6f6a78), hazeMax: 0.4 };
}
