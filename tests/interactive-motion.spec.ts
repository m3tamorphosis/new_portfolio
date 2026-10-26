import { expect, test } from '@playwright/test'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`mobile scroll reveals and preview press respect ${reducedMotion}`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      reducedMotion,
    })
    const page = await context.newPage()
    await page.goto('/')
    const card = page.locator('.project-teaser').first()
    await expect(card).toHaveCSS('opacity', reducedMotion === 'reduce' ? '1' : '0')
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveCSS('opacity', '1')
    await expect(card).toHaveCSS('transform', 'none')
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(card).toHaveCSS('opacity', '1')
    await card.scrollIntoViewIfNeeded()
    await card.locator('.mini-preview').tap()
    await card.locator('.teaser-note').tap()
    await expect(page.getByRole('dialog')).not.toBeVisible()
    const rect = (await card.locator('.teaser-preview-label').boundingBox())!
    const touch = await context.newCDPSession(page)
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }],
    })
    const arrow = card.locator('.teaser-preview-icon')
    if (reducedMotion === 'reduce') {
      await expect(arrow).toHaveCSS('transform', 'none')
    } else {
      await expect(arrow).not.toHaveCSS('transform', 'none')
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.goto('/#about')
    for (const article of await page.locator('.about-discipline').all()) {
      await article.scrollIntoViewIfNeeded()
      await expect(article).toHaveCSS('opacity', '1')
      await expect(article).toHaveCSS('transform', 'none')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
    await context.close()
  })
}

test('project hover responds to the pointer, resets, and still opens the project', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
  const project = page.locator('.project-teaser').first()
  const titleColor = await project.locator('h3').evaluate((el) => getComputedStyle(el).color)
  const bounds = (await project.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.4)
  await expect(project).toHaveAttribute('data-pointer-active', 'true')
  await expect
    .poll(() =>
      project.evaluate((el) => Number.parseFloat(el.style.getPropertyValue('--pointer-dx'))),
    )
    .toBeGreaterThan(0)
  await expect(project.locator('h3')).toHaveCSS('color', titleColor)
  await expect(project.locator('.mini-preview')).not.toHaveCSS('transform', 'none')
  await page.mouse.move(1, 1)
  await expect(project).not.toHaveAttribute('data-pointer-active')
  expect(await project.evaluate((el) => el.style.getPropertyValue('--pointer-x'))).toBe('')
  await project.locator('.mini-preview').click()
  await project.locator('.teaser-note').click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await project.getByRole('button', { name: 'Preview Front-End & Game Dev' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Play demo', exact: true }).click()
  await expect(page).toHaveURL(/#builds$/)
  await expect(page.locator('.builds-view')).toBeVisible()
})

test('changing reduced-motion preference clears hover effects immediately', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const action = page.getByRole('button', { name: 'Explore my builds' })
  await action.hover()
  await expect(action).toHaveAttribute('data-pointer-active', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(action).not.toHaveAttribute('data-pointer-active')
  await expect(action).toHaveCSS('transform', 'none')
  await expect(page.locator('.hero-copy h1')).toHaveCSS('animation-name', 'none')
  await action.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#builds$/)
})

test('touch navigation works without pointer effects', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })
  const page = await context.newPage()
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore my builds' }).tap()
  await expect(page).toHaveURL(/#builds$/)
  await expect(page.locator('.builds-view')).toBeVisible()
  await expect(page.locator('[data-pointer-active]')).toHaveCount(0)
  await context.close()
})
