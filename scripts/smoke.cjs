// Prueba de humo: abre el juego compilado en un navegador real y recorre la
// navegación completa con ratón y teclado. Uso: npm run build && npm run test:smoke
// Opcional: SMOKE_SHOTS=<carpeta> guarda capturas de cada pantalla.
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium } = require('playwright');

const PORT = 4173;
const URL = `http://localhost:${PORT}/`;
const SHOTS = process.env.SMOKE_SHOTS;
const W = 1920, H = 1080;

async function main() {
  const server = spawn(process.execPath, [path.join(__dirname, '..', 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => { if (String(d).includes('localhost')) resolve(); });
    server.on('exit', (code) => reject(new Error(`vite preview terminó (${code})`)));
    setTimeout(() => reject(new Error('vite preview no arrancó')), 20000);
  });

  const browser = await chromium.launch();
  const errors = [];
  let step = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    const scenes = () => page.evaluate(() => window.__ECOMISION__.scene.getScenes(true).map((s) => s.scene.key));
    const waitScene = async (key) => {
      await page.waitForFunction((k) => {
        const g = window.__ECOMISION__;
        if (!g) return false;
        const s = g.scene.getScenes(true).find((x) => x.scene.key === k);
        return !!s && !s._leaving && s.cameras.main.fadeEffect.isRunning === false;
      }, key, { timeout: 15000 });
      console.log(`  ✓ ${String(++step).padStart(2)}. pantalla ${key}`);
    };
    const shot = async (name) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); };
    // Clic en coordenadas del diseño (1920x1080), sin importar el tamaño de la ventana.
    const click = async (x, y) => {
      const box = await page.locator('canvas').boundingBox();
      await page.mouse.click(box.x + (x / W) * box.width, box.y + (y / H) * box.height);
    };
    const expectScenes = async (want) => {
      const got = await scenes();
      if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`Escenas activas ${JSON.stringify(got)}, se esperaba ${JSON.stringify(want)}`);
    };

    await page.goto(URL);
    await waitScene('Title');
    await page.waitForTimeout(1200);
    await shot('01-inicio');

    // Ajustes: abrir, apagar la música, cerrar.
    await click(W - 100, 100);
    await waitScene('Settings');
    await click(W / 2, H / 2 - 180);
    await page.waitForTimeout(300);
    const music = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')).settings.music);
    if (music !== false) throw new Error('El ajuste de música no se guardó');
    await shot('02-ajustes');
    await click(W / 2, H / 2 + 330);
    await page.waitForTimeout(300);
    await expectScenes(['Title']);

    // Jugar → historia completa con teclado (Enter avanza).
    await click(W / 2, 610);
    await waitScene('Story');
    await page.waitForTimeout(1500);
    await shot('03-historia');
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(250); }
    await page.waitForTimeout(700);
    await shot('04-historia-contaminator');
    for (let i = 0; i < 40 && (await scenes())[0] === 'Story'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(200); }
    await waitScene('Profile');
    await shot('05-edad');

    // Perfil: modo Aventurero, avatar jaguar, cambiar apodo, ¡Listo!
    await click(960, 590);
    await page.waitForTimeout(400);
    await click(420 + 2 * 360, 400);
    await click(W / 2 + 430, 740);
    await page.waitForTimeout(400);
    await shot('06-avatar');
    await click(W - 340, 960);
    await waitScene('WorldMap');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')));
    if (saved.profile.ageMode !== 'adventurer' || saved.profile.avatar !== 'jaguar' || !saved.profile.nickname) {
      throw new Error(`Perfil guardado incorrecto: ${JSON.stringify(saved.profile)}`);
    }
    await page.waitForTimeout(600);
    await shot('07-mapa');

    // Mundo bloqueado: no navega.
    await click(640, 400);
    await page.waitForTimeout(700);
    await expectScenes(['WorldMap']);
    await shot('08-mundo-bloqueado');

    // Mundo 1 → introducción de misiones → volver.
    await click(300, 640);
    await waitScene('MissionIntro');
    await page.waitForTimeout(900);
    await shot('09-misiones');
    // ¡Comenzar! → juego de clasificación (modo Aventurero: 8 residuos).
    await click(1520, 970);
    await waitScene('Sorting');
    const sorting = () => page.evaluate(() => {
      const s = window.__ECOMISION__.scene.getScene('Sorting');
      return { busy: s.busy, bin: s.round.current && s.round.current.bin, index: s.round.index, total: s.round.total, explain: s.explain.visible, hint: s.round.showHint };
    });
    const waitReady = () => page.waitForFunction(() => {
      const s = window.__ECOMISION__.scene.getScene('Sorting');
      return s.scene.isActive() && !s.busy && !s.explain.visible && !!s.waste;
    }, null, { timeout: 30000 });
    const waitIndex = (n) => page.waitForFunction((k) => window.__ECOMISION__.scene.getScene('Sorting').round.index === k, n, { timeout: 30000 });
    const BIN_X = { white: 600, black: 1020, green: 1440 };
    const pt = async (x, y) => { const b = await page.locator('canvas').boundingBox(); return [b.x + (x / W) * b.width, b.y + (y / H) * b.height]; };

    await waitReady();
    await shot('09b-clasificar');
    let st = await sorting();
    if (st.total !== 8 || st.index !== 0) throw new Error(`Ronda inesperada: ${JSON.stringify(st)}`);

    // Residuo 1: error tocando una caneca equivocada → explicación → reintento arrastrando.
    const wrong = Object.keys(BIN_X).find((b) => b !== st.bin);
    await click(BIN_X[wrong], 760);
    await page.waitForFunction(() => window.__ECOMISION__.scene.getScene('Sorting').explain.visible, null, { timeout: 30000 });
    await page.waitForTimeout(500);
    await shot('09c-explicacion');
    st = await sorting();
    if (st.index !== 0) throw new Error('Un error no debe avanzar al siguiente residuo');
    await click(BIN_X[st.bin], 1000); // con la explicación abierta las canecas no responden
    await page.waitForTimeout(300);
    if (!(await sorting()).explain) throw new Error('La explicación se cerró sin pulsar su botón');
    await page.keyboard.press('Enter'); // "Intentar otra vez"
    await waitReady();
    const from = await pt(1020, 335), to = await pt(BIN_X[st.bin], 700);
    await page.mouse.move(...from);
    await page.mouse.down();
    await page.mouse.move((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, { steps: 6 });
    await page.mouse.move(...to, { steps: 6 });
    await page.mouse.up();
    await waitIndex(1);
    console.log('  ✓     error + explicación + arrastre correcto');

    // Soltar el residuo fuera de las canecas lo devuelve a su sitio sin contar como intento.
    await waitReady();
    await page.mouse.move(...from);
    await page.mouse.down();
    await page.mouse.move(...(await pt(1700, 400)), { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    st = await sorting();
    if (st.index !== 1 || st.explain) throw new Error('Soltar fuera de las canecas no debe contar');

    // Residuo 2: teclas 1, 2, 3. Residuo 3: Tab hasta la caneca + Enter. Resto: tocar la caneca.
    await page.keyboard.press(String(Object.keys(BIN_X).indexOf(st.bin) + 1));
    await waitIndex(2);
    await waitReady();
    st = await sorting();
    for (let i = 0; i < 3 + Object.keys(BIN_X).indexOf(st.bin); i++) await page.keyboard.press('Tab'); // atrás, ajustes, canecas…
    await page.keyboard.press('Enter');
    await waitIndex(3);
    console.log('  ✓     teclado: atajos numéricos y Tab + Enter');
    for (let i = 3; i < 8; i++) {
      await waitReady();
      st = await sorting();
      await click(BIN_X[st.bin], 760);
      await waitIndex(i + 1);
    }
    await waitScene('Results');
    await page.waitForTimeout(1800);
    await shot('09d-resultados');
    const prog = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')).progress);
    const want = { experience: 85, ecoCoins: 20, roundsPlayed: 1, correctAnswers: 8, incorrectAnswers: 1 };
    for (const [k, v] of Object.entries(want)) if (prog[k] !== v) throw new Error(`Progreso guardado: ${k}=${prog[k]}, se esperaba ${v}`);
    if (prog.learnedWasteTypes.length !== 8) throw new Error('No se guardaron los 8 residuos aprendidos');
    await click(W / 2 + 190 - 300, 970); // Mapa
    await waitScene('WorldMap');

    // Barra de secciones → pantalla "en construcción" → volver.
    await click(W / 2, H - 86);
    await waitScene('ComingSoon');
    await page.waitForTimeout(500);
    await shot('10-seccion-futura');
    await page.keyboard.press('Enter');
    await waitScene('WorldMap');

    // Teclado: Tab enfoca el mundo 1 y Enter lo abre.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await waitScene('MissionIntro');

    // Al recargar se recupera la partida y "Continuar" va directo al mapa.
    await page.reload();
    await waitScene('Title');
    await page.waitForTimeout(900);
    await shot('11-inicio-continuar');
    await page.keyboard.press('Enter');
    await waitScene('WorldMap');

    // Borrar partida (doble toque) → vuelve al inicio sin perfil.
    await click(W - 110, 100);
    await waitScene('Settings');
    await click(W / 2, H / 2 + 150);
    await page.waitForTimeout(200);
    await click(W / 2, H / 2 + 150);
    await waitScene('Title');
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')));
    if (after.profile !== null || after.settings.music !== false) throw new Error('El reinicio de la partida no funcionó');

    // Pantalla vertical de teléfono: el lienzo debe caber completo.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const box = await page.locator('canvas').boundingBox();
    if (box.width > 390.5 || box.x < -0.5) throw new Error(`El lienzo no cabe en pantalla vertical: ${JSON.stringify(box)}`);
    await shot('12-telefono-vertical');

    if (errors.length) throw new Error(`Errores en la consola:\n${errors.join('\n')}`);
    console.log(`\nPrueba de humo superada (${step} pantallas verificadas, 0 errores de consola).`);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error('\nPRUEBA DE HUMO FALLIDA:', err.message); process.exit(1); });
