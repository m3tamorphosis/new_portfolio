import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

for (const [width, height] of [
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [1920, 900],
  [1920, 950],
  [1920, 850],
  [1600, 900],
  [1600, 850],
  [1536, 864],
  [768, 1024],
  [1024, 768],
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
  [800, 360],
  [667, 375],
]) {
  test(`Home content stays separated at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await page.evaluate(() => document.fonts.ready)
    const bounds = await page.evaluate(() => {
      const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect()
      const main = document.querySelector('main')!
      const strip = rect('.selected-work')
      const copy = rect('.hero-copy')
      const visual = rect('.hero-visual')
      const actions = rect('.hero-actions')
      const footer = rect('.app-footer')
      return {
        heroBottom: Math.max(copy.bottom, visual.bottom, actions.bottom),
        stripTop: strip.top,
        stripBottom: strip.bottom,
        footerTop: footer.top,
        mainHeight: main.clientHeight,
        mainScroll: main.scrollHeight,
        horizontalScroll: document.documentElement.scrollWidth,
      }
    })
    await page.screenshot({ path: `test-results/home-separated-${width}x${height}.png` })
    expect(bounds.heroBottom).toBeLessThanOrEqual(bounds.stripTop - 4)
    if (width > 900 && height > 480) {
      expect(bounds.stripBottom).toBeLessThanOrEqual(bounds.footerTop)
      expect(bounds.mainScroll).toBeLessThanOrEqual(bounds.mainHeight + 1)
    }
    expect(bounds.horizontalScroll).toBeLessThanOrEqual(width)
    const projects = page.locator('.project-strip .project-teaser')
    await expect(projects).toHaveCount(3)
    for (const preview of await projects.locator('.mini-preview').all()) {
      await expect(preview).toBeVisible()
    }
    await projects.last().scrollIntoViewIfNeeded()
    await expect(projects.last()).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: `test-results/home-projects-${width}x${height}.png` })
    await projects.last().click()
    await expect(page.locator('.builds-view')).toBeVisible()
  })
}

test('navigation supports keyboard, history, and direct links', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /I build things/ })).toBeVisible()
  await page.keyboard.press('3')
  await expect(page.getByRole('heading', { name: /Less talk/ })).toBeVisible()
  await page.keyboard.press('4')
  await expect(page.getByRole('heading', { name: /Built on experience/ })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: /Less talk/ })).toBeVisible()
  await page.goto('/#contact')
  await expect(page.getByRole('heading', { name: /Got an idea/ })).toBeVisible()
  await page.keyboard.press('?')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('project demos run and can be replayed', async ({ page }) => {
  await page.goto('/#builds')
  await page.getByRole('button', { name: 'Let’s fly' }).click()
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled()
  await page.getByRole('button', { name: 'Restart game' }).click()
  await expect(page.locator('.flight-score')).toHaveText('SCORE 00')
  await page.getByRole('button', { name: /03 InsightVault Lite/ }).click()
  await expect(page.locator('.project-screenshot img')).toHaveAttribute(
    'src',
    /insight-preview.jpg$/,
  )
  await expect(
    page.getByRole('link', { name: 'Explore InsightVault Lite live app' }),
  ).toHaveAttribute('href', 'https://insight-vault-lite.vercel.app/')
  await page.getByRole('button', { name: /04 StudyBuddyGPT/ }).click()
  await expect(page.locator('.project-screenshot img')).toHaveAttribute('src', /study-preview.jpg$/)
  await expect(page.getByRole('link', { name: 'Explore StudyBuddyGPT live app' })).toHaveAttribute(
    'href',
    'https://studdybuddygpt.vercel.app/',
  )
  await page.getByRole('button', { name: /05 Danger Zone/ }).click()
  await expect(page.locator('.project-screenshot img')).toHaveAttribute(
    'src',
    /danger-preview.jpg$/,
  )
  await expect(page.getByRole('link', { name: 'Explore Danger Zone live app' })).toHaveAttribute(
    'href',
    'https://dangerzone.vercel.app/',
  )
})

test('experience, stack, contact and corrected résumé work', async ({ page, context }) => {
  await page.goto('/#experience')
  await page.getByRole('button', { name: /Department of Budget/ }).click()
  await expect(page.getByText(/Converted 100\+ PDF/)).toBeVisible()
  await page.keyboard.press('5')
  await page.getByRole('button', { name: /AI \/ ML/ }).click()
  await expect(page.getByText('Embeddings', { exact: true })).toBeVisible()
  await page.keyboard.press('6')
  await page.getByRole('button', { name: 'An opportunity', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute(
    'href',
    /subject=Career%20Opportunity/,
  )
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy email address' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Email address copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('carljohnharo02@gmail.com')
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Résumé' }).click()
  expect((await download).suggestedFilename()).toBe('Carl-John-Haro-Resume.pdf')
})

test('globe remains visible without controls in reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('img', { name: /^Interactive Tech Stack Globe/ })).toBeVisible()
  await expect(page.locator('.playground button')).toHaveCount(0)
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`responsive shell at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const view of ['home', 'about', 'builds', 'experience', 'stack', 'contact']) {
      await page.goto(`/?check=${view}#${view}`)
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
      await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
      const size = await page.evaluate(() => {
        const main = document.querySelector('main')!
        return {
          w: document.documentElement.scrollWidth,
          h: document.documentElement.scrollHeight,
          mainH: main.clientHeight,
          mainScroll: main.scrollHeight,
        }
      })
      expect(size.w).toBeLessThanOrEqual(viewport.width)
      if (viewport.width > 900) expect(size.h).toBeLessThanOrEqual(viewport.height)
      if (viewport.width >= 1280)
        expect(
          size.mainScroll,
          `${view} needs scroll at ${viewport.width} × ${viewport.height}`,
        ).toBeLessThanOrEqual(size.mainH + 1)
      if (view === 'home')
        await page.screenshot({ path: `test-results/home-${viewport.width}.png` })
    }
    expect(errors).toEqual([])
  })
}

test('all views pass accessibility checks', async ({ page }) => {
  for (const view of ['home', 'about', 'builds', 'experience', 'stack', 'contact']) {
    await page.goto(`/?check=${view}#${view}`)
    await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    if (view === 'about') await expect(page.locator('.about-current')).toHaveCSS('opacity', '1')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
      view,
    ).toEqual([])
  }
})
