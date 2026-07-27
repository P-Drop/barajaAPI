import type { Request, Response } from 'express';
import { rankingService } from '../services/rankingService.js';
import { rankingValidator } from '../validators/rankingValidator.js';

export const rankingController = {
  get: async (req: Request, res: Response) => {
    const { limit, offset } = rankingValidator.query(req);
    const ranking = await rankingService.getRanking(limit, offset);
    return res.status(200).json(ranking);
  },
};
