<template>
  <div class="row wall border d-flex" style="height: 700px; overflow: auto;">
    <div class="col-12 p-4 border" style="overflow-y: auto;">
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <h4 class="mb-0">Add Treatment</h4>
        </div>
        
        <div class="card-body">
          <form @submit.prevent="saveHistory">
            <div class="row">
              
              <!-- Left Column -->
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Visit Type</label>
                  <select class="form-select" v-model="form.visit_type" required>
                    <option value="">Select Type</option>
                    <option>In Person</option>
                    <option>Telemedicine</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label">Tests Done</label>
                  <input type="text" class="form-control" v-model="form.tests_done">
                </div>

                <div class="mb-3">
                  <label class="form-label">Diagnosis</label>
                  <input type="text" class="form-control" v-model="form.diagnosis" required>
                </div>

                <div class="mb-3">
                  <label class="form-label">Prescription</label>
                  <textarea class="form-control" v-model="form.prescription" rows="6"></textarea>
                </div>
              </div>

              <!-- Right Column -->
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Next Visit Date</label>
                  <input type="date" class="form-control" v-model="form.next_visit_date">
                </div>

                <div class="mb-3">
                  <label class="form-label">Notes</label>
                  <textarea class="form-control" v-model="form.notes" rows="3"></textarea>
                </div>

                <!-- Medicines Section -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between mb-2">
                    <label class="form-label mb-0">Medicines</label>
                    <button type="button" class="btn btn-sm btn-success" @click="addMedicine">
                      + Add
                    </button>
                  </div>
                  
                  <div style="max-height: 200px; overflow-y: auto;">
                    <div v-for="(med, idx) in form.medicines" :key="idx" class="card mb-2 bg-light">
                      <div class="card-body p-2">
                        <div class="d-flex justify-content-between mb-2">
                          <small class="text-muted">Medicine {{ idx + 1 }}</small>
                          <button 
                            type="button" 
                            class="btn btn-sm btn-danger" 
                            @click="removeMedicine(idx)"
                            v-if="form.medicines.length > 1">
                            Remove
                          </button>
                        </div>
                        
                        <input 
                          type="text" 
                          class="form-control form-control-sm mb-2" 
                          v-model="med.name" 
                          placeholder="Name" 
                          required>
                        <label class="form-label small mb-1">Dosage frequency (i.e., 1-0-0)</label>
                        <input class="form-control form-control-sm mb-2" v-model="med.dosage" required>
                        <input 
                          type="number" 
                          class="form-control form-control-sm" 
                          v-model.number="med.duration_days" 
                          placeholder="Days" 
                          min="1" 
                          required>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="d-flex gap-2 mt-3">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                  {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button type="button" class="btn btn-secondary" @click="goBack">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'

export default {
  setup() {
    const route = useRoute()
    const router = useRouter()
    const auth = useAuthStore()

    const saving = ref(false)
    const appointmentId = ref(parseInt(route.params.id))
    
    const form = ref({
      visit_type: "",
      tests_done: "",
      diagnosis: "",
      prescription: "",
      notes: "",
      next_visit_date: "",
      medicines: [{ name: "", dosage: "", duration_days: 1 }]
    })

    function addMedicine() {
      form.value.medicines.push({ name: "", dosage: "", duration_days: 1 })
    }

    function removeMedicine(index) {
      form.value.medicines.splice(index, 1)
    }

    async function saveHistory() {
      const invalidMed = form.value.medicines.some(m => !m.name.trim() || !m.dosage.trim() || !m.duration_days)
      if (invalidMed) {
        alert('Please fill all medicine fields!')
        return
      }

      if (saving.value) return
      saving.value = true

      try {
        const response = await api.post('/api/treatments', {
          appointment_id: appointmentId.value,
          ...form.value
        })

        if (response && response.status === 201) {
          alert('Treatment saved successfully!')
          goBack()
        } else {
          alert('Failed to save treatment')
        }
      } catch (error) {
        if (error.response?.status === 401) {
          auth.logout()
          router.push('/login')
        } else {
          alert('Error: ' + (error.response?.data?.message || error.message))
        }
      } finally {
        saving.value = false
      }
    }

    function goBack() {
      router.go(-1)
    }

    return {
      saving,
      appointmentId,
      form,
      addMedicine,
      removeMedicine,
      saveHistory,
      goBack
    }
  }
}
</script>

<style scoped>
form {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.form-label {
  font-weight: 500;
  color: #333;
}

textarea, input, select {
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
  padding: 0.5rem;
}

textarea:focus, input:focus, select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn {
  border-radius: 0.375rem;
  font-weight: 500;
}

.card {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
}

.card-header {
  border-radius: 0.5rem 0.5rem 0 0;
}
</style>
