import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { authService } from '@/services/auth.service'

const IcSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
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
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
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

export default function Login() {
  const navigate      = useNavigate()
  const { login }     = useAuth()
  const { theme, toggle } = useTheme()

  const [form, setForm]         = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [focused, setFocused]   = useState('')

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
      const msg = err.response?.data?.message || 'Error al conectar con el servidor'
      setError(msg)
      const card = document.getElementById('login-card')
      card?.classList.add('shake')
      setTimeout(() => card?.classList.remove('shake'), 500)
    } finally {
      setLoading(false)
    }
  }

  const inputBorderStyle = (field) => {
    if (focused === field) return '2px solid #B6CD38'
    if (error && !form[field]) return '2px solid #E72D8B'
    return isDark ? '1.5px solid #237AAA' : '1.5px solid #1D547D'
  }

  const inputRing = (field) => {
    if (focused === field) return '0 0 0 3px rgba(182,205,56,0.15)'
    if (error && !form[field]) return '0 0 0 3px rgba(231,45,139,0.10)'
    return 'none'
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          20%    { transform:translateX(-8px) }
          40%    { transform:translateX(8px) }
          60%    { transform:translateX(-5px) }
          80%    { transform:translateX(5px) }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes spinR { to { transform:rotate(360deg) } }
        @keyframes orbPulse {
          0%,100% { transform:translate(-50%,-50%) scale(1); opacity:.6 }
          50%     { transform:translate(-50%,-50%) scale(1.08); opacity:1 }
        }
        .shake    { animation: shake .5s ease }
        .fade-up  { animation: fadeUp .55s cubic-bezier(.16,1,.3,1) both }
        .spinner  { animation: spinR .75s linear infinite }
        .d1 { animation-delay: 50ms }
        .d2 { animation-delay: 110ms }
        .d3 { animation-delay: 170ms }
        .d4 { animation-delay: 230ms }
        .orb { animation: orbPulse 6s ease-in-out infinite }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px ${isDark ? '#1a3a5c' : '#e8f1f8'} inset !important;
          -webkit-text-fill-color: ${isDark ? '#F1F6F6' : '#0C0F14'} !important;
        }
        @media (max-width: 400px) {
          #login-card { margin: 0 8px !important; padding: 28px 20px !important; }
        }
      `}</style>

      {/* Fondo */}
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at 60% 40%, #0e1d35 0%, #0C0F14 60%)'
          : 'radial-gradient(ellipse at 60% 40%, #dce8f0 0%, #F1F6F6 60%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* Orbs decorativos */}
        {isDark ? (
          <>
            <div className="orb" style={{
              position: 'absolute', width: 500, height: 500,
              borderRadius: '50%', pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(0,117,63,0.12) 0%, transparent 65%)',
              top: '30%', left: '20%', transform: 'translate(-50%,-50%)',
            }}/>
            <div style={{
              position: 'absolute', width: 400, height: 400,
              borderRadius: '50%', pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(35,122,170,0.10) 0%, transparent 65%)',
              top: '70%', left: '80%', transform: 'translate(-50%,-50%)',
            }}/>
          </>
        ) : (
          <div style={{
            position: 'absolute', width: 600, height: 600,
            borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(29,84,125,0.06) 0%, transparent 65%)',
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          }}/>
        )}

        {/* Toggle tema */}
        <button
          onClick={toggle}
          style={{
            position: 'absolute', top: 20, right: 20,
            padding: '10px', borderRadius: 12, cursor: 'pointer',
            border: isDark ? '1.5px solid #237AAA' : '1.5px solid #1D547D',
            background: isDark ? '#0e2440' : 'white',
            color: isDark ? '#B6CD38' : '#1D547D',
            transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Cambiar tema"
        >
          {isDark ? <IcSun /> : <IcMoon />}
        </button>

        {/* Card */}
        <div
          id="login-card"
          className="fade-up"
          style={{
            width: '100%', maxWidth: 400,
            margin: '0 16px',
            borderRadius: 20,
            padding: '36px 32px',
            background: isDark
              ? 'linear-gradient(145deg, #0f2236 0%, #0a1929 100%)'
              : 'white',
            border: isDark ? '1.5px solid #1D547D' : '1.5px solid #c8dce8',
            boxShadow: isDark
              ? '0 32px 80px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(35,122,170,0.1)'
              : '0 20px 60px -8px rgba(29,84,125,0.12), 0 0 0 1px rgba(29,84,125,0.06)',
          }}
        >
          {/* Header */}
          <div className="fade-up d1" style={{ marginBottom: 28 }}>
            {/* Logo */}
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
              boxShadow: '0 6px 20px -4px rgba(0,117,63,0.45)',
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 18, userSelect: 'none' }}>P</span>
            </div>

            <h1 style={{
              fontSize: 22, fontWeight: 600, lineHeight: 1.2, margin: 0,
              color: isDark ? '#F1F6F6' : '#0C0F14',
            }}>
              Bienvenido
            </h1>
            <p style={{
              fontSize: 13, marginTop: 6, marginBottom: 0,
              color: isDark ? '#237AAA' : '#1D547D',
            }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={submit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Usuario */}
              <div className="fade-up d2">
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600,
                  marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase',
                  color: '#00753F',
                }}>
                  Usuario
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none',
                    color: focused === 'username' ? '#B6CD38' : isDark ? '#237AAA' : '#1D547D',
                    transition: 'color .15s',
                  }}>
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
                    style={{
                      width: '100%', padding: '10px 14px 10px 40px',
                      borderRadius: 12, fontSize: 14, outline: 'none',
                      fontFamily: 'inherit',
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                      color: isDark ? '#F1F6F6' : '#0C0F14',
                      border: inputBorderStyle('username'),
                      boxShadow: inputRing('username'),
                      transition: 'border .15s, box-shadow .15s',
                    }}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="fade-up d3">
                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 600,
                  marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase',
                  color: '#00753F',
                }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none',
                    color: focused === 'password' ? '#B6CD38' : isDark ? '#237AAA' : '#1D547D',
                    transition: 'color .15s',
                  }}>
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
                    style={{
                      width: '100%', padding: '10px 44px 10px 40px',
                      borderRadius: 12, fontSize: 14, outline: 'none',
                      fontFamily: 'inherit',
                      background: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                      color: isDark ? '#F1F6F6' : '#0C0F14',
                      border: inputBorderStyle('password'),
                      boxShadow: inputRing('password'),
                      transition: 'border .15s, box-shadow .15s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                    style={{
                      position: 'absolute', right: 13, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: isDark ? '#237AAA' : '#1D547D',
                      transition: 'color .15s',
                      display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#B6CD38'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? '#237AAA' : '#1D547D'}
                  >
                    <IcEye open={showPass} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(231,45,139,0.08)',
                  border: '1.5px solid rgba(231,45,139,0.25)',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#E72D8B', flexShrink: 0,
                  }}/>
                  <p style={{ fontSize: 12, color: '#E72D8B', fontWeight: 500, margin: 0 }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Botón */}
              <div className="fade-up d4" style={{ marginTop: 4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '11px 16px',
                    borderRadius: 12, fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? .7 : 1,
                    background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
                    boxShadow: loading ? 'none' : '0 6px 20px -4px rgba(0,117,63,0.45)',
                    transition: 'opacity .2s, box-shadow .2s, transform .1s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => {
                    if (!loading) {
                      e.currentTarget.style.boxShadow = '0 8px 28px -4px rgba(0,117,63,0.6)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!loading) {
                      e.currentTarget.style.boxShadow = '0 6px 20px -4px rgba(0,117,63,0.45)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
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

          {/* Divider + footer */}
          <div style={{
            marginTop: 24, paddingTop: 20,
            borderTop: isDark ? '1px solid rgba(35,122,170,0.2)' : '1px solid rgba(29,84,125,0.1)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, margin: 0, color: isDark ? '#237AAA' : '#1D547D' }}>
              Sistema de gestión —{' '}
              <span style={{ color: '#00753F', fontWeight: 600 }}>La Pale</span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}