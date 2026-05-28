export default{
 template: `
    <div class="container-fluid formbg p-2 p-md-4" style="min-height: 500px;"> 
      <div class="row">
      <div class="col-12 col-md-8 col-lg-6 mx-auto">
       <div class="card shadow p-2 p-md-3 bg-light"> 
         <div class="card-body"> 
         <div v-if="loading" class="text-center p-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-2">Loading...</p>
        </div>

        <div v-else>

        <h2 class="text-center mb-4 mt-4">Update Doctor Profile</h2>

        <form @submit.prevent="SaveDoctor">
          <div class="row mb-4 mx-auto align-items-top" style="width: 100%;">
            <div class="col-md-6">
              <div class="mb-3">
                <label for="name">Full Name:<span class="required">*</span></label>
                <input type="text" class="form-control" id="name" v-model="doctor.name" required>
              </div>
              <div class="mb-3">
                <label for="age">Age:<span class="required">*</span></label>
                <input type="number" class="form-control" id="age" v-model="doctor.age" required>
              </div> 
              <div class="mb-3">
                <label for="gender">Gender: <span class="required">*</span></label>
                <select class="form-control" id="gender" v-model="doctor.gender" required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="specialization">Specialization:<span class="required">*</span></label>
                <input type="text" class="form-control" id="specialization" v-model="doctor.specialization" required>
              </div>
               <div class="mb-3">
                <label for="years_of_experience">Years of Experience:<span class="required">*</span></label>
                <input type="number" class="form-control" id="years_of_experience" v-model="doctor.years_of_experience" required>
              </div>
            </div>

            <div class="col-md-6">
              <div class="mb-3">
                <label for="degree">Degrees:<span class="required">*</span></label>
                <input type="text" class="form-control" id="degree" v-model="doctor.degree" required>
              </div>
              <div class="mb-3">
                <label>Current Departments:</label>
                <div class="border rounded p-3 bg-light">
                  <span v-if="doctor.departments && doctor.departments.length > 0" class="d-flex flex-wrap gap-2">
                    <span v-for="deptId in doctor.departments" :key="deptId" class="badge bg-primary">
                      {{ getDepartmentName(deptId) }}
                    </span>
                  </span>
                  <span v-else class="text-muted">No departments assigned</span>
                </div>
              </div>

              <div class="mb-3">
                <label>Update Departments:<span class="required">*</span></label>
                <small class="form-text text-muted ms-3">(Select one or more departments)</small>
                <div class="border rounded p-3" style="max-height: 80px; overflow-y: auto; background-color: white;">
                  <div v-for="dept in departments_name" :key="dept.id" class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" :value="dept.id" :id="'dept-' + dept.id" v-model="doctor.departments" :required="doctor.departments.length === 0">
                    <label class="form-check-label" :for="'dept-' + dept.id">
                      {{ dept.name }}
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label for="bio">Bio: <span class="required">*</span></label>
                <textarea class="form-control" rows="4" id="bio" v-model="doctor.bio" required></textarea> 
              </div>                
            </div>

            <div class="text-center mt-3">
              <!-- update button -->
              <button type="submit" class="btn btn-primary px-4" :disabled="saving">
                  {{ saving ? 'Updating...' : 'Update' }}
              </button>
            </div>
        </form>
          </div>
          </div>
        </div>
       </div>
      </div>
      </div>
    </div>`,
    data: function(){
        return {
          doctorId: this.$route.params.id,
          loading: true,
          saving: false,
            doctor: {
                name: '',
                age: '',
                gender: '',
                specialization: '',
                email: '',
                years_of_experience: '',
                bio: '',
                departments: []
            },
            departments_name: []
        };
    },
   async mounted() {
    await Promise.all([
        this.loadDepartments(),
        this.FetchDoctorData(this.doctorId)  // ← already available
    ]);
    this.loading = false;
},
    methods: {
        getDepartmentName(deptId){
            const dept = this.departments_name.find(d => d.id === deptId);
            return dept ? dept.name : 'Unknown';
        },

        FetchDoctorData(id){
            return authFetchWithRetry(`/api/doctor/${id}`, {    // ✅ authFetchWithRetry + return
                method: 'GET',
                headers: {
                    "content-type": "application/json",
                }
            })
            .then(r => {
              if (!r) return null;                          // ✅ !r guard
              if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
              return r.json();
          })
            .then(data => {
              if (!data) return;                            // ✅ null guard
                this.doctor = data;
                return data;                                // ✅ Return data to complete promise chain
            })
            .catch(err => console.error("Fetch Doctor Data Error:", err));
        },

        SaveDoctor(){
          if (this.saving) return;
            this.saving = true;
            return authFetchWithRetry(`/api/doctor/${this.doctorId}`, {  // ✅ authFetchWithRetry + return
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.doctor)
            })
            .then(response => {
                if (!response) throw new Error('No response');         // ✅ !r guard
                if (response.status === 401) { localStorage.clear(); this.$router.push('/login'); return; }
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                alert("Doctor profile updated successfully!");
                return this.FetchDoctorData(this.doctorId);           // ✅ Wait for refresh to complete
            })
            .catch(err => console.error("Save Doctor Error:", err))
            .finally(() => { this.saving = false; });
        },

        loadDepartments(){
            return authFetchWithRetry('/api/departments', {    // ✅ authFetchWithRetry + return
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                }
            })
            .then(r => {
                if (!r) return null;                          // ✅ !r guard
                if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
                return r.json();
            })
            .then(data => {
              if (!data) return;                            // ✅ null guard
              this.departments_name = data;
              return data;                                  // ✅ Return data to complete promise chain
            })
            .catch(err => console.error("Load Departments Error:", err));
        }
    }
}