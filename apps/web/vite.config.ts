import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    clearMocks: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/generated/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/test/**',
        'src/api/client.ts',
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
