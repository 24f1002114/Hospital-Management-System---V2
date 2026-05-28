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

        <h2 class="text-center mb-4 mt-4">Update Profile</h2>

                 <form @submit.prevent="SavePatient">
                    <div class="row mb-4 mx-auto align-items-top" style="width: 100%;">
                        <div class="col-md-6">
        
                            <div class="mb-3">
                                <label for="name">Full Name:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="name" v-model="patient.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="age">Age:<span class="required">*</span></label>
                                <input type="number" class="form-control" id="age" v-model="patient.age" required>
                            </div> 
                                <div class="mb-3">
                                <label for="gender">Gender: <span class="required">*</span></label>
                                <select class="form-control" id="gender" v-model="patient.gender" required>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                             <div class="mb-3">
                                <label for="contact_number">Contact:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="contact_number" v-model="patient.contact_number" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="address">Address:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="address" v-model="patient.address" required>
                            </div>

                            <div class="mb-3">
                                <label for="medical_history">Medical History: <span class="required">*</span></label>
                                <textarea class="form-control" rows="7" id="medical_history" v-model="patient.medical_history" required></textarea> 
                            </div>                
                        </div>
                    <div class="text-center mt-3">
                        <button type="submit" class="btn btn-primary px-4" :disabled="saving">
                            {{ saving ? 'Updating...' : 'Update' }}
                        </button>
                    </div>
                    </div>
                </form>
            </div>
            </div>
            </div>
        </div>
       </div>
      </div>
      </div>
    </div>`,
    data() {
        return {
            loading: true,
            saving: false,
            patient: {
                name: '',
                age: '',
                gender: '',
                contact_number: '',
                address: '',
                medical_history: ''
            },
            patientId: null
        }
    },
    async mounted() {
    this.patientId = parseInt(this.$route.params.id);
    await this.FetchPatientData(this.patientId);
    this.loading = false;
    },
 
    methods: {

        FetchPatientData(id){
            return authFetchWithRetry(`/api/patient/${id}`, {    // ✅ authFetchWithRetry + return
                method: "GET",
                headers: {
                    'content-type': 'application/json',
                }
            })
            .then(r => {
                if (!r) return null;                        // ✅ !r guard
                if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
                return r.json();
            })
            .then(data => {
                if (!data) return;                          // ✅ null guard
                this.patient = data;
                console.log('Success:', data);
                return data;                                // ✅ Return to complete promise chain
            })
            .catch(error => console.error('Error:', error));   
        },

        SavePatient(){
            if (this.saving) return;
            this.saving = true;
            return authFetchWithRetry(`/api/patient/${this.patientId}`, {  // ✅ authFetchWithRetry + return
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json', 
                },
                body: JSON.stringify(this.patient)  
                })
                .then(r => {
                    if (!r) throw new Error('No response');         // ✅ !r guard
                    if (r.status === 401) { localStorage.clear(); this.$router.push('/login'); return; }
                    if (!r.ok) throw new Error('Failed to update');
                    return r.json();
                })
                .then(data => {
                    if (!data) return;                          // ✅ null guard
                    this.patient = data;
                    console.log('Success:', data);
                    alert('Patient profile updated successfully');
                    return this.FetchPatientData(this.patientId);  // ✅ Wait for refresh to complete
                })
                .catch(error => console.error('Error:', error))
                .finally(() => { this.saving = false; });
            } 

        }
}