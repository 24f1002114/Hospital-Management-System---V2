import Navbar from './components/Navbar.js'
import Footer from './components/Footer.js'
import Home from './components/Home.js'
import Register from './components/Register.js'
import Login from './components/Login.js'
import Admin from './components/Admin.js'
import Doctor from './components/Doctor.js'
import Patient from './components/Patient.js'
import UpdateDoctor from './components/UpdateDoctor.js'
import UpdatePatient from './components/UpdatePatient.js'
import AddDoctor from './components/AddDoctor.js'
import Departments from './components/Departments.js'
import Book from './components/Book.js'
import CreateAvailability from './components/CreateAvailability.js'
import UpdatePatientHistory from './components/UpdatePatientHistory.js'
import PatientHistory from './components/PatientHistory.js'
import DoctorProfile from './components/DoctorProfile.js'
import ManageDepartement from './components/ManageDepartement.js'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/admin', component: Admin, meta: { Auth: true, roles: ['admin'] } },
  { path: '/doctor', component: Doctor, meta: { Auth: true, roles: ['doctor'] } },
  { path: '/patient', component: Patient, meta: { Auth: true, roles: ['patient'] } },
  { path: '/update/doctor/:id', component: UpdateDoctor, meta: { Auth: true, roles: ['admin'] } },
  { path: '/update/patient/:id', component: UpdatePatient, meta: { Auth: true, roles: ['admin', 'patient'] } },
  { path: '/add/doctor', component: AddDoctor, meta: { Auth: true, roles: ['admin'] } },
  { path: '/patient/departments/:id/', component: Departments, meta: { Auth: true, roles: ['patient'] } },
  { path: '/availability/:user_id/:department_name', component: Book, meta: { Auth: true, roles: ['patient'] } },
  { path: '/create/availability/:user_id', component: CreateAvailability, meta: { Auth: true, roles: ['doctor'] } },
  { path: '/update/patient/history/:id', component: UpdatePatientHistory, meta: { Auth: true, roles: ['doctor'] } },
  { path: '/patient/history/:patient_id/:department', component: PatientHistory, meta: { Auth: true, roles: ['doctor', 'patient', 'admin'] } },
  { path: '/doctor/:id', component: DoctorProfile, meta: { Auth: true, roles: ['patient', 'admin', 'doctor'] } },
  { path: '/manage/departments', component: ManageDepartement, meta: { Auth: true, roles: ['admin'] } }
]

const router = new VueRouter({ routes })

router.beforeEach((to, from, next) => {
  const authToken = localStorage.getItem('auth_token')
  const userRoles = JSON.parse(localStorage.getItem('roles') || '[]')

  if (to.meta && to.meta.Auth) {
    if (!authToken) {
      next('/login')
      return
    }
    const requiredRoles = to.meta.roles || []
    const hasRole = requiredRoles.some(role => userRoles.includes(role))
    if (hasRole) {
      next()
    } else {
      alert('You do not have permission to access this page')
      next('/login')
    }
  } else {
    next()
  }
})

const app = new Vue({
  el: '#app',
  router,
  template: `
    <div class="container">
      <nav-bar></nav-bar>
      <router-view></router-view>
      <footer-bar></footer-bar>
    </div>
  `,
  components: {
    'nav-bar': Navbar,
    'footer-bar': Footer
  }
})