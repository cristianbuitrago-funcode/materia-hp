// Sistema de misiones: qué se juega en cada una de las cuatro misiones de cada mundo.
// El título de cada misión está en worlds.js (mismo orden).
//
// kind:   'sort'  clasificar residuos arrastrándolos a su caneca
//         'check' decidir si un residuo está en la caneca correcta
//         'quiz'  preguntas ambientales (solo para quienes ya leen: 8 años en adelante)
//         Puede variar según la edad: { explorer, adventurer, expert }.
// focus:  residuos protagonistas de la misión (ocupan la mayor parte de la ronda).
// bins:   canecas que participan (por defecto, las tres).
// topics: temas de las preguntas.
// timed:  reto opcional contrarreloj con bono; nunca para exploradores y nunca castiga.
// extra:  residuos adicionales (misión final).
import { WORLDS, getWorld } from './worlds.js';

const NO_QUIZ = (other) => ({ explorer: other, adventurer: 'quiz', expert: 'quiz' });

export const MISSION_PLAN = {
  city: [
    { kind: 'sort', focus: ['botella', 'vidrio', 'lata', 'tapa', 'frasco', 'bolsa'], tip: 'Busca botellas, latas y frascos. Limpios, van a la caneca blanca.' },
    { kind: 'sort', focus: ['papel', 'periodico', 'carton', 'tetrapak', 'servilleta', 'higienico', 'pizza'], tip: 'El papel y el cartón limpios se reciclan. Los sucios, no.' },
    { kind: 'sort', focus: ['banano', 'manzana', 'comida', 'naranja', 'huevo', 'hojas', 'cafe'], tip: 'Los restos de comida y de plantas van a la caneca verde.' },
    { kind: 'sort', timed: true, tip: '¡El parque está lleno de todo! Clasifica cada residuo en su caneca.' },
  ],
  forest: [
    { kind: 'sort', tip: 'Recoge lo que la gente dejó en el sendero.' },
    { kind: 'check', tip: 'Alguien ya botó estos residuos. ¿Quedaron en la caneca correcta?' },
    { kind: 'sort', focus: ['hojas', 'manzana', 'banano', 'naranja', 'huevo', 'comida', 'cafe'], tip: 'Lo orgánico vuelve a la tierra y alimenta las plantas.' },
    { kind: NO_QUIZ('check'), topics: ['animals'], tip: 'Descubre cómo la basura afecta a los animales del bosque.' },
  ],
  ocean: [
    { kind: 'sort', focus: ['botella', 'bolsa', 'tapa', 'vaso', 'icopor', 'papas'], tip: 'Saca los plásticos del agua. No todos se pueden reciclar.' },
    { kind: 'sort', timed: true, tip: 'Limpia esta zona del mar antes de que llegue la corriente.' },
    { kind: 'check', tip: 'Revisa qué material contamina y si quedó en su caneca.' },
    { kind: NO_QUIZ('sort'), topics: ['ocean'], tip: 'Aprende a proteger a los animales marinos.' },
  ],
  mountain: [
    { kind: 'sort', bins: ['white', 'black'], tip: 'Solo dos canecas: ¿se puede aprovechar o no?' },
    { kind: NO_QUIZ('sort'), topics: ['reuse'], focus: ['frasco', 'botella', 'carton', 'papel', 'bolsa', 'tapa'], tip: 'Antes de botar algo, piensa si se puede volver a usar.' },
    { kind: 'check', tip: 'En esta montaña hay muchos errores. ¡Encuéntralos!' },
    { kind: NO_QUIZ('check'), topics: ['challenges'], tip: 'Resuelve situaciones reales como un experto.' },
  ],
  future: [
    { kind: NO_QUIZ('sort'), topics: ['sustainable'], tip: 'Decide cómo construir una comunidad que cuida el planeta.' },
    { kind: 'check', tip: 'Hasta en el futuro hay despistes. Revisa las canecas.' },
    { kind: 'sort', tip: 'Recupera los últimos terrenos del planeta.' },
    { kind: 'sort', timed: true, extra: 4, tip: '¡La misión final! Demuestra todo lo que aprendiste.' },
  ],
};

export const MISSIONS_PER_WORLD = 4;

export function missionId(worldId, index) {
  return `${worldId}-${index + 1}`;
}

// Misión `index` (0 a 3) del mundo, con su título y el tipo de juego según la edad.
export function getMission(worldId, index, ageMode = 'adventurer') {
  const world = getWorld(worldId);
  const plan = world && MISSION_PLAN[worldId][index];
  if (!plan) return null;
  const kind = typeof plan.kind === 'string' ? plan.kind : plan.kind[ageMode];
  return { ...plan, kind, id: missionId(worldId, index), worldId, index, title: world.missions[index] };
}

export function parseMissionId(id) {
  const m = /^([a-z]+)-([1-4])$/.exec(String(id));
  if (!m || !getWorld(m[1])) return null;
  return { worldId: m[1], index: Number(m[2]) - 1 };
}

export const ALL_MISSION_IDS = WORLDS.flatMap((w) => [0, 1, 2, 3].map((i) => missionId(w.id, i)));
