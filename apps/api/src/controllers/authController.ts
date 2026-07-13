import type { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { userResponseSchema } from '../schemas/userResponseSchema.js';
import { authValidator } from '../validators/authValidator.js';

export const authController = {
  register: async (req: Request, res: Response) => {
    const input = authValidator.register(req);
    const user = await authService.register(input);
    const projection = userResponseSchema.safeParse(user);
    if (!projection.success) {
      throw new Error('Proyección de respuesta de usuario inválida'); // rama 500: log + Sentry
    }
    return res.status(201).json(projection.data);
  },
};
