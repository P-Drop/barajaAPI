import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    env: { NODE_ENV: 'test', RATE_LIMIT_MAX: '3' },
    setupFiles: ['./tests/setup.ts'],
  },
});
