import { registerSchema } from './registerSchema.js';

export const profileUpdateSchema = registerSchema.pick({ avatar: true });
