import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('previews pause the background globe and resume it after closing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.addInitScript(() => {
    const state = window as typeof window & { globeFrames: number }
    state.globeFrames = 0
    const clear = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest('.playground')) state.globeFrames++
      return clear.apply(this, args)
    }
  })
  await page.goto('/')
  const frames = () =>
    page.evaluate(() => (window as typeof window & { globeFrames: number }).globeFrames)
  await expect.poll(frames).toBeGreaterThan(2)
  for (const name of ['CareerForge AI', 'Playable experiences']) {
    await page.getByRole('button', { name: `Preview ${name}`, exact: true }).click()
    const dialog = page.getByRole('dialog', { name, exact: true })
    await expect(dialog).toBeVisible()
    const pausedAt = await frames()
    await page.waitForTimeout(350)
    expect(await frames()).toBe(pausedAt)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect.poll(frames).toBeGreaterThan(pausedAt)
  }
})

for (const width of [320, 390, 768, 1440]) {
  test(`project previews and comparison slider at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Preview CareerForge AI', exact: true })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'CareerForge AI', exact: true })
    await expect(dialog).toBeVisible()
    const close = dialog.getByRole('button', { name: 'Close project preview' })
    await expect(close).toBeFocused()
    await expect(dialog.locator('.quick-preview-image')).toHaveAttribute(
      'src',
      /careerforge-preview.jpg$/,
    )
    await dialog.getByRole('button', { name: 'Compare layout' }).click()
    const slider = dialog.getByRole('slider')
    await expect(slider).toHaveValue('50')
    await slider.focus()
    await page.keyboard.press('Home')
    await expect(slider).toHaveValue('0')
    await page.keyboard.press('End')
    await expect(slider).toHaveValue('100')
    await page.keyboard.press('ArrowLeft')
    await expect(slider).toHaveValue('99')
    await expect(dialog.locator('.comparison-study')).toHaveCSS(
      'clip-path',
      'inset(0px 1% 0px 0px)',
    )
    const box = (await slider.boundingBox())!
    await page.mouse.click(box.x + box.width * 0.35, box.y + box.height / 2)
    expect(Number(await slider.inputValue())).toBeLessThan(50)
    const overflow = await dialog.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
    expect(overflow).toBe(false)
    await dialog.screenshot({ path: `test-results/comparison-${width}.png` })
    const audit = await new AxeBuilder({ page })
      .include('.quick-preview-dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(audit.violations).toEqual([])
    await close.focus()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.getByRole('button', { name: 'View project', exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')
    await trigger.click()
    await dialog.getByRole('button', { name: 'View project', exact: true }).click()
    await expect(page).toHaveURL(/#builds$/)
    for (const project of ['CareerForge AI', 'InsightVault Lite', 'StudyBuddyGPT', 'Danger Zone']) {
      await page
        .locator('.project-selector')
        .getByRole('button', { name: new RegExp(project) })
        .click()
      await page.getByRole('button', { name: 'Quick preview', exact: true }).click()
      const preview = page.getByRole('dialog', { name: project, exact: true })
      await expect(preview).toBeVisible()
      await preview.getByRole('button', { name: 'Compare layout' }).click()
      await expect(preview.getByRole('slider')).toHaveValue('50')
      await page.keyboard.press('Escape')
    }
  })
}

test('comparison slider responds to a touch drag', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByRole('button', { name: 'Preview CareerForge AI', exact: true }).tap()
  await page.getByRole('button', { name: 'Compare layout' }).tap()
  const slider = page.getByRole('slider')
  await slider.scrollIntoViewIfNeeded()
  const box = (await slider.boundingBox())!
  const session = await context.newCDPSession(page)
  const y = box.y + box.height / 2
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + box.width / 2, y, id: 1 }],
  })
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: box.x + box.width * 0.8, y, id: 1 }],
  })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(Number(await slider.inputValue())).toBeGreaterThan(65)
  await context.close()
})
