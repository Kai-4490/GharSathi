import axios from 'axios'
import toast from 'react-hot-toast'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
export const TOKEN_KEY = 'gs_token'
export const USER_KEY = 'gs_user'

const client = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token && !config.url?.startsWith('/api/auth/')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let redirecting = false

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message
    const isAuthCall = error.config?.url?.startsWith('/api/auth/')

    // Security failures have no body: 401, or 403 without a message => session is gone.
    if (!isAuthCall && (status === 401 || (status === 403 && !message))) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (!redirecting && window.location.pathname !== '/login') {
        redirecting = true
        toast.error('Session expired')
        setTimeout(() => {
          redirecting = false
          window.location.assign('/login')
        }, 600)
      }
      error.handled = true
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error, fallback = 'Something went wrong') {
  if (error?.response?.data?.message) return error.response.data.message
  if (!error?.response && error?.message === 'Network Error')
    return 'Cannot reach the server. Is the backend running on port 8080?'
  return fallback
}

// Toast unless the interceptor already handled it (session expiry).
export function toastError(error, fallback) {
  if (error?.handled) return
  toast.error(errorMessage(error, fallback))
}

export default client
