import * as Sentry from '@sentry/node';
import { env } from './env.js';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  sendDefaultPii: false,
});

export { Sentry };
