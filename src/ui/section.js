// Marco común de las secciones del jugador (álbum, tienda, insignias, perfil):
// fondo, título, botón de volver al mapa y monedas.
import { W, H, theme } from '../config/theme.js';
import { drawMeadow } from '../art/backgrounds.js';
import { Button, label, chip } from './widgets.js';
import { enterScene, goTo } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { audio } from '../core/AudioManager.js';

export function openSection(scene, title, subtitle = '') {
  enterScene(scene);
  audio.setTheme('main');
  drawMeadow(scene, { sun: false, clouds: 3 });
  scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.3);
  new Button(scene, 110, 100, { icon: 'ic-back', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: () => goTo(scene, 'WorldMap') });
  label(scene, W / 2, 84, title, { size: 84, color: '#FFFFFF', stroke: '#14804A', strokeThickness: 20 });
  const sub = label(scene, W / 2, 160, subtitle, { size: 34, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 8 });
  const coins = chip(scene, W - 170, 100, 'ic-coin', gameState.progress.ecoCoins, { width: 240 });
  scene.onCancel = () => goTo(scene, 'WorldMap');
  return {
    setSubtitle: (t) => sub.setText(t),
    refreshCoins: () => coins.valueText.setText(String(gameState.progress.ecoCoins)),
  };
}

// Lista de objetos que se reconstruyen (al cambiar de pestaña, comprar…).
export class Dynamic {
  constructor(scene) { this.scene = scene; this.items = []; }
  add(obj) { this.items.push(obj); return obj; }
  clear() {
    for (const o of this.items) if (o.active) o.destroy();
    this.items = [];
    const f = this.scene.focus;
    f.items = f.items.filter((i) => i.active);
    if (f.current && !f.current.active) f.current = null;
  }
}
