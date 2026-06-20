import { prisma } from '../db/prisma.js';

export const cardRepository = {
  findFullDeck: () => {
    return prisma.card.findMany({
      orderBy: [{ suit: 'desc' }, { value: 'asc' }],
    });
  },

  findShortDeck: () => {
    return prisma.card.findMany({
      where: {
        isJoker: false,
        value: {
          notIn: [8, 9],
        },
      },
      orderBy: [{ suit: 'desc' }, { value: 'asc' }],
    });
  },
};
