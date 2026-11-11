// Jefe final (nivel 5 de cada mundo). Es el juego de clasificación con un
// rival: el jefe lanza los residuos, cada acierto le quita vida y, cada cierto
// tiempo, usa un ataque especial que obliga a fijarse mejor.
// Los errores cuestan un escudo (los exploradores no pierden escudos). Sin
// escudos, el jefe escapa y se puede reintentar: nunca se pierde progreso.
import { W, H, theme } from '../config/theme.js';
import { Button, label, panel, chip, toast } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { goTo } from '../core/Navigation.js';
import { audio } from '../core/AudioManager.js';
import { SortingScene } from './SortingScene.js';
import { ATTACKS, RUSH_SECONDS, attackFor, shieldsFor } from '../game/bosses.js';

const BOSS_POS = { x: 1470, y: 520 };

export class BossScene extends SortingScene {
  constructor() { super('Boss'); }

  missionKind() { return 'boss'; }
  get home() { return { x: 960, y: 345 }; }
  spawnFrom() { return { x: BOSS_POS.x, y: BOSS_POS.y - 170, scale: 0.3 }; } // el jefe lanza el residuo
  hudOptions() {
    const name = this.setup.boss.name;
    return { life: true, format: (round) => (round.finished ? `¡${name} fue derrotado!` : `${name}: ${round.total - round.index} de vida`) };
  }

  setupExtras() {
    const boss = this.setup.boss;
    this.boss = boss;
    this.bossChar = new Character(this, BOSS_POS.x, BOSS_POS.y, boss.sprite, { scale: 0.5, expr: 'sneaky' }).setDepth(30);
    this.tweens.add({ targets: this.bossChar, y: BOSS_POS.y - 16, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.shields = shieldsFor(this.setup.mode);
    this.shieldChip = Number.isFinite(this.shields) ? chip(this, 370, 100, 'ic-escudo', this.shields, { width: 210, tint: theme.c.green }) : null;
    this.seenAttacks = new Set();
    this.escaped = false;
    this.rush = null;
    this.rushChip = chip(this, 370, 196, 'ic-clock', RUSH_SECONDS, { width: 210, tint: theme.c.red }).setVisible(false);
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.tickRush() });
    this.time.delayedCall(2300, () => toast(this, `${boss.name}: «${boss.taunt}»`, { who: boss.sprite, duration: 3200 }));
  }

  // ---- Ataques especiales: se aplican cuando el residuo ya está en su sitio.
  afterLanding() {
    const attack = attackFor(this.world.id, this.round.index, this.setup.mode);
    if (!attack) { this.ready(); return; }
    this.announce(attack);
    if (attack === 'shuffle') { this.shuffleBins(() => this.ready()); return; }
    if (attack === 'smoke') for (const b of this.bins) b.setSmoke(true);
    if (attack === 'ink') this.inkWaste();
    if (attack === 'rush') { this.rush = RUSH_SECONDS; this.rushChip.setVisible(true).valueText.setText(String(RUSH_SECONDS)); }
    if (attack === 'lie') this.lie();
    this.ready();
  }

  announce(attack) {
    const info = ATTACKS[attack];
    audio.sfx('locked');
    this.bossChar.talk('sneaky', 700);
    const t = label(this, BOSS_POS.x, BOSS_POS.y - 300, `¡${info.name}!`, { size: 58, color: '#FFD23F', stroke: '#17324D', strokeThickness: 14 }).setDepth(80).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.out' });
    this.tweens.add({ targets: t, alpha: 0, duration: 400, delay: 1500, onComplete: () => t.destroy() });
    // La primera vez, el guía explica cómo superar el truco.
    if (!this.seenAttacks.has(attack)) { this.seenAttacks.add(attack); this.say(info.tip, 'wow'); }
  }

  // Revolcón: dos canecas cambian de sitio.
  shuffleBins(done) {
    const active = this.bins.filter((b) => this.activeBins.includes(b.bin.id));
    const i = Math.floor(Math.random() * active.length);
    const a = active[i], b = active[(i + 1 + Math.floor(Math.random() * (active.length - 1))) % active.length];
    const ax = a.x, bx = b.x;
    this.tweens.add({ targets: a, x: bx, duration: 480, ease: 'Sine.inOut' });
    this.tweens.add({ targets: b, x: ax, duration: 480, ease: 'Sine.inOut', onComplete: done });
  }

  // Chorro de tinta: el residuo queda manchado hasta que se toca.
  inkWaste() {
    const w = this.waste;
    w.inked = true;
    w.img.setTintFill(0x1b1b3a);
    this.nameText.setText('¿Qué será?');
    w.once('pointerdown', () => this.cleanInk());
  }

  cleanInk() {
    const w = this.waste;
    if (!w || !w.inked) return;
    w.inked = false;
    w.img.clearTint();
    this.nameText.setText(this.round.current.name);
    audio.sfx('pop');
    this.sparks.explode(10, w.x, w.y);
  }

  // Si el residuo está manchado, lo primero es limpiarlo (también con teclado o tocando una caneca).
  interceptChoice() {
    if (this.waste && this.waste.inked) { this.cleanInk(); return true; }
    return false;
  }

  // Mentira: el jefe hace brillar una caneca equivocada.
  lie() {
    const wrong = this.bins.filter((b) => this.activeBins.includes(b.bin.id) && b.bin.id !== this.round.current.bin);
    const bin = wrong[Math.floor(Math.random() * wrong.length)];
    bin.setHint(true);
    toast(this, `${this.boss.name}: «¡Esa va en la caneca ${bin.bin.name.toLowerCase()}!»`, { who: this.boss.sprite, duration: 3000 });
  }

  // Avalancha: contrarreloj para este residuo. El reloj solo corre mientras se puede responder.
  tickRush() {
    if (this.rush === null || this.busy || this.escaped) return;
    this.rush = Math.max(0, this.rush - 0.25);
    this.rushChip.valueText.setText(String(Math.ceil(this.rush)));
    if (this.rush > 0) return;
    this.bossChar.talk('happy', 900);
    audio.sfx('oops');
    this.loseShield();
    if (this.escaped) { this.showEscape(); return; }
    this.rush = RUSH_SECONDS;
    this.say('¡Se acabó el tiempo! Respira y vuelve a intentarlo.', 'wow');
  }

  loseShield() {
    if (!Number.isFinite(this.shields)) return; // los exploradores no pierden escudos
    this.shields = Math.max(0, this.shields - 1);
    this.shieldChip.valueText.setText(String(this.shields));
    this.tweens.add({ targets: this.shieldChip, scale: { from: 1.3, to: 1 }, duration: 300 });
    if (this.shields === 0) this.escaped = true;
  }

  afterCorrect(result, bin) {
    for (const b of this.bins) b.setSmoke(false);
    this.rush = null;
    this.rushChip.setVisible(false);
    // Una estrella sale de la caneca y golpea al jefe.
    const star = this.add.image(bin.mouth.x, bin.mouth.y, 'ic-star').setDisplaySize(90, 90).setTint(0xffd23f).setDepth(75);
    this.tweens.add({
      targets: star, x: BOSS_POS.x, y: BOSS_POS.y - 180, angle: 360, duration: 380, ease: 'Quad.in',
      onComplete: () => {
        star.destroy();
        this.sparks.explode(20, BOSS_POS.x, BOSS_POS.y - 180);
        this.bossChar.setExpression('oops');
        this.bossChar.sprite.setTintFill(0xffffff);
        this.time.delayedCall(110, () => this.bossChar.active && this.bossChar.sprite.clearTint());
        this.tweens.add({ targets: this.bossChar, x: BOSS_POS.x + 18, duration: 50, yoyo: true, repeat: 4 });
        if (result.finished) this.defeat();
        else this.time.delayedCall(800, () => this.bossChar.active && this.bossChar.setExpression('sneaky'));
      },
    });
  }

  defeat() {
    audio.sfx('fanfare');
    this.say(`¡Derrotaste a ${this.boss.name}! El mundo vuelve a respirar.`, 'happy');
    this.tweens.killTweensOf(this.bossChar);
    this.tweens.add({ targets: this.bossChar, angle: 720, scale: 0, alpha: 0.4, duration: 1300, ease: 'Cubic.in' });
    this.time.addEvent({ delay: 220, repeat: 4, callback: () => this.sparks.explode(18, BOSS_POS.x - 80 + Math.random() * 160, BOSS_POS.y - 260 + Math.random() * 200) });
  }

  afterWrong(result) {
    this.bossChar.talk('happy', 900);
    if (!result.forgiven) this.loseShield();
  }

  // Tras la explicación: si no quedan escudos, el jefe escapa.
  afterExplain() {
    if (!this.escaped) return false;
    this.showEscape();
    return true;
  }

  showEscape() {
    this.busy = true;
    this.setBinsEnabled(false);
    this.focus.clear();
    if (this.idle) { this.idle.remove(); this.idle = null; }
    this.tweens.killTweensOf(this.bossChar);
    this.tweens.add({ targets: this.bossChar, x: W + 400, duration: 700, ease: 'Back.in' });
    const c = this.add.container(0, 0).setDepth(300);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b2e1c, 0.6).setInteractive());
    c.add(panel(this, W / 2, H / 2, 1200, 640, { radius: 70 }));
    c.add(this.add.image(W / 2 - 400, H / 2 - 20, `${this.boss.sprite}-happy`).setDisplaySize(300, 345));
    c.add(label(this, W / 2 + 150, H / 2 - 210, `¡${this.boss.name} se escapó!`, { size: 64, color: theme.hex.orange, stroke: '#17324D', strokeThickness: 10 }));
    c.add(label(this, W / 2 + 150, H / 2 - 50, 'No pasa nada: ya conoces sus trucos.\nRecupera tus escudos y vuelve a intentarlo.', { size: 38, bold: false, wrap: 760, lineSpacing: 8 }));
    const retry = new Button(this, W / 2 + 320, H / 2 + 190, { label: 'Reintentar', icon: 'ic-play', width: 440, height: 124, fontSize: 52, color: theme.c.orange, onClick: () => goTo(this, 'Boss', this.setup.data) });
    const back = new Button(this, W / 2 - 110, H / 2 + 190, { label: 'Niveles', icon: 'ic-back', width: 320, height: 110, fontSize: 44, color: theme.c.greenDark, onClick: () => this.exit() });
    c.add([back, retry]);
    this.focus.focus(retry);
  }
}
