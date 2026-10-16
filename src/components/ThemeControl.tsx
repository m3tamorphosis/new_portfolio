import { useId } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { ThemeMode } from '../hooks/useTheme'

const modes = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export default function ThemeControl({
  mode,
  onSelect,
}: {
  mode: ThemeMode
  onSelect: (mode: ThemeMode) => void
}) {
  const id = useId()
  return (
    <fieldset className="theme-options">
      <legend className="sr-only">Color theme</legend>
      {modes.map(({ value, label, icon: Icon }) => (
        <label
          key={value}
          title={label + ' theme' + (value === 'system' ? ' ? follows your device' : '')}
        >
          <input
            type="radio"
            name={id}
            value={value}
            checked={mode === value}
            aria-label={label}
            onChange={() => onSelect(value)}
          />
          <Icon size={14} aria-hidden="true" />
        </label>
      ))}
    </fieldset>
  )
}
