import { describe, it, expect } from 'vitest';
import { GameState, MemoryStorage, SAVE_VERSION, defaultState } from '../src/core/GameState.js';

const fresh = () => new GameState(new MemoryStorage()).load();

describe('GameState', () => {
  it('empieza sin perfil y con solo el primer mundo abierto', () => {
    const s = fresh();
    expect(s.hasProfile).toBe(false);
    expect(s.progress.unlockedWorlds).toEqual(['city']);
    expect(s.isWorldUnlocked('forest')).toBe(false);
  });

  it('crea un perfil de prueba y lo recupera al volver a cargar', () => {
    const storage = new MemoryStorage();
    const a = new GameState(storage).load();
    a.createProfile({ nickname: '  Jaguar Veloz ', ageMode: 'explorer', avatar: 'rana' });
    const b = new GameState(storage).load();
    expect(b.profile).toEqual({ nickname: 'Jaguar Veloz', ageMode: 'explorer', avatar: 'rana', guest: true });
  });

  it('rechaza perfiles no válidos', () => {
    const s = fresh();
    expect(() => s.createProfile({ nickname: '', ageMode: 'explorer', avatar: 'rana' })).toThrow();
    expect(() => s.createProfile({ nickname: 'A', ageMode: 'adulto', avatar: 'rana' })).toThrow();
    expect(() => s.createProfile({ nickname: 'A', ageMode: 'expert', avatar: 'dragon' })).toThrow();
    expect(s.hasProfile).toBe(false);
  });

  it('solo guarda apodo, modo de edad y avatar (sin datos personales)', () => {
    const s = fresh();
    s.createProfile({ nickname: 'Rana Feliz', ageMode: 'expert', avatar: 'oso', email: 'x@y.z', birthday: '2015-01-01' });
    expect(Object.keys(s.profile).sort()).toEqual(['ageMode', 'avatar', 'guest', 'nickname']);
  });

  it('guarda los ajustes y rechaza ajustes desconocidos', () => {
    const storage = new MemoryStorage();
    const a = new GameState(storage).load();
    a.setSetting('music', false);
    expect(new GameState(storage).load().settings).toEqual({ music: false, sfx: true });
    expect(() => a.setSetting('volumen', true)).toThrow();
  });

  it('desbloquea mundos sin duplicarlos y rechaza mundos inexistentes', () => {
    const s = fresh();
    s.unlockWorld('forest');
    s.unlockWorld('forest');
    expect(s.progress.unlockedWorlds).toEqual(['city', 'forest']);
    expect(() => s.unlockWorld('luna')).toThrow();
  });

  it('ignora partidas corruptas o de otra versión', () => {
    for (const bad of ['texto', 42, { version: SAVE_VERSION + 1, profile: { nickname: 'X', ageMode: 'explorer', avatar: 'rana' } },
      { version: SAVE_VERSION, profile: { nickname: 'X', ageMode: 'nope', avatar: 'rana' }, progress: { unlockedWorlds: 'todos' } }]) {
      const storage = new MemoryStorage();
      storage.data = bad;
      const s = new GameState(storage).load();
      expect(s.hasProfile).toBe(false);
      expect(s.progress.unlockedWorlds).toEqual(['city']);
    }
  });

  it('al borrar la partida conserva los ajustes de sonido', () => {
    const s = fresh();
    s.setSetting('sfx', false);
    s.createProfile({ nickname: 'Oso Audaz', ageMode: 'adventurer', avatar: 'zorro' });
    s.markStorySeen();
    s.resetGame();
    expect(s.data).toEqual({ ...defaultState(), settings: { music: true, sfx: false } });
  });
});
