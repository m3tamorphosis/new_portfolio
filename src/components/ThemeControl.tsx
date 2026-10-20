import type { ThemeMode } from '../hooks/useTheme'

export default function ThemeControl({
  mode,
  onSelect,
}: {
  mode: ThemeMode
  onSelect: (mode: ThemeMode) => void
}) {
  return (
    <button
      type="button"
      className="theme-options"
      role="switch"
      aria-label="Dark theme"
      aria-checked={mode === 'dark'}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} theme`}
      onClick={() => onSelect(mode === 'dark' ? 'light' : 'dark')}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-thumb" />
        <span className="theme-switch-light-label">Light</span>
        <span className="theme-switch-dark-label">Dark</span>
      </span>
    </button>
  )
}
