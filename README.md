# EcoMisión: Guardianes del Planeta 🌎

Videojuego educativo web para niños de 5 a 12 años. Enseña a identificar, separar y
disponer correctamente los residuos (código de colores de Colombia: caneca **blanca**,
**negra** y **verde**) a través de una aventura por cinco mundos.

> **Estado: FASES 1, 2 y 3 terminadas** (identidad visual, personajes, navegación, el juego
> de clasificación y los cinco mundos con escenario, música y residuos propios). Las misiones,
> la tienda, el álbum y Firebase llegan en las fases 4 a 8. Ver [Plan por fases](#plan-de-desarrollo-por-fases).

## Cómo ejecutarlo

```bash
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run build        # compila a dist/ (lo que se publicará en Firebase Hosting)
npm test             # pruebas unitarias (Vitest)
npm run test:smoke   # recorre el juego compilado en un navegador real (requiere Playwright + Chromium)
```

## Arquitectura técnica

- **Phaser 3** (motor 2D, WebGL con respaldo a Canvas) + **Vite** (empaquetado) + JavaScript ES modules.
- Lienzo de diseño **1920×1080** escalado con `Scale.FIT`: se adapta a computador, tableta y teléfono.
- **Arte 100 % vectorial generado por código** (`src/art`): personajes, avatares e iconos son SVG
  parametrizados que se convierten en texturas al arrancar. No hay imágenes externas ni emojis.
- **Audio sintetizado** con Web Audio (`AudioManager`): música y efectos sin archivos.
- **Estado y guardado** (`GameState`) desacoplados del almacenamiento mediante un adaptador
  `{ load, save, clear }`. Hoy: `localStorage` (modo de prueba). Fase 6: adaptador de Cloud Firestore.
- Los **datos de contenido** (mundos, misiones, modos de edad, guion) viven en `src/config`
  y no dependen de Phaser, por lo que se prueban de forma aislada.

| Módulo pedido | Dónde está |
| --- | --- |
| Motor del videojuego | `src/main.js`, `src/scenes/` |
| Gestión de mundos | `src/config/worlds.js` (datos), `src/worlds/` (escenarios y limpieza visual), `WorldMapScene` |
| Sistema de misiones | `src/config/worlds.js` (datos), `MissionIntroScene` — lógica en fase 4 |
| Clasificación de residuos | `src/game/` (catálogo, canecas, `SortingEngine`), `SortingScene`, `ResultsScene` |
| Sistema de recompensas | experiencia, monedas, nivel y estrellas en `SortingEngine` y `GameState` — insignias, tienda y álbum en fase 5 |
| Gestión de usuarios | `ProfileScene`, `GameState.createProfile` — cuentas de adultos en fase 6 |
| Integración Firebase | fase 6 (`src/firebase/`) |
| Recursos gráficos y sonoros | `src/art/`, `src/core/AudioManager.js` |
| Guardado de progreso | `src/core/GameState.js` |

## Estructura de carpetas

```
index.html
src/
  main.js                 Configuración de Phaser y registro de escenas
  config/                 Datos: theme, worlds, ageModes, avatars, story
  core/                   GameState (guardado), AudioManager, Navigation (transiciones)
  art/                    characters (ECO, RECICLÍN, CONTAMINATOR, avatares), icons, textures, backgrounds
  game/                   wastes (25 residuos), bins (3 canecas), SortingEngine (rondas y premios), BinTarget
  worlds/                 city, forest, ocean, mountain, future (escenarios), kit (piezas), index (limpieza visual)
  ui/                     widgets (Button, panel, toast, chip), Character, DialogBox, FocusManager
  scenes/                 Boot, Title, Story, Profile, WorldMap, MissionIntro, Sorting, Results, Settings, ComingSoon
tests/                    Pruebas unitarias
scripts/smoke.cjs         Prueba de humo en navegador
```

## Flujo de navegación

```
Boot ─► Inicio ─┬─► Historia ─► Perfil (edad ─► avatar y apodo) ─► Mapa de mundos
                │                                                   │
                └─(si ya hay partida: "¡Continuar!")────────────────┤
                                                                    ├─► Introducción de misiones ─► Juego de clasificación ─► Resultados ─► (otra vez | mapa)
Ajustes (ventana desde Inicio y Mapa)                               └─► Álbum · Tienda · Insignias · Perfil · Adultos  [fases 5 y 7]
Inicio ─► Ingresar [fase 6] · Padres y docentes [fase 7]
```

Las secciones entre corchetes ya tienen su botón y su pantalla "en construcción" que indica
en qué fase llegan; no simulan funcionalidad.

## Mecánicas (diseño)

- **Sorting Game** (hecho): aparece un residuo → el jugador lo arrastra a una caneca, o toca la caneca,
  o usa el teclado (Tab/flechas + Enter, o las teclas 1, 2 y 3) → se verifica → acierto: celebración,
  dato curioso, experiencia y monedas; error: RECICLÍN explica por qué y se reintenta. Los errores
  no restan nada: acertar a la primera da 10 de experiencia y 2 monedas; tras un error, 5 y 1.
  Terminar la ronda da un bono y siempre al menos una estrella.
- **Rondas por edad** (`ROUND_RULES`): Explorador 6 residuos fáciles y pista al primer error;
  Aventurero 8 residuos y pista al segundo; Experto 10 residuos (incluye casos difíciles como la
  caja de pizza con grasa) y pista al tercero. La pista es la caneca correcta brillando.
- **Canecas** identificadas por color, nombre, icono y símbolo:
  blanca = aprovechables limpios y secos · negra = no aprovechables · verde = orgánicos aprovechables.
- **Tres modos por edad** (`src/config/ageModes.js`): Explorador 5-7 (sin cronómetro, ayudas frecuentes),
  Aventurero 8-10 (más residuos, preguntas), Experto ambiental 11-12 (residuos complejos, decisiones
  de reducir/reutilizar/reciclar). La dificultad se ajustará además según el desempeño.
- **Recompensas ligadas al aprendizaje**: monedas ecológicas, experiencia y niveles, cinco insignias
  (una por mundo), álbum ecológico y mundos que se limpian visualmente. Sin compras, apuestas ni cajas aleatorias.

## Los cinco mundos (hecho)

| Mundo | Escenario | Al recuperarse aparecen | Residuos típicos | Música |
| --- | --- | --- | --- | --- |
| 1 · Ciudad Contaminada | Edificios, tienda, colegio, parque y calle con humo y bolsas de basura | Árboles, flores, banca y pájaros | Botellas, latas, papel, cartón, cáscaras, chicle | Rápida y saltarina |
| 2 · Bosque Perdido | Pinos, sendero y árboles grandes con basura y neblina | Flores, hongos, mariposas, un conejo | Hojas secas, cáscaras, botellas, bolsas | Pentatónica y tranquila |
| 3 · Océano en Peligro | Fondo marino con bolsas y botellas a la deriva y corales grises | Corales de colores, peces y una tortuga | Bolsas, tapas, botellas, icopor, vasos | Lenta, en olas |
| 4 · Montaña de Residuos | Un botadero gigante con humo | Colina verde, planta de reciclaje y composteras | Casos difíciles: caja de pizza, icopor, caja de leche | En tono menor, con final esperanzador |
| 5 · Futuro Sostenible | Aerogeneradores, casas con paneles solares y ciclorruta, con terrenos sin recuperar | Arcoíris, huerta, árboles y mariposas | Todo el catálogo | Brillante y veloz |

- **Reconstrucción de escenarios:** cada acierto limpia un poco el mundo a la vista del jugador
  (la basura desaparece, vuelve la vida y se despeja la neblina). Cada ronda terminada recupera
  un tercio del mundo y queda guardado; con tres rondas el mundo está recuperado.
- **Desbloqueo provisional:** terminar una ronda en un mundo abre el siguiente. La fase 4 lo
  condicionará a completar las misiones.
- **Rendimiento:** las capas fijas de cada escenario se convierten en una sola imagen al cargar,
  para que el juego funcione en computadores modestos.

## Privacidad infantil

- El modo de prueba no pide ni guarda datos personales: solo rango de edad, avatar y un
  **apodo generado por el juego** (el niño no escribe su nombre).
- El progreso del modo de prueba se guarda únicamente en el navegador (`localStorage`).

## Modelo de datos de Firebase (fase 6)

```
users/{userId}            email, createdAt, accountType ("parent" | "teacher"), consentStatus
players/{playerId}        parentId, nickname, ageRange, avatar, level, experience, ecoCoins,
                          completedMissions, unlockedWorlds
playerProgress/{playerId} parentId, worldProgress, missionProgress, correctAnswers,
                          incorrectAnswers, learnedWasteTypes
rewards/{playerId}        parentId, unlockedBadges, unlockedCharacters, unlockedAccessories
```

Reglas previstas: un adulto solo lee y escribe `users/{su uid}` y los documentos cuyo
`parentId` sea su `uid`; crear perfiles infantiles exige `consentStatus == "granted"`;
se validan tipos y rangos (por ejemplo, las monedas no pueden ser negativas). Las contraseñas
las gestiona Firebase Authentication; en el cliente solo va la configuración pública del proyecto.

## Plan de desarrollo por fases

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Diseño visual, identidad, personajes, arquitectura y navegación | ✅ Terminada |
| 2 | Motor del juego y mecánica Sorting Game (arrastrar, tocar, teclado) | ✅ Terminada |
| 3 | Los cinco mundos con arte, música y elementos propios | ✅ Terminada |
| 4 | Misiones, niveles y dificultad adaptativa | Pendiente |
| 5 | Monedas, experiencia, insignias, tienda, álbum, perfil | Pendiente |
| 6 | Firebase Authentication, Firestore, reglas de seguridad, Hosting | Pendiente |
| 7 | Panel de padres y docentes | Pendiente |
| 8 | Accesibilidad (narración por voz, subtítulos), pruebas, seguridad y publicación | Pendiente |

## Accesibilidad ya incluida

Botones grandes (mínimo ~100 px de alto en el lienzo), tipografía redondeada y legible (Fredoka),
texto con contorno sobre fondos, navegación completa con teclado (Tab/flechas, Enter/Espacio, Escape)
con anillo de foco visible, tres formas de clasificar (arrastrar, tocar, teclado), canecas identificadas
por color, nombre, símbolo y descripción, controles táctiles, música y sonidos desactivables por separado,
y todo lo que dicen los personajes aparece escrito.

## Fuente de la clasificación

Los residuos siguen el código de colores de la Resolución 2184 de 2019 (Colombia): blanca para
plástico, vidrio, metales, multicapa, papel y cartón limpios y secos; verde para restos de comida
y desechos agrícolas; negra para papel higiénico, servilletas, papeles y cartones contaminados con
comida y papeles metalizados. Conviene que un docente o la autoridad ambiental local revise el
catálogo (`src/game/wastes.js`) antes de usarlo en clase, porque algunos municipios tienen reglas propias.
