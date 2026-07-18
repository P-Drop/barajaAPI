import { SUITS, type Card, type Suit } from './types.js';

const isSuit = (s: string): s is Suit =>
  (SUITS as readonly string[]).includes(s);

export const suitOf = (card: Card): Suit | null => {
  const prefix = card.split('-')[0];
  return isSuit(prefix) ? prefix : null;
};

// Solo para cartas con palo (no JOKERs)
export const valueOf = (card: Card): number => {
  const value = card.split('-')[1];
  return Number(value);
};

export const isJoker = (card: Card): boolean => {
  return card.startsWith('JOKER');
};
