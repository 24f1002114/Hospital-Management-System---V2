export default {
  template: `
    <div class="row border d-flex wall" style="height: 700px; overflow: auto;">
      <div class="col-12 border p-4" style="overflow-y: auto;">
        <div class="card shadow p-3 bg-white">
          
          <!-- Header with Back Button -->
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Department Details</h5>
            <button class="btn btn-light btn-sm" @click="goBack">
              <i class="bi bi-arrow-left me-1"></i>Back
            </button>
          </div>

          <div class="card-body">
            <!-- Loading State -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-3">Loading department details...</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
            </div>

            <!-- Content -->
            <div v-else>
              <!-- Department Name -->
              <div class="mb-4">
                <h3 class="text-primary border-bottom pb-2">
                  <i class="bi bi-hospital me-2"></i>{{ department.name }}
                </h3>
              </div>

              <!-- Overview Section -->
              <div class="mb-4">
                <h5 class="mb-3">
                  <i class="bi bi-info-circle me-2"></i>Overview
                </h5>
                <div class="p-3 bg-light rounded border" style="max-height: 120px; overflow-y: auto;">
                  <p class="mb-0 text-justify">{{ department.description || 'No description available.' }}</p>
                </div>
              </div>

              <!-- Doctors List Section -->
              <div class="mb-3">
                <h5 class="mb-3">
                  <i class="bi bi-people me-2"></i>Available Doctors ({{ doctors.length }})
                </h5>
              </div>

              <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                <table class="table table-hover table-bordered">
                  <thead class="table-dark sticky-top">
                    <tr>
                      <th style="width: 8%;" class="text-center">SN</th>
                      <th style="width: 30%;">Doctor Name</th>
                      <th style="width: 62%;" class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(doctor, index) in doctors" :key="doctor.id">
                      <td class="text-center">{{ index + 1 }}</td>
                      <td>
                        <i class="bi bi-person-badge me-2 text-primary"></i>Dr. {{ doctor.name }}
                      </td>
                      <td class="text-center">
                        <button class="btn btn-primary btn-sm me-2" @click="CheckAvailability(doctor.id)">
                          <i class="bi bi-calendar-check me-1"></i>Check Availability
                        </button>
                        <button class="btn btn-info btn-sm" @click="viewDetails(doctor.id)">
                          <i class="bi bi-eye me-1"></i>View Profile
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!doctors.length">
                      <td colspan="3" class="text-center text-muted py-4">
                        <i class="bi bi-inbox me-2"></i>No doctors available in this department
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
  `,
  data() {
    return {
      department: {},
      doctors: [],
      loading: true,
      error: null
    };
  },
 async mounted() {
    await this.loadDepartmentDetails(this.$route.params.id);
},
methods: {
    loadDepartmentDetails(id) {
        this.loading = true;
        return authFetchWithRetry(`/api/department/${id}`, {
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => {
            if (!res) return null;                          // ✅ !r guard
            if (res.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (!res.ok) throw new Error('Failed to load department');
            return res.json();
        })
        .then(data => {
            if (!data) return;                             // ✅ null guard
            this.department = data;
            this.doctors = data.doctors || [];
        })
        .catch(err => {
            this.error = err.message || 'Failed to load department details';
        })
        .finally(() => {
            this.loading = false;
        });
    },

    CheckAvailability(id) {
        this.$router.push(`/availability/${id}/${encodeURIComponent(this.department.name)}`);
    },

    viewDetails(id) {
        this.$router.push(`/doctor/${id}`);
    },

    goBack() {
        this.$router.go(-1);
    }
}
};