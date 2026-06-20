import { z } from 'zod';

export const deckQuerySchema = z.object({
  short: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  count: z.coerce.number().int().positive().default(1),
});
