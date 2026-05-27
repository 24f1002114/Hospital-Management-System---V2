export default {    
    template: `
    <div class="row border d-flex wall" style="height: 700px; overflow: auto;"> 
      <div class="col-12 border p-4" style="overflow-y: auto;">
         <div class="card shadow p-3 bg-white"> 
         
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
                 <h5 class="mb-3">
                   <i class="bi bi-hospital me-2 text-primary"></i>Departments
                 </h5>
                 <div class="table-responsive border rounded" style="max-height: 200px; overflow-y: auto;">
                      <table class="table table-hover table-bordered mb-0">
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
                  <h5 class="mb-3">
                    <i class="bi bi-calendar-check me-2 text-success"></i>Your Appointments
                  </h5>
                  <div class="table-responsive border rounded" style="max-height: 200px; overflow-y: auto;">
                    <table class="table table-hover table-bordered mb-0">
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
                              :disabled="cancelling"
                              @click="cancelAppointment(app.id)">
                              <i class="bi bi-x-circle me-1"></i>{{ cancelling ? 'Cancelling...' : 'Cancel' }}
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
    </div>`,
    data() {
        return {
            departments: [],
            appointments: [],
            cancelling: false,
            patientName:""
        }
    },
    mounted() {
        this.loadDepartments();
        this.loadAppointments();
        this.loadPatientName();
    },
    methods: {
        loadDepartments() {
            authFetch('/api/departments', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(response => response.json())
            .then(data => {
                this.departments = Array.isArray(data) ? data : [];
            })
            .catch(error => {
                console.error('Error loading departments:', error);
                this.departments = [];
            });
        },
        loadAppointments() {
            return authFetch('/api/appointments', {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(response => response.json())
            .then(data => {
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
            if (!window.confirm("Are you sure you want to cancel this appointment?")) {
                return;
            }
            if (this.cancelling) return;
            this.cancelling = true;
            
            authFetch(`/api/appointment/${id}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: 'Cancelled' })
            })
            .then(response => {
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
                this.cancelling = false;
            });
            
        },
        ViewHistory() {
            const patientId = localStorage.getItem('user_id');
            this.$router.push(`/patient/history/${patientId}/All`);
        },
        loadPatientName(){
           authFetch(`/api/patient/${localStorage.getItem('user_id')}`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
        })
        .then(response => response.json())
        .then(data => {this.patientName = data.name})

        }
    }
}