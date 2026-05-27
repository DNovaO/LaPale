import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { usuariosService } from '@/services/usuarios.service'

const IcPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcToggle = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {active
      ? <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></>
      : <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor"/></>
    }
  </svg>
)
const IcKey = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)
const IcX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

function Modal({ open, onClose, title, children, isDark }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: isDark ? '#0a1929' : 'white',
        border: `1px solid ${isDark ? 'rgba(35,122,170,0.2)' : 'rgba(29,84,125,0.15)'}`,
        borderRadius: 20,
        boxShadow: isDark ? '0 32px 80px -12px rgba(0,0,0,0.8)' : '0 32px 80px -12px rgba(29,84,125,0.2)',
        animation: 'modalIn .2s cubic-bezier(.16,1,.3,1)',
      }}>
        <div style={{
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)'}`,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: isDark ? '#F1F6F6' : '#0C0F14' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: isDark ? '#237AAA' : '#1D547D', borderRadius: 6,
            display: 'flex', transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          ><IcX /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#8A6A4A', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const ROLES_FALLBACK = [
  { id: '', nombre: 'administrador' },
  { id: '', nombre: 'vendedor' },
]

export default function Usuarios() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState(ROLES_FALLBACK)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const [modalUsuario, setModalUsuario] = useState(false)
  const [editando, setEditando] = useState(null)
  const [formU, setFormU] = useState({ nombre: '', username: '', password: '', rol_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [modalPassword, setModalPassword] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  const C = {
    text:    isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    card:    isDark ? '#0a1929' : 'white',
    border:  isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)',
    hover:   isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [data, rolesData] = await Promise.all([
        usuariosService.getUsuarios(),
        usuariosService.getRoles().catch(() => []),
      ])
      setUsuarios(data || [])
      if (rolesData.length > 0) {
        setRoles(rolesData)
        const vendedor = rolesData.find(r => r.nombre === 'vendedor')
        if (vendedor && formU.rol_id === '') {
          setFormU(f => ({ ...f, rol_id: vendedor.id }))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const usuariosFiltrados = usuarios.filter(u => {
    const match = u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
    if (filtro === 'activos') return match && u.activo
    if (filtro === 'inactivos') return match && !u.activo
    return match
  })

  const abrirCrear = () => {
    setEditando(null)
    const vendedor = roles.find(r => r.nombre === 'vendedor')
    setFormU({ nombre: '', username: '', password: '', rol_id: vendedor?.id || roles[0]?.id || '' })
    setError('')
    setModalUsuario(true)
  }

  const abrirEditar = (u) => {
    setEditando(u)
    setFormU({ nombre: u.nombre, username: u.username, password: '', rol_id: u.rol_id || roles[0]?.id || '' })
    setError('')
    setModalUsuario(true)
  }

  const guardarUsuario = async () => {
    if (!formU.nombre.trim()) return setError('El nombre es requerido')
    if (!formU.username.trim()) return setError('El username es requerido')
    if (!editando && !formU.password.trim()) return setError('La contraseña es requerida')
    if (!editando && formU.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    setSaving(true); setError('')
    try {
      if (editando) {
        await usuariosService.updateUsuario(editando.id, {
          nombre: formU.nombre,
          rol_id: formU.rol_id,
        })
      } else {
        await usuariosService.createUsuario({
          nombre: formU.nombre,
          username: formU.username,
          password: formU.password,
          rol_id: formU.rol_id,
        })
      }
      setModalUsuario(false)
      fetchData()
    } catch (e) {
      console.error('Error al guardar usuario:', e)
      if (e.response) {
        console.error('Status:', e.response.status, e.response.statusText)
        console.error('Response data:', e.response.data)
      }
      const msg =
        e.response?.data?.message ||
        (typeof e.response?.data === 'string' ? e.response.data : null) ||
        e.response?.statusText ||
        e.message ||
        'Error al guardar'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (u) => {
    try {
      await usuariosService.updateEstado(u.id, !u.activo)
      fetchData()
    } catch {}
  }

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    setSavingPass(true); setError('')
    try {
      await usuariosService.changePassword(modalPassword.id, newPassword)
      setModalPassword(null)
      setNewPassword('')
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cambiar contraseña')
    } finally {
      setSavingPass(false)
    }
  }

  const TABS = [
    { key: 'todos', label: 'Todos', count: usuarios.length },
    { key: 'activos', label: 'Activos', count: usuarios.filter(u => u.activo).length },
    { key: 'inactivos', label: 'Inactivos', count: usuarios.filter(u => !u.activo).length },
  ]

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes modalIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .4s ease both }
        @media (max-width: 768px) {
          .filter-row { flex-direction: column !important; align-items: stretch !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:focus,
        select:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px ${isDark ? '#1a2d44' : '#e8f1f8'} inset !important;
          -webkit-text-fill-color: ${isDark ? '#F1F6F6' : '#0C0F14'} !important;
        }
        .usuarios-select {
          -webkit-appearance: none; appearance: none;
          background-image:
            linear-gradient(to right, transparent 85%, ${isDark ? 'rgba(182,205,56,0.08)' : 'rgba(182,205,56,0.15)'} 85%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B6CD38' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat, no-repeat;
          background-position: center, right 10px center;
          padding-right: 34px !important;
          cursor: pointer;
        }
        .usuarios-select:hover, .usuarios-select:focus {
          border-color: #B6CD38 !important;
        }
        .usuarios-select option {
          background: ${isDark ? '#0a1929' : 'white'};
          color: ${isDark ? '#F1F6F6' : '#0C0F14'};
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div className="fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Usuarios</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>{usuarios.length} usuarios registrados</p>
          </div>
          <button onClick={abrirCrear} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
            border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px -4px rgba(0,117,63,0.45)',
            transition: 'transform .15s, box-shadow .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px -4px rgba(0,117,63,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px -4px rgba(0,117,63,0.45)' }}
          >
            <IcPlus /> Nuevo usuario
          </button>
        </div>

        <div className="filter-row" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setFiltro(t.key)} style={{
                padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: filtro === t.key ? 600 : 400,
                fontFamily: 'inherit',
                background: filtro === t.key ? (isDark ? '#0a1929' : 'white') : 'transparent',
                color: filtro === t.key ? '#B6CD38' : C.subtext,
                boxShadow: filtro === t.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}>
                {t.label} {t.count > 0 && <span style={{ opacity: .7 }}>({t.count})</span>}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.subtext, pointerEvents: 'none' }}>
              <IcSearch />
            </span>
            <input
              placeholder="Buscar por nombre o username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 34px',
                borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit',
                background: C.card, color: C.text,
                border: `1px solid ${C.border}`,
                transition: 'border .15s',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #B6CD38'}
              onBlur={e => e.target.style.border = `1px solid ${C.border}`}
            />
          </div>
        </div>

        <div className="fade-in" style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden', overflowX: 'auto',
          boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
        }}>
          <div style={{ minWidth: 620 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 1fr 1fr 100px 120px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.border}`,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(29,84,125,0.03)',
          }}>
            {['Nombre', 'Username', 'Rol', 'Sucursal', 'Estado', 'Acciones'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 100px 120px', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                {Array(6).fill(0).map((_, j) => (
                  <div key={j} style={{ height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                ))}
              </div>
            ))
          ) : usuariosFiltrados.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>
              {search ? `Sin resultados para "${search}"` : 'Sin usuarios en esta categoría'}
            </div>
          ) : (
            usuariosFiltrados.map((u, i) => (
              <div key={u.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 100px 120px',
                padding: '12px 20px', alignItems: 'center',
                borderBottom: i < usuariosFiltrados.length - 1 ? `1px solid ${C.border}` : 'none',
                transition: 'background .15s',
                opacity: u.activo ? 1 : 0.5,
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{u.nombre}</span>
                <span style={{ fontSize: 13, color: C.subtext }}>@{u.username}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                  background: u.rol === 'administrador' ? 'rgba(231,45,139,0.12)' : 'rgba(35,122,170,0.12)',
                  color: u.rol === 'administrador' ? '#E72D8B' : '#237AAA',
                  display: 'inline-block', width: 'fit-content',
                }}>
                  {u.rol}
                </span>
                <span style={{ fontSize: 13, color: C.subtext }}>{u.sucursal || '—'}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                  background: u.activo ? 'rgba(182,205,56,0.12)' : 'rgba(138,106,74,0.12)',
                  color: u.activo ? '#B6CD38' : '#8A6A4A',
                  display: 'inline-block', width: 'fit-content',
                }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button title="Editar" onClick={() => abrirEditar(u)} style={{
                    padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'rgba(182,205,56,0.12)', color: '#B6CD38',
                    display: 'flex', transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(182,205,56,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(182,205,56,0.12)'}
                  >
                    <IcEdit />
                  </button>
                  <button title="Cambiar contraseña" onClick={() => { setModalPassword(u); setNewPassword(''); setError('') }} style={{
                    padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'rgba(35,122,170,0.12)', color: '#237AAA',
                    display: 'flex', transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,122,170,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(35,122,170,0.12)'}
                  >
                    <IcKey />
                  </button>
                  <button title={u.activo ? 'Desactivar' : 'Activar'} onClick={() => toggleActivo(u)} style={{
                    padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: u.activo ? 'rgba(231,45,139,0.10)' : 'rgba(0,117,63,0.10)',
                    color: u.activo ? '#E72D8B' : '#00753F',
                    display: 'flex', transition: 'background .15s',
                  }}>
                    <IcToggle active={u.activo} />
                  </button>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>

      {/* Modal - Crear/Editar usuario */}
      <Modal open={modalUsuario} onClose={() => setModalUsuario(false)} title={editando ? 'Editar usuario' : 'Nuevo usuario'} isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre *">
            <input placeholder="Nombre completo" value={formU.nombre} onChange={e => setFormU(f => ({ ...f, nombre: e.target.value }))} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', width: '100%',
              background: C.inputBg, color: C.text,
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
            }} />
          </Field>

          <Field label="Username *">
            <input placeholder="Nombre de usuario" value={formU.username} onChange={e => setFormU(f => ({ ...f, username: e.target.value }))} disabled={!!editando} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', width: '100%', opacity: editando ? 0.5 : 1,
              background: C.inputBg, color: C.text,
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
            }} />
          </Field>

          {!editando && (
            <Field label="Contraseña *">
              <input type="password" placeholder="Mínimo 6 caracteres" value={formU.password} onChange={e => setFormU(f => ({ ...f, password: e.target.value }))} style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', width: '100%',
              background: C.inputBg, color: C.text,
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              }} />
            </Field>
          )}

          <Field label="Rol">
            <select className="usuarios-select" value={formU.rol_id} onChange={e => setFormU(f => ({ ...f, rol_id: e.target.value }))} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', width: '100%',
              backgroundColor: C.inputBg, color: C.text,
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              cursor: 'pointer',
            }}>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </Field>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setModalUsuario(false)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={guardarUsuario} disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: saving ? .7 : 1,
              boxShadow: '0 4px 12px -4px rgba(0,117,63,0.4)',
            }}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal - Cambiar contraseña */}
      <Modal open={!!modalPassword} onClose={() => setModalPassword(null)} title={`Cambiar contraseña — ${modalPassword?.nombre || ''}`} isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nueva contraseña *">
            <input type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', width: '100%',
              background: C.inputBg, color: C.text,
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
            }} />
          </Field>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setModalPassword(null)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={changePassword} disabled={savingPass} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #237AAA 0%, #1D547D 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: savingPass ? .7 : 1,
            }}>
              {savingPass ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
