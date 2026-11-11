// Guardado de progreso. El estado del juego vive aquí y se persiste a través
// de un adaptador de almacenamiento. En modo de prueba se usa localStorage;
// en la fase 6 se añade un adaptador de Cloud Firestore con la misma interfaz
// ({ load(), save(data), clear() }).
import { FIRST_WORLD, getWorld, nextWorld } from '../config/worlds.js';
import { getAgeMode } from '../config/ageModes.js';
import { isValidAvatar } from '../config/avatars.js';
import { MISSIONS_PER_WORLD, missionId, parseMissionId } from '../config/missions.js';
import { pushRecent, updateTrouble, RECENT_WINDOW, TROUBLE_MAX } from '../game/Difficulty.js';
import { getWaste } from '../game/wastes.js';
import { earnedBadges, getBadge } from '../game/rewards.js';
import { getItem, purchaseCheck, listFor, FREE_ITEMS, DEFAULT_FRAME } from '../game/shop.js';

function defaultRewards() {
  const free = FREE_ITEMS.map(getItem);
  return {
    unlockedBadges: [],
    unlockedCharacters: free.filter((i) => i.type === 'character').map((i) => i.id),
    unlockedAccessories: [],
    unlockedFrames: free.filter((i) => i.type === 'frame').map((i) => i.id),
  };
}

export const SAVE_VERSION = 1;
const STORAGE_KEY = 'ecomision.save.v1';

export function defaultState() {
  return {
    version: SAVE_VERSION,
    settings: { music: true, sfx: true },
    storySeen: false,
    profile: null, // { nickname, ageMode, avatar, accessory, frame, guest }
    rewards: defaultRewards(),
    progress: {
      level: 1,
      experience: 0,
      ecoCoins: 0,
      unlockedWorlds: [FIRST_WORLD],
      completedMissions: [],
      roundsPlayed: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      learnedWasteTypes: [],
      missionProgress: {}, // { [missionId]: { stars, plays } } · solo misiones terminadas al menos una vez
      recentAnswers: [],   // últimas respuestas (true = a la primera), para la dificultad adaptativa
      trouble: {},         // { [wasteId]: n } residuos que más le cuestan, para repasarlos
    },
  };
}

export const XP_PER_LEVEL = 100;
export function levelForXp(xp) {
  return 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
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
      if (!Array.isArray(base.progress.learnedWasteTypes)) base.progress.learnedWasteTypes = [];
      for (const k of ['experience', 'ecoCoins', 'roundsPlayed', 'correctAnswers', 'incorrectAnswers']) {
        if (!Number.isFinite(base.progress[k]) || base.progress[k] < 0) base.progress[k] = 0;
      }
      base.progress.level = levelForXp(base.progress.experience);
      delete base.progress.worldProgress; // formato de la fase 3, reemplazado por las misiones
      const mp = base.progress.missionProgress;
      base.progress.missionProgress = {};
      if (mp && typeof mp === 'object') {
        for (const [id, v] of Object.entries(mp)) {
          if (!parseMissionId(id) || !v || ![1, 2, 3].includes(v.stars)) continue;
          base.progress.missionProgress[id] = { stars: v.stars, plays: Number.isFinite(v.plays) && v.plays >= 1 ? Math.floor(v.plays) : 1 };
        }
      }
      base.progress.completedMissions = Object.keys(base.progress.missionProgress);
      const ra = base.progress.recentAnswers;
      base.progress.recentAnswers = Array.isArray(ra) ? ra.slice(-RECENT_WINDOW).map(Boolean) : [];
      const tr = base.progress.trouble;
      base.progress.trouble = {};
      if (tr && typeof tr === 'object') {
        for (const [id, n] of Object.entries(tr)) {
          if (getWaste(id) && Number.isFinite(n) && n >= 1) base.progress.trouble[id] = Math.min(TROUBLE_MAX, Math.floor(n));
        }
      }
      if (!Array.isArray(base.progress.unlockedWorlds) || !base.progress.unlockedWorlds.includes(FIRST_WORLD)) {
        base.progress.unlockedWorlds = [FIRST_WORLD];
      }
      // Recompensas: solo se conservan elementos que existen; lo gratuito siempre está.
      const r = saved.rewards && typeof saved.rewards === 'object' ? saved.rewards : {};
      for (const key of ['unlockedCharacters', 'unlockedAccessories', 'unlockedFrames']) {
        const kept = (Array.isArray(r[key]) ? r[key] : []).filter((id) => { const it = getItem(id); return it && listFor(it.type) === key; });
        base.rewards[key] = [...new Set([...base.rewards[key], ...kept])];
      }
      base.rewards.unlockedBadges = [...new Set((Array.isArray(r.unlockedBadges) ? r.unlockedBadges : []).filter(getBadge))];
      const p = saved.profile;
      if (p && typeof p.nickname === 'string' && getAgeMode(p.ageMode) && isValidAvatar(p.avatar)) {
        const rw = base.rewards;
        base.profile = {
          nickname: p.nickname, ageMode: p.ageMode,
          // Solo se puede llevar puesto lo que se tiene.
          avatar: rw.unlockedCharacters.includes(p.avatar) ? p.avatar : rw.unlockedCharacters[0],
          accessory: rw.unlockedAccessories.includes(p.accessory) ? p.accessory : null,
          frame: rw.unlockedFrames.includes(p.frame) ? p.frame : DEFAULT_FRAME,
          guest: p.guest !== false,
        };
      }
    }
    this.data = base;
    return this;
  }

  save() { this.storage.save(this.data); }

  get settings() { return this.data.settings; }
  get profile() { return this.data.profile; }
  get progress() { return this.data.progress; }
  get rewards() { return this.data.rewards; }
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
    if (!isValidAvatar(avatar) || !this.data.rewards.unlockedCharacters.includes(avatar)) throw new Error(`Avatar no válido: ${avatar}`);
    this.data.profile = { nickname: nick, ageMode, avatar, accessory: null, frame: DEFAULT_FRAME, guest: true };
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

  missionState(id) {
    return this.data.progress.missionProgress[id] || null;
  }

  // Una misión se puede jugar si su mundo está abierto y la anterior ya se terminó.
  isMissionUnlocked(worldId, index) {
    if (!this.isWorldUnlocked(worldId) || index < 0 || index >= MISSIONS_PER_WORLD) return false;
    return index === 0 || !!this.missionState(missionId(worldId, index - 1));
  }

  // Avance de un mundo: misiones terminadas y limpieza (0 = contaminado, 1 = recuperado).
  // Cada misión terminada recupera una cuarta parte del mundo.
  worldStatus(worldId) {
    let done = 0;
    for (let i = 0; i < MISSIONS_PER_WORLD; i++) if (this.missionState(missionId(worldId, i))) done++;
    return { done, total: MISSIONS_PER_WORLD, clean: done / MISSIONS_PER_WORLD, completed: done === MISSIONS_PER_WORLD };
  }

  // Guarda el resultado de una ronda (resumen de una Round de SortingEngine).
  //   mission: id de la misión jugada; al terminar las cuatro de un mundo se abre el siguiente.
  //   answers: respuestas de la ronda ([{ id, firstTry }]) para la dificultad adaptativa.
  applyRoundResult(summary, mission = null, answers = []) {
    const parsed = mission ? parseMissionId(mission) : null;
    if (mission && !parsed) throw new Error(`Misión desconocida: ${mission}`);
    const p = this.data.progress;
    const before = p.level;
    p.experience += summary.xp;
    p.ecoCoins += summary.coins;
    p.level = levelForXp(p.experience);
    p.roundsPlayed += 1;
    p.correctAnswers += summary.total;
    p.incorrectAnswers += summary.mistakes;
    for (const id of summary.learned) if (!p.learnedWasteTypes.includes(id)) p.learnedWasteTypes.push(id);
    p.recentAnswers = pushRecent(p.recentAnswers, answers);
    p.trouble = updateTrouble(p.trouble, answers);

    let firstTime = false, worldCompleted = false, unlockedWorld = null;
    if (parsed) {
      const prev = this.missionState(mission);
      firstTime = !prev;
      p.missionProgress[mission] = { stars: Math.max(prev ? prev.stars : 0, summary.stars), plays: (prev ? prev.plays : 0) + 1 };
      p.completedMissions = Object.keys(p.missionProgress);
      worldCompleted = firstTime && this.worldStatus(parsed.worldId).completed;
      const next = nextWorld(parsed.worldId);
      if (worldCompleted && next && !p.unlockedWorlds.includes(next.id)) {
        p.unlockedWorlds.push(next.id);
        unlockedWorld = next.id;
      }
    }
    // Insignias nuevas ganadas con este resultado.
    const have = this.data.rewards.unlockedBadges;
    const newBadges = earnedBadges(p).filter((id) => !have.includes(id));
    have.push(...newBadges);
    this.save();
    return { leveledUp: p.level > before, level: p.level, firstTime, worldCompleted, unlockedWorld, newBadges };
  }

  // ---- Tienda y personalización

  owns(itemId) {
    const item = getItem(itemId);
    return !!item && this.data.rewards[listFor(item.type)].includes(itemId);
  }

  wallet() {
    const r = this.data.rewards;
    return {
      coins: this.data.progress.ecoCoins, level: this.data.progress.level, badges: r.unlockedBadges,
      owned: [...r.unlockedCharacters, ...r.unlockedAccessories, ...r.unlockedFrames],
    };
  }

  // Compra con monedas ecológicas. Devuelve { ok } o el motivo por el que no se puede.
  buyItem(itemId) {
    const item = getItem(itemId);
    const check = purchaseCheck(item, this.wallet());
    if (!check.ok) return check;
    this.data.progress.ecoCoins -= item.price;
    this.data.rewards[listFor(item.type)].push(item.id);
    this.save();
    return { ok: true, item };
  }

  // Se pone un elemento que ya es suyo. Tocar el accesorio puesto lo quita.
  equipItem(itemId) {
    const item = getItem(itemId);
    if (!this.data.profile || !this.owns(itemId)) throw new Error(`No se puede usar: ${itemId}`);
    const p = this.data.profile;
    if (item.type === 'character') p.avatar = item.id;
    else if (item.type === 'frame') p.frame = item.id;
    else p.accessory = p.accessory === item.id ? null : item.id;
    this.save();
    return p;
  }

  isEquipped(itemId) {
    const p = this.data.profile;
    return !!p && (p.avatar === itemId || p.accessory === itemId || p.frame === itemId);
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
