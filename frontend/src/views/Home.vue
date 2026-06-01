<template>
  <div class="home-container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container py-5">
        <div class="row align-items-center">
          <div class="col-lg-6 text-center text-lg-start mb-5 mb-lg-0">
            <h1 class="display-3 fw-bold mb-3">Hospital Management System</h1>
            <p class="lead text-muted mb-4">Streamline healthcare operations with our comprehensive management solution for doctors, patients, and appointments.</p>
            <div class="button-group" v-if="!auth.isLoggedIn">
              <router-link class="btn btn-primary btn-lg me-3" to="/login">Sign In</router-link>
              <router-link class="btn btn-outline-primary btn-lg" to="/register">Create Account</router-link>
            </div>
            <router-link class="btn btn-primary btn-lg" v-else :to="'/' + auth.role">Access Dashboard</router-link>
          </div>
          <div class="col-lg-6">
            <div class="features-grid">
              <div class="feature-card">
                <div class="feature-icon">👨‍⚕️</div>
                <h5>Doctor Management</h5>
                <p>Manage physician profiles and specializations</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h5>Patient Records</h5>
                <p>Maintain comprehensive patient information</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">📅</div>
                <h5>Appointments</h5>
                <p>Schedule and track patient appointments</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🏥</div>
                <h5>Departments</h5>
                <p>Organize services by department</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section" v-if="!auth.isLoggedIn">
      <div class="container">
        <div class="text-center">
          <h2 class="mb-3">Ready to Get Started?</h2>
          <p class="text-muted mb-4">Join our platform to revolutionize your healthcare management experience</p>
          <router-link class="btn btn-primary btn-lg px-5" to="/register">Get Started Today</router-link>
        </div>
      </div>
    </section>
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

<style scoped>
.home-container {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

.hero-section {
  padding: 80px 0;
  border-bottom: 1px solid var(--border);
}

.hero-section h1 {
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 20px;
}

.hero-section .lead {
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--muted);
  font-weight: 400;
  opacity: 1;
}

html.dark-theme .hero-section .lead {
  color: #cbd5e1;
}

html.dark-theme .hero-section p.text-muted {
  color: #cbd5e1 !important;
}

.button-group {
  margin-top: 30px;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 40px;
}

.feature-card {
  background: var(--card);
  padding: 25px;
  border-radius: 12px;
  border: 1px solid var(--border);
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  border-color: var(--primary);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.feature-card h5 {
  color: var(--text);
  font-weight: 600;
  margin-bottom: 10px;
}

.feature-card p {
  color: var(--muted);
  font-size: 0.95rem;
  margin: 0;
  opacity: 1;
}

html.dark-theme .feature-card p {
  color: #cbd5e1;
}

.cta-section {
  padding: 60px 0;
  background: rgba(13, 110, 253, 0.05);
  border-top: 1px solid var(--border);
}

.cta-section h2 {
  color: var(--text);
  font-weight: 700;
  margin-bottom: 15px;
}

.cta-section .text-muted {
  color: var(--muted) !important;
  font-size: 1.1rem;
  opacity: 1;
}

html.dark-theme .cta-section .text-muted {
  color: #cbd5e1 !important;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 0;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .hero-section h1 {
    font-size: 2rem;
  }

  .btn-lg {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
