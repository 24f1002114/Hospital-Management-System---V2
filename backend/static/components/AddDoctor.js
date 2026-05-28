export default {
    template: `
    <div class="row justify-content-center border d-flex align-items-center wall" style="height: 750px; overflow: auto;"> 
      <div class="col-12 col-md-10 col-lg-10 mt-1 mb-1"> 
        <div class="card shadow p-2 bg-light"> 
          <div class="card-body">
            <h3 class="text-center mb-2 mt-2">Add Doctor Profile</h3>

            <div v-if="loading" class="text-center p-5">
              <div class="spinner-border text-primary"></div>
              <p class="mt-2">Loading...</p>
            </div>

            <div v-else>
              <form @submit.prevent="CreateDoctor">
                <div class="row mb-4 mx-auto align-items-center" style="width: 100%;">
                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="email">Email:<span class="required">*</span></label>
                      <input type="email" class="form-control" id="email" v-model="doctor.email" required>
                    </div>
                    <div class="mb-3">
                      <label for="username">Username:<span class="required">*</span></label>
                      <input type="text" class="form-control" id="username" v-model="doctor.username" required>
                    </div>
                    <div class="mb-3">
                      <label for="password">Password:<span class="required">*</span></label>
                      <input type="password" class="form-control" id="password" v-model="doctor.password" required>
                    </div>
                    <div class="mb-3">
                      <label for="name">Full Name:<span class="required">*</span></label>
                      <input type="text" class="form-control" id="name" v-model="doctor.name" required>
                    </div>
                    <div class="mb-3">
                      <label for="age">Age:<span class="required">*</span></label>
                      <input type="number" class="form-control" id="age" v-model="doctor.age" required>
                    </div>
                    <div class="mb-3">
                      <label for="gender">Gender:<span class="required">*</span></label>
                      <select class="form-control" id="gender" v-model="doctor.gender" required>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div class="col-md-6">
                    <div class="mb-3">
                      <label for="degree">Degrees:<span class="required">*</span></label>
                      <input type="text" class="form-control" id="degree" v-model="doctor.degree" required>
                    </div>
                    <div class="mb-3">
                      <label for="specialization">Specialization:<span class="required">*</span></label>
                      <input type="text" class="form-control" id="specialization" v-model="doctor.specialization" required>
                    </div>
                    <div class="mb-3">
                      <label>Department:<span class="required">*</span></label>
                      <small class="form-text text-muted ms-3">(Select one or more departments)</small>
                      <div class="border rounded p-3 bg-white" style="max-height: 80px; overflow-y: auto;">
                        <div v-for="dept in departments_name" :key="dept.id" class="form-check mb-2">
                          <input class="form-check-input" type="checkbox" :value="dept.id" 
                            :id="'dept-' + dept.id" v-model="doctor.departments"
                            :required="doctor.departments.length === 0">
                          <label class="form-check-label" :for="'dept-' + dept.id">
                            {{ dept.name }}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div class="mb-3">
                      <label for="years_of_experience">Years of Experience:<span class="required">*</span></label>
                      <input type="number" class="form-control" id="years_of_experience" v-model="doctor.years_of_experience" required>
                    </div>
                    <div class="mb-3">
                      <label for="bio">Bio:<span class="required">*</span></label>
                      <textarea class="form-control" rows="3" id="bio" v-model="doctor.bio" required></textarea>
                    </div>
                  </div>

                  <div class="text-center mt-3">
                    <button type="submit" class="btn btn-primary px-4" :disabled="saving">
                      {{ saving ? 'Creating...' : 'Create' }}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>`,

    data() {
        return {
            loading: true,   // ✅ Bug 2 fix
            saving: false,   // ✅ Bug 2 fix
            doctor: {
                email: '',
                username: '',
                password: '',
                name: '',
                age: '',
                gender: '',
                specialization: '',
                years_of_experience: '',
                bio: '',
                departments: []
            },
            departments_name: []
        };
    },

    async mounted() {           // ✅ Bug 3 fix
        await this.GetDepartments();
        this.loading = false;
    },

    methods: {
        CreateDoctor() {
            if (this.saving) return;   // ✅ Bug 2 fix
            this.saving = true;
           return authFetchWithRetry('/api/doctors', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(this.doctor)
            })
            .then(r => {
                if (!r) return null;                        // ✅ !r guard
                if (r.status === 401) {          // ✅ Bug 1 fix
                    localStorage.clear();
                    this.$router.push('/login');
                    return null;
                }
                return r.json();
            })
            .then(data => {
                if (!data) return;
                alert(data.message);
                this.$router.push('/admin');     // ✅ Bug 4 fix
            })
            .catch(err => {
                console.error('Error:', err);
                alert('An error occurred while adding the doctor.');
            })
            .finally(() => { this.saving = false; });  // ✅ Bug 2 fix
        },

        GetDepartments() {
            return authFetchWithRetry('/api/departments', {   // ✅ Bug 3 fix - added return
                method: 'GET',
                headers: { "Content-Type": "application/json" }
            })
            .then(r => {
                if (!r) return null;                        // ✅ !r guard
                if (r.status === 401) {
                    localStorage.clear();
                    this.$router.push('/login');
                    return null;
                }
                return r.json();
            })
            .then(data => {
                if (data) this.departments_name = data;  // ✅ null guard
            })
            .catch(err => console.error("Get Departments Error:", err));
        }
    }
}