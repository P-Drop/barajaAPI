import { Prisma, type MatchStatus } from '../generated/prisma/client.js';
import type { GameState } from '../games/orda/types.js';
import { prisma } from '../db/prisma.js';
import { ConflictError } from '../errors/ConflictError.js';

export const matchRepository = {
  create: async (userId: string, state: GameState) => {
    try {
      return await prisma.match.create({
        data: { userId, state: state as unknown as Prisma.InputJsonValue },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictError('Ya tienes una partida en curso');
      }
      throw e;
    }
  },

  findByIdForUser: (id: string, userId: string) => {
    return prisma.match.findFirst({
      where: { id, userId },
    });
  },

  updateWithVersion: async (
    id: string,
    userId: string,
    expectedVersion: number,
    data: {
      state: GameState;
      moveCount: number;
      stars: number;
      status: MatchStatus;
      lastMoveAt: Date;
      finishedAt: Date | null;
    },
  ): Promise<number> => {
    const { count } = await prisma.match.updateMany({
      where: { id, userId, version: expectedVersion },
      data: {
        ...data,
        state: data.state as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    return count;
  },

  findActiveByUser: (userId: string) =>
    prisma.match.findFirst({ where: { userId, status: 'IN_PROGRESS' } }),
};
