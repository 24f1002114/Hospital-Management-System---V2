export default{
 template: `
      <div class="row justify-content-center  border d-flex align-items-center wall " style="height: 700px; overflow: auto;"> 
      <div class="col-12 col-md-10 col-lg-10  mt-2 mb-2"> 
      <div class="card shadow p-3 bg-light"> 
         <div class="card-body ">
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
                        <button type="submit" class="btn btn-primary px-4">Update</button>
                    </div>
                    </div>
                </form>
            </div>
            </div>
      </div>
    </div>`,

    data: function(){
        return {
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
    created(){
        const patientId = this.$route.params.id;
        this.FetchPatientData(patientId);
        this.patientId = parseInt(patientId);
    },
 
    methods: {

        FetchPatientData(id){
            fetch(`/api/patient/${id}`, {
                method: "GET",
                headers: {
                    'content-type': 'application/json',
                    "Authentication-Token": localStorage.getItem("auth_token")
                }
            })
            .then(response => response.json())
            .then(data => {
                this.patient = data;
                console.log('Success:', data);
            })
            .catch(error => console.error('Error:', error));   
        },

        SavePatient(){
            fetch(`/api/patient/${this.patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json', 
                    "Authentication-Token": localStorage.getItem("auth_token")
                },
                body: JSON.stringify(this.patient)  
                })
                .then(response => response.json())
                .then(data => {
                this.patient = data;
                console.log('Success:', data);
                alert('Patient profile updated successfully');
                this.FetchPatientData(this.patientId);
                //this.$router.push('/admin');
                })
                .catch(error => console.error('Error:', error));
            } 

        }
}