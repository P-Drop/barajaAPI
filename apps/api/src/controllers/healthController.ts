import type { Request, Response } from 'express';

export const healthController = {
  check: (req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      message: 'Hello World! API funcionando correctamente.',
      timestamp: new Date().toISOString(),
    });
  },
};
