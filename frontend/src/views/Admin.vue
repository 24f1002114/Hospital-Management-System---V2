<template>
  <div class="container-fluid wall overflow-auto" style="min-height: 400px;">
    <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3 bg-white">
          <div class="card-body">

            <!-- Loading -->
            <div v-if="loading" class="loading-container">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading...</p>
            </div>

            <div v-else>

              <!-- Registered Doctors -->
              <div class="mb-5">
                <div class="section-header section-header-blue">
                  <h4 class="mb-0 text-white fw-bold">
                    <i class="bi bi-people-fill me-2"></i>Doctors
                    <span class="badge bg-white text-primary fs-6">{{ doctors.length }}</span>
                  </h4>
                </div>
                <div class="border border-top-0 rounded-bottom p-4">
                  <div class="row mb-4 align-items-end g-3">
                    <div class="col-12 col-lg-6">
                      <form class="d-flex flex-column flex-md-row gap-3" @submit.prevent="searchDoctors">
                        <input class="form-control" type="search" placeholder="Search..." v-model="DsearchQuery"/>
                        <select v-model="DsearchType" class="form-select search-select">
                          <option value="" disabled selected>By</option>
                          <option value="specialization">Specialization</option>
                          <option value="name">Name</option>
                        </select>
                        <button class="btn btn-outline-primary" type="submit">Search</button>
                        <button class="btn btn-outline-secondary" type="button" @click="clearDoctorSearch">Clear</button>
                      </form>
                    </div>
                    <div class="col-12 col-lg-6 d-flex gap-3 justify-content-lg-end">
                      <button class="btn btn-primary" @click="$router.push('/add/doctor')">➕ Add Doctor</button>
                      <button class="btn btn-secondary" @click="$router.push('/manage/departments')">⚙️ Manage</button>
                    </div>
                  </div>
                  <div class="table-responsive table-scroll-full">
                    <table class="table table-striped table-bordered">
                      <thead class="table-dark sticky-top">
                        <tr>
                          <th class="col-sn">SN</th>
                          <th class="col-name">Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(doc, index) in doctors" :key="doc.id">
                          <td>{{ index + 1 }}</td>
                          <td>Dr. {{ doc.name }}</td>
                          <td class="text-nowrap">
                            <div class="action-buttons">
                              <button class="btn btn-primary btn-action" @click="$router.push(`/update/doctor/${doc.id}`)">Edit</button>
                              <button class="btn btn-danger btn-action" @click="deleteDoctor(doc.id)">Del</button>
                              <button v-if="!doc.blacklisted" class="btn btn-warning btn-action" @click="blacklist(doc.id)">Block</button>
                              <button v-else class="btn btn-secondary btn-action" @click="removeBlacklist(doc.id)">Unblock</button>
                            </div>
                          </td>
                        </tr>
                        <tr v-if="doctors.length === 0">
                          <td colspan="3" class="text-center text-muted">No Doctors Found</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Registered Patients -->
              <div class="mb-5">
                <div class="section-header section-header-green">
                  <h4 class="mb-0 text-white fw-bold">
                    <i class="bi bi-person-hearts me-2"></i>Patients
                    <span class="badge bg-white text-success fs-6">{{ patients.length }}</span>
                  </h4>
                </div>
                <div class="border border-top-0 rounded-bottom p-4">
                  <div class="row mb-4 align-items-end g-3">
                    <div class="col-12 col-lg-6">
                      <form class="d-flex flex-column flex-md-row gap-3" @submit.prevent="searchPatients">
                        <input class="form-control" type="search" placeholder="Search..." v-model="PsearchQuery"/>
                        <select v-model="PsearchType" class="form-select search-select">
                          <option value="" disabled selected>By</option>
                          <option value="id">ID</option>
                          <option value="name">Name</option>
                        </select>
                        <button class="btn btn-outline-success" type="submit">Search</button>
                        <button class="btn btn-outline-secondary" type="button" @click="clearPatientSearch">Clear</button>
                      </form>
                    </div>
                  </div>
                  <div class="table-responsive table-scroll-full">
                    <table class="table table-striped table-bordered">
                      <thead class="table-dark sticky-top">
                        <tr>
                          <th class="col-sn">SN</th>
                          <th class="col-name">Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(pat, index) in patients" :key="pat.id">
                          <td>{{ index + 1 }}</td>
                          <td>{{ pat.name }}</td>
                          <td class="text-nowrap">
                            <div class="action-buttons">
                              <button class="btn btn-primary btn-action" @click="$router.push(`/update/patient/${pat.id}`)">Edit</button>
                              <button class="btn btn-danger btn-action" @click="deletePatient(pat.id)">Del</button>
                              <button v-if="!pat.blacklisted" class="btn btn-warning btn-action" @click="blacklist(pat.id)">Block</button>
                              <button v-else class="btn btn-secondary btn-action" @click="removeBlacklist(pat.id)">Unblock</button>
                            </div>
                          </td>
                        </tr>
                        <tr v-if="patients.length === 0">
                          <td colspan="3" class="text-center text-muted">No Patients Found</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Appointments -->
              <div class="mt-5">
                <div class="section-header section-header-cyan">
                  <h4 class="mb-0 text-white fw-bold">
                    <i class="bi bi-calendar2-check me-2"></i>Appointment List
                    <span class="badge bg-white text-info fs-6">{{ appointments.length }}</span>
                  </h4>
                </div>
                <div class="border border-top-0 rounded-bottom p-3">
                  <div class="table-responsive table-scroll-full">
                    <table class="table table-striped table-bordered">
                      <thead class="table-dark sticky-top">
                        <tr>
                          <th class="col-sn">SN</th>
                          <th>Patient</th>
                          <th>Doctor</th>
                          <th>Dept</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th>History</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(app, index) in appointments" :key="app.id">
                          <td>{{ index + 1 }}</td>
                          <td><small>{{ app.patient_name }}</small></td>
                          <td><small>{{ app.doctor_name }}</small></td>
                          <td><small>{{ app.department }}</small></td>
                          <td><small>{{ app.slot_details ? app.slot_details.date : 'N/A' }}</small></td>
                          <td><small>{{ app.slot_details ? app.slot_details.start_time : 'N/A' }}</small></td>
                          <td>
                            <span v-if="app.status === 'Booked'" class="status-booked">● Booked</span>
                            <span v-else-if="app.status === 'Completed'" class="status-completed">● Completed</span>
                            <span v-else-if="app.status === 'Cancelled'" class="status-cancelled">● Cancelled</span>
                            <span v-else class="status-default">● {{ app.status }}</span>
                          </td>
                          <td class="text-center">
                            <button class="btn btn-info btn-action" @click="$router.push(`/patient/history/${app.patient_id}/${app.department}`)">View</button>
                          </td>
                        </tr>
                        <tr v-if="appointments.length === 0">
                          <td colspan="8" class="text-center text-muted">No Appointments Found</td>
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const router = useRouter()
    const loading = ref(true)
    const doctors = ref([])
    const patients = ref([])
    const appointments = ref([])
    const DsearchQuery = ref('')
    const DsearchType = ref('')
    const PsearchQuery = ref('')
    const PsearchType = ref('')

    async function loadDoctors() {
      const { data } = await api.get('doctors')
      doctors.value = Array.isArray(data) ? data : []
    }

    async function loadPatients() {
      const { data } = await api.get('patients')
      patients.value = Array.isArray(data) ? data : []
    }

    async function loadAppointments() {
      const { data } = await api.get('appointments')
      appointments.value = Array.isArray(data) ? data : []
    }

    async function searchDoctors() {
      const { data } = await api.get(`search/doctors?query=${DsearchQuery.value}&type=${DsearchType.value}`)
      doctors.value = Array.isArray(data) ? data : []
    }

    async function searchPatients() {
      const { data } = await api.get(`search/patients?query=${PsearchQuery.value}&type=${PsearchType.value}`)
      patients.value = Array.isArray(data) ? data : []
    }

    function clearDoctorSearch() {
      DsearchQuery.value = ''
      DsearchType.value = ''
      loadDoctors()
    }

    function clearPatientSearch() {
      PsearchQuery.value = ''
      PsearchType.value = ''
      loadPatients()
    }

    async function deleteDoctor(id) {
      if (!confirm('Are you sure you want to delete this doctor?')) return
      const { data } = await api.delete(`doctor/${id}`)
      alert(data.message)
      loadDoctors()
    }

    async function deletePatient(id) {
      if (!confirm('Are you sure you want to delete this patient?')) return
      const { data } = await api.delete(`patient/${id}`)
      alert(data.message)
      loadPatients()
    }

    async function blacklist(id) {
      const { data } = await api.post(`user/${id}/blacklist`, { user_id: id })
      alert(data.message)
      loadDoctors()
      loadPatients()
    }

    async function removeBlacklist(id) {
      const { data } = await api.delete(`user/${id}/blacklist`)
      alert(data.message)
      loadDoctors()
      loadPatients()
    }

    onMounted(async () => {
      try {
        await Promise.all([loadDoctors(), loadPatients(), loadAppointments()])
      } finally {
        loading.value = false
      }
    })

    return {
      loading, doctors, patients, appointments,
      DsearchQuery, DsearchType, PsearchQuery, PsearchType,
      searchDoctors, searchPatients,
      clearDoctorSearch, clearPatientSearch,
      deleteDoctor, deletePatient,
      blacklist, removeBlacklist
    }
  }
}
</script>

<style scoped>
.section-header {
  padding: 1.5rem;
  border-radius: 0.5rem 0.5rem 0 0;
}

.section-header-blue {
  background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%);
}

.section-header-green {
  background: linear-gradient(135deg, #198754 0%, #20c997 100%);
}

.section-header-cyan {
  background: linear-gradient(135deg, #0dcaf0 0%, #13b0f5 100%);
}

.search-select {
  max-width: 180px;
}

.col-sn {
  width: 8%;
}

.col-name {
  width: 25%;
}

.action-buttons {
  display: flex;
  gap: 3px;
  align-items: center;
  flex-wrap: wrap;
}

.btn-action {
  padding: 0.2rem 0.35rem;
  font-size: 0.7rem;
  line-height: 1.2;
}
</style>
