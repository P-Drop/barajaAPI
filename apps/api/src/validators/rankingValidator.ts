import type { Request } from 'express';
import { rankingQuerySchema } from '../schemas/rankingQuerySchema.js';

export const rankingValidator = {
  query: (req: Request) => rankingQuerySchema.parse(req.query),
};
