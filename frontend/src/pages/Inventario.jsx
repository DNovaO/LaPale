import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { inventarioService } from '@/services/inventario.service'
import client from '@/api/client'

// ── Íconos ───────────────────────────────────────────────────
const IcPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
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
const IcArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const IcArrowDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
)
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
const IcTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)

// ── Modal ────────────────────────────────────────────────────
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

// ── Input helper ─────────────────────────────────────────────
function Field({ label, children, isDark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: '#8A6A4A', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ isDark, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
        fontFamily: 'inherit', width: '100%',
        background: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
        color: isDark ? '#F1F6F6' : '#0C0F14',
        border: focused ? '1.5px solid #B6CD38' : `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
        boxShadow: focused ? '0 0 0 3px rgba(182,205,56,0.12)' : 'none',
        transition: 'border .15s, box-shadow .15s',
        ...props.style,
      }}
    />
  )
}

// ── Inventario ───────────────────────────────────────────────
const TIPOS_MOV = ['ENTRADA', 'AJUSTE_MANUAL', 'MERMA']

export default function Inventario() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [productos, setProductos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filtro, setFiltro]       = useState('todos') // todos | activos | inactivos | bajo_stock

  // Modales
  const [modalProducto, setModalProducto]   = useState(false)
  const [modalMovimiento, setModalMovimiento] = useState(false)
  const [editando, setEditando]             = useState(null)
  const [productoMov, setProductoMov]       = useState(null)
  const [modalEliminar, setModalEliminar]   = useState(null) // producto a eliminar

  // Forms
  const [formP, setFormP] = useState({ nombre: '', sku: '', descripcion: '', precio: '', stock_inicial: '', stock_minimo: '5', tipo: 'VENTA', medida: 'UNIDAD' })
  const [presentacionesList, setPresentacionesList] = useState([])
  const [formM, setFormM] = useState({ tipo: 'ENTRADA', cantidad: '', observaciones: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const C = {
    text:    isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    card:    isDark ? '#0a1929' : 'white',
    border:  isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
    hover:   isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)',
    tabActive: isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)',
  }

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    try {
      const tipoParam = filtro === 'venta' ? 'VENTA' : filtro === 'produccion' ? 'PRODUCCION' : ''
      const data = await inventarioService.getProductos(false, tipoParam)
      setProductos(data || [])
    } finally {
      setLoading(false)
    }
  }, [filtro])

  useEffect(() => { fetchProductos() }, [fetchProductos])

  const productosFiltrados = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
    if (filtro === 'activos')     return matchSearch && p.activo
    if (filtro === 'inactivos')   return matchSearch && !p.activo
    if (filtro === 'bajo_stock')  return matchSearch && p.stock_actual <= p.stock_minimo && p.activo
    if (filtro === 'venta')       return matchSearch && p.tipo === 'VENTA'
    if (filtro === 'produccion')  return matchSearch && p.tipo === 'PRODUCCION'
    return matchSearch
  })

  const abrirCrear = () => {
    setEditando(null)
    setFormP({ nombre: '', sku: '', descripcion: '', precio: '', stock_inicial: '', stock_minimo: '5', tipo: 'VENTA', medida: 'UNIDAD' })
    setPresentacionesList([])
    setError('')
    setModalProducto(true)
  }

  const abrirEditar = (p) => {
    setEditando(p)
    setFormP({ nombre: p.nombre, sku: p.sku || '', descripcion: p.descripcion || '', precio: String(p.precio), stock_inicial: '', stock_minimo: String(p.stock_minimo), tipo: p.tipo || 'VENTA', medida: p.medida || 'UNIDAD' })
    let pres = []
    try { if (p.presentaciones) pres = typeof p.presentaciones === 'string' ? JSON.parse(p.presentaciones) : p.presentaciones } catch {}
    setPresentacionesList(Array.isArray(pres) ? pres : [])
    setError('')
    setModalProducto(true)
  }

  const abrirMovimiento = (p) => {
    setProductoMov(p)
    setFormM({ tipo: 'ENTRADA', cantidad: '', observaciones: '' })
    setError('')
    setModalMovimiento(true)
  }

  const guardarProducto = async () => {
    if (!formP.nombre.trim()) return setError('El nombre es requerido')
    if (presentacionesList.length === 0 && (!formP.precio || isNaN(formP.precio) || Number(formP.precio) <= 0))
      return setError('El precio es requerido (o agrega presentaciones)')
    setSaving(true); setError('')
    try {
      const presJSON = presentacionesList.length > 0 ? JSON.stringify(presentacionesList) : ''
      if (editando) {
        await client.put(`/inventario/productos/${editando.id}`, {
          nombre: formP.nombre, sku: formP.sku, descripcion: formP.descripcion,
          precio: Number(formP.precio), stock_minimo: Number(formP.stock_minimo),
          tipo: formP.tipo, medida: formP.medida, presentaciones: presJSON,
        })
      } else {
        await client.post('/inventario/productos', {
          nombre: formP.nombre, sku: formP.sku, descripcion: formP.descripcion,
          precio: Number(formP.precio),
          stock_inicial: Number(formP.stock_inicial) || 0,
          stock_minimo: Number(formP.stock_minimo) || 5,
          tipo: formP.tipo, medida: formP.medida, presentaciones: presJSON,
        })
      }
      setModalProducto(false)
      fetchProductos()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleActivo = async (p) => {
    try {
      await client.patch(`/inventario/productos/${p.id}/estado`, { activo: !p.activo })
      fetchProductos()
    } catch {}
  }

  const eliminarProducto = async () => {
    if (!modalEliminar) return
    setSaving(true); setError('')
    try {
      await inventarioService.deleteProducto(modalEliminar.id)
      setModalEliminar(null)
      fetchProductos()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al eliminar')
    } finally {
      setSaving(false)
    }
  }

  const registrarMovimiento = async () => {
    if (!formM.cantidad || isNaN(formM.cantidad) || Number(formM.cantidad) <= 0)
      return setError('La cantidad debe ser mayor a 0')
    setSaving(true); setError('')
    try {
      await client.post('/inventario/movimientos', {
        producto_id: productoMov.id,
        tipo: formM.tipo,
        cantidad: Number(formM.cantidad),
        observaciones: formM.observaciones,
      })
      setModalMovimiento(false)
      fetchProductos()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al registrar')
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { key: 'todos', label: 'Todos', count: productos.length },
    { key: 'activos', label: 'Activos', count: productos.filter(p => p.activo).length },
    { key: 'inactivos', label: 'Inactivos', count: productos.filter(p => !p.activo).length },
    { key: 'venta', label: 'Venta', count: productos.filter(p => p.tipo === 'VENTA').length },
    { key: 'produccion', label: 'Producción', count: productos.filter(p => p.tipo === 'PRODUCCION').length },
    { key: 'bajo_stock', label: 'Bajo stock', count: productos.filter(p => p.stock_actual <= p.stock_minimo && p.activo).length },
  ]

  return (
    <>
      <style>{`
        @keyframes modalIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 768px) {
          .filter-row { flex-direction: column; align-items: stretch !important; }
          .filter-row input { width: 100% !important; min-width: 0 !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:focus,
        select:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px ${isDark ? '#1a2d44' : '#e8f1f8'} inset !important;
          -webkit-text-fill-color: ${isDark ? '#F1F6F6' : '#0C0F14'} !important;
        }
        .inv-select {
          -webkit-appearance: none; appearance: none;
          background-image:
            linear-gradient(to right, transparent 85%, ${isDark ? 'rgba(182,205,56,0.08)' : 'rgba(182,205,56,0.15)'} 85%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B6CD38' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat, no-repeat;
          background-position: center, right 10px center;
          padding-right: 34px !important;
          cursor: pointer;
        }
        .inv-select:hover, .inv-select:focus {
          border-color: #B6CD38 !important;
        }
        .inv-select option {
          background: ${isDark ? '#0a1929' : 'white'};
          color: ${isDark ? '#F1F6F6' : '#0C0F14'};
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Inventario</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>{productos.length} productos registrados</p>
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
            <IcPlus /> Nuevo producto
          </button>
        </div>

        {/* Filtros + búsqueda */}
        <div className="filter-row" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setFiltro(t.key)} style={{
                padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: filtro === t.key ? 600 : 400,
                fontFamily: 'inherit',
                background: filtro === t.key ? (isDark ? '#0a1929' : 'white') : 'transparent',
                color: filtro === t.key ? (t.key === 'bajo_stock' ? '#E72D8B' : '#B6CD38') : C.subtext,
                boxShadow: filtro === t.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}>
                {t.label} {t.count > 0 && <span style={{ opacity: .7 }}>({t.count})</span>}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.subtext, pointerEvents: 'none' }}>
              <IcSearch />
            </span>
            <input
              placeholder="Buscar por nombre o SKU..."
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

        {/* Tabla */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: 'hidden', overflowX: 'auto',
          boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
        }}>
          <div style={{ minWidth: 850 }}>
          {/* Thead */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 110px 90px 70px 80px 80px 90px 130px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.border}`,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(29,84,125,0.03)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'start' }}>Producto</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'end' }}>Precio</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'center' }}>Stock</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'center' }}>Min.</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'center' }}>Tipo</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'center' }}>Medida</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'center' }}>Estado</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', justifySelf: 'center' }}>Acciones</span>
          </div>

          {/* Rows */}
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 110px 90px 70px 80px 80px 90px 130px', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                {Array(8).fill(0).map((_, j) => (
                  <div key={j} style={{ height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                ))}
              </div>
            ))
          ) : productosFiltrados.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>
              {search ? `Sin resultados para "${search}"` : 'Sin productos en esta categoría'}
            </div>
          ) : (
            productosFiltrados.map((p, i) => {
              const bajStock = p.stock_actual <= p.stock_minimo
              return (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '1.5fr 110px 90px 70px 80px 80px 90px 130px',
                  padding: '12px 20px', alignItems: 'center',
                  borderBottom: i < productosFiltrados.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition: 'background .15s',
                  opacity: p.activo ? 1 : 0.5,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Nombre */}
                  <div style={{ justifySelf: 'start' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text }}>{p.nombre}</p>
                    {p.sku && <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>SKU: {p.sku}</p>}
                  </div>

                  {/* Precio */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#B6CD38', justifySelf: 'end' }}>{fmt(p.precio)}</span>

                  {/* Stock */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifySelf: 'center' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: p.stock_actual === 0 ? '#E72D8B' : bajStock ? '#f59e0b' : C.text,
                    }}>
                      {p.stock_actual}
                    </span>
                    {bajStock && p.activo && (
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: 'rgba(231,45,139,0.12)', color: '#E72D8B', fontWeight: 600 }}>
                        BAJO
                      </span>
                    )}
                  </div>

                  {/* Mínimo */}
                  <span style={{ fontSize: 13, color: C.subtext, justifySelf: 'center' }}>{p.stock_minimo}</span>

                  {/* Tipo */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: p.tipo === 'VENTA' ? 'rgba(182,205,56,0.12)' : 'rgba(138,106,74,0.12)',
                    color: p.tipo === 'VENTA' ? '#B6CD38' : '#8A6A4A',
                    display: 'inline-block', justifySelf: 'center',
                  }}>
                    {p.tipo === 'VENTA' ? 'Venta' : 'Producción'}
                  </span>

                  {/* Medida */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: isDark ? 'rgba(35,122,170,0.12)' : 'rgba(35,122,170,0.08)',
                    color: '#237AAA',
                    display: 'inline-block', justifySelf: 'center',
                  }}>
                    {p.medida || 'Unidad'}
                  </span>

                  {/* Estado */}
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: p.activo ? 'rgba(182,205,56,0.12)' : 'rgba(138,106,74,0.12)',
                    color: p.activo ? '#B6CD38' : '#8A6A4A',
                    display: 'inline-block', justifySelf: 'center',
                  }}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 6, justifySelf: 'center' }}>
                    <button title="Entrada/Salida" onClick={() => abrirMovimiento(p)} style={{
                      padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(35,122,170,0.12)', color: '#237AAA',
                      display: 'flex', transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,122,170,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(35,122,170,0.12)'}
                    >
                      <IcArrowUp />
                    </button>
                    <button title="Editar" onClick={() => abrirEditar(p)} style={{
                      padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(182,205,56,0.12)', color: '#B6CD38',
                      display: 'flex', transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(182,205,56,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(182,205,56,0.12)'}
                    >
                      <IcEdit />
                    </button>
                    <button title={p.activo ? 'Desactivar' : 'Activar'} onClick={() => toggleActivo(p)} style={{
                      padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: p.activo ? 'rgba(231,45,139,0.10)' : 'rgba(0,117,63,0.10)',
                      color: p.activo ? '#E72D8B' : '#00753F',
                      display: 'flex', transition: 'background .15s',
                    }}>
                      <IcToggle active={p.activo} />
                    </button>
                    <button title="Eliminar" onClick={(e) => { e.stopPropagation(); setModalEliminar(p); setError('') }} style={{
                      padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(231,45,139,0.10)', color: '#E72D8B',
                      display: 'flex', transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,45,139,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,45,139,0.10)'}
                    >
                      <IcTrash />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        </div>
      </div>

      {/* Modal — Crear/Editar producto */}
      <Modal open={modalProducto} onClose={() => setModalProducto(false)} title={editando ? 'Editar producto' : 'Nuevo producto'} isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre *" isDark={isDark}>
            <Input isDark={isDark} placeholder="Ej: Paleta de fresa" value={formP.nombre} onChange={e => setFormP(f => ({ ...f, nombre: e.target.value }))} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="SKU (auto)" isDark={isDark}>
              <Input isDark={isDark} placeholder="Se genera automaticamente" value={formP.sku} onChange={e => setFormP(f => ({ ...f, sku: e.target.value }))} disabled style={{ opacity: 0.6 }} />
            </Field>
            <Field label={`Precio${presentacionesList.length > 0 ? ' (opcional)' : ' *'}`} isDark={isDark}>
              <Input isDark={isDark} type="number" min="0" step="0.01" placeholder="0.00" value={formP.precio} onChange={e => setFormP(f => ({ ...f, precio: e.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Tipo" isDark={isDark}>
              <select className="inv-select" value={formP.tipo} onChange={e => setFormP(f => ({ ...f, tipo: e.target.value }))} style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', width: '100%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                color: isDark ? '#F1F6F6' : '#0C0F14',
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
                cursor: 'pointer',
              }}>
                <option value="VENTA">Venta</option>
                <option value="PRODUCCION">Produccion</option>
              </select>
            </Field>
            <Field label="Medida" isDark={isDark}>
              <select className="inv-select" value={formP.medida} onChange={e => setFormP(f => ({ ...f, medida: e.target.value }))} style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', width: '100%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                color: isDark ? '#F1F6F6' : '#0C0F14',
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
                cursor: 'pointer',
              }}>
                <option value="UNIDAD">Unidad</option>
                <option value="KILO">Kilo</option>
                <option value="GRAMO">Gramo</option>
                <option value="LITRO">Litro</option>
                <option value="MILILITRO">Mililitro</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {!editando && (
              <Field label="Stock inicial" isDark={isDark}>
                <Input isDark={isDark} type="number" min="0" placeholder="0" value={formP.stock_inicial} onChange={e => setFormP(f => ({ ...f, stock_inicial: e.target.value }))} />
              </Field>
            )}
            <Field label="Stock minimo" isDark={isDark}>
              <Input isDark={isDark} type="number" min="0" placeholder="5" value={formP.stock_minimo} onChange={e => setFormP(f => ({ ...f, stock_minimo: e.target.value }))} />
            </Field>
          </div>
          <Field label="Descripción" isDark={isDark}>
            <textarea
              placeholder="Descripción opcional..."
              value={formP.descripcion}
              onChange={e => setFormP(f => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', resize: 'vertical',
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                color: isDark ? '#F1F6F6' : '#0C0F14',
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              }}
            />
          </Field>
          <Field label="Presentaciones" isDark={isDark}>
            <span style={{ fontSize: 10, color: C.subtext, marginBottom: 2 }}>Ej: si tienes 100 L de agua y vendes 500ml, el consumo es 0.5</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {presentacionesList.length > 0 && (
                <div style={{ display: 'flex', paddingLeft: 10, paddingRight: 32 }}>
                  <span style={{ flex: 2, fontSize: 10, color: C.subtext, fontWeight: 600 }}>Tamaño</span>
                  <span style={{ width: 60, fontSize: 10, color: C.subtext, fontWeight: 600, textAlign: 'center' }}>Consumo</span>
                  <span style={{ width: 14 }} />
                  <span style={{ width: 70, fontSize: 10, color: C.subtext, fontWeight: 600, textAlign: 'right' }}>Precio</span>
                </div>
              )}
              {presentacionesList.map((pr, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 10px', borderRadius: 10,
                  background: isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)',
                  border: `1px solid ${isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)'}`,
                }}>
                  <input placeholder="Ej: 1L" value={pr.etiqueta}
                    onChange={e => setPresentacionesList(prev => prev.map((p, idx) => idx === i ? { ...p, etiqueta: e.target.value } : p))}
                    style={{
                      flex: 2, padding: '6px 8px', borderRadius: 6, fontSize: 12, outline: 'none',
                      fontFamily: 'inherit', border: 'none',
                      background: 'transparent', color: C.text, minWidth: 0,
                    }}
                  />
                  <input type="number" min="0.01" step="0.01" placeholder="Consumo" value={pr.factor || ''}
                    onChange={e => setPresentacionesList(prev => prev.map((p, idx) => idx === i ? { ...p, factor: parseFloat(e.target.value) || 0 } : p))}
                    style={{
                      width: 60, padding: '6px 8px', borderRadius: 6, fontSize: 12, outline: 'none',
                      fontFamily: 'inherit', border: 'none',
                      background: 'transparent', color: C.text, textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 11, color: C.subtext }}>×</span>
                  <input type="number" min="0" step="0.01" placeholder="Precio" value={pr.precio || ''}
                    onChange={e => setPresentacionesList(prev => prev.map((p, idx) => idx === i ? { ...p, precio: parseFloat(e.target.value) || 0 } : p))}
                    style={{
                      width: 70, padding: '6px 8px', borderRadius: 6, fontSize: 12, outline: 'none',
                      fontFamily: 'inherit', border: 'none',
                      background: 'transparent', color: '#B6CD38', textAlign: 'right',
                    }}
                  />
                  <button onClick={() => setPresentacionesList(prev => prev.filter((_, idx) => idx !== i))}
                    style={{
                      width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: 'rgba(231,45,139,0.10)', color: '#E72D8B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, flexShrink: 0,
                    }}><IcX /></button>
                </div>
              ))}
              <button onClick={() => setPresentacionesList(prev => [...prev, { etiqueta: '', factor: 1, precio: 0 }])} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8,
                border: `1px dashed ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
                background: 'transparent', color: C.subtext, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                justifyContent: 'center',
              }}>
                <IcPlus /> Agregar presentacion
              </button>
            </div>
          </Field>
          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setModalProducto(false)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={guardarProducto} disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: saving ? .7 : 1,
              boxShadow: '0 4px 12px -4px rgba(0,117,63,0.4)',
            }}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Movimiento */}
      <Modal open={modalMovimiento} onClose={() => setModalMovimiento(false)} title={`Movimiento — ${productoMov?.nombre}`} isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Info del producto */}
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: isDark ? 'rgba(35,122,170,0.08)' : 'rgba(29,84,125,0.05)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: isDark ? '#237AAA' : '#1D547D' }}>Stock actual</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#B6CD38' }}>{productoMov?.stock_actual} pzs</span>
          </div>

          <Field label="Tipo de movimiento" isDark={isDark}>
            <select className="inv-select"
              value={formM.tipo}
              onChange={e => setFormM(f => ({ ...f, tipo: e.target.value }))}
              style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', width: '100%',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                color: isDark ? '#F1F6F6' : '#0C0F14',
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
                cursor: 'pointer',
              }}
            >
              {TIPOS_MOV.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>

          <Field label="Cantidad *" isDark={isDark}>
            <Input isDark={isDark} type="number" min="1" placeholder="0" value={formM.cantidad} onChange={e => setFormM(f => ({ ...f, cantidad: e.target.value }))} />
          </Field>

          <Field label="Observaciones" isDark={isDark}>
            <Input isDark={isDark} placeholder="Motivo del movimiento..." value={formM.observaciones} onChange={e => setFormM(f => ({ ...f, observaciones: e.target.value }))} />
          </Field>

          {/* Preview */}
          {formM.cantidad > 0 && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: formM.tipo === 'ENTRADA' ? 'rgba(182,205,56,0.08)' : 'rgba(231,45,139,0.08)',
              border: `1px solid ${formM.tipo === 'ENTRADA' ? 'rgba(182,205,56,0.2)' : 'rgba(231,45,139,0.2)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: isDark ? '#237AAA' : '#1D547D' }}>Stock resultante</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {formM.tipo === 'ENTRADA' ? <IcArrowUp /> : <IcArrowDown />}
                <span style={{ fontSize: 14, fontWeight: 700, color: formM.tipo === 'ENTRADA' ? '#B6CD38' : '#E72D8B' }}>
                  {formM.tipo === 'ENTRADA'
                    ? (productoMov?.stock_actual || 0) + Number(formM.cantidad)
                    : Math.max(0, (productoMov?.stock_actual || 0) - Number(formM.cantidad))
                  } pzs
                </span>
              </div>
            </div>
          )}

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setModalMovimiento(false)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={registrarMovimiento} disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: formM.tipo === 'ENTRADA'
                ? 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)'
                : 'linear-gradient(135deg, #E72D8B 0%, #c0206e 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: saving ? .7 : 1,
            }}>
              {saving ? 'Registrando...' : 'Registrar movimiento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Confirmar eliminación */}
      <Modal open={!!modalEliminar} onClose={() => setModalEliminar(null)} title="Eliminar producto" isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.subtext }}>
            ¿Estás seguro de eliminar <strong style={{ color: C.text }}>{modalEliminar?.nombre}</strong>?
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
            Esta acción no se puede deshacer. Si el producto tiene ventas asociadas no podrá eliminarse.
          </p>
          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => { setModalEliminar(null); setError('') }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={eliminarProducto} disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #E72D8B 0%, #c0206e 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: saving ? .7 : 1,
              boxShadow: '0 4px 12px -4px rgba(231,45,139,0.4)',
            }}>
              {saving ? 'Eliminando...' : 'Eliminar producto'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}