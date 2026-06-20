import type { Request } from 'express';

import { deckQuerySchema } from '../schemas/deckQuerySchema.js';

export const queryValidator = {
  deck: (req: Request) => deckQuerySchema.parse(req.query),
};
