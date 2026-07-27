import { Prisma, type MatchStatus } from '../generated/prisma/client.js';
import type { GameState } from '../games/orda/types.js';
import { prisma } from '../db/prisma.js';
import { ConflictError } from '../errors/ConflictError.js';
import { STAIRWAY } from '../games/orda/achievements.js';

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

  consolidateFinish: async (
    id: string,
    userId: string,
    expectedVersion: number,
    matchData: {
      state: GameState;
      status: MatchStatus;
      stars: number;
      moveCount: number;
      lastMoveAt: Date;
      finishedAt: Date | null;
    },
    userDelta: {
      stars: number;
      playSeconds: number;
      unlockStairway: boolean;
    },
  ): Promise<number> => {
    return prisma.$transaction(async (tx) => {
      // (1) Cerrar la partida con guard de versión
      const { count } = await tx.match.updateMany({
        where: { id, userId, version: expectedVersion },
        data: {
          ...matchData,
          state: matchData.state as unknown as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });

      // (2) Rollback si no cerró: NADA toca el perfil
      if (count === 0) return 0;

      // (3) Actualizar estrellas y tiempo en el perfil
      await tx.user.update({
        where: { id: userId },
        data: {
          stars: { increment: userDelta.stars },
          totalPlaySeconds: { increment: userDelta.playSeconds },
        },
      });

      // (4) Persistir el logro (idempotente)
      if (userDelta.unlockStairway) {
        await tx.user.updateMany({
          where: { id: userId, NOT: { achievements: { has: STAIRWAY } } },
          data: { achievements: { push: STAIRWAY } },
        });
      }

      return count;
    });
  },

  findActiveByUser: (userId: string) =>
    prisma.match.findFirst({ where: { userId, status: 'IN_PROGRESS' } }),
};
