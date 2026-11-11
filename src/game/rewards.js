// Sistema de recompensas: insignias y títulos de nivel.
// Las insignias premian el aprendizaje (recuperar mundos, llenar el álbum),
// el esfuerzo (seguir jugando aunque cueste) y la participación.
// No hay azar: cada insignia dice exactamente cómo se consigue.
import { WORLDS } from '../config/worlds.js';
import { MISSIONS_PER_WORLD, missionId } from '../config/missions.js';
import { WASTES } from './wastes.js';

// Resumen del progreso que usan las condiciones de las insignias.
export function badgeContext(progress) {
  const mp = progress.missionProgress || {};
  const worldsDone = WORLDS.filter((w) => Array.from({ length: MISSIONS_PER_WORLD }, (_, i) => mp[missionId(w.id, i)]).every(Boolean)).map((w) => w.id);
  return {
    worldsDone,
    missionsDone: Object.keys(mp).length,
    threeStar: Object.values(mp).filter((m) => m.stars === 3).length,
    rounds: progress.roundsPlayed || 0,
    learned: (progress.learnedWasteTypes || []).length,
  };
}

const world = (id) => (c) => c.worldsDone.includes(id);

export const BADGES = [
  // Una por mundo recuperado (las cinco del diseño original).
  { id: 'city', name: 'Héroe del Reciclaje', how: 'Recupera la Ciudad Contaminada', icon: 'world-city', color: 0xff8a3d, earned: world('city') },
  { id: 'forest', name: 'Guardián del Bosque', how: 'Recupera el Bosque Perdido', icon: 'world-forest', color: 0x2bb673, earned: world('forest') },
  { id: 'ocean', name: 'Protector del Océano', how: 'Recupera el Océano en Peligro', icon: 'world-ocean', color: 0x1e88e5, earned: world('ocean') },
  { id: 'mountain', name: 'Maestro de la Separación', how: 'Recupera la Montaña de Residuos', icon: 'world-mountain', color: 0x8d6e63, earned: world('mountain') },
  { id: 'future', name: 'Salvavidas del Planeta', how: 'Completa el Futuro Sostenible', icon: 'world-future', color: 0xffc107, earned: world('future') },
  // Participación, esfuerzo y aprendizaje.
  { id: 'first', name: 'Primer Paso', how: 'Termina tu primera misión', icon: 'ic-play', color: 0x26a69a, earned: (c) => c.missionsDone >= 1 },
  { id: 'effort', name: 'Nunca me Rindo', how: 'Juega 10 misiones, con las estrellas que sea', icon: 'ic-check', color: 0xef5350, earned: (c) => c.rounds >= 10 },
  { id: 'stars', name: 'Lluvia de Estrellas', how: 'Consigue 3 estrellas en 5 misiones', icon: 'ic-star', color: 0xf9a825, earned: (c) => c.threeStar >= 5 },
  { id: 'album15', name: 'Coleccionista', how: 'Aprende 15 residuos del álbum', icon: 'ic-book', color: 0x7b5ea7, earned: (c) => c.learned >= 15 },
  { id: 'albumAll', name: 'Sabio del Álbum', how: `Aprende los ${WASTES.length} residuos del álbum`, icon: 'ic-book', color: 0x5c6bc0, earned: (c) => c.learned >= WASTES.length },
];

export function getBadge(id) {
  return BADGES.find((b) => b.id === id) || null;
}

// Ids de todas las insignias que el progreso ya merece.
export function earnedBadges(progress) {
  const c = badgeContext(progress);
  return BADGES.filter((b) => b.earned(c)).map((b) => b.id);
}

const TITLES = ['Aprendiz', 'Ayudante verde', 'Guardián', 'Guardián experto', 'Protector', 'Héroe ecológico', 'Maestro guardián', 'Leyenda del planeta'];

export function levelTitle(level) {
  return TITLES[Math.min(TITLES.length, Math.max(1, Math.floor(level) || 1)) - 1];
}
