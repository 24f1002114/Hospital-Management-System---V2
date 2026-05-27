export default {
  template: `
    <div class="row border d-flex wall" style="height: 700px; overflow: auto;">
      <div class="col-12 border p-4 d-flex align-items-center justify-content-center" style="overflow-y: auto;">
        <div class="card shadow p-4 bg-white" style="min-height: 600px; width: 800px;">
          <div class="card-body">

            <!-- Loading -->
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary"></div>
              <p class="mt-3">Loading doctor profile...</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="alert alert-danger text-center">
              {{ error }}
            </div>

            <!-- Doctor Details -->
            <div v-else>
              <div class="row">
                <!-- Left: Doctor Info -->
                <div class="col-md-8">
                  <h3 class="mb-3">Dr. {{ doctor.name }}</h3>
                  <p class="mb-2"><strong>{{ doctor.degree }}</strong></p>
                  <p class="mb-2">{{ doctor.specialization }}</p>
                  <p class="mb-3">
                    {{ doctor.years_of_experience }} Years Experience Overall
                  </p>
                  <p class="text-muted">{{ doctor.bio }}</p>
                  <p v-if="doctor.blacklisted" class="text-danger fw-bold mt-3">
                    ⚠ This doctor is currently blacklisted.
                  </p>
                </div>

                <!-- Right: Avatar -->
                <div class="col-md-4 text-center">
                  <div class="bg-secondary rounded-circle d-inline-flex justify-content-center align-items-center" 
                       style="width: 140px; height: 140px;">
                    <i class="bi bi-person-circle text-white" style="font-size: 80px;"></i>
                  </div>
                </div>
              </div>

              <!-- Buttons -->
              <div class="d-flex gap-2 mt-4">
                <button class="btn btn-primary" @click="goAvailability" :disabled="doctor.blacklisted">
                  Check Availability
                </button>
                <button class="btn btn-secondary" @click="goBack">
                  Go Back
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      doctorId: null,
      doctor: {},
      loading: true,
      error: null
    };
  },

  created() {
    this.doctorId = this.$route.params.id || this.$route.params.doctor_id;
    this.loadDoctor();
  },

  methods: {
   loadDoctor() {
  this.loading = true;
  
  authFetch(`/api/doctor/${this.doctorId}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to load doctor');
      return response.json();
    })
    .then(data => {
      this.doctor = {
        name: data.name || 'Unknown',
        degree: data.degree || 'N/A',
        specialization: data.specialization || 'General',
        years_of_experience: data.years_of_experience || 0,
        bio: data.bio || 'No bio available.',
        blacklisted: data.blacklisted || false,
        departments: data.departments || [] 
      };
    })
    .catch(error => {
      this.error = error.message;
    })
    .finally(() => {
      this.loading = false;
    });
},

goAvailability() {
  if (!this.doctor.departments || this.doctor.departments.length === 0) {
    alert('Doctor does not have any department assigned');
    return;
  }
  
  const deptId = this.doctor.departments[0];
  
  authFetch(`/api/department/${deptId}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to load department');
      return res.json();
    })
    .then(deptData => {
      this.$router.push({ 
        path: `/availability/${this.doctorId}/${encodeURIComponent(deptData.name)}` 
      });
    })
    .catch(err => {
      console.error('Error:', err);
      alert('Unable to load department information');
    });
},

    goBack() {
      this.$router.go(-1);
    }
  }
};