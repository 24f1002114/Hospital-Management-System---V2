export default {
    template: `
        <div class="row justify-content-center  border d-flex align-items-center wall" style="height: 700px;"> 
            <div class="col border p-3 formbg" style="max-width: 400px; height: 500px;"> 
                <h2 class="text-center mb-4 mt-4">Login Form</h2>
                <form @submit.prevent="loginUser">    
                            <div class="mb-3">
                                <label for="email">Email:<span class="required">*</span></label>
                                <input type="text" class="form-control" id="email" v-model="formData.email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password">Password:<span class="required">*</span></label>
                                <input type="password" class="form-control" id="password" v-model="formData.password" required>
                            </div>      
                    <div class="text-center mt-5">
                        <button type="submit" class="btn btn-primary px-4">Login</button>
                    </div>
                </form>
            </div> 
        </div>`,
    data: function() {
        return {
            formData:{
                email: "",
                password: ""
            }
        }
    },
    methods:{
        loginUser: function(){
            fetch('/api/login', {
                method: 'POST',
                headers: {
                    "Content-Type": 'application/json'
                },
                body: JSON.stringify(this.formData) // the content goes to backend as JSON string
            })
            .then(response => response.json())
            .then(data => { 
                console.log(data);
                if(data.success){
                    // Redirect based on role
                    localStorage.setItem('user_id', data.id);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('auth_token', data.auth_token);
                    localStorage.setItem('roles', JSON.stringify(data.roles));
                this.$nextTick(() => {
                    if(data.roles.includes("admin")){
                        this.$router.push('/admin');
                    } else if(data.roles.includes("doctor")){
                        this.$router.push('/doctor');
                    } else if(data.roles.includes("patient")){
                        this.$router.push('/patient');
                    } else {
                        alert("Unknown role!");
                    } 
                }); 
                } else {
                    alert("Login failed: " + data.message);
                }
            }).catch(error => {
                console.error('Error:', error);
                alert("An error occurred during login. Please try again.");
            }); 
              
        }
    }
}