import type { Request, Response } from 'express';
import { profileService } from '../services/profileService.js';
import { profileResponseSchema } from '../schemas/profileResponseSchema.js';
import { profileValidator } from '../validators/profileValidator.js';

const toProfileResponse = (user: unknown) => {
  const projection = profileResponseSchema.safeParse(user);
  if (!projection.success) {
    throw new Error('Proyección de perfil inválida'); // 500: log + Sentry
  }
  return projection.data;
};

export const profileController = {
  get: async (req: Request, res: Response) => {
    const user = await profileService.getProfile(req.user!.id);
    return res.status(200).json(toProfileResponse(user));
  },

  updateAvatar: async (req: Request, res: Response) => {
    const { avatar } = profileValidator.update(req);
    const user = await profileService.updateAvatar(req.user!.id, avatar);
    return res.status(200).json(toProfileResponse(user));
  },

  deactivate: async (req: Request, res: Response) => {
    const { password } = profileValidator.deactivate(req);
    await profileService.deactivate(req.user!.id, password);
    return res.status(204).send();
  },
};
