// Personajes de EcoMisión dibujados como SVG. Cada función devuelve el SVG
// del personaje con la expresión pedida; BootScene los convierte en texturas.
const INK = '#17324D';

export const EXPRESSIONS = ['happy', 'talk', 'wow', 'sad', 'blink', 'sneaky', 'oops'];

export function svgDoc(w, h, body, scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

// Cara expresiva compartida: ojos, cejas y boca según la expresión.
export function face({ cx, ey, my, gap, r = 34, expr = 'happy', ink = INK }) {
  let s = '';
  for (const side of [-1, 1]) {
    const x = cx + side * gap;
    if (expr === 'blink') {
      s += `<path d="M ${x - r * 0.8} ${ey} Q ${x} ${ey + r * 0.8} ${x + r * 0.8} ${ey}" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>`;
    } else {
      const pr = expr === 'wow' ? r * 0.4 : r * 0.56;
      const py = expr === 'sad' ? ey + r * 0.25 : ey;
      const px = expr === 'sneaky' ? x - side * r * 0.2 : x;
      s += `<ellipse cx="${x}" cy="${ey}" rx="${r}" ry="${r * 1.15}" fill="#fff" stroke="${ink}" stroke-width="6"/>`;
      s += `<circle cx="${px}" cy="${py}" r="${pr}" fill="${ink}"/><circle cx="${px - pr * 0.35}" cy="${py - pr * 0.35}" r="${pr * 0.33}" fill="#fff"/>`;
    }
    // Cejas: "inner" es el extremo cercano al centro de la cara.
    const outer = x + side * r, inner = x - side * r * 0.8;
    if (expr === 'sad' || expr === 'oops') {
      s += `<path d="M ${outer} ${ey - r * 1.45} L ${inner} ${ey - r * 1.95}" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>`;
    } else if (expr === 'sneaky') {
      s += `<path d="M ${outer} ${ey - r * 1.9} L ${inner} ${ey - r * 1.05}" stroke="${ink}" stroke-width="12" stroke-linecap="round"/>`;
    }
  }
  const m = { fill: '#7A2E3A', tongue: '#FF8FA3' };
  switch (expr) {
    case 'talk':
      s += `<ellipse cx="${cx}" cy="${my + 14}" rx="26" ry="30" fill="${m.fill}" stroke="${ink}" stroke-width="6"/><ellipse cx="${cx}" cy="${my + 30}" rx="15" ry="11" fill="${m.tongue}"/>`;
      break;
    case 'wow':
      s += `<ellipse cx="${cx}" cy="${my + 14}" rx="17" ry="22" fill="${m.fill}" stroke="${ink}" stroke-width="6"/>`;
      break;
    case 'sad':
      s += `<path d="M ${cx - 32} ${my + 26} Q ${cx} ${my - 6} ${cx + 32} ${my + 26}" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>`;
      break;
    case 'sneaky':
      s += `<path d="M ${cx - 52} ${my} Q ${cx} ${my + 56} ${cx + 52} ${my} Z" fill="#fff" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/>`;
      s += `<path d="M ${cx - 18} ${my + 3} V ${my + 24} M ${cx + 18} ${my + 3} V ${my + 24}" stroke="${ink}" stroke-width="5"/>`;
      break;
    case 'oops':
      s += `<path d="M ${cx - 44} ${my + 16} q 11 -18 22 0 t 22 0 t 22 0 t 22 0" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>`;
      break;
    default: // happy, blink
      s += `<path d="M ${cx - 40} ${my} Q ${cx} ${my + 54} ${cx + 40} ${my} Z" fill="${m.fill}" stroke="${ink}" stroke-width="6" stroke-linejoin="round"/><ellipse cx="${cx}" cy="${my + 19}" rx="15" ry="8" fill="${m.tongue}"/>`;
  }
  return s;
}

// ECO: pequeño guardián con forma de brote.
export function ecoSVG(expr = 'happy', scale = 1) {
  const o = '#14804A';
  return svgDoc(400, 460, `
<defs><radialGradient id="eb" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#A6F5B2"/><stop offset="1" stop-color="#2BB673"/></radialGradient></defs>
<path d="M200 135 C194 105 198 85 205 64" stroke="${o}" stroke-width="11" fill="none" stroke-linecap="round"/>
<path d="M205 66 C150 62 118 34 114 8 C164 4 201 24 205 66Z" fill="#5FD068" stroke="${o}" stroke-width="7" stroke-linejoin="round"/>
<path d="M205 66 C252 72 288 52 300 22 C256 10 214 28 205 66Z" fill="#9BE564" stroke="${o}" stroke-width="7" stroke-linejoin="round"/>
<ellipse cx="148" cy="428" rx="48" ry="22" fill="#1E9A5E" stroke="${o}" stroke-width="7"/>
<ellipse cx="252" cy="428" rx="48" ry="22" fill="#1E9A5E" stroke="${o}" stroke-width="7"/>
<ellipse cx="58" cy="300" rx="28" ry="46" fill="#2BB673" stroke="${o}" stroke-width="7" transform="rotate(24 58 300)"/>
<ellipse cx="342" cy="300" rx="28" ry="46" fill="#2BB673" stroke="${o}" stroke-width="7" transform="rotate(-24 342 300)"/>
<ellipse cx="200" cy="278" rx="142" ry="150" fill="url(#eb)" stroke="${o}" stroke-width="8"/>
<ellipse cx="200" cy="350" rx="86" ry="62" fill="#E2FBE2" opacity="0.65"/>
<circle cx="102" cy="302" r="22" fill="#FF9AA2" opacity="0.75"/><circle cx="298" cy="302" r="22" fill="#FF9AA2" opacity="0.75"/>
${face({ cx: 200, ey: 248, my: 306, gap: 56, expr })}`, scale);
}

// RECICLÍN: robot-caneca que enseña a clasificar.
export function reciclinSVG(expr = 'happy', scale = 1) {
  const o = '#0D5EA8';
  let arrows = '';
  for (let i = 0; i < 3; i++) {
    arrows += `<g transform="rotate(${i * 120} 200 338)"><path d="M 200 306 A 32 32 0 0 1 227.7 354" stroke="#fff" stroke-width="11" fill="none" stroke-linecap="round"/><polygon points="219,369 238,360 219,347" fill="#fff"/></g>`;
  }
  return svgDoc(400, 460, `
<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5CCBFA"/><stop offset="1" stop-color="#1E88E5"/></linearGradient></defs>
<path d="M200 96 V 62" stroke="${o}" stroke-width="9" stroke-linecap="round"/>
<circle cx="200" cy="48" r="20" fill="#FFD23F" stroke="${o}" stroke-width="7"/>
<circle cx="140" cy="428" r="26" fill="#17324D"/><circle cx="260" cy="428" r="26" fill="#17324D"/>
<circle cx="140" cy="428" r="10" fill="#9AA7B1"/><circle cx="260" cy="428" r="10" fill="#9AA7B1"/>
<rect x="38" y="232" width="52" height="96" rx="26" fill="#3FA9F0" stroke="${o}" stroke-width="7"/>
<rect x="310" y="232" width="52" height="96" rx="26" fill="#3FA9F0" stroke="${o}" stroke-width="7"/>
<rect x="82" y="138" width="236" height="282" rx="54" fill="url(#rb)" stroke="${o}" stroke-width="8"/>
<rect x="64" y="96" width="272" height="62" rx="31" fill="#9ADFFF" stroke="${o}" stroke-width="8"/>
<rect x="108" y="178" width="184" height="112" rx="34" fill="#EAF8FF" stroke="${o}" stroke-width="6"/>
${face({ cx: 200, ey: 220, my: 248, gap: 44, r: 20, expr })}
${arrows}`, scale);
}

// CONTAMINATOR: nube de mugre traviesa (antagonista divertido, no aterrador).
export function contaminatorSVG(expr = 'sneaky', scale = 1) {
  const o = '#3F3266';
  const puffs = [[220, 262, 124], [118, 286, 78], [322, 286, 78], [152, 186, 78], [280, 178, 84], [220, 348, 88], [140, 356, 60], [300, 356, 60]];
  const outline = puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 8}" fill="${o}"/>`).join('');
  const fill = puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#cb)"/>`).join('');
  return svgDoc(440, 460, `
<defs><radialGradient id="cb" cx="220" cy="200" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#B9A7E8"/><stop offset="1" stop-color="#6C5A9E"/></radialGradient></defs>
<path d="M70 150 q -14 -22 0 -44 q 14 -22 0 -44" stroke="#9BC53D" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>
<path d="M382 140 q 14 -22 0 -44 q -14 -22 0 -44" stroke="#9BC53D" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>
${outline}${fill}
<path d="M196 112 C 150 96 120 110 104 136 C 140 128 168 132 192 146 Z" fill="#FFD23F" stroke="#B8860B" stroke-width="6" stroke-linejoin="round"/>
<path d="M214 108 C 250 78 292 82 316 104 C 280 106 252 118 234 140 Z" fill="#FFE066" stroke="#B8860B" stroke-width="6" stroke-linejoin="round"/>
<path d="M190 146 C 196 118 214 104 236 104 C 240 122 236 138 234 146 Z" fill="#FFD23F" stroke="#B8860B" stroke-width="6" stroke-linejoin="round"/>
<path d="M214 104 l 4 -24" stroke="#6B4F1D" stroke-width="9" stroke-linecap="round"/>
<circle cx="372" cy="196" r="7" fill="${INK}"/><ellipse cx="364" cy="186" rx="9" ry="5" fill="#fff" opacity="0.85"/><ellipse cx="381" cy="186" rx="9" ry="5" fill="#fff" opacity="0.85"/>
${face({ cx: 220, ey: 250, my: 312, gap: 56, r: 32, expr })}`, scale);
}

// Avatares del jugador: animales guardianes.
export function avatarSVG(kind, scale = 1) {
  const defs = {
    rana: { c: '#5FD068', o: '#1E7F3C' },
    oso: { c: '#8D5A3B', o: '#4E2F1C' },
    jaguar: { c: '#F6B93B', o: '#9C6A0C' },
    zorro: { c: '#FF8A3D', o: '#A84A10' },
    mono: { c: '#8D6E63', o: '#4E342E' },
    tortuga: { c: '#8BC34A', o: '#3F6B1B' },
    buho: { c: '#9575CD', o: '#4A2F8A' },
  };
  const { c, o } = defs[kind];
  let back = '', front = '', eyeY = 150, gap = 46;
  if (kind === 'rana') {
    back = `<circle cx="98" cy="88" r="46" fill="${c}" stroke="${o}" stroke-width="7"/><circle cx="202" cy="88" r="46" fill="${c}" stroke="${o}" stroke-width="7"/>`;
    front = `<circle cx="80" cy="196" r="16" fill="#FF9AA2" opacity="0.7"/><circle cx="220" cy="196" r="16" fill="#FF9AA2" opacity="0.7"/>`;
    eyeY = 92; gap = 52;
  } else if (kind === 'oso') {
    back = `<circle cx="66" cy="78" r="38" fill="${c}" stroke="${o}" stroke-width="7"/><circle cx="234" cy="78" r="38" fill="${c}" stroke="${o}" stroke-width="7"/>`;
    front = `<ellipse cx="104" cy="150" rx="44" ry="48" fill="#F3DDB8"/><ellipse cx="196" cy="150" rx="44" ry="48" fill="#F3DDB8"/><ellipse cx="150" cy="212" rx="52" ry="42" fill="#F3DDB8"/><ellipse cx="150" cy="186" rx="16" ry="11" fill="${INK}"/>`;
  } else if (kind === 'jaguar') {
    back = `<circle cx="68" cy="76" r="36" fill="${c}" stroke="${o}" stroke-width="7"/><circle cx="232" cy="76" r="36" fill="${c}" stroke="${o}" stroke-width="7"/>`;
    front = `<ellipse cx="150" cy="212" rx="56" ry="42" fill="#FFF3D6"/><ellipse cx="150" cy="186" rx="15" ry="10" fill="#D9576B"/>` +
      [[86, 96], [150, 78], [214, 96], [60, 170], [240, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#6B3E07" stroke-width="7"/>`).join('');
  } else if (kind === 'mono') {
    back = `<circle cx="38" cy="160" r="36" fill="${c}" stroke="${o}" stroke-width="7"/><circle cx="262" cy="160" r="36" fill="${c}" stroke="${o}" stroke-width="7"/><circle cx="38" cy="160" r="18" fill="#F3DDB8"/><circle cx="262" cy="160" r="18" fill="#F3DDB8"/>`;
    front = `<path d="M150 96 Q 92 92 84 150 Q 60 236 150 256 Q 240 236 216 150 Q 208 92 150 96 Z" fill="#F3DDB8"/><ellipse cx="150" cy="190" rx="10" ry="6" fill="#5D4037"/><path d="M130 62 Q150 40 170 62" fill="none" stroke="${o}" stroke-width="7" stroke-linecap="round"/>`;
  } else if (kind === 'tortuga') {
    front = `<circle cx="78" cy="198" r="16" fill="#FF9AA2" opacity="0.7"/><circle cx="222" cy="198" r="16" fill="#FF9AA2" opacity="0.7"/>` +
      [[150, 74], [104, 92], [196, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="15" fill="#689F38" opacity="0.8"/>`).join('');
  } else if (kind === 'buho') {
    back = `<path d="M56 110 L62 34 L124 76 Z" fill="${c}" stroke="${o}" stroke-width="7" stroke-linejoin="round"/><path d="M244 110 L238 34 L176 76 Z" fill="${c}" stroke="${o}" stroke-width="7" stroke-linejoin="round"/>`;
    front = `<circle cx="104" cy="150" r="46" fill="#EDE7F6"/><circle cx="196" cy="150" r="46" fill="#EDE7F6"/><ellipse cx="150" cy="232" rx="56" ry="30" fill="#D1C4E9"/><path d="M134 178 L166 178 L150 204 Z" fill="#FF9800" stroke="#B26A00" stroke-width="5" stroke-linejoin="round"/>`;
  } else {
    back = `<path d="M40 130 L52 22 L128 84 Z" fill="${c}" stroke="${o}" stroke-width="7" stroke-linejoin="round"/><path d="M260 130 L248 22 L172 84 Z" fill="${c}" stroke="${o}" stroke-width="7" stroke-linejoin="round"/>`;
    front = `<path d="M44 190 Q 96 168 150 214 Q 204 168 256 190 Q 236 262 150 268 Q 64 262 44 190 Z" fill="#FFF6EC"/><ellipse cx="150" cy="200" rx="15" ry="11" fill="${INK}"/>`;
  }
  const mouthY = kind === 'rana' ? 178 : kind === 'buho' ? 222 : 214;
  return svgDoc(300, 300, `
${back}
<circle cx="150" cy="162" r="112" fill="${c}" stroke="${o}" stroke-width="8"/>
${front}
${face({ cx: 150, ey: eyeY, my: mouthY, gap, r: 22, expr: 'happy' }).replace(/stroke-width="6"/g, 'stroke-width="5"')}`, scale);
}

// Accesorios: se dibujan encima del avatar, en su mismo recuadro de 300x300.
// La rana tiene los ojos más arriba, así que las gafas se le suben.
export function accessorySVG(kind, avatar = 'oso', scale = 1) {
  const L = `stroke="${INK}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
  const art = {
    gorra: `<path d="M62 92 Q 66 22 150 22 Q 234 22 238 92 Z" fill="#E53935" ${L}/><path d="M150 22 V92" stroke="#B71C1C" stroke-width="5"/>
<path d="M56 92 Q 150 70 244 92 Q 286 100 292 122 Q 236 104 150 106 Q 92 106 56 92 Z" fill="#C62828" ${L}/><circle cx="150" cy="24" r="10" fill="#FFD23F" ${L}/>`,
    'mono-lazo': `<path d="M150 262 L96 236 V290 Z" fill="#E53935" ${L}/><path d="M150 262 L204 236 V290 Z" fill="#E53935" ${L}/><circle cx="150" cy="262" r="14" fill="#FFD23F" ${L}/>`,
    gafas: `<g transform="translate(0 ${avatar === 'rana' ? -58 : 0})"><rect x="66" y="126" width="76" height="52" rx="20" fill="#17324D" ${L}/><rect x="158" y="126" width="76" height="52" rx="20" fill="#17324D" ${L}/>
<path d="M142 146 H158 M66 146 L44 138 M234 146 L256 138" ${L} fill="none"/><path d="M80 140 l18 -8 M172 140 l18 -8" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.7"/></g>`,
    corona: [[62, 96, -50], [96, 64, -26], [150, 50, 0], [204, 64, 26], [238, 96, 50]].map(([x, y, a], i) =>
      `<path d="M0 0 C -22 -18 -22 -48 0 -66 C 22 -48 22 -18 0 0 Z" fill="${i % 2 ? '#8BE04E' : '#3FAE6A'}" ${L} transform="translate(${x} ${y}) rotate(${a})"/>`).join('') +
      `<circle cx="150" cy="54" r="11" fill="#FFD23F" ${L}/>`,
    capa: `<path d="M40 226 Q 4 262 10 300 H110 Q 84 268 92 240 Z" fill="#2BB673" ${L}/><path d="M260 226 Q 296 262 290 300 H190 Q 216 268 208 240 Z" fill="#2BB673" ${L}/>
<path d="M150 250 l8 16 18 2 -13 12 4 18 -17 -9 -17 9 4 -18 -13 -12 18 -2 z" fill="#FFD23F" ${L}/>`,
  };
  return svgDoc(300, 300, art[kind], scale);
}

export const CHARACTER_SVG = { eco: ecoSVG, reciclin: reciclinSVG, contaminator: contaminatorSVG };
