import { expect, test } from '@playwright/test'

test('long phone rotation preserves the globe, readable status, and complete contact flow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 956 })
  await page.goto('/')
  for (const viewport of [
    { width: 430, height: 956 },
    { width: 956, height: 430 },
    { width: 430, height: 956 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('button', { name: 'Open index menu' })).toBeVisible()
    await expect(page.locator('.sidebar')).toHaveCount(0)
    const canvas = page.locator('.playground canvas')
    await canvas.scrollIntoViewIfNeeded()
    await expect
      .poll(() => canvas.evaluate((el) => el.getBoundingClientRect().height))
      .toBeGreaterThan(300)
    await expect
      .poll(() =>
        canvas.evaluate((el: HTMLCanvasElement) => {
          const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data
          return pixels.some((value, index) => index % 4 === 3 && value > 0)
        }),
      )
      .toBe(true)
    const before = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
    await expect
      .poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL()))
      .not.toBe(before)
    const status = page.locator('.hero-note .availability-compact')
    expect(await status.evaluate((el) => el.getClientRects().length)).toBe(1)
  }
  await page.goto('/#contact')
  for (const viewport of [
    { width: 320, height: 852 },
    { width: 956, height: 430 },
  ]) {
    await page.setViewportSize(viewport)
    await page.evaluate(() => document.fonts.ready)
    const status = page.locator('.contact-view .availability-compact')
    await expect(status).toBeVisible()
    const bounds = await status.boundingBox()
    expect(bounds!.height).toBeCloseTo(18, 1)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width)
    const options = await page.locator('.topic-options button').all()
    const rects = await Promise.all(options.map((el) => el.boundingBox()))
    expect(rects.map((rect) => rect!.height)).toEqual([44, 44, 44, 44])
    await page.locator('.email-actions').scrollIntoViewIfNeeded()
    await expect(page.getByRole('link', { name: 'Start a conversation' })).toBeInViewport()
    await page.locator('.footer-note').scrollIntoViewIfNeeded()
    await expect(page.locator('.footer-note')).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width)
  }
})
