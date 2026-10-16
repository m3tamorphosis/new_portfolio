import { useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
const storageKey = 'portfolio-theme'
const schemeQuery = '(prefers-color-scheme: dark)'
const validMode = (value: string | null | undefined): ThemeMode =>
  value === 'light' || value === 'dark' ? value : 'system'

function applyTheme(mode: ThemeMode) {
  const theme = mode === 'system' ? (matchMedia(schemeQuery).matches ? 'dark' : 'light') : mode
  const root = document.documentElement
  root.dataset.themeMode = mode
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#171917' : '#f5f5f0')
}

export default function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() =>
    validMode(document.documentElement.dataset.themeMode),
  )
  useEffect(() => {
    applyTheme(mode)
    const media = matchMedia(schemeQuery)
    const systemChanged = () => {
      if (mode === 'system') applyTheme(mode)
    }
    const storageChanged = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        const next = validMode(event.newValue)
        applyTheme(next)
        setMode(next)
      }
    }
    if (mode === 'system') media.addEventListener('change', systemChanged)
    window.addEventListener('storage', storageChanged)
    return () => {
      if (mode === 'system') media.removeEventListener('change', systemChanged)
      window.removeEventListener('storage', storageChanged)
    }
  }, [mode])

  const selectTheme = (next: ThemeMode) => {
    applyTheme(next)
    setMode(next)
    try {
      if (next === 'system') localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, next)
    } catch {
      /* Theme selection still works when storage is unavailable. */
    }
  }
  return { mode, selectTheme }
}
