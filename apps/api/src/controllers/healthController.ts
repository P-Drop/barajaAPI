import type { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export const healthController = {
  check: (req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      message: 'Hello World! API funcionando correctamente.',
      timestamp: new Date().toISOString(),
    });
  },

  ready: async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not ready' });
    }
  },
};
