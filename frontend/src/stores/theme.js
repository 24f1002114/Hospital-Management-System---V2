import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light'
  }),

  actions: {
    initTheme() {
      const saved = localStorage.getItem('theme')

      if (saved) {
        this.theme = saved
      } else {
        this.theme = this.getSystemTheme()
      }

      this.applyTheme(this.theme)
    },

    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      this.commitTheme()
    },

    setTheme(theme) {
      this.theme = theme
      this.commitTheme()
    },

    commitTheme() {
      localStorage.setItem('theme', this.theme)
      this.applyTheme(this.theme)
    },

   applyTheme(theme) {
  const root = document.documentElement

  // CLEAN STATE
  root.classList.remove('light-theme', 'dark-theme')

  // APPLY GLOBAL THEME
  root.classList.add(`${theme}-theme`)

  // optional but powerful (forces native browser background sync)
  document.body.setAttribute('data-theme', theme)
},

    getSystemTheme() {
      if (typeof window === 'undefined') return 'light'

      return window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
  }
})