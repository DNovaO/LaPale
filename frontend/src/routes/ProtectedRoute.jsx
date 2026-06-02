import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, token, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f11]">
      <div className="w-6 h-6 border-2 border-[#f97316] border-t-transparent
                      rounded-full animate-spin" />
    </div>
  )

  if (!user || !token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.rol)) return <Navigate to="/pos" replace />
  return children
}