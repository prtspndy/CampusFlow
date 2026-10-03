import { create } from 'zustand'

export type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeState {
  theme: ThemePreference
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemePreference) => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const STORAGE_KEY = 'campusflow_theme'

export const useThemeStore = create<ThemeState>((set) => {
  const saved = (typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY)
    : null) as ThemePreference | null

  const initialTheme: ThemePreference = saved || 'system'
  const initialResolved =
    initialTheme === 'system' ? getSystemTheme() : initialTheme

  // Set html attribute immediately
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initialResolved)
    if (initialResolved === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,
    setTheme: (newTheme) => {
      localStorage.setItem(STORAGE_KEY, newTheme)
      const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
      document.documentElement.setAttribute('data-theme', resolved)
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      set({ theme: newTheme, resolvedTheme: resolved })
    },
  }
})
