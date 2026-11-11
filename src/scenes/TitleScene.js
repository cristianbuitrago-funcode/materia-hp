// Pantalla de inicio animada.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { drawMeadow } from '../art/backgrounds.js';
import { Button, label } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { enterScene, goTo, openOverlay } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { audio } from '../core/AudioManager.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    enterScene(this);
    drawMeadow(this);

    // Hojas que caen con el viento.
    this.add.particles(0, 0, 'leaf', {
      x: { min: 0, max: W }, y: -30, lifespan: 11000, frequency: 650,
      speedY: { min: 70, max: 130 }, speedX: { min: -50, max: 50 },
      rotate: { start: 0, end: 360 }, scale: { min: 0.6, max: 1.2 }, alpha: { start: 0.9, end: 0.5 },
    });

    // CONTAMINATOR espía desde la esquina.
    const villain = new Character(this, 1790, H + 330, 'contaminator', { scale: 0.75, expr: 'sneaky' });
    villain.shadow.setVisible(false);
    this.tweens.add({ targets: villain, y: H + 110, duration: 1400, delay: 1800, hold: 2600, repeatDelay: 4200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const eco = new Character(this, 330, 990, 'eco', { scale: 1.05 });
    this.tweens.add({ targets: eco, angle: { from: -3, to: 3 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const reciclin = new Character(this, 1560, 1000, 'reciclin', { scale: 0.85 });
    this.time.addEvent({ delay: 3400, loop: true, callback: () => reciclin.hop(50) });

    // Logotipo
    const logo = this.add.container(W / 2, 230);
    const title = label(this, 0, 0, 'EcoMisión', { size: 220, color: '#FFFFFF', stroke: '#14804A', strokeThickness: 34 });
    title.setShadow(0, 14, '#0B5A33', 0, true, false);
    const sub = label(this, 0, 150, 'Guardianes del Planeta', { size: 76, color: '#FFD23F', stroke: '#17324D', strokeThickness: 16 });
    logo.add([title, sub]);
    logo.setScale(0);
    this.tweens.add({ targets: logo, scale: 1, duration: 700, ease: 'Back.out', delay: 150 });
    this.tweens.add({ targets: logo, y: 244, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 900 });

    const play = new Button(this, W / 2, 610, {
      label: gameState.hasProfile ? '¡Continuar!' : '¡Jugar!', icon: 'ic-play', width: 520, height: 150, fontSize: 78,
      color: theme.c.orange, radius: 60, onClick: () => this.play(),
    });
    this.tweens.add({ targets: play, scale: 1.04, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    new Button(this, W / 2, 800, {
      label: 'Ingresar', icon: 'ic-user', width: 440, height: 104, color: theme.c.blue,
      onClick: () => goTo(this, 'ComingSoon', { title: 'Ingresar o registrarse', icon: 'ic-user', phase: 6, from: 'Title',
        text: 'Aquí un adulto podrá crear la cuenta para guardar tu progreso en la nube.' }),
    });
    new Button(this, W / 2, 930, {
      label: 'Padres y docentes', icon: 'ic-family', width: 520, height: 96, fontSize: 40, color: theme.c.purple,
      onClick: () => goTo(this, 'ComingSoon', { title: 'Padres y docentes', icon: 'ic-family', phase: 7, from: 'Title',
        text: 'Aquí los adultos verán lo que cada guardián ha aprendido.' }),
    });
    new Button(this, W - 100, 100, { icon: 'ic-gear', width: 120, height: 120, color: theme.c.greenDark, radius: 60, onClick: () => openOverlay(this, 'Settings') });

    label(this, W / 2, H - 34, 'Modo de prueba: juega sin registro y sin datos personales', { size: 30, color: '#FFFFFF', stroke: '#14804A', strokeThickness: 8 });
    this.onDefaultAction = () => this.play();
  }

  play() {
    audio.startMusic();
    if (gameState.hasProfile) goTo(this, 'WorldMap');
    else if (gameState.data.storySeen) goTo(this, 'Profile');
    else goTo(this, 'Story');
  }
}
