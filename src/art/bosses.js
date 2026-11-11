// Jefes finales dibujados como SVG (400x460), con las mismas expresiones que
// los personajes. Son monstruos de basura divertidos, no aterradores.
// (El quinto jefe es CONTAMINATOR, que ya está en characters.js.)
import { svgDoc, face } from './characters.js';

export const BOSS_SPRITES = ['rata', 'mosca', 'pulpo', 'golem'];
export const BOSS_EXPRESSIONS = ['sneaky', 'oops', 'talk', 'blink', 'happy'];

const BITS = ['#90CAF9', '#FFE082', '#EF9A9A', '#CE93D8', '#A5D6A7', '#FFFFFF'];

// Ratasura: rata gigante con una lata de corona.
function rata(expr) {
  const o = '#3E3E46';
  return `
<defs><radialGradient id="rg" cx="40%" cy="32%" r="80%"><stop offset="0" stop-color="#C9C9D2"/><stop offset="1" stop-color="#8A8A96"/></radialGradient></defs>
<path d="M330 400 C 400 400 396 320 356 318 C 330 318 330 352 352 350" fill="none" stroke="#F48FB1" stroke-width="16" stroke-linecap="round"/>
<circle cx="92" cy="138" r="62" fill="#8A8A96" stroke="${o}" stroke-width="8"/><circle cx="92" cy="138" r="36" fill="#F8BBD0"/>
<circle cx="308" cy="138" r="62" fill="#8A8A96" stroke="${o}" stroke-width="8"/><circle cx="308" cy="138" r="36" fill="#F8BBD0"/>
<ellipse cx="140" cy="436" rx="46" ry="18" fill="#F48FB1" stroke="${o}" stroke-width="7"/><ellipse cx="260" cy="436" rx="46" ry="18" fill="#F48FB1" stroke="${o}" stroke-width="7"/>
<ellipse cx="200" cy="288" rx="152" ry="152" fill="url(#rg)" stroke="${o}" stroke-width="8"/>
<ellipse cx="200" cy="360" rx="92" ry="62" fill="#E6E6EC" opacity="0.8"/>
<rect x="164" y="84" width="72" height="62" rx="10" fill="#CFD8DC" stroke="${o}" stroke-width="7" transform="rotate(-8 200 115)"/>
<rect x="166" y="100" width="68" height="24" fill="#EF5350" transform="rotate(-8 200 115)"/>
<ellipse cx="200" cy="302" rx="62" ry="40" fill="#F3E3E8"/>
<path d="M150 296 L96 284 M150 306 L94 312 M250 296 L304 284 M250 306 L306 312" stroke="${o}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="200" cy="284" rx="18" ry="13" fill="#EC407A" stroke="${o}" stroke-width="5"/>
${face({ cx: 200, ey: 218, my: 318, gap: 60, r: 30, expr })}`;
}

// Moscardón: mosca gorda con alas y ojos rojos.
function mosca(expr) {
  const o = '#1F2B33';
  return `
<defs><radialGradient id="mg" cx="40%" cy="32%" r="80%"><stop offset="0" stop-color="#6F8F86"/><stop offset="1" stop-color="#37474F"/></radialGradient></defs>
<ellipse cx="78" cy="170" rx="92" ry="52" fill="#B3E5FC" opacity="0.75" stroke="#4FC3F7" stroke-width="6" transform="rotate(-34 78 170)"/>
<ellipse cx="322" cy="170" rx="92" ry="52" fill="#B3E5FC" opacity="0.75" stroke="#4FC3F7" stroke-width="6" transform="rotate(34 322 170)"/>
<path d="M92 330 L36 372 M100 372 L52 428 M308 330 L364 372 M300 372 L348 428 M160 420 L150 452 M240 420 L250 452" stroke="${o}" stroke-width="10" stroke-linecap="round"/>
<path d="M168 112 Q150 70 132 66 M232 112 Q250 70 268 66" fill="none" stroke="${o}" stroke-width="8" stroke-linecap="round"/>
<circle cx="130" cy="64" r="10" fill="${o}"/><circle cx="270" cy="64" r="10" fill="${o}"/>
<ellipse cx="200" cy="290" rx="136" ry="146" fill="url(#mg)" stroke="${o}" stroke-width="8"/>
<path d="M92 352 Q200 392 308 352 M112 394 Q200 426 288 394" fill="none" stroke="#263238" stroke-width="12" stroke-linecap="round" opacity="0.6"/>
<circle cx="140" cy="226" r="58" fill="#E53935" stroke="${o}" stroke-width="7"/><circle cx="260" cy="226" r="58" fill="#E53935" stroke="${o}" stroke-width="7"/>
${face({ cx: 200, ey: 226, my: 318, gap: 60, r: 30, expr })}`;
}

// Plastipulpo: pulpo hecho de bolsas y tiras de plástico.
function pulpo(expr) {
  const o = '#3D5A80';
  const legs = [[70, 330, -60], [118, 372, -30], [170, 392, -8], [230, 392, 8], [282, 372, 30], [330, 330, 60]].map(([x, y, a], i) =>
    `<path d="M0 0 q -22 34 0 62 q 20 26 -6 52" fill="none" stroke="${o}" stroke-width="34" stroke-linecap="round" transform="translate(${x} ${y}) rotate(${a})"/>` +
    `<path d="M0 0 q -22 34 0 62 q 20 26 -6 52" fill="none" stroke="${['#90CAF9', '#F8BBD0', '#B2EBF2'][i % 3]}" stroke-width="22" stroke-linecap="round" transform="translate(${x} ${y}) rotate(${a})"/>`).join('');
  return `
<defs><radialGradient id="pg" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#F3FAFF"/><stop offset="1" stop-color="#A9D4F5"/></radialGradient></defs>
<path d="M150 96 Q140 26 168 26 Q192 26 186 92 M214 92 Q208 26 232 26 Q260 26 250 96" fill="none" stroke="${o}" stroke-width="12" stroke-linecap="round"/>
${legs}
<path d="M52 300 Q40 96 200 88 Q360 96 348 300 Q340 372 200 376 Q60 372 52 300 Z" fill="url(#pg)" stroke="${o}" stroke-width="8"/>
<path d="M96 150 Q84 220 92 290" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
<path d="M176 140 L200 116 L224 140 M200 116 V176 M170 178 H230" fill="none" stroke="#64B5F6" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
<circle cx="96" cy="300" r="20" fill="#F48FB1" opacity="0.6"/><circle cx="304" cy="300" r="20" fill="#F48FB1" opacity="0.6"/>
${face({ cx: 200, ey: 248, my: 306, gap: 58, r: 32, expr })}`;
}

// Basurón: gólem de basura mezclada, con brazos de llanta.
function golem(expr) {
  const o = '#3E2F27';
  let bits = '';
  [[96, 330, 0], [300, 350, 1], [150, 400, 2], [250, 410, 3], [112, 250, 4], [296, 262, 5], [200, 380, 0], [330, 300, 2], [76, 290, 3]].forEach(([x, y, k], i) => {
    bits += i % 2 ? `<circle cx="${x}" cy="${y}" r="13" fill="${BITS[k]}" stroke="${o}" stroke-width="4"/>`
      : `<rect x="${x - 15}" y="${y - 11}" width="30" height="22" rx="5" fill="${BITS[k]}" stroke="${o}" stroke-width="4" transform="rotate(${i * 17} ${x} ${y})"/>`;
  });
  return `
<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A1887F"/><stop offset="1" stop-color="#6D4C41"/></linearGradient></defs>
<circle cx="42" cy="300" r="40" fill="#263238" stroke="${o}" stroke-width="8"/><circle cx="42" cy="300" r="16" fill="#90A4AE"/>
<circle cx="358" cy="300" r="40" fill="#263238" stroke="${o}" stroke-width="8"/><circle cx="358" cy="300" r="16" fill="#90A4AE"/>
<rect x="110" y="410" width="70" height="42" rx="14" fill="#5D4037" stroke="${o}" stroke-width="7"/><rect x="220" y="410" width="70" height="42" rx="14" fill="#5D4037" stroke="${o}" stroke-width="7"/>
<path d="M70 196 Q62 130 130 122 L270 122 Q338 130 330 196 L346 390 Q346 430 300 430 H100 Q54 430 54 390 Z" fill="url(#gg)" stroke="${o}" stroke-width="8" stroke-linejoin="round"/>
${bits}
<path d="M186 122 C 140 106 112 118 96 142 C 132 134 160 138 184 152 Z" fill="#FFD23F" stroke="#B8860B" stroke-width="6" stroke-linejoin="round"/>
<path d="M210 120 C 246 92 286 96 308 116 C 274 118 248 128 230 150 Z" fill="#FFE066" stroke="#B8860B" stroke-width="6" stroke-linejoin="round"/>
<path d="M206 116 l4 -26" stroke="#6B4F1D" stroke-width="9" stroke-linecap="round"/>
<rect x="104" y="170" width="192" height="150" rx="40" fill="#BCAAA4" opacity="0.55"/>
${face({ cx: 200, ey: 226, my: 286, gap: 54, r: 28, expr })}`;
}

const ART = { rata, mosca, pulpo, golem };

export function bossSVG(sprite, expr = 'sneaky', scale = 1) {
  return svgDoc(400, 460, ART[sprite](expr), scale);
}
