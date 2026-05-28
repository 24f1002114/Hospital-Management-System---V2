export default {
  template: `
  <div class="container-fluid wall" style="min-height: 400px;" class="overflow-auto;">
    <div class="row">
    <div class="col-12 p-2 p-md-4">
      <div class="card shadow p-2 p-md-3 bg-white">

      <div v-if="loading" class="text-center p-5">
          <div class="spinner-border text-primary"></div>
          <p class="mt-2">Loading...</p>
      </div>
      <div v-else>
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0"><i class="bi bi-person-badge me-2"></i>Dr. {{ doctorName }}</h5>
          <button class="btn btn-light btn-sm" @click="createAvailability">
            <i class="bi bi-calendar-plus me-1"></i>Create Availability
          </button>
        </div>

        <div class="card-body">
          <div class="bg-gradient" style="background: linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%); padding: 1rem; border-radius: 0.5rem 0.5rem 0 0; margin: -2rem -2rem 1rem -2rem;">
            <h6 class="mb-0 text-white"><i class="bi bi-calendar-check me-2"></i>Past/Upcoming Appointments</h6>
          </div>

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
                      <button v-if="app.status === 'Booked'" class="btn btn-danger btn-sm" :disabled="cancellingId === app.id" @click="cancelAppointment(app.id)">
                        <i class="bi bi-x-circle me-1"></i>{{ cancellingId === app.id ? 'Cancelling...' : 'Cancel' }}
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
      </div>
    </div>
  `,
  data() {
    return {
      loading: true,
      appointments: [],
      cancellingId: null,
      doctorName: ""
    };
  },
  async mounted() {
    this.loading = true;
    await Promise.all([
        this.loadAppointments(),
        this.loadDoctorName()
    ]);
    this.loading = false;
  },
methods: {
    createAvailability() {
        const id = localStorage.getItem('user_id');
        this.$router.push({ path: `/create/availability/${id}` });
    },

    loadAppointments() {
        return authFetchWithRetry('/api/appointments', {  // ✅ added return
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                          // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (r.status === 404) { return []; }
            return r.json();
        })
        .then(data => { 
            if (data !== null) this.appointments = Array.isArray(data) ? data : []; // ✅ null guard
        })
        .catch(() => { this.appointments = []; });
    },

    cancelAppointment(id) {
        if (!confirm("Cancel this appointment?")) return;
        if (this.cancellingId) return;
        this.cancellingId = id;
        return authFetchWithRetry(`/api/appointment/${id}`, {  // ✅ authFetchWithRetry + return
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: 'Cancelled' })
        })
        .then(r => {
            if (!r) return null;                          // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (!r.ok) throw new Error();
            alert("Cancelled successfully");
            return this.loadAppointments();
        })
        .catch(() => alert("Error cancelling"))
        .finally(() => { this.cancellingId = null; });
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
        return authFetchWithRetry(`/api/doctor/${doctorId}`, {  // ✅ authFetchWithRetry + return
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;                          // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (!r.ok) throw new Error('Failed to fetch doctor');
            return r.json();
        })
        .then(data => {
            if (!data) return;                            // ✅ null guard
            this.doctorName = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
        })
        .catch(() => { this.doctorName = "Unknown Doctor"; });
    }
}
};