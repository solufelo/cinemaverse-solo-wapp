import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.ts'],
    environment: 'node',
    // Each file boots its own in-memory Postgres (PGlite); the first WASM compile takes a few seconds.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
