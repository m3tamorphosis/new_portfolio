import { expect, test } from '@playwright/test'

test('missing and invalid profile images retain the designed placeholder without a broken image', async ({
  page,
}) => {
  for (const response of [
    { status: 404, body: '' },
    { status: 200, body: 'not an image' },
  ]) {
    await page.route('**/images/profile.webp', (route) =>
      route.fulfill({ ...response, contentType: 'text/plain' }),
    )
    await page.goto('/?portrait=fallback#about')
    await expect(page.locator('.portrait')).toHaveAttribute('data-image-status', 'missing')
    await expect(
      page.getByRole('img', { name: 'Portrait placeholder for Carl John Haro' }),
    ).toBeVisible()
    await expect(page.locator('.portrait img')).toHaveCount(0)
    await page.unroute('**/images/profile.webp')
  }
})

test('a slow portrait loads without placeholder text or changing frame dimensions', async ({
  page,
}) => {
  let provideImage!: () => void
  const ready = new Promise<void>((resolve) => {
    provideImage = resolve
  })
  await page.route('**/images/profile.webp', async (route) => {
    await ready
    // A one-pixel GIF is a decoding fixture, never a portfolio asset or person image.
    await route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    })
  })
  await page.goto('/#about', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.about-current')).toHaveCSS('opacity', '1')
  await expect(page.locator('.portrait')).toHaveAttribute('data-image-status', 'loading')
  await expect(page.locator('.portrait')).toHaveAttribute('aria-busy', 'true')
  await expect(page.locator('.portrait-placeholder')).toHaveCount(0)
  await expect(page.locator('.portrait img')).toBeHidden()
  const before = await page.locator('.portrait').boundingBox()
  provideImage()
  await expect(page.locator('.portrait')).toHaveAttribute('data-image-status', 'ready')
  const photo = page.getByRole('img', { name: 'Portrait of Carl John Haro', exact: true })
  await expect(photo).toBeVisible()
  await expect(photo).toHaveCSS('object-fit', 'cover')
  await expect(page.locator('.portrait-placeholder')).toHaveCount(0)
  expect(await photo.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(
    0,
  )
  expect(await page.locator('.portrait').boundingBox()).toEqual(before)
})

test('the optimized portrait preloads from Home and is reused in About', async ({ page }) => {
  const portraitRequests: string[] = []
  page.on('request', (request) => {
    if (/\/images\/profile\.(jpg|webp)$/.test(request.url())) portraitRequests.push(request.url())
  })
  await page.goto('/')
  await expect.poll(() => portraitRequests.length).toBe(1)
  expect(portraitRequests[0]).toMatch(/profile\.webp$/)
  await page.getByRole('button', { name: /About Me/ }).click()
  await expect(page.locator('.portrait')).toHaveAttribute('data-image-status', 'ready')
  await expect(page.locator('.portrait-placeholder')).toHaveCount(0)
  expect(
    await page.locator('.portrait img').evaluate((el) => (el as HTMLImageElement).naturalWidth),
  ).toBe(960)
  expect(portraitRequests).toHaveLength(1)
})
