import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Iloilo live clock', () => {
  test.use({ timezoneId: 'America/New_York' })
  test('uses Philippine time, ticks across midnight, and resyncs after navigation', async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-10-11T15:59:58Z') })
    await page.clock.pauseAt(new Date('2026-10-11T15:59:59Z'))
    await page.goto('/#contact')
    const clock = page.locator('.contact-location time')
    await expect(clock).toHaveText('11:59:59 PM')
    await page.clock.runFor(1000)
    await expect(clock).toHaveText('12:00:00 AM')
    await page.clock.runFor(2000)
    await expect(clock).toHaveText('12:00:02 AM')
    await page.evaluate(() => {
      location.hash = 'about'
    })
    await page.clock.runFor(1000)
    await expect(clock).toHaveCount(0)
    await page.evaluate(() => {
      location.hash = 'contact'
    })
    await page.clock.runFor(1000)
    await expect(clock).toHaveCount(1)
    await expect(clock).toHaveText('12:00:04 AM')
  })
})

for (const [width, height] of [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
]) {
  test(`contact links and spacing at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#contact')
    await expect(page.locator('.view-container')).toHaveCSS('opacity', '1')
    await page.evaluate(() => document.fonts.ready)
    await expect(
      page.getByRole('region', { name: 'CURRENTLY INTERESTED IN' }).getByRole('listitem'),
    ).toHaveText(['AI-powered applications', 'Creative development', 'Interactive web experiences'])
    const overflow = await page
      .locator('main, .contact-layout, .contact-card')
      .evaluateAll((elements) =>
        elements.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.className),
      )
    expect(overflow).toEqual([])
    for (const [name, href] of [
      ['LinkedIn', 'https://www.linkedin.com/in/carl-john-haro-923a9a3bb'],
      ['Viber', 'viber://chat?number=%2B639610834292'],
      ['Telegram', 'https://t.me/+639610834292'],
      ['WhatsApp', 'https://wa.me/639610834292'],
    ]) {
      const link = page.locator('main').getByRole('link', { name, exact: true })
      await expect(link).toHaveAttribute('href', href)
      await expect
        .poll(() =>
          link
            .locator('img')
            .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        )
        .toBe(true)
      if (width <= 900) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    if (width > 900) {
      await expect(page.locator('.connect-links a').last()).toHaveText('0961 083 4292')
      const geometry = await page
        .locator('.sidebar')
        .evaluate((el) => ({ height: el.clientHeight, scroll: el.scrollHeight }))
      expect(geometry.scroll).toBeLessThanOrEqual(geometry.height + 1)
      const card = (await page.locator('.contact-card').boundingBox())!
      const footer = (await page.locator('footer').boundingBox())!
      expect(card.y + card.height).toBeLessThanOrEqual(footer.y)
      const interests = (await page.locator('.contact-interests').boundingBox())!
      expect(interests.y + interests.height).toBeLessThanOrEqual(footer.y)
    }
    await page.screenshot({ path: `test-results/contact-links-${width}.png`, fullPage: true })
  })
}

for (const width of [390, 1440]) {
  test(`contact intent and clipboard actions work at ${width}`, async ({ page, context }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/#contact')
    for (const [label, subject] of [
      ['A project idea', 'Project Inquiry'],
      ['An opportunity', 'Career Opportunity'],
      ['A collaboration', 'Collaboration Inquiry'],
      ['Just saying hello', 'Hello!'],
    ]) {
      const button = page.getByRole('button', { name: label, exact: true })
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('.topic-options [aria-pressed="true"]')).toHaveCount(1)
      const href = `mailto:carljohnharo02@gmail.com?subject=${encodeURIComponent(subject)}`
      await expect(page.locator('.contact-email')).toHaveAttribute('href', href)
      await expect(page.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute(
        'href',
        href,
      )
    }
    await expect(
      page.locator('.contact-copy').getByRole('link', { name: 'GitHub' }),
    ).toHaveAttribute('href', 'https://github.com/m3tamorphosis')
    const download = page.waitForEvent('download')
    await page.locator('.contact-copy').getByRole('link', { name: 'Résumé' }).click()
    expect((await download).suggestedFilename()).toBe('Carl-John-Haro-Resume.pdf')
    await page.getByRole('button', { name: 'Copy email address' }).click()
    await expect(page.locator('.contact-small')).toHaveText('Email address copied. Talk soon.')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'carljohnharo02@gmail.com',
    )
    await page.evaluate(() => {
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: () => Promise.reject(new Error('Clipboard blocked')),
      })
    })
    await page.getByRole('button', { name: 'Copy email address' }).click()
    await expect(page.locator('.contact-small')).toContainText('copy it manually')
    const audit = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(audit.violations).toEqual([])
    expect(errors).toEqual([])
  })
}
