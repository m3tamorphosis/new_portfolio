import { expect, test } from '@playwright/test'

for (const [width, height] of [
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
]) {
  test(`desktop text and section boundaries at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const section of ['home', 'about', 'builds', 'experience', 'stack', 'contact']) {
      await page.goto(`/#${section}`)
      await expect(page.locator(`.${section}-view`)).toBeVisible()
      await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
      const readingSelectors: Record<string, string> = {
        home: '.hero-description',
        about: '.about-intro h2',
        builds: '.project-description > p',
        experience: '.experience-detail li',
        stack: '.tool-description',
        contact: '.contact-copy > p',
      }
      const textSize = await page
        .locator(readingSelectors[section])
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      expect(textSize, `${section} reading size`).toBeGreaterThanOrEqual(
        section === 'stack' ? 14 : 15,
      )
      await page.screenshot({ path: `test-results/readability-${width}-${section}.png` })
      const bounds = await page.locator('main').evaluate((el) => ({
        width: el.clientWidth,
        scrollWidth: el.scrollWidth,
        height: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }))
      expect
        .soft(bounds.scrollWidth, `${section} horizontal overflow`)
        .toBeLessThanOrEqual(bounds.width + 1)
      expect
        .soft(bounds.scrollHeight, `${section} vertical overflow`)
        .toBeLessThanOrEqual(bounds.height + 1)
    }
  })
}
