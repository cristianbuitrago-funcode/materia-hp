// Tienda: personajes, accesorios y fondos que se desbloquean con monedas ecológicas.
// Comprar pide un segundo toque de confirmación. Sin dinero real ni premios al azar.
import Phaser from 'phaser';
import { theme } from '../config/theme.js';
import { Button, label, panel, toast } from '../ui/widgets.js';
import { openSection, Dynamic } from '../ui/section.js';
import { makeAvatar } from '../ui/avatar.js';
import { gameState } from '../core/GameState.js';
import { audio } from '../core/AudioManager.js';
import { ITEM_TYPES, itemsOfType, purchaseCheck, requirementText } from '../game/shop.js';

export class ShopScene extends Phaser.Scene {
  constructor() { super('Shop'); }

  create() {
    this.section = openSection(this, 'Tienda', 'Cambia tus monedas ecológicas por personajes, accesorios y fondos');
    this.dyn = new Dynamic(this);
    this.type = ITEM_TYPES[0].id;
    this.confirm = null;
    this.tabs = ITEM_TYPES.map((t, i) => new Button(this, 800 + i * 370, 262, {
      label: t.label, width: 350, height: 90, fontSize: 40, color: theme.c.orange, sound: 'pop',
      onClick: () => { this.type = t.id; this.confirm = null; this.render(); },
    }));
    panel(this, 300, 620, 480, 780, { radius: 60 });
    label(this, 300, 290, 'Así te ves', { size: 40, color: theme.hex.grey });
    this.render();
  }

  render() {
    this.dyn.clear();
    this.section.refreshCoins();
    const d = (o) => this.dyn.add(o);
    const p = gameState.profile;
    this.tabs.forEach((t, i) => t.setAlpha(ITEM_TYPES[i].id === this.type ? 1 : 0.55));
    d(makeAvatar(this, 300, 530, 340, p));
    d(label(this, 300, 770, p.nickname, { size: 48, wrap: 440 }));
    d(label(this, 300, 880, 'Toca algo tuyo para\nponértelo o quitártelo', { size: 28, bold: false, color: theme.hex.grey, lineSpacing: 2 }));

    const wallet = gameState.wallet();
    itemsOfType(this.type).forEach((item, i) => {
      const x = 740 + (i % 4) * 320, y = 510 + Math.floor(i / 4) * 350;
      const owned = gameState.owns(item.id), used = gameState.isEquipped(item.id);
      const check = owned ? null : purchaseCheck(item, wallet);
      const confirming = this.confirm === item.id;
      const card = d(new Button(this, x, y, {
        width: 300, height: 330, radius: 46, sound: owned || (check && check.ok) ? 'pop' : 'locked',
        color: used ? 0xc8f0d2 : confirming ? 0xffe9a8 : theme.c.cream,
        onClick: () => this.choose(item, owned, check),
      }));
      const f = card.face;
      // Vista previa: el elemento puesto sobre el retrato del jugador.
      const look = { avatar: item.type === 'character' ? item.id : p.avatar, accessory: item.type === 'accessory' ? item.id : null, frame: item.type === 'frame' ? item.id : p.frame };
      const preview = makeAvatar(this, 0, -62, 170, look, { withFrame: item.type === 'frame' });
      if (!owned && check && !check.ok && check.reason !== 'coins') preview.setAlpha(0.45);
      f.add(preview);
      f.add(label(this, 0, 52, item.name, { size: 30, wrap: 280 }));
      // Estado: en uso, tuyo, precio, o requisito pendiente.
      if (used) f.add(label(this, 0, 112, 'En uso', { size: 34, color: theme.hex.greenDark }));
      else if (owned) f.add(label(this, 0, 112, 'Usar', { size: 34, color: theme.hex.orange }));
      else if (confirming) f.add(label(this, 0, 112, `¿Comprar por ${item.price}?\nToca otra vez`, { size: 26, color: theme.hex.orange, lineSpacing: -2 }));
      else {
        const locked = check.reason === 'level' || check.reason === 'badge';
        f.add(this.add.image(-46, 100, 'ic-coin').setDisplaySize(48, 48));
        f.add(label(this, 12, 100, String(item.price), { size: 40, color: check.ok ? theme.hex.ink : theme.hex.grey }));
        if (item.requires) {
          f.add(label(this, 0, 140, requirementText(item), { size: 20, color: locked ? '#C62828' : theme.hex.greenDark, wrap: 280 }));
          if (locked) { f.add(this.add.circle(100, -120, 28, theme.c.ink, 0.85)); f.add(this.add.image(100, -120, 'ic-lock').setDisplaySize(34, 34)); }
        }
      }
    });
  }

  choose(item, owned, check) {
    if (owned) {
      gameState.equipItem(item.id);
      this.confirm = null;
      this.render();
      return;
    }
    if (!check.ok) {
      this.confirm = null;
      toast(this, check.message, { who: 'reciclin', duration: 3600 });
      this.render();
      return;
    }
    if (this.confirm !== item.id) { // primer toque: pedir confirmación
      this.confirm = item.id;
      this.render();
      return;
    }
    const result = gameState.buyItem(item.id);
    this.confirm = null;
    if (result.ok) {
      if (!gameState.isEquipped(item.id)) gameState.equipItem(item.id); // se estrena de una vez
      audio.sfx('success');
      toast(this, `¡${item.name} ya es tuyo!`, { who: 'eco' });
    }
    this.render();
  }
}
