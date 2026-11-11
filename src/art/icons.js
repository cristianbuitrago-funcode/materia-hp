// Iconos vectoriales de la interfaz y de los mundos (viewBox 100x100).
import { svgDoc } from './characters.js';

const S = 'stroke-linecap="round" stroke-linejoin="round"';

function gear(c) {
  let teeth = '';
  for (let i = 0; i < 8; i++) teeth += `<rect x="43" y="8" width="14" height="22" rx="4" fill="${c}" transform="rotate(${i * 45} 50 50)"/>`;
  return `${teeth}<circle cx="50" cy="50" r="30" fill="${c}"/><circle cx="50" cy="50" r="12" fill="#000" opacity="0.28"/>`;
}

// Iconos monocromos: reciben el color.
const MONO = {
  gear,
  play: (c) => `<path d="M34 20 L80 50 L34 80 Z" fill="${c}" stroke="${c}" stroke-width="8" ${S}/>`,
  back: (c) => `<path d="M58 22 L28 50 L58 78 M30 50 H78" fill="none" stroke="${c}" stroke-width="14" ${S}/>`,
  next: (c) => `<path d="M42 22 L72 50 L42 78 M70 50 H22" fill="none" stroke="${c}" stroke-width="14" ${S}/>`,
  close: (c) => `<path d="M26 26 L74 74 M74 26 L26 74" stroke="${c}" stroke-width="14" ${S}/>`,
  check: (c) => `<path d="M20 52 L42 74 L82 28" fill="none" stroke="${c}" stroke-width="15" ${S}/>`,
  lock: (c) => `<path d="M32 46 V34 a18 18 0 0 1 36 0 V46" fill="none" stroke="${c}" stroke-width="10" ${S}/><rect x="22" y="44" width="56" height="44" rx="10" fill="${c}"/><circle cx="50" cy="64" r="7" fill="#000" opacity="0.35"/>`,
  music: (c) => `<path d="M38 72 V24 L78 16 V64" fill="none" stroke="${c}" stroke-width="9" ${S}/><ellipse cx="28" cy="74" rx="14" ry="11" fill="${c}"/><ellipse cx="68" cy="66" rx="14" ry="11" fill="${c}"/>`,
  sound: (c) => `<path d="M14 38 H32 L54 20 V80 L32 62 H14 Z" fill="${c}" stroke="${c}" stroke-width="6" ${S}/><path d="M66 36 q 12 14 0 28 M76 24 q 22 26 0 52" fill="none" stroke="${c}" stroke-width="8" ${S}/>`,
  dice: (c) => `<rect x="16" y="16" width="68" height="68" rx="16" fill="${c}"/>${[[34, 34], [66, 34], [50, 50], [34, 66], [66, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#000" opacity="0.4"/>`).join('')}`,
  book: (c) => `<path d="M50 26 C40 16 24 14 12 18 V78 C24 74 40 76 50 86 C60 76 76 74 88 78 V18 C76 14 60 16 50 26 Z" fill="${c}"/><path d="M50 28 V84" stroke="#000" stroke-width="5" opacity="0.3"/>`,
  shop: (c) => `<path d="M22 36 H78 L72 86 H28 Z" fill="${c}" stroke="${c}" stroke-width="6" ${S}/><path d="M36 40 V30 a14 14 0 0 1 28 0 V40" fill="none" stroke="${c}" stroke-width="8" ${S}/>`,
  medal: (c) => `<path d="M34 10 L46 44 M66 10 L54 44" stroke="${c}" stroke-width="12" ${S}/><circle cx="50" cy="62" r="28" fill="${c}"/><path d="M50 46 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 z" fill="#000" opacity="0.3"/>`,
  user: (c) => `<circle cx="50" cy="34" r="20" fill="${c}"/><path d="M14 88 a36 32 0 0 1 72 0 Z" fill="${c}"/>`,
  family: (c) => `<circle cx="34" cy="30" r="16" fill="${c}"/><path d="M6 80 a28 28 0 0 1 56 0 Z" fill="${c}"/><circle cx="72" cy="46" r="12" fill="${c}"/><path d="M50 88 a22 22 0 0 1 44 0 Z" fill="${c}"/>`,
  star: (c) => `<path d="M50 8 l12 27 30 3 -22 20 6 30 -26 -15 -26 15 6 -30 -22 -20 30 -3 z" fill="${c}" stroke="${c}" stroke-width="4" ${S}/>`,
  lupa: (c) => `<circle cx="42" cy="42" r="26" fill="none" stroke="${c}" stroke-width="11"/><path d="M62 62 L86 86" stroke="${c}" stroke-width="14" ${S}/>`,
  brujula: (c) => `<circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="9"/><path d="M64 36 L56 56 L36 64 L44 44 Z" fill="${c}"/>`,
  planeta: (c) => `<circle cx="50" cy="50" r="38" fill="none" stroke="${c}" stroke-width="9"/><path d="M30 30 q 14 -4 16 8 q 2 10 -10 12 q -8 4 -14 -2 z M58 52 q 14 -2 16 8 q -2 12 -12 14 q -8 -6 -4 -22 z" fill="${c}"/>`,
};

export function iconSVG(name, color = '#FFFFFF', scale = 1) {
  return svgDoc(100, 100, MONO[name](color), scale);
}
export const ICON_NAMES = Object.keys(MONO);

// Moneda ecológica (a color).
export function coinSVG(scale = 1) {
  return svgDoc(100, 100, `<circle cx="50" cy="50" r="44" fill="#FFD23F" stroke="#C98A00" stroke-width="7"/><circle cx="50" cy="50" r="32" fill="none" stroke="#F0B400" stroke-width="5"/>
<path d="M50 74 C 30 66 28 40 50 26 C 72 40 70 66 50 74 Z M50 74 V 44" fill="#2BB673" stroke="#14804A" stroke-width="5" ${S}/>`, scale);
}

// Iconos a color de los cinco mundos (viewBox 200x200).
const WORLD_ART = {
  city: `<rect x="26" y="78" width="46" height="100" rx="6" fill="#607D8B"/><rect x="78" y="40" width="50" height="138" rx="6" fill="#455A64"/><rect x="134" y="92" width="42" height="86" rx="6" fill="#78909C"/>
${[[36, 92], [54, 92], [36, 116], [54, 116], [36, 140], [88, 56], [108, 56], [88, 84], [108, 84], [88, 112], [108, 112], [144, 106], [160, 106], [144, 130], [160, 130]].map(([x, y]) => `<rect x="${x}" y="${y}" width="10" height="14" rx="2" fill="#FFE082"/>`).join('')}
<ellipse cx="150" cy="44" rx="30" ry="16" fill="#B0A7B8" opacity="0.9"/><ellipse cx="124" cy="52" rx="20" ry="12" fill="#B0A7B8" opacity="0.9"/>`,
  forest: `<rect x="56" y="118" width="16" height="56" rx="5" fill="#795548"/><path d="M64 28 L104 96 H24 Z M64 62 L112 136 H16 Z" fill="#2E8B57" stroke="#1B5E3A" stroke-width="5" ${S}/>
<rect x="132" y="128" width="14" height="46" rx="5" fill="#795548"/><circle cx="139" cy="100" r="40" fill="#5FD068" stroke="#1E7F3C" stroke-width="5"/><circle cx="126" cy="90" r="7" fill="#EF5350"/><circle cx="152" cy="108" r="7" fill="#EF5350"/>`,
  ocean: `<path d="M12 96 q 22 -26 44 0 t 44 0 t 44 0 t 44 0 V184 H12 Z" fill="#29B6F6"/><path d="M12 128 q 22 -22 44 0 t 44 0 t 44 0 t 44 0 V184 H12 Z" fill="#0277BD" opacity="0.75"/>
<path d="M70 60 q 34 -30 68 0 q -34 30 -68 0 Z M70 60 L44 40 V80 Z" fill="#FFB300" stroke="#C77800" stroke-width="5" ${S}/><circle cx="118" cy="54" r="6" fill="#17324D"/>
<circle cx="150" cy="150" r="7" fill="#fff" opacity="0.7"/><circle cx="60" cy="158" r="5" fill="#fff" opacity="0.7"/>`,
  mountain: `<path d="M12 178 L84 44 Q 100 22 116 44 L188 178 Z" fill="#8D6E63" stroke="#5D4037" stroke-width="6" ${S}/>
<rect x="84" y="70" width="26" height="20" rx="4" fill="#B0BEC5" transform="rotate(-14 97 80)"/><circle cx="70" cy="126" r="13" fill="#EF9A9A"/><rect x="112" y="112" width="30" height="22" rx="4" fill="#FFE082" transform="rotate(10 127 123)"/>
<rect x="46" y="150" width="28" height="18" rx="4" fill="#90CAF9"/><circle cx="110" cy="158" r="12" fill="#CE93D8"/><rect x="138" y="146" width="24" height="22" rx="4" fill="#A5D6A7" transform="rotate(-8 150 157)"/>`,
  future: `<circle cx="150" cy="52" r="26" fill="#FFD23F"/><path d="M0 182 Q 60 104 120 150 Q 160 118 200 150 V184 H0 Z" fill="#43A047"/>
<rect x="62" y="64" width="8" height="92" rx="4" fill="#ECEFF1" stroke="#90A4AE" stroke-width="3"/>
${[0, 120, 240].map((a) => `<path d="M66 64 q 8 -30 0 -52 q -8 22 0 52 Z" fill="#fff" stroke="#90A4AE" stroke-width="3" transform="rotate(${a + 20} 66 64)"/>`).join('')}
<circle cx="66" cy="64" r="6" fill="#90A4AE"/><circle cx="128" cy="150" r="20" fill="#66BB6A" stroke="#2E7D32" stroke-width="4"/><rect x="124" y="164" width="8" height="18" fill="#795548"/>`,
};

export function worldIconSVG(id, scale = 1) {
  return svgDoc(200, 200, WORLD_ART[id], scale);
}
