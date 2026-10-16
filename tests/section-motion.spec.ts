import { expect, test } from '@playwright/test'

test('sidebar transitions do not introduce temporary page scrollbars', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  for (const width of [1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    for (const section of ['Experience', 'Stack', 'About Me', 'Builds', 'Contact', 'Home']) {
      const overflow = await page.evaluate(async (name) => {
        const main = document.querySelector<HTMLElement>('main')!
        const button = [...document.querySelectorAll<HTMLButtonElement>('.sidebar .nav-item')].find(
          (item) => item.textContent?.endsWith(name),
        )!
        let peak = 0
        const start = performance.now()
        button.click()
        await new Promise<void>((resolve) => {
          const sample = () => {
            peak = Math.max(peak, main.scrollHeight - main.clientHeight)
            if (performance.now() - start < 600) requestAnimationFrame(sample)
            else resolve()
          }
          requestAnimationFrame(sample)
        })
        return peak
      }, section)
      expect(overflow, `${section} at ${width}`).toBeLessThanOrEqual(1)
    }
  }
})

for (const width of [1440, 390]) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`category reveals and timeline selection at ${width}, ${reducedMotion}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion })
      await page.goto('/#stack')
      const categories = page.locator('.stack-menu > button')
      await categories.nth(1).click()
      await categories.nth(4).click()
      await categories.nth(6).click()
      await expect(page.locator('.tool-name')).toHaveText([
        'Git',
        'GitHub',
        'Vercel',
        'VS Code',
        'Figma',
        'Power BI',
        'Tableau',
        'Vite',
        'Playwright',
      ])
      for (const row of await page.locator('.tool-tile').all()) {
        await expect(row).toHaveCSS('opacity', '1')
        await expect(row).toHaveCSS('transform', 'none')
      }
      await page.goto('/#experience')
      await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
      const roles = page.locator('.experience-timeline > button')
      for (const index of [1, 0, 1]) {
        await roles.nth(index).click()
        await expect(roles.nth(index)).toHaveAttribute('aria-pressed', 'true')
        const dot = roles.nth(index).locator('.timeline-dot-active')
        await expect(page.locator('.timeline-dot-active')).toHaveCount(1)
        await expect(dot).toHaveCSS('transform', 'none')
        await expect(page.locator('.experience-detail')).toHaveCSS('opacity', '1')
        const anchor = (await roles
          .nth(index)
          .locator('.timeline-dot:not(.timeline-dot-active)')
          .boundingBox())!
        const marker = (await dot.boundingBox())!
        expect(marker.x).toBeCloseTo(anchor.x, 0)
        expect(marker.y).toBeCloseTo(anchor.y, 0)
      }
      await expect(page.locator('.role-company')).toHaveText('Department of Budget and Management')
      await roles.first().focus()
      await page.keyboard.press('Enter')
      await expect(roles.first()).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.role-company')).toHaveText('HPL Game Design Corporation')
    })
  }
}
