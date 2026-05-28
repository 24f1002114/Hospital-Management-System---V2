export default {
  template: `
    <div class="container-fluid wall" style="min-height: 400px;" class="overflow-auto"> 
      <div class="row">
      <div class="col-12 p-2 p-md-4">
        <div class="card shadow p-2 p-md-3 bg-white"> 
          <div class="card-body">

            <!-- Header -->
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 class="mb-0">Treatment History</h4>
             
              <button class="btn btn-light btn-sm" @click="goBack">Back</button>
            </div>

            <!-- Body -->
            <div class="card-body">
              <!-- Loading State -->
              <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-3">Loading your history...</p>
              </div>

              <!-- Loaded State -->
              <div v-else>
                <!-- Patient Info Card -->
                <div v-if="patientInfo" class="card mb-4 bg-light">
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-4">
                        <strong>Patient Name:</strong> {{ patientInfo.patient_name }}
                      </div>
                      <div class="col-md-4">
                        <strong>Department:</strong> {{ displayDepartment }}
                      </div>
                      <div class="col-md-4">
                        <strong>Total Visits:</strong> {{ treatments.length }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Treatment Records -->
                <div v-if="treatments.length > 0">
                  <div class="table-responsive" style="max-height: 430px; overflow-y: auto;">
                    <table class="table table-hover table-bordered">
                      <thead class="table-dark sticky-top">
                        <tr>
                          <th class="text-center" style="width: 5%;">Visit</th>
                          <th style="width: 15%;">Doctor</th>
                          <th style="width: 12%;">Department</th>
                          <th style="width: 10%;">Visit Type</th>
                          <th style="width: 10%;">Tests</th>
                          <th style="width: 13%;">Diagnosis</th>
                          <th style="width: 10%;">Prescription</th>
                          <th style="width: 15%;">Medicines</th>
                          <th style="width: 10%;">Next Visit</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(treatment, index) in treatments" :key="treatment.id">
                          <td class="text-center">{{ index + 1 }}</td>
                          <td>Dr. {{ treatment.doctor_name }}</td>
                          <td>{{ treatment.department || 'N/A' }}</td>
                          <td>{{ treatment.visit_type }}</td>
                          <td>{{ treatment.tests_done || '—' }}</td>
                          <td>{{ treatment.diagnosis }}</td>
                          <td>{{ treatment.prescription || '—' }}</td>
                          <td>
                            <div v-if="treatment.medicines && treatment.medicines.length > 0">
                              <div v-for="(medicine, idx) in treatment.medicines" :key="idx" class="mb-2">
                                <strong>{{ idx + 1 }}. {{ medicine.name }}</strong>
                                <div class="text-muted small">
                                  {{ medicine.dosage }} for {{ medicine.duration_days }} days
                                </div>
                              </div>
                            </div>
                            <span v-else class="text-muted">No medicines prescribed</span>
                          </td>
                          <td>{{ treatment.next_visit_date || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else class="alert alert-info text-center my-4">
                  <i class="bi bi-info-circle me-2"></i>
                  No treatment records found for {{ displayDepartment }}. Visit a doctor to start your medical history.
                </div>
              </div>
              <!-- End Loaded State -->
            </div>
            <!-- End Body -->
          </div>
          <!-- End Card -->
        </div>
      </div>
    </div>
    <!-- End Container -->
  `,

  data() {
    return {
      treatments: [],
      patientInfo: null,
      department: 'All',
      loading: true,
      patientId: null
    };
  },

  computed: {
    displayDepartment() {
      return this.department === 'All' ? 'All Departments' : this.department;
    }
  },

  async mounted() {
    this.patientId = this.$route.params.patient_id;
    this.department = this.$route.params.department || 'All';
    await this.loadTreatments();
},

  methods: {
    loadTreatments() {
      this.loading = true;
      
      // Build query params for filtering by patient
      
      
      return authFetchWithRetry(`/api/treatments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => {
            if (!response) return null;                    // ✅ !r guard
            if (response.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            return response.json();
        })
        .then(data => {
          if (!data) return;                              // ✅ null guard
          let allTreatments = Array.isArray(data) ? data : [];
          
          // Filter by patient ID (comparing with current patient or route param)
          const targetPatientId = parseInt(this.patientId) || parseInt(localStorage.getItem('user_id'));
          allTreatments = allTreatments.filter(t => 
            t.appointment_id && t.patient_id === targetPatientId
          );
          
          // Filter by department if not 'All'
          if (this.department && this.department !== 'All') {
            allTreatments = allTreatments.filter(t => 
              t.department && t.department.toLowerCase() === this.department.toLowerCase()
            );
          }
          
          this.treatments = allTreatments;
          
          if (this.treatments.length > 0) {
            const first = this.treatments[0];
            this.patientInfo = {
              patient_name: first.patient_name
            };
          } else {
            // Load patient info even if no treatments
            this.loadPatientInfo();
          }
        })
        .catch((err) => {
          console.error('Error loading treatments:', err);
          this.treatments = [];
          alert('Failed to load treatment history');
        })
        .finally(() => {
          this.loading = false;
        });
    },

    loadPatientInfo() {
      const targetPatientId = parseInt(this.patientId) || parseInt(localStorage.getItem('user_id'));
      
      return authFetchWithRetry(`/api/patient/${targetPatientId}`, {    // ✅ authFetchWithRetry + return
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => {
            if (!response) return null;                    // ✅ !r guard
            if (response.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return response.json();
        })
        .then(data => {
          if (!data) return;                              // ✅ null guard
          this.patientInfo = {
            patient_name: data.name || 'Unknown'
          };
        })
        .catch(err => {
          console.error('Error loading patient info:', err);
        });
    },

    goBack() {
      this.$router.go(-1);
    }

   
  }
};