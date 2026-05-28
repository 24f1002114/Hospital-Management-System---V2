<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 700px;">
    <div class="row justify-content-center py-4">
      <div class="col-12 col-md-10 col-lg-8">

        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <div class="spinner-border text-primary"></div>
          <p class="mt-2">Loading doctor profile...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="alert alert-danger text-center">
          <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <!-- Profile Card -->
        <div v-else class="profile-card shadow-lg">

          <!-- Banner + Avatar -->
          <div class="profile-banner">
            <div class="profile-avatar">
              <i class="bi bi-person-fill"></i>
            </div>
          </div>

          <!-- Main Info -->
          <div class="profile-body">
            <div class="profile-name-row">
              <div>
                <h2 class="profile-name">Dr. {{ doctor.name }}</h2>
                <p class="profile-degree">{{ doctor.degree }}</p>
              </div>
              <span v-if="doctor.blacklisted" class="badge bg-danger px-3 py-2 fs-6">
                <i class="bi bi-slash-circle me-1"></i>Blacklisted
              </span>
            </div>

            <!-- Stats Row -->
            <div class="profile-stats">
              <div class="stat-item">
                <i class="bi bi-award-fill text-primary"></i>
                <div>
                  <div class="stat-value">{{ doctor.years_of_experience }}+</div>
                  <div class="stat-label">Years Exp.</div>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <i class="bi bi-heart-pulse-fill text-danger"></i>
                <div>
                  <div class="stat-value">{{ doctor.specialization }}</div>
                  <div class="stat-label">Specialization</div>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <i class="bi bi-building-fill text-success"></i>
                <div>
                  <div class="stat-value">{{ doctor.departments?.length || 0 }}</div>
                  <div class="stat-label">Departments</div>
                </div>
              </div>
            </div>

            <!-- Bio -->
            <div class="profile-section">
              <h6 class="section-label">
                <i class="bi bi-person-lines-fill me-2"></i>About
              </h6>
              <p class="profile-bio">{{ doctor.bio }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="profile-actions">
              <button
                class="btn btn-primary btn-lg px-4"
                @click="goAvailability"
                :disabled="doctor.blacklisted"
              >
                <i class="bi bi-calendar-check me-2"></i>Check Availability
              </button>
              <button class="btn btn-outline-secondary btn-lg px-4" @click="goBack">
                <i class="bi bi-arrow-left me-2"></i>Go Back
              </button>
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
    const doctor = ref({})

    const doctorId = route.params.id || route.params.doctor_id

    async function loadDoctor() {
      try {
        const { data } = await api.get(`doctor/${doctorId}`)
        doctor.value = {
          name: data.name || 'Unknown',
          degree: data.degree || 'N/A',
          specialization: data.specialization || 'General',
          years_of_experience: data.years_of_experience || 0,
          bio: data.bio || 'No bio available.',
          blacklisted: data.blacklisted || false,
          departments: data.departments || []
        }
      } catch (err) {
        error.value = err.message || 'Failed to load doctor profile'
      } finally {
        loading.value = false
      }
    }

    async function goAvailability() {
      if (!doctor.value.departments?.length) {
        alert('Doctor does not have any department assigned')
        return
      }
      try {
        const deptId = doctor.value.departments[0]
        const { data } = await api.get(`department/${deptId}`)
        router.push(`/availability/${doctorId}/${encodeURIComponent(data.name)}`)
      } catch (err) {
        console.error(err)
        alert('Unable to load department information')
      }
    }

    function goBack() {
      router.go(-1)
    }

    onMounted(loadDoctor)

    return {
      loading, error, doctor,
      goAvailability, goBack
    }
  }
}
</script>

<style scoped>
.profile-card {
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.profile-banner {
  height: 140px;
  background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 0 2rem;
}

.profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #fff;
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: -50px;
  left: 2rem;
}

.profile-avatar i {
  font-size: 64px;
  color: #0d6efd;
}

.profile-body {
  padding: 4rem 2rem 2rem 2rem;
}

.profile-name-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.profile-degree {
  color: #6c757d;
  font-size: 0.95rem;
  margin: 0;
}

.profile-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-item i {
  font-size: 1.5rem;
}

.stat-value {
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a2e;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #dee2e6;
}

.profile-section {
  margin-bottom: 1.75rem;
}

.section-label {
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.profile-bio {
  color: #555;
  line-height: 1.7;
  margin: 0;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 576px) {
  .profile-body {
    padding: 4rem 1rem 1.5rem 1rem;
  }

  .profile-avatar {
    left: 1rem;
  }

  .profile-stats {
    gap: 1rem;
    padding: 1rem;
  }

  .stat-divider {
    display: none;
  }

  .profile-actions .btn {
    width: 100%;
  }
}
</style>
