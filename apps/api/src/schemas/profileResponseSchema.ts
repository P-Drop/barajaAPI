import { z } from 'zod';
import { userResponseSchema } from './userResponseSchema.js';

export const profileResponseSchema = userResponseSchema.extend({
  achievements: z.array(z.string()),
});
