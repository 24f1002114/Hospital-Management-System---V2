export default {
    template: `
    <div class="row  wall border d-flex" style="height: 750px; overflow: auto;"> 
      <div class="col-12  p-4 border" style="overflow-y: auto;">
        <div class="card shadow p-3 bg-white"> 
          <div class="card-body">
          <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading...</p>
        </div>
        <div v-else>

          <!-- Registered Doctors -->

          <div class="container-fluid">
           <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="col-3 d-flex justify-content-start align-items-center gap-2">
                <h4 class="mb-0">Registered Doctors</h4>
                <span class="badge bg-primary">{{ doctorCount }}</span>
              </div>
              <div class="col-5 d-flex justify-content-start align-items-center">
                <form class="d-flex" @submit.prevent="searchDoctors">
                  <input class="form-control me-2" type="search" placeholder="Search..." v-model="DsearchQuery"/>
                  <select v-model="DsearchType" class="form-select me-2">
                    <option value="" disabled selected>Search By</option>
                    <option value="specialization">Specialization</option>
                    <option value="name">Doctor Name</option>
                  </select>
                  <button class="btn btn-outline-success" type="submit">Search</button>
                  <button class="btn btn-outline-secondary ms-2" type="button" @click="clearDoctorSearch">Clear</button>
                </form>
              </div>
              <div class="col-4 d-flex justify-content-end align-items-center flex-nowrap gap-2"> 
                <button class="btn btn-primary" @click="$router.push('/add/doctor')">Add Doctor</button>
                <button class="btn btn-secondary" @click="$router.push('/manage/departments')">Manage Departments</button> 
              </div>
            </div>

            <div class="table-responsive overflow-auto" style="max-height: 140px;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark">
                  <tr>
                    <th style="width: 10%;">SN</th>
                    <th style="width: 30%;">Name</th>
                    <th style="width: 60%;">Actions</th>
                  </tr>
                </thead>
                <tbody>

                  <tr v-for="(doc, index) in doctors" :key="doc.id">
                  <template v-if="doc.id">
                    <td>{{ index + 1 }}</td>
                    <td>Dr. {{ doc.name }}</td>
                    <td>
                      <button class="btn btn-primary btn-sm me-2" @click="GetUpdateDoctor(doc.id)">View/Edit</button>
                      <button class="btn btn-danger btn-sm me-2" @click="DeleteDoctor(doc.id)">Delete</button>
                      <button v-if="!doc.blacklisted" class="btn btn-warning btn-sm" @click="Blacklist(doc.id)">Blacklist</button>
                      <button v-if="doc.blacklisted" class="btn btn-secondary btn-sm" @click="RemoveBlacklist(doc.id)">Blacklisted</button>
                    </td>
                     </template>
                  </tr>

                  <tr v-if="doctors.length === 0">
                    <td colspan="3" class="text-center">No Doctors Found : Given Specialization or Name not matched.</td>
                  </tr>  
                </tbody>
              </table>
            </div>
          </div>

          <!-- Registered Patients -->
          <div class="container-fluid mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3"> 
              <div class="col-3 d-flex justify-content-start align-items-center gap-2"> 
                <h4 class="mb-0">Registered Patients</h4>
                <span class="badge bg-success">{{ patientCount }}</span>
              </div>
              <div class="col-9 d-flex justify-content-start align-items-center">
                <form class="d-flex" @submit.prevent="searchPatients">
                  <input class="form-control me-2" type="search" placeholder="Search..." v-model="PsearchQuery"/>
                  <select v-model="PsearchType" class="form-select me-2">
                    <option value="" disabled selected>Search By</option>
                    <option value="id">ID</option>
                    <option value="name">Patient Name</option>
                  </select>
                  <button class="btn btn-outline-success" type="submit">Search</button>
                  <button class="btn btn-outline-secondary ms-2" type="button" @click="clearPatientSearch">Clear</button>
                </form>
              </div>
            </div>

            <div class="table-responsive overflow-auto" style="max-height: 140px;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark">
                  <tr>
                    <th style="width: 10%;">SN</th>
                    <th style="width: 30%;">Name</th>
                    <th style="width: 60%;">Actions</th>
                  </tr>
                </thead>
                <tbody>

                  <tr v-for="(pat, index) in patients" :key="pat.id"> 
                    <template v-if="pat.id">
                      <td>{{ index + 1 }}</td>
                      <td>Mr. {{ pat.name }}</td>
                      <td>
                      <button class="btn btn-primary btn-sm me-2" @click="GetUpdatePatient(pat.id)">View/Edit</button>
                      <button class="btn btn-danger btn-sm me-2" @click="DeletePatient(pat.id)">Delete</button>
                      <button v-if="!pat.blacklisted" class="btn btn-warning btn-sm" @click="Blacklist(pat.id)">Blacklist</button>
                      <button v-if="pat.blacklisted" class="btn btn-secondary btn-sm" @click="RemoveBlacklist(pat.id)">Blacklisted</button>
                     </td>
                     </template>
                  </tr>

                  <tr v-if="patients.length === 0">
                    <td colspan="3" class="text-center">No Patients Found : Given ID or Name not matched.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Upcoming Appointments -->
          <div class="container-fluid mt-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex align-items-center gap-2">
                <h4 class="mb-0">Upcoming/Past Appointments</h4>
                <span class="badge bg-info">{{ appointmentCount }}</span>
              </div>
            </div>

            <div class="table-responsive overflow-auto" style="max-height: 140px;">
              <table class="table table-striped table-bordered">
                <thead class="table-dark">
                  <tr>
                    <th style="width: 5%;">SN</th>
                    <th style="width: 20%;">Patient Name</th>
                    <th style="width: 20%;">Doctor Name</th>
                    <th style="width: 15%;">Department</th>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 8%;">Day</th>
                    <th style="width: 10%;">Time Slot</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 15%;">History</th>
                  </tr>
                </thead>
                <tbody>
                
                  <tr v-for="(app, index) in appointments" :key="app.id">
                  <template v-if="app.id">
                    <td>{{ index + 1 }}</td>
                    <td>Mr. {{ app.patient_name }}</td>
                    <td>Dr. {{ app.doctor_name }}</td>
                    <td>{{ app.department }}</td>
                    <td>{{ app.slot_details ? app.slot_details.date : 'N/A' }}</td>
                    <td>{{ app.slot_details ? app.slot_details.day_of_week : 'N/A' }}</td>
                    <td>{{ app.slot_details ? app.slot_details.start_time + ' - ' + app.slot_details.end_time : 'N/A' }}</td>
                    <td>
                      <span v-if="app.status === 'Booked'" class="badge bg-success">{{ app.status }}</span>
                      <span v-else-if="app.status === 'Completed'" class="badge bg-primary">{{ app.status }}</span>
                      <span v-else-if="app.status === 'Cancelled'" class="badge bg-danger">{{ app.status }}</span>
                      <span v-else class="badge bg-secondary">{{ app.status }}</span>
                    </td>
                    <td>
                      <button class="btn btn-info btn-sm" @click="viewPatientHistory(app.patient_id, app.department)">View</button>
                    </td>
                    </template>

                  </tr>
                  <tr v-if="appointments.length === 0">
                    <td colspan="9" class="text-center">No Appointments Found</td>
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
           return authFetch('/api/doctors', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(r => {
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return []; }
            return r.json();
              })
              .then(d => this.doctors = Array.isArray(d) ? d : []);

        },
        loadPatients(){
            return authFetch('/api/patients', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(r => {
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return []; }
            return r.json();
              })
              .then(d => this.patients = Array.isArray(d) ? d : []);
        },
        loadAppointments(){
           return authFetch('/api/appointments', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(r => {
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return []; }
            if (r.status === 404) { return []; } 
            return r.json();
              })
            .then(d => this.appointments = Array.isArray(d) ? d : []);
        },
        searchDoctors() {
            authFetch(`/api/search/doctors?query=${this.DsearchQuery}&type=${this.DsearchType}`, {
                method: 'GET',
                headers: {
                  "Content-Type": "application/json",
                }
            })
            .then(r => {
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return []; }
            return r.json();
              })
              .then(d => this.doctors = Array.isArray(d) ? d : [])
              .catch(err => console.error("Search Error:", err));
        },
        clearDoctorSearch() {
            this.DsearchQuery = '';
            this.DsearchType = '';
            this.loadDoctors();
        },
        searchPatients() {
            authFetch(`/api/search/patients?query=${this.PsearchQuery}&type=${this.PsearchType}`, {
                method: 'GET',
                headers: {
                  "Content-Type": "application/json",
                }
            })
            .then(r => {
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return []; }
            return r.json();
              })
              .then(d => this.patients = Array.isArray(d) ? d : [])
              .catch(err => console.error("Search Error:", err));
        },
        clearPatientSearch() {
            this.PsearchQuery = '';
            this.PsearchType = '';
            this.loadPatients();  
        },
        GetUpdateDoctor(user_id){
          this.$router.push({path: `/update/doctor/${user_id}`});
        },
        DeleteDoctor(user_id){
          if (!confirm("Are you sure you want to delete this doctor?")) return;
          authFetch(`/api/doctor/${user_id}`, {
              method: 'DELETE',
              headers: {
                  "Content-Type": "application/json",
              }
          })
          .then(r => r.json())
          .then(d => {
              alert(d.message);
              this.loadDoctors();
          })
          .catch(err => console.error("Delete Doctor Error:", err));
        },
        GetUpdatePatient(user_id){
          this.$router.push({path: `/update/patient/${user_id}`});
        },
        DeletePatient(user_id){
          if (!confirm("Are you sure you want to delete this patient?")) return;
          authFetch(`/api/patient/${user_id}`, {
              method: 'DELETE',
              headers: {
                  "Content-Type": "application/json",
              }
          })
          .then(r => r.json())
          .then(d => {
              alert(d.message);
              this.loadPatients();
          })
          .catch(err => console.error("Delete Patient Error:", err));
        },
        Blacklist(user_id){
            authFetch(`/api/user/${user_id}/blacklist`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id })
            })
            .then(r => r.json())
            .then(d => {
                alert(d.message);
                this.loadDoctors();
                this.loadPatients();
            })
            .catch(err => console.error("Blacklist Error:", err));
        },
        RemoveBlacklist(user_id){
            authFetch(`/api/user/${user_id}/blacklist`, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ user_id })
            })
            .then(r => r.json())
            .then(d => {
                alert(d.message);
                this.loadDoctors();
                this.loadPatients();
            })
            .catch(err => console.error("Remove Blacklist Error:", err));
        },
        viewPatientHistory(patientId, department) {
            this.$router.push({ path: `/patient/history/${patientId}/${department}` });
        }
    }
}

