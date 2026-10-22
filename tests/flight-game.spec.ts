import { expect, test } from '@playwright/test'

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
]) {
  test(`flight game fills preview at ${width}x${height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height })
    await page.goto('/#builds')
    await page
      .locator('.project-selector')
      .getByRole('button', { name: /Playable experiences/ })
      .click()
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await page.locator('.flight-demo').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: 'Let’s fly' })).toBeVisible()
    const bounds = await page.locator('.has-game').evaluate((frame) => {
      const box = frame.getBoundingClientRect()
      const game = frame.querySelector('.flight-demo')!.getBoundingClientRect()
      return {
        fits: game.top >= box.top && game.bottom <= box.bottom + 1,
        fullWidth: Math.abs(game.width - frame.clientWidth) < 2,
        overflow: frame.scrollHeight > frame.clientHeight + 1,
      }
    })
    expect(bounds).toEqual({ fits: true, fullWidth: true, overflow: false })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page
      .locator('.project-preview')
      .screenshot({ path: `test-results/flight-ready-${width}.png` })
    await page.getByRole('button', { name: 'Let’s fly' }).click()
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled()
    await expect(page.locator('.flight-overlay')).toHaveCount(0)
    await page
      .locator('.project-preview')
      .screenshot({ path: `test-results/flight-playing-${width}.png` })
    expect(errors).toEqual([])
  })
}

test('flapping clears gates, pause freezes play, and collision allows replay', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.goto('/#builds')
  await page
    .locator('.project-selector')
    .getByRole('button', { name: /Playable experiences/ })
    .click()
  await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'))
  await page.getByRole('button', { name: 'Let’s fly' }).click()
  const canvas = page.getByLabel('Flappy flight game')
  for (let i = 0; i < 7; i++) {
    await page.clock.runFor(640)
    await canvas.press('Space')
  }
  expect(
    Number((await page.locator('.flight-score').innerText()).replace('SCORE', '').trim()),
  ).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Pause game' }).click()
  const before = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  await page.clock.runFor(3000)
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(before)
  await page.getByRole('button', { name: 'Resume flight' }).click()
  await page.clock.runFor(2500)
  await expect(page.getByRole('heading', { name: 'One more flight?' })).toBeVisible()
  await page.getByRole('button', { name: 'Fly again' }).click()
  await expect(page.locator('.flight-score')).toHaveText('SCORE 00')
  await expect(page.locator('.flight-best')).not.toHaveText('BEST 00')
  await page.getByRole('button', { name: /CareerForge AI/ }).click()
  await page.clock.runFor(1000)
  await expect(canvas).toHaveCount(0)
  await page.getByRole('button', { name: /Playable experiences/ }).click()
  await expect(page.getByRole('button', { name: 'Let’s fly' })).toBeVisible()
})

test('touch can flap and leaving the game pauses it', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.goto('/#builds')
  await page
    .locator('.project-selector')
    .getByRole('button', { name: /Playable experiences/ })
    .click()
  await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
  const canvas = page.getByLabel('Flappy flight game')
  await canvas.scrollIntoViewIfNeeded()
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'))
  await page.getByRole('button', { name: 'Let’s fly' }).tap()
  for (let i = 0; i < 3; i++) {
    await page.clock.runFor(600)
    await canvas.tap()
  }
  await expect(page.locator('.flight-overlay')).toHaveCount(0)
  await expect(canvas).toHaveCSS('touch-action', 'none')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.clock.runFor(100)
  await expect(page.getByRole('button', { name: 'Resume game' })).toBeEnabled()
  await context.close()
})
