// Las tres canecas del código de colores de Colombia (Resolución 2184 de 2019).
// Cada una se reconoce por color, nombre, símbolo y descripción, no solo por el color.
export const BINS = [
  {
    id: 'white',
    name: 'BLANCA',
    title: 'Aprovechables',
    hint: 'Plástico, vidrio, metal,\npapel y cartón limpios',
    symbol: 'reciclar',
    color: 0xffffff,
    accent: 0x1e88e5,
  },
  {
    id: 'black',
    name: 'NEGRA',
    title: 'No aprovechables',
    hint: 'Papeles sucios y cosas\nque ya no sirven',
    symbol: 'equis',
    color: 0x2f343b,
    accent: 0x2f343b,
  },
  {
    id: 'green',
    name: 'VERDE',
    title: 'Orgánicos',
    hint: 'Restos de comida\ny de plantas',
    symbol: 'hoja',
    color: 0x2fae62,
    accent: 0x14804a,
  },
];

export function getBin(id) {
  return BINS.find((b) => b.id === id) || null;
}
