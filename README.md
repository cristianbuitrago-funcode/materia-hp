# EcoMisión: Guardianes del Planeta 🌎

Videojuego educativo web para niños de 5 a 12 años. Enseña a identificar, separar y
disponer correctamente los residuos (código de colores de Colombia: caneca **blanca**,
**negra** y **verde**) a través de una aventura por cinco mundos.

> **Estado: FASES 1 a 5 terminadas**, más la ampliación de **cinco niveles por mundo con jefe
> final y habilidades**. Firebase, el panel de adultos y la accesibilidad final llegan en las
> fases 6 a 8. Ver [Plan por fases](#plan-de-desarrollo-por-fases).

## Cómo ejecutarlo

```bash
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run build        # compila a dist/ (lo que se publicará en Firebase Hosting)
npm test             # pruebas unitarias (Vitest)
npm run test:smoke   # recorre el juego compilado en un navegador real (requiere Playwright + Chromium)
```

## Tráiler

`media/trailer-ecomision.mp4` es un tráiler de 30 segundos (1920×1080) hecho con imágenes reales
del juego y su música. Se regenera con `npm run build && npm run trailer` (requiere Playwright,
Chromium y ffmpeg): el guion está en `scripts/trailer.cjs`.

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
| Sistema de misiones | `src/config/missions.js` (plan), `src/game/questions.js`, `src/game/Difficulty.js`, `MissionIntroScene`, `ChallengeScene` |
| Clasificación de residuos | `src/game/` (catálogo, canecas, `SortingEngine`), `SortingScene`, `ResultsScene` |
| Sistema de recompensas | `src/game/rewards.js` (insignias y títulos), `src/game/shop.js` (tienda), `SortingEngine` y `GameState` (experiencia, monedas, compras), escenas `Album`, `Shop`, `Badges`, `PlayerProfile` |
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
  game/                   wastes (25 residuos), bins (3 canecas), SortingEngine (rondas y premios), BinTarget,
                          bosses (jefes y ataques), abilities (habilidades), Difficulty, questions, rewards, shop
  worlds/                 city, forest, ocean, mountain, future (escenarios), kit (piezas), index (limpieza visual)
  ui/                     widgets (Button, panel, toast, chip), Character, DialogBox, FocusManager
  scenes/                 Boot, Title, Story, Profile, WorldMap, MissionIntro, Sorting, Challenge, Boss, Results,
                          Album, Shop, Badges, PlayerProfile, Abilities, Settings, ComingSoon
tests/                    Pruebas unitarias
scripts/smoke.cjs         Prueba de humo en navegador
```

## Flujo de navegación

```
Boot ─► Inicio ─┬─► Historia ─► Perfil (edad ─► avatar y apodo) ─► Mapa de mundos
                │                                                   │
                └─(si ya hay partida: "¡Continuar!")────────────────┤
                                                                    ├─► Lista de niveles ─► Nivel (clasificar | ¿está bien? | preguntas | jefe) ─► Resultados ─► siguiente nivel
Ajustes (ventana desde Inicio y Mapa)                               └─► Álbum · Tienda · Insignias · Perfil · Adultos [fase 7]
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
  (la basura desaparece, vuelve la vida y se despeja la neblina). Cada nivel terminado recupera
  una quinta parte del mundo y queda guardado; al derrotar al jefe el mundo está recuperado.
- **Rendimiento:** las capas fijas de cada escenario se convierten en una sola imagen al cargar,
  para que el juego funcione en computadores modestos.

## Niveles, jefes y habilidades (hecho)

Cada mundo tiene **cinco niveles**, cada uno en un lugar propio con su escenario, y la dificultad
sube de uno a otro (rondas más largas y, desde el segundo nivel, residuos más difíciles). El quinto
nivel es el **jefe final**; al derrotarlo se recupera el mundo, se abre el siguiente y se gana una habilidad.

| Mundo | Niveles 1 a 4 | Jefe (nivel 5) | Ataque especial | Habilidad que entrega |
| --- | --- | --- | --- | --- |
| Ciudad | El parque · El colegio · La oficina · El punto de basuras | **Ratasura**, la rata gigante (El callejón) | *Revolcón*: cambia las canecas de lugar | **Lupa de Reciclín**: una vez por nivel hace brillar la caneca correcta |
| Bosque | El sendero · El campamento · El claro · El río | **Moscardón**, el rey de las moscas (El pantano) | *Nube de humo*: tapa los letreros de las canecas | **Escudo de hojas**: perdona el primer error de cada nivel |
| Océano | La orilla · El muelle · El arrecife · Mar abierto | **Plastipulpo**, el pulpo de plástico (La fosa) | *Chorro de tinta*: mancha el residuo; hay que tocarlo para limpiarlo | **Ola limpiadora**: una vez por nivel lleva el residuo a su caneca y explica por qué |
| Montaña | La entrada · El taller de reúso · La banda de separación · La cima | **Basurón**, el gólem de basura (El cráter) | *Avalancha*: contrarreloj para un residuo | **Imán de monedas**: una moneda extra por acierto a la primera |
| Futuro | El barrio solar · La huerta comunitaria · La planta de reciclaje · La plaza central | **Contaminator** (La fábrica gris) | Todos los anteriores, más *Mentira*: hace brillar una caneca equivocada | **Estrella del guardián**: las habilidades de botón se usan dos veces por nivel |

**Cómo es el combate** (`BossScene`, `src/game/bosses.js`): el jefe lanza residuos; cada uno bien
clasificado le quita un punto de vida. El jugador tiene tres escudos y pierde uno con cada error; sin
escudos, el jefe «se escapa» y se puede reintentar de inmediato, sin perder progreso ni monedas.
**Los exploradores (5-7 años) no pierden escudos ni reciben el ataque contrarreloj.** Cada error
sigue mostrando la explicación de RECICLÍN, así que el combate también enseña.

Las habilidades no se compran: solo se ganan derrotando jefes (`src/game/abilities.js`).

## Misiones y dificultad adaptativa (hecho)

Los cuatro primeros niveles de cada mundo son misiones que se abren en orden.
Hay tres tipos de reto (`src/config/missions.js`):

| Tipo | Qué se hace | Edades |
| --- | --- | --- |
| Clasificar | Arrastrar residuos a su caneca. Cada misión tiene sus protagonistas (botellas, papel, orgánicos…) o solo dos canecas | Todas |
| ¿Está en la caneca correcta? | Ver un residuo ya botado y decidir si quedó bien. Se juega con imágenes | Todas |
| Preguntas ambientales | Tres opciones; sencillas para 8-10 años, situaciones reales y decisiones de reducir, reutilizar y reciclar para 11-12 | Desde 8 años |

- Los **exploradores (5-7)** nunca reciben preguntas de lectura: en su lugar juegan un reto con imágenes.
- **Contrarreloj opcional** en algunas misiones (nunca para exploradores): terminar a tiempo da un bono
  de monedas; si el tiempo se acaba no pasa nada. El reloj se detiene durante animaciones y explicaciones.
- **Dificultad adaptativa** (`src/game/Difficulty.js`): el juego recuerda las últimas 20 respuestas.
  Con 85 % o más de aciertos a la primera, la ronda crece, entran residuos más difíciles y la pista tarda más;
  con 50 % o menos, la ronda se acorta, los residuos son más fáciles y la pista llega antes. El guía avisa del cambio.
- **Repaso:** los residuos en los que el jugador se equivoca vuelven a salir en las rondas siguientes
  (máximo dos por ronda) hasta que los acierta a la primera.

## Recompensas (hecho)

- **Monedas ecológicas y experiencia:** se ganan al responder y al terminar misiones; cada 100 de
  experiencia se sube de nivel, y cada nivel tiene un título (de «Aprendiz» a «Leyenda del planeta»).
- **Insignias (10):** las cinco del diseño, una por mundo recuperado (Héroe del Reciclaje, Guardián
  del Bosque, Protector del Océano, Maestro de la Separación, Salvavidas del Planeta), más cinco de
  participación, esfuerzo y aprendizaje (por ejemplo «Nunca me Rindo»: jugar 10 misiones con las
  estrellas que sea). Cada una dice exactamente cómo se consigue.
- **Tienda:** 3 personajes nuevos, 5 accesorios y 4 fondos de retrato. Se pagan con monedas
  ecológicas y algunos piden además un nivel o una insignia. Comprar exige un segundo toque de
  confirmación. **No hay dinero real, compras dentro del juego, apuestas ni premios al azar.**
- **Álbum ecológico:** los 25 residuos por caneca; los aprendidos muestran su caneca, la explicación
  y un dato curioso, y los que faltan aparecen como siluetas.
- **Perfil:** retrato con lo que el jugador lleva puesto, nivel, experiencia y sus logros.

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
rewards/{playerId}        parentId, unlockedBadges, unlockedCharacters, unlockedAccessories, unlockedFrames
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
| 4 | Misiones, niveles y dificultad adaptativa | ✅ Terminada |
| 5 | Monedas, experiencia, insignias, tienda, álbum, perfil | ✅ Terminada |
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
