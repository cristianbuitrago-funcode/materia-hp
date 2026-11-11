// Avatares del jugador (fauna colombiana) y apodos seguros.
// Los apodos se generan en el juego para que ningún niño escriba su nombre real.
// Los marcados con `free` se pueden elegir al crear el perfil; los demás se
// desbloquean en la tienda con monedas ecológicas.
export const AVATARS = [
  { id: 'rana', name: 'Rana', free: true },
  { id: 'oso', name: 'Oso de anteojos', free: true },
  { id: 'jaguar', name: 'Jaguar', free: true },
  { id: 'zorro', name: 'Zorro', free: true },
  { id: 'mono', name: 'Mono tití' },
  { id: 'tortuga', name: 'Tortuga' },
  { id: 'buho', name: 'Búho' },
];
export const FREE_AVATARS = AVATARS.filter((a) => a.free);
export const ACCESSORIES = ['gorra', 'mono-lazo', 'gafas', 'corona', 'capa'];

const ANIMALS = ['Jaguar', 'Rana', 'Colibrí', 'Tortuga', 'Oso', 'Delfín', 'Cóndor', 'Mariposa', 'Tucán', 'Ballena', 'Zorro', 'Mono'];
const TRAITS = ['Valiente', 'Veloz', 'Brillante', 'Alegre', 'Audaz', 'Genial', 'Feliz', 'Fuerte', 'Amable', 'Increíble'];

export function randomNickname(rng = Math.random) {
  const a = ANIMALS[Math.floor(rng() * ANIMALS.length)];
  const t = TRAITS[Math.floor(rng() * TRAITS.length)];
  return `${a} ${t}`;
}

export function isValidAvatar(id) {
  return AVATARS.some((a) => a.id === id);
}
