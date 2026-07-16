import { z } from 'zod';

export const loginSchema = z.object({
  nickname: z.string().nonempty(),
  password: z.string().nonempty(),
});

export type LoginInput = z.infer<typeof loginSchema>;
