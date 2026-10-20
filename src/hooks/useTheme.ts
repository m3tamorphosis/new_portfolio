import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'
const storageKey = 'portfolio-theme'
const validMode = (value: string | null | undefined): ThemeMode =>
  value === 'dark' ? 'dark' : 'light'

function applyTheme(mode: ThemeMode) {
  const theme = mode
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
    const storageChanged = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) {
        const next = validMode(event.newValue)
        applyTheme(next)
        setMode(next)
      }
    }
    window.addEventListener('storage', storageChanged)
    return () => {
      window.removeEventListener('storage', storageChanged)
    }
  }, [mode])

  const selectTheme = (next: ThemeMode) => {
    applyTheme(next)
    setMode(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      /* Theme selection still works when storage is unavailable. */
    }
  }
  return { mode, selectTheme }
}
