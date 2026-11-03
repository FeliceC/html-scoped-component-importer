import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      COMPONENTS: path.resolve(import.meta.dirname, 'test/fixtures/components'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['test/unit/**/*.test.ts', 'test/integration/**/*.test.ts'],
    passWithNoTests: true,
  },
});
