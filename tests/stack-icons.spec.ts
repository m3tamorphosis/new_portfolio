import { expect, test } from '@playwright/test'
const stackGroups = [
  { name: 'Languages', items: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'C#'] },
  {
    name: 'Frontend',
    items: [
      'React.js',
      'Next.js',
      'HTML5',
      'CSS3',
      'Tailwind CSS',
      'Motion',
      'Phaser 3 (Canvas/WebGL)',
    ],
  },
  {
    name: 'Backend',
    items: [
      'Node.js',
      'REST APIs',
      'API Integration',
      'Prisma ORM',
      'NextAuth.js',
      'Xendit Payment Integration',
    ],
  },
  { name: 'Databases', items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Supabase', 'Neon', 'Firebase'] },
  {
    name: 'AI / ML',
    items: [
      'RAG',
      'Embeddings',
      'OpenAI API',
      'Groq API',
      'LLM Integration',
      'PDF Text Extraction',
    ],
  },
  { name: 'AI Tools', items: ['GitHub Copilot', 'Claude AI', 'Codex', 'Gemini'] },
  {
    name: 'Tools',
    items: [
      'Git',
      'GitHub',
      'Vercel',
      'VS Code',
      'Figma',
      'Power BI',
      'Tableau',
      'Vite',
      'Playwright',
    ],
  },
]

const sizes = [
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [768, 1024],
  [1024, 768],
  [320, 568],
  [375, 667],
  [390, 844],
  [430, 932],
  [800, 360],
  [667, 375],
]
for (const [width, height] of sizes) {
  test(`all résumé groups and brand assets fit ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/#stack')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.stack-menu > button')).toHaveCount(7)
    if (width <= 900) {
      const buttons = page.locator('.stack-menu > button')
      const first = (await buttons.nth(0).boundingBox())!
      const second = (await buttons.nth(1).boundingBox())!
      expect(second.y, 'Mobile categories should form rows, not a vertical menu').toBeCloseTo(
        first.y,
        0,
      )
      expect(second.x).toBeGreaterThanOrEqual(first.x + first.width)
      await expect(buttons.first()).toHaveText('Languages')
    }
    for (const group of stackGroups) {
      await page
        .locator('.stack-menu')
        .getByRole('button', {
          name: new RegExp(
            '^(?:[0-9]+\\s*)?' + group.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$',
          ),
        })
        .click()
      await expect(page.locator('.tool-grid')).toHaveCSS('opacity', '1')
      await expect(page.locator('.tool-grid')).toHaveCSS('transform', 'none')
      await expect(page.locator('.tool-tile').last()).toHaveCSS('opacity', '1')
      await expect(page.locator('.tool-tile').last()).toHaveCSS('transform', 'none')
      await expect(page.locator('.tool-name')).toHaveText(group.items)
      const nameSize = await page
        .locator('.tool-name')
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      expect(nameSize).toBeGreaterThanOrEqual(16)
      await page
        .locator('.tool-mark img')
        .evaluateAll((images) =>
          Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
        )
      if (['Languages', 'Frontend', 'AI Tools', 'Tools'].includes(group.name)) {
        await page.screenshot({
          path: `test-results/stack-${width}x${height}-${group.name.replaceAll(' ', '-')}.png`,
        })
      }
      const issues = await page.evaluate(() => {
        const failures: string[] = []
        for (const el of document.querySelectorAll('main, .stack-board, .tool-tile')) {
          if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
            failures.push(
              `${el.className} ${el.clientWidth}x${el.clientHeight} overflows ${el.scrollWidth}x${el.scrollHeight}`,
            )
        }
        for (const tile of document.querySelectorAll('.tool-tile')) {
          const bounds = tile.getBoundingClientRect()
          for (const child of tile.querySelectorAll(
            '.tool-name, .tool-description, .technology-icon',
          )) {
            const rect = child.getBoundingClientRect()
            if (
              rect.top < bounds.top ||
              rect.bottom > bounds.bottom + 1 ||
              rect.left < bounds.left ||
              rect.right > bounds.right + 1
            )
              failures.push(`${tile.textContent}: clipped ${child.className}`)
          }
          const image = tile.querySelector<HTMLImageElement>('img.brand-logo')
          const icon = tile.querySelector('svg.lucide')
          if (!image && !icon) failures.push(`${tile.textContent}: missing icon`)
          if (image && (!image.naturalWidth || !image.src.startsWith(location.origin)))
            failures.push(`${tile.textContent}: invalid or external asset`)
          if (image && getComputedStyle(image).filter !== 'none')
            failures.push(`${tile.textContent}: brand colors filtered`)
        }
        return failures
      })
      expect(issues, group.name).toEqual([])
    }
  })
}
