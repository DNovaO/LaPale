import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider }  from '@/context/AuthContext'
import ProtectedRoute    from '@/routes/ProtectedRoute'
import MainLayout        from '@/layouts/MainLayout'
import Login             from '@/pages/Login'
import Dashboard         from '@/pages/Dashboard'
import POS               from '@/pages/POS'
import Inventario        from '@/pages/Inventario'
import Ventas            from '@/pages/Ventas'
import Finanzas          from '@/pages/Finanzas'
import Usuarios          from '@/pages/Usuarios'
import Bitacora          from '@/pages/Bitacora'

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
          <Route path="/pos" element={<AppLayout><POS /></AppLayout>} />
          <Route path="/ventas" element={<AppLayout><Ventas /></AppLayout>} />
          <Route path="/finanzas" element={<AppLayout><Finanzas /></AppLayout>} />
          <Route path="/usuarios" element={<AppLayout><Usuarios /></AppLayout>} />
          <Route path="/bitacora" element={<AppLayout><Bitacora /></AppLayout>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}