import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const size of [
  { width: 1440, height: 900 },
  { width: 1280, height: 650 },
  { width: 393, height: 852 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`portfolio assistant preview works at ${size.width} × ${size.height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/api/chat', async (route) => {
      const { messages } = route.request().postDataJSON()
      const question = messages.at(-1).content
      const reply = question.includes('technologies')
        ? 'Carl uses React, TypeScript, and Phaser 3.'
        : question.includes('contact')
          ? 'Email Carl at carljohnharo02@gmail.com.'
          : 'Carl has built CareerForge AI and other portfolio projects.'
      await route.fulfill({ json: { reply } })
    })
    await page.setViewportSize(size)
    await page.goto('/#about')
    await page.evaluate(() => document.fonts.ready)
    const launcher = page.getByRole('button', {
      name: size.width > 900 ? 'Ask about me' : 'Ask about my work',
      exact: true,
    })
    const launcherBounds = await launcher.boundingBox()
    expect(launcherBounds!.width).toBeGreaterThanOrEqual(44)
    expect(launcherBounds!.height).toBeGreaterThanOrEqual(44)
    expect(launcherBounds!.x + launcherBounds!.width).toBeLessThanOrEqual(size.width)
    expect(launcherBounds!.y + launcherBounds!.height).toBeLessThanOrEqual(size.height)
    if (size.width > 900) {
      await expect(page.locator('.sidebar .assistant-launcher')).toHaveCount(1)
      await expect(launcher.locator('span')).toBeVisible()
      const sidebarBounds = await page.locator('.sidebar').boundingBox()
      expect(launcherBounds!.x).toBeGreaterThanOrEqual(sidebarBounds!.x)
      expect(launcherBounds!.x + launcherBounds!.width).toBeLessThanOrEqual(
        sidebarBounds!.x + sidebarBounds!.width,
      )
      expect(launcherBounds!.y + launcherBounds!.height).toBeLessThanOrEqual(
        sidebarBounds!.y + sidebarBounds!.height,
      )
    } else {
      await expect(launcher).toHaveCSS('position', 'fixed')
    }
    await page.screenshot({ path: `test-results/assistant-launcher-${size.width}.png` })
    await launcher.click()
    const panel = page.getByRole('dialog', { name: /Ask Carl.s assistant/ })
    const close = panel.getByRole('button', { name: 'Close portfolio assistant' })
    await expect(panel).toBeVisible()
    await expect(panel).toBeFocused()
    await expect(panel.getByRole('textbox', { name: 'Message portfolio assistant' })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Send message' })).toBeDisabled()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(panel.getByRole('link', { name: 'Contact Carl' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('6')
    await expect(page).toHaveURL(/#about$/)
    await page.keyboard.press('?')
    await expect(page.locator('dialog[open]')).toHaveCount(1)

    const input = panel.getByRole('textbox')
    await input.fill('What has Carl built?')
    await input.press('Enter')
    await expect(panel.getByRole('log')).toContainText('CareerForge AI')
    await input.fill('What technologies does he use?')
    await input.press('Enter')
    await expect(panel.getByRole('log')).toContainText('Phaser 3')
    await input.fill('How can I contact Carl?')
    await panel.getByRole('button', { name: 'Send message' }).click()
    await expect(panel.getByRole('log')).toContainText('carljohnharo02@gmail.com')
    const bounds = await panel.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height)
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/assistant-${size.width}.png` })
    const accessibility = await new AxeBuilder({ page }).include('#portfolio-assistant').analyze()
    expect(accessibility.violations).toEqual([])

    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await expect(launcher).toBeFocused()
    await expect(launcher).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
    await launcher.click()
    await panel.getByRole('link', { name: 'Contact Carl' }).click()
    await expect(page).toHaveURL(/#contact$/)
    await expect(panel).not.toBeVisible()
    if (size.width <= 900) {
      await page.locator('.app-footer').scrollIntoViewIfNeeded()
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      const mobileLauncher = await launcher.boundingBox()
      const credit = await page.locator('.footer-credit').boundingBox()
      const creditText = await page.locator('.footer-credit').evaluate((el) => {
        const range = document.createRange()
        range.selectNodeContents(el)
        return range.getBoundingClientRect().right
      })
      expect(
        creditText < mobileLauncher!.x || credit!.y > mobileLauncher!.y + mobileLauncher!.height,
      ).toBe(true)
      await expect(page.locator('.view-pagination')).toHaveCount(0)
    }
    expect(errors).toEqual([])
  })
}
