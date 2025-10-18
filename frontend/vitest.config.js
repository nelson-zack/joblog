import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: '../coverage/frontend',
      include: [
        'src/utils/date.js',
        'src/utils/tags.js',
        'src/storage/store.js'
      ],
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 60,
        statements: 60
      }
    }
  }
});
