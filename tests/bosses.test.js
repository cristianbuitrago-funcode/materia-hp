import { describe, it, expect } from 'vitest';
import { WORLDS } from '../src/config/worlds.js';
import { LEVEL_MODS, MISSIONS_PER_WORLD, BOSS_INDEX, getMission } from '../src/config/missions.js';
import { BOSSES, ATTACKS, attackFor, shieldsFor, getBoss } from '../src/game/bosses.js';
import { ABILITIES, getAbility, abilitySource, unlockedAbilities, abilityEffects } from '../src/game/abilities.js';
import { SortingRound, ChoiceRound, buildQuizItems, buildCheckItems, buildRound, REWARDS } from '../src/game/SortingEngine.js';
import { levelRules } from '../src/game/Difficulty.js';
import { getWaste } from '../src/game/wastes.js';
import { bossSVG, BOSS_SPRITES, BOSS_EXPRESSIONS } from '../src/art/bosses.js';
import { GameState, MemoryStorage } from '../src/core/GameState.js';

const pick = (...ids) => ids.map(getWaste);

describe('niveles con dificultad creciente', () => {
  it('hay un ajuste por nivel y las rondas nunca se acortan al avanzar', () => {
    expect(LEVEL_MODS).toHaveLength(MISSIONS_PER_WORLD);
    for (const mode of ['explorer', 'adventurer', 'expert']) {
      const levels = [0, 1, 2, 3].map((i) => levelRules(mode, [], i));
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].size).toBeGreaterThan(levels[i - 1].size);
        expect(levels[i].maxTier).toBeGreaterThanOrEqual(levels[i - 1].maxTier);
      }
      expect(levels[0].size).toBeGreaterThanOrEqual(4);
    }
    expect(levelRules('adventurer', [], 0)).toMatchObject({ size: 6, maxTier: 1 });
    expect(levelRules('adventurer', [], 3)).toMatchObject({ size: 9, maxTier: 2 });
    expect(levelRules('explorer', [], 0)).toMatchObject({ size: 4, maxTier: 1 }); // nunca por debajo de lo más fácil
  });

  it('todos los niveles de todos los mundos arman una ronda jugable para cada edad y desempeño', () => {
    for (const w of WORLDS) for (const mode of ['explorer', 'adventurer', 'expert']) for (const ok of [2, 14, 20]) {
      const recent = Array.from({ length: 20 }, (_, k) => k < ok);
      for (let i = 0; i < MISSIONS_PER_WORLD; i++) {
        const m = getMission(w.id, i, mode);
        const rules = levelRules(mode, recent, i);
        const opts = { focus: m.focus, bins: m.bins, priority: [w.wastes] };
        const items = m.kind === 'quiz' ? buildQuizItems(rules, Math.random, { topics: m.topics })
          : m.kind === 'check' ? buildCheckItems(rules, Math.random, opts) : buildRound(rules, Math.random, opts);
        expect(items.length, `${m.id}/${mode}/${ok}`).toBeGreaterThanOrEqual(3);
        if (m.kind === 'quiz' && mode === 'adventurer' && ok < 20) expect(items.every((q) => q.question.tier === 2)).toBe(true);
      }
    }
  });

  it('la dificultad adaptativa se suma a la del nivel', () => {
    const great = Array(20).fill(true);
    expect(levelRules('adventurer', great, 3)).toMatchObject({ level: 1, size: 11, maxTier: 3 });
  });
});

describe('jefes', () => {
  it('cada mundo tiene un jefe en el nivel 5, con ataques y habilidad que existen', () => {
    for (const w of WORLDS) {
      const boss = getBoss(w.id);
      expect(getMission(w.id, BOSS_INDEX).kind).toBe('boss');
      expect(boss.name && boss.title && boss.taunt.length > 20).toBeTruthy();
      expect(BOSS_SPRITES.includes(boss.sprite) || boss.sprite === 'contaminator').toBe(true);
      for (const a of boss.attacks) expect(ATTACKS[a].tip.length).toBeGreaterThan(20);
      expect(getAbility(boss.ability)).toBeTruthy();
    }
    expect(new Set(WORLDS.map((w) => BOSSES[w.id].ability)).size).toBe(5);
    expect(new Set(WORLDS.map((w) => BOSSES[w.id].sprite)).size).toBe(5);
    expect(getBoss('luna')).toBeNull();
  });

  it('los dibujos de los jefes son SVG válidos en todas sus expresiones', () => {
    for (const s of BOSS_SPRITES) for (const e of BOSS_EXPRESSIONS) {
      const svg = bossSVG(s, e);
      expect(svg.startsWith('<svg ') && svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/undefined|NaN/);
      for (const tag of svg.match(/<[a-zA-Z][^>]*>/g)) {
        const names = [...tag.matchAll(/\s([a-zA-Z-]+)=/g)].map((m) => m[1]);
        expect(names.filter((n, i) => names.indexOf(n) !== i), tag).toEqual([]);
      }
    }
  });

  it('los jefes de un ataque lo usan cada tres residuos', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => attackFor('city', i, 'adventurer')))
      .toEqual([null, null, 'shuffle', null, null, 'shuffle', null, null, 'shuffle']);
    expect(attackFor('luna', 2, 'expert')).toBeNull();
  });

  it('el jefe final rota todos los trucos, uno sí y uno no', () => {
    const seq = Array.from({ length: 10 }, (_, i) => attackFor('future', i, 'expert'));
    expect(seq).toEqual([null, 'lie', null, 'shuffle', null, 'smoke', null, 'ink', null, 'rush']);
  });

  it('los exploradores no reciben contrarreloj y no pueden perder', () => {
    for (let i = 0; i < 30; i++) {
      expect(attackFor('mountain', i, 'explorer')).toBeNull();
      expect(attackFor('future', i, 'explorer')).not.toBe('rush');
    }
    expect(attackFor('mountain', 2, 'adventurer')).toBe('rush');
    expect(shieldsFor('explorer')).toBe(Infinity);
    expect(shieldsFor('adventurer')).toBe(3);
    expect(shieldsFor('expert')).toBe(3);
  });
});

describe('habilidades', () => {
  it('hay cinco, cada una entregada por el jefe de un mundo distinto', () => {
    expect(ABILITIES).toHaveLength(5);
    expect(ABILITIES.map((a) => abilitySource(a.id).id)).toEqual(WORLDS.map((w) => w.id));
    for (const a of ABILITIES) expect(a.name && a.desc.length > 20 && a.icon && ['active', 'passive'].includes(a.kind)).toBeTruthy();
  });

  it('solo se ganan derrotando al jefe, no con los niveles anteriores', () => {
    expect(unlockedAbilities({})).toEqual([]);
    expect(unlockedAbilities({ 'city-1': {}, 'city-2': {}, 'city-3': {}, 'city-4': {} })).toEqual([]);
    expect(unlockedAbilities({ 'city-5': {}, 'ocean-5': {} })).toEqual(['lupa', 'ola']);
  });

  it('se traducen en efectos concretos de juego', () => {
    expect(abilityEffects([])).toEqual({ uses: { lupa: 0, ola: 0 }, shield: 0, coinBonus: 0 });
    expect(abilityEffects(['lupa', 'escudo'])).toEqual({ uses: { lupa: 1, ola: 0 }, shield: 1, coinBonus: 0 });
    expect(abilityEffects(['lupa', 'escudo', 'ola', 'iman', 'estrella'])).toEqual({ uses: { lupa: 2, ola: 2 }, shield: 1, coinBonus: 1 });
    expect(abilityEffects(['estrella']).uses).toEqual({ lupa: 0, ola: 0 }); // la estrella sola no da botones
  });

  it('el escudo perdona un error: no cuenta, no avanza y solo sirve una vez', () => {
    const r = new SortingRound(pick('servilleta', 'lata'), { shield: 1, hintAfter: 1 });
    expect(r.attempt('white')).toMatchObject({ correct: false, forgiven: true, mistakes: 0, showHint: false });
    expect(r.current.id).toBe('servilleta');
    expect(r.attempt('black')).toMatchObject({ correct: true, firstTry: true, xp: REWARDS.firstTry.xp });
    expect(r.attempt('black')).toMatchObject({ correct: false, mistakes: 1 });
    expect(r.attempt('black').forgiven).toBeUndefined();
    r.attempt('white');
    expect(r.summary()).toMatchObject({ firstTry: 1, mistakes: 2 });
  });

  it('el imán da una moneda extra solo en aciertos a la primera', () => {
    const r = new SortingRound(pick('lata', 'banano'), { coinBonus: 1 });
    expect(r.attempt('white').coins).toBe(REWARDS.firstTry.coins + 1);
    r.attempt('white');
    expect(r.attempt('green').coins).toBe(REWARDS.retry.coins);
    expect(r.summary().coins).toBe(REWARDS.firstTry.coins + 1 + REWARDS.retry.coins + REWARDS.finish.coins);
  });

  it('los efectos pasivos también valen en los retos de opciones', () => {
    const items = buildQuizItems('expert', () => 0.3, { topics: ['ocean'] });
    const r = new ChoiceRound(items, { shield: 1, coinBonus: 1 });
    expect(r.attempt((items[0].answer + 1) % 3)).toMatchObject({ correct: false, forgiven: true });
    expect(r.attempt(items[0].answer)).toMatchObject({ correct: true, firstTry: true, coins: REWARDS.firstTry.coins + 1 });
  });

  it('el estado del juego las deduce de los jefes derrotados', () => {
    const s = new GameState(new MemoryStorage()).load();
    const sum = { total: 6, firstTry: 6, mistakes: 0, stars: 3, xp: 70, coins: 17, timeBonus: false, learned: [] };
    for (const n of [1, 2, 3, 4]) expect(s.applyRoundResult(sum, `city-${n}`).newAbility).toBeNull();
    expect(s.abilities()).toEqual([]);
    expect(s.applyRoundResult(sum, 'city-5').newAbility).toBe('lupa');
    expect(s.abilities()).toEqual(['lupa']);
  });
});
