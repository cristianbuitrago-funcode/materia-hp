// Recursos sonoros: música y efectos sintetizados con Web Audio (sin archivos).
// El audio solo arranca tras un gesto del jugador, como exigen los navegadores.
import { gameState } from './GameState.js';

const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function freq(note) {
  const sharp = note[1] === '#' ? 1 : 0;
  const n = SEMITONES[note[0]] + sharp + (Number(note.slice(1 + sharp)) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

// Temas musicales: cada mundo tiene melodía, ritmo y timbre propios.
// 8 corcheas por compás; '-' es silencio; `bass` tiene una nota por compás.
const THEMES = {
  // Tema principal (inicio y mapa): alegre, en do mayor.
  main: { step: 0.25, lead: 'triangle', vol: 0.07,
    melody: ['E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'A5', 'G5', 'D5', 'G5', 'B5', 'G5', 'D5', 'G5', 'A5', 'B5',
      'C5', 'E5', 'A5', 'E5', 'C5', 'E5', 'G5', 'E5', 'F5', 'A5', 'C6', 'A5', 'G5', 'F5', 'E5', 'D5'],
    bass: ['C3', 'G2', 'A2', 'F2'] },
  // Ciudad: rápida y saltarina, con silencios como pasos por la calle.
  city: { step: 0.2, lead: 'square', vol: 0.035,
    melody: ['G4', '-', 'B4', 'D5', '-', 'B4', 'G4', '-', 'A4', '-', 'C5', 'E5', '-', 'C5', 'A4', '-',
      'B4', '-', 'D5', 'G5', '-', 'D5', 'B4', '-', 'D5', 'E5', 'D5', 'B4', 'A4', '-', 'G4', '-'],
    bass: ['G2', 'A2', 'B2', 'D3'] },
  // Bosque: pentatónica, tranquila.
  forest: { step: 0.3, lead: 'sine', vol: 0.09,
    melody: ['D5', 'F#5', 'A5', '-', 'B5', 'A5', 'F#5', '-', 'E5', 'F#5', 'A5', '-', 'F#5', 'E5', 'D5', '-',
      'B4', 'D5', 'E5', '-', 'F#5', 'E5', 'D5', '-', 'A4', 'B4', 'D5', 'E5', 'D5', '-', '-', '-'],
    bass: ['D3', 'A2', 'B2', 'G2'] },
  // Océano: lenta, en arpegios que suben y bajan como olas.
  ocean: { step: 0.34, lead: 'sine', vol: 0.09,
    melody: ['A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'A4', '-', 'F4', 'A4', 'C5', 'F5', 'C5', 'A4', 'F4', '-',
      'C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', '-', 'G4', 'B4', 'D5', 'G5', 'D5', 'B4', 'G4', '-'],
    bass: ['A2', 'F2', 'C3', 'G2'] },
  // Montaña: en re menor, algo misteriosa pero con final esperanzador.
  mountain: { step: 0.28, lead: 'triangle', vol: 0.07,
    melody: ['D5', '-', 'F5', 'E5', 'D5', '-', 'A4', '-', 'A#4', '-', 'D5', 'C5', 'A#4', '-', 'G4', '-',
      'F4', 'A4', 'C5', 'F5', 'E5', '-', 'C5', '-', 'A4', 'C#5', 'E5', 'A5', 'G5', 'E5', 'C#5', '-'],
    bass: ['D3', 'A#2', 'F2', 'A2'] },
  // Futuro: brillante, aguda y veloz.
  future: { step: 0.19, lead: 'triangle', vol: 0.065,
    melody: ['C5', 'E5', 'G5', 'C6', 'E6', 'C6', 'G5', 'E5', 'F5', 'A5', 'C6', 'F6', 'C6', 'A5', 'F5', 'A5',
      'G5', 'B5', 'D6', 'G6', 'D6', 'B5', 'G5', 'B5', 'C6', 'G5', 'E6', 'D6', 'C6', 'B5', 'C6', '-'],
    bass: ['C3', 'F2', 'G2', 'C3'] },
};
export { THEMES };

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.theme = 'main';
  }

  // Llamar desde un gesto del usuario (clic, toque o tecla).
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  tone(f, start, dur, { type = 'sine', vol = 0.1, to = null, out = null } = {}) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, start);
    if (to) o.frequency.exponentialRampToValueAtTime(to, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(out || this.ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  sfx(name) {
    if (!gameState.settings.sfx || !this.unlock()) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'click': this.tone(620, t, 0.09, { type: 'triangle', vol: 0.18, to: 940 }); break;
      case 'pop': this.tone(420, t, 0.12, { type: 'sine', vol: 0.2, to: 880 }); break;
      case 'locked': this.tone(200, t, 0.18, { type: 'square', vol: 0.07, to: 140 }); break;
      case 'talk': this.tone(520 + Math.random() * 240, t, 0.05, { type: 'triangle', vol: 0.05 }); break;
      case 'pick': this.tone(500, t, 0.07, { type: 'sine', vol: 0.14, to: 700 }); break;
      case 'drop': this.tone(300, t, 0.12, { type: 'sine', vol: 0.18, to: 160 }); break;
      // Error suave: dos notas que bajan, sin sonar a castigo.
      case 'oops':
        this.tone(392, t, 0.14, { type: 'triangle', vol: 0.13 });
        this.tone(330, t + 0.13, 0.2, { type: 'triangle', vol: 0.13 });
        break;
      case 'coin':
        this.tone(988, t, 0.08, { type: 'square', vol: 0.06 });
        this.tone(1319, t + 0.07, 0.18, { type: 'square', vol: 0.06 });
        break;
      case 'fanfare':
        ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => this.tone(freq(n), t + i * 0.13, i === 5 ? 0.6 : 0.2, { type: 'triangle', vol: 0.17 }));
        break;
      case 'success':
        ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => this.tone(freq(n), t + i * 0.09, 0.22, { type: 'triangle', vol: 0.16 }));
        break;
      default: break;
    }
  }

  startMusic() {
    if (!gameState.settings.music || this.timer || !this.unlock()) return;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 100);
  }

  schedule() {
    const t = THEMES[this.theme];
    while (this.nextTime < this.ctx.currentTime + 0.4) {
      const i = this.step % t.melody.length;
      if (t.melody[i] !== '-') {
        this.tone(freq(t.melody[i]), this.nextTime, t.step * 0.9, { type: t.lead, vol: t.vol, out: this.musicGain });
      }
      if (i % 4 === 0) {
        this.tone(freq(t.bass[Math.floor(i / 8)]), this.nextTime, t.step * 3.5, { type: 'sine', vol: 0.12, out: this.musicGain });
      }
      this.nextTime += t.step;
      this.step++;
    }
  }

  // Cambia el tema musical (cada mundo tiene el suyo). Si la música está apagada, solo lo recuerda.
  setTheme(name) {
    if (!THEMES[name]) throw new Error(`Tema musical desconocido: ${name}`);
    if (this.theme === name) return;
    this.theme = name;
    this.step = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.25;
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  get musicPlaying() { return !!this.timer; }

  // Aplica el ajuste de música después de cambiarlo.
  syncMusic() {
    if (gameState.settings.music) this.startMusic(); else this.stopMusic();
  }
}

export const audio = new AudioManager();
