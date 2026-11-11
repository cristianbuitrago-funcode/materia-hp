// Juego de clasificación (Sorting Game): un residuo a la vez y tres canecas.
// Se juega arrastrando, tocando la caneca o con teclado (flechas/Tab + Enter, o teclas 1, 2 y 3).
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { Button, label, panel, chip } from '../ui/widgets.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { audio } from '../core/AudioManager.js';
import { buildWorld } from '../worlds/index.js';
import { BINS, getBin } from '../game/bins.js';
import { BinTarget } from '../game/BinTarget.js';
import { SortingRound, buildRound } from '../game/SortingEngine.js';
import { prepareMission, openingLine, createHud, createGuide, createSparks, floatReward, finishMission } from '../game/missionUi.js';

const HOME = { x: 1020, y: 335 };
const BIN_X = [600, 1020, 1440];
const WASTE_SIZE = 250;

export class SortingScene extends Phaser.Scene {
  constructor() { super('Sorting'); }

  create(data) {
    const setup = prepareMission(data);
    if (!setup || setup.mission.kind !== 'sort') { this.scene.start('WorldMap'); return; }
    enterScene(this);
    this.setup = setup;
    this.world = setup.world;
    const { mission, rules } = setup;
    this.activeBins = mission.bins || BINS.map((b) => b.id);
    this.round = new SortingRound(
      buildRound(rules, Math.random, setup.pick),
      { hintAfter: rules.hintAfter },
    );
    this.busy = true;
    this.waste = null;
    this.nameText = null;
    this.idle = null;
    this.dragging = false;
    this.pendingHint = false;
    this.prevFocus = null;

    // El escenario empieza tan limpio como lo dejó el jugador y se limpia más con cada acierto.
    this.env = buildWorld(this, this.world.id, setup.cleanStart);
    audio.setTheme(this.world.id);
    audio.startMusic();

    this.hud = createHud(this, { unit: 'Residuo', onBack: () => this.exit() });
    this.hud.update(this.round);
    this.bins = BINS.map((bin, i) => new BinTarget(this, BIN_X[i], 800, bin, (id) => this.choose(id)));
    // En misiones de dos canecas, la que no participa queda apagada.
    for (const b of this.bins) if (!this.activeBins.includes(b.bin.id)) { b.enabled = false; b.setAlpha(0.3); }
    this.guide = createGuide(this);
    this.addExplainPanel();
    this.sparks = createSparks(this);
    if (setup.timed) this.addTimer();

    // Atajos: teclas 1, 2 y 3 eligen la caneca blanca, negra y verde.
    this.input.keyboard.on('keydown', (e) => {
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i >= 0) this.bins[i].activate();
    });
    this.onCancel = () => this.exit();

    this.say(openingLine(setup), 'happy');
    this.time.delayedCall(450, () => this.spawnWaste());
  }

  say(text, expr = 'happy') {
    this.guide.say(text, expr);
  }

  // Reto contrarreloj opcional: terminar a tiempo da un bono; si se acaba el tiempo, no pasa nada.
  addTimer() {
    this.timeLeft = this.round.total * 7;
    this.timerChip = chip(this, 370, 100, 'ic-clock', this.timeLeft, { width: 210, tint: theme.c.ink });
    this.time.addEvent({
      delay: 250, loop: true,
      callback: () => {
        // El reloj solo corre mientras el jugador puede responder (no durante animaciones ni explicaciones).
        if (this.busy || this.timeLeft <= 0 || this.round.finished) return;
        this.timeLeft = Math.max(0, this.timeLeft - 0.25);
        this.timerChip.valueText.setText(String(Math.ceil(this.timeLeft)));
        if (this.timeLeft === 0) {
          this.timerChip.setAlpha(0.5);
          this.say('Se acabó el tiempo del bono. ¡No pasa nada! Sigue con calma.', 'happy');
        }
      },
    });
  }

  // Ventana de explicación cuando hay un error: sin castigo, se explica y se reintenta.
  addExplainPanel() {
    const c = this.add.container(0, 0).setDepth(200).setVisible(false);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x0b2e1c, 0.55).setInteractive();
    const box = this.add.container(W / 2, H / 2);
    box.add(panel(this, 0, 0, 1220, 740, { radius: 70 }));
    box.add(this.add.image(-410, 30, 'reciclin-wow').setDisplaySize(330, 380));
    box.add(label(this, 150, -285, '¡Casi! Pensemos juntos', { size: 60, color: theme.hex.orange, stroke: '#17324D', strokeThickness: 10 }));
    this.explainImage = this.add.image(150, -170, 'waste-botella').setDisplaySize(130, 130);
    this.explainName = label(this, 150, -75, '', { size: 40 });
    this.explainText = label(this, 150, -40, '', { size: 38, bold: false, wrap: 760, lineSpacing: 6, origin: [0.5, 0] });
    this.explainBtn = new Button(this, 150, 270, { label: 'Intentar otra vez', icon: 'ic-check', width: 560, height: 116, fontSize: 48, color: theme.c.orange, onClick: () => this.closeExplain() });
    box.add([this.explainImage, this.explainName, this.explainText, this.explainBtn]);
    c.add([dim, box]);
    this.explain = c;
    this.explainBox = box;
  }

  setBinsEnabled(on) {
    for (const b of this.bins) b.enabled = on && this.activeBins.includes(b.bin.id);
  }

  spawnWaste() {
    const w = this.round.current;
    this.hud.update(this.round);
    const c = this.add.container(HOME.x, -200).setDepth(50);
    const halo = this.add.circle(0, 0, 170, 0xffffff, 0.4);
    const img = this.add.image(0, 0, `waste-${w.id}`).setDisplaySize(WASTE_SIZE, WASTE_SIZE);
    c.add([halo, img]);
    c.halo = halo;
    c.setSize(WASTE_SIZE + 60, WASTE_SIZE + 60);
    c.setInteractive({ draggable: true, useHandCursor: true });
    c.on('dragstart', () => {
      if (this.busy) return;
      this.dragging = true;
      audio.sfx('pick');
      if (this.idle) this.idle.pause();
      this.tweens.add({ targets: c, scale: 1.12, duration: 100 });
    });
    c.on('drag', (pointer, x, y) => {
      if (!this.dragging) return;
      c.setPosition(x, y);
      for (const b of this.bins) b.setHover(b.contains(x, y));
    });
    c.on('dragend', () => {
      if (!this.dragging) return;
      this.dragging = false;
      const target = this.bins.find((b) => b.contains(c.x, c.y));
      for (const b of this.bins) b.setHover(false);
      if (target) this.choose(target.bin.id);
      else this.returnHome();
    });
    this.waste = c;
    if (this.nameText) this.nameText.destroy();
    this.nameText = label(this, HOME.x, HOME.y + 175, w.name, { size: 50, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 12 }).setDepth(40).setAlpha(0);
    this.tweens.add({ targets: this.nameText, alpha: 1, duration: 300, delay: 250 });
    audio.sfx('pop');
    this.tweens.add({
      targets: c, y: HOME.y, duration: 520, ease: 'Bounce.out',
      onComplete: () => { this.busy = false; this.setBinsEnabled(true); this.startIdle(); },
    });
  }

  // El residuo flota suavemente mientras espera.
  startIdle() {
    if (this.idle) this.idle.remove();
    if (!this.waste) return;
    this.idle = this.tweens.add({ targets: this.waste, y: HOME.y - 14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  returnHome(onDone = null) {
    if (this.idle) { this.idle.remove(); this.idle = null; }
    this.tweens.add({
      targets: this.waste, x: HOME.x, y: HOME.y, scale: 1, alpha: 1, duration: 320, ease: 'Back.out',
      onComplete: () => { if (onDone) onDone(); else this.startIdle(); },
    });
  }

  choose(binId) {
    if (this.busy || this._leaving || !this.waste) return;
    this.busy = true;
    this.dragging = false;
    this.setBinsEnabled(false);
    if (this.idle) { this.idle.remove(); this.idle = null; }
    for (const b of this.bins) b.setHint(false);
    const result = this.round.attempt(binId);
    const bin = this.bins.find((b) => b.bin.id === binId);
    const waste = this.waste;
    audio.sfx('drop');
    // El residuo vuela en arco hasta la boca de la caneca.
    this.tweens.add({ targets: waste, x: bin.mouth.x, duration: 340, ease: 'Sine.inOut' });
    this.tweens.add({
      targets: waste, y: bin.mouth.y, scale: 0.45, duration: 340, ease: 'Back.in',
      onComplete: () => (result.correct ? this.onCorrect(result, bin) : this.onWrong(result, bin)),
    });
  }

  onCorrect(result, bin) {
    this.waste.destroy();
    this.waste = null;
    this.nameText.destroy();
    this.nameText = null;
    bin.react(true);
    audio.sfx('success');
    this.sparks.explode(26, bin.mouth.x, bin.mouth.y + 40);
    floatReward(this, bin.mouth.x - 90, bin.mouth.y - 40, `+${result.xp}`, 'ic-star', 0xf9a825);
    this.time.delayedCall(180, () => { audio.sfx('coin'); floatReward(this, bin.mouth.x + 90, bin.mouth.y - 40, `+${result.coins}`, 'ic-coin'); });
    this.hud.update(this.round);
    this.env.setClean(this.setup.cleanStart + (this.setup.cleanGain * this.round.index) / this.round.total, true);
    this.guide.character.hop(40);
    this.say(`${result.firstTry ? '¡Muy bien!' : '¡Lo lograste!'} ${result.waste.fact}`, 'happy');
    this.time.delayedCall(result.finished ? 1900 : 2500, () => (result.finished ? this.finishRound() : this.spawnWaste()));
  }

  onWrong(result, bin) {
    bin.react(false);
    audio.sfx('oops');
    this.pendingHint = result.showHint;
    this.returnHome(() => {
      this.explainImage.setTexture(`waste-${result.waste.id}`).setDisplaySize(130, 130);
      this.explainName.setText(result.waste.name);
      this.explainText.setText(`No va en la caneca ${getBin(result.chosen).name.toLowerCase()}.\n${result.waste.why}`);
      this.explain.setVisible(true);
      this.explainBox.setScale(0.7);
      this.tweens.add({ targets: this.explainBox, scale: 1, duration: 260, ease: 'Back.out' });
      this.prevFocus = this.focus.current;
      this.focus.focus(this.explainBtn);
    });
  }

  closeExplain() {
    if (!this.explain.visible) return;
    this.explain.setVisible(false);
    this.focus.focus(this.prevFocus instanceof BinTarget ? this.prevFocus : null); // quien juega con teclado sigue donde estaba
    this.busy = false;
    this.setBinsEnabled(true);
    this.startIdle();
    if (this.pendingHint) {
      this.bins.find((b) => b.bin.id === this.round.current.bin).setHint(true);
      this.say('Te ayudo: mira la caneca que brilla.', 'happy');
    } else {
      this.say('¡Tú puedes! Piensa de qué está hecho y si está limpio.', 'happy');
    }
  }

  finishRound() {
    if (this.setup.timed && this.timeLeft > 0) this.round.grantTimeBonus();
    finishMission(this, this.setup, this.round);
  }

  exit() {
    goTo(this, 'MissionIntro', { worldId: this.world.id });
  }
}
