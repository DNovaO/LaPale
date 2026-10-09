import { createContext, useContext, useState, useEffect } from 'react'
import client from '@/api/client'
import { clearPosDraft } from '@/posDraft'
import { clearActivity, clearSessionRedirectFlag, startSessionWatch, touchActivity } from '@/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [token, setToken]   = useState(() => localStorage.getItem('token'))
  const [loading]           = useState(false)

  useEffect(() => {
    startSessionWatch()
    if (localStorage.getItem('token')) {
      touchActivity()
      client.get('/update-printer-ip').catch(() => {})
    }
  }, [])

  const login = async (data) => {
    clearSessionRedirectFlag()
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    touchActivity()

    // Actualizar IP de la impresora automáticamente al hacer login
    try {
      await client.get('/update-printer-ip')
    } catch (e) {
      if (e?.response?.status !== 401) {
        console.warn('No se pudo actualizar IP impresora:', e)
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    clearPosDraft()
    clearActivity()
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
