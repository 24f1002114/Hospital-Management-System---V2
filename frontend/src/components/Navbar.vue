<template>
  <nav class="navwall navbar navbar-expand-lg">
    <div class="container-fluid">

      <!-- Brand -->
      <router-link class="navbar-brand fs-5 fw-bold text-primary" to="/">
        Hospital Management System
      </router-link>

      <!-- Hamburger toggle (mobile only) -->
      <button
        class="navbar-toggler"
        type="button"
        @click="menuOpen = !menuOpen"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Collapsible menu -->
      <div class="navbar-collapse" :class="{ show: menuOpen }">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2 py-2 py-lg-0">

          <!-- Not logged in -->
          <template v-if="!auth.isLoggedIn">
            <li class="nav-item">
              <router-link class="btn btn-primary btn-sm w-100 w-lg-auto" to="/login" @click="menuOpen = false">
                Login
              </router-link>
            </li>
            <li class="nav-item mt-2 mt-lg-0">
              <router-link class="btn btn-warning btn-sm w-100 w-lg-auto" to="/register" @click="menuOpen = false">
                Register
              </router-link>
            </li>
          </template>

          <!-- Logged in -->
          <template v-else>
            <li class="nav-item">
              <span class="navbar-text fw-bold">Welcome, {{ auth.username }}</span>
            </li>
            <li class="nav-item mt-2 mt-lg-0">
              <router-link class="btn btn-outline-secondary btn-sm w-100 w-lg-auto" to="/" @click="menuOpen = false">
                Home
              </router-link>
            </li>
            <li class="nav-item mt-2 mt-lg-0">
              <router-link class="btn btn-outline-primary btn-sm w-100 w-lg-auto" :to="'/' + auth.role" @click="menuOpen = false">
                Dashboard
              </router-link>
            </li>
            <template v-if="auth.isPatient">
              <li class="nav-item mt-2 mt-lg-0">
                <button class="btn btn-light btn-sm w-100 w-lg-auto" @click="csvExport">
                  Export CSV
                </button>
              </li>
              <li class="nav-item mt-2 mt-lg-0">
                <router-link class="btn btn-info btn-sm w-100 w-lg-auto" :to="'/update/patient/' + auth.userId" @click="menuOpen = false">
                  Edit Profile
                </router-link>
              </li>
            </template>
            <li class="nav-item mt-2 mt-lg-0">
              <button class="btn btn-danger btn-sm w-100 w-lg-auto" @click="logout">
                Logout
              </button>
            </li>
          </template>

        </ul>
      </div>

    </div>
  </nav>
</template>

<script>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const auth = useAuthStore()
    const router = useRouter()
    const menuOpen = ref(false)

    function logout() {
      if (confirm('Are you sure you want to logout?')) {
        menuOpen.value = false
        auth.logout()
        router.push('/')
      }
    }

    function csvExport() {
      menuOpen.value = false
      api.post('export')
        .then(res => {
          const taskId = res.data.id
          const timer = setInterval(async () => {
            try {
              const r = await api.get(`csv_result/${taskId}`, {
                responseType: 'blob',
                validateStatus: s => s === 200 || s === 202
              })
              if (r.status === 202) return
              clearInterval(timer)
              const url = window.URL.createObjectURL(new Blob([r.data]))
              const a = document.createElement('a')
              a.href = url
              a.download = `treatment_report_${taskId}.csv`
              document.body.appendChild(a)
              a.click()
              a.remove()
              window.URL.revokeObjectURL(url)
            } catch {
              clearInterval(timer)
              alert('Export failed')
            }
          }, 1500)
        })
        .catch(() => alert('Failed to start export'))
    }

    return { auth, menuOpen, logout, csvExport }
  }
}
</script>

<style scoped>
.navbar-collapse {
  display: none;
  width: 100%;
}

.navbar-collapse.show {
  display: block;
}

@media (min-width: 992px) {
  .navbar-collapse {
    display: flex !important;
    width: auto;
  }

  .w-lg-auto {
    width: auto !important;
  }
}
</style>