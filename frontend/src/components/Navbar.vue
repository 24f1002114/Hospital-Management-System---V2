<template>
  <nav class="row navbar navbar-expand-lg border d-flex align-items-center navwall">
    <div class="container-fluid">
      <router-link class="navbar-brand fs-3 fw-bold nav-link" to="/">
        Hospital Management System
      </router-link>
      <ul class="navbar-nav ms-auto align-items-lg-center">

        <template v-if="!auth.isLoggedIn">
          <li class="nav-item">
            <router-link class="btn btn-primary mx-1 my-1" to="/login">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link class="btn btn-warning mx-1 my-1" to="/register">Register</router-link>
          </li>
        </template>

        <template v-else>
          <li class="nav-item">
            <span class="navbar-text fw-bold fs-5 me-3">Welcome, {{ auth.username }}</span>
          </li>
          <li class="nav-item">
            <router-link class="nav-link fs-5" to="/">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link fs-5" :to="'/' + auth.role">Dashboard</router-link>
          </li>
          <li class="nav-item" v-if="auth.isPatient">
            <button class="btn btn-light btn-sm" @click="csvExport">Export CSV</button>
            <router-link class="btn btn-info ms-2 my-1" :to="'/update/patient/' + auth.userId">
              Edit Profile
            </router-link>
          </li>
          <li class="nav-item">
            <button class="btn btn-danger ms-2 my-1" @click="logout">Logout</button>
          </li>
        </template>

      </ul>
    </div>
  </nav>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const auth = useAuthStore()
    const router = useRouter()

    function logout() {
      if (confirm('Are you sure you want to logout?')) {
        auth.logout()
        router.push('/')
      }
    }

    function csvExport() {
      api.post('/api/export')
        .then(res => {
          const taskId = res.data.id
          const timer = setInterval(async () => {
            try {
              const r = await api.get(`/api/csv_result/${taskId}`, {
                responseType: 'blob',
                validateStatus: status => status === 200 || status === 202
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
            } catch (err) {
              clearInterval(timer)
              alert('Export failed')
            }
          }, 1500)
        })
        .catch(() => alert('Failed to start export'))
    }

    return { auth, logout, csvExport }
  }
}
</script>
