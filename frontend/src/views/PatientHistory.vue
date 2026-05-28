<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 400px;">
    <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3 bg-white">
          <div class="card-body">

            <!-- Header -->
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center mb-3">
              <h4 class="mb-0"><i class="bi bi-journal-medical me-2"></i>Treatment History</h4>
              <button class="btn btn-light btn-sm" @click="$router.go(-1)">
                <i class="bi bi-arrow-left me-1"></i>Back
              </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="loading-container">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading history...</p>
            </div>

            <div v-else>

              <!-- Patient Info -->
              <div v-if="patientInfo" class="card mb-4 bg-light border-0">
                <div class="card-body py-3">
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <strong>Patient:</strong> {{ patientInfo.patient_name }}
                    </div>
                    <div class="col-12 col-md-4">
                      <strong>Department:</strong> {{ displayDepartment }}
                    </div>
                    <div class="col-12 col-md-4">
                      <strong>Total Visits:</strong> {{ treatments.length }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Treatment Table -->
              <div v-if="treatments.length > 0" class="table-responsive table-scroll-full">
                <table class="table table-hover table-bordered">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th class="text-center" style="width: 5%;">Visit</th>
                      <th style="width: 15%;">Doctor</th>
                      <th style="width: 12%;">Department</th>
                      <th style="width: 10%;">Visit Type</th>
                      <th style="width: 10%;">Tests</th>
                      <th style="width: 13%;">Diagnosis</th>
                      <th style="width: 10%;">Prescription</th>
                      <th style="width: 15%;">Medicines</th>
                      <th style="width: 10%;">Next Visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(treatment, index) in treatments" :key="treatment.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>Dr. {{ treatment.doctor_name }}</td>
                      <td>{{ treatment.department || 'N/A' }}</td>
                      <td>{{ treatment.visit_type }}</td>
                      <td>{{ treatment.tests_done || '—' }}</td>
                      <td>{{ treatment.diagnosis }}</td>
                      <td>{{ treatment.prescription || '—' }}</td>
                      <td>
                        <div v-if="treatment.medicines && treatment.medicines.length > 0">
                          <div v-for="(med, idx) in treatment.medicines" :key="idx" class="mb-2">
                            <strong>{{ idx + 1 }}. {{ med.name }}</strong>
                            <div class="text-muted small">
                              {{ med.dosage }} for {{ med.duration_days }} days
                            </div>
                          </div>
                        </div>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td>{{ treatment.next_visit_date || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Empty State -->
              <div v-else class="alert alert-info text-center my-4">
                <i class="bi bi-info-circle me-2"></i>
                No treatment records found for {{ displayDepartment }}.
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'

export default {
  setup() {
    const route = useRoute()
    const auth = useAuthStore()
    const loading = ref(true)
    const treatments = ref([])
    const patientInfo = ref(null)

    const patientId = route.params.patient_id
    const department = route.params.department || 'All'

    const displayDepartment = computed(() =>
      department === 'All' ? 'All Departments' : department
    )

    async function loadPatientInfo() {
      const targetId = parseInt(patientId) || parseInt(auth.userId)
      try {
        const { data } = await api.get(`/api/patient/${targetId}`)
        patientInfo.value = { patient_name: data.name || 'Unknown' }
      } catch (err) {
        console.error('Error loading patient info:', err)
      }
    }

    async function loadTreatments() {
      loading.value = true
      try {
        const { data } = await api.get('/api/treatments')
        const targetId = parseInt(patientId) || parseInt(auth.userId)
        let all = Array.isArray(data) ? data : []

        all = all.filter(t => t.appointment_id && t.patient_id === targetId)

        if (department && department !== 'All') {
          all = all.filter(t =>
            t.department && t.department.toLowerCase() === department.toLowerCase()
          )
        }

        treatments.value = all

        if (all.length > 0) {
          patientInfo.value = { patient_name: all[0].patient_name }
        } else {
          await loadPatientInfo()
        }
      } catch (err) {
        console.error('Error loading treatments:', err)
        treatments.value = []
        alert('Failed to load treatment history')
      } finally {
        loading.value = false
      }
    }

    onMounted(loadTreatments)

    return {
      loading, treatments, patientInfo,
      displayDepartment
    }
  }
}
</script>
