// Avatares del jugador (fauna colombiana) y apodos seguros.
// Los apodos se generan en el juego para que ningún niño escriba su nombre real.
export const AVATARS = [
  { id: 'rana', name: 'Rana' },
  { id: 'oso', name: 'Oso de anteojos' },
  { id: 'jaguar', name: 'Jaguar' },
  { id: 'zorro', name: 'Zorro' },
];

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
