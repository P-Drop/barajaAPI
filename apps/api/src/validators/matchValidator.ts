import type { Request } from 'express';
import { moveRequestSchema } from '../schemas/moveSchema.js';
import { matchIdParamSchema } from '../schemas/matchIdParamSchema.js';

export const matchValidator = {
  id: (req: Request) => matchIdParamSchema.parse(req.params),
  move: (req: Request) => ({
    ...matchIdParamSchema.parse(req.params),
    ...moveRequestSchema.parse(req.body),
  }),
};
