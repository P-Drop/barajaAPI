import type { Request, Response } from 'express';
import { authService } from '../services/authService.js';
import { userResponseSchema } from '../schemas/userResponseSchema.js';
import { authValidator } from '../validators/authValidator.js';

const toUserResponse = (user: unknown) => {
  const projection = userResponseSchema.safeParse(user);
  if (!projection.success) {
    throw new Error('Proyección de respuesta de usuario inválida'); // rama 500: log + Sentry
  }
  return projection.data;
};

export const authController = {
  register: async (req: Request, res: Response) => {
    const input = authValidator.register(req);
    const user = await authService.register(input);

    return res.status(201).json(toUserResponse(user));
  },

  login: async (req: Request, res: Response) => {
    const input = authValidator.login(req);
    const { token, user } = await authService.login(input);

    return res.status(200).json({ token, user: toUserResponse(user) });
  },

  me: async (req: Request, res: Response) => {
    const user = await authService.me(req.user!.id);
    return res.status(200).json(toUserResponse(user));
  },
};
