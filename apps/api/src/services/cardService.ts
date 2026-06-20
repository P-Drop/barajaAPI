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

export const cardService = {
  getDeck: (short: boolean) =>
    short ? cardRepository.findShortDeck() : cardRepository.findFullDeck(),

  getShuffledDeck: async (short: boolean) => {
    const deck = await cardService.getDeck(short);
    return shuffle(deck);
  },

  drawCards: async (count: number, short: boolean) => {
    const deck = await cardService.getShuffledDeck(short);
    if (count > deck.length) {
      throw new DomainError('No puedes robar más cartas de las que hay');
    }
    return deck.slice(0, count);
  },
};
