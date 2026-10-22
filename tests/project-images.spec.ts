import { expect, test } from '@playwright/test'

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
]) {
  test(`real project screenshots fit ${width}x${height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    const thumbnails = page.locator('.mini-screenshot img')
    await expect(thumbnails).toHaveCount(3)
    await thumbnails.evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    )
    await page
      .locator('.project-strip')
      .screenshot({ path: `test-results/project-thumbnails-${width}.png` })
    await page.locator('.project-teaser').nth(1).click()
    await page.getByRole('button', { name: 'View project', exact: true }).click()
    for (const [name, image] of [
      ['CareerForge AI', 'careerforge'],
      ['InsightVault Lite', 'insight'],
      ['Developer Portfolio', 'portfolio'],
      ['StudyBuddyGPT', 'study'],
      ['Danger Zone', 'danger'],
    ]) {
      await page
        .locator('.project-selector')
        .getByRole('button', { name: new RegExp(name) })
        .click()
      await expect(page.locator('.project-description')).toHaveCSS('opacity', '1')
      const screenshot = page.locator('.project-screenshot img')
      await expect(screenshot).toHaveAttribute('src', new RegExp(`${image}-preview.jpg$`))
      await screenshot.evaluate((image) => (image as HTMLImageElement).decode())
      await expect(page.getByText('APP SCREENSHOT', { exact: true })).toHaveCount(0)
      await expect(page.locator('.preview-live-link')).toBeVisible()
      await expect(page.locator('.project-screenshot')).toHaveAttribute('target', '_blank')
      if (image === 'careerforge') {
        await expect(page.getByRole('button', { name: /CareerForge AI/ })).toHaveAttribute(
          'aria-pressed',
          'true',
        )
        await expect(page.locator('.preview-live-link')).toHaveAttribute(
          'href',
          'https://mycareerforge.vercel.app/',
        )
        if (width > 900) {
          const details = (await page.locator('.project-tags').boundingBox())!
          const footer = (await page.locator('footer').boundingBox())!
          expect(details.y + details.height).toBeLessThanOrEqual(footer.y)
        }
        await page.screenshot({
          path: `test-results/careerforge-builds-${width}.png`,
          fullPage: true,
        })
      }
      const bounds = await page.locator('.project-preview').evaluate((frame) => {
        const box = frame.getBoundingClientRect()
        const image = frame.querySelector('.project-screenshot img')!.getBoundingClientRect()
        return {
          fits:
            image.x >= box.x &&
            image.right <= box.right + 1 &&
            image.y >= box.y &&
            image.bottom <= box.bottom + 1,
          overflow:
            frame.scrollWidth > frame.clientWidth + 1 ||
            frame.scrollHeight > frame.clientHeight + 1,
        }
      })
      expect(bounds).toEqual({ fits: true, overflow: false })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
      await page
        .locator('.project-preview')
        .screenshot({ path: `test-results/${image}-preview-${width}.png` })
    }
    await page
      .locator('.project-selector')
      .getByRole('button', { name: /Playable experiences/ })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Frontend craft. Interactive gameplay.' }),
    ).toBeVisible()
    expect(errors).toEqual([])
  })
}
