import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@hermes-workspaces/protocol': path.resolve(rootDir, 'packages/protocol/src/index.ts'),
      '@hermes-workspaces/ui': path.resolve(rootDir, 'packages/ui/src/index.ts')
    }
  },
  test: {
    include: [
      'packages/**/src/**/*.test.ts',
      'packages/**/src/**/*.test.tsx',
      'apps/**/src/**/*.test.ts',
      'apps/**/src/**/*.test.tsx'
    ],
    exclude: ['**/node_modules/**'],
    environment: 'jsdom',
    setupFiles: ['apps/web/src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: [
        'packages/protocol/src/**/*.ts',
        'packages/ui/src/**/*.ts',
        'packages/ui/src/**/*.tsx',
        'apps/bridge/src/**/*.ts',
        'apps/web/src/**/*.ts',
        'apps/web/src/**/*.tsx'
      ]
    }
  }
});
