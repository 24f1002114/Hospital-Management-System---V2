<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 500px;">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8 col-lg-6 mt-3 mb-3">
        <div class="card shadow p-2 p-md-3 bg-white">
          <div class="card-body">

            <!-- Loading -->
            <div v-if="loading" class="loading-container">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading...</p>
            </div>

            <div v-else>
              <h2 class="text-center mb-4 mt-2">Update Doctor Profile</h2>

              <form @submit.prevent="saveDoctor">
                <div class="row g-3">

                  <!-- Left Column -->
                  <div class="col-12 col-md-6">
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
                    <div class="mb-3">
                      <label for="specialization">Specialization <span class="required">*</span></label>
                      <input type="text" class="form-control" id="specialization" v-model="doctor.specialization" required />
                    </div>
                    <div class="mb-3">
                      <label for="years_of_experience">Years of Experience <span class="required">*</span></label>
                      <input type="number" class="form-control" id="years_of_experience" v-model="doctor.years_of_experience" required />
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="degree">Degrees <span class="required">*</span></label>
                      <input type="text" class="form-control" id="degree" v-model="doctor.degree" required />
                    </div>

                    <!-- Current Departments -->
                    <div class="mb-3">
                      <label>Current Departments</label>
                      <div class="border rounded p-2 dept-display-box">
                        <span v-if="doctor.departments && doctor.departments.length > 0" class="d-flex flex-wrap gap-2">
                          <span v-for="deptId in doctor.departments" :key="deptId" class="badge bg-primary">
                            {{ getDepartmentName(deptId) }}
                          </span>
                        </span>
                        <span v-else class="text-muted small">No departments assigned</span>
                      </div>
                    </div>

                    <!-- Update Departments -->
                    <div class="mb-3">
                      <label>Update Departments <span class="required">*</span>
                        <small class="text-muted ms-2">(Select one or more)</small>
                      </label>
                      <div class="border rounded p-2 dept-checkbox-box" style="max-height: 100px; overflow-y: auto;">
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
                      <label for="bio">Bio <span class="required">*</span></label>
                      <textarea class="form-control" rows="4" id="bio" v-model="doctor.bio" required></textarea>
                    </div>
                  </div>

                  <!-- Submit -->
                  <div class="col-12 text-center mt-2">
                    <button type="submit" class="btn btn-primary px-5" :disabled="saving">
                      {{ saving ? 'Updating...' : 'Update' }}
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
import { useRoute } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const route = useRoute()
    const doctorId = route.params.id

    const loading = ref(true)
    const saving = ref(false)
    const departments = ref([])
    const doctor = reactive({
      name: '',
      age: '',
      gender: '',
      specialization: '',
      years_of_experience: '',
      bio: '',
      degree: '',
      departments: []
    })

    function getDepartmentName(deptId) {
      const dept = departments.value.find(d => d.id === deptId)
      return dept ? dept.name : 'Unknown'
    }

    async function fetchDoctorData() {
      try {
        const { data } = await api.get(`doctor/${doctorId}`)
        Object.assign(doctor, data)
      } catch (err) {
        console.error('Fetch Doctor Error:', err)
      }
    }

    async function loadDepartments() {
      try {
        const { data } = await api.get('departments')
        departments.value = Array.isArray(data) ? data : []
      } catch (err) {
        console.error('Load Departments Error:', err)
      }
    }

    async function saveDoctor() {
      if (saving.value) return
      saving.value = true
      try {
        await api.put(`doctor/${doctorId}`, doctor)
        alert('Doctor profile updated successfully!')
        await fetchDoctorData()
      } catch (err) {
        console.error('Save Doctor Error:', err)
        alert(err.response?.data?.message || 'Failed to update doctor profile')
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      await Promise.all([loadDepartments(), fetchDoctorData()])
      loading.value = false
    })

    return {
      loading, saving,
      doctor, departments,
      getDepartmentName,
      saveDoctor
    }
  }
}
</script>
