import { describe, it, expect } from 'vitest';
import { WORLDS } from '../src/config/worlds.js';
import { MISSION_PLAN, getMission, missionId, parseMissionId, ALL_MISSION_IDS } from '../src/config/missions.js';
import { AGE_MODES } from '../src/config/ageModes.js';
import { getWaste, WASTES } from '../src/game/wastes.js';
import { BINS } from '../src/game/bins.js';
import { QUESTIONS } from '../src/game/questions.js';
import { buildRound, buildCheckItems, buildQuizItems, ChoiceRound, SortingRound, REWARDS } from '../src/game/SortingEngine.js';
import { adaptRules, skillLevel, pushRecent, updateTrouble, reviewList, ROUND_RULES, RECENT_WINDOW } from '../src/game/Difficulty.js';
import { GameState, MemoryStorage } from '../src/core/GameState.js';

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
const MODES = AGE_MODES.map((m) => m.id);
const summary = (stars = 3) => ({ total: 6, firstTry: 6, mistakes: 0, stars, xp: 70, coins: 17, timeBonus: false, learned: [] });
const fresh = () => new GameState(new MemoryStorage()).load();

describe('plan de misiones', () => {
  it('cada mundo tiene cinco niveles con lugar, título, tipo válido y consejo; el quinto es el jefe', () => {
    expect(ALL_MISSION_IDS).toHaveLength(25);
    for (const w of WORLDS) {
      expect(MISSION_PLAN[w.id]).toHaveLength(5);
      for (let i = 0; i < 5; i++) for (const mode of MODES) {
        const m = getMission(w.id, i, mode);
        expect(m.id).toBe(`${w.id}-${i + 1}`);
        expect(m.title).toBe(w.missions[i]);
        expect(m.place).toBe(w.places[i]);
        expect(m.kind === 'boss').toBe(i === 4);
        expect(m.isBoss).toBe(i === 4);
        expect(['sort', 'check', 'quiz', 'boss']).toContain(m.kind);
        expect(m.tip.length).toBeGreaterThan(15);
        for (const id of m.focus || []) expect(getWaste(id), `${m.id}: ${id}`).toBeTruthy();
        for (const b of m.bins || []) expect(BINS.some((x) => x.id === b)).toBe(true);
      }
    }
    expect(getMission('city', 5)).toBeNull();
    expect(getMission('luna', 0)).toBeNull();
  });

  it('los exploradores (5 a 7 años) nunca reciben preguntas de lectura ni contrarreloj obligatorio', () => {
    for (const id of ALL_MISSION_IDS) {
      const { worldId, index } = parseMissionId(id);
      expect(getMission(worldId, index, 'explorer').kind, id).not.toBe('quiz');
    }
    // Los mayores sí tienen preguntas en varios mundos.
    const quizzes = ALL_MISSION_IDS.filter((id) => { const p = parseMissionId(id); return getMission(p.worldId, p.index, 'expert').kind === 'quiz'; });
    expect(quizzes.length).toBeGreaterThanOrEqual(4);
  });

  it('cada mundo ofrece al menos dos tipos de reto distintos', () => {
    for (const w of WORLDS) for (const mode of MODES) {
      const kinds = new Set([0, 1, 2, 3, 4].map((i) => getMission(w.id, i, mode).kind));
      expect(kinds.size, `${w.id}/${mode}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('convierte ids de misión en ambos sentidos y rechaza los inválidos', () => {
    expect(parseMissionId(missionId('ocean', 2))).toEqual({ worldId: 'ocean', index: 2 });
    for (const bad of ['ocean-6', 'luna-1', 'ocean', '', null, 'ocean-0']) expect(parseMissionId(bad)).toBeNull();
  });
});

describe('rondas con foco de misión', () => {
  it('los protagonistas ocupan la mayor parte de la ronda y siguen apareciendo las otras canecas', () => {
    const m = getMission('city', 0); // Recoger botellas
    for (const mode of MODES) for (let seed = 1; seed <= 20; seed++) {
      const rules = ROUND_RULES[mode];
      const round = buildRound(rules, seeded(seed), { focus: m.focus });
      const inFocus = round.filter((w) => m.focus.includes(w.id)).length;
      const available = WASTES.filter((w) => m.focus.includes(w.id) && w.tier <= rules.maxTier).length;
      expect(inFocus).toBeGreaterThanOrEqual(Math.min(available, Math.ceil(rules.size * 0.6), rules.size - 2));
      expect(new Set(round.map((w) => w.bin)).size).toBe(3);
      expect(new Set(round.map((w) => w.id)).size).toBe(rules.size);
    }
  });

  it('la misión de dos canecas no usa residuos orgánicos', () => {
    const m = getMission('mountain', 0);
    for (let seed = 1; seed <= 20; seed++) {
      const bins = new Set(buildRound('expert', seeded(seed), { bins: m.bins }).map((w) => w.bin));
      expect([...bins].sort()).toEqual(['black', 'white']);
    }
  });

  it('los residuos de repaso entran en la ronda siguiente', () => {
    for (let seed = 1; seed <= 20; seed++) {
      // Incluso en una misión cuyo foco es otra cosa (botellas) y aunque sean de la misma caneca.
      const round = buildRound('adventurer', seeded(seed), { review: ['papel', 'tetrapak'], focus: getMission('city', 0).focus, priority: [['banano']] });
      const ids = round.map((w) => w.id);
      expect(ids).toEqual(expect.arrayContaining(['papel', 'tetrapak', 'banano']));
      expect(round).toHaveLength(8);
      expect(new Set(round.map((w) => w.bin)).size).toBe(3);
      // Un residuo demasiado difícil para el jugador no se cuela como repaso.
      expect(buildRound('explorer', seeded(seed), { review: ['pizza'] }).map((w) => w.id)).not.toContain('pizza');
    }
  });
});

describe('reto "¿está en la caneca correcta?"', () => {
  it('mezcla residuos bien y mal puestos, y la respuesta siempre coincide con la realidad', () => {
    for (const mode of MODES) for (let seed = 1; seed <= 20; seed++) {
      const items = buildCheckItems(mode, seeded(seed));
      expect(items.length).toBeGreaterThanOrEqual(4);
      for (const it of items) expect(it.answer).toBe(it.shownBin === it.waste.bin ? 0 : 1);
      const right = items.filter((it) => it.answer === 0).length;
      expect(right).toBeGreaterThanOrEqual(2);
      expect(items.length - right).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('preguntas', () => {
  it('el banco es válido: tres opciones distintas, explicación y dificultad 2 o 3', () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(3);
      expect(new Set(q.options).size).toBe(3);
      expect([2, 3]).toContain(q.tier);
      expect(q.explain.length).toBeGreaterThan(20);
      for (const o of q.options) expect(o.length, `${q.id}: ${o}`).toBeLessThanOrEqual(52); // caben en el botón
      expect(q.q.length, q.id).toBeLessThanOrEqual(95);
    }
  });

  it('cada tema usado por una misión tiene preguntas suficientes para cada edad', () => {
    const topics = new Set(Object.values(MISSION_PLAN).flat().flatMap((m) => m.topics || []));
    for (const t of topics) {
      expect(QUESTIONS.filter((q) => q.topic === t && q.tier === 2).length, t).toBeGreaterThanOrEqual(3);
      expect(QUESTIONS.filter((q) => q.topic === t).length, t).toBeGreaterThanOrEqual(5);
    }
  });

  it('arma retos del tema pedido, con opciones barajadas y la respuesta bien marcada', () => {
    const positions = new Set();
    for (let seed = 1; seed <= 30; seed++) {
      const items = buildQuizItems('adventurer', seeded(seed), { topics: ['ocean'] });
      expect(items).toHaveLength(4);
      for (const it of items) {
        expect(it.question.topic).toBe('ocean');
        expect(it.question.tier).toBe(2); // sin preguntas de experto para 8 a 10 años
        expect(it.labels[it.answer]).toBe(it.question.options[0]);
        expect([...it.labels].sort()).toEqual([...it.question.options].sort());
        positions.add(it.answer);
      }
    }
    expect(positions.size).toBe(3); // la correcta no está siempre en el mismo sitio
    expect(buildQuizItems('expert', seeded(3), { topics: ['reuse'] })).toHaveLength(5);
  });

  it('ChoiceRound premia igual que la clasificación y no castiga los errores', () => {
    const items = buildQuizItems('expert', seeded(5), { topics: ['challenges'] });
    const r = new ChoiceRound(items);
    const wrong = (items[0].answer + 1) % 3;
    expect(r.attempt(wrong)).toMatchObject({ correct: false, xp: 0, coins: 0 });
    expect(r.index).toBe(0);
    expect(r.attempt(items[0].answer)).toMatchObject({ correct: true, firstTry: false, xp: REWARDS.retry.xp });
    for (const it of items.slice(1)) r.attempt(it.answer);
    expect(r.summary()).toMatchObject({ total: 5, firstTry: 4, mistakes: 1, stars: 2, learned: [] });
    expect(r.answers().map((a) => a.firstTry)).toEqual([false, true, true, true, true]);
    expect(() => new ChoiceRound(items).attempt(7)).toThrow();
  });

  it('el bono contrarreloj solo suma y solo una vez', () => {
    const r = new SortingRound([getWaste('lata')]);
    expect(() => r.grantTimeBonus()).toThrow();
    r.attempt('white');
    const before = r.summary().coins;
    r.grantTimeBonus(); r.grantTimeBonus();
    expect(r.summary()).toMatchObject({ coins: before + REWARDS.timeBonus.coins, timeBonus: true });
  });
});

describe('dificultad adaptativa', () => {
  const answers = (n, ok) => Array.from({ length: n }, (_, i) => i < ok);

  it('no cambia nada hasta tener suficientes respuestas', () => {
    expect(skillLevel([])).toBe(0);
    expect(skillLevel(answers(9, 9))).toBe(0);
    for (const mode of MODES) expect(adaptRules(mode, [])).toEqual({ level: 0, ...ROUND_RULES[mode] });
  });

  it('sube el reto cuando acierta casi todo y lo baja cuando le cuesta', () => {
    expect(skillLevel(answers(20, 18))).toBe(1);
    expect(skillLevel(answers(20, 14))).toBe(0);
    expect(skillLevel(answers(20, 9))).toBe(-1);
    expect(adaptRules('adventurer', answers(20, 19))).toEqual({ level: 1, size: 10, maxTier: 3, hintAfter: 3 });
    expect(adaptRules('adventurer', answers(20, 6))).toEqual({ level: -1, size: 6, maxTier: 1, hintAfter: 1 });
  });

  it('respeta los límites: el explorador no baja de lo más fácil ni el experto sube de lo más difícil', () => {
    expect(adaptRules('explorer', answers(20, 2))).toEqual({ level: -1, size: 4, maxTier: 1, hintAfter: 1 });
    expect(adaptRules('explorer', answers(20, 20))).toEqual({ level: 1, size: 8, maxTier: 2, hintAfter: 2 });
    expect(adaptRules('expert', answers(20, 20))).toEqual({ level: 1, size: 12, maxTier: 3, hintAfter: 4 });
    expect(() => adaptRules('adulto', [])).toThrow();
  });

  it('las rondas adaptadas siguen siendo válidas en todos los casos', () => {
    for (const mode of MODES) for (const ok of [2, 14, 20]) for (let seed = 1; seed <= 10; seed++) {
      const rules = adaptRules(mode, answers(20, ok));
      const round = buildRound(rules, seeded(seed));
      expect(round).toHaveLength(rules.size);
      expect(new Set(round.map((w) => w.bin)).size).toBe(3);
      expect(Math.max(...round.map((w) => w.tier))).toBeLessThanOrEqual(rules.maxTier);
    }
  });

  it('recuerda solo las últimas respuestas', () => {
    const r = pushRecent(answers(18, 18), [{ firstTry: false }, { firstTry: false }, { firstTry: true }]);
    expect(r).toHaveLength(RECENT_WINDOW);
    expect(r.slice(-3)).toEqual([false, false, true]);
  });

  it('lleva la cuenta de los residuos difíciles y los suelta cuando se dominan', () => {
    let t = updateTrouble({}, [{ id: 'pizza', firstTry: false }, { id: 'lata', firstTry: true }, { id: null, firstTry: false }]);
    expect(t).toEqual({ pizza: 1 });
    t = updateTrouble(t, [{ id: 'pizza', firstTry: false }, { id: 'huevo', firstTry: false }]);
    for (let i = 0; i < 5; i++) t = updateTrouble(t, [{ id: 'pizza', firstTry: false }]);
    expect(t).toEqual({ pizza: 3, huevo: 1 });
    expect(reviewList({ ...t, cafe: 2, vaso: 1 })).toEqual(['pizza', 'cafe']);
    t = updateTrouble(t, [{ id: 'huevo', firstTry: true }]);
    expect(t).toEqual({ pizza: 3 });
  });
});

describe('progreso de misiones', () => {
  it('los niveles se abren en orden y cada uno limpia una quinta parte del mundo', () => {
    const s = fresh();
    expect(s.isMissionUnlocked('city', 0)).toBe(true);
    expect(s.isMissionUnlocked('city', 1)).toBe(false);
    expect(s.isMissionUnlocked('forest', 0)).toBe(false); // mundo cerrado
    expect(s.applyRoundResult(summary(2), 'city-1')).toMatchObject({ firstTime: true, worldCompleted: false, unlockedWorld: null });
    expect(s.isMissionUnlocked('city', 1)).toBe(true);
    expect(s.isMissionUnlocked('city', 2)).toBe(false);
    expect(s.worldStatus('city')).toEqual({ done: 1, total: 5, clean: 0.2, completed: false });
  });

  it('repetir una misión conserva el mejor resultado y no limpia de más', () => {
    const s = fresh();
    s.applyRoundResult(summary(3), 'city-1');
    expect(s.applyRoundResult(summary(1), 'city-1')).toMatchObject({ firstTime: false });
    expect(s.missionState('city-1')).toEqual({ stars: 3, plays: 2 });
    expect(s.worldStatus('city').clean).toBe(0.2);
    expect(s.progress.completedMissions).toEqual(['city-1']);
  });

  it('derrotar al jefe (nivel 5) recupera el mundo y abre el siguiente, una sola vez', () => {
    const storage = new MemoryStorage();
    const s = new GameState(storage).load();
    for (const n of [1, 2, 3, 4]) expect(s.applyRoundResult(summary(), `city-${n}`).unlockedWorld).toBeNull();
    expect(s.isMissionUnlocked('city', 4)).toBe(true);
    expect(s.progress.unlockedWorlds).toEqual(['city']);
    expect(s.applyRoundResult(summary(), 'city-5')).toMatchObject({ worldCompleted: true, unlockedWorld: 'forest', newAbility: 'lupa' });
    expect(s.applyRoundResult(summary(), 'city-5')).toMatchObject({ worldCompleted: false, unlockedWorld: null, newAbility: null });
    const again = new GameState(storage).load();
    expect(again.worldStatus('city')).toMatchObject({ done: 5, clean: 1, completed: true });
    expect(again.abilities()).toEqual(['lupa']);
    expect(again.progress.unlockedWorlds).toEqual(['city', 'forest']);
    expect(again.isMissionUnlocked('forest', 0)).toBe(true);
  });

  it('el último mundo se completa sin abrir nada más y las misiones inexistentes se rechazan', () => {
    const s = fresh();
    for (const n of [1, 2, 3, 4]) s.applyRoundResult(summary(), `future-${n}`);
    expect(s.applyRoundResult(summary(), 'future-5')).toMatchObject({ worldCompleted: true, unlockedWorld: null, newAbility: 'estrella' });
    expect(() => s.applyRoundResult(summary(), 'luna-1')).toThrow();
    expect(() => s.applyRoundResult(summary(), 'city-9')).toThrow();
  });

  it('guarda las respuestas para adaptar la dificultad y repasar', () => {
    const storage = new MemoryStorage();
    const s = new GameState(storage).load();
    s.applyRoundResult(summary(), 'city-1', [{ id: 'pizza', firstTry: false }, { id: 'lata', firstTry: true }, { id: null, firstTry: true }]);
    const again = new GameState(storage).load();
    expect(again.progress.recentAnswers).toEqual([false, true, true]);
    expect(again.progress.trouble).toEqual({ pizza: 1 });
  });

  it('descarta progreso dañado al cargar', () => {
    const storage = new MemoryStorage();
    storage.data = { version: 1, progress: { missionProgress: { 'city-1': { stars: 9 }, 'luna-1': { stars: 2 }, 'city-2': { stars: 2, plays: -4 }, 'city-3': 'x' },
      recentAnswers: 'muchas', trouble: { pizza: 99, dragon: 2, lata: -1 }, worldProgress: { city: { clean: 1 } } } };
    const s = new GameState(storage).load();
    expect(s.progress.missionProgress).toEqual({ 'city-2': { stars: 2, plays: 1 } });
    expect(s.progress.completedMissions).toEqual(['city-2']);
    expect(s.progress.recentAnswers).toEqual([]);
    expect(s.progress.trouble).toEqual({ pizza: 3 });
    expect(s.progress.worldProgress).toBeUndefined();
  });
});
