// Motor del videojuego: configuración de Phaser y registro de escenas.
import Phaser from 'phaser';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-700.css';
import { W, H } from './config/theme.js';
import { gameState } from './core/GameState.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { StoryScene } from './scenes/StoryScene.js';
import { ProfileScene } from './scenes/ProfileScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { MissionIntroScene } from './scenes/MissionIntroScene.js';
import { SortingScene } from './scenes/SortingScene.js';
import { ResultsScene } from './scenes/ResultsScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { ComingSoonScene } from './scenes/ComingSoonScene.js';

async function start() {
  gameState.load();
  // La tipografía debe estar lista antes de dibujar texto en el lienzo.
  try {
    await Promise.all([document.fonts.load('700 40px Fredoka'), document.fonts.load('500 40px Fredoka')]);
  } catch { /* se usará la tipografía de respaldo */ }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#0f5c36',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    input: { activePointers: 3 },
    scene: [BootScene, TitleScene, StoryScene, ProfileScene, WorldMapScene, MissionIntroScene, SortingScene, ResultsScene, SettingsScene, ComingSoonScene],
  });
  window.__ECOMISION__ = game; // para pruebas automáticas y depuración
}

start();
