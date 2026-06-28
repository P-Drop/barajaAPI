import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    env: { NODE_ENV: 'test', RATE_LIMIT_MAX: '3' },
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/generated/**',
        'src/**/*.d.ts',
        'src/server.ts',
        'src/config/**',
        'src/docs/**',
        'src/repositories/**',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 80,
        branches: 80,
      },
    },
  },
});
