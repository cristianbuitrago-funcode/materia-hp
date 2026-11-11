import { describe, it, expect } from 'vitest';
import { BADGES, earnedBadges, badgeContext, levelTitle, getBadge } from '../src/game/rewards.js';
import { SHOP_ITEMS, ITEM_TYPES, getItem, itemsOfType, purchaseCheck, requirementText, FREE_ITEMS } from '../src/game/shop.js';
import { AVATARS, FREE_AVATARS, ACCESSORIES } from '../src/config/avatars.js';
import { WORLDS } from '../src/config/worlds.js';
import { WASTES } from '../src/game/wastes.js';
import { GameState, MemoryStorage } from '../src/core/GameState.js';
import { avatarSVG, accessorySVG } from '../src/art/characters.js';

const summary = (over = {}) => ({ total: 6, firstTry: 6, mistakes: 0, stars: 3, xp: 70, coins: 17, timeBonus: false, learned: [], ...over });
const withProfile = (storage = new MemoryStorage()) => {
  const s = new GameState(storage).load();
  s.createProfile({ nickname: 'Rana Feliz', ageMode: 'adventurer', avatar: 'rana' });
  return s;
};

describe('insignias', () => {
  it('incluyen las cinco del diseño, una por mundo, con el nombre de worlds.js', () => {
    for (const w of WORLDS) expect(getBadge(w.id).name).toBe(w.badge);
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) expect(b.name && b.how.length > 10 && b.icon).toBeTruthy();
  });

  it('un jugador nuevo no tiene ninguna', () => {
    expect(earnedBadges(new GameState(new MemoryStorage()).load().progress)).toEqual([]);
  });

  it('la primera misión da «Primer Paso» y recuperar un mundo da su insignia', () => {
    const s = withProfile();
    expect(s.applyRoundResult(summary({ stars: 1 }), 'city-1').newBadges).toEqual(['first']);
    expect(s.applyRoundResult(summary({ stars: 1 }), 'city-2').newBadges).toEqual([]);
    s.applyRoundResult(summary({ stars: 1 }), 'city-3');
    expect(s.applyRoundResult(summary({ stars: 1 }), 'city-4').newBadges).toEqual([]); // falta el jefe
    expect(s.applyRoundResult(summary({ stars: 1 }), 'city-5').newBadges).toEqual(['city']);
    expect(s.rewards.unlockedBadges).toEqual(['first', 'city']);
    // No se entrega dos veces.
    expect(s.applyRoundResult(summary({ stars: 1 }), 'city-5').newBadges).toEqual([]);
  });

  it('premia el esfuerzo aunque no haya estrellas altas, y el aprendizaje del álbum', () => {
    const s = withProfile();
    for (let i = 0; i < 9; i++) s.applyRoundResult(summary({ stars: 1 }), 'city-1');
    expect(s.rewards.unlockedBadges).not.toContain('effort');
    expect(s.applyRoundResult(summary({ stars: 1 }), 'city-1').newBadges).toEqual(['effort']);
    expect(s.rewards.unlockedBadges).not.toContain('stars'); // siempre 1 estrella
    const ids = WASTES.map((w) => w.id);
    expect(s.applyRoundResult(summary({ learned: ids.slice(0, 15) }), 'city-1').newBadges).toEqual(['album15']);
    expect(s.applyRoundResult(summary({ learned: ids }), 'city-1').newBadges).toEqual(['albumAll']);
  });

  it('«Lluvia de Estrellas» cuenta misiones distintas con 3 estrellas', () => {
    const p = { missionProgress: {} };
    for (const id of ['city-1', 'city-2', 'city-3', 'city-4']) p.missionProgress[id] = { stars: 3, plays: 5 };
    expect(badgeContext(p).threeStar).toBe(4);
    expect(earnedBadges(p)).not.toContain('stars');
    expect(earnedBadges(p)).not.toContain('city');
    p.missionProgress['city-5'] = { stars: 3, plays: 1 };
    expect(earnedBadges(p)).toEqual(expect.arrayContaining(['city', 'first', 'stars']));
  });

  it('los títulos de nivel suben y nunca se salen de la lista', () => {
    expect(levelTitle(1)).toBe('Aprendiz');
    expect(levelTitle(3)).toBe('Guardián');
    expect(levelTitle(999)).toBe('Leyenda del planeta');
    expect(levelTitle(0)).toBe('Aprendiz');
    expect(levelTitle(undefined)).toBe('Aprendiz');
  });
});

describe('catálogo de la tienda', () => {
  it('es coherente: ids únicos, tipos válidos, requisitos que existen y arte disponible', () => {
    expect(new Set(SHOP_ITEMS.map((i) => i.id)).size).toBe(SHOP_ITEMS.length);
    for (const it of SHOP_ITEMS) {
      expect(ITEM_TYPES.map((t) => t.id)).toContain(it.type);
      expect(Number.isInteger(it.price) && it.price >= 0).toBe(true);
      if (it.requires && it.requires.badge) expect(getBadge(it.requires.badge)).toBeTruthy();
      if (it.type === 'frame') expect(Number.isInteger(it.fill) && Number.isInteger(it.ring)).toBe(true);
    }
    expect(itemsOfType('character').map((i) => i.id)).toEqual(AVATARS.map((a) => a.id));
    expect(itemsOfType('accessory').map((i) => i.id)).toEqual(ACCESSORIES);
    expect(FREE_ITEMS).toEqual([...FREE_AVATARS.map((a) => a.id), 'f-crema']);
    for (const a of AVATARS) expect(avatarSVG(a.id)).not.toMatch(/undefined|NaN/);
    for (const a of ACCESSORIES) expect(accessorySVG(a)).not.toMatch(/undefined|NaN/);
    // Un atributo repetido invalida el SVG y el juego no arrancaría.
    for (const svg of [...AVATARS.map((a) => avatarSVG(a.id)), ...ACCESSORIES.map((a) => accessorySVG(a)), accessorySVG('gafas', 'rana')]) {
      for (const tag of svg.match(/<[a-zA-Z][^>]*>/g)) {
        const names = [...tag.matchAll(/\s([a-zA-Z-]+)=/g)].map((m) => m[1]);
        expect(names.filter((n, i) => names.indexOf(n) !== i), tag).toEqual([]);
      }
    }
  });

  it('no hay azar ni dinero real: todo tiene precio fijo en monedas y requisito claro', () => {
    for (const it of SHOP_ITEMS) {
      expect(Object.keys(it).every((k) => ['id', 'type', 'name', 'price', 'requires', 'fill', 'ring'].includes(k))).toBe(true);
      if (it.requires) expect(requirementText(it).length).toBeGreaterThan(5);
    }
  });

  it('explica por qué no se puede comprar', () => {
    const wallet = { coins: 10, level: 1, badges: [], owned: ['rana'] };
    expect(purchaseCheck(getItem('rana'), wallet)).toMatchObject({ ok: false, reason: 'owned' });
    expect(purchaseCheck(getItem('gorra'), wallet)).toMatchObject({ ok: false, reason: 'coins', need: 10 });
    expect(purchaseCheck(getItem('gorra'), { ...wallet, coins: 19 }).message).toContain('1 moneda.');
    expect(purchaseCheck(getItem('buho'), { ...wallet, coins: 500 })).toMatchObject({ ok: false, reason: 'level' });
    expect(purchaseCheck(getItem('capa'), { ...wallet, coins: 500 })).toMatchObject({ ok: false, reason: 'badge' });
    expect(purchaseCheck(getItem('capa'), { ...wallet, coins: 500, badges: ['city'] })).toEqual({ ok: true });
    expect(purchaseCheck(null, wallet)).toMatchObject({ ok: false, reason: 'unknown' });
  });
});

describe('comprar y usar', () => {
  it('compra con monedas, no deja comprar dos veces ni gastar lo que no hay', () => {
    const storage = new MemoryStorage();
    const s = withProfile(storage);
    expect(s.buyItem('gorra')).toMatchObject({ ok: false, reason: 'coins' });
    s.applyRoundResult(summary({ coins: 45 }), 'city-1');
    expect(s.buyItem('gorra')).toMatchObject({ ok: true });
    expect(s.progress.ecoCoins).toBe(25);
    expect(s.owns('gorra')).toBe(true);
    expect(s.buyItem('gorra')).toMatchObject({ ok: false, reason: 'owned' });
    expect(s.buyItem('gafas')).toMatchObject({ ok: false, reason: 'coins', need: 5 });
    expect(s.progress.ecoCoins).toBe(25);
    expect(s.buyItem('dragon')).toMatchObject({ ok: false, reason: 'unknown' });
    const again = new GameState(storage).load();
    expect(again.rewards.unlockedAccessories).toEqual(['gorra']);
    expect(again.progress.ecoCoins).toBe(25);
  });

  it('se pone y se quita lo comprado; no puede usar lo que no tiene', () => {
    const storage = new MemoryStorage();
    const s = withProfile(storage);
    s.applyRoundResult(summary({ coins: 200 }), 'city-1');
    s.buyItem('gorra'); s.buyItem('mono'); s.buyItem('f-cielo');
    s.equipItem('gorra'); s.equipItem('mono'); s.equipItem('f-cielo');
    expect(s.profile).toMatchObject({ avatar: 'mono', accessory: 'gorra', frame: 'f-cielo' });
    expect(s.isEquipped('gorra') && s.isEquipped('mono') && s.isEquipped('f-cielo')).toBe(true);
    expect(new GameState(storage).load().profile).toMatchObject({ avatar: 'mono', accessory: 'gorra', frame: 'f-cielo' });
    s.equipItem('gorra'); // tocar el accesorio puesto lo quita
    expect(s.profile.accessory).toBeNull();
    expect(() => s.equipItem('gafas')).toThrow();
    expect(() => s.equipItem('buho')).toThrow();
  });

  it('al crear el perfil solo se pueden elegir personajes gratuitos', () => {
    const s = new GameState(new MemoryStorage()).load();
    expect(() => s.createProfile({ nickname: 'A', ageMode: 'expert', avatar: 'buho' })).toThrow();
  });

  it('una partida manipulada no conserva elementos inexistentes ni puestos sin tenerlos', () => {
    const storage = new MemoryStorage();
    storage.data = { version: 1,
      profile: { nickname: 'X', ageMode: 'expert', avatar: 'buho', accessory: 'capa', frame: 'f-sol' },
      rewards: { unlockedCharacters: ['dragon', 'gorra', 'mono'], unlockedAccessories: 'todas', unlockedFrames: ['f-cielo', 'f-cielo'], unlockedBadges: ['city', 'falsa', 'city'] } };
    const s = new GameState(storage).load();
    expect(s.rewards).toEqual({ unlockedBadges: ['city'], unlockedCharacters: ['rana', 'oso', 'jaguar', 'zorro', 'mono'], unlockedAccessories: [], unlockedFrames: ['f-crema', 'f-cielo'] });
    expect(s.profile).toMatchObject({ avatar: 'rana', accessory: null, frame: 'f-crema' });
  });
});
