import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/client/**/*.ts'],
      thresholds: { lines: 85, statements: 85, branches: 85, functions: 85 },
    },
  },
});
