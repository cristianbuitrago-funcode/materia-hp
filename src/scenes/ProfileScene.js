// Creación del perfil de prueba: rango de edad, avatar y apodo generado.
// No se pide ningún dato personal.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { drawMeadow } from '../art/backgrounds.js';
import { Button, label, panel } from '../ui/widgets.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { AGE_MODES } from '../config/ageModes.js';
import { AVATARS, randomNickname } from '../config/avatars.js';
import { audio } from '../core/AudioManager.js';

export class ProfileScene extends Phaser.Scene {
  constructor() { super('Profile'); }

  create() {
    enterScene(this);
    drawMeadow(this, { sun: false, clouds: 3 });
    this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.25);
    this.choice = { ageMode: null, avatar: AVATARS[0].id, nickname: randomNickname() };
    this.stepAge = this.buildAgeStep();
    this.stepAvatar = this.buildAvatarStep().setVisible(false);
  }

  heading(container, text) {
    container.add(label(this, W / 2, 110, text, { size: 84, color: '#FFFFFF', stroke: '#14804A', strokeThickness: 20 }));
  }

  buildAgeStep() {
    const c = this.add.container(0, 0);
    this.heading(c, '¿Cuántos años tienes?');
    AGE_MODES.forEach((mode, i) => {
      const card = new Button(this, 380 + i * 580, 590, { width: 500, height: 640, color: mode.color, radius: 60, onClick: () => this.pickAge(mode.id) });
      const f = card.face;
      f.add(this.add.circle(0, -170, 110, 0xffffff, 0.25));
      f.add(this.add.image(0, -170, mode.icon).setDisplaySize(150, 150));
      f.add(label(this, 0, -10, mode.name, { size: 56, color: '#FFFFFF' }));
      f.add(label(this, 0, 70, mode.ages, { size: 60, color: '#FFF3B0' }));
      for (let s = 0; s < 3; s++) {
        f.add(this.add.image(-70 + s * 70, 150, 'ic-star').setDisplaySize(56, 56).setTint(s < mode.stars ? 0xffd23f : 0x000000).setAlpha(s < mode.stars ? 1 : 0.25));
      }
      f.add(label(this, 0, 245, mode.description, { size: 34, color: '#FFFFFF', bold: false }));
      c.add(card);
    });
    return c;
  }

  buildAvatarStep() {
    const c = this.add.container(0, 0);
    this.heading(c, 'Elige tu guardián');
    this.avatarButtons = AVATARS.map((a, i) => {
      const b = new Button(this, 420 + i * 360, 400, { width: 300, height: 320, color: theme.c.cream, radius: 60, sound: 'pop', onClick: () => this.pickAvatar(a.id) });
      b.face.add(this.add.image(0, -24, `avatar-${a.id}`).setDisplaySize(220, 220));
      b.face.add(label(this, 0, 122, a.name, { size: 32 }));
      b.mark = this.add.container(110, -130, [this.add.circle(0, 0, 40, theme.c.green).setStrokeStyle(6, 0xffffff), this.add.image(0, 0, 'ic-check').setDisplaySize(46, 46)]);
      b.face.add(b.mark);
      c.add(b);
      return { id: a.id, button: b };
    });

    c.add(panel(this, W / 2, 740, 1100, 190, { radius: 60 }));
    c.add(label(this, W / 2 - 80, 690, 'Tu apodo secreto de guardián', { size: 34, color: theme.hex.grey }));
    this.nickText = label(this, W / 2 - 80, 762, this.choice.nickname, { size: 72, color: theme.hex.greenDark });
    c.add(this.nickText);
    c.add(new Button(this, W / 2 + 430, 740, { icon: 'ic-dice', width: 130, height: 130, color: theme.c.orange, radius: 50, sound: 'pop', onClick: () => this.rollNickname() }));

    c.add(new Button(this, 300, 960, { label: 'Atrás', icon: 'ic-back', width: 320, height: 110, color: theme.c.greenDark, onClick: () => this.showStep('age') }));
    c.add(new Button(this, W - 340, 960, { label: '¡Listo!', icon: 'ic-check', width: 400, height: 120, fontSize: 60, color: theme.c.orange, onClick: () => this.done() }));
    this.refreshAvatars();
    return c;
  }

  showStep(step) {
    this.focus.clear();
    this.stepAge.setVisible(step === 'age');
    this.stepAvatar.setVisible(step === 'avatar');
    const shown = step === 'age' ? this.stepAge : this.stepAvatar;
    shown.setAlpha(0);
    this.tweens.add({ targets: shown, alpha: 1, duration: 250 });
  }

  pickAge(id) {
    this.choice.ageMode = id;
    this.showStep('avatar');
  }

  pickAvatar(id) {
    this.choice.avatar = id;
    this.refreshAvatars();
  }

  refreshAvatars() {
    for (const { id, button } of this.avatarButtons) {
      const on = id === this.choice.avatar;
      button.mark.setVisible(on);
      button.face.setAlpha(on ? 1 : 0.8);
      if (on) this.tweens.add({ targets: button.face, scale: { from: 0.9, to: 1 }, duration: 260, ease: 'Back.out' });
    }
  }

  rollNickname() {
    let next = this.choice.nickname;
    while (next === this.choice.nickname) next = randomNickname();
    this.choice.nickname = next;
    this.nickText.setText(next);
    this.tweens.add({ targets: this.nickText, scale: { from: 0.7, to: 1 }, duration: 260, ease: 'Back.out' });
  }

  done() {
    gameState.createProfile(this.choice);
    audio.sfx('success');
    goTo(this, 'WorldMap');
  }
}
