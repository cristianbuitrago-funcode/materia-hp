import { describe, it, expect } from 'vitest';
import { WORLDS } from '../src/config/worlds.js';
import { getWaste } from '../src/game/wastes.js';
import { buildRound, ROUND_RULES } from '../src/game/SortingEngine.js';
import { GameState, MemoryStorage, CLEAN_PER_ROUND } from '../src/core/GameState.js';
import { visibleCounts } from '../src/worlds/cleanliness.js';
import { THEMES, freq } from '../src/core/AudioManager.js';

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
const summary = (stars) => ({ total: 6, firstTry: 6, mistakes: 0, stars, xp: 70, coins: 17, learned: [] });

describe('residuos propios de cada mundo', () => {
  it('las listas solo nombran residuos que existen y cubren las tres canecas', () => {
    for (const w of WORLDS) {
      for (const id of w.wastes) expect(getWaste(id), `${w.id}: ${id}`).toBeTruthy();
      expect(new Set(w.wastes).size).toBe(w.wastes.length);
      if (w.wastes.length) expect(new Set(w.wastes.map((id) => getWaste(id).bin)).size).toBe(3);
    }
  });

  it('las rondas usan primero los residuos del mundo y siguen siendo válidas', () => {
    for (const w of WORLDS.filter((x) => x.wastes.length)) {
      for (const [mode, rules] of Object.entries(ROUND_RULES)) {
        for (let seed = 1; seed <= 25; seed++) {
          const round = buildRound(mode, seeded(seed), w.wastes);
          expect(round).toHaveLength(rules.size);
          expect(new Set(round.map((x) => x.id)).size).toBe(rules.size);
          expect(new Set(round.map((x) => x.bin)).size).toBe(3);
          expect(Math.max(...round.map((x) => x.tier))).toBeLessThanOrEqual(rules.maxTier);
          // Ningún residuo ajeno al mundo entra mientras quede uno propio de la misma caneca sin usar.
          const used = new Set(round.map((x) => x.id));
          for (const out of round.filter((x) => !w.wastes.includes(x.id))) {
            const spare = w.wastes.map(getWaste).filter((x) => x.bin === out.bin && x.tier <= rules.maxTier && !used.has(x.id));
            expect(spare, `${w.id}/${mode}: ${out.id}`).toEqual([]);
          }
        }
      }
    }
  });

  it('el océano de los expertos se llena de plásticos del mar', () => {
    const ocean = WORLDS.find((w) => w.id === 'ocean');
    for (let seed = 1; seed <= 20; seed++) {
      const round = buildRound('expert', seeded(seed), ocean.wastes);
      const white = round.filter((w) => w.bin === 'white');
      expect(white.length).toBeGreaterThanOrEqual(3);
      expect(white.every((w) => ocean.wastes.includes(w.id))).toBe(true);
    }
  });
});

describe('progreso por mundo', () => {
  it('cada ronda limpia un tercio del mundo, guarda el mejor resultado y abre el siguiente', () => {
    const storage = new MemoryStorage();
    const s = new GameState(storage).load();
    expect(s.worldProgress('city')).toEqual({ rounds: 0, bestStars: 0, clean: 0 });
    expect(s.applyRoundResult(summary(2), 'city').unlockedWorld).toBe('forest');
    expect(s.applyRoundResult(summary(3), 'city').unlockedWorld).toBeNull(); // ya estaba abierto
    s.applyRoundResult(summary(1), 'city');
    s.applyRoundResult(summary(1), 'city');
    const again = new GameState(storage).load();
    expect(again.worldProgress('city')).toEqual({ rounds: 4, bestStars: 3, clean: 1 });
    expect(again.progress.unlockedWorlds).toEqual(['city', 'forest']);
    expect(CLEAN_PER_ROUND * 3).toBeCloseTo(1);
  });

  it('el último mundo no abre nada más y los mundos inexistentes se rechazan', () => {
    const s = new GameState(new MemoryStorage()).load();
    expect(s.applyRoundResult(summary(3), 'future').unlockedWorld).toBeNull();
    expect(() => s.applyRoundResult(summary(3), 'luna')).toThrow();
  });

  it('descarta progreso de mundos dañado al cargar', () => {
    const storage = new MemoryStorage();
    storage.data = { version: 1, progress: { worldProgress: { city: { rounds: -3, bestStars: 9, clean: 7 }, luna: { rounds: 1 }, forest: 'x' } } };
    const s = new GameState(storage).load();
    expect(s.progress.worldProgress).toEqual({ city: { rounds: 0, bestStars: 0, clean: 1 } });
  });
});

describe('limpieza visual del escenario', () => {
  it('contaminado muestra toda la basura; recuperado, toda la vida', () => {
    expect(visibleCounts(0, 10, 12)).toEqual({ dirty: 10, clean: 0 });
    expect(visibleCounts(1, 10, 12)).toEqual({ dirty: 0, clean: 12 });
    expect(visibleCounts(1 / 3, 10, 12)).toEqual({ dirty: 7, clean: 4 });
    expect(visibleCounts(-2, 10, 12)).toEqual({ dirty: 10, clean: 0 });
    expect(visibleCounts(5, 10, 12)).toEqual({ dirty: 0, clean: 12 });
  });

  it('nunca retrocede al avanzar', () => {
    let prev = visibleCounts(0, 10, 12);
    for (let v = 0; v <= 1.001; v += 0.02) {
      const now = visibleCounts(v, 10, 12);
      expect(now.dirty).toBeLessThanOrEqual(prev.dirty);
      expect(now.clean).toBeGreaterThanOrEqual(prev.clean);
      prev = now;
    }
  });
});

describe('música', () => {
  it('hay un tema principal y uno por mundo, todos con notas válidas', () => {
    expect(Object.keys(THEMES).sort()).toEqual(['main', ...WORLDS.map((w) => w.id)].sort());
    for (const [name, t] of Object.entries(THEMES)) {
      expect(t.melody, name).toHaveLength(32);
      expect(t.bass, name).toHaveLength(4);
      for (const n of [...t.melody.filter((x) => x !== '-'), ...t.bass]) {
        const f = freq(n);
        expect(Number.isFinite(f) && f > 60 && f < 2200, `${name}: ${n}`).toBe(true);
      }
    }
    expect(freq('A4')).toBeCloseTo(440);
    expect(freq('A#4')).toBeCloseTo(466.16, 1);
    expect(new Set(Object.values(THEMES).map((t) => t.melody.join())).size).toBe(6);
  });
});
