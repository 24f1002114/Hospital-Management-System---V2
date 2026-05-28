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
              <h2 class="text-center mb-4 mt-2">Update Profile</h2>

              <form @submit.prevent="savePatient">
                <div class="row g-3">

                  <!-- Left Column -->
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="name">Full Name <span class="required">*</span></label>
                      <input type="text" class="form-control" id="name" v-model="patient.name" required />
                    </div>
                    <div class="mb-3">
                      <label for="age">Age <span class="required">*</span></label>
                      <input type="number" class="form-control" id="age" v-model="patient.age" required />
                    </div>
                    <div class="mb-3">
                      <label for="gender">Gender <span class="required">*</span></label>
                      <select class="form-select" id="gender" v-model="patient.gender" required>
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="contact_number">Contact <span class="required">*</span></label>
                      <input type="text" class="form-control" id="contact_number" v-model="patient.contact_number" required />
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="col-12 col-md-6">
                    <div class="mb-3">
                      <label for="address">Address <span class="required">*</span></label>
                      <input type="text" class="form-control" id="address" v-model="patient.address" required />
                    </div>
                    <div class="mb-3">
                      <label for="medical_history">Medical History <span class="required">*</span></label>
                      <textarea class="form-control" rows="7" id="medical_history" v-model="patient.medical_history" required></textarea>
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
    const patientId = parseInt(route.params.id)

    const loading = ref(true)
    const saving = ref(false)
    const patient = reactive({
      name: '',
      age: '',
      gender: '',
      contact_number: '',
      address: '',
      medical_history: ''
    })

    async function fetchPatientData() {
      try {
        const { data } = await api.get(`/api/patient/${patientId}`)
        Object.assign(patient, data)
      } catch (err) {
        console.error('Fetch Patient Error:', err)
      }
    }

    async function savePatient() {
      if (saving.value) return
      saving.value = true
      try {
        await api.put(`/api/patient/${patientId}`, patient)
        alert('Patient profile updated successfully!')
        await fetchPatientData()
      } catch (err) {
        console.error('Save Patient Error:', err)
        alert(err.response?.data?.message || 'Failed to update patient profile')
      } finally {
        saving.value = false
      }
    }

    onMounted(async () => {
      await fetchPatientData()
      loading.value = false
    })

    return {
      loading, saving,
      patient,
      savePatient
    }
  }
}
</script>
