export default {
  template: `
    <div class="container-fluid wall" style="min-height: 400px;" class="overflow-auto;">
      <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3">
        
        <div v-if="!ready" class="text-center p-5">
          <div class="spinner-border text-primary"></div>
          <p class="mt-2">Loading...</p>
        </div>
        <div v-else>

          <div class="card-header bg-primary text-white d-flex justify-content-between">
            <h4 class="mb-0">Book Appointment</h4>
            <button class="btn btn-sm btn-light" @click="goBack">Back</button>
          </div>
          <div class="card-body">
            <h5 class="mb-4">Available Time Slots</h5>
            <div class="table-responsive">
              <table class="table table-bordered table-striped">
                <thead class="table-dark">
                  <tr>
                    <th>SN</th>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody v-if="ready">
                  <template v-for="(slot, index) in sortedSlots">
                    <tr v-if="slot.id && slot.is_active && isSlotBookedByOther(slot.id)" :key="'other-' + slot.id">
                      <td class="text-muted">{{ index + 1 }}</td>
                      <td class="text-muted">{{ slot.date }}</td>
                      <td class="text-muted">{{ slot.day_of_week }}</td>
                      <td class="text-muted">{{ slot.start_time }}</td>
                      <td class="text-muted">{{ slot.end_time }}</td>
                      <td><span class="badge bg-secondary">Not Available</span></td>
                      <td><button class="btn btn-sm btn-secondary disabled">-</button></td>
                    </tr>

                    <tr v-else-if="slot.id && slot.is_active && isSlotBookedByCurrent(slot.id)" :key="'current-' + slot.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ slot.date }}</td>
                      <td>{{ slot.day_of_week }}</td>
                      <td>{{ slot.start_time }}</td>
                      <td>{{ slot.end_time }}</td>
                      <td><span class="badge bg-danger">Booked</span></td>
                      <td>
                        <button class="btn btn-sm btn-danger ms-2" :disabled="processing" @click="cancelAppointment(getAppointmentBySlot(slot.id))">
                          Delete
                        </button>
                      </td>
                    </tr>

                    <tr v-else-if="slot.id && slot.is_active" :key="'free-' + slot.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ slot.date }}</td>
                      <td>{{ slot.day_of_week }}</td>
                      <td>{{ slot.start_time }}</td>
                      <td>{{ slot.end_time }}</td>
                      <td><span class="badge bg-success">Free</span></td>
                      <td>
                        <button class="btn btn-sm btn-primary ms-2" :disabled="processing" @click="bookAppointment(slot.id)">
                          Book
                        </button>
                      </td>
                    </tr>

                    <tr v-else-if="slot.id && !slot.is_active" :key="'inactive-' + slot.id">
                      <td class="text-muted">{{ index + 1 }}</td>
                      <td class="text-muted">{{ slot.date }}</td>
                      <td class="text-muted">{{ slot.day_of_week }}</td>
                      <td class="text-muted">{{ slot.start_time }}</td>
                      <td class="text-muted">{{ slot.end_time }}</td>
                      <td><span class="badge bg-secondary">Not Available</span></td>
                      <td><button class="btn btn-sm btn-secondary disabled">-</button></td>
                    </tr>
                  </template>
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
  `,
  data() {
    return {
        slots: [],
        doctorId: parseInt(this.$route.params.user_id),   
        departmentName: this.$route.params.department_name,
        appointments: [],
        doctorAppointments: [],
        processing: false,
        ready: false
    };
},
  async mounted() {
    try {
        await Promise.all([
            this.loadSlots(this.doctorId),
            this.loadAppointments(),
            this.loadDoctorAppointments()
        ]);
    } finally {
        this.ready = true;
    }
},
  computed: {
    sortedSlots() {
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return this.slots.slice().sort((a, b) => {
        const da = dayOrder.indexOf(a.day_of_week);
        const db = dayOrder.indexOf(b.day_of_week);
        if (da !== db) return da - db;
        return (a.start_time || '').localeCompare(b.start_time || '');
      });
    }
  },
 methods: {
    loadSlots(doctorId) {
        return authFetchWithRetry(`/api/availability/${doctorId}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(data => { if (data !== null) this.slots = Array.isArray(data) ? data : []; })
        .catch(() => { this.slots = []; });
    },

    loadAppointments() {
        return authFetchWithRetry('/api/appointments', {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(data => { if (data !== null) this.appointments = Array.isArray(data) ? data : []; })
        .catch(() => { this.appointments = []; });
    },

    loadDoctorAppointments() {
        return authFetchWithRetry(`/api/appointments?doctor_id=${this.doctorId}`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(data => { if (data !== null) this.doctorAppointments = Array.isArray(data) ? data : []; })
        .catch(() => { this.doctorAppointments = []; });
    },

    isSlotBookedByCurrent(slotId) {
        if (slotId == null) return false;
        return this.appointments.some(app => String(app.slot_id) === String(slotId) && String(app.status) === 'Booked');
    },

    isSlotBooked(slotId) {
        if (slotId == null) return false;
        return this.doctorAppointments.some(app => String(app.slot_id) === String(slotId) && String(app.status) === 'Booked');
    },

    isSlotBookedByOther(slotId) {
        if (!this.isSlotBooked(slotId)) return false;
        return !this.isSlotBookedByCurrent(slotId);
    },

    getAppointmentBySlot(slotId) {
        const appointment = this.appointments.find(app => String(app.slot_id) === String(slotId) && String(app.status) === 'Booked');
        return appointment ? appointment.id : null;
    },

    bookAppointment(slotId) {
        if (this.isSlotBooked(slotId)) { alert("This slot is no longer available"); return; }
        if (this.processing) return;
        this.processing = true;
        const payload = { doctor_id: this.doctorId, department: this.departmentName, slot_id: slotId };
        return authFetchWithRetry('/api/appointments', {  // ✅ added return
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json().then(data => ({ status: r.status, data }));
        })
        .then(result => {
            if (!result) return;
            const { status, data } = result;
            if (status === 400) { alert("Booking Error: " + (data.message || "Invalid request")); return; }
            if (data.status === 'Booked') {
                alert("Appointment booked successfully!");
                return Promise.all([this.loadAppointments(), this.loadDoctorAppointments()]);
            }
            alert(data.message || "Booking failed");
        })
        .catch(err => { console.error("Booking Error:", err); alert("Network error: " + err.message); })
        .finally(() => { this.processing = false; });
    },

    cancelAppointment(appointmentId) {
        if (!appointmentId) { alert("Appointment not found"); return; }
        if (!confirm("Are you sure you want to delete this appointment?")) return;
        if (this.processing) return;
        this.processing = true;
        authFetchWithRetry(`/api/appointment/${appointmentId}`, {
            method: 'DELETE',
            headers: { "Content-Type": "application/json" }
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (!r.ok) throw new Error('Failed to delete');
            alert("Appointment deleted successfully!");
            return Promise.all([this.loadAppointments(), this.loadDoctorAppointments()]);
        })
        .catch(err => { console.error("Deletion Error:", err); alert("Error deleting appointment"); })
        .finally(() => { this.processing = false; });
    },

    goBack() {
        this.$router.go(-1);
    }
}
}