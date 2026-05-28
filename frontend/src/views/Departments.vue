<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 700px;">
    <div class="row justify-content-center">
      <div class="col-12 col-md-11 col-lg-10 mt-3 mb-3">
        <div class="card shadow bg-white">

          <!-- Header -->
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Department Details</h5>
            <button class="btn btn-light btn-sm" @click="goBack">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="card-body p-3 p-md-4">

            <!-- Loading -->
            <div v-if="loading" class="loading-container">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading department details...</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
            </div>

            <!-- Content -->
            <div v-else>

              <!-- Department Name -->
              <h3 class="text-primary border-bottom pb-2 mb-4">
                <i class="bi bi-hospital me-2"></i>{{ department.name }}
              </h3>

              <!-- Overview -->
              <div class="mb-4">
                <h5 class="mb-2"><i class="bi bi-info-circle me-2"></i>Overview</h5>
                <div class="p-3 bg-light rounded border table-scroll-sm">
                  <p class="mb-0">{{ department.description || 'No description available.' }}</p>
                </div>
              </div>

              <!-- Doctors Table -->
              <div class="mb-3">
                <h5 class="mb-3">
                  <i class="bi bi-people me-2"></i>Available Doctors
                  <span class="badge bg-primary ms-2">{{ doctors.length }}</span>
                </h5>
              </div>

              <div class="table-responsive table-scroll-lg">
                <table class="table table-hover table-bordered table-striped">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th style="width: 8%;" class="text-center">SN</th>
                      <th style="width: 30%;">Doctor Name</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(doc, index) in doctors" :key="doc.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td><i class="bi bi-person-badge me-2 text-primary"></i>Dr. {{ doc.name }}</td>
                      <td class="text-center">
                        <button class="btn btn-primary btn-sm me-2" @click="checkAvailability(doc.id)">
                          <i class="bi bi-calendar-check me-1"></i>Check Availability
                        </button>
                        <button class="btn btn-info btn-sm" @click="viewDetails(doc.id)">
                          <i class="bi bi-eye me-1"></i>View Profile
                        </button>
                      </td>
                    </tr>
                    <tr v-if="doctors.length === 0">
                      <td colspan="3" class="text-center text-muted py-4">
                        <i class="bi bi-inbox me-2"></i>No doctors available in this department
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
import { useRouter, useRoute } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(true)
    const error = ref(null)
    const department = ref({})
    const doctors = ref([])

    async function loadDepartmentDetails(id) {
      try {
        const { data } = await api.get(`/api/department/${id}`)
        department.value = data
        doctors.value = data.doctors || []
      } catch (err) {
        error.value = err.message || 'Failed to load department details'
      } finally {
        loading.value = false
      }
    }

    function checkAvailability(doctorId) {
      router.push(`/availability/${doctorId}/${encodeURIComponent(department.value.name)}`)
    }

    function viewDetails(doctorId) {
      router.push(`/doctor/${doctorId}`)
    }

    function goBack() {
      router.go(-1)
    }

    onMounted(() => {
      loadDepartmentDetails(route.params.id)
    })

    return {
      loading, error,
      department, doctors,
      checkAvailability, viewDetails, goBack
    }
  }
}
</script>