// Álbum ecológico: colección de los residuos aprendidos, con su caneca,
// la explicación y un dato curioso. Los que faltan aparecen como siluetas.
import Phaser from 'phaser';
import { theme } from '../config/theme.js';
import { Button, label, panel, toast } from '../ui/widgets.js';
import { openSection, Dynamic } from '../ui/section.js';
import { gameState } from '../core/GameState.js';
import { WASTES } from '../game/wastes.js';
import { BINS, getBin } from '../game/bins.js';

const TAB_COLOR = { white: 0x1e88e5, black: 0x3a4048, green: 0x2fae62 };
const BIN_HEX = { white: '#1565C0', black: '#23272D', green: '#0F6A3A' };

export class AlbumScene extends Phaser.Scene {
  constructor() { super('Album'); }

  create() {
    const learned = gameState.progress.learnedWasteTypes;
    this.learned = learned;
    openSection(this, 'Álbum ecológico', `Conoces ${learned.length} de ${WASTES.length} residuos`);
    this.dyn = new Dynamic(this);
    this.tab = BINS[0].id;
    this.selected = null;
    this.tabs = BINS.map((bin, i) => {
      const have = WASTES.filter((w) => w.bin === bin.id && learned.includes(w.id)).length;
      const total = WASTES.filter((w) => w.bin === bin.id).length;
      return new Button(this, 245 + i * 345, 262, {
        label: `${bin.name}  ${have}/${total}`, width: 325, height: 90, fontSize: 36, color: TAB_COLOR[bin.id], sound: 'pop',
        onClick: () => { this.tab = bin.id; this.selected = null; this.render(); },
      });
    });
    panel(this, 1530, 610, 660, 800, { radius: 60 });
    this.render();
  }

  render() {
    this.dyn.clear();
    this.tabs.forEach((t, i) => t.setAlpha(BINS[i].id === this.tab ? 1 : 0.55));
    const list = WASTES.filter((w) => w.bin === this.tab);
    if (!this.selected) this.selected = (list.find((w) => this.learned.includes(w.id)) || {}).id || null;
    list.forEach((w, i) => {
      const known = this.learned.includes(w.id);
      const x = 160 + (i % 5) * 218, y = 460 + Math.floor(i / 5) * 262;
      const card = this.dyn.add(new Button(this, x, y, {
        width: 204, height: 240, radius: 36, color: w.id === this.selected ? 0xffe9a8 : theme.c.cream, sound: known ? 'pop' : 'locked',
        onClick: () => {
          if (!known) { toast(this, 'Aún no lo conoces. ¡Lo encontrarás jugando misiones!', { who: 'reciclin' }); return; }
          this.selected = w.id; this.render();
        },
      }));
      const img = this.add.image(0, -30, `waste-${w.id}`).setDisplaySize(150, 150);
      card.face.add(img);
      if (known) {
        card.face.add(label(this, 0, 80, w.name, { size: 23, wrap: 190, lineSpacing: -4 }));
      } else {
        img.setTintFill(0x9aa7b1).setAlpha(0.55); // silueta
        card.face.add(label(this, 0, 80, '¿?', { size: 40, color: theme.hex.grey }));
      }
    });
    this.renderDetail();
  }

  renderDetail() {
    const cx = 1530, d = (o) => this.dyn.add(o);
    const w = WASTES.find((x) => x.id === this.selected);
    if (!w) {
      d(this.add.image(cx, 480, 'reciclin-happy').setDisplaySize(260, 300));
      d(label(this, cx, 740, 'Aquí verás lo que aprendas.\n¡Juega misiones para llenar tu álbum!', { size: 36, wrap: 560, lineSpacing: 6 }));
      return;
    }
    const bin = getBin(w.bin);
    d(this.add.circle(cx, 400, 150, 0xffffff).setStrokeStyle(8, TAB_COLOR[w.bin]));
    d(this.add.image(cx, 400, `waste-${w.id}`).setDisplaySize(230, 230));
    d(label(this, cx, 590, w.name, { size: 46, wrap: 600 }));
    d(this.add.image(cx - 230, 690, `bin-${bin.id}`).setDisplaySize(84, 100));
    d(label(this, cx - 170, 672, `Caneca ${bin.name.toLowerCase()}`, { size: 38, origin: [0, 0.5], color: BIN_HEX[bin.id] }));
    d(label(this, cx - 170, 716, bin.title, { size: 30, origin: [0, 0.5], bold: false }));
    d(label(this, cx, 770, w.why, { size: 30, bold: false, wrap: 590, origin: [0.5, 0], lineSpacing: 4 }));
    d(label(this, cx, 896, '¿Sabías que…?', { size: 30, color: theme.hex.orange }));
    d(label(this, cx, 920, w.fact, { size: 28, bold: false, wrap: 590, origin: [0.5, 0], lineSpacing: 4, color: theme.hex.greenDark }));
  }
}
