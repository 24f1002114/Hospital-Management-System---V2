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
                <i class="bi bi-person-circle me-2"></i>{{ patientName }}
              </h5>
              <button class="btn btn-light btn-sm" @click="viewHistory">
                <i class="bi bi-clock-history me-2"></i>View Treatment History
              </button>
            </div>

            <div class="card-body">

              <!-- Departments Section -->
              <div class="mb-4">
                <div class="section-header section-header-blue">
                  <h5 class="mb-0 text-white">
                    <i class="bi bi-hospital me-2"></i>Departments
                  </h5>
                </div>
                <div class="table-responsive border border-top-0 rounded-bottom">
                  <table class="table table-sm table-hover table-bordered mb-0">
                    <thead class="table-dark sticky-top">
                      <tr>
                        <th class="text-center col-sn">SN</th>
                        <th>Name</th>
                        <th class="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(dep, index) in departments" :key="dep.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>
                          <i class="bi bi-building me-2 text-primary"></i>{{ dep.name }}
                        </td>
                        <td class="text-center">
                          <button class="btn btn-info btn-sm" @click="$router.push(`/patient/departments/${dep.id}`)">
                            <i class="bi bi-eye me-1"></i>View Details
                          </button>
                        </td>
                      </tr>
                      <tr v-if="departments.length === 0">
                        <td colspan="3" class="text-center text-muted py-3">
                          <i class="bi bi-inbox me-2"></i>No Departments Found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Appointments Section -->
              <div>
                <div class="section-header section-header-green">
                  <h5 class="mb-0 text-white">
                    <i class="bi bi-calendar-check me-2"></i>Your Appointments
                  </h5>
                </div>
                <div class="table-responsive border border-top-0 rounded-bottom">
                  <table class="table table-sm table-hover table-bordered mb-0">
                    <thead class="table-dark sticky-top">
                      <tr>
                        <th class="text-center col-sn">SN</th>
                        <th>Doctor</th>
                        <th>Department</th>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Time Slot</th>
                        <th>Status</th>
                        <th class="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(app, index) in appointments" :key="app.id">
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>
                          <i class="bi bi-person-badge me-1 text-primary"></i>Dr. {{ app.doctor_name }}
                        </td>
                        <td>{{ app.department }}</td>
                        <td>{{ app.slot_details ? app.slot_details.date : 'N/A' }}</td>
                        <td>{{ app.slot_details ? app.slot_details.day_of_week : 'N/A' }}</td>
                        <td>{{ app.slot_details ? app.slot_details.start_time + ' - ' + app.slot_details.end_time : 'N/A' }}</td>
                        <td>
                          <span v-if="app.status === 'Booked'" class="status-booked">● Booked</span>
                          <span v-else-if="app.status === 'Completed'" class="status-completed">● Completed</span>
                          <span v-else-if="app.status === 'Cancelled'" class="status-cancelled">● Cancelled</span>
                          <span v-else class="status-default">● {{ app.status }}</span>
                        </td>
                        <td class="text-center">
                          <button
                            v-if="app.status === 'Booked'"
                            class="btn btn-danger btn-sm"
                            :disabled="cancellingId === app.id"
                            @click="cancelAppointment(app.id)">
                            <i class="bi bi-x-circle me-1"></i>
                            {{ cancellingId === app.id ? 'Cancelling...' : 'Cancel' }}
                          </button>
                          <span v-else class="text-muted">—</span>
                        </td>
                      </tr>
                      <tr v-if="appointments.length === 0">
                        <td colspan="8" class="text-center text-muted py-3">
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
    const departments = ref([])
    const appointments = ref([])
    const cancellingId = ref(null)
    const patientName = ref('')

    async function loadDepartments() {
      const { data } = await api.get('departments')
      departments.value = Array.isArray(data) ? data : []
    }

    async function loadAppointments() {
      try {
        const { data } = await api.get('appointments')
        // Client-side validation: ensure all appointments belong to current patient
        appointments.value = Array.isArray(data) 
          ? data.filter(app => app.patient_id === auth.userId)
          : []
      } catch (error) {
        console.error('Error loading appointments:', error)
        appointments.value = []
      }
    }

    async function loadPatientName() {
      const { data } = await api.get(`patient/${auth.userId}`)
      patientName.value = data?.name || 'Patient'
    }

    async function cancelAppointment(id) {
      if (!confirm('Are you sure you want to cancel this appointment?')) return
      if (cancellingId.value) return
      cancellingId.value = id
      try {
        await api.put(`appointment/${id}`, { status: 'Cancelled' })
        alert('Appointment cancelled successfully!')
        await loadAppointments()
      } catch {
        alert('Error cancelling appointment')
      } finally {
        cancellingId.value = null
      }
    }

    function viewHistory() {
      router.push(`/patient/history/${auth.userId}/All`)
    }

    onMounted(async () => {
      try {
        await Promise.all([
          loadDepartments(),
          loadAppointments(),
          loadPatientName()
        ])
      } finally {
        loading.value = false
      }
    })

    return {
      loading, departments, appointments,
      cancellingId, patientName,
      cancelAppointment, viewHistory
    }
  }
}
</script>

<style scoped>
.section-header {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem 0.5rem 0 0;
}

.section-header-blue {
  background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
}

.section-header-green {
  background: linear-gradient(135deg, #198754 0%, #20c997 100%);
}

.col-sn {
  width: 5%;
}
</style>
