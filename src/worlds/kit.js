// Piezas reutilizables para dibujar los escenarios de los mundos.
// Cada pieza se crea en (x, y) con su origen en la base, para poder
// hacerla aparecer o desaparecer con una animación de escala.
import { W, H } from '../config/theme.js';

export function gfx(scene, x, y, draw) {
  const g = scene.add.graphics({ x, y });
  draw(g);
  return g;
}

// Convierte dibujos que no se mueven en una sola imagen. Phaser recalcula cada
// dibujo vectorial en todos los fotogramas; una imagen ya hecha casi no cuesta.
// Hay que llamarla justo después de crear esos dibujos para conservar el orden de capas.
export function bake(scene, objects) {
  const rt = scene.add.renderTexture(0, 0, W, H).setOrigin(0);
  rt.draw(objects);
  for (const o of objects) o.destroy();
  return rt;
}

// Igual que `bake`, pero para una sola pieza que debe seguir siendo un objeto
// propio (para aparecer o desaparecer). `w` es su ancho y `up`/`down` cuánto
// ocupa por encima y por debajo de su origen.
export function bakeItem(scene, g, w, up, down = 20) {
  const rt = scene.add.renderTexture(g.x, g.y, w, up + down).setOrigin(0.5, up / (up + down));
  rt.draw(g, w / 2, up);
  g.destroy();
  return rt;
}

// Número "aleatorio" repetible (el mismo escenario en cada partida).
export function rnd(i) {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}

const BITS = [0x90caf9, 0xffe082, 0xef9a9a, 0xce93d8, 0xa5d6a7, 0xffffff, 0xffab91];

// Montón de bolsas de basura con residuos regados.
export function trashPile(scene, x, y, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0x000000, 0.16); g.fillEllipse(0, 2 * s, 220 * s, 34 * s);
    g.fillStyle(0x3b4047, 1); g.fillCircle(-46 * s, -38 * s, 46 * s);
    g.fillStyle(0x565c66, 1); g.fillCircle(34 * s, -46 * s, 56 * s);
    g.fillTriangle(24 * s, -112 * s, 46 * s, -112 * s, 35 * s, -94 * s);
    g.fillStyle(0x454a52, 1); g.fillCircle(-4 * s, -24 * s, 38 * s);
    g.fillStyle(0xffffff, 0.14); g.fillEllipse(16 * s, -70 * s, 30 * s, 16 * s);
    g.fillStyle(BITS[0], 1); g.fillRoundedRect(-104 * s, -24 * s, 38 * s, 22 * s, 6 * s);
    g.fillStyle(BITS[1], 1); g.fillCircle(84 * s, -12 * s, 15 * s);
    g.fillStyle(BITS[2], 1); g.fillRoundedRect(52 * s, -26 * s, 26 * s, 26 * s, 5 * s);
    g.fillStyle(BITS[5], 1); g.fillTriangle(-70 * s, -4 * s, -40 * s, -18 * s, -36 * s, 0);
  });
}

// Residuo suelto: 'bottle', 'can', 'bag' o 'paper'.
export function litter(scene, x, y, kind, s = 1, angle = 0) {
  const g = gfx(scene, x, y, (g) => {
    if (kind === 'bottle') {
      g.fillStyle(0x90caf9, 1); g.fillRoundedRect(-12 * s, -52 * s, 24 * s, 52 * s, 8 * s);
      g.fillStyle(0x1e88e5, 1); g.fillRoundedRect(-7 * s, -64 * s, 14 * s, 14 * s, 3 * s);
      g.fillStyle(0xffffff, 0.6); g.fillRect(-12 * s, -34 * s, 24 * s, 12 * s);
    } else if (kind === 'can') {
      g.fillStyle(0xef5350, 1); g.fillRoundedRect(-14 * s, -40 * s, 28 * s, 40 * s, 6 * s);
      g.fillStyle(0xcfd8dc, 1); g.fillEllipse(0, -40 * s, 28 * s, 10 * s);
    } else if (kind === 'bag') {
      g.fillStyle(0xf5f7fa, 0.92); g.fillEllipse(0, -30 * s, 56 * s, 66 * s);
      g.fillTriangle(-22 * s, -56 * s, -10 * s, -84 * s, -2 * s, -56 * s);
      g.fillTriangle(2 * s, -56 * s, 12 * s, -84 * s, 22 * s, -56 * s);
      g.fillStyle(0xb0bec5, 0.8); g.fillEllipse(-8 * s, -28 * s, 10 * s, 34 * s);
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillPoints([{ x: -22 * s, y: -6 * s }, { x: -14 * s, y: -32 * s }, { x: 6 * s, y: -38 * s }, { x: 24 * s, y: -22 * s }, { x: 18 * s, y: -2 * s }, { x: -4 * s, y: 2 * s }], true);
      g.fillStyle(0xb0bec5, 1); g.fillTriangle(-4 * s, -20 * s, 8 * s, -30 * s, 10 * s, -12 * s);
    }
  });
  g.setAngle(angle);
  return g;
}

export function flower(scene, x, y, color = 0xff6fa5, s = 1) {
  return gfx(scene, x, y, (g) => {
    g.lineStyle(7 * s, 0x2e8b57, 1); g.lineBetween(0, 0, 0, -56 * s);
    g.fillStyle(0x3fae6a, 1); g.fillEllipse(-14 * s, -22 * s, 26 * s, 12 * s); g.fillEllipse(14 * s, -32 * s, 26 * s, 12 * s);
    g.fillStyle(color, 1);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      g.fillCircle(Math.cos(a) * 17 * s, -62 * s + Math.sin(a) * 17 * s, 14 * s);
    }
    g.fillStyle(0xffd23f, 1); g.fillCircle(0, -62 * s, 11 * s);
  });
}

export function tree(scene, x, y, s = 1, leaf = 0x2e8b57, light = 0x5fd068, trunk = 0x7a5236) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(0x000000, 0.14); g.fillEllipse(0, 0, 150 * s, 26 * s);
    g.fillStyle(trunk, 1); g.fillRoundedRect(-16 * s, -110 * s, 32 * s, 112 * s, 10 * s);
    g.fillStyle(leaf, 1); g.fillCircle(0, -180 * s, 96 * s); g.fillCircle(-66 * s, -140 * s, 60 * s); g.fillCircle(66 * s, -140 * s, 60 * s);
    g.fillStyle(light, 1); g.fillCircle(-30 * s, -206 * s, 44 * s); g.fillCircle(44 * s, -170 * s, 26 * s);
  });
}

export function pine(scene, x, y, s = 1, color = 0x2e7d5b, trunk = 0x6d4c35) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(trunk, 1); g.fillRect(-10 * s, -40 * s, 20 * s, 42 * s);
    g.fillStyle(color, 1);
    g.fillTriangle(-80 * s, -30 * s, 80 * s, -30 * s, 0, -150 * s);
    g.fillTriangle(-64 * s, -100 * s, 64 * s, -100 * s, 0, -210 * s);
    g.fillTriangle(-46 * s, -166 * s, 46 * s, -166 * s, 0, -260 * s);
  });
}

export function bush(scene, x, y, s = 1, color = 0x3fae6a, berries = null) {
  return gfx(scene, x, y, (g) => {
    g.fillStyle(color, 1); g.fillCircle(-44 * s, -30 * s, 40 * s); g.fillCircle(0, -48 * s, 52 * s); g.fillCircle(46 * s, -30 * s, 40 * s);
    g.fillRect(-70 * s, -30 * s, 140 * s, 32 * s);
    if (berries !== null) {
      g.fillStyle(berries, 1);
      [[-40, -40], [-8, -66], [20, -36], [50, -44], [-18, -22]].forEach(([bx, by]) => g.fillCircle(bx * s, by * s, 8 * s));
    }
  });
}

// Nube de humo (usa la textura de nube teñida de gris).
export function smog(scene, x, y, scale = 1, tint = 0x6b6470, alpha = 0.85) {
  const c = scene.add.image(x, y, 'cloud').setScale(scale).setTint(tint).setAlpha(alpha);
  scene.tweens.add({ targets: c, x: x + 50, duration: 5000 + rnd(x) * 3000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return c;
}

// Pájaro que aletea y planea de un lado a otro.
export function bird(scene, x, y, color = 0x17324d, s = 1) {
  const c = scene.add.container(x, y);
  const wings = gfx(scene, 0, 0, (g) => {
    g.lineStyle(8 * s, color, 1);
    g.beginPath(); g.moveTo(-34 * s, -8 * s); g.lineTo(-14 * s, -22 * s); g.lineTo(0, 0); g.lineTo(14 * s, -22 * s); g.lineTo(34 * s, -8 * s); g.strokePath();
  });
  c.add(wings);
  scene.tweens.add({ targets: wings, scaleY: -0.5, duration: 260, delay: rnd(x + y) * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  scene.tweens.add({ targets: c, x: x + 240, y: y - 30, duration: 4200 + rnd(y) * 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return c;
}

export function butterfly(scene, x, y, color = 0xff8a3d, s = 1) {
  const c = scene.add.container(x, y);
  const wings = gfx(scene, 0, 0, (g) => {
    g.fillStyle(color, 1); g.fillEllipse(-16 * s, -8 * s, 28 * s, 34 * s); g.fillEllipse(16 * s, -8 * s, 28 * s, 34 * s);
    g.fillStyle(0xffffff, 0.7); g.fillCircle(-16 * s, -10 * s, 6 * s); g.fillCircle(16 * s, -10 * s, 6 * s);
  });
  const body = gfx(scene, 0, 0, (g) => { g.fillStyle(0x17324d, 1); g.fillRoundedRect(-4 * s, -24 * s, 8 * s, 34 * s, 4 * s); });
  c.add([wings, body]);
  scene.tweens.add({ targets: wings, scaleX: 0.25, duration: 170, delay: rnd(x + y) * 300, yoyo: true, repeat: -1 });
  scene.tweens.add({ targets: c, x: x + 120, y: y - 70, duration: 2600 + rnd(x) * 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return c;
}

// Pez que nada de lado a lado. dir = 1 mira a la derecha.
export function fish(scene, x, y, color = 0xffb300, s = 1, dir = 1, travel = 420) {
  const c = scene.add.container(x, y);
  c.add(gfx(scene, 0, 0, (g) => {
    g.fillStyle(color, 1); g.fillEllipse(0, 0, 90 * s, 54 * s);
    g.fillTriangle(-36 * s, 0, -72 * s, -28 * s, -72 * s, 28 * s);
    g.fillStyle(0xffffff, 0.35); g.fillEllipse(-4 * s, -8 * s, 44 * s, 16 * s);
    g.fillStyle(0xffffff, 1); g.fillCircle(24 * s, -8 * s, 10 * s);
    g.fillStyle(0x17324d, 1); g.fillCircle(27 * s, -8 * s, 5 * s);
  }));
  c.setScale(dir, 1);
  const swim = () => {
    scene.tweens.add({
      targets: c, x: c.x + travel * Math.sign(c.scaleX), duration: 5200 + rnd(y) * 2500, ease: 'Sine.inOut',
      onComplete: () => { if (c.active) { c.scaleX = -c.scaleX; swim(); } },
    });
  };
  swim();
  scene.tweens.add({ targets: c, y: y + 18, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return c;
}

// Capa de neblina/contaminación que cubre toda la pantalla.
export function haze(scene, color) {
  return scene.add.rectangle(W / 2, H / 2, W, H, color, 1).setAlpha(0);
}
