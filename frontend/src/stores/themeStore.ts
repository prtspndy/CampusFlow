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

function applyTheme(resolved: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  root.classList.toggle('dark', resolved === 'dark')
}

function readSavedTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = readSavedTheme()
  const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme

  // index.html already applied this before paint; keep the DOM and store in sync.
  applyTheme(initialResolved)

  // Follow the OS while the preference is "system".
  if (typeof window !== 'undefined') {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => {
        if (get().theme !== 'system') return
        const resolved = event.matches ? 'dark' : 'light'
        applyTheme(resolved)
        set({ resolvedTheme: resolved })
      })
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,
    setTheme: (newTheme) => {
      localStorage.setItem(STORAGE_KEY, newTheme)
      const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
      applyTheme(resolved)
      set({ theme: newTheme, resolvedTheme: resolved })
    },
  }
})
