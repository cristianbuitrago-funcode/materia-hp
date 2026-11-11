// Dibujos vectoriales de los residuos (viewBox 200x200) y de las canecas (300x360).
import { svgDoc } from './characters.js';

const INK = '#17324D';
const L = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const line = (color = INK, width = 4) => `stroke="${color}" stroke-width="${width}" stroke-linecap="round" fill="none"`;

const ART = {
  botella: `<rect x="84" y="14" width="32" height="20" rx="5" fill="#1E88E5" ${L}/>
<path d="M88 34 V52 Q62 66 62 92 V172 Q62 186 76 186 H124 Q138 186 138 172 V92 Q138 66 112 52 V34 Z" fill="#BFE6FA" ${L}/>
<rect x="62" y="104" width="76" height="40" fill="#42A5F5" ${L}/>
<path d="M76 70 Q72 80 72 92" ${line('#fff')}/>`,
  lata: `<path d="M56 46 V160 Q56 180 100 180 Q144 180 144 160 V46 Z" fill="#EF5350" ${L}/>
<ellipse cx="100" cy="46" rx="44" ry="16" fill="#CFD8DC" ${L}/>
<ellipse cx="108" cy="46" rx="12" ry="5" fill="${INK}"/>
<path d="M56 92 Q100 112 144 92 V124 Q100 144 56 124 Z" fill="#fff" ${L}/>`,
  carton: `<path d="M30 76 L100 54 L170 76 V156 L100 182 L30 156 Z" fill="#C89B6A" ${L}/>
<path d="M30 76 L100 100 L170 76 M100 100 V182" fill="none" ${L}/>
<path d="M30 76 L14 52 L84 32 L100 54 M170 76 L186 52 L116 32 L100 54" fill="#DDB483" ${L}/>
<path d="M62 87 V118" stroke="#8A6238" stroke-width="12"/>`,
  periodico: `<path d="M26 56 L160 40 L176 150 L42 168 Z" fill="#ECEFF1" ${L}/>
<path d="M44 70 L150 58" stroke="${INK}" stroke-width="14"/>
<rect x="50" y="88" width="46" height="36" fill="#90A4AE" transform="rotate(-7 73 106)"/>
<path d="M108 88 L156 82 M110 102 L158 96 M112 116 L160 110 M54 136 L162 124 M56 150 L164 138" ${line()}/>`,
  vidrio: `<rect x="86" y="12" width="28" height="16" rx="4" fill="#FFD23F" ${L}/>
<path d="M88 28 V70 Q64 86 64 112 V172 Q64 186 78 186 H122 Q136 186 136 172 V112 Q136 86 112 70 V28 Z" fill="#66BB6A" ${L}/>
<path d="M78 104 Q74 120 74 150" ${line('#DFF5E1')}/>
<rect x="76" y="126" width="48" height="34" rx="6" fill="#FFF9E8" ${L}/>`,
  papel: `<path d="M44 22 H132 L160 50 V178 H44 Z" fill="#fff" ${L}/>
<path d="M132 22 V50 H160" fill="#CFD8DC" ${L}/>
<path d="M62 72 H140 M62 94 H140 M62 116 H140 M62 138 H112" ${line('#64B5F6')}/>`,
  tetrapak: `<path d="M56 74 L100 40 L144 74 V180 H56 Z" fill="#fff" ${L}/>
<path d="M56 74 H144 M78 40 H122 L144 74 M78 40 L56 74 M78 40 V26 H122 V40" fill="#E3F2FD" ${L}/>
<rect x="56" y="100" width="88" height="46" fill="#42A5F5" ${L}/>
<circle cx="100" cy="123" r="13" fill="#fff"/>`,
  frasco: `<rect x="62" y="24" width="76" height="26" rx="8" fill="#FF8A3D" ${L}/>
<path d="M70 50 Q52 62 52 82 V166 Q52 184 70 184 H130 Q148 184 148 166 V82 Q148 62 130 50 Z" fill="#DDF3FB" ${L}/>
<path d="M68 82 Q64 110 66 150" ${line('#fff')}/>
<rect x="80" y="100" width="56" height="44" rx="8" fill="#FFF9E8" ${L}/>`,
  banano: `<path d="M94 20 L110 20 L112 52 Q150 70 172 150 Q150 150 130 118 Q128 160 104 188 Q86 160 88 118 Q64 148 28 150 Q50 76 92 52 Z" fill="#FFD23F" ${L}/>
<path d="M102 56 Q108 100 104 150 M94 60 Q70 86 52 128 M110 60 Q134 86 150 128" ${line('#C99A00')}/>
<rect x="94" y="14" width="16" height="14" rx="3" fill="#7A5236" ${L}/>`,
  manzana: `<path d="M100 44 Q112 28 124 26" ${line('#7A5236', 7)}/>
<path d="M52 66 Q54 40 82 42 Q100 50 118 42 Q146 40 148 66 Q128 78 122 100 Q128 122 146 136 Q142 170 116 168 Q100 160 84 168 Q58 170 54 136 Q72 122 78 100 Q72 78 52 66 Z" fill="#FFF3D6" ${L}/>
<path d="M52 66 Q54 40 82 42 Q100 50 118 42 Q146 40 148 66 Q100 82 52 66 Z" fill="#EF5350" ${L}/>
<path d="M54 136 Q100 120 146 136 Q142 170 116 168 Q100 160 84 168 Q58 170 54 136 Z" fill="#EF5350" ${L}/>
<ellipse cx="92" cy="102" rx="5" ry="9" fill="#5D4037"/><ellipse cx="108" cy="102" rx="5" ry="9" fill="#5D4037"/>`,
  comida: `<path d="M24 100 L62 72 V128 Z" fill="#B0BEC5" ${L}/>
<path d="M62 100 H150" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
<path d="M78 70 V130 M98 64 V136 M118 68 V132 M136 76 V124" ${line(INK, 7)}/>
<path d="M146 66 Q186 76 186 100 Q186 124 146 134 Z" fill="#CFD8DC" ${L}/>
<circle cx="164" cy="94" r="6" fill="${INK}"/>`,
  huevo: `<path d="M28 96 L46 78 L62 98 L80 76 L96 98 Q96 150 62 150 Q28 150 28 96 Z" fill="#FFF3E0" ${L}/>
<path d="M106 108 L122 88 L138 106 L154 86 L174 110 Q168 164 136 160 Q104 156 106 108 Z" fill="#FFE8CC" ${L} transform="rotate(14 140 124)"/>
<path d="M88 54 L98 42 L108 56 Z" fill="#FFF3E0" ${L}/>`,
  hojas: `<path d="M30 120 Q34 56 100 40 Q104 104 46 132 Z" fill="#D98C3B" ${L}/>
<path d="M36 126 Q64 86 96 48" ${line('#7A4A16')}/>
<path d="M92 164 Q88 100 150 70 Q176 132 112 172 Z" fill="#B5651D" ${L}/>
<path d="M98 168 Q120 120 148 78 M116 136 L140 138 M128 114 L112 104" ${line('#5E3209')}/>`,
  cafe: `<path d="M26 60 H174 L122 180 H78 Z" fill="#E8D5B5" ${L}/>
<path d="M44 76 Q100 110 156 76 L140 112 Q100 134 60 112 Z" fill="#5D4037" ${L}/>
<circle cx="84" cy="96" r="4" fill="#3E2723"/><circle cx="110" cy="104" r="4" fill="#3E2723"/><circle cx="128" cy="92" r="4" fill="#3E2723"/>
<path d="M72 140 L80 172 M128 140 L120 172" ${line('#BFA57A')}/>`,
  higienico: `<path d="M40 60 V140 Q40 164 84 164 H130 V60 Z" fill="#fff" ${L}/>
<ellipse cx="84" cy="60" rx="44" ry="24" fill="#F5F5F5" ${L}/>
<ellipse cx="84" cy="60" rx="15" ry="8" fill="#BCAAA4" ${L}/>
<path d="M128 60 H168 V176 Q156 168 148 178 Q140 186 130 176 Z" fill="#fff" ${L}/>
<path d="M130 100 H168 M130 140 H168" ${line('#90A4AE')} stroke-dasharray="4 8"/>
<circle cx="150" cy="158" r="8" fill="#C9A66B" opacity="0.8"/>`,
  servilleta: `<path d="M40 66 L84 34 L120 52 L162 44 L172 96 L156 140 L168 170 L112 160 L72 176 L34 150 L46 108 Z" fill="#fff" ${L}/>
<path d="M84 34 L96 84 L46 108 M96 84 L156 140 M96 84 L120 52 M112 160 L104 120" ${line('#B0BEC5')}/>
<circle cx="126" cy="96" r="14" fill="#FF8A3D" opacity="0.85"/><circle cx="74" cy="134" r="10" fill="#D84315" opacity="0.8"/><circle cx="140" cy="126" r="6" fill="#FFB300"/>`,
  papas: `<path d="M48 30 L60 22 L72 30 L84 22 L96 30 L108 22 L120 30 L132 22 L144 30 L156 22 Q146 100 164 172 L152 180 L140 172 L128 180 L116 172 L104 180 L92 172 L80 180 L68 172 L56 180 L44 172 Q58 100 48 30 Z" fill="#E53935" ${L}/>
<path d="M62 44 Q72 100 60 160" ${line('#FFCDD2')}/>
<ellipse cx="106" cy="100" rx="34" ry="26" fill="#FFD23F" ${L}/>
<path d="M88 100 Q106 84 124 100 Q106 116 88 100 Z" fill="#F9A825"/>`,
  tapabocas: `<path d="M52 76 Q16 76 22 104 Q26 124 52 124 M148 76 Q184 76 178 104 Q174 124 148 124" ${line(INK, 6)}/>
<path d="M50 62 Q100 44 150 62 V138 Q100 158 50 138 Z" fill="#81D4FA" ${L}/>
<path d="M54 86 Q100 72 146 86 M54 104 Q100 92 146 104 M54 122 Q100 112 146 122" ${line('#0277BD')}/>
<circle cx="120" cy="128" r="7" fill="#8D6E63" opacity="0.7"/>`,
  pizza: `<path d="M22 96 L44 30 H156 L178 96 Z" fill="#DDB483" ${L}/>
<rect x="22" y="96" width="156" height="84" rx="4" fill="#C89B6A" ${L}/>
<ellipse cx="78" cy="134" rx="24" ry="16" fill="#8A6238" opacity="0.75"/><ellipse cx="132" cy="150" rx="18" ry="12" fill="#8A6238" opacity="0.75"/><ellipse cx="128" cy="116" rx="10" ry="7" fill="#8A6238" opacity="0.6"/>
<circle cx="96" cy="60" r="9" fill="#D84315" opacity="0.8"/><circle cx="124" cy="72" r="6" fill="#FFB300"/>
<path d="M56 150 l10 4 M100 164 l12 -2 M150 128 l8 6" ${line('#FFE082', 5)}/>`,
  icopor: `<path d="M24 92 L46 40 H154 L176 92 Z" fill="#FAFAFA" ${L}/>
<path d="M24 92 H176 L164 164 Q162 174 152 174 H48 Q38 174 36 164 Z" fill="#fff" ${L}/>
<path d="M40 112 H160" ${line('#CFD8DC')}/>
<path d="M62 60 Q80 46 96 62 Q112 76 132 58" ${line('#D84315', 9)}/>
<circle cx="84" cy="140" r="12" fill="#FFB300" opacity="0.85"/><circle cx="124" cy="134" r="8" fill="#7CB342"/><circle cx="108" cy="152" r="6" fill="#D84315"/>`,
};

export function wasteSVG(id, scale = 1) {
  return svgDoc(200, 200, ART[id], scale);
}
export const WASTE_ART_IDS = Object.keys(ART);

// Símbolos de las canecas: se dibujan dentro de un círculo en el frente.
function symbol(kind, c) {
  if (kind === 'reciclar') {
    let s = '';
    for (let i = 0; i < 3; i++) {
      s += `<g transform="rotate(${i * 120} 150 222)"><path d="M150 190 A32 32 0 0 1 177.7 238" stroke="${c}" stroke-width="11" fill="none" stroke-linecap="round"/><polygon points="169,253 188,244 169,231" fill="${c}"/></g>`;
    }
    return s;
  }
  if (kind === 'equis') return `<path d="M128 200 L172 244 M172 200 L128 244" stroke="${c}" stroke-width="14" stroke-linecap="round"/>`;
  return `<path d="M150 262 C118 248 114 206 150 184 C186 206 182 248 150 262 Z" fill="${c}"/><path d="M150 262 V214" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
}

const BIN_STYLE = {
  white: { body: '#FFFFFF', shade: '#DCE3EA', line: '#5F7183', plate: '#1E88E5', sym: '#FFFFFF', symbol: 'reciclar' },
  black: { body: '#3A4048', shade: '#23272D', line: '#0E1114', plate: '#F1F3F5', sym: '#23272D', symbol: 'equis' },
  green: { body: '#35BF6E', shade: '#249A55', line: '#0F6A3A', plate: '#FFFFFF', sym: '#249A55', symbol: 'hoja' },
};

export function binSVG(id, scale = 1) {
  const s = BIN_STYLE[id];
  const ln = `stroke="${s.line}" stroke-width="8" stroke-linejoin="round"`;
  return svgDoc(300, 360, `
<rect x="118" y="10" width="64" height="40" rx="14" fill="${s.shade}" ${ln}/>
<path d="M44 84 H256 L238 336 Q236 350 222 350 H78 Q64 350 62 336 Z" fill="${s.body}" ${ln}/>
<path d="M206 88 L194 346 H222 Q236 346 238 336 L256 88 Z" fill="${s.shade}" opacity="0.9"/>
<path d="M84 110 L92 320 M216 110 L208 320" stroke="${s.shade}" stroke-width="8" stroke-linecap="round"/>
<rect x="22" y="40" width="256" height="50" rx="22" fill="${s.body}" ${ln}/>
<rect x="34" y="48" width="170" height="12" rx="6" fill="#fff" opacity="${id === 'white' ? 0 : 0.25}"/>
<circle cx="150" cy="222" r="60" fill="${s.plate}" stroke="${s.line}" stroke-width="6"/>
${symbol(s.symbol, s.sym)}`, scale);
}
