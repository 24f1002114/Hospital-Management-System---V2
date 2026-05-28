<template>
  <div class="row wall border d-flex align-items-center justify-content-center" style="height: 700px;">
    <div class="col-12 text-center">
      <h1 class="display-4 fw-bold text-primary">Hospital Management System</h1>
      <p class="lead mt-3">Manage doctors, patients and appointments efficiently</p>
      <div class="mt-4" v-if="!auth.isLoggedIn">
        <router-link class="btn btn-primary btn-lg me-3" to="/login">Login</router-link>
        <router-link class="btn btn-warning btn-lg" to="/register">Register</router-link>
      </div>
      <div class="mt-4" v-else>
        <router-link class="btn btn-primary btn-lg" :to="'/' + auth.role">Go to Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'

export default {
  setup() {
    const auth = useAuthStore()
    return { auth }
  }
}
</script>
