export default {
    
    template: `
        <div class="row justify-content-center  border d-flex align-items-center wall" style="height: 700px;"> 
            <div class="col-12 col-md-10 col-lg-8 border p-4 mt-2 mb-2 formbg"> 
                <h2 class="text-center mb-4">Registration Form</h2>
                <form @submit.prevent="addUser">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="email">Email:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="email" v-model="formData.email" required>
                            </div>
                            <div class="mb-3">
                                <label for="username">Username:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="username" v-model="formData.username" required>
                            </div>
                            <div class="mb-3">
                                <label for="password">Password:<span class="required">*</span></label>
                                <input type="password" class="form-control" id="password" v-model="formData.password" required>
                            </div>
                            <div class="mb-3">
                                <label for="name">Full Name:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="name" v-model="formData.name" required>
                            </div>
                            <div class="mb-3">
                                <label for="age">Age:<span class="required">*</span></label>
                                <input type="number" class="form-control" id="age" v-model="formData.age" required>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="gender">Gender: <span class="required">*</span></label>
                                <select class="form-control" id="gender" v-model="formData.gender" required>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="contact_number">Contact:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="contact_number" v-model="formData.contact_number" required>
                            </div>

                            <div class="mb-3">
                                <label for="address">Address:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="address" v-model="formData.address" required>
                            </div>

                            <div class="mb-3">
                                <label for="medical_history">Medical History: <span class="required">*</span></label>
                                <textarea class="form-control" rows="4" id="medical_history" v-model="formData.medical_history" required></textarea> 
                            </div>                
                        </div>
                    <div class="text-center mt-3">
                        <button type="submit" class="btn btn-primary px-4">Register</button>
                    </div>
                    </div>
                </form>
            </div> 
        </div>`,

    data: function() {
        return {
            formData:{
                email: "",
                username: "",
                password: "",
                name: "",
                age: "",
                gender: "",
                contact_number: "",
                address: "",
                medical_history: ""
            } 
        }
    },
    methods:{
        addUser: function(){
            fetch('/api/register', {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(this.formData) 
            })
            .then(response => response.json())
            .then(data => {
                
                if (data.success == true){
                    alert("Registration successful!")
                    this.$router.push('/login')
                }
                else{
                    alert(data.message)
                    this.$router.push('/register')
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("An error occurred during registration.")
                this.$router.push('/register')
            })

        }
    }
}