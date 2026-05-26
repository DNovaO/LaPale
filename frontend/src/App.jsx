import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider }  from '@/context/AuthContext'
import ProtectedRoute    from '@/routes/ProtectedRoute'
import Login             from '@/pages/Login'

// Placeholder temporal para dashboard
const Dashboard = () => (
  <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
    <p className="text-white text-lg font-medium">Dashboard — próximamente</p>
  </div>
)

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          }/>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}