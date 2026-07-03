import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { cortesiasService } from '@/services/cortesias.service'
import { inventarioService } from '@/services/inventario.service'

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-MX') : ''

const IcPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IcTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
const IcToggle = ({ active }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{active ? <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></> : <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor"/></>}</svg>
const IcX = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

function Modal({ open, onClose, title, children, isDark }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 500, background: isDark ? '#0a1929' : 'white', border: `1px solid ${isDark ? 'rgba(35,122,170,0.2)' : 'rgba(29,84,125,0.15)'}`, borderRadius: 20, boxShadow: isDark ? '0 32px 80px -12px rgba(0,0,0,0.8)' : '0 32px 80px -12px rgba(29,84,125,0.2)' }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)'}` }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: isDark ? '#F1F6F6' : '#0C0F14' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isDark ? '#237AAA' : '#1D547D', borderRadius: 6, display: 'flex' }}><IcX /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, hint, C, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <label style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{hint}</span>}
    </div>
  )
}

export default function Cortesias() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [tab, setTab] = useState('reglas')
  const [reglas, setReglas] = useState([])
  const [productos, setProductos] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '', monto_minimo: 0, monto_maximo: '',
    producto_id: '', cantidad: 1, limite_diario: 0, activa: true,
  })

  const C = {
    bg: isDark ? '#0C0F14' : '#F1F6F6',
    surface: isDark ? '#0a1929' : '#ffffff',
    surface2: isDark ? '#0d1f33' : '#f8fafb',
    border: isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.12)',
    text: isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    lime: '#B6CD38',
    pink: '#E72D8B',
    muted: isDark ? 'rgba(241,246,246,0.4)' : 'rgba(12,15,20,0.4)',
    inputBg: isDark ? 'rgba(35,122,170,0.08)' : 'rgba(29,84,125,0.05)',
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.inputBg,
    color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    paddingRight: 34,
    cursor: 'pointer',
  }

  const loadReglas = useCallback(async () => {
    try {
      const r = await cortesiasService.getReglas()
      setReglas(r)
    } catch { /* ignore */ }
  }, [])

  const loadProductos = useCallback(async () => {
    try {
      const p = await inventarioService.getProductos(true)
      setProductos(Array.isArray(p) ? p : [])
    } catch { /* ignore */ }
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      const d = await cortesiasService.getDashboard()
      setDashboard(d)
    } catch { /* ignore */ }
  }, [])

  const loadHistorial = useCallback(async () => {
    try {
      const params = { limite: 100 }
      if (filtroDesde) params.desde = filtroDesde
      if (filtroHasta) params.hasta = filtroHasta
      const h = await cortesiasService.getHistorial(params)
      setHistorial(h)
    } catch { /* ignore */ }
  }, [filtroDesde, filtroHasta])

  useEffect(() => {
    Promise.all([loadReglas(), loadProductos()]).finally(() => setLoading(false))
  }, [loadReglas, loadProductos])

  useEffect(() => {
    if (tab === 'dashboard') { loadDashboard(); loadHistorial() }
  }, [tab, loadDashboard, loadHistorial])

  const openCreate = () => {
    setEditingId(null)
    setError('')
    setForm({ nombre: '', monto_minimo: 0, monto_maximo: '', producto_id: '', cantidad: 1, limite_diario: 0, activa: true })
    setModalOpen(true)
  }

  const openEdit = (r) => {
    setEditingId(r.id)
    setError('')
    setForm({
      nombre: r.nombre, monto_minimo: r.monto_minimo,
      monto_maximo: r.monto_maximo ?? '', producto_id: r.producto_id,
      cantidad: r.cantidad, limite_diario: r.limite_diario, activa: r.activa,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setError('')
    const { activa: _activa, ...restForm } = form
    const body = {
      ...restForm,
      monto_minimo: parseFloat(form.monto_minimo) || 0,
      monto_maximo: form.monto_maximo !== '' ? parseFloat(form.monto_maximo) : null,
      cantidad: parseInt(form.cantidad) || 1,
      limite_diario: parseInt(form.limite_diario) || 0,
    }
    try {
      if (editingId) {
        await cortesiasService.updateRegla(editingId, body)
        if (_activa !== undefined) {
          await cortesiasService.toggleRegla(editingId, _activa)
        }
      } else {
        const created = await cortesiasService.createRegla(body)
        if (!_activa && created?.id) {
          await cortesiasService.toggleRegla(created.id, false)
        }
      }
      setModalOpen(false)
      loadReglas()
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al guardar la regla'
      setError(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta regla?')) return
    await cortesiasService.deleteRegla(id)
    loadReglas()
  }

  const handleToggle = async (id, activa) => {
    await cortesiasService.toggleRegla(id, !activa)
    loadReglas()
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text }}>
      <style>{`
        .cortesias-select {
          appearance: none; -webkit-appearance: none;
          background-image:
            linear-gradient(to right, transparent 85%, ${isDark ? 'rgba(182,205,56,0.08)' : 'rgba(182,205,56,0.15)'} 85%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B6CD38' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat, no-repeat;
          background-position: center, right 10px center;
          padding-right: 34px !important;
        }
        .cortesias-select:hover, .cortesias-select:focus {
          border-color: #B6CD38 !important;
        }
        .cortesias-select option {
          background: ${isDark ? '#0a1929' : 'white'};
          color: ${isDark ? '#F1F6F6' : '#0C0F14'};
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Cortesías</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>Reglas y seguimiento de cortesías automáticas</p>
        </div>
        {tab === 'reglas' && (
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)', color: '#0C0F14', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IcPlus /> Nueva regla
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.surface2, borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {['reglas', 'dashboard'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t ? C.lime : 'transparent',
            color: tab === t ? '#0C0F14' : C.subtext,
            fontWeight: tab === t ? 600 : 400, fontSize: 13, fontFamily: 'inherit',
            transition: 'all .15s',
          }}>{t === 'reglas' ? 'Reglas' : 'Dashboard'}</button>
        ))}
      </div>

      {tab === 'reglas' ? (
        <ReglasTab reglas={reglas} productos={productos} C={C} loading={loading}
          onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
      ) : (
        <DashboardTab dashboard={dashboard} historial={historial} C={C}
          filtroDesde={filtroDesde} filtroHasta={filtroHasta}
          setFiltroDesde={setFiltroDesde} setFiltroHasta={setFiltroHasta} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar regla' : 'Nueva regla'} isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre" C={C}><input style={inputStyle} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Paleta de agua por $100+" /></Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Monto mínimo" C={C}><input type="number" style={inputStyle} value={form.monto_minimo} onChange={e => setForm({ ...form, monto_minimo: e.target.value })} /></Field>
            <Field label="Monto máximo (opcional)" C={C}><input type="number" style={inputStyle} value={form.monto_maximo} onChange={e => setForm({ ...form, monto_maximo: e.target.value })} placeholder="Vacío = sin límite" /></Field>
          </div>
          <Field label="Producto de cortesía" C={C}>
            <select className="cortesias-select" style={selectStyle} value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })}>
              <option value="">Seleccionar producto...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.sku ? `(${p.sku})` : ''} - {fmt(p.precio)}</option>)}
            </select>
          </Field>
          <Field label="Cantidad" hint="Unidades del producto a regalar" C={C}><input type="number" style={inputStyle} value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /></Field>
          <Field label="Límite diario" hint="Máx. cortesías de este tipo por día. 0 = sin límite" C={C}><input type="number" style={inputStyle} value={form.limite_diario} onChange={e => setForm({ ...form, limite_diario: e.target.value })} placeholder="0 = sin límite" /></Field>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg }}>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>Estado</span>
            <button onClick={() => setForm({ ...form, activa: !form.activa })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.activa ? '#00753F' : C.subtext, padding: 4, display: 'flex' }}>
              <IcToggle active={form.activa} />
            </button>
          </div>
          <button onClick={handleSave} style={{ marginTop: 4, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)', color: '#0C0F14', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            {editingId ? 'Guardar cambios' : 'Crear regla'}
          </button>
          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function ReglasTab({ reglas, productos, C, loading, onEdit, onDelete, onToggle }) {
  const getProductoNombre = (id) => productos.find(p => p.id === id)?.nombre || '—'

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.subtext, fontSize: 13 }}>Cargando reglas...</div>
  if (reglas.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: C.subtext, fontSize: 13 }}>No hay reglas configuradas. Crea una para empezar.</div>

  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Nombre</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Rango monto</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Producto</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: C.subtext }}>Cant.</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: C.subtext }}>Límite</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: C.subtext }}>Estado</th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: C.subtext }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reglas.map(r => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, opacity: r.activa ? 1 : 0.5 }}>
              <td style={{ padding: '10px 16px', fontWeight: 500 }}>{r.nombre}</td>
              <td style={{ padding: '10px 16px', color: C.subtext }}>
                {fmt(r.monto_minimo)} {r.monto_maximo ? `— ${fmt(r.monto_maximo)}` : 'o más'}
              </td>
              <td style={{ padding: '10px 16px' }}>{getProductoNombre(r.producto_id)}</td>
              <td style={{ padding: '10px 16px', textAlign: 'center' }}>{r.cantidad}</td>
              <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                {r.limite_diario > 0 ? `${r.contador_diario}/${r.limite_diario}` : 'Ilimitado'}
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                <button onClick={() => onToggle(r.id, r.activa)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: r.activa ? '#00753F' : C.subtext, padding: 4, display: 'inline-flex' }}>
                  <IcToggle active={r.activa} />
                </button>
              </td>
              <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                  <button onClick={() => onEdit(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.subtext, padding: 4, display: 'flex' }}><IcEdit /></button>
                  <button onClick={() => onDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.pink, padding: 4, display: 'flex' }}><IcTrash /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardTab({ dashboard, historial, C, filtroDesde, filtroHasta, setFiltroDesde, setFiltroHasta }) {
  if (!dashboard) return <div style={{ textAlign: 'center', padding: 40, color: C.subtext, fontSize: 13 }}>Cargando...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <MetricCard label="Cortesías hoy" value={dashboard.totales_hoy} accent={C.lime} />
        {dashboard.disponibles?.slice(0, 3).map(d => (
          <MetricCard key={d.regla_id} label={`${d.producto}`} value={`${d.restantes} restantes`} accent={d.restantes > 0 ? C.lime : C.pink} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Por regla</h3>
          {dashboard.por_regla?.length > 0 ? dashboard.por_regla.map(r => (
            <div key={r.regla_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
              <span>{r.regla_nombre}</span>
              <span style={{ fontWeight: 600, color: C.lime }}>{r.entregadas}{r.limite_diario > 0 ? `/${r.limite_diario}` : ''}</span>
            </div>
          )) : <div style={{ color: C.subtext, fontSize: 12 }}>Sin entregas hoy</div>}
        </div>

        <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Por vendedor</h3>
          {dashboard.por_vendedor?.length > 0 ? dashboard.por_vendedor.map(v => (
            <div key={v.vendedor_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
              <span>{v.vendedor_nombre}</span>
              <span style={{ fontWeight: 600, color: C.subtext }}>{v.entregadas}</span>
            </div>
          )) : <div style={{ color: C.subtext, fontSize: 12 }}>Sin entregas hoy</div>}
        </div>
      </div>

      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Historial</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 12, fontFamily: 'inherit' }} />
            <span style={{ fontSize: 12, color: C.subtext }}>a</span>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 12, fontFamily: 'inherit' }} />
          </div>
        </div>
        {historial.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Fecha</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Regla</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Producto</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: C.subtext }}>Cant.</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: C.subtext }}>Monto compra</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: C.subtext }}>Vendedor</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: C.subtext }}>Ticket</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(h => (
                <tr key={h.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: C.subtext }}>{fmtDate(h.created_at)}</td>
                  <td style={{ padding: '8px 12px' }}>{h.regla_nombre}</td>
                  <td style={{ padding: '8px 12px' }}>{h.producto_nombre}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: C.lime }}>{h.cantidad}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{fmt(h.monto_compra)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 11 }}>{h.vendedor_nombre}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>#{h.ticket_numero}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{ color: C.subtext, fontSize: 12, textAlign: 'center', padding: 20 }}>Sin historial</div>}
      </div>
    </div>
  )
}

function MetricCard({ label, value, accent }) {
  return (
    <div style={{ background: accent === '#E72D8B' ? 'rgba(231,45,139,0.08)' : 'rgba(182,205,56,0.08)', borderRadius: 14, padding: '16px 20px', border: `1px solid ${accent}20` }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 500, color: accent === '#E72D8B' ? '#E72D8B' : '#00753F' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: accent }}>{value}</p>
    </div>
  )
}
