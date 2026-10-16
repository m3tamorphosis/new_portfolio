import { useEffect, useRef } from 'react'

const targets = '.project-teaser, .hero-actions .button, .header-contact'
const properties = [
  '--pointer-x',
  '--pointer-y',
  '--pointer-dx',
  '--pointer-dy',
  '--tilt-x',
  '--tilt-y',
]

/** Decorative feedback stays on the element; pointer movement never rerenders the app. */
export default function usePointerFeedback() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const preference = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
    )
    let active: HTMLElement | null = null
    let frame = 0

    function reset() {
      cancelAnimationFrame(frame)
      frame = 0
      if (!active) return
      delete active.dataset.pointerActive
      for (const property of properties) active.style.removeProperty(property)
      active = null
    }

    function move(event: PointerEvent) {
      if (!preference.matches || event.pointerType !== 'mouse') {
        reset()
        return
      }
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>(targets) : null
      if (!target || !root!.contains(target)) {
        reset()
        return
      }
      if (active !== target) reset()
      active = target
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        frame = 0
        if (!target.isConnected) return reset()
        const bounds = target.getBoundingClientRect()
        const x = event.clientX - bounds.left
        const y = event.clientY - bounds.top
        const dx = Math.max(-1, Math.min(1, (x / bounds.width) * 2 - 1))
        const dy = Math.max(-1, Math.min(1, (y / bounds.height) * 2 - 1))
        target.style.setProperty('--pointer-x', `${x}px`)
        target.style.setProperty('--pointer-y', `${y}px`)
        target.style.setProperty('--pointer-dx', `${dx * 3}px`)
        target.style.setProperty('--pointer-dy', `${dy * 3}px`)
        target.style.setProperty('--tilt-x', `${dx * 5}deg`)
        target.style.setProperty('--tilt-y', `${-dy * 5}deg`)
        target.dataset.pointerActive = 'true'
      })
    }

    root.addEventListener('pointermove', move, { passive: true })
    root.addEventListener('pointerleave', reset)
    root.addEventListener('click', reset)
    root.addEventListener('scroll', reset, true)
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', reset)
    preference.addEventListener('change', reset)
    return () => {
      reset()
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', reset)
      root.removeEventListener('click', reset)
      root.removeEventListener('scroll', reset, true)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', reset)
      preference.removeEventListener('change', reset)
    }
  }, [])

  return ref
}
