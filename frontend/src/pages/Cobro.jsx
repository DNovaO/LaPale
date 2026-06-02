import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import client from '@/api/client'

const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0)

const IcCash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
const IcCard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
const IcTransfer = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
const IcRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>

export default function Cobro() {
  const { token } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [cobrando, setCobrando] = useState(null)
  const [error, setError] = useState('')
  const [pagos, setPagos] = useState({})

  const C = {
    text: isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    card: isDark ? '#0a1929' : 'white',
    border: isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)',
    inputBg: isDark ? 'rgba(35,122,170,0.08)' : 'rgba(29,84,125,0.05)',
    lime: '#B6CD38',
    pink: '#E72D8B',
  }

  const fetchPendientes = useCallback(async () => {
    try {
      const res = await client.get('/ventas/pendientes')
      setPendientes(res.data?.data || [])
      setError('')
    } catch (e) {
      if (e.response?.status === 404) {
        setError('Endpoint no encontrado. Verifica que el backend este actualizado.')
      } else {
        setError(e.response?.data?.message || e.message || 'Error al cargar cuentas pendientes')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPendientes()
    const interval = setInterval(fetchPendientes, 10000)
    return () => clearInterval(interval)
  }, [fetchPendientes])

  const handleCobrar = async (ventaId) => {
    const p = pagos[ventaId] || { metodo: 'EFECTIVO', monto_recibido: 0 }
    const venta = pendientes.find(v => v.id === ventaId)
    if (!venta) return
    const monto = venta.subtotal
    if (p.metodo === 'EFECTIVO' && p.monto_recibido > 0 && p.monto_recibido < monto) return

    setCobrando(ventaId)
    setError('')
    try {
      await client.post(`/ventas/${ventaId}/cobrar`, {
        metodo: p.metodo,
        monto_recibido: p.metodo === 'EFECTIVO' ? p.monto_recibido : 0,
      })
      setPendientes(prev => prev.filter(v => v.id !== ventaId))
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cobrar')
    } finally {
      setCobrando(null)
    }
  }

  const setPago = (ventaId, data) => {
    setPagos(prev => ({ ...prev, [ventaId]: { ...prev[ventaId], ...data } }))
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Cuentas pendientes de cobro</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>
            {pendientes.length} cuenta{pendientes.length !== 1 ? 's' : ''} por cobrar
          </p>
        </div>
        <button onClick={fetchPendientes} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 10,
          border: `1px solid ${C.border}`, background: C.card, color: C.subtext,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}><IcRefresh /> Actualizar</button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(231,45,139,0.08)', color: C.pink, fontSize: 12, marginBottom: 16, border: '1px solid rgba(231,45,139,0.2)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.subtext, fontSize: 13 }}>Cargando...</div>
      ) : pendientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.subtext, fontSize: 13 }}>
          Sin cuentas pendientes de cobro
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pendientes.map(v => {
            const p = pagos[v.id] || { metodo: 'EFECTIVO', monto_recibido: 0 }
            const cambio = p.metodo === 'EFECTIVO' && p.monto_recibido
              ? Math.max(0, p.monto_recibido - v.subtotal)
              : 0
            const puedeCobrar = p.metodo !== 'EFECTIVO' || !p.monto_recibido || p.monto_recibido >= v.subtotal

            return (
              <div key={v.id} style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: '20px 24px',
                boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Ticket #{v.ticket_numero}</span>
                    <span style={{ fontSize: 12, color: C.subtext, marginLeft: 10 }}>
                      Vendedor: {v.vendedor_nombre}
                    </span>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.lime }}>{fmt(v.subtotal)}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginBottom: 14 }}>
                  {v.detalle?.map((d, i) => (
                    <span key={i} style={{ fontSize: 11, color: C.subtext }}>
                      {d.cantidad}x {d.producto_nombre}
                      {i < v.detalle.length - 1 && ','}
                    </span>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[
                      { key: 'EFECTIVO', label: 'Efectivo', icon: <IcCash /> },
                      { key: 'TARJETA', label: 'Tarjeta', icon: <IcCard /> },
                      { key: 'TRANSFERENCIA', label: 'Transf.', icon: <IcTransfer /> },
                    ].map(m => (
                      <button key={m.key} onClick={() => setPago(v.id, { metodo: m.key, monto_recibido: 0 })} style={{
                        flex: 1, padding: '8px 4px', borderRadius: 10,
                        border: `1px solid ${p.metodo === m.key ? C.lime : C.border}`,
                        background: p.metodo === m.key ? (isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)') : 'transparent',
                        color: p.metodo === m.key ? C.lime : C.subtext,
                        fontSize: 11, fontWeight: 500, cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        fontFamily: 'inherit', transition: 'all .15s',
                      }}>{m.icon}{m.label}</button>
                    ))}
                  </div>

                  {p.metodo === 'EFECTIVO' && (
                    <div style={{ marginBottom: 12 }}>
                      <input type="number" value={p.monto_recibido || ''} onChange={e => setPago(v.id, { ...p, monto_recibido: parseFloat(e.target.value) || 0 })}
                        placeholder={`Monto recibido (min. ${fmt(v.subtotal)})`}
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: 8,
                          border: `1px solid ${p.monto_recibido && p.monto_recibido < v.subtotal ? C.pink : C.border}`,
                          background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                      {p.monto_recibido > 0 && p.monto_recibido >= v.subtotal && (
                        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8,
                          background: isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.06)' }}>
                          <span style={{ fontSize: 12, color: C.subtext }}>Cambio</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.lime }}>{fmt(cambio)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <button onClick={() => handleCobrar(v.id)} disabled={!puedeCobrar || cobrando === v.id}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                      background: puedeCobrar && cobrando !== v.id ? 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)' : C.border,
                      color: puedeCobrar && cobrando !== v.id ? '#0C0F14' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      fontWeight: 700, fontSize: 14, cursor: puedeCobrar && cobrando !== v.id ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'all .2s',
                      boxShadow: puedeCobrar && cobrando !== v.id ? '0 4px 16px -4px rgba(0,117,63,0.4)' : 'none',
                    }}>
                    {cobrando === v.id ? 'Cobrando...' : `Cobrar ${fmt(v.subtotal)}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
