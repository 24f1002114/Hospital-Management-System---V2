<template>
  <div>
    <Navbar />
    <div class="main-content container-fluid">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import api from '@/utils/api'

export default {
  components: { Navbar, Footer },
  setup() {
    const router = useRouter()
    const auth = useAuthStore()

    onMounted(async () => {
      // Validate token on app mount (page refresh)
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          // Try to access a protected endpoint to validate token
          const res = await api.get('validate-token')
          // Token is valid, auth store already has the data from localStorage
          if (!auth.isLoggedIn) {
            auth.restoreFromStorage()
          }
        } catch (error) {
          // Token is invalid or expired
          if (error.response?.status === 401) {
            auth.logout()
            router.push('/login')
          }
        }
      }
    })

    return {}
  }
}
</script>
