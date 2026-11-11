// Habilidades: se ganan al derrotar al jefe de cada mundo.
import Phaser from 'phaser';
import { W, theme } from '../config/theme.js';
import { label, panel } from '../ui/widgets.js';
import { openSection } from '../ui/section.js';
import { gameState } from '../core/GameState.js';
import { ABILITIES, abilitySource } from '../game/abilities.js';
import { getBoss } from '../game/bosses.js';

export class AbilitiesScene extends Phaser.Scene {
  constructor() { super('Abilities'); }

  create() {
    const have = gameState.abilities();
    openSection(this, 'Habilidades', `Tienes ${have.length} de ${ABILITIES.length}. Derrota a los jefes para ganar más`);
    ABILITIES.forEach((a, i) => {
      const y = 300 + i * 158, on = have.includes(a.id);
      const world = abilitySource(a.id), boss = getBoss(world.id);
      panel(this, W / 2, y, 1640, 142, { radius: 50, fill: on ? theme.c.cream : 0xe7eaee, stroke: on ? a.color : theme.c.grey, strokeWidth: 7 });
      this.add.circle(W / 2 - 720, y, 56, on ? a.color : 0xb6bfc7).setStrokeStyle(6, 0xffffff);
      this.add.image(W / 2 - 720, y, a.icon).setDisplaySize(70, 70).setAlpha(on ? 1 : 0.6);
      label(this, W / 2 - 630, y - 30, a.name, { size: 42, origin: [0, 0.5], color: on ? theme.hex.ink : theme.hex.grey });
      label(this, W / 2 - 630, y + 26, a.desc, { size: 30, origin: [0, 0.5], bold: false, color: on ? theme.hex.ink : theme.hex.grey });
      label(this, W / 2 + 610, y - 26, on ? '¡Activa!' : `Derrota a ${boss.name}`, { size: 34, origin: [1, 0.5], color: on ? theme.hex.greenDark : theme.hex.orange });
      label(this, W / 2 + 610, y + 22, on ? (a.kind === 'active' ? 'Botón en cada nivel' : 'Funciona sola') : world.name, { size: 26, origin: [1, 0.5], bold: false, color: theme.hex.grey });
      const img = this.add.image(W / 2 + 720, y, `${boss.sprite}-${on ? 'oops' : 'sneaky'}`).setDisplaySize(104, 120);
      if (!on) img.setTintFill(0x9aa7b1).setAlpha(0.7);
    });
  }
}
