// Ajustes (ventana sobre la pantalla actual): música, sonidos y reinicio de la partida.
import Phaser from 'phaser';
import { W, H, theme } from '../config/theme.js';
import { Button, label, panel } from '../ui/widgets.js';
import { FocusManager } from '../ui/FocusManager.js';
import { closeOverlay } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { audio } from '../core/AudioManager.js';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(data) {
    this.parentKey = data.parent;
    this._leaving = false;
    this.focus = new FocusManager(this);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b2e1c, 0.6).setInteractive(); // bloquea los toques al fondo
    const box = this.add.container(W / 2, H / 2);
    box.add(panel(this, 0, 0, 900, 880, { radius: 70 }));
    box.add(label(this, 0, -340, 'Ajustes', { size: 80, color: theme.hex.greenDark }));
    box.setScale(0.6);
    this.tweens.add({ targets: box, scale: 1, duration: 300, ease: 'Back.out' });

    this.toggles = {};
    this.addToggle(box, -180, 'music', 'Música', 'ic-music');
    this.addToggle(box, -20, 'sfx', 'Sonidos', 'ic-sound');

    this.resetArmed = false;
    this.resetBtn = new Button(this, 0, 150, {
      label: 'Borrar mi partida', width: 620, height: 100, fontSize: 40, color: theme.c.red, onClick: () => this.reset(),
    });
    box.add(this.resetBtn);
    box.add(new Button(this, 0, 330, { label: 'Cerrar', icon: 'ic-check', width: 400, height: 110, color: theme.c.orange, onClick: () => this.close() }));
    this.onCancel = () => this.close();
  }

  addToggle(box, y, key, name, icon) {
    const draw = () => {
      const on = gameState.settings[key];
      if (this.toggles[key]) this.toggles[key].destroy();
      const b = new Button(this, 0, y, {
        label: `${name}: ${on ? 'SÍ' : 'NO'}`, icon, width: 620, height: 120, fontSize: 52,
        color: on ? theme.c.green : theme.c.grey,
        onClick: () => {
          gameState.setSetting(key, !on);
          if (key === 'music') audio.syncMusic();
          const focused = this.focus.current === b;
          this.focus.items = this.focus.items.filter((i) => i !== b);
          const nb = draw();
          if (focused) this.focus.focus(nb);
          audio.sfx('pop');
        },
      });
      box.add(b);
      this.toggles[key] = b;
      return b;
    };
    draw();
  }

  // Pide confirmación con un segundo toque para evitar borrados por accidente.
  reset() {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.resetBtn.text.setText('¿Seguro? Toca otra vez');
      this.time.delayedCall(4000, () => {
        if (this.resetBtn.active) { this.resetArmed = false; this.resetBtn.text.setText('Borrar mi partida'); }
      });
      return;
    }
    gameState.resetGame();
    this.scene.stop(this.parentKey);
    this.scene.start('Title');
  }

  close() {
    closeOverlay(this, this.parentKey);
  }
}
