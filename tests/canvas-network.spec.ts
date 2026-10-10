import { expect, test } from '@playwright/test'

for (const scenario of [
  { name: 'mouse', width: 1440, height: 900, touch: false, reduced: false },
  { name: 'touch', width: 393, height: 852, touch: true, reduced: false },
  { name: 'reduced motion', width: 1440, height: 900, touch: false, reduced: true },
]) {
  test(`globe follows drag direction with ${scenario.name}`, async ({ page, context }) => {
    await page.setViewportSize({ width: scenario.width, height: scenario.height })
    await page.emulateMedia({ reducedMotion: scenario.reduced ? 'reduce' : 'no-preference' })
    const touch = scenario.touch ? await context.newCDPSession(page) : null
    if (touch)
      await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    const globe = page.locator('.playground')
    const canvas = globe.locator('canvas')
    await canvas.scrollIntoViewIfNeeded()
    await page.clock.install()
    await page.clock.runFor(300)
    const bounds = (await canvas.boundingBox())!
    const x = bounds.x + bounds.width / 2
    const y = bounds.y + bounds.height / 2
    if (touch) {
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 1 }],
      })
    } else {
      await page.mouse.move(x, y)
      await page.mouse.down()
    }
    await page.clock.runFor(300)
    await expect(globe).toHaveClass(/is-dragging/)
    const positions = () =>
      globe
        .locator('.globe-node')
        .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).style.transform))
    const pixels = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
    const heldPositions = await positions()
    const heldPixels = await pixels()
    await page.clock.runFor(1000)
    // Holding the globe stops automatic rotation, but the signals keep traveling.
    expect(await positions()).toEqual(heldPositions)
    expect((await pixels()) === heldPixels).toBe(scenario.reduced)

    const frontIndex = await globe.locator('.globe-node').evaluateAll((nodes) => {
      return nodes.reduce(
        (front, node, index) =>
          Number((node as HTMLElement).style.zIndex) >
          Number((nodes[front] as HTMLElement).style.zIndex)
            ? index
            : front,
        0,
      )
    })
    const node = globe.locator('.globe-node').nth(frontIndex)
    const point = () =>
      node.evaluate((el) => {
        const transform = new DOMMatrixReadOnly((el as HTMLElement).style.transform)
        return { x: transform.m41, y: transform.m42 }
      })
    const start = await point()
    const move = async (nextX: number, nextY: number) => {
      if (touch)
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: nextX, y: nextY, id: 1 }],
        })
      else await page.mouse.move(nextX, nextY, { steps: 4 })
      await page.clock.runFor(200)
    }
    await move(x - 24, y)
    expect((await point()).x).toBeLessThan(start.x - 2)
    await move(x + 24, y)
    expect((await point()).x).toBeGreaterThan(start.x + 2)
    if (!touch) {
      const beforeDown = await point()
      await move(x + 24, y + 18)
      expect((await point()).y).toBeGreaterThan(beforeDown.y + 2)
    }
    if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    else await page.mouse.up()
    await expect(globe).not.toHaveClass(/is-dragging/)
  })
}

const expectedStack = [
  'JavaScript',
  'TypeScript',
  'Python',
  'SQL',
  'C#',
  'React.js',
  'Next.js',
  'HTML5',
  'CSS3',
  'Tailwind CSS',
  'Motion',
  'Phaser 3 (Canvas/WebGL)',
  'Node.js',
  'REST APIs',
  'API Integration',
  'Prisma ORM',
  'NextAuth.js',
  'Xendit Payment Integration',
  'PostgreSQL',
  'MySQL',
  'SQL Server',
  'Supabase',
  'Neon',
  'RAG',
  'Embeddings',
  'OpenAI API',
  'Groq API',
  'Machine Learning',
  'PDF Text Extraction',
  'GitHub Copilot',
  'Claude AI',
  'Codex',
  'Gemini',
  'Git',
  'GitHub',
  'Vercel',
  'VS Code',
  'Figma',
  'Power BI',
  'Tableau',
  'Vite',
  'Playwright',
]

for (const [width, height] of [
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [768, 1024],
  [320, 568],
  [375, 667],
  [390, 844],
  [393, 852],
  [430, 932],
]) {
  test(`full-stack globe and icons fit ${width}x${height}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    const canvas = page.locator('.playground canvas')
    await canvas.scrollIntoViewIfNeeded()
    await page.evaluate(() => document.fonts.ready)
    if (width <= 900) {
      const availability = page.locator('.hero-note .availability-compact')
      await expect(availability).toHaveText('Open to roles & freelance projects.')
      const line = await availability.evaluate((el) => {
        const range = document.createRange()
        range.selectNodeContents(el)
        return {
          lines: range.getClientRects().length,
          right: range.getBoundingClientRect().right,
          containerRight: el.parentElement!.getBoundingClientRect().right,
        }
      })
      expect(line.lines).toBe(1)
      expect(line.right).toBeLessThanOrEqual(line.containerRight)
      if (height > width) {
        const globeBounds = (await canvas.boundingBox())!
        expect(globeBounds.width).toBeCloseTo(width, 0)
      }
    }
    const nodes = page.locator('.globe-node')
    expect(
      await nodes.evaluateAll((elements) =>
        elements.map((el) => el.getAttribute('data-technology')),
      ),
    ).toEqual(expectedStack)
    await expect(nodes.locator('.technology-icon')).toHaveCount(42)
    await expect(nodes.locator('img.brand-logo')).toHaveCount(35)
    await nodes
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
      )
    await expect(page.locator('.canvas-categories')).toHaveCount(0)
    await expect(page.locator('.playground button')).toHaveCount(0)
    await page
      .locator('.playground')
      .screenshot({ path: `test-results/full-stack-globe-${width}.png` })
    await page.screenshot({
      path: `test-results/full-stack-home-${width}.png`,
      fullPage: width <= 900,
    })
    // Full-page capture can scroll the globe out of view; its animation pauses there.
    await canvas.scrollIntoViewIfNeeded()
    await expect(canvas).toBeInViewport()
    await page.clock.install()
    const pixels = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
    await page.clock.runFor(100)
    const initial = await pixels()
    await page.clock.runFor(1400)
    expect((await pixels()) !== initial).toBe(true)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    // Motion's installed hook reads the preference on mount.
    await page.reload()
    await canvas.scrollIntoViewIfNeeded()
    await page.evaluate(() => document.fonts.ready)
    await nodes
      .locator('img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
      )
    await page.mouse.move(0, 0)
    await page.clock.runFor(300)
    const paused = await pixels()
    await page.clock.runFor(1000)
    expect((await pixels()) === paused).toBe(true)
    const visible = await nodes.evaluateAll(
      (elements) => elements.filter((el) => Number(getComputedStyle(el).opacity) > 0.4).length,
    )
    expect(visible).toBeGreaterThanOrEqual(4)
    const issues = await page.locator('.playground').evaluate((frame) => {
      const bounds = frame.getBoundingClientRect()
      const failures: string[] = []
      const icons: DOMRect[] = []
      const labels: DOMRect[] = []
      for (const node of frame.querySelectorAll<HTMLElement>('.globe-node')) {
        if (Number(getComputedStyle(node).opacity) < 0.4) continue
        const icon = node.querySelector('.technology-icon')!.getBoundingClientRect()
        icons.push(icon)
        const label = node.querySelector<HTMLElement>('.globe-node-label')!
        if (Number(getComputedStyle(label).opacity) < 0.5)
          failures.push(node.dataset.technology + ' missing name')
        labels.push(label.getBoundingClientRect())
        for (const child of node.querySelectorAll<HTMLElement>(
          '.technology-icon, .globe-node-label',
        )) {
          if (Number(getComputedStyle(child).opacity) < 0.5) continue
          const r = child.getBoundingClientRect()
          if (
            r.left < bounds.left ||
            r.right > bounds.right ||
            r.top < bounds.top ||
            r.bottom > bounds.bottom
          )
            failures.push(node.dataset.technology + ' clipped')
        }
      }
      icons.forEach((a, i) =>
        icons.slice(i + 1).forEach((b) => {
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
            failures.push('overlapping icons')
        }),
      )
      labels.forEach((a, i) => {
        for (const b of [...icons, ...labels.slice(i + 1)])
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
            failures.push('overlapping label')
      })
      return failures
    })
    expect(issues).toEqual([])
    await expect(canvas).toHaveAccessibleName(/all 42 stack entries/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    expect(errors).toEqual([])
  })
}

test('reduced motion freezes the globe while node hover still responds', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const canvas = page.locator('.playground canvas')
  await expect(canvas).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.clock.install()
  await page.clock.runFor(100)
  const pixels = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  const before = await pixels()
  await page.clock.runFor(2000)
  expect((await pixels()) === before).toBe(true)
  const point = await page.locator('.globe-node').evaluateAll((nodes) => {
    const node = nodes.find((el) => Number(getComputedStyle(el).opacity) > 0.8)!
    const icon = node.querySelector('.technology-icon')!.getBoundingClientRect()
    return { x: icon.x + icon.width / 2, y: icon.y + icon.height / 2 }
  })
  await page.mouse.move(point.x, point.y)
  await page.clock.runFor(100)
  expect((await pixels()) !== before).toBe(true)
  await page.mouse.move(0, 0)
  await page.clock.runFor(100)
  expect((await pixels()) === before).toBe(true)
  const positions = () =>
    page
      .locator('.globe-node')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).style.transform))
  const originalPositions = await positions()
  const bounds = (await canvas.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.55, {
    steps: 8,
  })
  await page.clock.runFor(100)
  await expect(page.locator('.playground')).toHaveClass(/is-dragging/)
  await page.mouse.up()
  await expect(page.locator('.playground')).not.toHaveClass(/is-dragging/)
  await page.mouse.move(0, 0)
  await page.clock.runFor(100)
  expect(await positions()).not.toEqual(originalPositions)
  expect(await pixels()).not.toEqual(before)
  const rotated = await pixels()
  await page.clock.runFor(1000)
  expect(await pixels()).toEqual(rotated)
})
