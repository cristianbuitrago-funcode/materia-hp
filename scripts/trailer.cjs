// Genera el tráiler de 30 segundos con imágenes reales del juego.
// Uso: npm run build && node scripts/trailer.cjs [carpeta-de-trabajo]   (requiere Playwright, Chromium y ffmpeg)
// Salida: media/trailer-ecomision.mp4
//
// El juego se avanza fotograma a fotograma con un reloj virtual (30 por segundo)
// y se captura cada uno, de modo que el video queda fluido aunque el navegador
// de pruebas dibuje despacio. Sobre las imágenes reales del juego se añaden:
//   · un marco que flota y gira en 3D (transformaciones CSS con perspectiva),
//   · un planeta 3D con objetos en órbita para la apertura y el cierre,
//   · transiciones entre secciones (barrido tricolor de las canecas, giro de
//     tarjeta, cierre en círculo, barrido rápido) y rótulos de impacto,
//   · sacudida y destello cuando el jefe recibe un golpe.
// La música es el tema principal del propio juego, sintetizado con sus notas,
// con acentos de sonido en las transiciones.
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const WORK = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'ecomision-trailer-'));
const FRAMES = path.join(WORK, 'frames');
const OUT = path.join(ROOT, 'media', 'trailer-ecomision.mp4');
const FPS = 30, PORT = 4190;

// Partida de demostración: ciudad casi recuperada, bosque a medias, océano recién abierto.
const SAVE = {
  version: 1, settings: { music: false, sfx: false }, storySeen: true,
  profile: { nickname: 'Jaguar Valiente', ageMode: 'adventurer', avatar: 'jaguar', accessory: 'gorra', frame: 'f-cielo' },
  rewards: { unlockedBadges: ['first', 'stars', 'album15'], unlockedCharacters: ['mono'], unlockedAccessories: ['gorra', 'gafas'], unlockedFrames: ['f-cielo'] },
  progress: {
    experience: 540, ecoCoins: 85, roundsPlayed: 9, correctAnswers: 70, incorrectAnswers: 9,
    unlockedWorlds: ['city', 'forest', 'ocean'],
    learnedWasteTypes: ['botella', 'lata', 'carton', 'periodico', 'vidrio', 'papel', 'tapa', 'banano', 'manzana', 'comida', 'naranja', 'hojas', 'higienico', 'servilleta', 'chicle', 'papas'],
    missionProgress: { 'city-1': { stars: 3, plays: 1 }, 'city-2': { stars: 3, plays: 1 }, 'city-3': { stars: 2, plays: 1 }, 'city-4': { stars: 3, plays: 1 },
      'forest-1': { stars: 3, plays: 1 }, 'forest-2': { stars: 2, plays: 1 }, 'forest-3': { stars: 3, plays: 1 } },
  },
};

// ---- Código que corre dentro de la página: reloj virtual, marco 3D del juego y efectos.
function installInPage() {
  const g = window.__ECOMISION__;
  g.loop.stop();
  // Reloj virtual: las animaciones de Phaser usan Date.now(), así que también se controla.
  let now = Date.now();
  Date.now = () => now;
  const W = 1920, H = 1080;
  const mk = (tag, css, parent = document.body) => { const e = document.createElement(tag); e.style.cssText = css; parent.appendChild(e); return e; };
  const bg = mk('canvas', 'position:fixed;left:0;top:0;z-index:0'); bg.width = W; bg.height = H;
  const fx = mk('canvas', 'position:fixed;left:0;top:0;z-index:3;pointer-events:none'); fx.width = W; fx.height = H;
  const band = mk('div', 'position:fixed;left:0;right:0;top:944px;height:136px;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Fredoka,sans-serif;color:#fff;text-align:center;text-shadow:0 4px 0 #062a19,0 0 18px rgba(0,0,0,.55)');
  band.innerHTML = '<div id="tr-cap" style="font-weight:700;font-size:54px;line-height:1.1"></div><div id="tr-sub" style="font-weight:500;font-size:29px;color:#bff5cf;margin-top:6px"></div>';
  const gameEl = document.getElementById('game');
  const touch = mk('div', 'position:absolute;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;border:6px solid #fff;background:rgba(255,255,255,.4);box-shadow:0 0 0 4px rgba(23,50,77,.5);display:none;pointer-events:none;z-index:5', gameEl);
  const cap = document.getElementById('tr-cap'), sub = document.getElementById('tr-sub');
  const B = bg.getContext('2d'), F = fx.getContext('2d');
  const img = (key) => g.textures.get(key).getSourceImage();
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const outBack = (p) => { p = clamp(p); const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const rnd = (i) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
  const markup = (t) => (t || '').replace(/\*(.+?)\*/g, '<span style="color:#FFD23F">$1</span>');

  // ---------- Fondo animado: degradado verde con hojas que flotan.
  function drawBg(n) {
    const gr = B.createRadialGradient(W / 2, 420, 100, W / 2, 520, 1200);
    gr.addColorStop(0, '#15804a'); gr.addColorStop(0.55, '#0b4a2b'); gr.addColorStop(1, '#052214');
    B.fillStyle = gr; B.fillRect(0, 0, W, H);
    for (let i = 0; i < 34; i++) {
      const x = (rnd(i) * W + n * (0.6 + rnd(i + 9) * 1.4)) % (W + 120) - 60;
      const y = (rnd(i + 3) * H + n * (0.5 + rnd(i + 5))) % (H + 120) - 60;
      B.save(); B.translate(x, y); B.rotate(n * 0.02 * (rnd(i + 7) - 0.5) * 4 + i);
      B.globalAlpha = 0.1 + rnd(i + 11) * 0.16;
      B.fillStyle = i % 3 ? '#7ed957' : '#ffd23f';
      B.beginPath(); B.ellipse(0, 0, 26 + rnd(i) * 22, 11 + rnd(i) * 8, 0, 0, Math.PI * 2); B.fill();
      B.restore();
    }
    B.globalAlpha = 1;
  }

  // ---------- Planeta en 3D: esfera sombreada píxel a píxel, con objetos en órbita.
  const PR = 280, pc = document.createElement('canvas'); pc.width = pc.height = PR * 2;
  const P = pc.getContext('2d'), pd = P.createImageData(PR * 2, PR * 2);
  const mix = (a, b, t) => a + (b - a) * t;
  function renderPlanet(rot, dirty) {
    const d = pd.data, L = [-0.48, -0.55, 0.68], tilt = 0.36, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let py = 0; py < PR * 2; py++) for (let px = 0; px < PR * 2; px++) {
      const x = (px - PR + 0.5) / PR, y = (py - PR + 0.5) / PR, r2 = x * x + y * y, o = (py * PR * 2 + px) * 4;
      if (r2 > 1) { d[o + 3] = 0; continue; }
      const z = Math.sqrt(1 - r2);
      const yy = y * ct - z * st, zz = y * st + z * ct; // inclinación del eje
      const lat = Math.asin(clamp(yy, -1, 1)), lon = Math.atan2(x, zz) + rot;
      const land = Math.sin(3 * lon + 1.3) * Math.cos(2.2 * lat) + 0.6 * Math.sin(5.1 * lon - 2 * lat + 0.7) + 0.4 * Math.cos(7 * lat + 2.3 * lon);
      const cloud = Math.sin(4 * lon + rot * 0.6) * Math.sin(6 * lat + 1) + 0.5 * Math.sin(9 * lon - 3 * lat);
      let R, G, Bc;
      if (Math.abs(lat) > 1.25) { R = 240; G = 246; Bc = 250; }
      else if (land > 0.25) { R = mix(72, 132, dirty); G = mix(186, 112, dirty); Bc = mix(104, 78, dirty); }
      else { R = mix(36, 88, dirty); G = mix(140, 104, dirty); Bc = mix(232, 112, dirty); }
      if (cloud > 0.95) { const c = mix(255, 120, dirty), a = 0.7; R = mix(R, c, a); G = mix(G, c * (dirty ? 0.92 : 1), a); Bc = mix(Bc, c * (dirty ? 0.85 : 1), a); }
      const light = clamp(x * L[0] + y * L[1] + z * L[2], 0, 1) * 0.9 + 0.22, edge = 0.55 + 0.45 * z;
      d[o] = R * light * edge; d[o + 1] = G * light * edge; d[o + 2] = Bc * light * edge;
      d[o + 3] = 255 * clamp((1 - Math.sqrt(r2)) * PR / 1.5);
    }
    P.putImageData(pd, 0, 0);
  }
  const DIRTY_ORBIT = ['waste-botella', 'waste-lata', 'waste-bolsa', 'waste-papas', 'waste-icopor', 'waste-vaso', 'waste-chicle', 'waste-servilleta', 'waste-tapa', 'waste-pizza'];
  const CLEAN_ORBIT = ['world-city', 'world-forest', 'world-ocean', 'world-mountain', 'world-future', 'ic-coin', 'ic-coin', 'ic-coin'];
  function drawPlanet(o, n) {
    const dirty = o.mode === 'dirty' ? 1 : 0, k = outBack(o.a), cx = 960, cy = o.cy, R = o.r * k;
    const keys = dirty ? DIRTY_ORBIT : CLEAN_ORBIT, items = [];
    keys.forEach((key, i) => {
      const th = n * (0.035 + (i % 3) * 0.006) + i * (Math.PI * 2 / keys.length), rad = 1.42 + (i % 3) * 0.2, inc = 0.32 + (i % 4) * 0.08;
      const X = Math.cos(th) * rad, Z0 = Math.sin(th) * rad, Y = Z0 * Math.sin(inc) * (i % 2 ? 1 : -1) * 0.9, Z = Z0 * Math.cos(inc);
      items.push({ key, X, Y, Z, spin: n * 0.05 * (i % 2 ? 1 : -1) + i });
    });
    const drawItem = (it) => {
      const s = (dirty ? 92 : 104) * (0.72 + 0.34 * (it.Z / 1.8 + 1) / 2) * k;
      F.save(); F.translate(cx + it.X * R, cy + it.Y * R); F.rotate(dirty ? it.spin : 0);
      F.globalAlpha = it.Z < 0 ? 0.75 : 1;
      F.drawImage(img(it.key), -s / 2, -s / 2, s, s);
      F.restore();
    };
    // Resplandor de la atmósfera
    const glow = F.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.34);
    glow.addColorStop(0, dirty ? 'rgba(150,120,80,.75)' : 'rgba(120,220,255,.8)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    F.fillStyle = glow; F.beginPath(); F.arc(cx, cy, R * 1.34, 0, Math.PI * 2); F.fill();
    items.filter((i) => i.Z < 0).sort((a, b) => a.Z - b.Z).forEach(drawItem);
    renderPlanet(n * 0.03, dirty);
    F.drawImage(pc, cx - R, cy - R, R * 2, R * 2);
    if (dirty) { // nubes de humo pegadas al planeta
      F.save(); F.filter = 'brightness(0.42)'; F.globalAlpha = 0.8;
      [[-0.75, -0.5, 0.9], [0.55, 0.62, 1.1], [0.7, -0.62, 0.7]].forEach(([x, y, s], i) => {
        const w = 300 * s * k; F.drawImage(img('cloud'), cx + x * R - w / 2 + Math.sin(n * 0.04 + i) * 14, cy + y * R - w * 0.2, w, w * 0.41);
      });
      F.restore();
    }
    items.filter((i) => i.Z >= 0).sort((a, b) => a.Z - b.Z).forEach(drawItem);
    F.globalAlpha = 1;
    // Personajes que acompañan al planeta
    const bob = Math.sin(n * 0.12) * 14;
    if (dirty) {
      const w = 400 * k; F.drawImage(img(n % 46 < 24 ? 'contaminator-sneaky' : 'contaminator-talk'), 1420 - w / 2, 250 + bob - w * 0.52, w * 0.96, w);
    } else {
      const w = 330 * k;
      F.drawImage(img(n % 90 < 6 ? 'eco-blink' : 'eco-happy'), 380 - w / 2, 720 + bob - w * 0.58, w * 0.87, w);
      F.drawImage(img('reciclin-happy'), 1540 - w / 2, 730 - bob - w * 0.58, w * 0.87, w);
    }
  }

  // ---------- Texto con contorno (logotipo y rótulos), con el mismo estilo del juego.
  function outlined(text, x, y, size, fill, stroke, lw, angle = 0, scale = 1, alpha = 1) {
    F.save(); F.translate(x, y); F.rotate(angle); F.scale(scale, scale); F.globalAlpha = alpha;
    F.font = `700 ${size}px Fredoka`; F.textAlign = 'center'; F.textBaseline = 'middle'; F.lineJoin = 'round';
    F.strokeStyle = 'rgba(6,42,25,.55)'; F.lineWidth = lw; F.strokeText(text, 0, lw * 0.3);
    F.strokeStyle = stroke; F.lineWidth = lw; F.strokeText(text, 0, 0);
    F.fillStyle = fill; F.fillText(text, 0, 0);
    F.restore();
  }

  // ---------- Transiciones que tapan la pantalla (el cambio de escena ocurre debajo).
  function wipe(w) {
    const c = w.cover; // 1 = todo tapado
    if (w.type === 'tricolor') { // franjas diagonales con los colores de las tres canecas
      const cols = ['#ffffff', '#2f343b', '#2fae62'], skew = 260, span = W + skew * 2;
      cols.forEach((col, k) => {
        let a, b;
        if (w.mode === 'cover') { a = -skew; b = -skew + span * smooth(c * 1.4 - k * 0.2); }
        else { a = -skew + span * smooth((1 - c) * 1.4 - (2 - k) * 0.2); b = span; }
        if (b <= a) return;
        F.fillStyle = col; F.beginPath(); F.moveTo(a + skew, 0); F.lineTo(b + skew, 0); F.lineTo(b - skew, H); F.lineTo(a - skew, H); F.closePath(); F.fill();
      });
    } else if (w.type === 'iris') { // círculo que se cierra, con aro amarillo
      const r = 1150 * (1 - smooth(c));
      F.fillStyle = '#0b4a2b'; F.beginPath(); F.rect(0, 0, W, H); F.arc(W / 2, 480, Math.max(0, r), 0, Math.PI * 2, true); F.fill('evenodd');
      if (r > 4) { F.strokeStyle = '#ffd23f'; F.lineWidth = 16; F.beginPath(); F.arc(W / 2, 480, r, 0, Math.PI * 2); F.stroke(); }
    }
  }

  // ---------- Rótulo que cae con impacto, con rayos detrás.
  function stamp(st) {
    const p = st.p, slam = clamp(p / 0.28), out = clamp((p - 0.82) / 0.18);
    const scale = (3.4 - 2.4 * smooth(slam)) * (1 + 0.06 * Math.sin(p * 40) * (1 - slam)), alpha = clamp(slam * 1.6) * (1 - out);
    F.save(); F.translate(W / 2, 470); F.globalAlpha = 0.5 * alpha * clamp(slam * 2 - 0.6);
    F.fillStyle = '#ffd23f';
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + p * 1.2; F.beginPath(); F.moveTo(Math.cos(a - 0.05) * 260, Math.sin(a - 0.05) * 150); F.lineTo(Math.cos(a) * 1300, Math.sin(a) * 760); F.lineTo(Math.cos(a + 0.05) * 260, Math.sin(a + 0.05) * 150); F.fill(); }
    F.restore();
    outlined(st.text, W / 2, 470 - out * 160, 190, '#ffffff', '#14804a', 46, -0.07, scale, alpha);
  }

  function confetti(n, amount) {
    const cols = ['#ffd23f', '#ff8a3d', '#5cc8f5', '#ef5350', '#ffffff', '#7ed957'];
    for (let i = 0; i < 90 * amount; i++) {
      const x = (rnd(i) * W + Math.sin(n * 0.05 + i) * 40), y = ((rnd(i + 2) * 1300 + n * (7 + rnd(i + 4) * 9)) % 1300) - 110;
      F.save(); F.translate(x, y); F.rotate(n * 0.12 * (rnd(i + 6) - 0.5) * 4 + i);
      F.fillStyle = cols[i % cols.length]; F.fillRect(-11, -7, 22, 14); F.restore();
    }
  }

  const tr = {
    t: performance.now(), drag: null, hitFor: 0, lastExpr: '', seen: 0,
    scene() { return g.scene.getScenes(true)[0]; },
    step(n = 1) { for (let i = 0; i < n; i++) { now += 1000 / 30; this.t += 1000 / 30; g.step(this.t, 1000 / 30); } },
    go(key, data) { this.scene().scene.start(key, data || {}); this.step(1); },
    until(fn, max = 400) { for (let i = 0; i < max && !fn(this.scene()); i++) this.step(1); return fn(this.scene()); },
    target(s, wrong) {
      const id = s.round.current.bin;
      return s.bins.find((b) => (wrong ? b.bin.id !== id && s.activeBins.includes(b.bin.id) : b.bin.id === id));
    },
    act(a) {
      const s = this.scene();
      if (a.type === 'drag') { // simula el dedo arrastrando el residuo hacia una caneca
        if (!s.waste) return;
        if (!this.drag) {
          if (s.idle) { s.idle.remove(); s.idle = null; }
          this.drag = { x: s.waste.x, y: s.waste.y, bin: this.target(s, a.wrong) };
          s.waste.setScale(1.12);
        }
        const p = smooth(a.p), d = this.drag;
        s.waste.setPosition(d.x + (d.bin.x - d.x) * p, d.y + (d.bin.y - 190 - d.y) * p - Math.sin(Math.PI * p) * 70);
        for (const b of s.bins) b.setHover(b === d.bin && p > 0.7);
        touch.style.display = 'block';
        touch.style.left = `${((s.waste.x + 30) / 1920) * 100}%`;
        touch.style.top = `${((s.waste.y + 40) / 1080) * 100}%`;
      } else if (a.type === 'drop' && this.drag) {
        const bin = this.drag.bin;
        this.drag = null;
        touch.style.display = 'none';
        for (const b of s.bins) b.setHover(false);
        s.choose(bin.bin.id);
      } else if (a.type === 'clean') {
        s.env.setClean(1, true);
      }
    },
    // Efectos que nacen del propio juego: golpe al jefe y ataque especial.
    gameEvents() {
      const s = this.scene();
      if (!s || !s.bossChar) { this.lastExpr = ''; this.seen = 0; return; }
      if (s.bossChar.expr === 'oops' && this.lastExpr !== 'oops') this.hitFor = 9;
      this.lastExpr = s.bossChar.expr;
      if (s.seenAttacks && s.seenAttacks.size > this.seen) { this.seen = s.seenAttacks.size; this.hitFor = Math.max(this.hitFor, 7); }
    },
    frame(o) {
      if (o.act) this.act(o.act);
      if (o.steps) this.step(o.steps);
      this.gameEvents();
      const n = o.n, gm = o.game;
      // Marco del juego: flota en 3D y hace las transiciones de giro y barrido.
      let sx = 0, sy = 0;
      if (this.hitFor > 0) { const m = this.hitFor * 3.2; sx = (rnd(n) - 0.5) * m * 2; sy = (rnd(n + 50) - 0.5) * m * 2; }
      gameEl.style.opacity = String(gm.alpha);
      gameEl.style.transform = `perspective(1700px) translate(${gm.tx}%, 0) translate(${sx}px, ${sy}px) rotateY(${gm.ry}deg) rotateX(${gm.rx}deg) scale(${gm.scale})`;
      gameEl.style.filter = gm.blur ? `blur(${gm.blur}px)` : 'none';
      drawBg(n);
      F.clearRect(0, 0, W, H);
      if (o.planet) {
        drawPlanet(o.planet, n);
        if (o.planet.logo) {
          const a = o.planet.logo;
          outlined('EcoMisión', W / 2, 150, 200, '#ffffff', '#14804a', 50, 0, outBack(a), clamp(a * 2));
          outlined('Guardianes del Planeta', W / 2, 290, 74, '#ffd23f', '#17324d', 20, 0, outBack(clamp(a * 1.4 - 0.4)), clamp(a * 2 - 0.6));
        }
        if (o.planet.confetti) confetti(n, o.planet.confetti);
      }
      if (o.stamp) stamp(o.stamp);
      if (this.hitFor > 0) { F.fillStyle = `rgba(255,255,255,${0.09 * this.hitFor})`; F.fillRect(0, 0, W, H); this.hitFor--; }
      if (o.wipe) wipe(o.wipe);
      if (o.fade) { F.fillStyle = `rgba(3,20,12,${o.fade})`; F.fillRect(0, 0, W, H); }
      cap.innerHTML = markup(o.cap); sub.innerHTML = markup(o.sub);
      band.style.opacity = String(o.capA);
      band.style.transform = `translateY(${(1 - o.capA) * 34}px) scale(${0.94 + 0.06 * o.capA})`;
    },
  };
  window.__tr = tr;
}

// ---- Guion. Cada segmento prepara una pantalla (sin grabar) y luego graba sus fotogramas.
//   tin / tout: transición de entrada y de salida ('tricolor', 'iris', 'flip', 'whip', 'fade').
//   stamp: rótulo de impacto. speed: tramos a doble velocidad. planet: escena del planeta en 3D.
const T = 10; // fotogramas de cada media transición
const drag = (f, from, to, wrong = false) => (f >= from && f < to ? { type: 'drag', p: (f - from + 1) / (to - from), wrong } : f === to ? { type: 'drop' } : null);
const REWARDS_CAP = ['Insignias, álbum ecológico y personajes', 'Sin compras con dinero real · Sin anuncios'];

const SEGMENTS = [
  // Apertura: el planeta contaminado, en 3D.
  { frames: 75, planet: { mode: 'dirty', cy: 470, r: 300 }, tin: 'fade', tout: 'tricolor',
    cap: () => ['El planeta está *lleno de basura*…'] },
  { frames: 60, tin: 'tricolor', tout: 'flip',
    prep: (tr) => { tr.go('Story'); tr.step(14); for (let i = 0; i < 12 && tr.scene().index < 2; i++) { tr.scene().advance(); tr.step(2); } tr.step(16); },
    cap: () => ['…y *CONTAMINATOR* quiere que siga así'] },
  // Jugabilidad: un acierto y un error con su explicación.
  { frames: 205, tin: 'flip', tout: 'iris', stamp: { text: '¡A CLASIFICAR!', from: 0, len: 24 }, speed: [70, 118],
    prep: (tr) => { tr.go('Sorting', { worldId: 'city', missionIndex: 1 }); tr.until((s) => s.setup && !s.busy && !!s.waste); tr.step(50); },
    act: (f) => drag(f, 22, 40) || drag(f, 122, 140, true),
    cap: (f) => (f < 112 ? ['Arrastra cada residuo a su caneca: *blanca, negra o verde*'] : ['Si se equivoca, el juego *explica por qué*', 'Sin castigos: se aprende intentando']) },
  { frames: 100, tin: 'iris', tout: 'tricolor', stamp: { text: '5 MUNDOS', from: 2, len: 24 },
    prep: (tr) => { tr.go('Sorting', { worldId: 'ocean', missionIndex: 0 }); tr.until((s) => s.setup && s.setup.world.id === 'ocean' && !s.busy && !!s.waste); tr.step(70); },
    act: (f) => (f === 16 ? { type: 'clean' } : null),
    cap: () => ['Mundos que *se recuperan* con cada acierto'] },
  { frames: 150, tin: 'tricolor', tout: 'flip', stamp: { text: '¡JEFE FINAL!', from: 2, len: 24 }, speed: [80, 120],
    prep: (tr) => {
      tr.go('Boss', { worldId: 'city', missionIndex: 4 });
      tr.until((s) => s.boss && !s.busy && !!s.waste);
      tr.scene().choose(tr.scene().round.current.bin); // primer golpe, sin grabar
      tr.until((s) => s.round.index === 1 && !s.busy && !!s.waste);
      tr.step(40);
    },
    act: (f) => drag(f, 26, 44),
    cap: () => ['*25 niveles* y *5 jefes finales*', 'Cada jefe tiene sus propios trucos'] },
  { frames: 35, tin: 'flip', tout: 'whip', prep: (tr) => { tr.go('Badges'); tr.step(12); }, cap: () => REWARDS_CAP },
  { frames: 35, tin: 'whip', tout: 'whip', prep: (tr) => { tr.go('Album'); tr.step(12); }, cap: () => REWARDS_CAP },
  { frames: 35, tin: 'whip', tout: 'whip', prep: (tr) => { tr.go('Shop'); tr.step(12); }, cap: () => REWARDS_CAP },
  { frames: 70, tin: 'whip', tout: 'iris', prep: (tr) => { tr.go('WorldMap'); tr.step(12); },
    cap: () => ['Para niños de *5 a 12 años*', 'La dificultad se adapta a cada niño · Código de colores de Colombia'] },
  // Cierre: el planeta recuperado, con el logotipo.
  { frames: 135, planet: { mode: 'clean', cy: 640, r: 250, logo: true }, tin: 'iris',
    cap: () => ['Aprender a cuidar el planeta, *jugando*'] },
];

const easeIn = (p) => p * p;
// Parámetros visuales de un fotograma: marco 3D del juego, transición, rótulo y planeta.
function visuals(seg, f, n) {
  const o = { game: { ry: 2.4 * Math.sin(n / 38), rx: 1.3 * Math.sin(n / 53), tx: 0, blur: 0, scale: 1, alpha: seg.planet ? 0 : 1 } };
  const pin = f < T ? 1 - (f + 1) / T : 0;                                  // 1 → 0 al entrar
  const pout = f >= seg.frames - T ? (f - (seg.frames - T) + 1) / T : 0;    // 0 → 1 al salir
  const apply = (type, p, entering) => {
    if (!type || p <= 0) return;
    if (type === 'flip') { o.game.ry += (entering ? -88 : 88) * easeIn(p); o.game.scale = 1 - 0.14 * p; }
    else if (type === 'whip') { o.game.tx = (entering ? 115 : -115) * easeIn(p); o.game.blur = 18 * p; }
    else if (type === 'fade') o.fade = p;
    else o.wipe = { type, cover: p, mode: entering ? 'uncover' : 'cover' };
  };
  apply(seg.tin, pin, true);
  apply(seg.tout, pout, false);
  if (seg.stamp && f >= seg.stamp.from && f < seg.stamp.from + seg.stamp.len) o.stamp = { text: seg.stamp.text, p: (f - seg.stamp.from) / seg.stamp.len };
  if (seg.planet) {
    o.planet = { ...seg.planet, a: Math.min(1, (f + 1) / 16) };
    if (seg.planet.logo) { o.planet.logo = Math.min(1, Math.max(0, (f - 12) / 22)); o.planet.confetti = Math.min(1, Math.max(0, (f - 26) / 20)); }
  }
  return o;
}

// ---- Música: tema principal del juego, sintetizado a un archivo WAV.
async function writeMusic(file, seconds, sfx = { whoosh: [], hit: [] }) {
  const { THEMES, freq } = await import(path.join(ROOT, 'src', 'core', 'AudioManager.js'));
  const theme = THEMES.main, rate = 44100, n = Math.floor(seconds * rate);
  const buf = new Float32Array(n);
  const note = (f, start, dur, vol, tri) => {
    const a = Math.floor(start * rate), len = Math.floor((dur + 0.02) * rate);
    for (let i = 0; i < len && a + i < n; i++) {
      const t = i / rate;
      const env = t < 0.015 ? t / 0.015 : Math.pow(0.0001, (t - 0.015) / dur); // ataque corto y caída exponencial
      const ph = 2 * Math.PI * f * t;
      buf[a + i] += vol * env * (tri ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph));
    }
  };
  for (let i = 0; i * theme.step < seconds; i++) {
    const k = i % theme.melody.length, t = i * theme.step;
    if (theme.melody[k] !== '-') note(freq(theme.melody[k]), t, theme.step * 0.9, 0.5, true);
    if (k % 4 === 0) note(freq(theme.bass[Math.floor(k / 8)]), t, theme.step * 3.5, 0.75, false);
  }
  // Acentos de sonido: un soplo en cada transición y un golpe con cada rótulo.
  let seed = 7;
  const noise = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 2147483648 - 1; };
  for (const t of sfx.whoosh) {
    const a = Math.floor((t - 0.2) * rate), len = Math.floor(0.45 * rate);
    let low = 0;
    for (let i = 0; i < len && a + i < n; i++) {
      if (a + i < 0) continue;
      const p = i / len;
      low += (noise() - low) * (0.04 + 0.3 * Math.sin(Math.PI * p)); // ruido filtrado que se abre y se cierra
      buf[a + i] += 0.5 * low * Math.sin(Math.PI * p) ** 2;
    }
  }
  for (const t of sfx.hit) {
    const a = Math.floor(t * rate), len = Math.floor(0.32 * rate);
    for (let i = 0; i < len && a + i < n; i++) {
      const u = i / rate, f = 150 * Math.pow(0.3, u / 0.32);
      buf[a + i] += 0.8 * Math.pow(0.0005, u / 0.32) * Math.sin(2 * Math.PI * f * u) + (u < 0.02 ? 0.25 * noise() : 0);
    }
  }
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const wav = Buffer.alloc(44 + n * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const fade = Math.min(1, t / 0.3, (seconds - t) / 1.8); // entrada y salida suaves
    wav.writeInt16LE(Math.round((buf[i] / peak) * 0.8 * Math.max(0, fade) * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, wav);
}

async function main() {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const total = SEGMENTS.reduce((n, s) => n + s.frames, 0);
  console.log(`Tráiler: ${total} fotogramas (${(total / FPS).toFixed(1)} s). Carpeta de trabajo: ${WORK}`);

  const server = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => { if (String(d).includes('localhost')) resolve(); });
    server.on('exit', (c) => reject(new Error(`vite preview terminó (${c})`)));
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((save) => localStorage.setItem('ecomision.save.v1', JSON.stringify(save)), SAVE);
    await page.goto(`http://localhost:${PORT}/`);
    // El juego va en un marco redondeado que flota sobre el fondo; abajo quedan los textos.
    await page.addStyleTag({ content: `html,body{background:#052214 !important}
      #game{position:fixed !important;left:160px;top:26px;width:1600px !important;height:900px !important;z-index:1;border-radius:34px;overflow:hidden;
        box-shadow:0 0 0 9px #fff9e8,0 0 0 15px #14804a,0 34px 90px rgba(0,0,0,.6);will-change:transform}` });
    await page.waitForFunction(() => window.__ECOMISION__ && window.__ECOMISION__.scene.isActive('Title'), null, { timeout: 60000 });
    await page.evaluate(() => { const sc = window.__ECOMISION__.scale; sc.getParentBounds(); sc.refresh(); });
    const box = await page.locator('canvas').first().boundingBox();
    if (Math.round(box.height) !== 900 || Math.round(box.width) !== 1600) throw new Error(`El lienzo no se ajustó al marco: ${JSON.stringify(box)}`);
    await page.evaluate(installInPage);

    let n = 0, lastCap = '', since = 0;
    for (const [i, seg] of SEGMENTS.entries()) {
      if (seg.prep) await page.evaluate(`(${seg.prep.toString()})(window.__tr)`);
      for (let f = 0; f < seg.frames; f++) {
        const [cap, sub] = seg.cap(f);
        if (cap !== lastCap) { lastCap = cap; since = 0; } else since++; // cada texto nuevo entra animado
        const fast = seg.speed && f >= seg.speed[0] && f < seg.speed[1];
        await page.evaluate((o) => window.__tr.frame(o), {
          ...visuals(seg, f, n), n, cap, sub: sub || '', capA: Math.min(1, (since + 1) / 9),
          act: seg.act ? seg.act(f) : null, steps: seg.planet ? 0 : fast ? 2 : 1,
        });
        await page.screenshot({ path: path.join(FRAMES, `f${String(n++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
      }
      console.log(`  segmento ${i + 1}/${SEGMENTS.length} listo (${n}/${total})`);
    }
    if (errors.length) throw new Error(`Errores en la página:\n${errors.join('\n')}`);
  } finally {
    await browser.close();
    server.kill();
  }

  const wav = path.join(WORK, 'musica.wav');
  // Momentos de los efectos de sonido, a partir del guion.
  const sfx = { whoosh: [], hit: [] };
  let at = 0;
  for (const seg of SEGMENTS) {
    if (at > 0) sfx.whoosh.push(at / FPS);
    if (seg.stamp) sfx.hit.push((at + seg.stamp.from + 6) / FPS);
    at += seg.frames;
  }
  await writeMusic(wav, total / FPS, sfx);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%04d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT]);
  console.log(`Listo: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('FALLÓ EL TRÁILER:', e.message); process.exit(1); });
