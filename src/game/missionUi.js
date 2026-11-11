// Piezas comunes de las pantallas de misión (clasificar, "¿está bien?" y preguntas):
// preparación de la misión con dificultad adaptativa, barra superior, guía y cierre.
import { W, theme } from '../config/theme.js';
import { Button, label, panel, chip } from '../ui/widgets.js';
import { Character } from '../ui/Character.js';
import { goTo, openOverlay } from '../core/Navigation.js';
import { gameState } from '../core/GameState.js';
import { getWorld } from '../config/worlds.js';
import { getMission } from '../config/missions.js';
import { adaptRules, reviewList } from './Difficulty.js';

export const SCENE_FOR_KIND = { sort: 'Sorting', check: 'Challenge', quiz: 'Challenge' };

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
  const rules = adaptRules(mode, gameState.progress.recentAnswers);
  rules.size += mission.extra || 0;
  const firstTime = !gameState.missionState(mission.id);
  const cleanStart = gameState.worldStatus(world.id).clean;
  return {
    world, mission, mode, rules,
    // Cómo elegir los residuos: repaso de lo que más le cuesta, protagonistas de la misión y residuos del mundo.
    pick: { review: reviewList(gameState.progress.trouble), focus: mission.focus, bins: mission.bins, priority: [world.wastes] },
    // El mundo se limpia una cuarta parte la primera vez que se termina cada misión.
    cleanStart, cleanGain: firstTime ? 0.25 : 0,
    timed: !!mission.timed && mode !== 'explorer', // sin cronómetro para los más pequeños
  };
}

// Lo que dice el guía al empezar: el consejo de la misión y, si la dificultad se ajustó, por qué.
export function openingLine(setup) {
  const note = setup.rules.level > 0 ? ' ¡Vas muy bien! Hoy el reto es más difícil.'
    : setup.rules.level < 0 ? ' Vamos paso a paso: yo te ayudo.' : '';
  return setup.mission.tip + note;
}

// Barra superior: volver, avance, monedas y ajustes. `unit` es "Residuo", "Pregunta"…
export function createHud(scene, { unit, onBack }) {
  new Button(scene, 110, 100, { icon: 'ic-back', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: onBack });
  panel(scene, W / 2, 100, 760, 110, { radius: 55, strokeWidth: 5 });
  const text = label(scene, W / 2, 76, '', { size: 36 });
  const bar = scene.add.graphics();
  const coins = chip(scene, W - 340, 100, 'ic-coin', gameState.progress.ecoCoins, { width: 220 });
  new Button(scene, W - 110, 100, { icon: 'ic-gear', width: 120, height: 120, radius: 60, color: theme.c.greenDark, onClick: () => openOverlay(scene, 'Settings') });
  return {
    update(round) {
      const done = round.index, total = round.total;
      text.setText(round.finished ? '¡Misión completa!' : `${unit} ${done + 1} de ${total}`);
      const x = W / 2 - 330, y = 108, w = 660, h = 26;
      bar.clear();
      bar.fillStyle(0xd9d2bd, 1); bar.fillRoundedRect(x, y, w, h, 13);
      if (done > 0) { bar.fillStyle(theme.c.green, 1); bar.fillRoundedRect(x, y, Math.max(h, (w * done) / total), h, 13); }
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
  goTo(scene, 'Results', { worldId: setup.world.id, missionIndex: setup.mission.index, summary, ...outcome });
}
