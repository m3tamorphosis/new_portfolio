import { expect, test } from '@playwright/test'

for (const device of [
  { name: 'iPad', width: 768, height: 1024, touch: true },
  { name: 'Surface Pro', width: 912, height: 1368, touch: true },
  { name: 'iPad Pro', width: 1024, height: 1366, touch: true },
  { name: 'Surface Pro with mouse', width: 912, height: 1368, touch: false },
]) {
  test.describe(device.name, () => {
    test.use({ hasTouch: device.touch })
    test('portrait uses the phone reading order and scrolls all sections', async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      for (const section of ['home', 'about', 'builds', 'experience', 'stack', 'contact']) {
        await page.goto(`/#${section}`)
        await expect(page.locator(`.${section}-view`)).toBeVisible()
        await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
        await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
        await page.evaluate(() => document.fonts.ready)
        await expect(page.getByRole('button', { name: 'Open index menu' })).toBeVisible()
        await expect(page.locator('.sidebar')).toHaveCount(0)
        await expect(page.locator('main')).toHaveCSS('overflow', 'visible')
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(device.width)
        if (section === 'about') {
          await page.locator('.portrait img').evaluate((img: HTMLImageElement) => img.decode())
          const photo = (await page.locator('.portrait').boundingBox())!
          const intro = (await page.locator('.about-intro').boundingBox())!
          expect(photo.width).toBeGreaterThanOrEqual(400)
          expect(photo.x + photo.width / 2).toBeCloseTo(device.width / 2, 0)
          expect(intro.y).toBeGreaterThanOrEqual(photo.y + photo.height + 24)
          await expect(page.locator('.about-intro h2')).toHaveCSS('font-size', '28px')
          await page.screenshot({ path: `test-results/portrait-${device.width}-about.png` })
        }
        await page.locator('.footer-note').scrollIntoViewIfNeeded()
        await expect(page.locator('.footer-note')).toBeInViewport()
      }
    })
  })
}
