// Canvas colors are read only on setup and theme changes, never in the animation loop.
export function readThemePalette<T extends string>(names: readonly T[]): Record<T, string> {
  const styles = getComputedStyle(document.documentElement)
  return Object.fromEntries(
    names.map((name) => [name, styles.getPropertyValue(`--${name}`).trim()]),
  ) as Record<T, string>
}

export function observeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
