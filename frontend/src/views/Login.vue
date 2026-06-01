<template>
  <div class="login-container">
    <div class="login-form-wrapper">
      <h2 class="text-center mb-4">Login Form</h2>
      <form @submit.prevent="loginUser">
        <div class="mb-3">
          <label for="email">Email:<span class="required">*</span></label>
          <input type="text" class="form-control" id="email" v-model="formData.email" required>
        </div>
        <div class="mb-3">
          <label for="password">Password:<span class="required">*</span></label>
          <input type="password" class="form-control" id="password" v-model="formData.password" required>
        </div>
        <div class="text-center mt-5">
          <button type="submit" class="btn btn-primary px-4" :disabled="loading">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const auth = useAuthStore()
    const loading = ref(false)
    const formData = ref({ email: '', password: '' })

    async function loginUser() {
      loading.value = true
      try {
        const res = await api.post('login', formData.value)
        if (res.data.success) {
          auth.login(res.data)
          if (res.data.roles.includes('admin')) router.push('/admin')
          else if (res.data.roles.includes('doctor')) router.push('/doctor')
          else if (res.data.roles.includes('patient')) router.push('/patient')
          else alert('Unknown role!')
        }
      } catch (err) {
        const status = err.response?.status
        const message = err.response?.data?.message

        if (status === 400 && message === 'Email and password are required!') {
          alert('Please enter both email and password.')
        } else if (status === 404) {
          alert('No account found with this email.')
        } else if (status === 400) {
          alert('Incorrect password. Please try again.')
        } else {
          alert('Something went wrong. Please try again.')
        }
      } finally {
        loading.value = false
      }
    }

    return { formData, loading, loginUser }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg);
}

.login-form-wrapper {
  background: var(--card);
  padding: 40px;
  border-radius: 12px;
  border: 1px solid var(--border);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-form-wrapper h2 {
  color: var(--text);
  margin-bottom: 30px;
  font-weight: 600;
}

.mb-3 label {
  color: var(--text);
  font-weight: 500;
  margin-bottom: 8px;
}

.required {
  color: #dc3545;
}

@media (max-width: 576px) {
  .login-form-wrapper {
    padding: 25px;
  }
}
</style>
