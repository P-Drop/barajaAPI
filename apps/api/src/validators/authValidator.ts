import type { Request } from 'express';

import { registerSchema } from '../schemas/registerSchema.js';
import { loginSchema } from '../schemas/loginSchema.js';

export const authValidator = {
  register: (req: Request) => registerSchema.parse(req.body),
  login: (req: Request) => loginSchema.parse(req.body),
};
