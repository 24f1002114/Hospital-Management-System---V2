export default {
  template: `
    <div class="row  wall border d-flex" style="height: 700px; overflow: auto;"> 
      <div class="col-12  p-4 border" style="overflow-y: auto;">

        <div class="card shadow">
        <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-success"></div>
            <p class="mt-2">Loading...</p>
        </div>
        <div v-else>
          
          <!-- Header -->
          <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 class="mb-0">Manage Your Availability</h4>
              <small>Set when you're available to see patients</small>
            </div>
            <button class="btn btn-light btn-sm" @click="$router.go(-1)">Back</button>
          </div>

          <div class="card-body">
          
            <!-- ADD NEW SLOT SECTION -->
            <div class="border rounded p-3 mb-4 bg-light">
              <h5 class="mb-3">Add New Time Slot</h5>
              
              <div class="row g-3">
                <div class="col-md-2">
                  <label class="form-label">Date:</label>
                  <input type="date" class="form-control" v-model="newSlot.date">
                </div>

                <div class="col-md-2">
                  <label class="form-label">Day:</label>
                  <input type="text" class="form-control" v-model="newSlot.day_of_week" readonly>
                </div>
                
                <div class="col-md-2">
                  <label class="form-label">From:</label>
                  <input type="time" class="form-control" v-model="newSlot.start_time">
                </div>
                
                <div class="col-md-2">
                  <label class="form-label">To:</label>
                  <input type="time" class="form-control" v-model="newSlot.end_time">
                </div>
                
                <div class="col-md-2">
                  <label class="form-label">Status:</label>
                  <select class="form-select" v-model="newSlot.is_active">
                    <option :value="true">Active</option>
                    <option :value="false">Inactive</option>
                  </select>
                </div>

                <div class="col-md-2 mt-3 text-end">
                  <label class="form-label d-block invisible">.</label>
                  <button class="btn btn-success" @click="addSlot">Add Slot</button>
                </div>
              </div>
            </div>

            <!-- YOUR SCHEDULE TABLE -->
            <div>
              <h5 class="mb-1">Your Current Schedule</h5>
              
              <div v-if="slots.length === 0" class="alert alert-info">
                No slots added yet. Add your first availability slot above!
              </div>
              
              <div v-else class="table-responsive overflow-auto" style="max-height: 300px;">
                <table class="table table-striped table-bordered">
                  <thead class="table-dark">
                    <tr>
                      <th>SN</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(slot, index) in sortedSlots" :key="slot.id">
                      <td>{{ index + 1 }}</td>
                      <td>{{ slot.date }}</td>
                      <td>{{ slot.day_of_week }}</td>
                      <td>{{ slot.start_time }}</td>
                      <td>{{ slot.end_time }}</td>
                      <td>
                        <span class="badge" :class="slot.is_active ? 'bg-success' : 'bg-secondary'">
                          {{ slot.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-danger" @click="deleteSlot(slot.id)">Delete</button>
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
      slots: [],
      newSlot: {
        date: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
        is_active: true
      }
    };
  },

  watch: {
    "newSlot.date"(newDate) {
      if (!newDate) return;
      const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      const [year, month, day] = newDate.split('-').map(Number);
      const dayIndex = new Date(year, month - 1, day).getDay(); 
      this.newSlot.day_of_week = dayNames[dayIndex];
    }
  },

  computed: {
    sortedSlots() {
      const dayOrder = {
        'Monday': 1,'Tuesday': 2,'Wednesday': 3,'Thursday': 4,
        'Friday': 5,'Saturday': 6,'Sunday': 7
      };
      return [...this.slots].sort((a, b) => {
        if (dayOrder[a.day_of_week] !== dayOrder[b.day_of_week]) {
          return dayOrder[a.day_of_week] - dayOrder[b.day_of_week];
        }
        return a.start_time.localeCompare(b.start_time);
      });
    }
  },

  async mounted() {
    this.loading = true;
    await this.loadSlots();
    this.loading = false;
},

  methods: {
    loadSlots() {
        return authFetchWithRetry('/api/availabilities', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (r.status === 403) { return null; }
            return r.json();
        })
        .then(data => {
            if (!data) return;                              // ✅ !data guard
            if (data !== null) this.slots = Array.isArray(data) ? data : [];
        })
        .catch(() => { this.slots = []; });
    },

    addSlot() {
        if (!this.newSlot.day_of_week || !this.newSlot.start_time || !this.newSlot.end_time || !this.newSlot.date) {
            alert('Please fill all fields!');
            return;
        }
        if (this.newSlot.start_time >= this.newSlot.end_time) {
            alert('End time must be after start time!');
            return;
        }
        return authFetchWithRetry('/api/availabilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.newSlot)
        })
        .then(async r => {
            if (!r) return null;                            // ✅ !r guard
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            const body = await r.json();
            if (!r.ok) { alert(body.message || 'Failed to add slot'); return; }
            alert('Slot added successfully!');
            this.newSlot = { date: '', day_of_week: '', start_time: '', end_time: '', is_active: true };
            return this.loadSlots();
        })
        .catch(() => alert('Failed to add slot'));
    },

    deleteSlot(id) {
        if (!confirm('Are you sure you want to delete this slot?')) return;
        return authFetchWithRetry(`/api/doctor/availability/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(r => {
            if (!r) return null;
            if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return r.json();
        })
        .then(data => {
            if (!data) return;                              // ✅ !data guard
            alert('Slot deleted successfully!');
            this.loadSlots();
        })
        .catch(() => alert('Failed to delete slot'));
    }
}
}