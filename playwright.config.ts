import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT || 4430)

/**
 * Browser smoke test of the main public flow. Boots the real dev server (API + embedded
 * in-memory Postgres, seeded) with no TMDB or OpenRouter keys, so it is fully offline.
 * One-time setup on a new machine: npx playwright install chromium
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: 'memory://', TMDB_API_KEY: '', TMDB_UPSTREAM: '', OPENROUTER_API_KEY: '' },
  },
})
