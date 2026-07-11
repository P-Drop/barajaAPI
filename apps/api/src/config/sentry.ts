import * as Sentry from '@sentry/node';
import { env } from './env.js';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  release: env.SENTRY_RELEASE,
  sendDefaultPii: false,
});

export { Sentry };
