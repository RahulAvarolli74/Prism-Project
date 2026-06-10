import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative flex h-9 w-16 cursor-pointer items-center rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.04)] p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-sm transition-transform duration-300 ease-in-out"
        style={{
          transform: theme === 'dark' ? 'translateX(28px)' : 'translateX(2px)',
        }}
      >
        {theme === 'dark' ? (
          <Moon size={13} className="text-[var(--critical)]" />
        ) : (
          <Sun size={13} className="text-[var(--warning)]" />
        )}
      </span>
    </button>
  )
}
