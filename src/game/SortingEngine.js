// Clasificación de residuos: lógica pura del Sorting Game (sin Phaser).
// Arma las rondas, verifica respuestas y calcula premios.
// Los errores no restan nada: solo valen menos que acertar a la primera.
import { WASTES } from './wastes.js';
import { getBin } from './bins.js';

export const REWARDS = {
  firstTry: { xp: 10, coins: 2 },
  retry: { xp: 5, coins: 1 },
  finish: { xp: 10, coins: 5 },
};

// Tamaño de ronda, dificultad máxima y cuándo se muestra la pista, por modo de edad.
export const ROUND_RULES = {
  explorer: { size: 6, maxTier: 1, hintAfter: 1 },
  adventurer: { size: 8, maxTier: 2, hintAfter: 2 },
  expert: { size: 10, maxTier: 3, hintAfter: 3 },
};

function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Elige los residuos de una ronda: sin repetir, con las tres canecas presentes
// y, si es posible, sin dos residuos seguidos de la misma caneca al empezar.
// `preferred` son los ids típicos del mundo: se usan primero y, si no alcanzan
// para la dificultad del jugador, la ronda se completa con el resto del catálogo.
export function buildRound(ageMode, rng = Math.random, preferred = []) {
  const rules = ROUND_RULES[ageMode];
  if (!rules) throw new Error(`Modo de edad no válido: ${ageMode}`);
  const pool = shuffle(WASTES.filter((w) => w.tier <= rules.maxTier), rng);
  const byBin = { white: [], black: [], green: [] };
  // Se toma del final de cada lista, así que los preferidos van al final.
  for (const w of pool.filter((x) => !preferred.includes(x.id))) byBin[w.bin].push(w);
  for (const w of pool.filter((x) => preferred.includes(x.id))) byBin[w.bin].push(w);
  // Reparto por turnos entre canecas para que la ronda quede equilibrada.
  const picked = [];
  const order = shuffle(Object.keys(byBin), rng);
  while (picked.length < rules.size) {
    let added = false;
    for (const bin of order) {
      if (picked.length < rules.size && byBin[bin].length) { picked.push(byBin[bin].pop()); added = true; }
    }
    if (!added) break;
  }
  return shuffle(picked, rng);
}

export class SortingRound {
  constructor(wastes, { hintAfter = 1 } = {}) {
    if (!wastes.length) throw new Error('La ronda necesita al menos un residuo');
    this.wastes = wastes;
    this.hintAfter = hintAfter;
    this.index = 0;
    this.mistakesOnCurrent = 0;
    this.results = []; // { id, mistakes }
    this.xp = 0;
    this.coins = 0;
  }

  get total() { return this.wastes.length; }
  get finished() { return this.index >= this.wastes.length; }
  get current() { return this.finished ? null : this.wastes[this.index]; }
  // La pista (resaltar la caneca correcta) aparece tras cierto número de errores.
  get showHint() { return !this.finished && this.mistakesOnCurrent >= this.hintAfter; }

  attempt(binId) {
    if (this.finished) throw new Error('La ronda ya terminó');
    if (!getBin(binId)) throw new Error(`Caneca desconocida: ${binId}`);
    const waste = this.current;
    if (binId !== waste.bin) {
      this.mistakesOnCurrent++;
      return { correct: false, waste, chosen: binId, mistakes: this.mistakesOnCurrent, showHint: this.showHint, xp: 0, coins: 0 };
    }
    const firstTry = this.mistakesOnCurrent === 0;
    const prize = firstTry ? REWARDS.firstTry : REWARDS.retry;
    this.xp += prize.xp;
    this.coins += prize.coins;
    this.results.push({ id: waste.id, mistakes: this.mistakesOnCurrent });
    this.index++;
    this.mistakesOnCurrent = 0;
    if (this.finished) { this.xp += REWARDS.finish.xp; this.coins += REWARDS.finish.coins; }
    return { correct: true, waste, chosen: binId, firstTry, xp: prize.xp, coins: prize.coins, finished: this.finished };
  }

  // Resumen de una ronda terminada. Terminar siempre da al menos una estrella (se premia el esfuerzo).
  summary() {
    if (!this.finished) throw new Error('La ronda aún no ha terminado');
    const firstTry = this.results.filter((r) => r.mistakes === 0).length;
    const mistakes = this.results.reduce((n, r) => n + r.mistakes, 0);
    const ratio = firstTry / this.total;
    return {
      total: this.total,
      firstTry,
      mistakes,
      stars: ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1,
      xp: this.xp,
      coins: this.coins,
      learned: this.results.map((r) => r.id),
    };
  }
}
