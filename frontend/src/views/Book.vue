<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 400px;">
    <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3 bg-white">

          <!-- Loading -->
          <div v-if="!ready" class="loading-container">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading...</p>
          </div>

          <div v-else>

            <!-- Header -->
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 class="mb-0">Book Appointment</h4>
              <button class="btn btn-sm btn-light" @click="$router.go(-1)">
                <i class="bi bi-arrow-left me-1"></i>Back
              </button>
            </div>

            <div class="card-body">
              <h5 class="mb-4">Available Time Slots</h5>

              <div class="table-responsive table-scroll-full">
                <table class="table table-bordered table-striped">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th>SN</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(slot, index) in sortedSlots" :key="slot.id">

                      <!-- Inactive slot -->
                      <tr v-if="!slot.is_active" class="text-muted">
                        <td>{{ index + 1 }}</td>
                        <td>{{ slot.date }}</td>
                        <td>{{ slot.day_of_week }}</td>
                        <td>{{ slot.start_time }}</td>
                        <td>{{ slot.end_time }}</td>
                        <td><span class="badge bg-secondary">Not Available</span></td>
                        <td><button class="btn btn-sm btn-secondary" disabled>—</button></td>
                      </tr>

                      <!-- Booked by current patient -->
                      <tr v-else-if="isBookedByMe(slot.id)">
                        <td>{{ index + 1 }}</td>
                        <td>{{ slot.date }}</td>
                        <td>{{ slot.day_of_week }}</td>
                        <td>{{ slot.start_time }}</td>
                        <td>{{ slot.end_time }}</td>
                        <td><span class="badge bg-danger">Booked</span></td>
                        <td>
                          <button
                            class="btn btn-sm btn-danger"
                            :disabled="processing"
                            @click="cancelAppointment(getAppointmentBySlot(slot.id))"
                          >Cancel</button>
                        </td>
                      </tr>

                      <!-- Booked by someone else (backend sets is_booked=true) -->
                      <tr v-else-if="slot.is_booked" class="text-muted">
                        <td>{{ index + 1 }}</td>
                        <td>{{ slot.date }}</td>
                        <td>{{ slot.day_of_week }}</td>
                        <td>{{ slot.start_time }}</td>
                        <td>{{ slot.end_time }}</td>
                        <td><span class="badge bg-secondary">Not Available</span></td>
                        <td><button class="btn btn-sm btn-secondary" disabled>—</button></td>
                      </tr>

                      <!-- Free slot -->
                      <tr v-else>
                        <td>{{ index + 1 }}</td>
                        <td>{{ slot.date }}</td>
                        <td>{{ slot.day_of_week }}</td>
                        <td>{{ slot.start_time }}</td>
                        <td>{{ slot.end_time }}</td>
                        <td><span class="badge bg-success">Free</span></td>
                        <td>
                          <button
                            class="btn btn-sm btn-primary"
                            :disabled="processing"
                            @click="bookAppointment(slot.id)"
                          >Book</button>
                        </td>
                      </tr>

                    </template>

                    <tr v-if="sortedSlots.length === 0">
                      <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-calendar-x me-2"></i>No slots available
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default {
  setup() {
    const route = useRoute()
    const auth = useAuthStore()

    const doctorId = parseInt(route.params.user_id)
    const departmentName = route.params.department_name

    const ready = ref(false)
    const processing = ref(false)
    const slots = ref([])        // includes is_booked from backend
    const appointments = ref([]) // current patient's own appointments

    const sortedSlots = computed(() =>
      [...slots.value].sort((a, b) => {
        const da = DAY_ORDER.indexOf(a.day_of_week)
        const db = DAY_ORDER.indexOf(b.day_of_week)
        if (da !== db) return da - db
        return (a.start_time || '').localeCompare(b.start_time || '')
      })
    )

    async function loadSlots() {
      try {
        const { data } = await api.get(`/api/availabilities/${doctorId}`)
        slots.value = Array.isArray(data) ? data : []
      } catch { slots.value = [] }
    }

    async function loadAppointments() {
      try {
        const { data } = await api.get('/api/appointments')
        // Client-side validation: ensure all appointments belong to current patient
        appointments.value = Array.isArray(data)
          ? data.filter(app => app.patient_id === auth.userId)
          : []
      } catch { appointments.value = [] }
    }

    // Is this slot booked by the currently logged-in patient?
    function isBookedByMe(slotId) {
      return appointments.value.some(
        a => String(a.slot_id) === String(slotId) && a.status === 'Booked'
      )
    }

    function getAppointmentBySlot(slotId) {
      const app = appointments.value.find(
        a => String(a.slot_id) === String(slotId) && a.status === 'Booked'
      )
      return app ? app.id : null
    }

    async function bookAppointment(slotId) {
      if (processing.value) return
      processing.value = true
      try {
        const { data } = await api.post('/api/appointments', {
          doctor_id: doctorId,
          department: departmentName,
          slot_id: slotId
        })
        if (data.status === 'Booked') {
          alert('Appointment booked successfully!')
          await Promise.all([loadSlots(), loadAppointments()])
        } else {
          alert(data.message || 'Booking failed')
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Booking error occurred')
      } finally {
        processing.value = false
      }
    }

    async function cancelAppointment(appointmentId) {
      if (!appointmentId) { alert('Appointment not found'); return }
      if (!confirm('Are you sure you want to cancel this appointment?')) return
      if (processing.value) return
      processing.value = true
      try {
        await api.delete(`/api/appointment/${appointmentId}`)
        alert('Appointment cancelled successfully!')
        await Promise.all([loadSlots(), loadAppointments()])
      } catch (err) {
        alert(err.response?.data?.message || 'Error cancelling appointment')
      } finally {
        processing.value = false
      }
    }

    onMounted(async () => {
      try {
        await Promise.all([loadSlots(), loadAppointments()])
      } finally {
        ready.value = true
      }
    })

    return {
      ready, processing,
      sortedSlots,
      isBookedByMe,
      getAppointmentBySlot,
      bookAppointment, cancelAppointment
    }
  }
}
</script>