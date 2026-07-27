import { loginSchema } from './loginSchema.js';

export const deactivateSchema = loginSchema.pick({ password: true });
