import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('Variables de entorno inválidas:\n');
    console.error(z.prettifyError(parsed.error));
    process.exit(1);
}


export const env = parsed.data;