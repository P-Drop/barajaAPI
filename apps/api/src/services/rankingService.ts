import { userRepository } from '../repositories/userRepository.js';

export const rankingService = {
  getRanking: async (limit: number, offset: number) => {
    const { entries, total } = await userRepository.ranking(limit, offset);
    return { total, limit, offset, entries };
  },
};
