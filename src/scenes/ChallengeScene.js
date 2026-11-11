// Retos de opción múltiple dentro de una misión:
//   'check' → "¿Está en la caneca correcta?" (sí / no), con imágenes: sirve para todas las edades.
//   'quiz'  → preguntas ambientales de tres opciones (8 años en adelante).
// Igual que al clasificar, equivocarse no castiga: se puede probar otra opción.
import Phaser from 'phaser';
import { theme } from '../config/theme.js';
import { Button, label, panel } from '../ui/widgets.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { audio } from '../core/AudioManager.js';
import { buildWorld } from '../worlds/index.js';
import { getBin } from '../game/bins.js';
import { ChoiceRound, buildCheckItems, buildQuizItems } from '../game/SortingEngine.js';
import { prepareMission, openingLine, createHud, createGuide, createSparks, floatReward, finishMission } from '../game/missionUi.js';

const CX = 1170; // centro de la zona de juego (a la derecha del guía)
const BIN_HEX = { white: '#1565C0', black: '#23272D', green: '#0F6A3A' };

export class ChallengeScene extends Phaser.Scene {
  constructor() { super('Challenge'); }

  create(data) {
    const setup = prepareMission(data);
    if (!setup || !['check', 'quiz'].includes(setup.mission.kind)) { this.scene.start('WorldMap'); return; }
    enterScene(this);
    this.setup = setup;
    this.kind = setup.mission.kind;
    const items = this.kind === 'check'
      ? buildCheckItems(setup.rules, Math.random, setup.pick)
      : buildQuizItems(setup.rules, Math.random, { topics: setup.mission.topics });
    this.round = new ChoiceRound(items, { hintAfter: setup.rules.hintAfter });
    this.busy = true;
    this.content = [];
    this.options = [];
    this.nextBtn = null;

    this.env = buildWorld(this, setup.world.id, setup.cleanStart);
    audio.setTheme(setup.world.id);
    audio.startMusic();

    this.hud = createHud(this, { unit: this.kind === 'check' ? 'Residuo' : 'Pregunta', onBack: () => this.exit() });
    this.guide = createGuide(this);
    this.sparks = createSparks(this);
    panel(this, CX, 400, 1400, 430, { radius: 60 });

    // Atajos: teclas 1, 2 y 3 eligen la opción.
    this.input.keyboard.on('keydown', (e) => {
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i >= 0 && this.options[i] && this.options[i].active) this.options[i].activate();
    });
    this.onCancel = () => this.exit();
    this.onDefaultAction = () => { if (this.nextBtn) this.advance(); };

    this.guide.say(openingLine(setup), 'happy');
    this.showItem();
  }

  keep(obj) {
    this.content.push(obj);
    return obj;
  }

  clearItem() {
    for (const o of this.content) o.destroy();
    for (const b of this.options) if (b.active) b.destroy();
    if (this.nextBtn) this.nextBtn.destroy();
    this.focus.items = this.focus.items.filter((i) => i.active);
    this.focus.clear();
    this.content = [];
    this.options = [];
    this.nextBtn = null;
  }

  showItem() {
    this.clearItem();
    this.hud.update(this.round);
    const item = this.round.current;
    if (item.type === 'check') this.showCheck(item); else this.showQuiz(item);
    this.options.forEach((b, i) => {
      b.setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 260, delay: 120 + i * 90, ease: 'Back.out' });
    });
    audio.sfx('pop');
    this.busy = false;
  }

  showCheck(item) {
    const bin = getBin(item.shownBin);
    this.keep(label(this, CX, 250, '¿Está en la caneca correcta?', { size: 58, color: theme.hex.greenDark }));
    this.keep(this.add.circle(CX - 440, 440, 130, 0xffffff, 0.9).setStrokeStyle(6, 0xd9d2bd));
    this.keep(this.add.image(CX - 440, 440, `waste-${item.waste.id}`).setDisplaySize(210, 210));
    this.keep(this.add.image(CX - 230, 440, 'ic-next').setDisplaySize(90, 90).setTint(theme.c.ink));
    this.keep(this.add.image(CX - 40, 446, `bin-${bin.id}`).setDisplaySize(200, 240));
    this.keep(label(this, CX + 120, 380, item.waste.name, { size: 48, origin: [0, 0.5], wrap: 540 }));
    this.keep(label(this, CX + 120, 462, 'en la caneca', { size: 36, origin: [0, 0.5], bold: false }));
    this.keep(label(this, CX + 120, 522, `${bin.name} · ${bin.title}`, { size: 40, origin: [0, 0.5], color: BIN_HEX[bin.id] }));
    this.options = [
      new Button(this, CX - 345, 760, { label: 'Sí, está bien', icon: 'ic-check', width: 640, height: 140, fontSize: 56, color: theme.c.green, sound: 'pick', onClick: () => this.pick(0) }),
      new Button(this, CX + 345, 760, { label: 'No, va en otra', icon: 'ic-close', width: 640, height: 140, fontSize: 56, color: theme.c.orange, sound: 'pick', onClick: () => this.pick(1) }),
    ];
  }

  showQuiz(item) {
    this.keep(label(this, CX, 400, item.question.q, { size: 54, wrap: 1280, lineSpacing: 8 }));
    this.options = item.labels.map((text, i) => new Button(this, CX, 700 + i * 126, {
      label: text, width: 1400, height: 104, fontSize: 42, color: theme.c.blue, sound: 'pick', onClick: () => this.pick(i),
    }));
  }

  pick(i) {
    if (this.busy || this._leaving) return;
    const button = this.options[i];
    if (!button.enabled) return;
    const result = this.round.attempt(i);
    if (!result.correct) {
      audio.sfx('oops');
      button.setEnabled(false); // esa opción queda descartada; se puede probar otra
      this.tweens.add({ targets: button, x: button.x + 14, duration: 55, yoyo: true, repeat: 3 });
      this.guide.say('¡Casi! Piensa otra vez y prueba otra opción.', 'wow');
      return;
    }
    this.busy = true;
    audio.sfx('success');
    this.sparks.explode(26, button.x, button.y);
    floatReward(this, button.x - 110, button.y - 90, `+${result.xp}`, 'ic-star', 0xf9a825);
    this.time.delayedCall(180, () => { audio.sfx('coin'); floatReward(this, button.x + 110, button.y - 90, `+${result.coins}`, 'ic-coin'); });
    this.hud.update(this.round);
    this.env.setClean(this.setup.cleanStart + (this.setup.cleanGain * this.round.index) / this.round.total, true);
    this.guide.character.hop(40);
    this.guide.say(result.firstTry ? '¡Muy bien pensado!' : '¡Ahora sí! Lo lograste.', 'happy');

    // Solo queda a la vista la opción correcta; debajo aparece la explicación.
    this.options.forEach((b, k) => { if (k !== i) b.destroy(); else b.enabled = false; });
    this.focus.items = this.focus.items.filter((x) => x.active);
    this.tweens.add({ targets: button, x: CX, y: 690, duration: 260, ease: 'Sine.out' });
    this.showExplanation(this.explanation(result.item), result.finished);
  }

  explanation(item) {
    if (item.type === 'quiz') return item.question.explain;
    const right = getBin(item.waste.bin);
    return item.answer === 0 ? `Sí. ${item.waste.why}` : `No: va en la caneca ${right.name.toLowerCase()}. ${item.waste.why}`;
  }

  showExplanation(text, finished) {
    const g = this.keep(panel(this, CX, 915, 1400, 210, { radius: 50, stroke: theme.c.green, strokeWidth: 8 }));
    const t = this.keep(label(this, CX - 660, 915, text, { size: 38, bold: false, origin: [0, 0.5], wrap: 940, lineSpacing: 6 }));
    for (const o of [g, t]) { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 250, delay: 200 }); }
    this.nextBtn = new Button(this, CX + 500, 915, {
      label: finished ? '¡Listo!' : 'Seguir', icon: finished ? 'ic-check' : 'ic-next', width: 340, height: 120, fontSize: 50, color: theme.c.orange,
      onClick: () => this.advance(),
    });
    this.focus.focus(this.nextBtn);
  }

  advance() {
    if (!this.nextBtn || this._leaving) return;
    if (this.round.finished) finishMission(this, this.setup, this.round);
    else this.showItem();
  }

  exit() {
    goTo(this, 'MissionIntro', { worldId: this.setup.world.id });
  }
}
