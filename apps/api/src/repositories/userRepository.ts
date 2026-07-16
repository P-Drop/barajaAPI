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
};
