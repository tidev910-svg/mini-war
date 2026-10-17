import { defineConfig } from 'vitest/config';

// Unit tests run the real game modules in jsdom (see tests/helpers/game.ts). Browser checks live in scripts/smoke/.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
  },
});
