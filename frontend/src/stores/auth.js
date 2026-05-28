import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('auth_token') || null,
        username: localStorage.getItem('username') || '',
        userId: localStorage.getItem('user_id') || null,
        roles: JSON.parse(localStorage.getItem('roles') || '[]')
    }),
    getters: {
        isLoggedIn: (state) => !!state.token,
        isAdmin: (state) => state.roles.includes('admin'),
        isDoctor: (state) => state.roles.includes('doctor'),
        isPatient: (state) => state.roles.includes('patient'),
        role: (state) => {
            if (state.roles.includes('admin')) return 'admin'
            if (state.roles.includes('doctor')) return 'doctor'
            if (state.roles.includes('patient')) return 'patient'
            return ''
        }
    },
    actions: {
        login(data) {
            this.token = data.auth_token
            this.username = data.username
            this.userId = data.id
            this.roles = data.roles
            localStorage.setItem('auth_token', data.auth_token)
            localStorage.setItem('username', data.username)
            localStorage.setItem('user_id', data.id)
            localStorage.setItem('roles', JSON.stringify(data.roles))
        },
        logout() {
            this.token = null
            this.username = ''
            this.userId = null
            this.roles = []
            localStorage.clear()
        }
    }
})
