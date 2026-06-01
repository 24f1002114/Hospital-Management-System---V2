<template>
  <nav class="navwall navbar navbar-expand-lg">
    <div class="container-fluid">

      <!-- Brand -->
      <router-link class="navbar-brand fs-5 fw-bold" to="/">
        Hospital Management System
      </router-link>

      <!-- Mobile toggle -->
      <button
        class="navbar-toggler"
        type="button"
        @click="menuOpen = !menuOpen"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Menu -->
      <div class="navbar-collapse" :class="{ show: menuOpen }">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2 py-2 py-lg-0">

          <!-- Guest users -->
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

            <!-- Theme toggle for guests -->
            <li class="nav-item mt-2 mt-lg-0">
              <button
                class="btn btn-sm w-100 w-lg-auto theme-btn"
                @click="theme.toggleTheme"
              >
                <span v-if="theme.theme === 'light'">🌙 </span>
                <span v-else>☀️</span>
              </button>
            </li>
          </template>

          <!-- Authenticated users -->
          <template v-else>

            <li class="nav-item">
              <span class="navbar-text fw-bold">
                Welcome, {{ auth.username }}
              </span>
            </li>

            <li class="nav-item mt-2 mt-lg-0">
              <router-link class="btn btn-outline-secondary btn-sm w-100 w-lg-auto" to="/" @click="menuOpen = false">
                Home
              </router-link>
            </li>

            <li class="nav-item mt-2 mt-lg-0">
              <router-link
                class="btn btn-outline-primary btn-sm w-100 w-lg-auto"
                :to="'/' + auth.role"
                @click="menuOpen = false"
              >
                Dashboard
              </router-link>
            </li>

            <!-- Patient tools -->
            <template v-if="auth.isPatient">
              <li class="nav-item mt-2 mt-lg-0">
                <button class="btn btn-light btn-sm w-100 w-lg-auto" @click="csvExport">
                  Export CSV
                </button>
              </li>

              <li class="nav-item mt-2 mt-lg-0">
                <router-link
                  class="btn btn-info btn-sm w-100 w-lg-auto"
                  :to="'/update/patient/' + auth.userId"
                  @click="menuOpen = false"
                >
                  Edit Profile
                </router-link>
              </li>
            </template>

            <!-- Theme toggle -->
            <li class="nav-item mt-2 mt-lg-0">
              <button
                class="btn btn-sm w-100 w-lg-auto theme-btn"
                @click="theme.toggleTheme"
              >
                <span v-if="theme.theme === 'light'">🌙 </span>
                <span v-else>☀️</span>
              </button>
            </li>

            <!-- Logout -->
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
import { useThemeStore } from '@/stores/theme'
import { useRouter } from 'vue-router'
import api from '@/utils/api'

export default {
  setup() {
    const auth = useAuthStore()
    const theme = useThemeStore()
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

    return { auth, theme, menuOpen, logout, csvExport }
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

.navwall {
  background: var(--card);
  border-bottom: 1px solid var(--border);
  transition: all 0.3s ease;
}

.navbar-brand {
  color: var(--text) !important;
}

.navbar-text {
  color: var(--text) !important;
}

.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.navbar-toggler {
  border-color: var(--border) !important;
}

.theme-btn {
  background: var(--primary);
  color: white;
  border: none;
}

/* Dark mode button styling */
html.dark-theme .navwall .btn-light {
  background-color: var(--card) !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
}

html.dark-theme .navwall .btn-outline-secondary {
  color: var(--text) !important;
  border-color: var(--border) !important;
}

html.dark-theme .navwall .btn-outline-secondary:hover {
  background-color: var(--bg) !important;
  border-color: var(--text) !important;
}

html.dark-theme .navwall .btn-outline-primary {
  color: var(--primary) !important;
  border-color: var(--primary) !important;
}

html.dark-theme .navwall .btn-outline-primary:hover {
  background-color: var(--primary) !important;
  color: white !important;
}

html.dark-theme .navwall .navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='%23cbd5e1' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}
</style>