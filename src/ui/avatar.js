// Retrato del jugador: fondo, personaje y accesorio puestos.
import { getItem, DEFAULT_FRAME } from '../game/shop.js';

export function accessoryTexture(accessory, avatar) {
  return accessory === 'gafas' && avatar === 'rana' ? 'acc-gafas-rana' : `acc-${accessory}`;
}

// look = { avatar, accessory, frame } (el perfil del jugador sirve tal cual).
export function makeAvatar(scene, x, y, size, look, { withFrame = true } = {}) {
  const c = scene.add.container(x, y);
  if (withFrame) {
    const frame = getItem(look.frame) || getItem(DEFAULT_FRAME);
    c.add(scene.add.circle(0, 0, size / 2, frame.fill).setStrokeStyle(Math.max(4, size * 0.05), frame.ring));
  }
  const inner = withFrame ? size * 0.84 : size;
  c.add(scene.add.image(0, size * 0.01, `avatar-${look.avatar}`).setDisplaySize(inner, inner));
  if (look.accessory) c.add(scene.add.image(0, size * 0.01, accessoryTexture(look.accessory, look.avatar)).setDisplaySize(inner, inner));
  return c;
}
