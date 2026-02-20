const STORAGE_KEY = 'arkanoid-theme'

export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    // ignore
  }
  return 'dark'
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
  } catch {
    // ignore
  }
}

export function applyTheme(): void {
  document.documentElement.dataset.theme = getTheme()
}
