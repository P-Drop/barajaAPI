import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const cardResponseSchema = z
  .object({
    id: z.number(),
    value: z.number().nullable(),
    suit: z.enum(['OROS', 'COPAS', 'ESPADAS', 'BASTOS']).nullable(),
    isJoker: z.boolean(),
    name: z.string(),
    image: z.string(),
  })
  .openapi('Card');
