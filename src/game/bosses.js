// Jefes finales: uno por mundo, en el nivel 5. Cada jefe lanza residuos; cada
// residuo bien clasificado le quita un punto de vida. Además, cada uno tiene
// un ataque especial que obliga a fijarse mejor. Nadie pierde progreso: si el
// jugador se queda sin escudos, el jefe escapa y se puede reintentar.
export const BOSSES = {
  city: {
    sprite: 'rata', name: 'Ratasura', title: 'la rata gigante',
    attacks: ['shuffle'], ability: 'lupa',
    taunt: '¡Ñam! ¡Mientras revuelvan la basura, yo seré la reina de la ciudad!',
  },
  forest: {
    sprite: 'mosca', name: 'Moscardón', title: 'el rey de las moscas',
    attacks: ['smoke'], ability: 'escudo',
    taunt: '¡Bzzz! ¡Qué rico huele este bosque lleno de basura!',
  },
  ocean: {
    sprite: 'pulpo', name: 'Plastipulpo', title: 'el pulpo de plástico',
    attacks: ['ink'], ability: 'ola',
    taunt: '¡Glu, glu! ¡Con cada bolsa que cae al mar me crece un tentáculo!',
  },
  mountain: {
    sprite: 'golem', name: 'Basurón', title: 'el gólem de basura',
    attacks: ['rush'], ability: 'iman',
    taunt: '¡Grrr! ¡Todo revuelto, todo mezclado! ¡Así soy más grande!',
  },
  future: {
    sprite: 'contaminator', name: 'Contaminator', title: 'el rey de la mugre',
    attacks: ['lie', 'shuffle', 'smoke', 'ink', 'rush'], ability: 'estrella',
    taunt: '¡Ja, ja! ¡Nadie separa mejor que yo… para revolverlo todo otra vez!',
  },
};

// Ataques especiales y lo que el guía le explica al jugador la primera vez.
export const ATTACKS = {
  shuffle: { name: 'Revolcón', tip: '¡Cambió las canecas de lugar! Fíjate en el nombre y el símbolo, no en el sitio.' },
  smoke: { name: 'Nube de humo', tip: '¡Tapó los letreros! Guíate por el color y el símbolo de cada caneca.' },
  ink: { name: 'Chorro de tinta', tip: '¡Manchó el residuo! Tócalo para limpiarlo y ver qué es.' },
  rush: { name: 'Avalancha', tip: '¡Avalancha! Clasifica este residuo antes de que se acabe el tiempo.' },
  lie: { name: 'Mentira', tip: '¡No le creas! Contaminator hace brillar una caneca equivocada. Piensa tú.' },
};

export const RUSH_SECONDS = 9;
export const BOSS_SHIELDS = 3;

export function getBoss(worldId) {
  return BOSSES[worldId] || null;
}

// Ataque que acompaña al residuo número `index` (desde 0), o null si no hay.
// Los jefes de un solo ataque lo usan cada tres residuos; el jefe final ataca
// uno sí y uno no, rotando todos sus trucos. A los exploradores (5 a 7 años)
// nunca se les pone contrarreloj.
export function attackFor(worldId, index, ageMode) {
  const boss = BOSSES[worldId];
  if (!boss) return null;
  const every = boss.attacks.length > 1 ? 2 : 3;
  if (index % every !== every - 1) return null;
  const turn = Math.floor(index / every);
  const usable = boss.attacks.filter((a) => !(a === 'rush' && ageMode === 'explorer'));
  return usable.length ? usable[turn % usable.length] : null;
}

// Escudos del jugador: los exploradores no pueden perder.
export function shieldsFor(ageMode) {
  return ageMode === 'explorer' ? Infinity : BOSS_SHIELDS;
}
