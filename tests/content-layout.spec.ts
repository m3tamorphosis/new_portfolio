import { expect, test } from '@playwright/test'

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 900],
  [1920, 1080],
]) {
  test(`updated content stays within its layout at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#contact')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await page.evaluate(() => document.fonts.ready)
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll('main, .contact-view, .contact-layout, .contact-card')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.className),
    )
    expect(overflow).toEqual([])
    await page.screenshot({
      path: `test-results/contact-fit-${width}x${height}.png`,
      fullPage: true,
    })
    await page.goto('/#builds')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    for (const name of [
      'Playable experiences',
      'CareerForge AI',
      'InsightVault Lite',
      'Developer Portfolio',
      'StudyBuddyGPT',
      'Danger Zone',
    ]) {
      await page
        .locator('.project-selector')
        .getByRole('button', { name: new RegExp(name) })
        .click()
      await expect(page.locator('.project-description')).toHaveCSS('opacity', '1')
      if (width > 900) {
        const overflow = await page
          .locator('.project-details')
          .evaluate((el) => el.scrollHeight - el.clientHeight)
        expect(overflow, name).toBeLessThanOrEqual(1)
      }
    }
    await page
      .locator('.project-selector')
      .getByRole('button', { name: /Playable experiences/ })
      .click()
    await page.screenshot({
      path: `test-results/builds-fit-${width}x${height}.png`,
      fullPage: true,
    })
    await page.goto('/#about')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await expect(
      page.locator('.about-discipline').filter({ hasText: 'Full-stack systems' }),
    ).toContainText('NextAuth.js')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}
