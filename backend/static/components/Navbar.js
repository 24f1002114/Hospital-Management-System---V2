export default {
template: `
<nav class="navbar navbar-expand-md navbar-light sticky-top navwall border">
    <div class="container-fluid">
        <span class="navbar-brand fs-5 fs-md-4 fw-bold">
         <router-link class="nav-link text-dark" to="/" style="text-decoration: none;">HMS</router-link>
        </span>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto align-items-md-center">
                <template v-if="!isLoggedIn">
                    <li class="nav-item">
                        <router-link class="btn btn-primary btn-sm mx-1 my-1 w-100 w-md-auto" to="/login">Login</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="btn btn-warning btn-sm mx-1 my-1 w-100 w-md-auto" to="/register">Register</router-link>
                    </li>
                </template>
               
                <template v-else>
                    <li class="nav-item d-none d-md-block">
                        <span class="navbar-text fw-bold fs-6 me-2">Welcome, {{ username }}</span>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/" active-class="text fw-bold">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" :to="'/' + role" active-class="text fw-bold">Dashboard</router-link>
                    </li>

                    <!-- Edit Profile Button for Patient -->
                    <li class="nav-item" v-if="role === 'patient'">
                     <button class="btn btn-light btn-sm w-100 w-md-auto" @click="csvexport()">CSV</button>
                        <router-link class="btn btn-info btn-sm ms-md-2 my-1 w-100 w-md-auto" :to="'/update/patient/' + userId">
                            Profile
                        </router-link>
                    </li>

                    <!-- Logout Button -->
                    <li class="nav-item">
                        <button class="btn btn-danger btn-sm ms-md-2 my-1 w-100 w-md-auto" @click="logout">Logout</button>
                    </li>
                </template>
            </ul>
        </div>        
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
        let roles = [];
        try {
            roles = JSON.parse(localStorage.getItem('roles') || '[]');
        } catch(e) {
            localStorage.clear();
            this.$router.push('/login');
            return;
        }
        if (token && username) {
            this.isLoggedIn = true;
            this.username = username;
            this.userId = userId;
            if (roles.includes('admin')) this.role = 'admin';
            else if (roles.includes('doctor')) this.role = 'doctor';
            else if (roles.includes('patient')) this.role = 'patient';
            else this.role = '';
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
        return authFetchWithRetry('/api/export', {          // ✅ authFetchWithRetry + return
            method: 'POST',
        })
        .then(res => {
            if (!res) return null;                          // ✅ !r guard
            if (res.status === 401) { localStorage.clear(); this.$router.push('/login'); return null; }
            return res.json();
        })
        .then(data => {
            if (!data) return;                              // ✅ null guard
            const taskId = data.id;
            const timer = setInterval(async () => {
                const r = await authFetchWithRetry(`/api/csv_result/${taskId}`); // ✅ retry inside interval
                if (!r) { clearInterval(timer); return; }  // ✅ !r guard inside interval
                if (r.status === 401) { 
                    localStorage.clear(); 
                    this.$router.push('/login'); 
                    clearInterval(timer); 
                    return; 
                }
                if (r.status === 202) return;              // still processing, keep waiting
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
    }
}
}