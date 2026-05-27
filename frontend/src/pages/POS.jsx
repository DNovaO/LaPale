import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'

const API = '/api'

const IcSearch    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IcPlus      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcMinus     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcTrash     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const IcCash      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const IcCard      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcTransfer  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
const IcGift      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
const IcCheck     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcX         = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IcReceipt   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="6" x2="10" y2="6"/></svg>
const IcChevron   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0)

function parsePresentaciones(raw) {
  if (!raw) return null
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (Array.isArray(arr) && arr.length > 0) return arr
  } catch {}
  return null
}

export default function POS() {
  const { token, user }   = useAuth()
  const { theme }         = useTheme()
  const isDark            = theme === 'dark'
  const searchRef         = useRef(null)

  const [productos,    setProductos]    = useState([])
  const [busqueda,     setBusqueda]     = useState('')
  const [ticket,       setTicket]       = useState([])   // [{producto, cantidad, presentacion?, esCortesia}]
  const [metodo,       setMetodo]       = useState('EFECTIVO')
  const [montoRecibido,setMontoRecibido]= useState('')
  const [loading,      setLoading]      = useState(false)
  const [loadingProds, setLoadingProds] = useState(true)
  const [ventaExitosa, setVentaExitosa] = useState(null)
  const [error,        setError]        = useState('')
  const [presentPanel, setPresentPanel] = useState(null) // producto con presentaciones abierto

  const C = {
    bg:       isDark ? '#0C0F14' : '#F1F6F6',
    surface:  isDark ? '#0a1929' : '#ffffff',
    surface2: isDark ? '#0d1f33' : '#f8fafb',
    border:   isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.12)',
    text:     isDark ? '#F1F6F6' : '#0C0F14',
    subtext:  isDark ? '#237AAA' : '#1D547D',
    muted:    isDark ? 'rgba(241,246,246,0.4)' : 'rgba(12,15,20,0.4)',
    lime:     '#B6CD38',
    green:    '#00753F',
    pink:     '#E72D8B',
    inputBg:  isDark ? 'rgba(35,122,170,0.08)' : 'rgba(29,84,125,0.05)',
  }

  useEffect(() => {
    fetch(`${API}/inventario/productos?activos=true&tipo=VENTA`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setProductos(d.data ?? []))
      .catch(() => setError('Error al cargar productos'))
      .finally(() => setLoadingProds(false))
  }, [token])

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const handleClickProducto = (producto) => {
    if (producto.stock_actual <= 0) return
    const pres = parsePresentaciones(producto.presentaciones)
    if (pres) {
      setPresentPanel({ producto, pres })
      return
    }
    agregarAlTicket(producto, 1, null, false)
  }

  const agregarAlTicket = (producto, cantidad, presentacion, esCortesia) => {
    setTicket(prev => {
      const key = presentacion ? `${producto.id}_${presentacion.etiqueta}` : producto.id
      const existe = prev.find(i => {
        const ik = i.presentacion ? `${i.producto.id}_${i.presentacion.etiqueta}` : i.producto.id
        return ik === key
      })
      if (existe) {
        return prev.map(i => {
          const ik = i.presentacion ? `${i.producto.id}_${i.presentacion.etiqueta}` : i.producto.id
          return ik === key ? { ...i, cantidad: i.cantidad + cantidad } : i
        })
      }
      return [...prev, { producto, cantidad, presentacion: presentacion || null, esCortesia: esCortesia || false }]
    })
    setPresentPanel(null)
    searchRef.current?.focus()
  }

  const cambiarCantidad = (itemIdx, delta) => {
    setTicket(prev => {
      const newTicket = [...prev]
      newTicket[itemIdx] = { ...newTicket[itemIdx], cantidad: newTicket[itemIdx].cantidad + delta }
      return newTicket.filter(i => i.cantidad > 0)
    })
  }

  const toggleCortesiaItem = (itemIdx) => {
    setTicket(prev => {
      const newTicket = [...prev]
      newTicket[itemIdx] = { ...newTicket[itemIdx], esCortesia: !newTicket[itemIdx].esCortesia }
      return newTicket
    })
  }

  const quitarItem = (itemIdx) => setTicket(prev => prev.filter((_, i) => i !== itemIdx))

  const limpiarTicket = () => {
    setTicket([])
    setMetodo('EFECTIVO')
    setMontoRecibido('')
    setError('')
    searchRef.current?.focus()
  }

  const subtotal  = ticket.reduce((s, i) => {
    if (i.esCortesia) return s
    const precio = i.presentacion?.precio || i.producto.precio
    return s + precio * i.cantidad
  }, 0)
  const total     = subtotal
  const cambio    = metodo === 'EFECTIVO' && montoRecibido
    ? Math.max(0, parseFloat(montoRecibido) - total)
    : 0

  const puedeConfirmar = ticket.length > 0 &&
    (metodo !== 'EFECTIVO' || !montoRecibido || parseFloat(montoRecibido) >= total)

  const confirmarVenta = async () => {
    if (!puedeConfirmar) return
    setLoading(true)
    setError('')
    try {
      const body = {
        detalle: ticket.map(i => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad * (i.presentacion?.factor || 1),
          es_cortesia: i.esCortesia || false,
        })),
        pago: {
          metodo,
          monto_recibido: metodo === 'EFECTIVO' ? parseFloat(montoRecibido || total) : 0,
        },
      }

      const res  = await fetch(`${API}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error al confirmar venta')

      setVentaExitosa({ ...data.data, cambio })
      setProductos(prev => prev.map(p => {
        const item = ticket.find(i => i.producto.id === p.id)
        if (!item) return p
        const descuento = item.cantidad * (item.presentacion?.factor || 1)
        return { ...p, stock_actual: p.stock_actual - descuento }
      }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (ventaExitosa) {
    return (
      <TicketModal
        venta={ventaExitosa}
        isDark={isDark}
        C={C}
        onNuevaVenta={() => { setVentaExitosa(null); limpiarTicket() }}
      />
    )
  }

  return (
    <>
      <style>{`
        @keyframes popIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .pop-in { animation: popIn .15s ease-out; }
        .fade-in { animation: fadeIn .15s ease-out; }
        @media (max-width: 768px) {
          #pos-container { flex-direction: column !important; height: auto !important; }
          #pos-container > div:first-child { flex: 1 1 auto !important; min-height: 300px; }
          #pos-container > div:last-child { width: 100% !important; flex-shrink: 1 !important; }
        }
      `}</style>

      <div id="pos-container" style={{ display: 'flex', gap: 20, height: 'calc(100vh - 112px)', fontFamily: "'Inter', sans-serif" }}>

        {/* Panel izquierdo: Catálogo */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: C.surface, borderRadius: 16,
          border: `1px solid ${C.border}`, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.subtext, pointerEvents: 'none' }}>
                <IcSearch />
              </span>
              <input
                ref={searchRef}
                autoFocus
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar producto o SKU..."
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.inputBg, color: C.text,
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {loadingProds ? (
              <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Cargando productos...</div>
            ) : productosFiltrados.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingTop: 40 }}>
                {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay productos disponibles'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {productosFiltrados.map(p => (
                  <ProductoCard
                    key={p.id}
                    producto={p}
                    isDark={isDark}
                    C={C}
                    enTicket={ticket.filter(i => i.producto.id === p.id).reduce((s, i) => s + i.cantidad, 0)}
                    onClick={() => handleClickProducto(p)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Popover de presentaciones */}
          {presentPanel && (
            <div className="fade-in" onClick={() => setPresentPanel(null)} style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div className="pop-in" onClick={e => e.stopPropagation()} style={{
                background: C.surface, borderRadius: 16, padding: '20px 24px',
                border: `1px solid ${C.border}`, minWidth: 260, maxWidth: 340,
                boxShadow: isDark ? '0 20px 60px -8px rgba(0,0,0,0.8)' : '0 20px 60px -8px rgba(29,84,125,0.2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{presentPanel.producto.nombre}</span>
                  <button onClick={() => setPresentPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.subtext, padding: 4 }}><IcX /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presentPanel.pres.map((pr, i) => (
                    <button key={i} onClick={() => agregarAlTicket(presentPanel.producto, 1, pr, false)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                      background: C.inputBg, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                      transition: 'all .15s', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.background = isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.inputBg }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{pr.etiqueta}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.lime }}>{fmt(pr.precio || presentPanel.producto.precio)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho: Ticket */}
        <div style={{
          width: 360, display: 'flex', flexDirection: 'column',
          background: C.surface, borderRadius: 16,
          border: `1px solid ${C.border}`, overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcReceipt />
              <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Ticket</span>
              {ticket.length > 0 && (
                <span style={{ background: C.lime, color: '#0C0F14', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>
                  {ticket.reduce((s, i) => s + i.cantidad, 0)}
                </span>
              )}
            </div>
            {ticket.length > 0 && (
              <button onClick={limpiarTicket} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(231,45,139,0.08)', color: C.pink, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Limpiar
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {ticket.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: C.muted }}>
                <IcReceipt />
                <span style={{ fontSize: 13 }}>Agrega productos al ticket</span>
              </div>
            ) : (
              ticket.map((item, idx) => {
                const precio = item.presentacion?.precio || item.producto.precio
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 8px', borderBottom: `1px solid ${C.border}`,
                    opacity: item.esCortesia ? 0.7 : 1,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.producto.nombre}
                      </p>
                      {item.presentacion && (
                        <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>{item.presentacion.etiqueta}</p>
                      )}
                      <p style={{ margin: 0, fontSize: 12, color: item.esCortesia ? C.pink : C.subtext }}>
                        {item.esCortesia ? 'Cortesía' : fmt(precio) + ' c/u'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => toggleCortesiaItem(idx)} title="Cortesía" style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0,
                        background: item.esCortesia ? 'rgba(231,45,139,0.15)' : 'transparent',
                        color: item.esCortesia ? C.pink : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .1s', fontSize: 12,
                      }}><IcGift /></button>
                      <CantidadBtn onClick={() => cambiarCantidad(idx, -1)} C={C}><IcMinus /></CantidadBtn>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, minWidth: 20, textAlign: 'center' }}>{item.cantidad}</span>
                      <CantidadBtn onClick={() => cambiarCantidad(idx, 1)} C={C}><IcPlus /></CantidadBtn>
                      <CantidadBtn onClick={() => quitarItem(idx)} C={C} danger><IcTrash /></CantidadBtn>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.esCortesia ? C.pink : C.lime, minWidth: 60, textAlign: 'right', flexShrink: 0 }}>
                      {item.esCortesia ? '$0.00' : fmt(precio * item.cantidad)}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: C.subtext }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{fmt(total)}</span>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'EFECTIVO', label: 'Efectivo', icon: <IcCash /> },
                { key: 'TARJETA', label: 'Tarjeta', icon: <IcCard /> },
                { key: 'TRANSFERENCIA', label: 'Transf.', icon: <IcTransfer /> },
              ].map(m => (
                <button key={m.key} onClick={() => { setMetodo(m.key); setMontoRecibido('') }} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10,
                  border: `1px solid ${metodo === m.key ? C.lime : C.border}`,
                  background: metodo === m.key ? (isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)') : 'transparent',
                  color: metodo === m.key ? C.lime : C.subtext,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  fontFamily: 'inherit', transition: 'all .15s',
                }}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>

            {metodo === 'EFECTIVO' && (
              <div>
                <input type="number" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)}
                  placeholder={`Monto recibido (min. ${fmt(total)})`}
                  min={total}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: `1px solid ${montoRecibido && parseFloat(montoRecibido) < total ? C.pink : C.border}`,
                    background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  }}
                />
                {montoRecibido && parseFloat(montoRecibido) >= total && (
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8,
                    background: isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.06)' }}>
                    <span style={{ fontSize: 12, color: C.subtext }}>Cambio</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.lime }}>{fmt(cambio)}</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', color: C.pink, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IcX />{error}
              </div>
            )}

            <button onClick={confirmarVenta} disabled={!puedeConfirmar || loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: puedeConfirmar && !loading ? 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)' : C.border,
                color: puedeConfirmar && !loading ? '#0C0F14' : C.muted,
                fontWeight: 700, fontSize: 15, cursor: puedeConfirmar && !loading ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', transition: 'all .2s',
                boxShadow: puedeConfirmar && !loading ? '0 4px 16px -4px rgba(0,117,63,0.4)' : 'none',
              }}>
              {loading ? 'Procesando...' : `Cobrar ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ProductoCard({ producto, isDark, C, enTicket, onClick }) {
  const sinStock = producto.stock_actual <= 0
  const tienePres = parsePresentaciones(producto.presentaciones)
  return (
    <button onClick={onClick} disabled={sinStock} style={{
      padding: '12px 10px', borderRadius: 12, border: `1px solid`,
      borderColor: enTicket > 0 ? C.lime : C.border,
      background: enTicket > 0
        ? (isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.05)')
        : (isDark ? 'rgba(35,122,170,0.05)' : 'rgba(29,84,125,0.02)'),
      cursor: sinStock ? 'not-allowed' : 'pointer', opacity: sinStock ? 0.45 : 1,
      textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s',
      position: 'relative', display: 'flex', flexDirection: 'column', gap: 6,
    }}
    onMouseEnter={e => { if (!sinStock) e.currentTarget.style.borderColor = C.lime }}
    onMouseLeave={e => { if (enTicket === 0) e.currentTarget.style.borderColor = C.border }}
    >
      {enTicket > 0 && (
        <span style={{ position: 'absolute', top: 6, right: 6, background: C.lime, color: '#0C0F14', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
          {enTicket}
        </span>
      )}
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{producto.nombre}</span>
      {producto.sku && <span style={{ fontSize: 10, color: C.muted }}>{producto.sku}</span>}
      {tienePres ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: C.subtext, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IcChevron /> {tienePres.length} tamaños
        </span>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 700, color: C.lime }}>{fmt(producto.precio)}</span>
      )}
      {(producto.medida && producto.medida !== 'UNIDAD' && !tienePres) && (
        <span style={{ fontSize: 9, color: C.subtext, fontWeight: 500 }}>por {producto.medida.toLowerCase()}</span>
      )}
      <span style={{ fontSize: 10, color: producto.stock_actual <= (producto.stock_minimo || 5) ? '#E72D8B' : C.muted }}>
        {sinStock ? 'Sin stock' : `Stock: ${producto.stock_actual}`}
      </span>
    </button>
  )
}

function CantidadBtn({ onClick, disabled, children, C, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`,
      background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: danger ? '#E72D8B' : C.subtext,
      opacity: disabled ? 0.4 : 1, padding: 0, transition: 'all .1s', fontFamily: 'inherit',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(231,45,139,0.1)' : C.inputBg }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function TicketModal({ venta, C, onNuevaVenta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 112px)' }}>
      <div style={{
        background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`,
        padding: '40px 36px', maxWidth: 400, width: '100%',
        textAlign: 'center', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px -4px rgba(0,117,63,0.4)' }}>
          <IcCheck />
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.text }}>¡Venta confirmada!</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: C.subtext }}>Ticket #{venta.ticket_numero}</p>
        <div style={{ background: C.surface2, borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
          {venta.detalle?.map(d => (
            <div key={d.producto_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.text, padding: '4px 0', borderBottom: `1px solid ${C.border}` }}>
              <span>{d.producto_nombre} × {d.cantidad}{d.es_cortesia ? ' 🎁' : ''}</span>
              <span style={{ fontWeight: 600 }}>{fmt(d.subtotal)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.lime }}>{fmt(venta.total)}</span>
          </div>
          {venta.cambio > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 }}>
              <span style={{ fontSize: 13, color: C.subtext }}>Cambio</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.subtext }}>{fmt(venta.cambio)}</span>
            </div>
          )}
        </div>
        <button onClick={onNuevaVenta} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
          color: '#0C0F14', fontWeight: 700, fontSize: 15,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 4px 16px -4px rgba(0,117,63,0.4)',
        }}>Nueva venta</button>
      </div>
    </div>
  )
}
