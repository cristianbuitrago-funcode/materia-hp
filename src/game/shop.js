// Tienda de elementos desbloqueables. Todo se consigue con monedas ecológicas
// ganadas jugando; algunos elementos piden además un nivel o una insignia.
// No hay compras con dinero real, ni premios al azar.
import { getBadge } from './rewards.js';

export const DEFAULT_FRAME = 'f-crema';

export const SHOP_ITEMS = [
  // Personajes (avatares). Los gratuitos se eligen al crear el perfil.
  { id: 'rana', type: 'character', name: 'Rana', price: 0 },
  { id: 'oso', type: 'character', name: 'Oso de anteojos', price: 0 },
  { id: 'jaguar', type: 'character', name: 'Jaguar', price: 0 },
  { id: 'zorro', type: 'character', name: 'Zorro', price: 0 },
  { id: 'mono', type: 'character', name: 'Mono tití', price: 40 },
  { id: 'tortuga', type: 'character', name: 'Tortuga', price: 30, requires: { badge: 'ocean' } },
  { id: 'buho', type: 'character', name: 'Búho', price: 80, requires: { level: 5 } },

  // Accesorios (uno a la vez).
  { id: 'gorra', type: 'accessory', name: 'Gorra', price: 20 },
  { id: 'mono-lazo', type: 'accessory', name: 'Corbatín', price: 25 },
  { id: 'gafas', type: 'accessory', name: 'Gafas de sol', price: 30 },
  { id: 'corona', type: 'accessory', name: 'Corona de hojas', price: 50, requires: { level: 3 } },
  { id: 'capa', type: 'accessory', name: 'Capa de guardián', price: 70, requires: { badge: 'city' } },

  // Fondos del retrato.
  { id: 'f-crema', type: 'frame', name: 'Clásico', price: 0, fill: 0xfff3d6, ring: 0xffd23f },
  { id: 'f-cielo', type: 'frame', name: 'Cielo', price: 15, fill: 0xbdebff, ring: 0x1e88e5 },
  { id: 'f-bosque', type: 'frame', name: 'Bosque', price: 25, fill: 0xc8f0d2, ring: 0x14804a, requires: { badge: 'forest' } },
  { id: 'f-mar', type: 'frame', name: 'Mar', price: 25, fill: 0x9bd8f5, ring: 0x0b5fa5, requires: { badge: 'ocean' } },
  { id: 'f-sol', type: 'frame', name: 'Atardecer', price: 60, fill: 0xffd9a8, ring: 0xef5350, requires: { level: 6 } },
];

export const ITEM_TYPES = [
  { id: 'character', label: 'Personajes', list: 'unlockedCharacters' },
  { id: 'accessory', label: 'Accesorios', list: 'unlockedAccessories' },
  { id: 'frame', label: 'Fondos', list: 'unlockedFrames' },
];

export function getItem(id) {
  return SHOP_ITEMS.find((i) => i.id === id) || null;
}

export function itemsOfType(type) {
  return SHOP_ITEMS.filter((i) => i.type === type);
}

export const FREE_ITEMS = SHOP_ITEMS.filter((i) => i.price === 0 && !i.requires).map((i) => i.id);

export function listFor(type) {
  return ITEM_TYPES.find((t) => t.id === type).list;
}

// ¿Se puede comprar? Devuelve { ok: true } o el motivo con un mensaje para el niño.
// wallet = { coins, level, badges, owned }.
export function purchaseCheck(item, wallet) {
  if (!item) return { ok: false, reason: 'unknown', message: 'Ese elemento no existe.' };
  if (wallet.owned.includes(item.id)) return { ok: false, reason: 'owned', message: '¡Ya es tuyo!' };
  const req = item.requires || {};
  if (req.level && wallet.level < req.level) {
    return { ok: false, reason: 'level', message: `Se abre cuando llegues al nivel ${req.level}. ¡Sigue jugando!` };
  }
  if (req.badge && !wallet.badges.includes(req.badge)) {
    return { ok: false, reason: 'badge', message: `Necesitas la insignia «${getBadge(req.badge).name}».` };
  }
  if (wallet.coins < item.price) {
    const need = item.price - wallet.coins;
    return { ok: false, reason: 'coins', need, message: `Te faltan ${need} moneda${need === 1 ? '' : 's'}. ¡Juega misiones para ganar más!` };
  }
  return { ok: true };
}

// Texto corto del requisito, para la tarjeta de la tienda.
export function requirementText(item) {
  const req = item.requires || {};
  if (req.level) return `Nivel ${req.level}`;
  if (req.badge) return `Insignia: ${getBadge(req.badge).name}`;
  return '';
}
