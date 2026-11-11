# EcoMisión: Guardianes del Planeta 🌎

Videojuego educativo web para niños de 5 a 12 años. Enseña a identificar, separar y
disponer correctamente los residuos (código de colores de Colombia: caneca **blanca**,
**negra** y **verde**) a través de una aventura por cinco mundos.

> **Estado: FASE 1 terminada** (identidad visual, personajes, arquitectura y navegación).
> El juego de clasificación, los mundos jugables, las recompensas y Firebase llegan en
> las fases 2 a 8. Ver [Plan por fases](#plan-de-desarrollo-por-fases).

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
| Gestión de mundos | `src/config/worlds.js`, `WorldMapScene` |
| Sistema de misiones | `src/config/worlds.js` (datos), `MissionIntroScene` — lógica en fase 4 |
| Clasificación de residuos | fase 2 (`src/game/`) |
| Sistema de recompensas | fase 5 (`src/core/Rewards.js`) |
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
  ui/                     widgets (Button, panel, toast, chip), Character, DialogBox, FocusManager
  scenes/                 Boot, Title, Story, Profile, WorldMap, MissionIntro, Settings, ComingSoon
tests/                    Pruebas unitarias
scripts/smoke.cjs         Prueba de humo en navegador
```

## Flujo de navegación

```
Boot ─► Inicio ─┬─► Historia ─► Perfil (edad ─► avatar y apodo) ─► Mapa de mundos
                │                                                   │
                └─(si ya hay partida: "¡Continuar!")────────────────┤
                                                                    ├─► Introducción de misiones ─► [Juego de clasificación: fase 2] ─► [Resultados: fase 5]
Ajustes (ventana desde Inicio y Mapa)                               └─► Álbum · Tienda · Insignias · Perfil · Adultos  [fases 5 y 7]
Inicio ─► Ingresar [fase 6] · Padres y docentes [fase 7]
```

Las secciones entre corchetes ya tienen su botón y su pantalla "en construcción" que indica
en qué fase llegan; no simulan funcionalidad.

## Mecánicas (diseño)

- **Sorting Game**: aparece un residuo → el jugador lo arrastra (o lo toca y luego toca la caneca;
  con teclado: flechas + Enter) → se verifica → acierto: celebración, experiencia y monedas;
  error: explicación breve y nuevo intento, sin castigos fuertes.
- **Canecas** identificadas por color, nombre, icono y símbolo:
  blanca = aprovechables limpios y secos · negra = no aprovechables · verde = orgánicos aprovechables.
- **Tres modos por edad** (`src/config/ageModes.js`): Explorador 5-7 (sin cronómetro, ayudas frecuentes),
  Aventurero 8-10 (más residuos, preguntas), Experto ambiental 11-12 (residuos complejos, decisiones
  de reducir/reutilizar/reciclar). La dificultad se ajustará además según el desempeño.
- **Recompensas ligadas al aprendizaje**: monedas ecológicas, experiencia y niveles, cinco insignias
  (una por mundo), álbum ecológico y mundos que se limpian visualmente. Sin compras, apuestas ni cajas aleatorias.

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
| 2 | Motor del juego y mecánica Sorting Game (arrastrar, tocar, teclado) | Pendiente |
| 3 | Los cinco mundos con arte, música y elementos propios | Pendiente |
| 4 | Misiones, niveles y dificultad adaptativa | Pendiente |
| 5 | Monedas, experiencia, insignias, tienda, álbum, perfil | Pendiente |
| 6 | Firebase Authentication, Firestore, reglas de seguridad, Hosting | Pendiente |
| 7 | Panel de padres y docentes | Pendiente |
| 8 | Accesibilidad (narración por voz, subtítulos), pruebas, seguridad y publicación | Pendiente |

## Accesibilidad ya incluida en la fase 1

Botones grandes (mínimo ~100 px de alto en el lienzo), tipografía redondeada y legible (Fredoka),
texto con contorno sobre fondos, navegación completa con teclado (Tab/flechas, Enter/Espacio, Escape)
con anillo de foco visible, controles táctiles, música y sonidos desactivables por separado,
y todo lo que dicen los personajes aparece escrito.
