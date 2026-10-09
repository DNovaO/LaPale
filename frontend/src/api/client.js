import axios from 'axios'
import { expireSession } from '@/session'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Inyectar token en cada request
client.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Manejar 401 globalmente: redirección inmediata a login.
// Se excluye el propio login para no convertir credenciales inválidas en sesión expirada.
client.interceptors.response.use(
  res => res,
  err => {
    const url = String(err.config?.url || '')
    if (err.response?.status === 401 && !url.includes('/auth/login')) {
      expireSession('expired')
    }
    return Promise.reject(err)
  }
)

export default client