import { useEffect, useState } from 'react'

const storageKey = 'portfolio-visitor-id'
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getVisitorId() {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored && visitorIdPattern.test(stored)) return stored
    const id = crypto.randomUUID()
    localStorage.setItem(storageKey, id)
    return id
  } catch {
    // Without persistent storage, read the total instead of counting every reload.
    return null
  }
}

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)
    const visitorId = getVisitorId()
    async function load() {
      try {
        const response = await fetch('/api/visitors', {
          method: visitorId ? 'POST' : 'GET',
          ...(visitorId && {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorId }),
          }),
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Visitor count unavailable')
        const result = await response.json()
        if (!Number.isSafeInteger(result.count) || result.count < 0)
          throw new Error('Invalid count')
        if (active) setCount(result.count)
      } catch {
        if (active) setFailed(true)
      } finally {
        window.clearTimeout(timeout)
      }
    }
    void load()
    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <span
      className="visitor-count"
      aria-label={
        count === null
          ? failed
            ? 'Visitor count temporarily unavailable'
            : 'Loading visitor count'
          : `${count.toLocaleString('en-US')} unique browser visitors`
      }
      title={
        count === null && failed
          ? 'Visitor count temporarily unavailable'
          : 'Unique browsers since this counter launched'
      }
    >
      <span className="visitor-count-number">
        {count === null ? '—' : count.toLocaleString('en-US')}
      </span>{' '}
      {count === 1 ? 'visitor' : 'visitors'}
    </span>
  )
}
