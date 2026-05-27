export default {
  template: `
  <div class="row wall border d-flex" style="height: 700px; overflow: auto;">
    <div class="col-12 p-4 border" style="overflow-y: auto;">
      <div class="card shadow p-3 bg-white">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0"><i class="bi bi-person-badge me-2"></i>Dr. {{ doctorName }}</h5>
          <button class="btn btn-light btn-sm" @click="createAvailability">
            <i class="bi bi-calendar-plus me-1"></i>Create Availability
          </button>
        </div>

        <div class="card-body">
          <h6 class="mb-3"><i class="bi bi-calendar-check me-2 text-primary"></i> Past/Upcoming appointments</h6>

          <div class="table-responsive border rounded" style="max-height: 520px; overflow-y: auto;">
            <table class="table table-hover table-bordered mb-0">
              <thead class="table-dark sticky-top">
                <tr>
                  <th style="width:5%;" class="text-center">SN</th>
                  <th style="width:15%;">Patient</th>
                  <th style="width:12%;">Department</th>
                  <th style="width:12%;">Date</th>
                  <th style="width:10%;">Status</th>
                  <th style="width:10%;" class="text-center">Treatment</th>
                  <th style="width:26%;" class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(app, index) in appointments" :key="app.id">
                  <td class="text-center">{{ index + 1 }}</td>
                  <td><i class="bi bi-person me-1 text-success"></i>{{ app.patient_name }}</td>
                  <td>{{ app.department }}</td>
                  <td>{{ app.slot_details ? app.slot_details.date : 'N/A' }}</td>
                  <td>
                    <span v-if="app.status === 'Booked'" class="badge bg-success">{{ app.status }}</span>
                    <span v-else-if="app.status === 'Cancelled'" class="badge bg-danger">{{ app.status }}</span>
                    <span v-else-if="app.status === 'Completed'" class="badge bg-info">{{ app.status }}</span>
                    <span v-else class="badge bg-secondary">{{ app.status }}</span>
                  </td>
                  <td class="text-center">
                    <button v-if="app.status === 'Booked'" class="btn btn-info btn-sm" @click="updateHistory(app.id)">
                      <i class="bi bi-plus-circle me-1"></i>Add
                    </button>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td class="text-center">
                    <div class="d-inline-flex gap-2 flex-wrap justify-content-center">
                      <button class="btn btn-secondary btn-sm" @click="loadPatientHistory(app.patient_id, app.department)">
                        <i class="bi bi-clock-history me-1"></i>View History
                      </button>
                      <button v-if="app.status === 'Booked'" class="btn btn-danger btn-sm" :disabled="cancelling" @click="cancelAppointment(app.id)">
                        <i class="bi bi-x-circle me-1"></i>{{ cancelling ? 'Cancelling...' : 'Cancel' }}
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="appointments.length === 0">
                  <td colspan="7" class="text-center text-muted py-3">
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
  `,
  data() {
    return {
      appointments: [],
      cancelling: false,
      doctorName: ""
    };
  },
  mounted() {
    this.loadAppointments();
    this.loadDoctorName();
  },
  methods: {
    createAvailability() {
      const id = localStorage.getItem('user_id');
      this.$router.push({ path: `/create/availability/${id}` });
    },
    loadAppointments() {
      authFetch('/api/appointments', {
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
    .then(data => { this.appointments = Array.isArray(data) ? data : []; })
    .catch(() => { this.appointments = []; });
    
  },
    cancelAppointment(id) {
      if (!confirm("Cancel this appointment?")) return;
      if (this.cancelling) return;
      this.cancelling = true;
      authFetch(`/api/appointment/${id}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: 'Cancelled' })
      })
        .then(r => {
          if (!r.ok) throw new Error();
          alert("Cancelled successfully");
          return this.loadAppointments();
        })
        .catch(() => alert("Error cancelling"))
        .finally(() => { this.cancelling = false; });
    },
    loadPatientHistory(patientId, department) {
      this.$router.push({ path: `/patient/history/${patientId}/${department}` });
    },
    updateHistory(appointmentId) {
      this.$router.push({ path: `/update/patient/history/${appointmentId}` });
    },
    loadDoctorName(id) {
      const doctorId = id || localStorage.getItem('user_id') || this.$route.params.user_id;
      if (!doctorId) {
        this.doctorName = "";
        return;
      }
      authFetch(`/api/doctor/${doctorId}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        }
      })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch doctor');
        return r.json();
      })
      .then(data => {
        this.doctorName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
      })
      .catch(() => { this.doctorName = "Unknown Doctor"; });
    }
  }
};