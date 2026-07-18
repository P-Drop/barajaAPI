// regla 1: Cruz sobre otra carta
// regla 2: Huecos
// regla 3: Esquina
// regla 5: Descarte (siempre permitido)

// TODO: Espacio extra

import { isJoker, suitOf, valueOf } from './card.js';
import type { Card, Suit } from './types.js';

// Regla 1: sobre una carta de la cruz -> valor inmediatamente inferior y palo distinto
export const canPlaceOnCross = (card: Card, target: Card): boolean => {
  if (isJoker(card) || isJoker(target)) return false;
  return (
    valueOf(card) === valueOf(target) - 1 && suitOf(card) !== suitOf(target)
  );
};

// Regla 3: 4 esquinas par construir 4 palos
// Carta superior de cada esquina -> cornerTop; 0 -> vacía
export const canPlaceOnCorner = (
  card: Card,
  suit: Suit,
  cornerTop: number,
): boolean => {
  if (isJoker(card)) return false;
  return valueOf(card) === cornerTop + 1 && suitOf(card) === suit;
};

// Regla 2: un hueco admite cualquier carta (un comodín nunca es carta jugable)
export const canPlaceOnHole = (card: Card): boolean => !isJoker(card);
