import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('all six sections share navigation, history, shortcuts, and mobile menus', async ({
  page,
}) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Portfolio sections' })
  await expect(page.locator('.view-pagination')).toHaveCount(0)
  await expect(nav.locator('.nav-item')).toHaveCount(6)
  await expect(nav.locator('.nav-item')).toHaveText([
    '01Home',
    '02About Me',
    '03Builds',
    '04Exp.',
    '05Stack',
    '06Contact',
  ])
  await expect(nav.locator('[aria-expanded]')).toHaveCount(0)
  await nav.getByRole('button', { name: 'About Me' }).click()
  await expect(page.getByRole('heading', { name: 'About me.' })).toBeVisible()
  await expect(page).toHaveURL(/#about$/)
  await expect(nav.getByRole('button', { name: 'About Me' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(nav.locator('.nav-item.active')).toHaveCount(1)
  await page.getByRole('button', { name: 'Back to Home' }).click()
  await expect(page.getByRole('heading', { name: /I build things/ })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'About me.' })).toBeVisible()
  await page.keyboard.press('1')
  await expect(page.getByRole('heading', { name: /I build things/ })).toBeVisible()
  await page.goto('/#about')
  await page.setViewportSize({ width: 393, height: 852 })
  await expect(page.locator('.view-pagination')).toHaveCount(0)
  const mobileNavigate = async (name: string) => {
    await page.getByRole('button', { name: 'Open index menu' }).click()
    await page.getByRole('dialog', { name: 'EXPLORE' }).getByRole('button', { name }).click()
  }
  await mobileNavigate('Builds')
  await expect(page.getByRole('heading', { name: /Less talk/ })).toBeVisible()
  await page.keyboard.press('6')
  await expect(page.getByRole('heading', { name: /Got an idea/ })).toBeVisible()
  await mobileNavigate('Home')
  await expect(page.getByRole('heading', { name: /I build things/ })).toBeVisible()
  await mobileNavigate('Contact')
  await expect(page.getByRole('heading', { name: /Got an idea/ })).toBeVisible()
  await page.keyboard.press('2')
  await expect(page.getByRole('heading', { name: 'About me.' })).toBeVisible()
})

const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1440, height: 720 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1920, height: 900 },
  { width: 1920, height: 1080 },
  { width: 844, height: 390 },
  { width: 667, height: 375 },
  { width: 800, height: 360 },
]

for (const size of sizes) {
  test(`About and typography fit ${size.width} × ${size.height}`, async ({ page }) => {
    await page.setViewportSize(size)
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await expect(page.locator('.hero-copy h1')).toHaveCSS('font-family', 'Satoshi, sans-serif')
    await expect(page.locator('.hero-copy h1')).toHaveCSS('font-weight', '600')
    await expect(page.locator('.nav-number').first()).toHaveCSS(
      'font-family',
      '"Geist Mono", monospace',
    )
    await expect(page.locator('.hero-copy .serif-word')).toHaveCSS('font-style', 'italic')
    const hero = await page.locator('.hero-copy h1').evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = [...range.getClientRects()].filter((r) => r.width > 0)
      return {
        right: Math.max(...rects.map((r) => r.right)),
        windowWidth: innerWidth,
        loaded: [...document.fonts].map((f) => ({
          family: f.family,
          status: f.status,
          weight: f.weight,
        })),
      }
    })
    expect(hero.right).toBeLessThanOrEqual(size.width)
    expect(hero.loaded).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ family: 'Satoshi', status: 'loaded', weight: '300 900' }),
        expect.objectContaining({ family: 'Geist Mono', status: 'loaded', weight: '400' }),
      ]),
    )
    const navRects = await page.locator('.sidebar .nav-item').evaluateAll((items) =>
      items.map((item) => {
        const r = item.getBoundingClientRect()
        return { left: r.left, right: r.right, width: r.width, scroll: item.scrollWidth }
      }),
    )
    for (const rect of navRects) {
      expect(rect.right).toBeLessThanOrEqual(size.width)
      expect(rect.scroll).toBeLessThanOrEqual(Math.ceil(rect.width) + 1)
    }
    await page.screenshot({ path: `test-results/satoshi-home-${size.width}.png` })
    await page.goto('/?view=about#about')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.about-current')).toHaveCSS('opacity', '1')
    if (size.width <= 900) {
      await expect(page.locator('.about-tabs')).toBeHidden()
      for (const selector of [
        '.portrait',
        '.about-intro',
        '.about-profile',
        '.about-builds',
        '.about-approach',
        '.about-current',
      ]) {
        await expect(page.locator(selector)).toBeVisible()
      }
      await expect(page.locator('.about-discipline')).toHaveCount(4)
      const principles = page.locator('.about-principles > div')
      await expect(principles).toHaveCount(3)
      await expect(page.locator('.principle-description')).toHaveCount(3)
      for (const description of await page.locator('.principle-description').all())
        await expect(description).toBeVisible()
      const principleBoxes = await principles.evaluateAll((items) =>
        items.map((el) => {
          const rect = el.getBoundingClientRect()
          return {
            top: rect.top,
            bottom: rect.bottom,
            right: rect.right,
            width: el.clientWidth,
            scroll: el.scrollWidth,
          }
        }),
      )
      for (const box of principleBoxes) {
        expect(box.right).toBeLessThanOrEqual(size.width)
        expect(box.scroll).toBeLessThanOrEqual(box.width + 1)
      }
      if (size.width <= 600) {
        for (let i = 1; i < principleBoxes.length; i++)
          expect(principleBoxes[i].top).toBeGreaterThanOrEqual(principleBoxes[i - 1].bottom)
      }
      for (const card of await page.locator('.about-discipline').all()) {
        await expect(card).toBeVisible()
        await expect(card.locator('.discipline-stack')).toBeVisible()
        await expect(card.getByRole('listitem')).toHaveCount(6)
      }
      const frame = (await page.locator('.portrait').boundingBox())!
      expect(frame.width / frame.height).toBeCloseTo(0.8, 2)
      expect(frame.width).toBeGreaterThan(200)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(size.width)
      await page.screenshot({
        path: `test-results/about-flow-${size.width}x${size.height}.png`,
        fullPage: true,
      })
      return
    }
    const compact = await page.locator('.about-tabs').isVisible()
    const panels = compact ? ['Overview', 'Profile', 'What I build', 'Approach'] : ['desktop']
    const portrait = page.locator('.portrait')
    await expect(portrait).toBeVisible()
    await expect(portrait).not.toHaveAttribute('data-image-status', 'loading')
    const frame = await portrait.boundingBox()
    expect(frame).not.toBeNull()
    expect(frame!.width / frame!.height).toBeCloseTo(0.8, 2)
    expect(frame!.width).toBeGreaterThanOrEqual(compact ? 90 : 200)
    expect(frame!.x + frame!.width).toBeLessThanOrEqual(size.width)
    expect(frame!.y + frame!.height).toBeLessThanOrEqual(size.height)
    if (!compact) {
      const intro = await page.locator('.about-intro').boundingBox()
      const gap = intro!.x - (frame!.x + frame!.width)
      expect(
        gap,
        'Portrait and text should share the same 24px column gutter',
      ).toBeGreaterThanOrEqual(23)
      expect(gap).toBeLessThanOrEqual(26)
      for (const card of await page.locator('.about-discipline').all()) {
        await expect(card.locator('.discipline-expanded-description')).toBeVisible()
        await expect(card.locator('.discipline-stack')).toBeVisible()
        await expect(card.getByRole('listitem')).toHaveCount(6)
      }
    }
    if (compact) {
      const intro = (await page.locator('.about-intro').boundingBox())!
      const overview = (await page.locator('.about-overview').boundingBox())!
      const stacked =
        (size.width <= 760 || size.height > size.width) &&
        !(size.width >= 600 && size.height <= 480)
      const gap = stacked
        ? intro.y - (frame!.y + frame!.height)
        : intro.x - (frame!.x + frame!.width)
      expect(gap, 'The portrait must stay close to its introduction').toBeGreaterThanOrEqual(16)
      expect(gap).toBeLessThanOrEqual(26)
      expect(frame!.y).toBeGreaterThanOrEqual(overview.y - 1)
      expect(frame!.y + frame!.height).toBeLessThanOrEqual(overview.y + overview.height + 1)
      if (stacked && size.height >= 800) {
        expect(
          frame!.width,
          'Tall screens should use a substantial portrait',
        ).toBeGreaterThanOrEqual(Math.min(overview.width * 0.7, 300))
      }
    }
    for (const panel of panels) {
      if (compact) await page.getByRole('tab', { name: panel, exact: true }).click()
      if (!compact || panel === 'Approach') {
        for (const description of await page.locator('.principle-description').all())
          await expect(description).toBeVisible()
      }
      const bounds = await page.evaluate(() => {
        const main = document.querySelector('main')!
        const visible = [...document.querySelectorAll('.about-panel, .about-discipline')].filter(
          (el) => el.getClientRects().length > 0,
        )
        return {
          docWidth: document.documentElement.scrollWidth,
          docHeight: document.documentElement.scrollHeight,
          height: main.clientHeight,
          scroll: main.scrollHeight,
          panels: visible.map((el) => ({
            name: el.className,
            height: el.clientHeight,
            scroll: el.scrollHeight,
          })),
        }
      })
      expect(bounds.docWidth).toBe(size.width)
      expect(bounds.docHeight).toBe(size.height)
      expect(bounds.scroll, `${panel} main`).toBeLessThanOrEqual(bounds.height + 1)
      for (const item of bounds.panels)
        expect(item.scroll, `${panel}: ${item.name}`).toBeLessThanOrEqual(item.height + 1)
      await page.screenshot({
        path: `test-results/about-${size.width}x${size.height}-${panel.replaceAll(' ', '-')}.png`,
      })
    }
    if (compact) {
      await page.getByRole('tab', { name: 'What I build', exact: true }).click()
      for (const name of [
        'Full-stack systems',
        'Interactive experiences',
        'Playable ads',
        'AI-powered applications',
      ]) {
        await page.getByRole('button', { name, exact: true }).click()
        await expect(page.locator('.about-discipline[data-selected=true] p')).toBeVisible()
        const card = page.locator('.about-discipline[data-selected=true]')
        await expect(card.locator('.discipline-stack')).toBeVisible()
        await expect(card.getByRole('listitem')).toHaveCount(6)
        const fit = await card.evaluate((el) => {
          const cardRect = el.getBoundingClientRect()
          return {
            width: el.clientWidth,
            scrollWidth: el.scrollWidth,
            height: el.clientHeight,
            scrollHeight: el.scrollHeight,
            contentFits: [
              ...el.querySelectorAll('h3, p, .discipline-stack li, .discipline-example'),
            ]
              .filter((child) => child.getClientRects().length > 0)
              .every((child) => {
                const rect = child.getBoundingClientRect()
                return (
                  rect.top >= cardRect.top &&
                  rect.bottom <= cardRect.bottom + 1 &&
                  rect.left >= cardRect.left &&
                  rect.right <= cardRect.right + 1
                )
              }),
          }
        })
        expect(fit.scrollWidth, `${name} width`).toBeLessThanOrEqual(fit.width + 1)
        expect(fit.scrollHeight, `${name} height`).toBeLessThanOrEqual(fit.height + 1)
        expect(fit.contentFits, `${name} content should fit inside its card`).toBe(true)
        if (size.width === 375) {
          await page.screenshot({
            path: `test-results/discipline-${name.replaceAll(' ', '-')}.png`,
          })
        }
      }
      await page.getByRole('tab', { name: 'What I build', exact: true }).focus()
      await page.keyboard.press('ArrowLeft')
      await expect(page.getByRole('tab', { name: 'Profile', exact: true })).toBeFocused()
      await expect(page.getByText('Central Philippine University · 2021–2025')).toBeVisible()
    }
  })
}

test('About is accessible on desktop and compact layouts with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`/?size=${width}#about`)
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await expect(page.locator('.about-current')).toHaveCSS('opacity', '1')
    {
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      expect(
        result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([])
    }
  }
})

test('browser renders the bundled fonts and all Satoshi weights without substitution', async ({
  page,
  context,
}) => {
  const fontRequests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fontRequests.push(request.url())
  })
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all(
      [400, 450, 500, 550, 600, 650, 700, 750].map((weight) =>
        document.fonts.load(`${weight} 24px Satoshi`),
      ),
    )
  })
  const session = await context.newCDPSession(page)
  await session.send('DOM.enable')
  await session.send('CSS.enable')
  const { root } = await session.send('DOM.getDocument')
  for (const [selector, family] of [
    ['.hero-copy h1', 'Satoshi'],
    ['.hero-description', 'Satoshi'],
    ['.project-teaser h3', 'Satoshi'],
    ['.nav-number', 'Geist Mono'],
  ]) {
    const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector })
    const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId })
    expect(
      fonts.some(
        (font) => font.isCustomFont && font.familyName.includes(family) && font.glyphCount > 0,
      ),
      selector,
    ).toBe(true)
  }
  expect(fontRequests).toHaveLength(2)
  expect(fontRequests.every((url) => url.startsWith(`${new URL(page.url()).origin}/fonts/`))).toBe(
    true,
  )
})
