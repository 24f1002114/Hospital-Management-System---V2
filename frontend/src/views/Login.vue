<template>
  <div class="row justify-content-center border d-flex align-items-center wall" style="height: 700px;">
    <div class="col border p-3 formbg" style="max-width: 400px; height: 500px;">
      <h2 class="text-center mb-4 mt-4">Login Form</h2>
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
