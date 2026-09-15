import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
})

// attach the stored JWT to every outgoing request, if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// if the backend says our token is invalid/expired/insufficient, clear session
// and bounce to login rather than showing a confusing broken page
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // only force-logout for calls made WITH a token - an unauthenticated call
      // failing (e.g. before login) shouldn't wipe anything
      const hadToken = Boolean(localStorage.getItem('token'))
      if (hadToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default client
