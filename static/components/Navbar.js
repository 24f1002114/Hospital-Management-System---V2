export default {
template: `
<nav class="row navbar navbar-expand-lg border d-flex align-items-center navwall">
    <div class="container-fluid">
        <a class="navbar-brand fs-3 fw-bold">
         <router-link class="nav-link" to="/">Hospital Management System</router-link>
        </a>
            <ul class="navbar-nav ms-auto align-items-lg-center">
                <template v-if="!isLoggedIn">
                    <li class="nav-item">
                        <router-link class="btn btn-primary mx-1 my-1" to="/login">Login</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="btn btn-warning mx-1 my-1" to="/register">Register</router-link>
                    </li>
                </template>
               
                <template v-else>
                    <li class="nav-item">
                        <span class="navbar-text fw-bold fs-5 me-3">Welcome, {{ username }}</span>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link fs-5" to="/" active-class="text fw-bold">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link fs-5" :to="'/' + role" active-class="text fw-bold">Dashboard</router-link>
                    </li>

                    <!-- Edit Profile Button for Patient -->
                    <li class="nav-item" v-if="role === 'patient'">
                     <button class="btn btn-light btn-sm" @click="csvexport()">export csv</button>
                        <router-link class="btn btn-info ms-2 my-1" :to="'/update/patient/' + userId">
                            Edit Profile
                        </router-link>
                    </li>

                    <!-- Logout Button -->
                    <li class="nav-item">
                        <button class="btn btn-danger ms-2 my-1" @click="logout">Logout</button>
                    </li>
                </template>
            </ul>        
    </div>
</nav>`,
    
    data() {
        return {
            isLoggedIn: false,
            username: '',
            role: '',
            userId: null,
            searchQuery: '',
            searchType: 'all'
        }
    },
    
    mounted() {
        this.checkLoginStatus();
    },
    
    watch: {
        '$route'() {
            this.checkLoginStatus();
        }
    },
    
    methods: {
        checkLoginStatus() {
            const token = localStorage.getItem('auth_token');
            const username = localStorage.getItem('username');
            const userId = localStorage.getItem('user_id');
            const roles = JSON.parse(localStorage.getItem('roles') || '[]');
            
            if (token && username) {
                this.isLoggedIn = true;
                this.username = username;
                this.userId = userId;
                
                if (roles.includes('admin')) {
                    this.role = 'admin';
                } else if (roles.includes('doctor')) {
                    this.role = 'doctor';
                } else if (roles.includes('patient')) {
                    this.role = 'patient';
                } else {
                    this.role = '';
                }
            } else {
                this.isLoggedIn = false;
                this.username = '';
                this.role = '';
                this.userId = null;
            }
        },
        
        logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('user_id');
                localStorage.removeItem('username');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('roles');
                
                this.isLoggedIn = false;
                this.username = '';
                this.role = '';
                this.userId = null;
                
                this.$router.push('/');
            }
        }, 
  
csvexport() {
  const token = localStorage.getItem('auth_token');
  authFetch('/api/export', {
    method: 'POST',
  })
    .then(res => res.json())
    .then(data => {
      const taskId = data.id;
      const timer = setInterval(async () => {
        const r = await authFetch(`/api/csv_result/${taskId}`, {
        });
        if (r.status === 202) return;
        clearInterval(timer);
        if (!r.ok) { alert('Export failed'); return; }
        const blob = await r.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `treatment_report_${taskId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }, 1500);
    })
    .catch(() => alert('Failed to start export'));
},      
    }
}