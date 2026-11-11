// Lógica pura de los retos (sin Phaser): arma las rondas, verifica respuestas
// y calcula premios. Los errores no restan nada: solo valen menos que acertar
// a la primera.
import { WASTES } from './wastes.js';
import { BINS, getBin } from './bins.js';
import { QUESTIONS } from './questions.js';
import { ROUND_RULES } from './Difficulty.js';

export { ROUND_RULES };

export const REWARDS = {
  firstTry: { xp: 10, coins: 2 },
  retry: { xp: 5, coins: 1 },
  finish: { xp: 10, coins: 5 },
  timeBonus: { coins: 5 },
};

function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resolveRules(rules) {
  const r = typeof rules === 'string' ? ROUND_RULES[rules] : rules;
  if (!r) throw new Error(`Modo de edad no válido: ${rules}`);
  return r;
}

// Elige los residuos de una ronda de clasificación, sin repetir.
//   review:   residuos que el jugador debe repasar: entran siempre (si su dificultad lo permite).
//   priority: listas de ids, de mayor a menor preferencia (residuos del mundo…).
//   focus:    residuos protagonistas de la misión: ocupan hasta el 60 % de la ronda.
//   bins:     canecas que participan (por defecto las tres).
// El resto se reparte por turnos entre las canecas para que todas aparezcan.
// (Por compatibilidad, el tercer argumento también puede ser una sola lista de preferidos.)
export function buildRound(rules, rng = Math.random, options = {}) {
  const r = resolveRules(rules);
  const opt = Array.isArray(options) ? { priority: [options] } : options;
  const priority = opt.priority || [];
  const bins = opt.bins || BINS.map((b) => b.id);
  const focus = opt.focus || [];
  const rank = (w) => { const i = priority.findIndex((list) => list.includes(w.id)); return i === -1 ? priority.length : i; };

  const pool = shuffle(WASTES.filter((w) => w.tier <= r.maxTier && bins.includes(w.bin)), rng);
  const picked = [];
  const take = (w) => { picked.push(w); pool.splice(pool.indexOf(w), 1); };

  // 0) Repaso: lo que más le ha costado al jugador vuelve a salir.
  for (const w of pool.filter((x) => (opt.review || []).includes(x.id)).slice(0, r.size)) take(w);

  // 1) Protagonistas de la misión (dejando sitio para que aparezcan las demás canecas).
  const focusSlots = Math.min(Math.ceil(r.size * 0.6), r.size - (bins.length - 1)) - picked.length;
  for (const w of pool.filter((x) => focus.includes(x.id)).slice(0, Math.max(0, focusSlots))) take(w);

  // 2) El resto: siempre a la caneca que menos residuos lleva, eligiendo el de mayor preferencia.
  while (picked.length < r.size && pool.length) {
    const count = (bin) => picked.filter((w) => w.bin === bin).length;
    const open = bins.filter((bin) => pool.some((w) => w.bin === bin));
    const bin = open.reduce((best, b) => (count(b) < count(best) ? b : best), open[0]);
    const candidates = pool.filter((w) => w.bin === bin);
    take(candidates.reduce((best, w) => (rank(w) < rank(best) ? w : best), candidates[0]));
  }
  return shuffle(picked, rng);
}

// Arma un reto "¿está en la caneca correcta?": cada residuo aparece en una
// caneca, bien puesto la mitad de las veces. La respuesta 0 es "sí" y la 1 es "no".
export function buildCheckItems(rules, rng = Math.random, options = {}) {
  const r = resolveRules(rules);
  const wastes = buildRound({ ...r, size: Math.max(4, r.size - 2) }, rng, options);
  return shuffle(wastes.map((waste, i) => {
    // Mitad bien puestos y mitad mal, en orden al azar.
    const right = i % 2 === 0;
    const others = BINS.filter((b) => b.id !== waste.bin);
    const shownBin = right ? waste.bin : others[Math.floor(rng() * others.length)].id;
    return { type: 'check', waste, shownBin, answer: right ? 0 : 1, options: 2, learnedId: waste.id };
  }), rng);
}

// Arma un reto de preguntas: primero las de los temas de la misión y, si no
// alcanzan, de los demás. Las opciones se barajan.
export function buildQuizItems(rules, rng = Math.random, { topics = [] } = {}) {
  const r = resolveRules(rules);
  const size = Math.max(3, Math.round(r.size / 2));
  // Las preguntas más sencillas son de dificultad 2: en niveles fáciles se usan esas.
  const pool = shuffle(QUESTIONS.filter((q) => q.tier <= Math.max(2, r.maxTier)), rng);
  const ordered = [...pool.filter((q) => topics.includes(q.topic)), ...pool.filter((q) => !topics.includes(q.topic))];
  return ordered.slice(0, size).map((q) => {
    const order = shuffle([0, 1, 2], rng);
    return { type: 'quiz', question: q, labels: order.map((i) => q.options[i]), answer: order.indexOf(0), options: 3, learnedId: null };
  });
}

// Ronda genérica: una lista de retos que se responden de uno en uno.
// Las subclases solo definen cuál es la respuesta correcta de cada reto.
class Round {
  // shield: errores que se perdonan (habilidad Escudo de hojas).
  // coinBonus: monedas extra por cada acierto a la primera (habilidad Imán de monedas).
  constructor(items, { hintAfter = 1, shield = 0, coinBonus = 0 } = {}) {
    if (!items.length) throw new Error('La ronda necesita al menos un reto');
    this.items = items;
    this.hintAfter = hintAfter;
    this.shield = shield;
    this.coinBonus = coinBonus;
    this.index = 0;
    this.mistakesOnCurrent = 0;
    this.results = []; // { id, mistakes }
    this.xp = 0;
    this.coins = 0;
    this.timeBonus = false;
  }

  get total() { return this.items.length; }
  get finished() { return this.index >= this.items.length; }
  get current() { return this.finished ? null : this.items[this.index]; }
  // La pista aparece tras cierto número de errores en el mismo reto.
  get showHint() { return !this.finished && this.mistakesOnCurrent >= this.hintAfter; }

  answer(isCorrect, learnedId) {
    if (this.finished) throw new Error('La ronda ya terminó');
    if (!isCorrect) {
      if (this.shield > 0) { // error perdonado: no cuenta ni adelanta la pista
        this.shield--;
        return { correct: false, forgiven: true, mistakes: this.mistakesOnCurrent, showHint: this.showHint, xp: 0, coins: 0 };
      }
      this.mistakesOnCurrent++;
      return { correct: false, mistakes: this.mistakesOnCurrent, showHint: this.showHint, xp: 0, coins: 0 };
    }
    const firstTry = this.mistakesOnCurrent === 0;
    const base = firstTry ? REWARDS.firstTry : REWARDS.retry;
    const prize = { xp: base.xp, coins: base.coins + (firstTry ? this.coinBonus : 0) };
    this.xp += prize.xp;
    this.coins += prize.coins;
    this.results.push({ id: learnedId || null, mistakes: this.mistakesOnCurrent });
    this.index++;
    this.mistakesOnCurrent = 0;
    if (this.finished) { this.xp += REWARDS.finish.xp; this.coins += REWARDS.finish.coins; }
    return { correct: true, firstTry, xp: prize.xp, coins: prize.coins, finished: this.finished };
  }

  // Bono por terminar a tiempo un reto contrarreloj (solo suma, nunca resta).
  grantTimeBonus() {
    if (!this.finished) throw new Error('La ronda aún no ha terminado');
    if (!this.timeBonus) { this.timeBonus = true; this.coins += REWARDS.timeBonus.coins; }
  }

  // Respuestas de la ronda, para la dificultad adaptativa.
  answers() {
    return this.results.map((r) => ({ id: r.id, firstTry: r.mistakes === 0 }));
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
      timeBonus: this.timeBonus,
      learned: this.results.map((r) => r.id).filter(Boolean),
    };
  }
}

// Clasificación: cada reto es un residuo y la respuesta es una caneca.
export class SortingRound extends Round {
  get wastes() { return this.items; }

  attempt(binId) {
    if (this.finished) throw new Error('La ronda ya terminó');
    if (!getBin(binId)) throw new Error(`Caneca desconocida: ${binId}`);
    const waste = this.current;
    return { ...this.answer(binId === waste.bin, waste.id), waste, chosen: binId };
  }
}

// Opción múltiple ("¿está bien?" y preguntas): la respuesta es el número de la opción.
export class ChoiceRound extends Round {
  attempt(option) {
    if (this.finished) throw new Error('La ronda ya terminó');
    const item = this.current;
    if (!Number.isInteger(option) || option < 0 || option >= item.options) throw new Error(`Opción no válida: ${option}`);
    return { ...this.answer(option === item.answer, item.learnedId), item, chosen: option };
  }
}
