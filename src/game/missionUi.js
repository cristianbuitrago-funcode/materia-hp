// Piezas comunes de las pantallas de misión (clasificar, "¿está bien?" y preguntas):
// preparación de la misión con dificultad adaptativa, barra superior, guía y cierre.
import { W, theme } from '../config/theme.js';
import { Button, label, panel, chip } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { goTo, openOverlay } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { getWorld } from '../config/worlds.js';
import { getMission, MISSIONS_PER_WORLD } from '../config/missions.js';
import { levelRules, reviewList } from './Difficulty.js';
import { getBoss } from './bosses.js';
import { ABILITIES, abilityEffects } from './abilities.js';

export const SCENE_FOR_KIND = { sort: 'Sorting', check: 'Challenge', quiz: 'Challenge', boss: 'Boss' };

export function startMission(scene, worldId, index) {
  const mission = getMission(worldId, index, gameState.profile.ageMode);
  goTo(scene, SCENE_FOR_KIND[mission.kind], { worldId, missionIndex: index });
}

// Reúne todo lo necesario para jugar una misión, o null si no se puede jugar.
export function prepareMission(data) {
  if (!gameState.hasProfile || !data) return null;
  const world = getWorld(data.worldId);
  const index = Number.isInteger(data.missionIndex) ? data.missionIndex : 0;
  if (!world || !gameState.isMissionUnlocked(world.id, index)) return null;
  const mode = gameState.profile.ageMode;
  const mission = getMission(world.id, index, mode);
  // Dificultad: edad + desempeño reciente + número de nivel (sube con cada uno).
  const rules = levelRules(mode, gameState.progress.recentAnswers, index);
  rules.size += mission.extra || 0;
  const effects = abilityEffects(gameState.abilities());
  const firstTime = !gameState.missionState(mission.id);
  const cleanStart = gameState.worldStatus(world.id).clean;
  return {
    world, mission, mode, rules, data: { worldId: world.id, missionIndex: index },
    place: index, // cada nivel ocurre en un lugar distinto del mundo
    boss: mission.isBoss ? getBoss(world.id) : null,
    // Habilidades ganadas a los jefes: usos de los botones y efectos pasivos de la ronda.
    effects,
    roundOptions: { hintAfter: rules.hintAfter, shield: effects.shield, coinBonus: effects.coinBonus },
    // Cómo elegir los residuos: repaso de lo que más le cuesta, protagonistas de la misión y residuos del mundo.
    pick: { review: reviewList(gameState.progress.trouble), focus: mission.focus, bins: mission.bins, priority: [world.wastes] },
    // El mundo se limpia una quinta parte la primera vez que se termina cada nivel.
    cleanStart, cleanGain: firstTime ? 1 / MISSIONS_PER_WORLD : 0,
    timed: !!mission.timed && mode !== 'explorer', // sin cronómetro para los más pequeños
  };
}

// Lo que dice el guía al empezar: el consejo de la misión y, si la dificultad se ajustó, por qué.
export function openingLine(setup) {
  const note = setup.rules.level > 0 ? ' ¡Vas muy bien! Hoy el reto es más difícil.'
    : setup.rules.level < 0 ? ' Vamos paso a paso: yo te ayudo.' : '';
  return setup.mission.tip + note;
}

// Cartel que anuncia el nivel y su lugar al empezar.
export function showPlaceBanner(scene, setup) {
  const text = `Nivel ${setup.mission.index + 1} · ${setup.mission.place}`;
  const t = label(scene, W / 2, 232, text, { size: 64, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 16 }).setDepth(90).setScale(0);
  scene.tweens.add({ targets: t, scale: 1, duration: 320, ease: 'Back.out' });
  scene.tweens.add({ targets: t, alpha: 0, y: 200, duration: 500, delay: 2100, onComplete: () => t.destroy() });
}

// Botones de las habilidades activas (Lupa y Ola), con los usos que quedan en el nivel.
// handlers = { lupa: fn, ola: fn }: cada uno devuelve true si la habilidad se pudo usar.
export function createAbilityBar(scene, setup, handlers, x = 1810, y0 = 300) {
  const bar = { uses: { ...setup.effects.uses }, buttons: {} };
  ABILITIES.filter((a) => a.kind === 'active' && bar.uses[a.id] > 0).forEach((a, i) => {
    const y = y0 + i * 150;
    const btn = new Button(scene, x, y, {
      icon: a.icon, width: 124, height: 124, radius: 62, color: a.color, sound: 'pop',
      onClick: () => {
        if (bar.uses[a.id] <= 0 || !handlers[a.id]()) return;
        bar.uses[a.id]--;
        count.setText(String(bar.uses[a.id]));
        if (bar.uses[a.id] <= 0) btn.setEnabled(false);
      },
    });
    scene.add.circle(x + 46, y - 46, 24, theme.c.ink).setStrokeStyle(4, 0xffffff).setDepth(5);
    const count = label(scene, x + 46, y - 46, String(bar.uses[a.id]), { size: 28, color: '#FFFFFF' }).setDepth(6);
    bar.buttons[a.id] = btn;
  });
  return bar;
}

// Barra superior: volver, avance, monedas y ajustes. `unit` es "Residuo", "Pregunta"…
// Para los jefes: `format` da el texto y `life` hace que la barra muestre la vida que queda.
export function createHud(scene, { unit, onBack, format = null, life = false }) {
  new Button(scene, 110, 100, { icon: 'ic-back', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: onBack });
  panel(scene, W / 2, 100, 760, 110, { radius: 55, strokeWidth: 5 });
  const text = label(scene, W / 2, 76, '', { size: 36 });
  const bar = scene.add.graphics();
  const coins = chip(scene, W - 340, 100, 'ic-coin', gameState.progress.ecoCoins, { width: 220 });
  new Button(scene, W - 110, 100, { icon: 'ic-gear', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: () => openOverlay(scene, 'Settings') });
  return {
    update(round) {
      const done = round.index, total = round.total;
      text.setText(format ? format(round) : round.finished ? '¡Nivel completo!' : `${unit} ${done + 1} de ${total}`);
      const x = W / 2 - 330, y = 108, w = 660, h = 26;
      const filled = life ? total - done : done;
      bar.clear();
      bar.fillStyle(0xd9d2bd, 1); bar.fillRoundedRect(x, y, w, h, 13);
      if (filled > 0) { bar.fillStyle(life ? theme.c.red : theme.c.green, 1); bar.fillRoundedRect(x, y, Math.max(h, (w * filled) / total), h, 13); }
      coins.valueText.setText(String(gameState.progress.ecoCoins + round.coins));
    },
  };
}

// RECICLÍN con su globo de texto, abajo a la izquierda.
export function createGuide(scene) {
  const guide = new Character(scene, 205, 1050, 'reciclin', { scale: 0.62 });
  const bubble = scene.add.container(225, 400);
  const bg = panel(scene, 0, 0, 410, 300, { radius: 50 });
  bg.fillStyle(theme.c.cream, 1); bg.fillTriangle(-60, 144, 20, 144, -40, 205);
  bg.lineStyle(6, theme.c.ink, 1); bg.lineBetween(-60, 152, -40, 205); bg.lineBetween(-40, 205, 20, 152);
  const text = label(scene, 0, 0, '', { size: 32, wrap: 360, lineSpacing: 4 });
  bubble.add([bg, text]);
  return {
    character: guide,
    // Todo lo que dice queda escrito; el texto se achica si es largo.
    say(message, expr = 'happy') {
      text.setFontSize(message.length > 105 ? 26 : message.length > 80 ? 29 : 32);
      text.setText(message);
      guide.talk(expr, 900);
      scene.tweens.add({ targets: bubble, scale: { from: 0.85, to: 1 }, duration: 220, ease: 'Back.out' });
    },
  };
}

// Chispas de celebración y premios que suben flotando.
export function createSparks(scene) {
  return scene.add.particles(0, 0, 'dot', {
    speed: { min: 180, max: 520 }, angle: { min: 200, max: 340 }, gravityY: 900, lifespan: 900,
    scale: { start: 0.9, end: 0 }, tint: [0xffd23f, 0x2bb673, 0xff8a3d, 0x5cc8f5, 0xffffff], emitting: false,
  }).setDepth(60);
}

export function floatReward(scene, x, y, text, icon, tint = null) {
  const c = scene.add.container(x, y).setDepth(70);
  const img = scene.add.image(-46, 0, icon).setDisplaySize(60, 60);
  if (tint !== null) img.setTint(tint);
  c.add([img, label(scene, 26, 0, text, { size: 56, color: '#FFFFFF', stroke: '#17324D', strokeThickness: 12 })]);
  scene.tweens.add({ targets: c, y: y - 150, alpha: { from: 1, to: 0 }, duration: 1300, ease: 'Quad.out', onComplete: () => c.destroy() });
}

// Guarda el resultado de la misión y pasa a la pantalla de resultados.
export function finishMission(scene, setup, round) {
  const summary = round.summary();
  const outcome = gameState.applyRoundResult(summary, setup.mission.id, round.answers());
  goTo(scene, 'Results', { worldId: setup.world.id, missionIndex: setup.mission.index, summary, boss: !!setup.boss, ...outcome });
}
