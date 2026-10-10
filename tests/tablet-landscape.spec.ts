import { expect, test } from '@playwright/test'

test.use({ hasTouch: true })

for (const [width, height] of [
  [1024, 768],
  [1180, 820],
  [1366, 1024],
  [1600, 1000],
]) {
  test(`landscape touch layout stays scrollable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const section of ['home', 'about', 'builds', 'experience', 'stack', 'contact']) {
      await page.goto(`/#${section}`)
      await expect(page.locator(`.${section}-view`)).toBeVisible()
      await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('.sidebar')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Open index menu' })).toBeVisible()
      await expect(page.locator('main')).toHaveCSS('overflow', 'visible')
      const geometry = await page.evaluate(() => {
        const main = document.querySelector('main')!
        return {
          pageWidth: document.documentElement.scrollWidth,
          mainHeight: main.clientHeight,
          scrollHeight: main.scrollHeight,
          bottom: main.getBoundingClientRect().bottom,
          footerTop: document.querySelector('.app-footer')!.getBoundingClientRect().top,
        }
      })
      expect(geometry.pageWidth).toBe(width)
      expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.mainHeight + 1)
      expect(geometry.footerTop).toBeGreaterThanOrEqual(geometry.bottom - 1)
      if (section === 'home') {
        const canvas = page.locator('.playground canvas')
        await canvas.scrollIntoViewIfNeeded()
        expect((await canvas.boundingBox())!.height).toBeGreaterThanOrEqual(340)
        await expect
          .poll(() =>
            canvas.evaluate((el: HTMLCanvasElement) => {
              const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data
              return pixels.some((value, index) => index % 4 === 3 && value > 0)
            }),
          )
          .toBe(true)
      }
      if (section === 'contact') {
        const status = page.locator('.contact-view .availability-compact')
        await expect(status).toBeVisible()
        expect(await status.evaluate((el) => el.getClientRects().length)).toBe(1)
        await page.locator('.email-actions').scrollIntoViewIfNeeded()
        await expect(page.getByRole('link', { name: 'Start a conversation' })).toBeInViewport()
      }
      await page.locator('.footer-note').scrollIntoViewIfNeeded()
      await expect(page.locator('.footer-note')).toBeInViewport()
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByRole('button', { name: 'Open index menu' }).click()
    const menu = page.getByRole('dialog', { name: 'EXPLORE' })
    await expect(menu).toBeVisible()
    await menu.getByRole('button', { name: '01 Home' }).click()
    await expect(page.locator('.home-view')).toBeVisible()
    if (width === 1366) {
      // Re-enter the same landscape layout after rotating through portrait.
      await page.setViewportSize({ width: 1024, height: 1366 })
      await expect(page.getByRole('button', { name: 'Open index menu' })).toBeVisible()
      await expect(page.locator('.sidebar')).toHaveCount(0)
      await page.setViewportSize({ width, height })
      await expect(page.getByRole('button', { name: 'Open index menu' })).toBeVisible()
      await expect(page.locator('.sidebar')).toHaveCount(0)
      expect(
        (await page.locator('.playground canvas').boundingBox())!.height,
      ).toBeGreaterThanOrEqual(340)
      await page.screenshot({ path: 'test-results/tablet-landscape-home.png' })
    }
  })
}
