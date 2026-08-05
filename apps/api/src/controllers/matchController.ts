import type { Request, Response } from 'express';
import { matchService } from '../services/matchService.js';
import { matchValidator } from '../validators/matchValidator.js';

export const matchController = {
  create: async (req: Request, res: Response) => {
    const match = await matchService.createMatch(req.user!.id, new Date());
    return res.status(201).json(match);
  },

  get: async (req: Request, res: Response) => {
    const { id } = matchValidator.id(req);
    const match = await matchService.getMatch(req.user!.id, id, new Date());
    return res.status(200).json(match);
  },

  active: async (req: Request, res: Response) => {
    const match = await matchService.getActiveMatch(req.user!.id, new Date());
    return match ? res.json(match) : res.sendStatus(404);
  },

  move: async (req: Request, res: Response) => {
    const { id, expectedVersion, move } = matchValidator.move(req);
    const match = await matchService.applyMoveToMatch(
      req.user!.id,
      id,
      expectedVersion,
      move,
      new Date(),
    );
    return res.status(200).json(match);
  },
};
