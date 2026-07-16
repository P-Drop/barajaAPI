import { env } from './env.js';

export const JWT_KEY = new TextEncoder().encode(env.JWT_SECRET);
