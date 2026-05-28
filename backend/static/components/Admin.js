export default {
    template: `
    <div class="container-fluid wall" style="min-height: 400px;" class="overflow-auto">
      <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3 bg-white"> 
          <div class="card-body">
          <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading...</p>
        </div>
        <div v-else>

          <!-- Registered Doctors -->
          <div class="container-fluid mb-5">
            <div class="bg-gradient" style="background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%); padding: 1.5rem; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: 0;">
              <h4 class="mb-0 text-white fw-bold"><i class="bi bi-people-fill me-2"></i>Doctors <span class="badge bg-white text-primary fs-6">{{ doctorCount }}</span></h4>
            </div>
            <div class="border border-top-0 rounded-bottom p-4">
              <div class="row mb-4 align-items-end g-3">
                <div class="col-12 col-lg-6">
                  <form class="d-flex flex-column flex-md-row gap-3" @submit.prevent="searchDoctors">
                    <input class="form-control" type="search" placeholder="Search..." v-model="DsearchQuery"/>
                    <select v-model="DsearchType" class="form-select" style="max-width: 180px;">
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

            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark" style="position: sticky; top: 0;">
                  <tr>
                    <th style="width: 8%;">SN</th>
                    <th style="width: 25%;">Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(doc, index) in doctors" :key="doc.id">
                  <template v-if="doc.id">
                    <td>{{ index + 1 }}</td>
                    <td>Dr. {{ doc.name }}</td>
                    <td class="text-nowrap" style="display: flex; gap: 3px; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-primary" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="GetUpdateDoctor(doc.id)">Edit</button>
                      <button class="btn btn-danger" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="DeleteDoctor(doc.id)">Del</button>
                      <button v-if="!doc.blacklisted" class="btn btn-warning" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="Blacklist(doc.id)">Block</button>
                      <button v-if="doc.blacklisted" class="btn btn-secondary" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="RemoveBlacklist(doc.id)">Unblock</button>
                    </td>
                     </template>
                  </tr>
                  <tr v-if="doctors.length === 0">
                    <td colspan="3" class="text-center text-muted">No Doctors Found</td>
                  </tr>  
                </tbody>
              </table>
            </div>
          </div>

          <!-- Registered Patients -->
          <div class="container-fluid mb-5">
            <div class="bg-gradient" style="background: linear-gradient(135deg, #198754 0%, #20c997 100%); padding: 1.5rem; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: 0;">
              <h4 class="mb-0 text-white fw-bold"><i class="bi bi-person-hearts me-2"></i>Patients <span class="badge bg-white text-success fs-6">{{ patientCount }}</span></h4>
            </div>
            <div class="border border-top-0 rounded-bottom p-4">
              <div class="row mb-4 align-items-end g-3">
                <div class="col-12 col-lg-6">
                  <form class="d-flex flex-column flex-md-row gap-3" @submit.prevent="searchPatients">
                    <input class="form-control" type="search" placeholder="Search..." v-model="PsearchQuery"/>
                    <select v-model="PsearchType" class="form-select" style="max-width: 180px;">
                      <option value="" disabled selected>By</option>
                      <option value="id">ID</option>
                      <option value="name">Name</option>
                    </select>
                    <button class="btn btn-outline-success" type="submit">Search</button>
                    <button class="btn btn-outline-secondary" type="button" @click="clearPatientSearch">Clear</button>
                  </form>
                </div>
              </div>

            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark" style="position: sticky; top: 0;">
                  <tr>
                    <th style="width: 8%;">SN</th>
                    <th style="width: 25%;">Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(pat, index) in patients" :key="pat.id"> 
                    <template v-if="pat.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ pat.name }}</td>
                      <td class="text-nowrap" style="display: flex; gap: 3px; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-primary" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="GetUpdatePatient(pat.id)">Edit</button>
                      <button class="btn btn-danger" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="DeletePatient(pat.id)">Del</button>
                      <button v-if="!pat.blacklisted" class="btn btn-warning" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="Blacklist(pat.id)">Block</button>
                      <button v-if="pat.blacklisted" class="btn btn-secondary" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="RemoveBlacklist(pat.id)">Unblock</button>
                     </td>
                     </template>
                  </tr>
                  <tr v-if="patients.length === 0">
                    <td colspan="3" class="text-center text-muted">No Patients Found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Upcoming Appointments -->
          <div class="container-fluid mt-5">
            <div class="bg-gradient" style="background: linear-gradient(135deg, #0dcaf0 0%, #13b0f5 100%); padding: 1.5rem; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: 0;">
              <h4 class="mb-0 text-white fw-bold"><i class="bi bi-calendar2-check me-2"></i>Appointment List <span class="badge bg-white text-info fs-6">{{ appointmentCount }}</span></h4>
            </div>
            <div class="border border-top-0 rounded-bottom p-3">

            <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark" style="position: sticky; top: 0;">
                  <tr>
                    <th style="width: 5%;">SN</th>
                    <th style="width: 15%;">Patient</th>
                    <th style="width: 15%;">Doctor</th>
                    <th style="width: 12%;">Dept</th>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 8%;">Time</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 10%;">History</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(app, index) in appointments" :key="app.id">
                  <template v-if="app.id">
                    <td>{{ index + 1 }}</td>
                    <td><small>{{ app.patient_name }}</small></td>
                    <td><small>{{ app.doctor_name }}</small></td>
                    <td><small>{{ app.department }}</small></td>
                    <td><small>{{ app.slot_details ? app.slot_details.date : 'N/A' }}</small></td>
                    <td><small>{{ app.slot_details ? app.slot_details.start_time : 'N/A' }}</small></td>
                    <td>
                      <span v-if="app.status === 'Booked'" class="badge bg-success">✓</span>
                      <span v-else-if="app.status === 'Completed'" class="badge bg-primary">✓</span>
                      <span v-else-if="app.status === 'Cancelled'" class="badge bg-danger">✗</span>
                      <span v-else class="badge bg-secondary">?</span>
                    </td>
                    <td class="text-center">
                      <button class="btn btn-info" style="padding: 0.2rem 0.35rem; font-size: 0.7rem; line-height: 1.2;" @click="viewPatientHistory(app.patient_id, app.department)">View</button>
                    </td>
                    </template>
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
    </div>`,

    data() {
        return {
            loading: true,
            doctors: [],
            patients: [],
            appointments: [],
            DsearchQuery: '',
            DsearchType: '',
            PsearchQuery: '',
            PsearchType: ''
        }
    },
    computed: {
        doctorCount() { return this.doctors.length; },
        patientCount() { return this.patients.length; },
        appointmentCount() { return this.appointments.length; }
    },
   async mounted() {
       this.loading = true;
       await Promise.all([
          this.loadDoctors(),
          this.loadPatients(),
          this.loadAppointments()
       ]);
       this.loading = false;
    },
    methods: {
    loadDoctors(){
        return authFetchWithRetry('/api/doctors', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => { if (d !== null) this.doctors = Array.isArray(d) ? d : []; });
    },

    loadPatients(){
        return authFetchWithRetry('/api/patients', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => { if (d !== null) this.patients = Array.isArray(d) ? d : []; });
    },

    loadAppointments(){
        return authFetchWithRetry('/api/appointments', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (r.status === 404) return [];
            return r.json();
        })
        .then(d => { if (d !== null) this.appointments = Array.isArray(d) ? d : []; });
    },

    searchDoctors(){
        return authFetchWithRetry(`/api/search/doctors?query=${this.DsearchQuery}&type=${this.DsearchType}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => { if (d !== null) this.doctors = Array.isArray(d) ? d : []; })
        .catch(err => console.error("Search Error:", err));
    },

    searchPatients(){
        return authFetchWithRetry(`/api/search/patients?query=${this.PsearchQuery}&type=${this.PsearchType}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => { if (d !== null) this.patients = Array.isArray(d) ? d : []; })
        .catch(err => console.error("Search Error:", err));
    },

    clearDoctorSearch(){
        this.DsearchQuery = '';
        this.DsearchType = '';
        this.loadDoctors();
    },

    clearPatientSearch(){
        this.PsearchQuery = '';
        this.PsearchType = '';
        this.loadPatients();
    },

    GetUpdateDoctor(user_id){
        this.$router.push({ path: `/update/doctor/${user_id}` });
    },

    DeleteDoctor(user_id){
        if (!confirm("Are you sure you want to delete this doctor?")) return;
        return authFetchWithRetry(`/api/doctor/${user_id}`, {
            method: 'DELETE',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => {
            if (!d) return;
            alert(d.message);
            this.loadDoctors();
        })
        .catch(err => console.error("Delete Doctor Error:", err));
    },

    GetUpdatePatient(user_id){
        this.$router.push({ path: `/update/patient/${user_id}` });
    },

    DeletePatient(user_id){
        if (!confirm("Are you sure you want to delete this patient?")) return;
        return authFetchWithRetry(`/api/patient/${user_id}`, {
            method: 'DELETE',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => {
            if (!d) return;
            alert(d.message);
            this.loadPatients();
        })
        .catch(err => console.error("Delete Patient Error:", err));
    },

    Blacklist(user_id){
        return authFetchWithRetry(`/api/user/${user_id}/blacklist`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id })
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => {
            if (!d) return;
            alert(d.message);
            this.loadDoctors();
            this.loadPatients();
        })
        .catch(err => console.error("Blacklist Error:", err));
    },

    RemoveBlacklist(user_id){
        return authFetchWithRetry(`/api/user/${user_id}/blacklist`, {
            method: 'DELETE',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id })
        })
        .then(r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(d => {
            if (!d) return;
            alert(d.message);
            this.loadDoctors();
            this.loadPatients();
        })
        .catch(err => console.error("Remove Blacklist Error:", err));
    },

    viewPatientHistory(patientId, department){
        this.$router.push({ path: `/patient/history/${patientId}/${department}` });
    }
}
}

