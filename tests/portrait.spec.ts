import { expect, test } from '@playwright/test'

test('missing and invalid profile images retain the designed placeholder without a broken image', async ({
  page,
}) => {
  for (const response of [
    { status: 404, body: '' },
    { status: 200, body: 'not an image' },
  ]) {
    await page.route('**/images/profile.jpg', (route) =>
      route.fulfill({ ...response, contentType: 'text/plain' }),
    )
    await page.goto('/?portrait=fallback#about')
    await expect(page.locator('.portrait')).toHaveAttribute('data-image-status', 'missing')
    await expect(
      page.getByRole('img', { name: 'Portrait placeholder for Carl John Haro' }),
    ).toBeVisible()
    await expect(page.locator('.portrait img')).toHaveCount(0)
    await page.unroute('**/images/profile.jpg')
  }
})

test('a locally supplied photograph replaces the placeholder without changing frame dimensions', async ({
  page,
}) => {
  let provideImage!: () => void
  const ready = new Promise<void>((resolve) => {
    provideImage = resolve
  })
  await page.route('**/images/profile.jpg', async (route) => {
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
