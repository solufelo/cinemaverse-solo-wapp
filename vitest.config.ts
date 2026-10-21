import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.ts', 'tests/unit/**/*.test.js'],
    environment: 'node',
    // Each file boots its own in-memory Postgres (PGlite). The WASM compile is CPU-heavy, so cap
    // parallel files and allow slow boots on a busy machine.
    maxWorkers: 3,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
})
