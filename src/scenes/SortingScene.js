// Juego de clasificación (Sorting Game): un residuo a la vez y tres canecas.
// Se juega arrastrando, tocando la caneca o con teclado (flechas/Tab + Enter, o teclas 1, 2 y 3).
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { Button, label, panel, chip } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { enterScene, goTo, openOverlay } from '../core/Navigation.js';
import { gameState, CLEAN_PER_ROUND } from '../core/GameState.js';
import { buildWorld } from '../worlds/index.js';
import { audio } from '../core/AudioManager.js';
import { getWorld } from '../config/worlds.js';
import { BINS, getBin } from '../game/bins.js';
import { BinTarget } from '../game/BinTarget.js';
import { SortingRound, buildRound, ROUND_RULES } from '../game/SortingEngine.js';

const HOME = { x: 1020, y: 335 };
const BIN_X = [600, 1020, 1440];
const WASTE_SIZE = 250;

export class SortingScene extends Phaser.Scene {
  constructor() { super('Sorting'); }

  create(data) {
    const world = getWorld(data.worldId);
    if (!gameState.hasProfile || !world || !gameState.isWorldUnlocked(world.id)) { this.scene.start('WorldMap'); return; }
    enterScene(this);
    this.world = world;
    const mode = gameState.profile.ageMode;
    this.round = new SortingRound(buildRound(mode, Math.random, world.wastes), { hintAfter: ROUND_RULES[mode].hintAfter });
    this.busy = true;
    this.waste = null;
    this.nameText = null;
    this.idle = null;
    this.dragging = false;
    this.pendingHint = false;
    this.prevFocus = null;

    // El escenario empieza tan limpio como lo dejó el jugador y se limpia más con cada acierto.
    this.cleanStart = gameState.worldProgress(world.id).clean;
    this.cleanGain = Math.min(1, this.cleanStart + CLEAN_PER_ROUND) - this.cleanStart;
    this.env = buildWorld(this, world.id, this.cleanStart);
    audio.setTheme(world.id);
    audio.startMusic();

    this.addHud();
    this.bins = BINS.map((bin, i) => new BinTarget(this, BIN_X[i], 800, bin, (id) => this.choose(id)));
    this.addGuide();
    this.addExplainPanel();

    this.sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 180, max: 520 }, angle: { min: 200, max: 340 }, gravityY: 900, lifespan: 900,
      scale: { start: 0.9, end: 0 }, tint: [0xffd23f, 0x2bb673, 0xff8a3d, 0x5cc8f5, 0xffffff], emitting: false,
    }).setDepth(60);

    // Atajos: teclas 1, 2 y 3 eligen la caneca blanca, negra y verde.
    this.input.keyboard.on('keydown', (e) => {
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i >= 0) this.bins[i].activate();
    });
    this.onCancel = () => this.exit();

    this.say('¡Arrastra cada residuo a su caneca! También puedes tocar la caneca.', 'happy');
    this.time.delayedCall(450, () => this.spawnWaste());
  }

  addHud() {
    new Button(this, 110, 100, { icon: 'ic-back', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: () => this.exit() });
    panel(this, W / 2, 100, 760, 110, { radius: 55, strokeWidth: 5 });
    this.progressText = label(this, W / 2, 76, '', { size: 36 });
    this.progressBar = this.add.graphics();
    this.coinChip = chip(this, W - 340, 100, 'ic-coin', gameState.progress.ecoCoins, { width: 220 });
    new Button(this, W - 110, 100, { icon: 'ic-gear', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: () => openOverlay(this, 'Settings') });
    this.updateHud();
  }

  updateHud() {
    const done = this.round.index, total = this.round.total;
    this.progressText.setText(this.round.finished ? '¡Todo clasificado!' : `Residuo ${done + 1} de ${total}`);
    const x = W / 2 - 330, y = 108, w = 660, h = 26;
    const g = this.progressBar;
    g.clear();
    g.fillStyle(0xd9d2bd, 1); g.fillRoundedRect(x, y, w, h, 13);
    if (done > 0) { g.fillStyle(theme.c.green, 1); g.fillRoundedRect(x, y, Math.max(h, (w * done) / total), h, 13); }
    this.coinChip.valueText.setText(String(gameState.progress.ecoCoins + this.round.coins));
  }

  addGuide() {
    this.guide = new Character(this, 205, 1050, 'reciclin', { scale: 0.62 });
    const b = this.add.container(225, 400);
    const bg = panel(this, 0, 0, 410, 300, { radius: 50 });
    bg.fillStyle(theme.c.cream, 1); bg.fillTriangle(-60, 144, 20, 144, -40, 205);
    bg.lineStyle(6, theme.c.ink, 1); bg.lineBetween(-60, 152, -40, 205); bg.lineBetween(-40, 205, 20, 152);
    this.bubbleText = label(this, 0, 0, '', { size: 32, wrap: 360, lineSpacing: 4 });
    b.add([bg, this.bubbleText]);
    this.bubble = b;
  }

  // RECICLÍN dice algo en su globo (todo lo que dice queda escrito).
  say(text, expr = 'happy') {
    this.bubbleText.setText(text);
    this.guide.talk(expr, 900);
    this.tweens.add({ targets: this.bubble, scale: { from: 0.85, to: 1 }, duration: 220, ease: 'Back.out' });
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
    for (const b of this.bins) b.enabled = on;
  }

  spawnWaste() {
    const w = this.round.current;
    this.updateHud();
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
    this.floatReward(bin.mouth.x - 90, bin.mouth.y - 40, `+${result.xp}`, 'ic-star', 0xf9a825);
    this.time.delayedCall(180, () => { audio.sfx('coin'); this.floatReward(bin.mouth.x + 90, bin.mouth.y - 40, `+${result.coins}`, 'ic-coin'); });
    this.updateHud();
    this.env.setClean(this.cleanStart + (this.cleanGain * this.round.index) / this.round.total, true);
    this.guide.hop(40);
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

  floatReward(x, y, text, icon, tint = null) {
    const c = this.add.container(x, y).setDepth(70);
    const img = this.add.image(-46, 0, icon).setDisplaySize(60, 60);
    if (tint !== null) img.setTint(tint);
    c.add([img, label(this, 26, 0, text, { size: 56, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 12 })]);
    this.tweens.add({ targets: c, y: y - 150, alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Quad.out', onComplete: () => c.destroy() });
  }

  finishRound() {
    const summary = this.round.summary();
    const { leveledUp, level, unlockedWorld } = gameState.applyRoundResult(summary, this.world.id);
    goTo(this, 'Results', { worldId: this.world.id, summary, leveledUp, level, unlockedWorld });
  }

  exit() {
    goTo(this, 'MissionIntro', { worldId: this.world.id });
  }
}
