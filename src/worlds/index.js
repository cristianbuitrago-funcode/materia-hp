// Gestión de mundos (parte visual): construye el escenario de un mundo y
// controla su "limpieza", de 0 (contaminado) a 1 (ecosistema recuperado).
// Al limpiar, los elementos contaminados desaparecen uno a uno, los
// elementos vivos aparecen y la neblina se despeja.
import { buildCity } from './city.js';
import { buildForest } from './forest.js';
import { buildOcean } from './ocean.js';
import { buildMountain } from './mountain.js';
import { buildFuture } from './future.js';
import { visibleCounts } from './cleanliness.js';

const BUILDERS = { city: buildCity, forest: buildForest, ocean: buildOcean, mountain: buildMountain, future: buildFuture };

// `place` es el lugar del mundo (0 a 4): cada nivel tiene el suyo; el 4 es la guarida del jefe.
export function buildWorld(scene, worldId, clean = 0, place = 0) {
  const build = BUILDERS[worldId];
  if (!build) throw new Error(`Mundo sin escenario: ${worldId}`);
  const parts = build(scene, place);
  for (const o of [...parts.dirty, ...parts.clean]) {
    o._sx = o.scaleX; o._sy = o.scaleY; o._shown = true;
  }

  const show = (o, on, animate, delay) => {
    if (o._shown === on) return;
    o._shown = on;
    // Solo se cancela la animación de aparecer/desaparecer; las propias del elemento (volar, flotar) siguen.
    if (o._showTween) { o._showTween.remove(); o._showTween = null; }
    if (!animate) { o.setVisible(on).setScale(o._sx, o._sy); return; }
    if (on) {
      o.setVisible(true).setScale(0);
      o._showTween = scene.tweens.add({ targets: o, scaleX: o._sx, scaleY: o._sy, duration: 520, delay, ease: 'Back.out' });
    } else {
      o._showTween = scene.tweens.add({ targets: o, scaleX: 0, scaleY: 0, duration: 380, delay, ease: 'Back.in', onComplete: () => { if (!o._shown) o.setVisible(false); } });
    }
  };

  const world = {
    clean: 0,
    parts,
    setClean(value, animate = false) {
      const v = Math.min(1, Math.max(0, value));
      this.clean = v;
      const n = visibleCounts(v, parts.dirty.length, parts.clean.length);
      let delay = 0;
      // Lo contaminado se retira desde el final de la lista; lo limpio aparece desde el principio.
      parts.dirty.forEach((o, i) => { const on = i < n.dirty; if (o._shown !== on) { show(o, on, animate, delay); delay += 120; } });
      parts.clean.forEach((o, i) => { const on = i < n.clean; if (o._shown !== on) { show(o, on, animate, delay); delay += 120; } });
      const alpha = parts.hazeMax * (1 - v);
      if (this.hazeTween) { this.hazeTween.remove(); this.hazeTween = null; }
      if (animate) this.hazeTween = scene.tweens.add({ targets: parts.haze, alpha, duration: 700 });
      else parts.haze.setAlpha(alpha);
    },
  };
  world.setClean(clean, false);
  return world;
}
