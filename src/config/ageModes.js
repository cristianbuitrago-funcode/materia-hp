// Dificultad por edades. Los parámetros de juego (binOptions, timer, hints)
// los consume el motor de clasificación a partir de la fase 2.
export const AGE_MODES = [
  {
    id: 'explorer',
    name: 'Explorador',
    ages: '5 a 7 años',
    ageRange: '5-7',
    color: 0x2bb673,
    icon: 'ic-lupa',
    stars: 1,
    description: 'Residuos fáciles\ny muchas ayudas',
    rules: { timer: false, hints: 'frequent', wasteTier: 1, questions: false },
  },
  {
    id: 'adventurer',
    name: 'Aventurero',
    ages: '8 a 10 años',
    ageRange: '8-10',
    color: 0xff8a3d,
    icon: 'ic-brujula',
    stars: 2,
    description: 'Más residuos\ny misiones con retos',
    rules: { timer: 'optional', hints: 'some', wasteTier: 2, questions: true },
  },
  {
    id: 'expert',
    name: 'Experto ambiental',
    ages: '11 a 12 años',
    ageRange: '11-12',
    color: 0x7b5ea7,
    icon: 'ic-planeta',
    stars: 3,
    description: 'Residuos difíciles\ny decisiones reales',
    rules: { timer: 'optional', hints: 'few', wasteTier: 3, questions: true },
  },
];

export function getAgeMode(id) {
  return AGE_MODES.find((m) => m.id === id) || null;
}
