import type { IncomingMessage, ServerResponse } from 'node:http'

type Request = IncomingMessage & { body?: unknown }
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function createVisitorHandler(
  options: {
    config?: () => { url?: string; key?: string }
    fetcher?: typeof fetch
    countVisits?: () => boolean
  } = {},
) {
  return async function handler(req: Request, res: ServerResponse) {
    const reply = (status: number, body: object) => {
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(body))
    }
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return reply(405, { error: 'Use GET or POST.' })
    }
    if (req.headers['sec-fetch-site'] === 'cross-site')
      return reply(403, { error: 'Invalid origin.' })
    if (req.headers.origin) {
      try {
        if (new URL(req.headers.origin).host !== req.headers.host) {
          return reply(403, { error: 'Invalid origin.' })
        }
      } catch {
        return reply(403, { error: 'Invalid origin.' })
      }
    }

    let visitorId: string | null = null
    if (req.method === 'POST') {
      if (!req.headers['content-type']?.startsWith('application/json')) {
        return reply(415, { error: 'Send JSON.' })
      }
      try {
        let body = req.body
        if (body === undefined) {
          let raw = ''
          for await (const chunk of req) {
            raw += chunk.toString()
            if (Buffer.byteLength(raw) > 256) return reply(413, { error: 'Request too large.' })
          }
          body = JSON.parse(raw)
        } else if (typeof body === 'string') {
          if (Buffer.byteLength(body) > 256) return reply(413, { error: 'Request too large.' })
          body = JSON.parse(body)
        }
        if (
          !body ||
          typeof body !== 'object' ||
          !('visitorId' in body) ||
          typeof body.visitorId !== 'string' ||
          !visitorIdPattern.test(body.visitorId)
        ) {
          return reply(400, { error: 'Invalid visitor ID.' })
        }
        visitorId = body.visitorId.toLowerCase()
      } catch {
        return reply(400, { error: 'Invalid request.' })
      }
    }

    const { url, key } = options.config?.() ?? {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    if (!url || !key) return reply(503, { error: 'Visitor count unavailable.' })
    const countVisits =
      options.countVisits?.() ??
      (process.env.VERCEL_ENV
        ? process.env.VERCEL_ENV === 'production'
        : process.env.NODE_ENV === 'production')
    try {
      const endpoint = new URL('/rest/v1/rpc/portfolio_visitor_count', url)
      const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
      // New secret keys are not JWTs; only legacy service_role keys use Bearer auth.
      if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`
      const response = await (options.fetcher ?? fetch)(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_visitor_id: countVisits ? visitorId : null }),
        signal: AbortSignal.timeout(6000),
      })
      if (!response.ok) return reply(502, { error: 'Visitor count unavailable.' })
      const count: unknown = await response.json()
      if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
        return reply(502, { error: 'Visitor count unavailable.' })
      }
      return reply(200, { count })
    } catch {
      return reply(502, { error: 'Visitor count unavailable.' })
    }
  }
}

export default createVisitorHandler()
