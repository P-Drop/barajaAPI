import type { Request } from 'express';

import { registerSchema } from '../schemas/registerSchema.js';

export const authValidator = {
  register: (req: Request) => registerSchema.parse(req.body),
};
