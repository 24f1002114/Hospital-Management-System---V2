import axios from 'axios'
import router from '@/router'

const api = axios.create({
    baseURL: '',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Auto attach token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token')
    if (token) {
        config.headers['Authentication-Token'] = token
    }
    return config
})

// Auto handle 401 globally
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.clear()
            router.push('/login')
        }
        return Promise.reject(error)
    }
)

export default api
