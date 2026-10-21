import { expect, test } from '@playwright/test'

test('visitor browses the seeded feed and a profile, then logs a film as a guest', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))

  // Home: hero, offline trending catalog, and a populated feed from the demo seed.
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Log films')
  await expect(page.getByText('Offline catalog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent feed' })).toBeVisible()
  await expect(page.locator('article').first()).toContainText('Dune: Part Two')

  // Feed with a status filter.
  await page.getByRole('link', { name: /view live feed/i }).click()
  await expect(page).toHaveURL(/\/feed$/)
  await expect(page.locator('article')).toHaveCount(15)
  await page.getByRole('tab', { name: 'Dropped' }).click()
  await expect(page).toHaveURL(/status=dropped/)
  await expect(page.locator('article').first()).toContainText(/dropped/i)
  await page.getByRole('tab', { name: 'All' }).click()
  await page.getByRole('button', { name: 'Load more' }).click()
  await expect(page.locator('article')).toHaveCount(30)

  // Public profile.
  await page.locator('article').first().getByRole('link', { name: /Nova/ }).click()
  await expect(page).toHaveURL(/\/u\/nova$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nova')
  await expect(page.getByText('Science Fiction 7')).toBeVisible()

  // Signed-out visitors are sent to sign in for the logger.
  await page.goto('/log')
  await expect(page).toHaveURL(/\/login$/)

  // One-click guest account -> log a film.
  await page.getByRole('button', { name: /try the demo/i }).click()
  await expect(page).toHaveURL(/\/log$/)
  await page.getByRole('searchbox', { name: /search films/i }).fill('Arrival')
  await page.getByRole('button', { name: /^Arrival/ }).click()
  await page.getByRole('radio', { name: 'Completed' }).click()
  await page.getByRole('radio', { name: '8 out of 10' }).click()
  await page.getByLabel(/take/i).fill('Smoke-test take: heptapods rule.')
  await page.getByRole('button', { name: /share to feed/i }).click()
  await expect(page.getByText('Arrival: Completed.')).toBeVisible()

  // It shows up at the top of the public feed...
  await page.goto('/feed')
  const first = page.locator('article').first()
  await expect(first).toContainText('Arrival')
  await expect(first).toContainText('Smoke-test take: heptapods rule.')
  await expect(first).toContainText('8/10')

  // ...and on the watchlist, where the status can be changed inline.
  await page.goto('/watchlist')
  const card = page.getByRole('listitem').filter({ hasText: 'Arrival' })
  await expect(card.getByRole('radio', { name: 'Completed' })).toHaveAttribute('aria-checked', 'true')
  await card.getByRole('radio', { name: 'Watching' }).click()
  await expect(page.getByText(/Posted to the feed/)).toBeVisible()

  // Recommendations fall back to taste-match without an OpenRouter key, and say so.
  await page.goto('/for-you')
  await expect(page.getByText('Taste-match picks')).toBeVisible()
  await expect(page.getByText(/No AI key is configured/)).toBeVisible()
  const queue = page.getByRole('button', { name: 'Queue it' }).first()
  await queue.click()
  await expect(page.getByRole('button', { name: 'Queued' }).first()).toBeVisible()

  expect(errors).toEqual([])
})

test('feed fits a 390px phone without sideways scrolling', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  await page.goto('/feed')
  await expect(page.locator('article').first()).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  const box = await page.locator('article').first().boundingBox()
  expect(box && box.x + box.width).toBeLessThanOrEqual(390)
  await ctx.close()
})

test('phone: the composer opens as a bottom sheet and closes after logging', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto('/login')
  await page.getByRole('button', { name: /try the demo/i }).click()
  await expect(page).toHaveURL(/\/log$/)

  // Deep link straight to a film: the composer is pinned to the bottom of the screen.
  await page.goto('/log?film=438631')
  const sheet = page.getByRole('form', { name: 'Log Dune' })
  await expect(sheet).toBeVisible()
  const position = await sheet.evaluate((el) => (el.parentElement ? getComputedStyle(el.parentElement).position : ''))
  expect(position).toBe('fixed')
  const box = await sheet.boundingBox()
  expect(box && Math.round(box.y + box.height)).toBeGreaterThanOrEqual(840)

  await sheet.getByRole('radio', { name: 'Queued' }).click()
  await sheet.getByRole('button', { name: /share to feed/i }).click()
  await expect(page.getByText('Dune: Queued.')).toBeVisible()
  await expect(sheet).toBeHidden()

  // The tab bar is the phone navigation.
  await page.getByRole('navigation', { name: 'Tabs' }).getByRole('link', { name: 'List' }).click()
  await expect(page).toHaveURL(/\/watchlist$/)
  await expect(page.getByRole('listitem').filter({ hasText: 'Dune' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
  await ctx.close()
})

test('unknown pages get the designed 404 and no console errors anywhere public', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  for (const path of ['/', '/feed', '/u/nova', '/login']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  await page.goto('/this/does/not/exist')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("This reel doesn't exist")
  await expect(page.getByRole('link', { name: 'Back home' })).toBeVisible()
  expect(errors).toEqual([])
})
