// Perfil del jugador: retrato, nivel, experiencia y lo que ha logrado.
import Phaser from 'phaser';
import { theme } from '../config/theme.js';
import { Button, label, panel } from '../ui/widgets.js';
import { openSection } from '../ui/section.js';
import { makeAvatar } from '../ui/avatar.js';
import { goTo } from '../core/Navigation.js';
import { gameState, XP_PER_LEVEL } from '../core/GameState.js';
import { getAgeMode } from '../config/ageModes.js';
import { ALL_MISSION_IDS } from '../config/missions.js';
import { WORLDS } from '../config/worlds.js';
import { WASTES } from '../game/wastes.js';
import { BADGES, levelTitle, badgeContext } from '../game/rewards.js';

export class PlayerProfileScene extends Phaser.Scene {
  constructor() { super('PlayerProfile'); }

  create() {
    const p = gameState.profile, pr = gameState.progress, mode = getAgeMode(p.ageMode);
    const ctx = badgeContext(pr);
    openSection(this, 'Mi perfil');

    panel(this, 420, 600, 640, 780, { radius: 60 });
    makeAvatar(this, 420, 440, 360, p);
    label(this, 420, 690, p.nickname, { size: 60, wrap: 600 });
    label(this, 420, 762, `${mode.name} · ${mode.ages}`, { size: 34, bold: false, color: theme.hex.grey });
    new Button(this, 420, 890, { label: 'Cambiar mi estilo', icon: 'ic-shop', width: 520, height: 104, fontSize: 42, color: theme.c.orange, onClick: () => goTo(this, 'Shop') });

    const cx = 1290;
    panel(this, cx, 600, 1020, 780, { radius: 60 });
    this.add.circle(cx - 400, 320, 70, theme.c.yellow).setStrokeStyle(8, 0xffffff);
    label(this, cx - 400, 320, String(pr.level), { size: 76 });
    label(this, cx - 300, 290, `Nivel ${pr.level}`, { size: 38, origin: [0, 0.5], color: theme.hex.grey });
    label(this, cx - 300, 344, levelTitle(pr.level), { size: 54, origin: [0, 0.5], color: theme.hex.greenDark });
    const into = pr.experience % XP_PER_LEVEL, bx = cx - 440, bw = 880;
    const bar = this.add.graphics();
    bar.fillStyle(0xd9d2bd, 1); bar.fillRoundedRect(bx, 420, bw, 34, 17);
    if (into > 0) { bar.fillStyle(theme.c.green, 1); bar.fillRoundedRect(bx, 420, Math.max(34, (bw * into) / XP_PER_LEVEL), 34, 17); }
    label(this, cx, 482, `${pr.experience} de experiencia · faltan ${XP_PER_LEVEL - into} para el nivel ${pr.level + 1}`, { size: 28, bold: false, color: theme.hex.grey });

    const answers = pr.correctAnswers + pr.incorrectAnswers;
    const stats = [
      ['ic-play', 0x26a69a, 'Niveles terminados', `${ctx.missionsDone} de ${ALL_MISSION_IDS.length}`],
      ['ic-planeta', 0x1e88e5, 'Mundos recuperados', `${ctx.worldsDone.length} de ${WORLDS.length}`],
      ['ic-book', 0x7b5ea7, 'Residuos aprendidos', `${ctx.learned} de ${WASTES.length}`],
      ['ic-check', 0x2bb673, 'Respuestas acertadas', answers ? `${Math.round((pr.correctAnswers / answers) * 100)} %` : '—'],
      ['ic-medal', 0xf9a825, 'Insignias', `${gameState.rewards.unlockedBadges.length} de ${BADGES.length}`],
    ];
    stats.forEach(([icon, color, name, value], i) => {
      const y = 552 + i * 66;
      this.add.circle(cx - 420, y, 30, color);
      this.add.image(cx - 420, y, icon).setDisplaySize(36, 36);
      label(this, cx - 370, y, name, { size: 36, origin: [0, 0.5], bold: false });
      label(this, cx + 440, y, value, { size: 40, origin: [1, 0.5] });
    });
    new Button(this, cx - 330, 926, { label: 'Insignias', icon: 'ic-medal', width: 310, height: 96, fontSize: 34, color: 0xf9a825, onClick: () => goTo(this, 'Badges') });
    new Button(this, cx, 926, { label: 'Álbum', icon: 'ic-book', width: 310, height: 96, fontSize: 34, color: 0x26a69a, onClick: () => goTo(this, 'Album') });
    new Button(this, cx + 330, 926, { label: 'Habilidades', icon: 'ic-escudo', width: 320, height: 96, fontSize: 32, color: theme.c.purple, onClick: () => goTo(this, 'Abilities') });
  }
}
