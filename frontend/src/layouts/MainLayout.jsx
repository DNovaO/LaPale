import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const IcDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const IcPOS = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)
const IcInventario = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IcVentas = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IcUsuarios = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IcFinanzas = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
)
const IcBitacora = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IcLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IcMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IcGift = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
)
const IcCash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
  </svg>
)
const IcSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
)
const IcMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const NAV_ITEMS = [
  { to: '/dashboard',   label: 'Dashboard',   icon: IcDashboard,  roles: ['administrador', 'cajero'] },
  { to: '/pos',         label: 'Punto de Venta', icon: IcPOS,      roles: ['administrador', 'vendedor'] },
  { to: '/cobro',       label: 'Cobro',        icon: IcCash,       roles: ['cajero'] },
  { to: '/inventario',  label: 'Inventario',  icon: IcInventario, roles: ['administrador'] },
  { to: '/ventas',      label: 'Ventas',      icon: IcVentas,     roles: ['administrador', 'cajero'] },
  { to: '/finanzas',    label: 'Finanzas',    icon: IcFinanzas,   roles: ['administrador', 'cajero'] },
  { to: '/usuarios',    label: 'Usuarios',    icon: IcUsuarios,   roles: ['administrador'] },
  { to: '/bitacora',    label: 'Bitácora',    icon: IcBitacora,   roles: ['administrador'] },
  { to: '/cortesias',   label: 'Cortesías',   icon: IcGift,       roles: ['administrador'] },
]

export default function MainLayout({ children }) {
  const { user, logout }    = useAuth()
  const { theme, toggle }   = useTheme()
  const navigate             = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDark = theme === 'dark'

  const closeMobile = () => setMobileOpen(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = NAV_ITEMS.filter(item => item.roles.includes(user?.rol))

  const C = {
    sidebar: isDark
      ? { bg: '#0a1929', border: 'rgba(35,122,170,0.15)' }
      : { bg: '#ffffff', border: 'rgba(29,84,125,0.12)' },
    header: isDark
      ? { bg: 'rgba(10,25,41,0.95)', border: 'rgba(35,122,170,0.15)' }
      : { bg: 'rgba(255,255,255,0.95)', border: 'rgba(29,84,125,0.10)' },
    body: isDark ? '#0C0F14' : '#F1F6F6',
    text: isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    navHover: isDark ? 'rgba(35,122,170,0.12)' : 'rgba(29,84,125,0.06)',
    navActive: isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)',
    navActiveText: '#B6CD38',
    navActiveIcon: '#B6CD38',
  }

  const sidebarBaseStyle = {
    width: collapsed ? 64 : 220,
    minHeight: '100vh',
    background: C.sidebar.bg,
    borderRight: `1px solid ${C.sidebar.border}`,
    display: 'flex', flexDirection: 'column',
    transition: 'width .25s cubic-bezier(.4,0,.2,1)',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'sticky', top: 0, height: '100vh',
    zIndex: 40,
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
        }
      `}</style>

      <div style={{
        display: 'flex', minHeight: '100vh',
        background: C.body,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* Desktop Sidebar */}
        <aside className="sidebar-desktop" style={sidebarBaseStyle}>
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="sidebar-mobile" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
            <div onClick={closeMobile} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
            <aside style={{ ...sidebarBaseStyle, width: 220, position: 'absolute', top: 0, left: 0, bottom: 0 }}>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          <header style={{
            height: 64, padding: '0 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: C.header.bg,
            borderBottom: `1px solid ${C.header.border}`,
            backdropFilter: 'blur(12px)',
            position: 'sticky', top: 0, zIndex: 30,
          }}>
            <button
              onClick={() => window.innerWidth <= 768 ? setMobileOpen(o => !o) : setCollapsed(c => !c)}
              style={{
                padding: 8, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: C.subtext, display: 'flex',
                transition: 'background .15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.navHover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <IcMenu />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={toggle} style={{
                padding: 8, borderRadius: 8,
                border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
                background: 'transparent', cursor: 'pointer',
                color: isDark ? '#B6CD38' : '#1D547D',
                display: 'flex', transition: 'all .15s',
                fontFamily: 'inherit',
              }}>
                {isDark ? <IcSun /> : <IcMoon />}
              </button>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1D547D 0%, #237AAA 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: 13,
              }}>
                {user?.nombre?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          </header>

          <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  )

  function SidebarContent() { return (
    <>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        display: 'flex', alignItems: 'center',
        gap: 10, borderBottom: `1px solid ${C.sidebar.border}`,
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 64,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px -2px rgba(0,117,63,0.4)',
        }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>P</span>
        </div>
        {!collapsed && (
          <span style={{ color: C.text, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap' }}>
            La Pale
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMobile}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: 10, padding: collapsed ? '10px 0' : '9px 12px',
              borderRadius: 10, marginBottom: 2,
              textDecoration: 'none', cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: isActive ? C.navActive : 'transparent',
              color: isActive ? C.navActiveText : C.subtext,
              fontWeight: isActive ? 600 : 400,
              fontSize: 13,
              transition: 'background .15s, color .15s',
              whiteSpace: 'nowrap',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.getAttribute('aria-current'))
                e.currentTarget.style.background = C.navHover
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('aria-current'))
                e.currentTarget.style.background = 'transparent'
            }}
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? C.navActiveIcon : C.subtext, flexShrink: 0 }}>
                  <Icon />
                </span>
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '12px 8px', borderTop: `1px solid ${C.sidebar.border}` }}>
        {!collapsed && (
          <div style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 6,
            background: isDark ? 'rgba(35,122,170,0.08)' : 'rgba(29,84,125,0.05)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.nombre}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: C.subtext, marginTop: 2 }}>{user?.rol}</p>
          </div>
        )}
        <button onClick={handleLogout} style={{
          width: '100%', padding: collapsed ? '10px 0' : '9px 12px',
          borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'transparent', display: 'flex', alignItems: 'center',
          gap: 10, color: '#E72D8B', fontSize: 13, fontWeight: 500,
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'background .15s', fontFamily: 'inherit',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,45,139,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <IcLogout />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </>
  )}
}