// Sistema de misiones: qué se juega en cada uno de los cinco niveles de cada mundo.
// Los cuatro primeros son misiones y el quinto es el jefe final.
// El título de cada misión está en worlds.js (mismo orden).
//
// kind:   'sort'  clasificar residuos arrastrándolos a su caneca
//         'check' decidir si un residuo está en la caneca correcta
//         'quiz'  preguntas ambientales (solo para quienes ya leen: 8 años en adelante)
//         'boss'  combate contra el jefe del mundo (ver bosses.js)
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
    { kind: 'sort', timed: true, tip: 'Aquí llega la basura de todo el barrio. ¡Clasifícala antes de que se acabe el tiempo!' },
    { kind: 'boss', tip: '¡Ratasura vive de la basura que no se separa! Clasifica bien para vencerla.' },
  ],
  forest: [
    { kind: 'sort', tip: 'Recoge lo que la gente dejó en el sendero.' },
    { kind: 'check', tip: 'Los campistas ya botaron sus residuos. ¿Quedaron en la caneca correcta?' },
    { kind: 'sort', focus: ['hojas', 'manzana', 'banano', 'naranja', 'huevo', 'comida', 'cafe'], tip: 'Lo orgánico vuelve a la tierra y alimenta las plantas.' },
    { kind: NO_QUIZ('check'), topics: ['animals'], tip: 'Descubre cómo la basura afecta a los animales del bosque.' },
    { kind: 'boss', tip: 'Moscardón crece con la basura del bosque. ¡Déjalo sin comida!' },
  ],
  ocean: [
    { kind: 'sort', focus: ['botella', 'bolsa', 'tapa', 'vaso', 'icopor', 'papas'], tip: 'Saca los plásticos del agua. No todos se pueden reciclar.' },
    { kind: 'sort', timed: true, tip: 'Limpia el muelle antes de que llegue la corriente.' },
    { kind: 'check', tip: 'Revisa qué material contamina y si quedó en su caneca.' },
    { kind: NO_QUIZ('sort'), topics: ['ocean'], tip: 'Aprende a proteger a los animales marinos.' },
    { kind: 'boss', tip: 'Plastipulpo está hecho de plástico. Cada residuo bien puesto lo debilita.' },
  ],
  mountain: [
    { kind: 'sort', bins: ['white', 'black'], tip: 'Solo dos canecas: ¿se puede aprovechar o no?' },
    { kind: NO_QUIZ('sort'), topics: ['reuse'], focus: ['frasco', 'botella', 'carton', 'papel', 'bolsa', 'tapa'], tip: 'Antes de botar algo, piensa si se puede volver a usar.' },
    { kind: 'check', tip: 'Por la banda pasan residuos mal puestos. ¡Encuentra los errores!' },
    { kind: NO_QUIZ('check'), topics: ['challenges'], tip: 'Resuelve situaciones reales como un experto.' },
    { kind: 'boss', tip: 'Basurón es toda la basura mezclada. ¡Sepárala y se deshará!' },
  ],
  future: [
    { kind: NO_QUIZ('sort'), topics: ['sustainable'], tip: 'Decide cómo construir una comunidad que cuida el planeta.' },
    { kind: 'check', tip: 'Hasta en el futuro hay despistes. Revisa las canecas.' },
    { kind: 'sort', tip: 'Ayuda en la planta: separa lo que llega para poder reciclarlo.' },
    { kind: 'sort', timed: true, extra: 4, tip: '¡El gran reto de la plaza! Demuestra todo lo que aprendiste.' },
    { kind: 'boss', tip: '¡Es Contaminator! Usa todo lo que aprendiste para salvar el planeta.' },
  ],
};

export const MISSIONS_PER_WORLD = 5;
export const BOSS_INDEX = 4;

// La dificultad sube con cada nivel: rondas más largas y, desde el segundo,
// residuos más difíciles. Se suma a las reglas de la edad y a la dificultad adaptativa.
export const LEVEL_MODS = [
  { size: -2, tier: -1 },
  { size: -1, tier: 0 },
  { size: 0, tier: 0 },
  { size: 1, tier: 0 },
  { size: 0, tier: 0 }, // jefe: su vida es el tamaño de la ronda
];

export function missionId(worldId, index) {
  return `${worldId}-${index + 1}`;
}

// Nivel `index` (0 a 4) del mundo, con su título y el tipo de juego según la edad.
export function getMission(worldId, index, ageMode = 'adventurer') {
  const world = getWorld(worldId);
  const plan = world && MISSION_PLAN[worldId][index];
  if (!plan) return null;
  const kind = typeof plan.kind === 'string' ? plan.kind : plan.kind[ageMode];
  return { ...plan, kind, id: missionId(worldId, index), worldId, index, title: world.missions[index], place: world.places[index], isBoss: kind === 'boss' };
}

export function parseMissionId(id) {
  const m = /^([a-z]+)-([1-5])$/.exec(String(id));
  if (!m || !getWorld(m[1])) return null;
  return { worldId: m[1], index: Number(m[2]) - 1 };
}

export const ALL_MISSION_IDS = WORLDS.flatMap((w) => Array.from({ length: MISSIONS_PER_WORLD }, (_, i) => missionId(w.id, i)));
