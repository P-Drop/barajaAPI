import type { Request } from 'express';
import { profileUpdateSchema } from '../schemas/profileUpdateSchema.js';
import { deactivateSchema } from '../schemas/deactivateSchema.js';

export const profileValidator = {
  update: (req: Request) => profileUpdateSchema.parse(req.body),
  deactivate: (req: Request) => deactivateSchema.parse(req.body),
};
