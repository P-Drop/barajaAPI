import argon2 from 'argon2';
import { userRepository } from '../repositories/userRepository.js';
import type { RegisterInput } from '../schemas/registerSchema.js';

export const authService = {
  register: async (input: RegisterInput) => {
    const passwordHash = await argon2.hash(input.password);
    return userRepository.createUser({
      nickname: input.nickname,
      nicknameNormalized: input.nickname.toLowerCase(),
      passwordHash,
      avatar: input.avatar,
    });
  },
};
