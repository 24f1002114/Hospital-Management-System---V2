<template>
  <div class="register-container">
    <div class="register-form-wrapper">
      <h2 class="text-center mb-4">Registration Form</h2>
      <form @submit.prevent="addUser">
        <div class="row">

          <div class="col-md-6">
            <div class="mb-3">
              <label for="email">Email:<span class="required">*</span></label>
              <input type="email" class="form-control" id="email" v-model="formData.email" required>
            </div>
            <div class="mb-3">
              <label for="username">Username:<span class="required">*</span></label>
              <input type="text" class="form-control" id="username" v-model="formData.username" required>
            </div>
            <div class="mb-3">
              <label for="password">Password:<span class="required">*</span></label>
              <input type="password" class="form-control" id="password" v-model="formData.password" required>
            </div>
            <div class="mb-3">
              <label for="name">Full Name:<span class="required">*</span></label>
              <input type="text" class="form-control" id="name" v-model="formData.name" required>
            </div>
            <div class="mb-3">
              <label for="age">Age:<span class="required">*</span></label>
              <input type="number" class="form-control" id="age" v-model="formData.age" required>
            </div>
          </div>

          <div class="col-md-6">
            <div class="mb-3">
              <label for="gender">Gender:<span class="required">*</span></label>
              <select class="form-control" id="gender" v-model="formData.gender" required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="contact_number">Contact:<span class="required">*</span></label>
              <input type="text" class="form-control" id="contact_number" v-model="formData.contact_number" required>
            </div>
            <div class="mb-3">
              <label for="address">Address:<span class="required">*</span></label>
              <input type="text" class="form-control" id="address" v-model="formData.address" required>
            </div>
            <div class="mb-3">
              <label for="medical_history">Medical History:<span class="required">*</span></label>
              <textarea class="form-control" rows="4" id="medical_history" v-model="formData.medical_history" required></textarea>
            </div>
          </div>

          <div class="text-center mt-3">
            <button type="submit" class="btn btn-primary px-4" :disabled="saving">
              {{ saving ? 'Registering...' : 'Register' }}
            </button>
          </div>

        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg);
}

.register-form-wrapper {
  background: var(--card);
  padding: 40px;
  border-radius: 12px;
  border: 1px solid var(--border);
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.register-form-wrapper h2 {
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

@media (max-width: 768px) {
  .register-form-wrapper {
    padding: 25px;
  }
}
</style>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const saving = ref(false)
    const formData = ref({
      email: '',
      username: '',
      password: '',
      name: '',
      age: '',
      gender: '',
      contact_number: '',
      address: '',
      medical_history: ''
    })

    async function addUser() {
      if (saving.value) return
      saving.value = true
      try {
        const res = await api.post('register', formData.value)
        if (res.data.success === true) {
          alert('Registration successful!')
          router.push('/login')
        } else {
          alert(res.data.message)
        }
      } catch (err) {
        alert('An error occurred during registration.')
      } finally {
        saving.value = false
      }
    }

    return { formData, saving, addUser }
  }
}
</script>
