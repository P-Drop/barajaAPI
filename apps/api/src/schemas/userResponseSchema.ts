import { z } from 'zod';

export const userResponseSchema = z.object({
  id: z.uuid(),
  nickname: z.string(),
  avatar: z.string(),
  stars: z.int().min(0),
  createdAt: z.date(), // Prisma entrega Date; res.json lo serializa a ISO y OpenAPI lo documenta como date-time
  totalPlaySeconds: z.int().min(0),
});
