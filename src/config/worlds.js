// Gestión de mundos: datos de los cinco escenarios desbloqueables.
// Cada mundo tiene cinco niveles (ver missions.js): cuatro misiones y un jefe final.
export const WORLDS = [
  {
    id: 'city',
    wastes: ['botella', 'lata', 'carton', 'periodico', 'papel', 'tapa', 'banano', 'comida', 'naranja', 'servilleta', 'chicle', 'papas'], // residuos típicos de este mundo (salen primero en las rondas)
    order: 1,
    name: 'La Ciudad Contaminada',
    short: 'Ciudad',
    color: 0xff8a3d,
    sky: [0x8fb8d9, 0xf6dcc0],
    ground: 0x8d99a6,
    guide: 'eco',
    badge: 'Héroe del Reciclaje',
    description: 'Las calles, los parques y el colegio están llenos de basura. ¡La ciudad necesita guardianes!',
    intro: '¡Mira cuánta basura hay en la ciudad! Vamos a recogerla y a ponerla en su caneca.',
    // Cada nivel ocurre en un lugar distinto del mundo; el quinto es el jefe.
    places: ['El parque', 'El colegio', 'La oficina', 'El punto de basuras', 'El callejón'],
    missions: ['Recoger botellas', 'Separar papel y cartón', 'Clasificar residuos orgánicos', 'Limpiar a contrarreloj', 'Derrotar a Ratasura'],
  },
  {
    id: 'forest',
    wastes: ['hojas', 'manzana', 'banano', 'naranja', 'huevo', 'botella', 'lata', 'vidrio', 'bolsa', 'papas', 'servilleta', 'chicle'], // residuos típicos de este mundo (salen primero en las rondas)
    order: 2,
    name: 'El Bosque Perdido',
    short: 'Bosque',
    color: 0x2bb673,
    sky: [0x6fcf97, 0xe3f6c8],
    ground: 0x2e8b57,
    guide: 'eco',
    badge: 'Guardián del Bosque',
    description: 'Los animales perdieron su hogar entre los residuos. Ayúdalos a recuperar su hábitat.',
    intro: 'Los animales del bosque están tristes. La basura les hace daño. ¡Vamos a ayudarlos!',
    // Cada nivel ocurre en un lugar distinto del mundo; el quinto es el jefe.
    places: ['El sendero', 'El campamento', 'El claro', 'El río', 'El pantano'],
    missions: ['Limpiar el sendero', 'Revisar las canecas', 'Recuperar zonas verdes', 'Cuidar a los animales', 'Derrotar a Moscardón'],
  },
  {
    id: 'ocean',
    wastes: ['botella', 'bolsa', 'tapa', 'lata', 'vidrio', 'tetrapak', 'comida', 'vaso', 'tapabocas', 'icopor', 'papas', 'chicle'], // residuos típicos de este mundo (salen primero en las rondas)
    order: 3,
    name: 'El Océano en Peligro',
    short: 'Océano',
    color: 0x1e88e5,
    sky: [0x0b6fb8, 0x6fd3f2],
    ground: 0xe8c98a,
    guide: 'reciclin',
    badge: 'Protector del Océano',
    description: 'Peces, tortugas y corales nadan entre plásticos. ¡El mar te necesita!',
    intro: '¡Bip, bip! El plástico tarda cientos de años en desaparecer. Saquémoslo del mar.',
    // Cada nivel ocurre en un lugar distinto del mundo; el quinto es el jefe.
    places: ['La orilla', 'El muelle', 'El arrecife', 'Mar abierto', 'La fosa'],
    missions: ['Recoger residuos plásticos', 'Limpiar a contrarreloj', 'Identificar contaminantes', 'Proteger a los animales marinos', 'Derrotar a Plastipulpo'],
  },
  {
    id: 'mountain',
    wastes: ['carton', 'papel', 'tetrapak', 'frasco', 'cafe', 'huevo', 'hojas', 'pizza', 'icopor', 'higienico', 'tapabocas', 'vaso'], // residuos típicos de este mundo (salen primero en las rondas)
    order: 4,
    name: 'La Montaña de Residuos',
    short: 'Montaña',
    color: 0x8d6e63,
    sky: [0xb9a6c9, 0xf3d9b1],
    ground: 0x7a6a5d,
    guide: 'reciclin',
    badge: 'Maestro de la Separación',
    description: 'Aquí termina la basura que no separamos. Descubre qué se puede aprovechar y qué no.',
    intro: '¡Bip! Esta montaña creció porque nadie separó sus residuos. ¡Tú puedes hacerla más pequeña!',
    // Cada nivel ocurre en un lugar distinto del mundo; el quinto es el jefe.
    places: ['La entrada', 'El taller de reúso', 'La banda de separación', 'La cima', 'El cráter'],
    missions: ['Aprovechable o no aprovechable', 'Aprender a reutilizar', 'Encontrar errores', 'Resolver desafíos', 'Derrotar a Basurón'],
  },
  {
    id: 'future',
    wastes: [], // residuos típicos de este mundo (salen primero en las rondas)
    order: 5,
    name: 'El Futuro Sostenible',
    short: 'Futuro',
    color: 0xffc107,
    sky: [0x4fc3f7, 0xfff3b0],
    ground: 0x43a047,
    guide: 'eco',
    badge: 'Salvavidas del Planeta',
    description: 'Así se ve el planeta cuando todos lo cuidamos. Completa la misión final para salvarlo.',
    intro: '¡Lo lograste! Este es el mundo que podemos construir juntos. Falta la misión final.',
    // Cada nivel ocurre en un lugar distinto del mundo; el quinto es el jefe.
    places: ['El barrio solar', 'La huerta comunitaria', 'La planta de reciclaje', 'La plaza central', 'La fábrica gris'],
    missions: ['Construir espacios sostenibles', 'Revisar las canecas', 'Recuperar ecosistemas', 'El gran reto final', 'Derrotar a Contaminator'],
  },
];

export const FIRST_WORLD = WORLDS[0].id;

export function getWorld(id) {
  return WORLDS.find((w) => w.id === id) || null;
}

// Mundo que sigue a `id` en el recorrido, o null si es el último.
export function nextWorld(id) {
  const w = getWorld(id);
  if (!w) return null;
  return WORLDS.find((x) => x.order === w.order + 1) || null;
}
