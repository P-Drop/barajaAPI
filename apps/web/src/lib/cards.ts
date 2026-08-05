import type { Card as CardData } from '../api/client';

const FIGURES: Record<number, string> = {
  1: 'As',
  10: 'Sota',
  11: 'Caballo',
  12: 'Rey',
};

export function cardFromId(id: string): CardData {
  if (id.startsWith('JOKER')) {
    return {
      id: 0,
      value: null,
      suit: null,
      isJoker: true,
      name: 'Comodín',
      image: 'joker.webp',
    };
  }
  const [suit, valueStr] = id.split('-'); // 'OROS-1' -> ['OROS', '1']
  const value = Number(valueStr);
  const figure = FIGURES[value] ?? String(value);
  return {
    id: 0,
    value,
    suit: suit as CardData['suit'],
    isJoker: false,
    name: `${figure} de ${suit.toLowerCase()}`, // alt accesible
    image: `${suit.toLowerCase()}_${value}.webp`, // 'oros_1.webp'
  };
}
