import { userRepository } from '../repositories/userRepository.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import argon2 from 'argon2';

export const profileService = {
  getProfile: async (userId: string) => {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive)
      throw new UnauthorizedError('Credenciales inválidas');
    return user;
  },

  updateAvatar: async (userId: string, avatar: string) => {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive)
      throw new UnauthorizedError('Credenciales inválidas');
    return userRepository.updateAvatar(userId, avatar);
  },

  deactivate: async (userId: string, password: string) => {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive)
      throw new UnauthorizedError('Credenciales inválidas');

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedError('Credenciales inválidas');

    return await userRepository.deactivate(userId);
  },
};
