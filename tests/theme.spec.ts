import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function openOptions(page: Page, mobile = false) {
  if (mobile) {
    await page.getByRole('button', { name: 'Open index menu' }).click()
    await expect(page.locator('.mobile-index')).toHaveCSS('opacity', '1')
  }
}

for (const mobile of [false, true]) {
  test(`light/dark switch persists and supports keyboard (${mobile ? 'mobile' : 'desktop'})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      hasTouch: mobile,
      colorScheme: 'dark',
    })
    const page = await context.newPage()
    await page.goto('/')
    const root = page.locator('html')
    await expect(root).toHaveAttribute('data-theme', 'light')
    await openOptions(page, mobile)
    const toggle = page.getByRole('switch', { name: 'Dark theme' })
    await expect(toggle).not.toBeChecked()
    await expect(page.getByRole('radio')).toHaveCount(0)
    if (mobile) await toggle.tap()
    else await toggle.click()
    await expect(toggle).toBeChecked()
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(root).toHaveAttribute('data-theme', 'dark')
    await openOptions(page, mobile)
    await toggle.focus()
    await page.keyboard.press('Space')
    await expect(toggle).not.toBeChecked()
    await expect(root).toHaveAttribute('data-theme', 'light')
    await page.keyboard.press('Enter')
    await expect(toggle).toBeChecked()
    await page.evaluate(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'portfolio-theme', newValue: 'light' }),
      ),
    )
    await expect(toggle).not.toBeChecked()
    expect((await new AxeBuilder({ page }).include('.theme-options').analyze()).violations).toEqual(
      [],
    )
    await page.screenshot({
      path: `test-results/theme-switch-${mobile ? 'mobile' : 'desktop'}.png`,
    })
    await context.close()
  })
}

test('theme is applied before the application loads, including unavailable storage', async ({
  browser,
}) => {
  for (const saved of ['light', 'dark', 'system', 'invalid', 'blocked']) {
    const context = await browser.newContext({ colorScheme: saved === 'dark' ? 'light' : 'dark' })
    await context.addInitScript((preference) => {
      if (preference === 'blocked')
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new Error('Storage unavailable')
          },
        })
      else localStorage.setItem('portfolio-theme', preference)
    }, saved)
    const page = await context.newPage()
    await page.route('**/src/main.tsx*', (route) => route.abort())
    await page.goto('/')
    await expect(page.locator('#root')).toBeEmpty()
    const expected = saved === 'dark' ? 'dark' : 'light'
    await expect(page.locator('html')).toHaveAttribute('data-theme', expected)
    await expect(page.locator('html')).toHaveCSS(
      'background-color',
      expected === 'dark' ? 'rgb(23, 25, 23)' : 'rgb(245, 245, 240)',
    )
    await page.unroute('**/src/main.tsx*')
    await page.reload()
    await expect(page.locator('.app-shell')).toBeVisible()
    await openOptions(page)
    if (expected === 'dark') await page.getByRole('switch', { name: 'Dark theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await context.close()
  }
})

for (const size of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`all sections and dialogs in ${theme} at ${size.width}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: size,
        hasTouch: size.width < 1200,
        colorScheme: theme,
        reducedMotion: 'reduce',
      })
      await context.addInitScript((value) => localStorage.setItem('portfolio-theme', value), theme)
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      for (const section of ['home', 'about', 'builds', 'experience', 'stack', 'contact']) {
        await page.goto(`/?theme-audit=${section}#${section}`)
        await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
        await page.evaluate(() => document.fonts.ready)
        // Wait for existing staggered opacity reveals before contrast measurements.
        await page.waitForTimeout(1000)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        )
        const audit = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
        expect(
          audit.violations.flatMap((v) =>
            v.nodes.map((n) => ({ target: n.target, issue: n.failureSummary })),
          ),
          `${theme} ${section}`,
        ).toEqual([])
        await page.screenshot({
          path: `test-results/theme-${theme}-${size.width}-${section}.png`,
          fullPage: true,
        })
      }
      await page.goto('/')
      await page.getByRole('button', { name: 'Preview CareerForge AI', exact: true }).click()
      const preview = page.getByRole('dialog', { name: 'CareerForge AI', exact: true })
      await preview.getByRole('button', { name: 'Compare layout' }).click()
      await preview.getByRole('slider').fill('70')
      await expect(preview.getByRole('slider')).toHaveValue('70')
      expect(
        (await new AxeBuilder({ page }).include('.quick-preview-dialog').analyze()).violations,
      ).toEqual([])
      await page.screenshot({ path: `test-results/theme-${theme}-${size.width}-preview.png` })
      await page.keyboard.press('Escape')
      await page.route('**/api/chat', (route) =>
        route.fulfill({
          json: { reply: 'Carl builds AI-powered applications and interactive web experiences.' },
        }),
      )
      await page.locator('.assistant-launcher').click()
      await page
        .getByRole('textbox', { name: 'Message portfolio assistant' })
        .fill('What has Carl built?')
      await page.getByRole('textbox', { name: 'Message portfolio assistant' }).press('Enter')
      await expect(page.getByRole('log')).toContainText('Carl builds AI-powered applications')
      expect(
        (await new AxeBuilder({ page }).include('.assistant-dialog').analyze()).violations,
      ).toEqual([])
      await page.keyboard.press('Escape')
      await openOptions(page, size.width < 1200)
      expect(
        (await new AxeBuilder({ page }).include('.theme-options').analyze()).violations,
      ).toEqual([])
      await page.screenshot({ path: `test-results/theme-${theme}-${size.width}-control.png` })
      expect(errors).toEqual([])
      await context.close()
    })
  }
}

test('canvases repaint on switch changes without resetting reduced-motion globe or paused game', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.goto('/')
  const globe = page.locator('.playground canvas')
  await expect(page.locator('.globe-node').first()).toHaveAttribute('style', /translate3d/)
  const pixels = () => globe.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  const positions = () =>
    page
      .locator('.globe-node')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).style.transform))
  const before = await pixels()
  const rotation = await positions()
  await page.getByRole('switch', { name: 'Dark theme' }).click()
  await expect.poll(pixels).not.toBe(before)
  expect(await positions()).toEqual(rotation)
  await page.goto('/#builds')
  await page.getByRole('button', { name: 'Let’s fly' }).click()
  await page.getByRole('button', { name: 'Pause game' }).click()
  const game = page.getByLabel('Flappy flight game')
  const gamePixels = () => game.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  const paused = await gamePixels()
  const score = await page.locator('.flight-score').innerText()
  await page.getByRole('switch', { name: 'Dark theme' }).click()
  await expect.poll(gamePixels).not.toBe(paused)
  await expect(page.getByRole('button', { name: 'Resume flight' })).toBeVisible()
  expect(await page.locator('.flight-score').innerText()).toBe(score)
})
