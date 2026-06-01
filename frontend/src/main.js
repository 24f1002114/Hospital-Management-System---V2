import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useAuthStore } from '@/stores/auth'

import { useThemeStore } from '@/stores/theme'



const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// ✅ initialize stores AFTER pinia is active
const theme = useThemeStore(pinia)
theme.initTheme()

const auth = useAuthStore()
auth.restoreFromStorage()
app.mount('#app')
