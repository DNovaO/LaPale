import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { bitacoraService } from '@/services/bitacora.service'
import { ventasService } from '@/services/ventas.service'

const IcSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IcX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IcRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IcSale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IcGift = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>
  </svg>
)
const IcDollar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
const fmtTime = d => new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
const fmtFull = d => new Date(d).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const MODULOS = ['AUTH', 'USUARIOS', 'INVENTARIO', 'VENTAS', 'FINANZAS', 'CAJA']
const ACCIONES = [
  'LOGIN', 'LOGOUT',
  'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'CONSULTAR',
  'ACTIVAR', 'DESACTIVAR', 'CAMBIAR_PASSWORD',
  'ENTRADA_STOCK', 'SALIDA_STOCK', 'AJUSTE_STOCK',
  'CONFIRMAR_VENTA', 'CANCELAR_VENTA', 'REGISTRAR_CORTESIA',
  'REGISTRAR_GASTO', 'ELIMINAR_GASTO', 'CERRAR_CAJA',
]

function traducir(r) {
  const m = r.modulo; const a = r.accion
  const dn = r.datos_nuevos || {}

  if (m === 'VENTAS' && a === 'CONFIRMAR_VENTA')
    return { texto: `Venta confirmada`, icono: IcSale, color: '#B6CD38', bg: 'rgba(182,205,56,0.10)' }
  if (m === 'VENTAS' && a === 'CANCELAR_VENTA')
    return { texto: `Venta cancelada`, icono: IcX, color: '#E72D8B', bg: 'rgba(231,45,139,0.10)' }
  if (m === 'VENTAS' && a === 'REGISTRAR_CORTESIA')
    return { texto: `Cortesia`, icono: IcGift, color: '#E72D8B', bg: 'rgba(231,45,139,0.10)' }
  if (m === 'INVENTARIO' && a === 'CREAR')
    return { texto: `Producto creado`, icono: IcSale, color: '#00753F', bg: 'rgba(0,117,63,0.08)' }
  if (m === 'INVENTARIO' && a === 'ACTUALIZAR')
    return { texto: `Producto actualizado`, icono: IcSale, color: '#237AAA', bg: 'rgba(35,122,170,0.08)' }
  if (m === 'INVENTARIO' && a === 'ENTRADA_STOCK')
    return { texto: `Entrada de stock`, icono: IcSale, color: '#B6CD38', bg: 'rgba(182,205,56,0.08)' }
  if (m === 'INVENTARIO' && a === 'SALIDA_STOCK')
    return { texto: `Salida de stock`, icono: IcSale, color: '#E72D8B', bg: 'rgba(231,45,139,0.08)' }
  if (m === 'INVENTARIO' && a === 'AJUSTE_STOCK')
    return { texto: `Ajuste manual`, icono: IcSale, color: '#8A6A4A', bg: 'rgba(138,106,74,0.08)' }
  if (m === 'FINANZAS' && a === 'REGISTRAR_GASTO')
    return { texto: `Gasto registrado`, icono: IcDollar, color: '#E72D8B', bg: 'rgba(231,45,139,0.08)' }
  if (m === 'FINANZAS' && a === 'ELIMINAR_GASTO')
    return { texto: `Gasto eliminado`, icono: IcX, color: '#E72D8B', bg: 'rgba(231,45,139,0.08)' }
  if (m === 'FINANZAS' && a === 'CERRAR_CAJA')
    return { texto: `Cierre de caja`, icono: IcSale, color: '#B6CD38', bg: 'rgba(182,205,56,0.08)' }
  if (m === 'USUARIOS' && a === 'CREAR')
    return { texto: `Usuario creado`, icono: IcSale, color: '#237AAA', bg: 'rgba(35,122,170,0.08)' }
  if (m === 'USUARIOS' && (a === 'ACTIVAR' || a === 'DESACTIVAR'))
    return { texto: `Usuario ${a === 'ACTIVAR' ? 'activado' : 'desactivado'}`, icono: IcSale, color: '#8A6A4A', bg: 'rgba(138,106,74,0.08)' }
  if (m === 'USUARIOS' && a === 'CAMBIAR_PASSWORD')
    return { texto: `Contraseña cambiada`, icono: IcSale, color: '#237AAA', bg: 'rgba(35,122,170,0.08)' }
  if (m === 'AUTH' && a === 'LOGIN')
    return { texto: `Inicio de sesion`, icono: IcSale, color: '#237AAA', bg: 'rgba(35,122,170,0.08)' }

  return { texto: `${a || 'actividad'}`, icono: IcSale, color: '#8A6A4A', bg: 'rgba(138,106,74,0.06)' }
}

function extraerDetalle(r) {
  const dn = r.datos_nuevos || {}
  const m = r.modulo; const a = r.accion

  if (m === 'VENTAS') {
    const prods = Array.isArray(dn.productos) ? dn.productos.length : 0
    let det = ''
    if (dn.ticket) det += `#${dn.ticket}`
    if (dn.total) det += ` · ${fmt(dn.total)}`
    if (dn.metodo) det += ` · ${dn.metodo.toLowerCase()}`
    if (prods > 0) det += ` · ${prods} producto${prods !== 1 ? 's' : ''}`
    if (!det && dn.motivo) det = `Motivo: ${dn.motivo}`
    return det || '—'
  }
  if (m === 'FINANZAS') {
    let det = ''
    if (dn.tipo) det += dn.tipo
    if (dn.monto) det += ` · ${fmt(dn.monto)}`
    if (dn.total_ventas) det += `Ventas: ${fmt(dn.total_ventas)}`
    return det || '—'
  }
  if (m === 'INVENTARIO') {
    let det = ''
    if (dn.nombre) det += dn.nombre
    if (dn.tipo) det += ` · ${dn.tipo}`
    if (dn.cantidad) det += ` · ${dn.cantidad} pzs`
    if (dn.precio) det += ` · ${fmt(dn.precio)}`
    return det || '—'
  }
  if (m === 'USUARIOS') {
    if (dn.username) return `@${dn.username}`
    return '—'
  }
  return r.entidad ? `${r.entidad}` : '—'
}

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
        width: '100%', maxWidth: 560,
        background: isDark ? '#0a1929' : 'white',
        border: `1px solid ${isDark ? 'rgba(35,122,170,0.2)' : 'rgba(29,84,125,0.15)'}`,
        borderRadius: 20,
        boxShadow: isDark ? '0 32px 80px -12px rgba(0,0,0,0.8)' : '0 32px 80px -12px rgba(29,84,125,0.2)',
        animation: 'modalIn .2s cubic-bezier(.16,1,.3,1)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)'}`,
        }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: isDark ? '#F1F6F6' : '#0C0F14' }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: isDark ? '#237AAA' : '#1D547D', borderRadius: 6, display: 'flex', transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
          ><IcX /></button>
        </div>
        <div style={{ padding: '20px 24px', overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

export default function Bitacora() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const [modalDetalle, setModalDetalle] = useState(null)
  const [ventaFull, setVentaFull] = useState(null)
  const [loadingVenta, setLoadingVenta] = useState(false)

  const abrirDetalle = async (r) => {
    setModalDetalle(r)
    setVentaFull(null)
    if (r.modulo === 'VENTAS' && r.entidad_id) {
      setLoadingVenta(true)
      try {
        const v = await ventasService.getVenta(r.entidad_id)
        setVentaFull(v)
      } catch {}
      setLoadingVenta(false)
    }
  }

  const C = {
    text:    isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    card:    isDark ? '#0a1929' : 'white',
    border:  isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)',
    hover:   isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)',
  }

  const fetchRegistros = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limite: 200 }
      if (filtroModulo) params.modulo = filtroModulo
      if (filtroAccion) params.accion = filtroAccion
      if (filtroDesde) params.desde = filtroDesde
      if (filtroHasta) params.hasta = filtroHasta
      const data = await bitacoraService.getRegistros(params)
      setRegistros(data || [])
    } finally {
      setLoading(false)
    }
  }, [filtroModulo, filtroAccion, filtroDesde, filtroHasta])

  useEffect(() => { fetchRegistros() }, [fetchRegistros])

  const registrosFiltrados = registros.filter(r => {
    const s = search.toLowerCase()
    if (!s) return true
    const t = traducir(r)
    return r.usuario_nombre?.toLowerCase().includes(s) ||
      t.texto?.toLowerCase().includes(s) ||
      extraerDetalle(r).toLowerCase().includes(s)
  })

  const renderModalContent = (r) => {
    const dn = r.datos_nuevos || {}
    const t = traducir(r)

    if (r.modulo === 'VENTAS') {
      const productos = ventaFull?.detalle || dn.productos || []
      const metodo = ventaFull?.pagos?.[0]?.metodo || dn.metodo
      const total = ventaFull?.total || dn.total || 0
      const ticket = ventaFull?.ticket_numero || dn.ticket
      const vendedor = ventaFull?.vendedor_nombre || dn.vendedor

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: '20px', borderRadius: 14,
            background: isDark ? 'rgba(182,205,56,0.06)' : 'rgba(182,205,56,0.04)',
            border: `1px solid ${isDark ? 'rgba(182,205,56,0.15)' : 'rgba(182,205,56,0.12)'}`,
            textAlign: 'center',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: t.bg, color: t.color }}>
              <t.icono />
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: C.text }}>{t.texto}</h2>
            {ticket && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.subtext }}>Ticket #{ticket}</p>}
            {total > 0 && <p style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 700, color: t.color }}>{fmt(total)}</p>}
            {dn.tipo === 'CORTESIA' && total === 0 && !ventaFull && (
              <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 700, color: t.color }}>Cortesía</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {metodo && <InfoField label="Metodo" value={metodo} C={C} />}
            {vendedor && <InfoField label="Vendedor" value={vendedor} C={C} />}
            {dn.motivo && <InfoField label="Motivo" value={dn.motivo} C={C} />}
            <InfoField label="Fecha" value={fmtFull(r.created_at)} C={C} />
            <InfoField label="Usuario" value={r.usuario_nombre} C={C} />
          </div>

          {loadingVenta && (
            <div style={{ textAlign: 'center', padding: 16, color: C.subtext, fontSize: 13 }}>
              Cargando detalle de venta...
            </div>
          )}

          {!loadingVenta && Array.isArray(productos) && productos.length > 0 && (
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 8 }}>
                Productos vendidos ({productos.length})
              </span>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                {productos.map((p, i) => (
                  <div key={p.id || p.producto_id || i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom: i < productos.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: C.text }}>
                      {p.producto_nombre || p.nombre || 'Producto'}
                      <span style={{ color: C.subtext, fontSize: 11 }}> x{p.cantidad}</span>
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#B6CD38' }}>
                      {fmt((p.precio || p.precio_unitario || 0) * p.cantidad)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <InfoField label="Evento" value={t.texto} C={C} />
          <InfoField label="Usuario" value={r.usuario_nombre} C={C} />
          <InfoField label="Area" value={r.modulo} C={C} />
          <InfoField label="Accion" value={r.accion} C={C} />
          <InfoField label="Entidad" value={r.entidad || '—'} C={C} />
          <InfoField label="Fecha" value={fmtFull(r.created_at)} C={C} />
        </div>
        {r.ip_address && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: C.hover, fontSize: 11, color: C.subtext }}>
            IP: {r.ip_address}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes modalIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .4s ease both }
        @media (max-width: 768px) {
          .filter-row { flex-direction: column !important; align-items: stretch !important; }
          .filter-row select, .filter-row input { width: 100% !important; min-width: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div className="fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Bitacora</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>{registros.length} registros de actividad</p>
          </div>
        </div>

        <div className="fade-in filter-row" style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Area</span>
            <select value={filtroModulo} onChange={e => setFiltroModulo(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none',
              fontFamily: 'inherit', background: C.card, color: C.text,
              border: `1px solid ${C.border}`, cursor: 'pointer', minWidth: 140,
            }}>
              <option value="">Todas</option>
              {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Evento</span>
            <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none',
              fontFamily: 'inherit', background: C.card, color: C.text,
              border: `1px solid ${C.border}`, cursor: 'pointer', minWidth: 160,
            }}>
              <option value="">Todos</option>
              {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Desde</span>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none',
              fontFamily: 'inherit', background: C.card, color: C.text, border: `1px solid ${C.border}`,
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Hasta</span>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 10, fontSize: 12, outline: 'none',
              fontFamily: 'inherit', background: C.card, color: C.text, border: `1px solid ${C.border}`,
            }} />
          </div>

          <button onClick={fetchRegistros} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10, marginBottom: 0,
            border: `1px solid ${C.border}`, background: C.card, color: C.subtext,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <IcRefresh /> Actualizar
          </button>

          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.subtext, pointerEvents: 'none' }}>
              <IcSearch />
            </span>
            <input
              placeholder="Buscar por usuario, evento o detalle..."
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
          <div style={{ minWidth: 640 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '100px 1.5fr 1.8fr 1fr 48px',
              padding: '10px 20px',
              borderBottom: `1px solid ${C.border}`,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(29,84,125,0.03)',
            }}>
              {['Hora', 'Evento', 'Detalle', 'Usuario', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1.5fr 1.8fr 1fr 48px', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                  {Array(5).fill(0).map((_, j) => (
                    <div key={j} style={{ height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                  ))}
                </div>
              ))
            ) : registrosFiltrados.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>
                Sin registros de actividad
              </div>
            ) : (
              registrosFiltrados.map((r, i) => {
                const t = traducir(r)
                const detalle = extraerDetalle(r)
                return (
                  <div key={r.id} style={{
                    display: 'grid', gridTemplateColumns: '100px 1.5fr 1.8fr 1fr 48px',
                    padding: '12px 20px', alignItems: 'center',
                    borderBottom: i < registrosFiltrados.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background .15s', cursor: 'pointer',
                  }}
                  onClick={() => abrirDetalle(r)}
                  onMouseEnter={e => e.currentTarget.style.background = C.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ fontSize: 12, color: C.subtext, fontWeight: 500 }}>{fmtTime(r.created_at)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: t.bg, color: t.color,
                      }}>
                        <t.icono />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{t.texto}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.subtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {detalle}
                    </span>
                    <span style={{ fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.usuario_nombre}
                    </span>
                    <button style={{
                      padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'transparent', color: C.subtext, display: 'flex', transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.hover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <IcChevron />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Modal open={!!modalDetalle} onClose={() => setModalDetalle(null)} title="Detalle de actividad" isDark={isDark}>
        {modalDetalle && renderModalContent(modalDetalle)}
      </Modal>
    </>
  )
}

function InfoField({ label, value, C }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: C.text }}>{value}</p>
    </div>
  )
}
