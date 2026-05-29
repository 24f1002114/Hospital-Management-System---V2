<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 700px;">
    <div class="row justify-content-center">
      <div class="col-12 col-md-11 col-lg-10 mt-3 mb-3">
        <div class="card shadow bg-white">

          <!-- Loading -->
          <div v-if="loading" class="loading-container">
            <div class="spinner-border text-success"></div>
            <p class="mt-2">Loading...</p>
          </div>

          <div v-else>

            <!-- Header -->
            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <div>
                <h4 class="mb-0">Manage Your Availability</h4>
                <small>Set when you're available to see patients</small>
              </div>
              <button class="btn btn-light btn-sm" @click="$router.go(-1)">
                <i class="bi bi-arrow-left me-1"></i>Back
              </button>
            </div>

            <div class="card-body p-3 p-md-4">

              <!-- Add New Slot -->
              <div class="border rounded p-3 mb-4 bg-light">
                <h5 class="mb-3">Add New Time Slot</h5>
                <div class="row g-3 align-items-end">
                  <div class="col-6 col-md-2">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-control" v-model="newSlot.date" />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label">Day</label>
                    <input type="text" class="form-control" v-model="newSlot.day_of_week" readonly />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label">From</label>
                    <input type="time" class="form-control" v-model="newSlot.start_time" />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label">To</label>
                    <input type="time" class="form-control" v-model="newSlot.end_time" />
                  </div>
                  <div class="col-6 col-md-2">
                    <label class="form-label">Status</label>
                    <select class="form-select" v-model="newSlot.is_active">
                      <option :value="true">Active</option>
                      <option :value="false">Inactive</option>
                    </select>
                  </div>
                  <div class="col-6 col-md-2">
                    <button class="btn btn-success w-100" @click="addSlot">Add Slot</button>
                  </div>
                </div>
              </div>

              <!-- Schedule Table -->
              <h5 class="mb-3">Your Current Schedule</h5>

              <div v-if="slots.length === 0" class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>No slots added yet. Add your first availability slot above!
              </div>

              <div v-else class="table-responsive table-scroll-md">
                <table class="table table-striped table-bordered">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th>SN</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(slot, index) in sortedSlots" :key="slot.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ slot.date }}</td>
                      <td>{{ slot.day_of_week }}</td>
                      <td>{{ slot.start_time }}</td>
                      <td>{{ slot.end_time }}</td>
                      <td>
                        <span class="badge" :class="slot.is_active ? 'bg-success' : 'bg-secondary'">
                          {{ slot.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-danger" @click="deleteSlot(slot.id)">Delete</button>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ORDER = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 }

export default {
  setup() {
    const router = useRouter()
    const auth = useAuthStore()   
    auth.restoreFromStorage()
    const loading = ref(true)
    const slots = ref([])
    const newSlot = ref({
      date: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      is_active: true
    })

    // Auto-fill day when date changes
    watch(() => newSlot.value.date, (val) => {
      if (!val) return
      const [year, month, day] = val.split('-').map(Number)
      newSlot.value.day_of_week = DAY_NAMES[new Date(year, month - 1, day).getDay()]
    })

    const sortedSlots = computed(() =>
      [...slots.value].sort((a, b) => {
        if (DAY_ORDER[a.day_of_week] !== DAY_ORDER[b.day_of_week])
          return DAY_ORDER[a.day_of_week] - DAY_ORDER[b.day_of_week]
        return a.start_time.localeCompare(b.start_time)
      })
    )

    async function loadSlots() {
      try {
        const { data } = await api.get('availabilities')
        slots.value = Array.isArray(data) ? data : []
      } catch (err) {
	console.error('Full error:', err.response?.data) 
        console.error(err)
        slots.value = []
      }
    }

    async function addSlot() {
      const { date, day_of_week, start_time, end_time } = newSlot.value
      if (!date || !day_of_week || !start_time || !end_time) {
        alert('Please fill all fields!')
        return
      }
      if (start_time >= end_time) {
        alert('End time must be after start time!')
        return
      }
      try {
        const { data } = await api.post('availabilities', newSlot.value)
        alert(data.message || 'Slot added successfully!')
        newSlot.value = { date: '', day_of_week: '', start_time: '', end_time: '', is_active: true }
        await loadSlots()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to add slot')
      }
    }

    async function deleteSlot(id) {
      if (!confirm('Are you sure you want to delete this slot?')) return
      try {
        const { data } = await api.delete(`doctor/availability/${id}`)
        alert(data.message || 'Slot deleted successfully!')
        await loadSlots()
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete slot')
      }
    }

    onMounted(async () => {
      auth.restoreFromStorage()     
      await loadSlots()
      loading.value = false
    })

    return {
      loading, slots, newSlot,
      sortedSlots,
      addSlot, deleteSlot
    }
  }
}
</script>
