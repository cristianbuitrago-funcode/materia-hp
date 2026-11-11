import { describe, it, expect } from 'vitest';
import { WASTES, getWaste } from '../src/game/wastes.js';
import { BINS, getBin } from '../src/game/bins.js';
import { SortingRound, buildRound, ROUND_RULES, REWARDS } from '../src/game/SortingEngine.js';
import { GameState, MemoryStorage, levelForXp } from '../src/core/GameState.js';
import { AGE_MODES } from '../src/config/ageModes.js';
import { wasteSVG, binSVG } from '../src/art/wasteArt.js';

// Un atributo repetido en una etiqueta invalida el SVG y el navegador no lo carga.
function duplicatedAttribute(svg) {
  for (const tag of svg.match(/<[a-zA-Z][^>]*>/g)) {
    const names = [...tag.matchAll(/\s([a-zA-Z-]+)=/g)].map((m) => m[1]);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) return `${dup} en ${tag}`;
  }
  return null;
}

// Generador determinista para repetir las pruebas.
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
const pick = (...ids) => ids.map(getWaste);
const wrongBin = (w) => BINS.find((b) => b.id !== w.bin).id;

describe('catálogo de residuos y canecas', () => {
  it('hay tres canecas con nombre, símbolo y descripción (no solo color)', () => {
    expect(BINS.map((b) => b.id)).toEqual(['white', 'black', 'green']);
    for (const b of BINS) expect(b.name && b.title && b.hint && b.symbol).toBeTruthy();
    expect(new Set(BINS.map((b) => b.symbol)).size).toBe(3);
  });

  it('cada residuo tiene caneca válida, explicación, dato curioso y dibujo', () => {
    expect(new Set(WASTES.map((w) => w.id)).size).toBe(WASTES.length);
    for (const w of WASTES) {
      expect(getBin(w.bin)).toBeTruthy();
      expect([1, 2, 3]).toContain(w.tier);
      expect(w.why.length).toBeGreaterThan(15);
      expect(w.fact.length).toBeGreaterThan(15);
      const svg = wasteSVG(w.id);
      expect(svg.startsWith('<svg ') && svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/undefined|NaN/);
      expect(duplicatedAttribute(svg)).toBeNull();
    }
    for (const b of BINS) {
      expect(binSVG(b.id)).not.toMatch(/undefined|NaN/);
      expect(duplicatedAttribute(binSVG(b.id))).toBeNull();
    }
  });

  it('sigue el código de colores colombiano en los casos clave', () => {
    const bin = (id) => getWaste(id).bin;
    expect(['botella', 'lata', 'carton', 'periodico', 'vidrio', 'tetrapak'].map(bin)).toEqual(Array(6).fill('white'));
    expect(['banano', 'comida', 'huevo', 'cafe'].map(bin)).toEqual(Array(4).fill('green'));
    expect(['higienico', 'servilleta', 'pizza', 'papas'].map(bin)).toEqual(Array(4).fill('black'));
  });
});

describe('buildRound', () => {
  it('respeta tamaño y dificultad de cada modo, sin repetir y con las tres canecas', () => {
    expect(Object.keys(ROUND_RULES)).toEqual(AGE_MODES.map((m) => m.id));
    for (const [mode, rules] of Object.entries(ROUND_RULES)) {
      for (let seed = 1; seed <= 40; seed++) {
        const round = buildRound(mode, seeded(seed));
        expect(round).toHaveLength(rules.size);
        expect(new Set(round.map((w) => w.id)).size).toBe(rules.size);
        expect(Math.max(...round.map((w) => w.tier))).toBeLessThanOrEqual(rules.maxTier);
        expect(new Set(round.map((w) => w.bin)).size).toBe(3);
      }
    }
    expect(() => buildRound('adulto')).toThrow();
  });

  it('los exploradores solo ven residuos fáciles y reciben la pista al primer error', () => {
    expect(ROUND_RULES.explorer.maxTier).toBe(1);
    expect(ROUND_RULES.explorer.hintAfter).toBe(1);
  });
});

describe('SortingRound', () => {
  it('acertar a la primera da el premio completo y avanza', () => {
    const r = new SortingRound(pick('botella', 'banano'));
    const res = r.attempt('white');
    expect(res).toMatchObject({ correct: true, firstTry: true, xp: REWARDS.firstTry.xp, coins: REWARDS.firstTry.coins, finished: false });
    expect(r.current.id).toBe('banano');
  });

  it('un error no resta nada, no avanza y permite reintentar con premio menor', () => {
    const r = new SortingRound(pick('servilleta', 'lata'), { hintAfter: 2 });
    const bad = r.attempt('white');
    expect(bad).toMatchObject({ correct: false, mistakes: 1, showHint: false, xp: 0, coins: 0 });
    expect(r.xp).toBe(0);
    expect(r.current.id).toBe('servilleta');
    expect(r.attempt('green')).toMatchObject({ correct: false, mistakes: 2, showHint: true });
    const ok = r.attempt('black');
    expect(ok).toMatchObject({ correct: true, firstTry: false, xp: REWARDS.retry.xp, coins: REWARDS.retry.coins });
    expect(r.showHint).toBe(false); // la pista no pasa al siguiente residuo
  });

  it('calcula el resumen con bono por terminar y estrellas por aciertos a la primera', () => {
    const play = (wastes, errorsOn) => {
      const r = new SortingRound(wastes);
      for (const w of wastes) { if (errorsOn.includes(w.id)) r.attempt(wrongBin(w)); r.attempt(w.bin); }
      return r.summary();
    };
    const five = pick('botella', 'banano', 'servilleta', 'lata', 'manzana');
    expect(play(five, [])).toEqual({ total: 5, firstTry: 5, mistakes: 0, stars: 3, xp: 60, coins: 15, timeBonus: false,
      learned: ['botella', 'banano', 'servilleta', 'lata', 'manzana'] });
    expect(play(five, ['banano', 'lata'])).toMatchObject({ firstTry: 3, mistakes: 2, stars: 2, xp: 50, coins: 13 });
    expect(play(five, five.map((w) => w.id))).toMatchObject({ firstTry: 0, mistakes: 5, stars: 1, xp: 35, coins: 10 });
  });

  it('rechaza usos incorrectos', () => {
    const r = new SortingRound(pick('lata'));
    expect(() => r.summary()).toThrow();
    expect(() => r.attempt('azul')).toThrow();
    r.attempt('white');
    expect(r.current).toBeNull();
    expect(() => r.attempt('white')).toThrow();
    expect(() => new SortingRound([])).toThrow();
  });
});

describe('guardado del resultado de una ronda', () => {
  it('suma experiencia, monedas y residuos aprendidos, y sube de nivel', () => {
    const storage = new MemoryStorage();
    const s = new GameState(storage).load();
    const summary = { total: 6, firstTry: 5, mistakes: 1, stars: 2, xp: 65, coins: 16, learned: ['lata', 'banano'] };
    expect(s.applyRoundResult(summary)).toMatchObject({ leveledUp: false, level: 1, unlockedWorld: null });
    expect(s.applyRoundResult({ ...summary, learned: ['lata', 'vidrio'] })).toMatchObject({ leveledUp: true, level: 2, unlockedWorld: null });
    const again = new GameState(storage).load();
    expect(again.progress).toMatchObject({ experience: 130, ecoCoins: 32, level: 2, roundsPlayed: 2, correctAnswers: 12, incorrectAnswers: 2,
      learnedWasteTypes: ['lata', 'banano', 'vidrio'] });
  });

  it('el nivel se calcula desde la experiencia y tolera datos dañados', () => {
    expect([0, 99, 100, 250].map(levelForXp)).toEqual([1, 1, 2, 3]);
    const storage = new MemoryStorage();
    storage.data = { version: 1, progress: { experience: 'mucha', ecoCoins: -5, level: 99, learnedWasteTypes: null } };
    const s = new GameState(storage).load();
    expect(s.progress).toMatchObject({ experience: 0, ecoCoins: 0, level: 1, learnedWasteTypes: [] });
  });
});
