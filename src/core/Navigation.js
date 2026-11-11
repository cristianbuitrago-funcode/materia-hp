// Navegación entre pantallas con transición animada.
import { FocusManager } from '../ui/FocusManager.js';

const FADE = [15, 92, 54]; // verde oscuro de la marca

// Llamar al inicio de create() en cada escena.
export function enterScene(scene) {
  scene._leaving = false;
  scene.input.enabled = true;
  scene.focus = new FocusManager(scene);
  scene.cameras.main.fadeIn(320, ...FADE);
}

export function goTo(scene, key, data = {}) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.input.enabled = false;
  const cam = scene.cameras.main;
  cam.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
  cam.fadeOut(260, ...FADE);
}

// Abre una escena encima de la actual (ventana modal) y la pausa.
export function openOverlay(scene, key, data = {}) {
  if (scene._leaving || scene.scene.isActive(key)) return;
  scene.scene.launch(key, { ...data, parent: scene.scene.key });
  scene.scene.pause();
}

export function closeOverlay(scene, parentKey) {
  scene.scene.stop();
  scene.scene.resume(parentKey);
}
