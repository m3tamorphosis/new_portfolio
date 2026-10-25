import { expect, test } from '@playwright/test'
import { createServer } from 'node:http'
import { createVisitorHandler } from '../api/visitors'

test('visitor endpoint validates requests, protects its credentials, and supports read-only totals', async () => {
  const calls: { headers: Headers; id: string | null }[] = []
  const ids = new Set<string>()
  let key = 'sb_secret_test_backend_only'
  let writable = true
  let fail = false
  const server = createServer(
    createVisitorHandler({
      config: () => ({ url: 'https://example.supabase.co', key }),
      countVisits: () => writable,
      fetcher: (async (url, init) => {
        expect(String(url)).toBe('https://example.supabase.co/rest/v1/rpc/portfolio_visitor_count')
        const { p_visitor_id: id } = JSON.parse(String(init?.body))
        calls.push({ headers: new Headers(init?.headers), id })
        if (fail) return new Response('private Supabase error', { status: 500 })
        if (id) ids.add(id)
        return Response.json(ids.size)
      }) as typeof fetch,
    }),
  )
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/visitors`
  const id = '24f93f91-9f06-4b17-a50d-a2c019c95860'
  const post = (visitorId: unknown, headers = {}) =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ visitorId }),
    })
  try {
    expect((await fetch(url, { method: 'DELETE' })).status).toBe(405)
    expect((await post('invalid')).status).toBe(400)
    expect((await post(id, { Origin: 'https://another-site.example' })).status).toBe(403)
    expect((await post('x'.repeat(500))).status).toBe(413)
    expect(calls).toHaveLength(0)
    expect(await (await fetch(url)).json()).toEqual({ count: 0 })
    const responses = await Promise.all([post(id), post(id), post(id)])
    for (const response of responses) expect(await response.json()).toEqual({ count: 1 })
    expect(calls.at(-1)?.headers.get('apikey')).toBe(key)
    expect(calls.at(-1)?.headers.has('Authorization')).toBe(false)
    writable = false
    expect(await (await post('c0a45640-2930-4642-bb41-7b21711d15c1')).json()).toEqual({ count: 1 })
    expect(calls.at(-1)?.id).toBeNull()
    key = 'legacy-service-role-jwt'
    await fetch(url)
    expect(calls.at(-1)?.headers.get('Authorization')).toBe(`Bearer ${key}`)
    fail = true
    const failed = await fetch(url)
    expect(failed.status).toBe(502)
    expect(await failed.text()).toBe('{"error":"Visitor count unavailable."}')
    key = ''
    expect((await fetch(url)).status).toBe(503)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

test('a returning browser keeps one visitor ID across reloads, tabs, and section changes', async ({
  page,
  context,
}) => {
  const ids = new Set<string>()
  let requests = 0
  await context.route('**/api/visitors', async (route) => {
    requests++
    const id = route.request().postDataJSON().visitorId
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    ids.add(id)
    await route.fulfill({ json: { count: ids.size } })
  })
  await page.goto('/')
  await expect(page.locator('.visitor-count')).toHaveText('1 visitor')
  const saved = await page.evaluate(() => localStorage.getItem('portfolio-visitor-id'))
  await page.reload()
  await expect(page.locator('.visitor-count')).toHaveText('1 visitor')
  expect(await page.evaluate(() => localStorage.getItem('portfolio-visitor-id'))).toBe(saved)
  const requestsBeforeNavigation = requests
  await page.getByRole('button', { name: /About Me/ }).click()
  await expect(page.locator('.about-view')).toBeVisible()
  expect(requests).toBe(requestsBeforeNavigation)
  const tab = await context.newPage()
  await tab.goto('/')
  await expect(tab.locator('.visitor-count')).toHaveText('1 visitor')
  expect(ids.size).toBe(1)
  await tab.close()
  await page.evaluate(() => localStorage.removeItem('portfolio-visitor-id'))
  await page.reload()
  await expect(page.locator('.visitor-count')).toHaveText('2 visitors')
})

test('blocked browser storage reads the total without registering repeated visitors', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Storage blocked')
      },
    })
  })
  await page.route('**/api/visitors', async (route) => {
    expect(route.request().method()).toBe('GET')
    await route.fulfill({ json: { count: 1245 } })
  })
  await page.goto('/')
  await expect(page.locator('.visitor-count')).toHaveText('1,245 visitors')
  await page.reload()
  await expect(page.locator('.visitor-count')).toHaveText('1,245 visitors')
})

test('an unavailable counter never invents a visitor total', async ({ page }) => {
  await page.route('**/api/visitors', (route) =>
    route.fulfill({ status: 503, json: { error: 'Unavailable' } }),
  )
  await page.goto('/')
  await expect(page.locator('.visitor-count')).toHaveText('— visitors')
  await expect(page.locator('.visitor-count')).toHaveAttribute(
    'aria-label',
    'Visitor count temporarily unavailable',
  )
})

for (const width of [320, 390, 768, 1440]) {
  test(`visitor count fits the footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/api/visitors', (route) => route.fulfill({ json: { count: 12345 } }))
    await page.goto('/')
    const counter = page.locator('.visitor-count')
    await expect(counter).toHaveText('12,345 visitors')
    await counter.scrollIntoViewIfNeeded()
    await expect(counter).toBeInViewport()
    const bounds = (await counter.boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await page.screenshot({ path: `test-results/visitor-footer-${width}.png` })
  })
}
