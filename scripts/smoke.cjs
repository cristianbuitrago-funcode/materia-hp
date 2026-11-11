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
    // La misión 3 está cerrada hasta terminar las anteriores.
    const ROW = (n) => [1300, 510 + (n - 1) * 80]; // filas de la lista de niveles
    await click(...ROW(3));
    await page.waitForTimeout(600);
    await expectScenes(['MissionIntro']);
    // Misión 1 "Recoger botellas" → juego de clasificación (modo Aventurero: 8 residuos).
    await click(...ROW(1));
    await waitScene('Sorting');
    const m1 = await page.evaluate(() => {
      const s = window.__ECOMISION__.scene.getScene('Sorting');
      return { id: s.setup.mission.id, focus: s.round.wastes.filter((w) => s.setup.mission.focus.includes(w.id)).length, timed: s.setup.timed };
    });
    if (m1.id !== 'city-1' || m1.focus < 4 || m1.timed) throw new Error(`Misión 1: ${JSON.stringify(m1)}`);
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
    if (st.total !== 6 || st.index !== 0) throw new Error(`Ronda inesperada: ${JSON.stringify(st)}`);

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
    for (let i = 3; i < 6; i++) {
      await waitReady();
      st = await sorting();
      await click(BIN_X[st.bin], 760);
      await waitIndex(i + 1);
    }
    await waitScene('Results');
    await page.waitForTimeout(1800);
    await shot('09d-resultados');
    const prog = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')).progress);
    const want = { experience: 65, ecoCoins: 16, roundsPlayed: 1, correctAnswers: 6, incorrectAnswers: 1 };
    for (const [k, v] of Object.entries(want)) if (prog[k] !== v) throw new Error(`Progreso guardado: ${k}=${prog[k]}, se esperaba ${v}`);
    if (prog.learnedWasteTypes.length !== 6) throw new Error('No se guardaron los 6 residuos aprendidos');
    // Terminar la misión 1 limpia una cuarta parte de la ciudad, abre la misión 2 y aún no abre el bosque.
    const m = prog.missionProgress['city-1'];
    if (!m || m.stars !== 2 || m.plays !== 1) throw new Error(`Misión city-1: ${JSON.stringify(m)}`);
    if (JSON.stringify(prog.unlockedWorlds) !== '["city"]') throw new Error(`Mundos abiertos: ${prog.unlockedWorlds}`);
    if (prog.recentAnswers.length !== 6 || prog.recentAnswers.filter((x) => !x).length !== 1) throw new Error(`Respuestas recientes: ${prog.recentAnswers}`);
    if (Object.keys(prog.trouble).length !== 1) throw new Error(`Residuos por repasar: ${JSON.stringify(prog.trouble)}`);

    // "Siguiente misión" lleva a la misión 2, que repasa el residuo fallado; salir a mitad no guarda ni castiga.
    await click(W / 2 + 190 + 240, 970);
    await waitScene('Sorting');
    const m2 = await page.evaluate(() => {
      const s = window.__ECOMISION__.scene.getScene('Sorting');
      return { id: s.setup.mission.id, clean: s.env.clean, ids: s.round.wastes.map((w) => w.id) };
    });
    if (m2.id !== 'city-2' || m2.clean !== 0.2) throw new Error(`Misión 2: ${JSON.stringify(m2)}`);
    if (!m2.ids.includes(Object.keys(prog.trouble)[0])) throw new Error(`La misión 2 no repasa ${Object.keys(prog.trouble)[0]}: ${m2.ids}`);
    await waitReady();
    await page.keyboard.press('Escape');
    await waitScene('MissionIntro');
    await page.waitForTimeout(700);
    await shot('09e-misiones-avance');
    await page.keyboard.press('Escape');
    await waitScene('WorldMap');
    await page.waitForTimeout(500);
    await shot('09f-mapa-avance');

    // Barra de secciones → pantalla "en construcción" → volver.
    await click(W / 2 + 2 * 358, H - 86); // Adultos (fase 7)
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

    // ---- Segunda partida (inyectada): océano con dos misiones hechas, para probar los otros retos.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => localStorage.setItem('ecomision.save.v1', JSON.stringify({
      version: 1, settings: { music: false, sfx: false }, storySeen: true,
      profile: { nickname: 'Tortuga Audaz', ageMode: 'adventurer', avatar: 'rana' },
      progress: { ecoCoins: 40, learnedWasteTypes: ['botella', 'lata', 'banano'], unlockedWorlds: ['city', 'forest', 'ocean'], missionProgress: { 'ocean-1': { stars: 2, plays: 1 }, 'ocean-2': { stars: 3, plays: 1 } } },
    })));
    await page.reload();
    await waitScene('Title');
    await page.evaluate(() => window.__ECOMISION__.scene.getScene('Title').scene.start('MissionIntro', { worldId: 'ocean' }));
    await waitScene('MissionIntro');
    await page.waitForTimeout(700);
    await shot('13-oceano-misiones');

    const challenge = () => page.evaluate(() => {
      const s = window.__ECOMISION__.scene.getScene('Challenge');
      const it = s.round.current;
      return { kind: s.kind, index: s.round.index, total: s.round.total, busy: s.busy, next: !!s.nextBtn, answer: it && it.answer,
        buttons: s.options.map((b) => (b.active ? { x: b.x, y: b.y, enabled: b.enabled } : null)) };
    });
    const waitItem = (n) => page.waitForFunction((k) => {
      const s = window.__ECOMISION__.scene.getScene('Challenge');
      return s.scene.isActive() && s.round.index === k && !s.busy && !s.nextBtn && s.options.length > 0;
    }, n, { timeout: 30000 });
    const waitNext = () => page.waitForFunction(() => !!window.__ECOMISION__.scene.getScene('Challenge').nextBtn, null, { timeout: 30000 });

    // Misión 3 del océano: "¿Está en la caneca correcta?".
    await click(...ROW(3));
    await waitScene('Challenge');
    await waitItem(0);
    await page.waitForTimeout(600);
    await shot('14-esta-bien');
    let ch = await challenge();
    if (ch.kind !== 'check' || ch.total !== 6) throw new Error(`Reto "¿está bien?": ${JSON.stringify(ch)}`);
    // Primer residuo: respuesta equivocada (se descarta y no avanza), luego la correcta.
    const bad = ch.buttons[1 - ch.answer];
    await click(bad.x, bad.y);
    await page.waitForTimeout(500);
    ch = await challenge();
    if (ch.index !== 0 || ch.next || ch.buttons[1 - ch.answer].enabled) throw new Error(`Tras un error: ${JSON.stringify(ch)}`);
    for (let i = 0; i < 6; i++) {
      await waitItem(i);
      ch = await challenge();
      await click(ch.buttons[ch.answer].x, ch.buttons[ch.answer].y);
      await waitNext();
      if (i === 0) { await page.waitForTimeout(700); await shot('15-esta-bien-explicacion'); }
      await page.keyboard.press('Enter'); // Seguir
    }
    await waitScene('Results');
    let save = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')).progress);
    if (!save.missionProgress['ocean-3'] || save.missionProgress['ocean-3'].stars !== 2) throw new Error(`ocean-3: ${JSON.stringify(save.missionProgress)}`);
    if (save.unlockedWorlds.includes('mountain')) throw new Error('La montaña se abrió antes de terminar el océano');
    console.log('  ✓     reto "¿está en la caneca correcta?" completo');

    // Misión 4: preguntas ambientales, respondidas con el teclado (1, 2, 3 y Enter).
    await page.keyboard.press('Enter'); // Siguiente misión
    await waitScene('Challenge');
    await waitItem(0);
    await page.waitForTimeout(600);
    await shot('16-pregunta');
    ch = await challenge();
    if (ch.kind !== 'quiz' || ch.total !== 5) throw new Error(`Preguntas: ${JSON.stringify(ch)}`);
    for (let i = 0; i < 5; i++) {
      await waitItem(i);
      ch = await challenge();
      await page.keyboard.press(String(ch.answer + 1));
      await waitNext();
      if (i === 0) { await page.waitForTimeout(700); await shot('17-pregunta-explicacion'); }
      await page.keyboard.press('Enter');
    }
    await waitScene('Results');
    save = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')));
    if (save.progress.missionProgress['ocean-4'].stars !== 3) throw new Error(`ocean-4: ${JSON.stringify(save.progress.missionProgress['ocean-4'])}`);
    // Con cuatro niveles hechos aún falta el jefe: ni mundo nuevo, ni insignia del océano.
    if (save.progress.unlockedWorlds.includes('mountain') || save.rewards.unlockedBadges.includes('ocean')) throw new Error('El océano se dio por recuperado sin derrotar al jefe');
    console.log('  ✓     preguntas completas (falta el jefe para recuperar el océano)');

    // ---- Nivel 5: jefe final Plastipulpo.
    await page.keyboard.press('Enter'); // Siguiente nivel
    await waitScene('Boss');
    const boss = () => page.evaluate(() => {
      const s = window.__ECOMISION__.scene.getScene('Boss');
      const cur = s.round.current;
      const bins = {}; for (const b of s.bins) bins[b.bin.id] = Math.round(b.x);
      return { index: s.round.index, total: s.round.total, shields: s.shields, escaped: s.escaped, inked: !!(s.waste && s.waste.inked), bin: cur && cur.bin, bins, explain: s.explain.visible };
    });
    const bossReady = () => page.waitForFunction(() => {
      const s = window.__ECOMISION__.scene.getScene('Boss');
      return s.scene.isActive() && !s.busy && !s.explain.visible && !!s.waste;
    }, null, { timeout: 40000 });
    const bossIndex = (n) => page.waitForFunction((k) => window.__ECOMISION__.scene.getScene('Boss').round.index === k, n, { timeout: 40000 });
    await bossReady();
    await page.waitForTimeout(800);
    await shot('18-jefe');
    let bs = await boss();
    // Tras once respuestas casi perfectas la dificultad adaptativa sube: el jefe tiene 10 de vida.
    if (bs.total !== 10 || bs.shields !== 3) throw new Error(`Jefe: ${JSON.stringify(bs)}`);
    // Un error cuesta un escudo y no le quita vida al jefe.
    await click(bs.bins[Object.keys(bs.bins).find((b) => b !== bs.bin)], 760);
    await page.waitForFunction(() => window.__ECOMISION__.scene.getScene('Boss').explain.visible, null, { timeout: 40000 });
    await page.keyboard.press('Enter');
    await bossReady();
    bs = await boss();
    if (bs.index !== 0 || bs.shields !== 2 || bs.escaped) throw new Error(`Tras un error contra el jefe: ${JSON.stringify(bs)}`);
    let inkSeen = 0;
    for (let i = 0; i < 10; i++) {
      await bossReady();
      bs = await boss();
      if (bs.inked) { // Chorro de tinta: tocar una caneca primero limpia el residuo, sin contar como respuesta.
        inkSeen++;
        if (inkSeen === 1) { await page.waitForTimeout(500); await shot('18b-jefe-tinta'); }
        await click(bs.bins[bs.bin], 760);
        await page.waitForTimeout(400);
        bs = await boss();
        if (bs.inked || bs.index !== i) throw new Error(`La tinta no se limpió bien: ${JSON.stringify(bs)}`);
      }
      await click(bs.bins[bs.bin], 760);
      await bossIndex(i + 1);
    }
    if (inkSeen !== 3) throw new Error(`Plastipulpo debía usar la tinta 3 veces en 10 residuos, la usó ${inkSeen}`);
    await waitScene('Results');
    await page.waitForTimeout(2600);
    await shot('18c-jefe-derrotado');
    save = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1'))).then((d) => d.progress);
    if (!save.missionProgress['ocean-5']) throw new Error('No se guardó la victoria contra el jefe');
    if (JSON.stringify(save.unlockedWorlds) !== '["city","forest","ocean","mountain"]') throw new Error(`Al derrotar al jefe: ${save.unlockedWorlds}`);
    console.log('  ✓     jefe Plastipulpo derrotado: océano recuperado y montaña abierta');

    // El jefe se puede escapar: tres errores agotan los escudos y se ofrece reintentar (sin perder nada).
    await page.keyboard.press('Escape');
    await waitScene('MissionIntro');
    await page.waitForTimeout(600);
    await shot('18d-niveles-completos');
    await click(...ROW(5));
    await waitScene('Boss');
    for (let k = 0; k < 3; k++) {
      await bossReady();
      bs = await boss();
      if (bs.inked) { await click(bs.bins[bs.bin], 760); await page.waitForTimeout(400); }
      await click(bs.bins[Object.keys(bs.bins).find((b) => b !== bs.bin)], 760);
      await page.waitForFunction(() => window.__ECOMISION__.scene.getScene('Boss').explain.visible, null, { timeout: 40000 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    bs = await boss();
    // Solo tiene la Ola limpiadora (no el Escudo de hojas), así que los tres errores cuentan.
    if (!bs.escaped || bs.shields !== 0 || bs.index !== 0) throw new Error(`El jefe debía escapar: ${JSON.stringify(bs)}`);
    await page.waitForTimeout(900);
    await shot('18e-jefe-escapa');
    const before = await page.evaluate(() => localStorage.getItem('ecomision.save.v1'));
    await page.keyboard.press('Enter'); // Reintentar
    await page.waitForFunction(() => { const s = window.__ECOMISION__.scene.getScene('Boss'); return s.scene.isActive() && !s.escaped && s.shields === 3 && !s._leaving; }, null, { timeout: 40000 });
    if (before !== await page.evaluate(() => localStorage.getItem('ecomision.save.v1'))) throw new Error('Que el jefe escape no debe cambiar la partida guardada');
    console.log('  ✓     el jefe escapa sin escudos y se puede reintentar sin perder nada');
    await bossReady();

    // Misión 2 (contrarreloj opcional): el reloj aparece y no corre durante las animaciones.
    await page.keyboard.press('Escape');
    await waitScene('MissionIntro');
    await click(...ROW(2));
    await waitScene('Sorting');
    await waitReady();
    const timer = await page.evaluate(() => { const s = window.__ECOMISION__.scene.getScene('Sorting'); return { timed: s.setup.timed, left: s.timeLeft, total: s.round.total, clean: s.env.clean, uses: s.abilityBar.uses }; });
    if (!timer.timed || !(timer.left > timer.total * 7 - 5 && timer.left <= timer.total * 7) || timer.clean !== 1) throw new Error(`Contrarreloj: ${JSON.stringify(timer)}`);
    // Habilidad ganada a Plastipulpo: la Ola limpiadora clasifica un residuo, una sola vez por nivel.
    if (JSON.stringify(timer.uses) !== '{"lupa":0,"ola":1}') throw new Error(`Habilidades disponibles: ${JSON.stringify(timer.uses)}`);
    await shot('19-contrarreloj');
    await click(1810, 300);
    await waitIndex(1);
    await waitReady();
    await click(1810, 300); // ya no quedan usos: no hace nada
    await page.waitForTimeout(700);
    const afterOla = await page.evaluate(() => { const s = window.__ECOMISION__.scene.getScene('Sorting'); return { index: s.round.index, uses: s.abilityBar.uses.ola }; });
    if (afterOla.index !== 1 || afterOla.uses !== 0) throw new Error(`Ola limpiadora: ${JSON.stringify(afterOla)}`);
    console.log('  ✓     habilidad Ola limpiadora: un uso por nivel');

    // ---- Recompensas: insignias ganadas, tienda, álbum y perfil.
    save = await page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')));
    if (JSON.stringify(save.rewards.unlockedBadges) !== '["first","ocean"]') throw new Error(`Insignias: ${save.rewards.unlockedBadges}`);
    if (save.progress.ecoCoins !== 95) throw new Error(`Monedas antes de la tienda: ${save.progress.ecoCoins}`);
    await page.keyboard.press('Escape');
    await waitScene('MissionIntro');
    await page.keyboard.press('Escape');
    await waitScene('WorldMap');
    const NAV = (n) => [W / 2 + (n - 3) * 358, H - 86]; // 1 Álbum, 2 Tienda, 3 Insignias, 4 Perfil
    const CARD = (i) => [740 + (i % 4) * 320, 510 + Math.floor(i / 4) * 350];
    const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem('ecomision.save.v1')));

    await click(...NAV(2));
    await waitScene('Shop');
    await page.waitForTimeout(500);
    await shot('20-tienda-personajes');
    // Tortuga (30 monedas + insignia del océano): primer toque pide confirmar, el segundo compra y la estrena.
    await click(...CARD(5));
    await page.waitForTimeout(300);
    if ((await readSave()).progress.ecoCoins !== 95) throw new Error('Un solo toque no debe comprar');
    await click(...CARD(5));
    await page.waitForTimeout(400);
    save = await readSave();
    if (save.progress.ecoCoins !== 65 || save.profile.avatar !== 'tortuga' || !save.rewards.unlockedCharacters.includes('tortuga')) throw new Error(`Compra de la tortuga: ${JSON.stringify(save.profile)} ${save.progress.ecoCoins}`);
    // Búho (pide nivel 5): no se compra y no gasta nada.
    await click(...CARD(6)); await page.waitForTimeout(300); await click(...CARD(6)); await page.waitForTimeout(300);
    save = await readSave();
    if (save.progress.ecoCoins !== 65 || save.rewards.unlockedCharacters.length !== 5) throw new Error(`Compras no permitidas: ${JSON.stringify(save.rewards)}`);
    // Accesorios: gorra (20). Luego se quita y se vuelve a poner sin pagar otra vez.
    await click(800 + 370, 262);
    await page.waitForTimeout(400);
    await click(...CARD(0)); await page.waitForTimeout(300); await click(...CARD(0)); await page.waitForTimeout(400);
    save = await readSave();
    if (save.progress.ecoCoins !== 45 || save.profile.accessory !== 'gorra') throw new Error(`Compra de la gorra: ${JSON.stringify(save.profile)} ${save.progress.ecoCoins}`);
    await click(...CARD(0)); await page.waitForTimeout(300);
    if ((await readSave()).profile.accessory !== null) throw new Error('Tocar el accesorio puesto debe quitarlo');
    await click(...CARD(0)); await page.waitForTimeout(400);
    save = await readSave();
    if (save.progress.ecoCoins !== 45 || save.profile.accessory !== 'gorra') throw new Error('Volver a ponerse un accesorio no debe costar');
    await shot('21-tienda-accesorios');
    console.log('  ✓     tienda: confirmar, comprar, estrenar, quitar y límites de monedas y requisitos');
    await page.keyboard.press('Escape');
    await waitScene('WorldMap');
    await page.waitForTimeout(500);
    await shot('22-mapa-con-estilo');

    await click(...NAV(1));
    await waitScene('Album');
    await page.waitForTimeout(500);
    await shot('23-album');
    const album = await page.evaluate(() => { const s = window.__ECOMISION__.scene.getScene('Album'); return { learned: s.learned.length, selected: s.selected }; });
    if (album.learned < 6 || !album.selected) throw new Error(`Álbum: ${JSON.stringify(album)}`);
    await page.keyboard.press('Escape');
    await waitScene('WorldMap');

    await click(...NAV(3));
    await waitScene('Badges');
    await page.waitForTimeout(500);
    await shot('24-insignias');
    await page.keyboard.press('Escape');
    await waitScene('WorldMap');

    await click(...NAV(4));
    await waitScene('PlayerProfile');
    await page.waitForTimeout(500);
    await shot('25-perfil');
    await click(1290 + 330, 926); // Habilidades
    await waitScene('Abilities');
    await page.waitForTimeout(500);
    await shot('26-habilidades');
    await page.keyboard.press('Escape');
    await waitScene('WorldMap');

    if (errors.length) throw new Error(`Errores en la consola:\n${errors.join('\n')}`);
    console.log(`\nPrueba de humo superada (${step} pantallas verificadas, 0 errores de consola).`);
  } finally {
    await browser.close();
    server.kill();
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error('\nPRUEBA DE HUMO FALLIDA:', err.message); process.exit(1); });
