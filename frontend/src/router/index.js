import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    { path: '/', component: () => import('@/views/Home.vue') },
    { path: '/login', component: () => import('@/views/Login.vue') },
    { path: '/register', component: () => import('@/views/Register.vue') },
    { path: '/admin', component: () => import('@/views/Admin.vue'),
      meta: { auth: true, roles: ['admin'] } },
    { path: '/doctor', component: () => import('@/views/Doctor.vue'),
      meta: { auth: true, roles: ['doctor'] } },
    { path: '/patient', component: () => import('@/views/Patient.vue'),
      meta: { auth: true, roles: ['patient'] } },
    { path: '/update/doctor/:id', component: () => import('@/views/UpdateDoctor.vue'),
      meta: { auth: true, roles: ['admin'] } },
    { path: '/update/patient/:id', component: () => import('@/views/UpdatePatient.vue'),
      meta: { auth: true, roles: ['admin', 'patient'] } },
    { path: '/add/doctor', component: () => import('@/views/AddDoctor.vue'),
      meta: { auth: true, roles: ['admin'] } },
    { path: '/patient/departments/:id', component: () => import('@/views/Departments.vue'),
      meta: { auth: true, roles: ['patient'] } },
    { path: '/availability/:user_id/:department_name', component: () => import('@/views/Book.vue'),
      meta: { auth: true, roles: ['patient'] } },
    { path: '/create/availability/:user_id', component: () => import('@/views/CreateAvailability.vue'),
      meta: { auth: true, roles: ['doctor'] } },
    { path: '/update/patient/history/:id', component: () => import('@/views/UpdatePatientHistory.vue'),
      meta: { auth: true, roles: ['doctor'] } },
    { path: '/patient/history/:patient_id/:department', component: () => import('@/views/PatientHistory.vue'),
      meta: { auth: true, roles: ['doctor', 'patient', 'admin'] } },
    { path: '/doctor/:id', component: () => import('@/views/DoctorProfile.vue'),
      meta: { auth: true, roles: ['patient', 'admin', 'doctor'] } },
    { path: '/manage/departments', component: () => import('@/views/ManageDepartment.vue'),
      meta: { auth: true, roles: ['admin'] } }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const auth = useAuthStore()

    if (to.meta.auth) {
        if (!auth.isLoggedIn) {
            next('/login')
            return
        }
        const hasRole = to.meta.roles.some(r => auth.roles.includes(r))
        if (!hasRole) {
            alert('You do not have permission to access this page')
            next('/login')
            return
        }
    }
    next()
})

export default router
