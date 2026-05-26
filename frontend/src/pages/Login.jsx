import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { authService } from '@/services/auth.service'

// ── Íconos inline ────────────────────────────────────────────
const IcSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41
             M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
  </svg>
)

const IcMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const IcEye = ({ open }) => open ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8
             a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12
             4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07
             a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const IcLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IcUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IcArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

// ── Componente principal ─────────────────────────────────────
export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const { theme, toggle } = useTheme()

  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [focused, setFocused] = useState('')

  const isDark = theme === 'dark'

  const handle = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.username.trim()) return setError('Ingresa tu usuario')
    if (!form.password)        return setError('Ingresa tu contraseña')

    setLoading(true)
    setError('')

    try {
      const data = await authService.login(form.username.trim(), form.password)
      login(data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al conectar con el servidor'
      setError(msg)
      // Shake animation
      const card = document.getElementById('login-card')
      card?.classList.add('shake')
      setTimeout(() => card?.classList.remove('shake'), 500)
    } finally {
      setLoading(false)
    }
  }

  // ── Clases dinámicas ────────────────────────────────────────
  const bg    = isDark ? 'bg-[#0f0f11]'   : 'bg-[#f0f0f4]'
  const card  = isDark ? 'bg-[#18181c] border-[#2c2c35]' : 'bg-white border-[#e4e4ea]'
  const label = isDark ? 'text-[#9898a8]' : 'text-[#52525f]'
  const text  = isDark ? 'text-white'     : 'text-[#0f0f11]'
  const sub   = isDark ? 'text-[#52525f]' : 'text-[#9898a8]'
  const inputBg = isDark ? 'bg-[#222228]' : 'bg-[#f8f8fa]'
  const inputBorder = (field) =>
    focused === field
      ? 'border-[#f97316] ring-2 ring-[#f97316]/20'
      : error && !form[field]
        ? 'border-[#ef4444] ring-2 ring-[#ef4444]/10'
        : isDark ? 'border-[#2c2c35]' : 'border-[#e4e4ea]'
  const iconColor = isDark ? 'text-[#52525f]' : 'text-[#9898a8]'

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100%{ transform: translateX(0) }
          20%    { transform: translateX(-8px) }
          40%    { transform: translateX(8px) }
          60%    { transform: translateX(-5px) }
          80%    { transform: translateX(5px) }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        .shake   { animation: shake 0.5s ease }
        .fade-up { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) both }
        .spinner { animation: spin 0.7s linear infinite }
        .delay-1 { animation-delay: 60ms }
        .delay-2 { animation-delay: 120ms }
        .delay-3 { animation-delay: 180ms }
        .delay-4 { animation-delay: 240ms }
      `}</style>

      {/* Fondo con gradiente sutil */}
      <div className={`min-h-screen w-full flex items-center justify-center ${bg} relative overflow-hidden`}>

        {/* Orb decorativo — solo dark */}
        {isDark && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: 600, height: 600,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}

        {/* Toggle tema */}
        <button
          onClick={toggle}
          className={`
            absolute top-5 right-5 p-2.5 rounded-xl border cursor-pointer
            transition-all duration-200 hover:scale-105 active:scale-95
            ${isDark
              ? 'bg-[#222228] border-[#2c2c35] text-[#9898a8] hover:text-white hover:border-[#3a3a46]'
              : 'bg-white border-[#e4e4ea] text-[#52525f] hover:text-[#0f0f11] hover:border-[#c8c8d4]'
            }
          `}
          aria-label="Cambiar tema"
        >
          {isDark ? <IcSun /> : <IcMoon />}
        </button>

        {/* Card */}
        <div
          id="login-card"
          className={`
            relative w-full max-w-[400px] mx-4
            border rounded-2xl p-8
            ${card}
            fade-up
          `}
          style={{
            boxShadow: isDark
              ? '0 24px 64px -8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
              : '0 16px 48px -8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
          }}
        >
          {/* Header */}
          <div className="mb-8 fade-up delay-1">
            {/* Logo mark */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea6c0a 100%)',
                boxShadow: '0 6px 16px -2px rgba(249,115,22,0.40)',
              }}
            >
              <span className="text-white font-bold text-lg select-none">P</span>
            </div>

            <h1 className={`text-[22px] font-semibold leading-tight ${text}`}>
              Bienvenido
            </h1>
            <p className={`text-sm mt-1 ${sub}`}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={submit} noValidate>
            <div className="flex flex-col gap-4">

              {/* Usuario */}
              <div className="fade-up delay-2">
                <label className={`block text-xs font-medium mb-1.5 ${label}`}>
                  Usuario
                </label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconColor} pointer-events-none`}>
                    <IcUser />
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handle}
                    onFocus={() => setFocused('username')}
                    onBlur={() => setFocused('')}
                    placeholder="tu_usuario"
                    autoComplete="username"
                    className={`
                      w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm
                      outline-none transition-all duration-150
                      ${inputBg} ${text} ${inputBorder('username')}
                      placeholder:text-[#52525f]
                    `}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="fade-up delay-3">
                <label className={`block text-xs font-medium mb-1.5 ${label}`}>
                  Contraseña
                </label>
                <div className="relative">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${iconColor} pointer-events-none`}>
                    <IcLock />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handle}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`
                      w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm
                      outline-none transition-all duration-150
                      ${inputBg} ${text} ${inputBorder('password')}
                      placeholder:text-[#52525f]
                    `}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className={`
                      absolute right-3.5 top-1/2 -translate-y-1/2
                      ${iconColor} hover:text-[#f97316]
                      transition-colors duration-150 cursor-pointer
                    `}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <IcEye open={showPass} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl
                             bg-[#ef4444]/10 border border-[#ef4444]/20"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] shrink-0" />
                  <p className="text-xs text-[#ef4444] font-medium">{error}</p>
                </div>
              )}

              {/* Botón submit */}
              <div className="fade-up delay-4 mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full py-2.5 px-4 rounded-xl text-sm font-semibold
                    flex items-center justify-center gap-2
                    text-white cursor-pointer
                    transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed
                    active:scale-[0.98]
                  `}
                  style={{
                    background: loading
                      ? '#ea6c0a'
                      : 'linear-gradient(135deg, #f97316 0%, #ea6c0a 100%)',
                    boxShadow: loading ? 'none' : '0 6px 20px -4px rgba(249,115,22,0.45)',
                  }}
                  onMouseEnter={e => {
                    if (!loading) e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(249,115,22,0.55)'
                  }}
                  onMouseLeave={e => {
                    if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px -4px rgba(249,115,22,0.45)'
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83
                                 M16.24 16.24l2.83 2.83M2 12h4M18 12h4
                                 M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                          strokeLinecap="round"/>
                      </svg>
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Ingresar
                      <IcArrow />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <p className={`text-center text-xs mt-6 ${sub}`}>
            Sistema de gestión — La Pale
          </p>
        </div>
      </div>
    </>
  )
}