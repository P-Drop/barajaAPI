import 'dotenv/config';

export const env = {
    PORT: process.env.PORT ?? '3000',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
}