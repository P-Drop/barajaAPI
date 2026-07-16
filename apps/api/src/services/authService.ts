import argon2 from 'argon2';
import { SignJWT } from 'jose';
import { env } from '../config/env.js';
import { JWT_KEY } from '../config/jwt.js';
import { userRepository } from '../repositories/userRepository.js';
import type { RegisterInput } from '../schemas/registerSchema.js';
import type { LoginInput } from '../schemas/loginSchema.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

const DUMMY_HASH = await argon2.hash(crypto.randomUUID());

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

  login: async (input: LoginInput) => {
    const user = await userRepository.findByNickname(
      input.nickname.toLowerCase(),
    );
    if (!user) {
      // iguala el tiempo de respuesta
      await argon2.verify(DUMMY_HASH, input.password);
      throw new UnauthorizedError('Credenciales inválidas');
    }
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid || !user.isActive)
      throw new UnauthorizedError('Credenciales inválidas');

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(env.JWT_EXPIRES_IN)
      .sign(JWT_KEY);

    return { token, user };
  },

  me: async (userId: string) => {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive)
      throw new UnauthorizedError('Credenciales inválidas');

    return user;
  },
};
