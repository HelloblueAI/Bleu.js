import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './backend/tests/setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      all: true,
      exclude: ['node_modules', 'dist', 'test'],
    },
  },
});
