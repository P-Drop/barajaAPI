import type { Request, Response } from 'express';
import { cardService } from '../services/cardService.js';
import type { Card } from '../generated/prisma/client.js';

import { queryValidator } from '../validators/queryValidator.js';

const deriveImage = (card: Card) => {
  if (!card.suit) {
    return 'joker.png';
  }
  return `${card.suit.toLowerCase()}_${card.value}.png`;
};

const toResponse = (card: Card) => ({
  ...card,
  image: deriveImage(card),
});

export const cardController = {
  getDeck: async (req: Request, res: Response) => {
    const { short } = queryValidator.deck(req);
    const deck = await cardService.getDeck(short);
    res.status(200).json(deck.map(toResponse));
  },

  shuffle: async (req: Request, res: Response) => {
    const { short } = queryValidator.deck(req);
    const deck = await cardService.getShuffledDeck(short);
    res.status(200).json(deck.map(toResponse));
  },

  draw: async (req: Request, res: Response) => {
    const { short, count } = queryValidator.deck(req);
    const deck = await cardService.drawCards(count, short);
    res.status(200).json(deck.map(toResponse));
  },
};
