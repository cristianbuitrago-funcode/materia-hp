// Recursos sonoros: música y efectos sintetizados con Web Audio (sin archivos).
// El audio solo arranca tras un gesto del jugador, como exigen los navegadores.
import { gameState } from './GameState.js';

const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(note) {
  const n = SEMITONES[note[0]] + (Number(note.slice(1)) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

// Melodía alegre en do mayor (C–G–Am–F), 8 corcheas por compás.
const MELODY = [
  'E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'A5', 'G5',
  'D5', 'G5', 'B5', 'G5', 'D5', 'G5', 'A5', 'B5',
  'C5', 'E5', 'A5', 'E5', 'C5', 'E5', 'G5', 'E5',
  'F5', 'A5', 'C6', 'A5', 'G5', 'F5', 'E5', 'D5',
];
const BASS = ['C3', 'G2', 'A2', 'F2'];
const STEP = 0.25; // segundos por corchea

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
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
    while (this.nextTime < this.ctx.currentTime + 0.4) {
      const i = this.step % MELODY.length;
      this.tone(freq(MELODY[i]), this.nextTime, STEP * 0.9, { type: 'triangle', vol: 0.07, out: this.musicGain });
      if (i % 4 === 0) {
        this.tone(freq(BASS[Math.floor(i / 8)]), this.nextTime, STEP * 3.5, { type: 'sine', vol: 0.12, out: this.musicGain });
      }
      this.nextTime += STEP;
      this.step++;
    }
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
