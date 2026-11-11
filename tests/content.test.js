import { describe, it, expect } from 'vitest';
import { WORLDS, getWorld, nextWorld, FIRST_WORLD } from '../src/config/worlds.js';
import { AGE_MODES, getAgeMode } from '../src/config/ageModes.js';
import { AVATARS, randomNickname } from '../src/config/avatars.js';
import { INTRO_STORY } from '../src/config/story.js';
import { CAST } from '../src/config/theme.js';
import { CHARACTER_SVG, EXPRESSIONS, avatarSVG } from '../src/art/characters.js';
import { ICON_NAMES, iconSVG, worldIconSVG } from '../src/art/icons.js';

describe('mundos', () => {
  it('son cinco, en orden, y cada uno tiene cinco niveles con su lugar', () => {
    expect(WORLDS.map((w) => w.order)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(WORLDS.map((w) => w.id)).size).toBe(5);
    for (const w of WORLDS) {
      expect(w.missions).toHaveLength(5);
      expect(w.places).toHaveLength(5);
      expect(new Set(w.places).size).toBe(5);
      expect(CAST[w.guide]).toBeTruthy();
      expect(w.name && w.description && w.intro && w.badge).toBeTruthy();
    }
  });

  it('se recorren en cadena desde el primero hasta el último', () => {
    const seen = [];
    for (let w = getWorld(FIRST_WORLD); w; w = nextWorld(w.id)) seen.push(w.id);
    expect(seen).toEqual(['city', 'forest', 'ocean', 'mountain', 'future']);
    expect(nextWorld('future')).toBeNull();
    expect(getWorld('luna')).toBeNull();
  });

  it('incluyen las cinco insignias del diseño', () => {
    expect(WORLDS.map((w) => w.badge).sort()).toEqual(
      ['Guardián del Bosque', 'Héroe del Reciclaje', 'Maestro de la Separación', 'Protector del Océano', 'Salvavidas del Planeta']);
  });
});

describe('modos de edad', () => {
  it('cubren de 5 a 12 años en tres modos', () => {
    expect(AGE_MODES.map((m) => m.ageRange)).toEqual(['5-7', '8-10', '11-12']);
    expect(getAgeMode('explorer').rules.timer).toBe(false); // sin cronómetro para los más pequeños
    expect(getAgeMode('otro')).toBeNull();
  });
});

describe('apodos y avatares', () => {
  it('genera apodos de dos palabras sin pedir nada al niño', () => {
    for (let i = 0; i < 50; i++) expect(randomNickname()).toMatch(/^\p{L}+ \p{L}+$/u);
    expect(randomNickname(() => 0)).toBe('Jaguar Valiente');
    expect(randomNickname(() => 0.999)).toBe('Mono Increíble');
  });
});

describe('guion y arte', () => {
  it('cada línea de la historia usa un personaje y una expresión existentes', () => {
    for (const line of INTRO_STORY) {
      expect(CHARACTER_SVG[line.who]).toBeTypeOf('function');
      expect(EXPRESSIONS).toContain(line.expr);
      expect(line.text.length).toBeGreaterThan(10);
    }
    expect(new Set(INTRO_STORY.map((l) => l.who))).toEqual(new Set(['eco', 'reciclin', 'contaminator']));
  });

  it('todos los SVG generados están completos (sin valores rotos)', () => {
    const all = [];
    for (const fn of Object.values(CHARACTER_SVG)) for (const e of EXPRESSIONS) all.push(fn(e));
    for (const a of AVATARS) all.push(avatarSVG(a.id));
    for (const n of ICON_NAMES) all.push(iconSVG(n));
    for (const w of WORLDS) all.push(worldIconSVG(w.id));
    for (const svg of all) {
      expect(svg.startsWith('<svg ') && svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/undefined|NaN/);
    }
  });
});
