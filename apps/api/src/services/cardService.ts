import { deckOperations } from '../config/metrics.js';
import { DomainError } from '../errors/DomainError.js';

import { cardRepository } from '../repositories/cardRepository.js';

const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i >= 1; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Acceso compartido al mazo, sin métrica
const fetchDeck = (short: boolean) =>
  short ? cardRepository.findShortDeck() : cardRepository.findFullDeck();

export const cardService = {
  getDeck: (short: boolean) => {
    deckOperations.inc({ operation: 'get' });
    return fetchDeck(short);
  },

  getShuffledDeck: async (short: boolean) => {
    deckOperations.inc({ operation: 'shuffle' });
    return shuffle(await fetchDeck(short));
  },

  drawCards: async (count: number, short: boolean) => {
    deckOperations.inc({ operation: 'draw' });
    const deck = shuffle(await fetchDeck(short));
    if (count > deck.length) {
      throw new DomainError('No puedes robar más cartas de las que hay');
    }
    return deck.slice(0, count);
  },
};
