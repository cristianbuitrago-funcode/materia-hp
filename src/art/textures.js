// Recursos gráficos: convierte los SVG en texturas de Phaser y genera
// texturas sencillas (nubes, hojas, destellos) por código.
import { CHARACTER_SVG, EXPRESSIONS, avatarSVG } from './characters.js';
import { ICON_NAMES, iconSVG, coinSVG, worldIconSVG } from './icons.js';
import { AVATARS } from '../config/avatars.js';
import { WORLDS } from '../config/worlds.js';

function addSvgTexture(scene, key, svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { scene.textures.addImage(key, img); resolve(); };
    img.onerror = () => reject(new Error(`No se pudo crear la textura ${key}`));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

export function buildTextureList() {
  const list = [];
  for (const [who, fn] of Object.entries(CHARACTER_SVG)) {
    for (const expr of EXPRESSIONS) list.push([`${who}-${expr}`, fn(expr, 1.5)]);
  }
  for (const a of AVATARS) list.push([`avatar-${a.id}`, avatarSVG(a.id, 1)]);
  for (const name of ICON_NAMES) {
    list.push([`ic-${name}`, iconSVG(name, '#FFFFFF', 1.6)]);
  }
  list.push(['ic-coin', coinSVG(1.2)]);
  for (const w of WORLDS) list.push([`world-${w.id}`, worldIconSVG(w.id, 1.3)]);
  return list;
}

export async function createAllTextures(scene, onProgress = () => {}) {
  const list = buildTextureList();
  let done = 0;
  await Promise.all(list.map(([key, svg]) => addSvgTexture(scene, key, svg).then(() => onProgress(++done / list.length))));

  const g = scene.make.graphics({ add: false });
  // Nube
  g.fillStyle(0xffffff, 1);
  g.fillCircle(90, 80, 60); g.fillCircle(170, 62, 62); g.fillCircle(250, 84, 52); g.fillRoundedRect(50, 80, 240, 56, 28);
  g.generateTexture('cloud', 340, 140);
  // Hoja
  g.clear(); g.fillStyle(0x7ed957, 1); g.fillEllipse(24, 14, 44, 22); g.lineStyle(3, 0x2e8b57, 1); g.lineBetween(4, 14, 44, 14);
  g.generateTexture('leaf', 48, 28);
  // Destello redondo
  g.clear(); g.fillStyle(0xffffff, 1); g.fillCircle(16, 16, 16);
  g.generateTexture('dot', 32, 32);
  g.destroy();
}
