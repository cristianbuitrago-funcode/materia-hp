// Guardado de progreso. El estado del juego vive aquí y se persiste a través
// de un adaptador de almacenamiento. En modo de prueba se usa localStorage;
// en la fase 6 se añade un adaptador de Cloud Firestore con la misma interfaz
// ({ load(), save(data), clear() }).
import { FIRST_WORLD, getWorld } from '../config/worlds.js';
import { getAgeMode } from '../config/ageModes.js';
import { isValidAvatar } from '../config/avatars.js';

export const SAVE_VERSION = 1;
const STORAGE_KEY = 'ecomision.save.v1';

export function defaultState() {
  return {
    version: SAVE_VERSION,
    settings: { music: true, sfx: true },
    storySeen: false,
    profile: null, // { nickname, ageMode, avatar, guest }
    progress: {
      level: 1,
      experience: 0,
      ecoCoins: 0,
      unlockedWorlds: [FIRST_WORLD],
      completedMissions: [],
    },
  };
}

export class MemoryStorage {
  constructor() { this.data = null; }
  load() { return this.data; }
  save(data) { this.data = JSON.parse(JSON.stringify(data)); }
  clear() { this.data = null; }
}

export class LocalStorageAdapter {
  load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null; // almacenamiento bloqueado o dato corrupto: se empieza de cero
    }
  }
  save(data) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* sin almacenamiento */ }
  }
  clear() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* sin almacenamiento */ }
  }
}

export class GameState {
  constructor(storage = new MemoryStorage()) {
    this.storage = storage;
    this.data = defaultState();
  }

  // Carga la partida guardada, tolerando datos incompletos o de otra versión.
  load() {
    const base = defaultState();
    const saved = this.storage.load();
    if (saved && typeof saved === 'object' && saved.version === SAVE_VERSION) {
      base.settings = { ...base.settings, ...(saved.settings || {}) };
      base.storySeen = !!saved.storySeen;
      base.progress = { ...base.progress, ...(saved.progress || {}) };
      if (!Array.isArray(base.progress.unlockedWorlds) || !base.progress.unlockedWorlds.includes(FIRST_WORLD)) {
        base.progress.unlockedWorlds = [FIRST_WORLD];
      }
      const p = saved.profile;
      if (p && typeof p.nickname === 'string' && getAgeMode(p.ageMode) && isValidAvatar(p.avatar)) {
        base.profile = { nickname: p.nickname, ageMode: p.ageMode, avatar: p.avatar, guest: p.guest !== false };
      }
    }
    this.data = base;
    return this;
  }

  save() { this.storage.save(this.data); }

  get settings() { return this.data.settings; }
  get profile() { return this.data.profile; }
  get progress() { return this.data.progress; }
  get hasProfile() { return !!this.data.profile; }

  setSetting(key, value) {
    if (!(key in this.data.settings)) throw new Error(`Ajuste desconocido: ${key}`);
    this.data.settings[key] = !!value;
    this.save();
  }

  markStorySeen() {
    this.data.storySeen = true;
    this.save();
  }

  // Perfil de prueba: solo apodo, rango de edad y avatar. Sin datos personales.
  createProfile({ nickname, ageMode, avatar }) {
    const nick = String(nickname || '').trim().slice(0, 24);
    if (!nick) throw new Error('El apodo no puede estar vacío');
    if (!getAgeMode(ageMode)) throw new Error(`Modo de edad no válido: ${ageMode}`);
    if (!isValidAvatar(avatar)) throw new Error(`Avatar no válido: ${avatar}`);
    this.data.profile = { nickname: nick, ageMode, avatar, guest: true };
    this.save();
    return this.data.profile;
  }

  isWorldUnlocked(worldId) {
    return this.data.progress.unlockedWorlds.includes(worldId);
  }

  unlockWorld(worldId) {
    if (!getWorld(worldId)) throw new Error(`Mundo desconocido: ${worldId}`);
    if (!this.isWorldUnlocked(worldId)) {
      this.data.progress.unlockedWorlds.push(worldId);
      this.save();
    }
  }

  // Borra perfil y progreso; conserva los ajustes de sonido.
  resetGame() {
    const settings = { ...this.data.settings };
    this.data = defaultState();
    this.data.settings = settings;
    this.storage.clear();
    this.save();
  }
}

export const gameState = new GameState(typeof window !== 'undefined' ? new LocalStorageAdapter() : new MemoryStorage());
