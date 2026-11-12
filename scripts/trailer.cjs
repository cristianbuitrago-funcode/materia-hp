// Genera el tráiler de 30 segundos con imágenes reales del juego.
// Uso: npm run build && node scripts/trailer.cjs [carpeta-de-trabajo]   (requiere Playwright, Chromium y ffmpeg)
// Salida: media/trailer-ecomision.mp4
//
// El juego se avanza fotograma a fotograma con un reloj virtual (30 por segundo)
// y se captura cada uno, de modo que el video queda fluido aunque el navegador
// de pruebas dibuje despacio. La música es el tema principal del propio juego,
// sintetizado con las mismas notas.
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

// ---- Código que corre dentro de la página
function installInPage() {
  const g = window.__ECOMISION__;
  g.loop.stop();
  // Reloj virtual: las animaciones de Phaser usan Date.now(), así que también se controla.
  let now = Date.now();
  Date.now = () => now;
  const band = document.createElement('div');
  band.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:144px;background:#0b3d25;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Fredoka,sans-serif;color:#fff;text-align:center';
  band.innerHTML = '<div id="tr-cap" style="font-weight:700;font-size:50px;line-height:1.15"></div><div id="tr-sub" style="font-weight:500;font-size:28px;color:#FFD23F;margin-top:6px"></div>';
  document.body.appendChild(band);
  const touch = document.createElement('div');
  touch.style.cssText = 'position:fixed;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;border:6px solid #fff;background:rgba(255,255,255,.4);box-shadow:0 0 0 4px rgba(23,50,77,.5);display:none;pointer-events:none';
  document.body.appendChild(touch);
  const cap = document.getElementById('tr-cap'), sub = document.getElementById('tr-sub');

  const tr = {
    t: performance.now(),
    scene() { return g.scene.getScenes(true)[0]; },
    step(n = 1) { for (let i = 0; i < n; i++) { now += 1000 / 30; this.t += 1000 / 30; g.step(this.t, 1000 / 30); } },
    go(key, data) { this.scene().scene.start(key, data || {}); this.step(1); },
    // Avanza sin grabar hasta que se cumpla la condición.
    until(fn, max = 400) { for (let i = 0; i < max && !fn(this.scene()); i++) this.step(1); return fn(this.scene()); },
    showTouch(x, y) {
      const r = g.canvas.getBoundingClientRect();
      touch.style.display = 'block';
      touch.style.left = `${r.left + (x / 1920) * r.width}px`;
      touch.style.top = `${r.top + (y / 1080) * r.height}px`;
    },
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
        const p = a.p * a.p * (3 - 2 * a.p), d = this.drag;
        s.waste.setPosition(d.x + (d.bin.x - d.x) * p, d.y + (d.bin.y - 190 - d.y) * p - Math.sin(Math.PI * p) * 70);
        for (const b of s.bins) b.setHover(b === d.bin && p > 0.7);
        this.showTouch(s.waste.x + 30, s.waste.y + 40);
      } else if (a.type === 'drop') {
        const bin = this.drag.bin;
        this.drag = null;
        touch.style.display = 'none';
        for (const b of s.bins) b.setHover(false);
        s.choose(bin.bin.id);
      } else if (a.type === 'clean') {
        s.env.setClean(1, true);
      }
    },
    frame(o) {
      if (o.act) this.act(o.act);
      this.step(1);
      cap.textContent = o.cap || '';
      sub.textContent = o.sub || '';
      cap.style.opacity = sub.style.opacity = String(o.alpha);
    },
  };
  window.__tr = tr;
}

// ---- Guion: cada segmento prepara una pantalla (sin grabar) y luego graba sus fotogramas.
const ready = (s) => s.setup && !s.busy && !!s.waste;
const drag = (f, from, to, wrong = false) => (f >= from && f < to ? { type: 'drag', p: (f - from + 1) / (to - from), wrong } : f === to ? { type: 'drop' } : null);

const SEGMENTS = [
  // Apertura: la ciudad contaminada de la historia inicial.
  { frames: 70,
    prep: (tr) => { tr.go('Story'); tr.step(14); for (let i = 0; i < 12 && tr.scene().index < 1; i++) { tr.scene().advance(); tr.step(2); } },
    cap: () => ['El planeta está lleno de basura…'] },
  { frames: 80,
    prep: (tr) => { for (let i = 0; i < 12 && tr.scene().index < 2; i++) { tr.scene().advance(); tr.step(2); } },
    cap: () => ['…y CONTAMINATOR quiere que siga así'] },
  { frames: 210, prep: (tr) => { tr.go('Sorting', { worldId: 'city', missionIndex: 1 }); tr.until((s) => s.setup && !s.busy && !!s.waste); },
    act: (f) => drag(f, 4, 24) || drag(f, 132, 152, true),
    cap: (f) => (f < 118 ? ['Arrastra cada residuo a su caneca: blanca, negra o verde'] : ['Si se equivoca, el juego explica por qué', 'Sin castigos: se aprende intentando']) },
  { frames: 105, prep: (tr) => { tr.go('Sorting', { worldId: 'ocean', missionIndex: 0 }); tr.until((s) => s.setup && s.setup.world.id === 'ocean' && !s.busy && !!s.waste); tr.step(20); },
    act: (f) => (f === 8 ? { type: 'clean' } : null),
    cap: () => ['5 mundos que se recuperan con cada acierto'] },
  { frames: 150,
    prep: (tr) => {
      tr.go('Boss', { worldId: 'city', missionIndex: 4 });
      tr.until((s) => s.boss && !s.busy && !!s.waste);
      tr.scene().choose(tr.scene().round.current.bin); // primer golpe, sin grabar
      tr.until((s) => s.round.index === 1 && !s.busy && !!s.waste);
      tr.step(40);
    },
    act: (f) => drag(f, 6, 24),
    cap: () => ['25 niveles y 5 jefes finales', 'Cada jefe tiene sus propios trucos'] },
  { frames: 34, prep: (tr) => { tr.go('Badges'); tr.step(12); }, cap: () => ['Insignias, álbum ecológico y personajes', 'Sin compras con dinero real · Sin anuncios'] },
  { frames: 33, prep: (tr) => { tr.go('Album'); tr.step(12); }, cap: () => ['Insignias, álbum ecológico y personajes', 'Sin compras con dinero real · Sin anuncios']},
  { frames: 33, prep: (tr) => { tr.go('Shop'); tr.step(12); }, cap: () => ['Insignias, álbum ecológico y personajes', 'Sin compras con dinero real · Sin anuncios']},
  { frames: 75, prep: (tr) => { tr.go('WorldMap'); tr.step(12); },
    cap: () => ['Para niños de 5 a 12 años', 'La dificultad se adapta a cada niño · Código de colores de Colombia'] },
  { frames: 110, prep: (tr) => { tr.go('Title'); tr.step(6); },
    cap: () => ['EcoMisión: Guardianes del Planeta', 'Aprender a cuidar el planeta, jugando'] },
];

// ---- Música: tema principal del juego, sintetizado a un archivo WAV.
async function writeMusic(file, seconds) {
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
    // El juego ocupa la parte superior; abajo queda una franja para los textos.
    await page.addStyleTag({ content: '#game{height:936px !important} body{background:#0b3d25 !important}' });
    await page.waitForFunction(() => window.__ECOMISION__ && window.__ECOMISION__.scene.isActive('Title'), null, { timeout: 60000 });
    await page.evaluate(() => { const sc = window.__ECOMISION__.scale; sc.getParentBounds(); sc.refresh(); });
    const box = await page.locator('canvas').boundingBox();
    if (Math.round(box.height) !== 936 || Math.round(box.width) !== 1664) throw new Error(`El lienzo no se ajustó a la franja: ${JSON.stringify(box)}`);
    await page.evaluate(installInPage);

    let n = 0, lastCap = '', since = 0;
    for (const [i, seg] of SEGMENTS.entries()) {
      await page.evaluate(`(${seg.prep.toString()})(window.__tr)`);
      for (let f = 0; f < seg.frames; f++) {
        const [cap, sub] = seg.cap(f);
        // Cuando cambia el texto, aparece suavemente.
        if (cap !== lastCap) { lastCap = cap; since = 0; } else since++;
        const alpha = Math.min(1, (since + 1) / 8);
        await page.evaluate((o) => window.__tr.frame(o), { cap, sub: sub || '', alpha, act: seg.act ? seg.act(f) : null });
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
  await writeMusic(wav, total / FPS);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%04d.jpg'), '-i', wav,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT]);
  console.log(`Listo: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('FALLÓ EL TRÁILER:', e.message); process.exit(1); });
