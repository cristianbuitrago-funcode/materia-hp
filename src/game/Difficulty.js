// Dificultad adaptativa: además del modo de edad, el juego mira cómo le ha ido
// al jugador en sus últimas respuestas y ajusta el tamaño de la ronda, la
// dificultad de los residuos y cuándo aparece la pista.
export const RECENT_WINDOW = 20; // respuestas que se recuerdan
export const MIN_ANSWERS = 10;   // antes de esto no se ajusta nada
export const TROUBLE_MAX = 3;    // tope de "dificultad" acumulada por residuo
export const REVIEW_PER_ROUND = 2; // residuos de repaso por ronda, como máximo

// Reglas base por modo de edad.
export const ROUND_RULES = {
  explorer: { size: 6, maxTier: 1, hintAfter: 1 },
  adventurer: { size: 8, maxTier: 2, hintAfter: 2 },
  expert: { size: 10, maxTier: 3, hintAfter: 3 },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// -1: le está costando (se facilita) · 0: normal · 1: va muy bien (se sube el reto).
// `recent` es la lista de respuestas recientes: true si acertó a la primera.
export function skillLevel(recent) {
  if (!Array.isArray(recent) || recent.length < MIN_ANSWERS) return 0;
  const accuracy = recent.filter(Boolean).length / recent.length;
  if (accuracy >= 0.85) return 1;
  if (accuracy <= 0.5) return -1;
  return 0;
}

export function adaptRules(ageMode, recent = []) {
  const base = ROUND_RULES[ageMode];
  if (!base) throw new Error(`Modo de edad no válido: ${ageMode}`);
  const level = skillLevel(recent);
  return {
    level,
    size: clamp(base.size + 2 * level, 4, 12),
    maxTier: clamp(base.maxTier + level, 1, 3),
    hintAfter: clamp(base.hintAfter + level, 1, 4),
  };
}

// Añade las respuestas de una ronda a la memoria reciente (se conservan las últimas).
export function pushRecent(recent, answers) {
  return [...recent, ...answers.map((a) => !!a.firstTry)].slice(-RECENT_WINDOW);
}

// Lleva la cuenta de los residuos que más le cuestan al jugador: sube con cada
// fallo y baja cuando lo acierta a la primera, hasta desaparecer.
export function updateTrouble(trouble, answers) {
  const next = { ...trouble };
  for (const a of answers) {
    if (!a.id) continue;
    if (!a.firstTry) next[a.id] = Math.min(TROUBLE_MAX, (next[a.id] || 0) + 1);
    else if (next[a.id]) {
      next[a.id] -= 1;
      if (next[a.id] <= 0) delete next[a.id];
    }
  }
  return next;
}

// Residuos que conviene repasar en la próxima ronda (los que más cuestan primero).
export function reviewList(trouble, max = REVIEW_PER_ROUND) {
  return Object.entries(trouble || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, max).map(([id]) => id);
}
