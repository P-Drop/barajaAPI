import { z } from 'zod';

export const matchIdParamSchema = z.object({
  id: z.uuid(),
});
