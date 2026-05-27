import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider }  from '@/context/AuthContext'
import ProtectedRoute    from '@/routes/ProtectedRoute'
import MainLayout        from '@/layouts/MainLayout'
import Login             from '@/pages/Login'
import Dashboard         from '@/pages/Dashboard'
import Inventario from '@/pages/Inventario'

function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/inventario" element={<AppLayout><Inventario /></AppLayout>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}