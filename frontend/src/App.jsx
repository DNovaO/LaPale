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
import Cortesias         from '@/pages/Cortesias'
import Cobro             from '@/pages/Cobro'

const ADMIN = ['administrador']
const VENDEDOR = ['administrador', 'vendedor']
const CAJERO = ['administrador', 'cajero']

function AppLayout({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
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
          <Route path="/dashboard" element={<AppLayout roles={CAJERO}><Dashboard /></AppLayout>} />
          <Route path="/inventario" element={<AppLayout roles={ADMIN}><Inventario /></AppLayout>} />
          <Route path="/pos" element={<AppLayout roles={VENDEDOR}><POS /></AppLayout>} />
          <Route path="/cobro" element={<AppLayout roles={CAJERO}><Cobro /></AppLayout>} />
          <Route path="/ventas" element={<AppLayout roles={CAJERO}><Ventas /></AppLayout>} />
          <Route path="/finanzas" element={<AppLayout roles={CAJERO}><Finanzas /></AppLayout>} />
          <Route path="/usuarios" element={<AppLayout roles={ADMIN}><Usuarios /></AppLayout>} />
          <Route path="/bitacora" element={<AppLayout roles={ADMIN}><Bitacora /></AppLayout>} />
          <Route path="/cortesias" element={<AppLayout roles={ADMIN}><Cortesias /></AppLayout>} />
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}