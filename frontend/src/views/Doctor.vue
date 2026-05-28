<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 400px;">
    <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3 bg-white">

          <!-- Loading -->
          <div v-if="loading" class="loading-container">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading...</p>
          </div>

          <div v-else>
            <!-- Header -->
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">
                <i class="bi bi-person-badge me-2"></i>Dr. {{ doctorName }}
              </h5>
              <button class="btn btn-light btn-sm" @click="$router.push(`/create/availability/${auth.userId}`)">
                <i class="bi bi-calendar-plus me-1"></i>Create Availability
              </button>
            </div>

            <div class="card-body">
              <div class="section-header section-header-blue mb-3">
                <h6 class="mb-0 text-white">
                  <i class="bi bi-calendar-check me-2"></i>Past/Upcoming Appointments
                </h6>
              </div>

              <div class="table-responsive table-scroll-full border rounded">
                <table class="table table-hover table-bordered mb-0">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th class="text-center col-sn">SN</th>
                      <th>Patient</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th class="text-center">Treatment</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(app, index) in appointments" :key="app.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>
                        <i class="bi bi-person me-1 text-success"></i>{{ app.patient_name }}
                      </td>
                      <td>{{ app.department }}</td>
                      <td>{{ app.slot_details ? app.slot_details.date : 'N/A' }}</td>
                      <td>
                        <span v-if="app.status === 'Booked'" class="status-booked">● Booked</span>
                        <span v-else-if="app.status === 'Completed'" class="status-completed">● Completed</span>
                        <span v-else-if="app.status === 'Cancelled'" class="status-cancelled">● Cancelled</span>
                        <span v-else class="status-default">● {{ app.status }}</span>
                      </td>
                      <td class="text-center">
                        <button v-if="app.status === 'Booked'" class="btn btn-info btn-sm"
                          @click="$router.push(`/update/patient/history/${app.id}`)">
                          <i class="bi bi-plus-circle me-1"></i>Add
                        </button>
                        <span v-else class="text-muted">—</span>
                      </td>
                      <td class="text-center">
                        <div class="d-inline-flex gap-2 flex-wrap justify-content-center">
                          <button class="btn btn-secondary btn-sm"
                            @click="$router.push(`/patient/history/${app.patient_id}/${app.department}`)">
                            <i class="bi bi-clock-history me-1"></i>View History
                          </button>
                          <button v-if="app.status === 'Booked'" class="btn btn-danger btn-sm"
                            :disabled="cancellingId === app.id"
                            @click="cancelAppointment(app.id)">
                            <i class="bi bi-x-circle me-1"></i>
                            {{ cancellingId === app.id ? 'Cancelling...' : 'Cancel' }}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="appointments.length === 0">
                      <td colspan="7" class="text-center text-muted py-3">
                        <i class="bi bi-inbox me-2"></i>No Appointments Found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const auth = useAuthStore()
    const loading = ref(true)
    const appointments = ref([])
    const cancellingId = ref(null)
    const doctorName = ref('')

    async function loadAppointments() {
      try {
        const { data } = await api.get('/api/appointments')
        // Client-side validation: ensure all appointments belong to current doctor
        appointments.value = Array.isArray(data)
          ? data.filter(app => app.doctor_id === auth.userId)
          : []
      } catch (error) {
        console.error('Error loading appointments:', error)
        appointments.value = []
      }
    }

    async function loadDoctorName() {
      const { data } = await api.get(`/api/doctor/${auth.userId}`)
      doctorName.value = data.name || ''
    }

    async function cancelAppointment(id) {
      if (!confirm('Cancel this appointment?')) return
      if (cancellingId.value) return
      cancellingId.value = id
      try {
        await api.put(`/api/appointment/${id}`, { status: 'Cancelled' })
        alert('Cancelled successfully')
        await loadAppointments()
      } catch {
        alert('Error cancelling')
      } finally {
        cancellingId.value = null
      }
    }

    onMounted(async () => {
      try {
        await Promise.all([loadAppointments(), loadDoctorName()])
      } finally {
        loading.value = false
      }
    })

    return {
      loading, appointments, cancellingId,
      doctorName, auth, cancelAppointment
    }
  }
}
</script>

<style scoped>
.section-header {
  padding: 1rem;
  border-radius: 0.5rem 0.5rem 0 0;
}

.section-header-blue {
  background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
}

.col-sn {
  width: 5%;
}
</style>
