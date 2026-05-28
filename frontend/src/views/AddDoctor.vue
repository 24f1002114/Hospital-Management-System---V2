<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 750px;">
    <div class="row justify-content-center">
      <div class="col-12 col-md-10 col-lg-8 mt-3 mb-3">
        <div class="card shadow p-2 p-md-3 bg-white">
          <div class="card-body">
            <h3 class="text-center mb-3 mt-2">Add Doctor Profile</h3>

            <!-- Loading -->
            <div v-if="loading" class="loading-container">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading...</p>
            </div>

            <div v-else>
              <form @submit.prevent="createDoctor">
                <div class="row g-3">

                  <!-- Left Column -->
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="email">Email <span class="required">*</span></label>
                      <input type="email" class="form-control" id="email" v-model="doctor.email" required />
                    </div>
                    <div class="mb-3">
                      <label for="username">Username <span class="required">*</span></label>
                      <input type="text" class="form-control" id="username" v-model="doctor.username" required />
                    </div>
                    <div class="mb-3">
                      <label for="password">Password <span class="required">*</span></label>
                      <input type="password" class="form-control" id="password" v-model="doctor.password" required />
                    </div>
                    <div class="mb-3">
                      <label for="name">Full Name <span class="required">*</span></label>
                      <input type="text" class="form-control" id="name" v-model="doctor.name" required />
                    </div>
                    <div class="mb-3">
                      <label for="age">Age <span class="required">*</span></label>
                      <input type="number" class="form-control" id="age" v-model="doctor.age" required />
                    </div>
                    <div class="mb-3">
                      <label for="gender">Gender <span class="required">*</span></label>
                      <select class="form-select" id="gender" v-model="doctor.gender" required>
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="degree">Degrees <span class="required">*</span></label>
                      <input type="text" class="form-control" id="degree" v-model="doctor.degree" required />
                    </div>
                    <div class="mb-3">
                      <label for="specialization">Specialization <span class="required">*</span></label>
                      <input type="text" class="form-control" id="specialization" v-model="doctor.specialization" required />
                    </div>
                    <div class="mb-3">
                      <label>Department <span class="required">*</span>
                        <small class="text-muted ms-2">(Select one or more)</small>
                      </label>
                      <div class="border rounded p-2 bg-light" style="max-height: 120px; overflow-y: auto;">
                        <div v-for="dept in departments" :key="dept.id" class="form-check mb-1">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            :value="dept.id"
                            :id="'dept-' + dept.id"
                            v-model="doctor.departments"
                          />
                          <label class="form-check-label" :for="'dept-' + dept.id">
                            {{ dept.name }}
                          </label>
                        </div>
                        <div v-if="departments.length === 0" class="text-muted small">No departments available</div>
                      </div>
                    </div>
                    <div class="mb-3">
                      <label for="years_of_experience">Years of Experience <span class="required">*</span></label>
                      <input type="number" class="form-control" id="years_of_experience" v-model="doctor.years_of_experience" required />
                    </div>
                    <div class="mb-3">
                      <label for="bio">Bio <span class="required">*</span></label>
                      <textarea class="form-control" rows="3" id="bio" v-model="doctor.bio" required></textarea>
                    </div>
                  </div>

                  <!-- Submit -->
                  <div class="col-12 text-center mt-2">
                    <button type="submit" class="btn btn-primary px-5" :disabled="saving">
                      {{ saving ? 'Creating...' : 'Create' }}
                    </button>
                  </div>

                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const saving = ref(false)
    const departments = ref([])

    const doctor = reactive({
      email: '',
      username: '',
      password: '',
      name: '',
      age: '',
      gender: '',
      degree: '',
      specialization: '',
      years_of_experience: '',
      bio: '',
      departments: []
    })

    async function getDepartments() {
      try {
        const { data } = await api.get('departments')
        departments.value = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Get Departments Error:', err)
      }
    }

    async function createDoctor() {
      if (saving.value) return
      saving.value = true
      try {
        const { data } = await api.post('doctors', doctor)
        alert(data.message)
        router.push('/admin')
      } catch (err) {
        console.error('Error:', err)
        alert('An error occurred while adding the doctor.')
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      await getDepartments()
      loading.value = false
    })

    return {
      loading, saving,
      doctor, departments,
      createDoctor
    }
  }
}
</script>
