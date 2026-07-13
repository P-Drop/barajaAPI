import { z } from 'zod';

export const registerSchema = z.object({
  nickname: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
  password: z.string().min(10).max(128),
  avatar: z.string().min(1).max(50), // TODO: Lista cerrada de assets pendientes de cargar
});

export type RegisterInput = z.infer<typeof registerSchema>;
