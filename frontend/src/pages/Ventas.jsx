import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { ventasService } from '@/services/ventas.service'
import client from '@/api/client'

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
const IcEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IcBan = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)
const IcReceipt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
  </svg>
)

const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
const fmtDT = d => new Date(d).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

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
        width: '100%', maxWidth: 600,
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
            color: isDark ? '#237AAA' : '#1D547D', borderRadius: 6,
            display: 'flex', transition: 'background .15s',
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

export default function Ventas() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'

  const [ventas, setVentas]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todas')

  const [modalVenta, setModalVenta]   = useState(null)
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalCancelar, setModalCancelar] = useState(null)
  const [motivoCancelar, setMotivoCancelar] = useState('')
  const [cancelling, setCancelling]   = useState(false)
  const [error, setError] = useState('')

  const C = {
    text:    isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    card:    isDark ? '#0a1929' : 'white',
    border:  isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)',
    hover:   isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)',
  }

  const fetchVentas = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filtroEstado !== 'todas') params.estado = filtroEstado
      const data = await ventasService.getVentas(params)
      setVentas(data || [])
    } finally {
      setLoading(false)
    }
  }, [filtroEstado])

  useEffect(() => { fetchVentas() }, [fetchVentas])

  const verDetalle = async (venta) => {
    setModalVenta(venta)
    setModalDetalle(loading)
    try {
      const detalle = await ventasService.getVenta(venta.id)
      setModalDetalle(detalle)
    } catch {
      setModalDetalle(null)
    }
  }

  const abrirCancelar = (venta) => {
    setModalCancelar(venta)
    setMotivoCancelar('')
    setError('')
  }

  const handleCancelar = async () => {
    if (!motivoCancelar.trim()) return setError('El motivo es requerido')
    setCancelling(true)
    setError('')
    try {
      await ventasService.cancelarVenta(modalCancelar.id, motivoCancelar)
      setModalCancelar(null)
      fetchVentas()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cancelar')
    } finally {
      setCancelling(false)
    }
  }

  const ventasFiltradas = ventas.filter(v => {
    const s = search.toLowerCase()
    if (!s) return true
    return v.vendedor_nombre?.toLowerCase().includes(s) ||
      String(v.ticket_numero).includes(s) ||
      v.tipo?.toLowerCase().includes(s)
  })

  const TABS = [
    { key: 'todas', label: 'Todas' },
    { key: 'CERRADA', label: 'Cerradas' },
    { key: 'CANCELADA', label: 'Canceladas' },
  ]

  const badgeEstilo = (estado) => {
    if (estado === 'CERRADA') return { bg: 'rgba(182,205,56,0.12)', color: '#B6CD38' }
    if (estado === 'CANCELADA') return { bg: 'rgba(231,45,139,0.12)', color: '#E72D8B' }
    return { bg: 'rgba(138,106,74,0.12)', color: '#8A6A4A' }
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes modalIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .4s ease both }
        @media (max-width: 768px) {
          .filter-row { flex-direction: column; align-items: stretch !important; }
          .filter-row input { width: 100% !important; min-width: 0 !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div className="fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Ventas</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>{ventas.length} ventas registradas</p>
          </div>
        </div>

        <div className="filter-row" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 4 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setFiltroEstado(t.key)} style={{
                padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: filtroEstado === t.key ? 600 : 400,
                fontFamily: 'inherit',
                background: filtroEstado === t.key ? (isDark ? '#0a1929' : 'white') : 'transparent',
                color: filtroEstado === t.key ? '#B6CD38' : C.subtext,
                boxShadow: filtroEstado === t.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                transition: 'all .15s', whiteSpace: 'nowrap',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.subtext, pointerEvents: 'none' }}>
              <IcSearch />
            </span>
            <input
              placeholder="Buscar por ticket, vendedor o tipo..."
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
          <div style={{ minWidth: 720 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '60px 1.5fr 1fr 100px 100px 120px 120px 80px',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.border}`,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(29,84,125,0.03)',
          }}>
            {['Ticket', 'Vendedor', 'Tipo', 'Estado', 'Total', 'Método', 'Fecha', 'Acciones'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 100px 100px 120px 120px 80px', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                {Array(8).fill(0).map((_, j) => (
                  <div key={j} style={{ height: 14, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                ))}
              </div>
            ))
          ) : ventasFiltradas.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>
              {search ? `Sin resultados para "${search}"` : 'Sin ventas registradas'}
            </div>
          ) : (
            ventasFiltradas.map((v, i) => {
              const bEstado = badgeEstilo(v.estado)
              const metodo = v.pagos?.[0]?.metodo || '—'
              return (
                <div key={v.id} style={{
                  display: 'grid', gridTemplateColumns: '60px 1.5fr 1fr 100px 100px 120px 120px 80px',
                  padding: '12px 20px', alignItems: 'center',
                  borderBottom: i < ventasFiltradas.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition: 'background .15s',
                  opacity: v.estado === 'CANCELADA' ? 0.5 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#B6CD38' }}>#{v.ticket_numero}</span>

                  <span style={{ fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.vendedor_nombre}
                  </span>

                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: v.tipo === 'CORTESIA' ? 'rgba(231,45,139,0.12)' : 'rgba(182,205,56,0.12)',
                    color: v.tipo === 'CORTESIA' ? '#E72D8B' : '#B6CD38',
                    display: 'inline-block', width: 'fit-content',
                  }}>
                    {v.tipo}
                  </span>

                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: bEstado.bg, color: bEstado.color,
                    display: 'inline-block', width: 'fit-content',
                  }}>
                    {v.estado}
                  </span>

                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(v.total)}</span>

                  <span style={{ fontSize: 12, color: C.subtext }}>{metodo}</span>

                  <span style={{ fontSize: 12, color: C.subtext }}>{fmtDT(v.created_at)}</span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button title="Ver detalle" onClick={() => verDetalle(v)} style={{
                      padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: 'rgba(35,122,170,0.12)', color: '#237AAA',
                      display: 'flex', transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,122,170,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(35,122,170,0.12)'}
                    >
                      <IcEye />
                    </button>
                    {v.estado === 'CERRADA' && user?.rol === 'administrador' && (
                      <button title="Cancelar" onClick={() => abrirCancelar(v)} style={{
                        padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: 'rgba(231,45,139,0.10)', color: '#E72D8B',
                        display: 'flex', transition: 'background .15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,45,139,0.22)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,45,139,0.10)'}
                      >
                        <IcBan />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        </div>
      </div>

      {/* Modal - Detalle de venta */}
      <Modal open={!!modalVenta} onClose={() => { setModalVenta(null); setModalDetalle(null) }} title={`Venta #${modalVenta?.ticket_numero || ''}`} isDark={isDark}>
        {modalVenta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Vendedor</span>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: C.text }}>{modalVenta.vendedor_nombre}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Fecha</span>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: C.text }}>{fmtDT(modalVenta.created_at)}</p>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tipo</span>
                <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: modalVenta.tipo === 'CORTESIA' ? '#E72D8B' : '#B6CD38' }}>
                  {modalVenta.tipo}
                </p>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Estado</span>
                <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: badgeEstilo(modalVenta.estado).color }}>
                  {modalVenta.estado}
                </p>
              </div>
            </div>

            {modalVenta.autorizado_por && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
                <span style={{ fontSize: 11, color: '#E72D8B', fontWeight: 600 }}>Autorizado por: {modalVenta.autorizado_por}</span>
              </div>
            )}

            {modalDetalle?.detalle && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'block' }}>
                  Productos
                </span>
                <div style={{
                  border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden',
                }}>
                  {modalDetalle.detalle.map((d, idx) => (
                    <div key={d.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom: idx < modalDetalle.detalle.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}>
                      <div>
                        <span style={{ fontSize: 13, color: C.text }}>{d.producto_nombre}</span>
                        <span style={{ fontSize: 11, color: C.subtext, marginLeft: 8 }}>x{d.cantidad}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#B6CD38' }}>{fmt(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalDetalle?.pagos && modalDetalle.pagos.length > 0 && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'block' }}>
                  Pagos
                </span>
                {modalDetalle.pagos.map((p, idx) => (
                  <div key={p.id} style={{
                    padding: '10px 14px', borderRadius: 10, marginBottom: idx < modalDetalle.pagos.length - 1 ? 6 : 0,
                    background: isDark ? 'rgba(35,122,170,0.08)' : 'rgba(29,84,125,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{p.metodo}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#B6CD38' }}>{fmt(p.monto)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: isDark ? 'rgba(182,205,56,0.06)' : 'rgba(182,205,56,0.05)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#B6CD38' }}>{fmt(modalDetalle?.total || modalVenta?.total)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal - Cancelar venta */}
      <Modal open={!!modalCancelar} onClose={() => setModalCancelar(null)} title={`Cancelar venta #${modalCancelar?.ticket_numero || ''}`} isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.subtext }}>
            Esta acción revertirá el inventario y marcará la venta como cancelada.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#8A6A4A', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Motivo *
            </label>
            <textarea
              placeholder="Describe el motivo de la cancelación..."
              value={motivoCancelar}
              onChange={e => setMotivoCancelar(e.target.value)}
              rows={2}
              style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', resize: 'vertical',
                background: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
                color: isDark ? '#F1F6F6' : '#0C0F14',
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 12, color: '#E72D8B', padding: '8px 12px', borderRadius: 8, background: 'rgba(231,45,139,0.08)', border: '1px solid rgba(231,45,139,0.2)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={() => setModalCancelar(null)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Volver
            </button>
            <button onClick={handleCancelar} disabled={cancelling} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #E72D8B 0%, #c0206e 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: cancelling ? .7 : 1,
              boxShadow: '0 4px 12px -4px rgba(231,45,139,0.4)',
            }}>
              {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
