// Habilidades: se desbloquean al derrotar al jefe de cada mundo y sirven en
// todos los niveles siguientes. Las de tipo 'active' se usan con un botón
// (pocas veces por nivel); las 'passive' actúan solas.
// No se guardan aparte: se deducen de los jefes ya derrotados.
import { WORLDS } from '../config/worlds.js';
import { BOSS_INDEX, missionId } from '../config/missions.js';
import { BOSSES } from './bosses.js';

export const ABILITIES = [
  { id: 'lupa', kind: 'active', icon: 'ic-lupa', color: 0x26a69a, name: 'Lupa de Reciclín',
    desc: 'Una vez por nivel, hace brillar la caneca correcta.' },
  { id: 'escudo', kind: 'passive', icon: 'ic-escudo', color: 0x2bb673, name: 'Escudo de hojas',
    desc: 'Perdona tu primer error de cada nivel.' },
  { id: 'ola', kind: 'active', icon: 'ic-ola', color: 0x1e88e5, name: 'Ola limpiadora',
    desc: 'Una vez por nivel, lleva el residuo a su caneca y te explica por qué.' },
  { id: 'iman', kind: 'passive', icon: 'ic-iman', color: 0xef5350, name: 'Imán de monedas',
    desc: 'Ganas 1 moneda extra por cada acierto a la primera.' },
  { id: 'estrella', kind: 'passive', icon: 'ic-star', color: 0xf9a825, name: 'Estrella del guardián',
    desc: 'Tus habilidades de botón se pueden usar 2 veces por nivel.' },
];

export function getAbility(id) {
  return ABILITIES.find((a) => a.id === id) || null;
}

// Mundo cuyo jefe entrega la habilidad.
export function abilitySource(id) {
  return WORLDS.find((w) => BOSSES[w.id].ability === id) || null;
}

// Habilidades ya ganadas según los niveles terminados.
export function unlockedAbilities(missionProgress = {}) {
  return WORLDS.filter((w) => missionProgress[missionId(w.id, BOSS_INDEX)]).map((w) => BOSSES[w.id].ability);
}

// Lo que las habilidades aportan a un nivel.
export function abilityEffects(unlocked) {
  const has = (id) => unlocked.includes(id);
  const uses = has('estrella') ? 2 : 1;
  return {
    uses: { lupa: has('lupa') ? uses : 0, ola: has('ola') ? uses : 0 }, // usos de cada botón
    shield: has('escudo') ? 1 : 0,   // errores perdonados
    coinBonus: has('iman') ? 1 : 0,  // monedas extra por acierto a la primera
  };
}
