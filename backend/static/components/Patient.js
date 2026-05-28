export default {    
    template: `
    <div class="container-fluid wall" style="min-height: 400px;" class="overflow-auto"> 
      <div class="row">
      <div class="col-12 p-2 p-md-4">
         <div class="card shadow p-2 p-md-3 bg-white"> 

         <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading...</p>
        </div>
        <div v-else>
         
           <!-- Header -->
           <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center mb-3">
             <h5 class="mb-0">
               <i class="bi bi-person-circle me-2"></i>{{patientName}}
             </h5>
             <button class="btn btn-light btn-sm" @click="ViewHistory">
               <i class="bi bi-clock-history me-2"></i>View Treatment History
             </button>
           </div>

           <div class="card-body">

               <!-- Departments Section -->
               <div class="mb-4">
                 <div class="bg-gradient" style="background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%); padding: 0.75rem 1rem; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: 0;">
                   <h5 class="mb-0 text-white">
                     <i class="bi bi-hospital me-2"></i>Departments
                   </h5>
                 </div>
                 <div class="table-responsive border border-top-0 rounded-bottom">
                      <table class="table table-sm table-hover table-bordered mb-0">
                      <thead class="table-dark sticky-top">
                          <tr>
                          <th scope="col" style="width: 10%;" class="text-center">SN</th>
                          <th scope="col" style="width: 35%;">Name</th>
                          <th scope="col" style="width: 55%;" class="text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="(dep, index) in departments" :key="dep.id">
                              <td class="text-center">{{ index + 1 }}</td>
                              <td>
                                <i class="bi bi-building me-2 text-primary"></i>{{ dep.name }}
                              </td>
                              <td class="text-center">
                                  <button class="btn btn-info btn-sm" @click="ViewDepartmentDetails(dep.id)">
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
                  <div class="bg-gradient" style="background: linear-gradient(135deg, #198754 0%, #20c997 100%); padding: 0.75rem 1rem; border-radius: 0.5rem 0.5rem 0 0; margin-bottom: 0;">
                    <h5 class="mb-0 text-white">
                      <i class="bi bi-calendar-check me-2"></i>Your Appointments
                    </h5>
                  </div>
                  <div class="table-responsive border border-top-0 rounded-bottom">
                    <table class="table table-sm table-hover table-bordered mb-0">
                      <thead class="table-dark sticky-top">
                        <tr>
                          <th scope="col" style="width: 5%;" class="text-center">SN</th>
                          <th scope="col" style="width: 15%;">Doctor</th>
                          <th scope="col" style="width: 12%;">Department</th>
                          <th scope="col" style="width: 10%;">Date</th>
                          <th scope="col" style="width: 8%;">Day</th>
                          <th scope="col" style="width: 12%;">Time Slot</th>
                          <th scope="col" style="width: 10%;">Status</th>
                          <th scope="col" style="width: 10%;" class="text-center">Action</th>
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
                            <span v-if="app.status === 'Booked'" class="badge bg-success">{{ app.status }}</span>
                            <span v-else-if="app.status === 'Completed'" class="badge bg-primary">{{ app.status }}</span>
                            <span v-else-if="app.status === 'Cancelled'" class="badge bg-danger">{{ app.status }}</span>
                            <span v-else class="badge bg-secondary">{{ app.status }}</span>
                          </td>
                          <td class="text-center">

                            <button 
                              v-if="app.status === 'Booked'" 
                              class="btn btn-danger btn-sm" 
                              :disabled="cancellingId === app.id"
                              @click="cancelAppointment(app.id)">
                              <i class="bi bi-x-circle me-1"></i>{{ cancellingId === app.id ? 'Cancelling...' : 'Cancel' }}
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
    </div>`,
    data() {
        return {
            loading: true,
            departments: [],
            appointments: [],
            cancellingId: null,
            patientName:""
        }
    },
  async mounted() {
    this.loading = true;
    await Promise.all([
        this.loadDepartments(),
        this.loadAppointments(),
        this.loadPatientName()
    ]);
        this.loading = false;
    },
    methods: {
        loadDepartments() {
            return authFetchWithRetry('/api/departments', {      // ✅ authFetchWithRetry + return
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(r => {
                if (!r) return null;                            // ✅ !r guard
                if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
                return r.json();
            })
            .then(data => {
                if (!data) return;                              // ✅ !data guard
                this.departments = Array.isArray(data) ? data : [];
            })
            .catch(error => {
                console.error('Error loading departments:', error);
                this.departments = [];
            });
        },
        // FIX
        loadAppointments() {
            return authFetchWithRetry('/api/appointments', {     // ✅ authFetchWithRetry + return
                method: 'GET',
                headers: { "Content-Type": "application/json" }
            })
            .then(r => {
                if (!r) return null;                            // ✅ !r guard
                if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
                return r.json();
            })
            .then(data => {
                if (!data) return;                              // ✅ !data guard
                this.appointments = Array.isArray(data) ? data : [];
            })
            .catch(error => {
                console.error('Error loading appointments:', error);
                this.appointments = [];
            });
        },
        ViewDepartmentDetails(id) {
            this.$router.push(`/patient/departments/${id}`);
        },
        
        cancelAppointment(id) {
            if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
                if (this.cancellingId) return;   
                this.cancellingId = id;          
                
            return authFetchWithRetry(`/api/appointment/${id}`, {  // ✅ authFetchWithRetry + return
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: 'Cancelled' })
            })
            .then(response => {
                if (!response) throw new Error('No response');   // ✅ !r guard
                if (response.status === 401) { localStorage.clear(); this.$router.push('/login'); return; }
                if (!response.ok) {
                    throw new Error('Failed to cancel appointment');
                }
                alert("Appointment cancelled successfully!");
                return this.loadAppointments();
            })
            .catch(error => {
                console.error('Error cancelling appointment:', error);
                alert("Error cancelling appointment");
            })
            .finally(() => {
                this.cancellingId = null;
            });
            
        },
        ViewHistory() {
            const patientId = localStorage.getItem('user_id');
            this.$router.push(`/patient/history/${patientId}/All`);
        },
        loadPatientName() {
            return authFetchWithRetry(`/api/patient/${localStorage.getItem('user_id')}`, {  // ✅ authFetchWithRetry + return
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(r => {
                if (!r) return null;                            // ✅ !r guard
                if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
                return r.json();
            })
            .then(data => {
                if (!data) return;                              // ✅ !data guard
                this.patientName = data?.name || 'Patient';
            })
            .catch(err => console.error('Error loading name:', err));
        }
    }
}