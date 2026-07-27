import { prisma } from '../db/prisma.js';
import { ConflictError } from '../errors/ConflictError.js';
import { Prisma } from '../generated/prisma/client.js';

export const userRepository = {
  createUser: async (data: Prisma.UserCreateInput) => {
    try {
      return await prisma.user.create({ data });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictError('El nickname ya está en uso');
      }
      throw e;
    }
  },

  findByNickname: (nicknameNormalized: string) => {
    return prisma.user.findUnique({ where: { nicknameNormalized } });
  },

  findById: (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },

  updateAvatar: (id: string, avatar: string) => {
    return prisma.user.update({ where: { id }, data: { avatar } });
  },

  deactivate: (id: string) => {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  },

  ranking: async (limit: number, offset: number) => {
    const where = { isActive: true, totalPlaySeconds: { gt: 0 } };
    const [entries, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: [{ stars: 'desc' }, { totalPlaySeconds: 'asc' }],
        skip: offset,
        take: limit,
        select: {
          nickname: true,
          avatar: true,
          stars: true,
          totalPlaySeconds: true,
        },
      }),
      prisma.user.count({ where }),
    ]);
    return { entries, total };
  },
};
