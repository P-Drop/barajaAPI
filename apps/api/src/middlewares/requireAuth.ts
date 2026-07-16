import type { Request, Response, NextFunction } from 'express';
import { JWT_KEY } from '../config/jwt.js';
import { jwtVerify } from 'jose';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Credenciales inválidas');
  }
  const token = header.slice('Bearer '.length);

  let sub: string | undefined;
  try {
    const { payload } = await jwtVerify(token, JWT_KEY, {
      algorithms: ['HS256'],
    });
    sub = payload.sub;
  } catch {
    throw new UnauthorizedError('Credenciales inválidas');
  }
  if (!sub) throw new UnauthorizedError('Credenciales inválidas');

  req.user = { id: sub };
  next();
};
