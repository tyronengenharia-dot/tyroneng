'use client'

import { useTheme } from '@/components/theme/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800">
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
  )
}