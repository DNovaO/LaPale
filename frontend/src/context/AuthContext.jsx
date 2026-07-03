import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [token, setToken]   = useState(() => {
    const savedToken = localStorage.getItem('token')
    // Si hay token guardado, actualizar IP de impresora en background
    if (savedToken) {
      fetch('/api/update-printer-ip', {
        headers: { Authorization: `Bearer ${savedToken}` }
      }).catch(() => {})
    }
    return savedToken
  })
  const [loading]           = useState(false)

  const login = async (data) => {
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))

    // Actualizar IP de la impresora automáticamente al hacer login
    try {
      await fetch('/api/update-printer-ip', {
        headers: { Authorization: `Bearer ${data.token}` }
      })
    } catch (e) {
      console.warn('No se pudo actualizar IP impresora:', e)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
