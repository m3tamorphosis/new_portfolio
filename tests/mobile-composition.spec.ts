import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'

const sizes = [
  [320, 568],
  [375, 667],
  [390, 844],
  [393, 852],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [667, 375],
  [844, 390],
  [932, 430],
  [956, 442],
  [1024, 480],
  [1200, 500],
]
const sections = ['home', 'about', 'builds', 'experience', 'stack', 'contact']

for (const [width, height] of sizes) {
  test(`coherent section layouts at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    for (const section of sections) {
      await page.goto(`/#${section}`)
      await expect(page.locator(`main .${section}-view`)).toBeVisible()
      await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
      await expect(page.locator('.view-container')).toHaveCSS('transform', 'none')
      await page.evaluate(() => document.fonts.ready)
      if (section === 'about')
        await expect(page.locator('.about-current')).toHaveCSS('opacity', '1')
      const geometry = await page.evaluate(() => {
        const main = document.querySelector('main')!
        const content = main.firstElementChild!.getBoundingClientRect()
        const footer = document.querySelector('footer')!.getBoundingClientRect()
        return {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          mainScroll: main.scrollHeight,
          mainHeight: main.clientHeight,
          contentBottom: content.bottom,
          footerTop: footer.top,
          overflow: [
            ...main.querySelectorAll(
              '.project-teaser, .tool-tile, .about-discipline, .contact-card, .demo',
            ),
          ]
            .filter(
              (el) =>
                el.getClientRects().length &&
                (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1),
            )
            .map((el) => el.className),
        }
      })
      expect(geometry.width, section).toBe(width)
      expect(geometry.overflow, section).toEqual([])
      if (width <= 900 || (width <= 1200 && height <= 500)) {
        await expect(page.locator('.sidebar')).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Open index menu' })).toBeVisible()
        expect(geometry.footerTop, section).toBeGreaterThanOrEqual(geometry.contentBottom - 1)
        expect(geometry.mainScroll, section).toBeLessThanOrEqual(geometry.mainHeight + 1)
        if (section === 'home') {
          const cards = await page.locator('.project-teaser').all()
          const rects = await Promise.all(cards.map((card) => card.boundingBox()))
          for (let i = 1; i < rects.length; i++)
            expect(rects[i]!.y).toBeGreaterThanOrEqual(rects[i - 1]!.y + rects[i - 1]!.height)
          const canvas = (await page.locator('.playground').boundingBox())!
          expect(canvas.height).toBeGreaterThanOrEqual(180)
          await expect(page.locator('.mobile-hero-summary')).toBeVisible()
          const actions = (await page.locator('.hero-actions').boundingBox())!
          const description = (await page.locator('.hero-description').boundingBox())!
          expect(actions.y + actions.height).toBeLessThan(description.y)
        }
        if (section === 'builds') {
          const preview = (await page.locator('.project-preview').boundingBox())!
          const tags = (await page.locator('.project-tags').boundingBox())!
          expect(tags.y).toBeGreaterThanOrEqual(preview.y + preview.height)
        }
        if (section === 'about' && width >= 600 && width > height) {
          const overview = (await page.locator('.about-overview').boundingBox())!
          const portrait = (await page.locator('.portrait').boundingBox())!
          const intro = (await page.locator('.about-intro').boundingBox())!
          expect(portrait.x).toBeCloseTo(overview.x, 0)
          expect(portrait.width).toBeLessThanOrEqual(280)
          expect(intro.x).toBeGreaterThanOrEqual(portrait.x + portrait.width + 20)
          expect(intro.x + intro.width).toBeLessThanOrEqual(overview.x + overview.width + 1)
          expect(intro.y).toBeGreaterThanOrEqual(overview.y)
          expect(intro.y + intro.height).toBeLessThanOrEqual(overview.y + overview.height + 1)
        }
      } else {
        await expect(page.locator('.sidebar')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Open index menu' })).toHaveCount(0)
        expect(geometry.height).toBe(height)
        expect(geometry.mainScroll, section).toBeLessThanOrEqual(geometry.mainHeight + 1)
        const sidebar = await page
          .locator('.sidebar')
          .evaluate((el) => ({ h: el.clientHeight, s: el.scrollHeight }))
        expect(sidebar.s).toBeLessThanOrEqual(sidebar.h + 1)
      }
      await page.screenshot({
        path: `test-results/refined-${width}-${section}.png`,
        fullPage: width <= 900 || (width <= 1200 && height <= 500),
      })
    }
    expect(errors).toEqual([])
  })
}

for (const width of [320, 393, 768]) {
  test(`mobile index navigation, focus, and downloads at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 })
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Open index menu' })
    const menu = page.getByRole('dialog', { name: 'EXPLORE', exact: true })
    await trigger.click()
    await expect(menu).toBeVisible()
    await expect(menu).toHaveCSS('opacity', '1')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(menu.locator('.nav-item')).toHaveCount(6)
    await expect(menu.locator('.connect-links a')).toHaveCount(1)
    await expect(menu.locator('.connect-links a')).toHaveText('Download Resume')
    const targets = await menu
      .locator('button,a')
      .evaluateAll((items) =>
        items.map((el) => ({ name: el.textContent, h: el.getBoundingClientRect().height })),
      )
    expect(targets.filter((el) => el.h < 44)).toEqual([])
    await page.screenshot({ path: `test-results/refined-${width}-menu.png` })
    await page.keyboard.press('Shift+Tab')
    expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
    for (const [label, hash] of [
      ['About Me', 'about'],
      ['Builds', 'builds'],
      ['Experience', 'experience'],
      ['Stack', 'stack'],
      ['Contact', 'contact'],
      ['Home', 'home'],
    ]) {
      await trigger.click()
      await menu.getByRole('button', { name: new RegExp(label.replace('.', '\\.')) }).click()
      await expect(menu).toBeHidden()
      await expect(page).toHaveURL(new RegExp(`#${hash}$`))
      await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
      expect(await page.evaluate(() => scrollY)).toBe(0)
    }
    await trigger.click()
    const download = page.waitForEvent('download')
    await menu.getByRole('link', { name: 'Download Resume', exact: true }).click()
    const file = await download
    expect(file.suggestedFilename()).toBe('Carl-John-Haro-Resume.pdf')
    expect(await readFile((await file.path())!)).toEqual(
      await readFile('public/Carl-John-Haro-Resume.pdf'),
    )
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([])
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.locator('.sidebar')).toBeVisible()
    await expect(page.locator('.mobile-index')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden')
  })
}

test('mobile previews, canvas, and contact remain interactive and accessible', async ({
  page,
  context,
}) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 393, height: 852 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('img', { name: /^Interactive Tech Stack Globe/ })).toBeVisible()
  await expect(page.locator('.playground button')).toHaveCount(0)
  await page.getByRole('button', { name: 'Preview InsightVault Lite', exact: true }).click()
  await page.getByRole('button', { name: 'View project', exact: true }).click()
  await expect(page.locator('.project-screenshot img')).toHaveAttribute(
    'src',
    /insight-preview.jpg$/,
  )
  await expect(
    page.getByRole('link', { name: 'Explore InsightVault Lite live app' }),
  ).toHaveAttribute('href', 'https://insight-vault-lite.vercel.app/')
  await page.getByRole('button', { name: /StudyBuddyGPT/ }).click()
  await expect(page.locator('.project-screenshot img')).toHaveAttribute('src', /study-preview.jpg$/)
  await expect(page.getByRole('link', { name: 'Explore StudyBuddyGPT live app' })).toHaveAttribute(
    'href',
    'https://studdybuddygpt.vercel.app/',
  )
  await page.getByRole('button', { name: /Danger Zone/ }).click()
  await expect(page.locator('.project-screenshot img')).toHaveAttribute(
    'src',
    /danger-preview.jpg$/,
  )
  await expect(page.getByRole('link', { name: 'Explore Danger Zone live app' })).toHaveAttribute(
    'href',
    'https://dangerzone.vercel.app/',
  )
  await page.getByRole('button', { name: /Playable experiences/ }).click()
  await page.getByRole('button', { name: 'Let’s fly' }).click()
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled()
  await page.goto('/#contact')
  await page.getByRole('button', { name: 'An opportunity', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute(
    'href',
    /subject=Career%20Opportunity/,
  )
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy email address' }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('carljohnharo02@gmail.com')
  for (const section of sections) {
    await page.goto(`/#${section}`)
    await expect(page.locator(`main .${section}-view`)).toBeVisible()
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      section,
    ).toEqual([])
  }
})
