import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { finanzasService } from '@/services/finanzas.service'
import { inventarioService } from '@/services/inventario.service'
import { ventasService } from '@/services/ventas.service'

// ── Íconos ───────────────────────────────────────────────────
const IcTrend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IcCash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>
    <path d="M6 12h.01M18 12h.01"/>
  </svg>
)
const IcCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IcGift = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
)
const IcAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <triangle points="10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcTransfer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)
const IcRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)

// ── Helpers ──────────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n || 0)
const fmtDate = d => new Date(d).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
const today = () => new Date().toISOString().split('T')[0]

// ── MetricCard ───────────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, accent, isDark, loading }) {
  return (
    <div style={{
      background: isDark ? '#0a1929' : 'white',
      border: `1px solid ${isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)'}`,
      borderRadius: 16, padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
      transition: 'transform .2s, box-shadow .2s',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = isDark
        ? '0 8px 28px -4px rgba(0,0,0,0.5)'
        : '0 8px 24px -4px rgba(29,84,125,0.14)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = isDark
        ? '0 4px 20px -4px rgba(0,0,0,0.4)'
        : '0 4px 16px -4px rgba(29,84,125,0.08)'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#237AAA' : '#1D547D', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {label}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>
          <Icon />
        </div>
      </div>
      {loading ? (
        <div style={{ height: 28, borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
      ) : (
        <span style={{ fontSize: 24, fontWeight: 700, color: isDark ? '#F1F6F6' : '#0C0F14', letterSpacing: '-.02em' }}>
          {value}
        </span>
      )}
    </div>
  )
}

// ── MiniBarChart ─────────────────────────────────────────────
function MiniBarChart({ data, isDark }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.total), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            title={fmt(d.total)}
            style={{
              width: '100%', borderRadius: '4px 4px 0 0',
              height: `${Math.max((d.total / max) * 52, 4)}px`,
              background: i === data.length - 1
                ? 'linear-gradient(180deg, #B6CD38 0%, #00753F 100%)'
                : isDark ? 'rgba(35,122,170,0.35)' : 'rgba(29,84,125,0.2)',
              transition: 'height .4s cubic-bezier(.4,0,.2,1)',
            }}
          />
          <span style={{ fontSize: 9, color: isDark ? '#237AAA' : '#1D547D', whiteSpace: 'nowrap' }}>
            {d.dia}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const { user }  = useAuth()
  const { theme } = useTheme()
  const isDark    = theme === 'dark'

  const [resumen, setResumen]         = useState(null)
  const [bajoStock, setBajoStock]     = useState([])
  const [ventas, setVentas]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  const C = {
    text:    isDark ? '#F1F6F6' : '#0C0F14',
    subtext: isDark ? '#237AAA' : '#1D547D',
    card:    isDark ? '#0a1929' : 'white',
    border:  isDark ? 'rgba(35,122,170,0.15)' : 'rgba(29,84,125,0.10)',
    section: isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.03)',
  }

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [res, stock, v] = await Promise.all([
        finanzasService.getResumenDia(today()).catch(() => null),
        inventarioService.getBajoStock().catch(() => []),
        ventasService.getVentas({ estado: 'CERRADA', limite: 8, fecha: today() }).catch(() => []),
      ])
      setResumen(res)
      setBajoStock(stock || [])
      setVentas(v || [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const hora = new Date().toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
  const fecha = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .4s ease both }
        .dash-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
        @media (max-width: 768px) { .dash-grid-2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div className="fade-in" style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>
              Buenos días, {user?.nombre?.split(' ')[0]} 
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext, textTransform: 'capitalize' }}>
              {fecha} · {hora}
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.card, color: C.subtext,
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all .15s',
              opacity: refreshing ? .6 : 1,
            }}
          >
            <span style={{ display: 'flex', animation: refreshing ? 'spin .75s linear infinite' : 'none' }}>
              <IcRefresh />
            </span>
            Actualizar
          </button>
        </div>
          
        {/* Métricas del día */}
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <MetricCard label="Ventas del día"   value={fmt(resumen?.total_ventas)}   icon={IcTrend}     accent="#B6CD38" isDark={isDark} loading={loading}/>
          <MetricCard label="Efectivo"          value={fmt(resumen?.total_efectivo)} icon={IcCash}      accent="#00753F" isDark={isDark} loading={loading}/>
          <MetricCard label="Tarjeta"           value={fmt(resumen?.total_tarjeta)}  icon={IcCard}      accent="#237AAA" isDark={isDark} loading={loading}/>
          <MetricCard label="Transferencia"     value={fmt(resumen?.total_transferencia)} icon={IcTransfer} accent="#8A6A4A" isDark={isDark} loading={loading}/>
          <MetricCard label="Cortesías"         value={resumen?.num_cortesias ?? 0}  icon={IcGift}      accent="#E72D8B" isDark={isDark} loading={loading}/>
        </div>

        {/* Segunda fila */}
        <div className="dash-grid-2">

          {/* Últimas ventas */}
          <div className="fade-in" style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>Ventas recientes</h2>
              <span style={{ fontSize: 12, color: C.subtext }}>{ventas.length} hoy</span>
            </div>
            <div style={{ padding: '8px 0' }}>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 12, borderRadius: 6, width: '60%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                      <div style={{ height: 10, borderRadius: 6, width: '40%', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                    </div>
                  </div>
                ))
              ) : ventas.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>
                  Sin ventas registradas hoy
                </div>
              ) : (
                ventas.map((v, i) => (
                  <div key={v.id} style={{
                    padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i < ventas.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: v.tipo === 'CORTESIA' ? 'rgba(231,45,139,0.12)' : 'rgba(182,205,56,0.12)',
                      color: v.tipo === 'CORTESIA' ? '#E72D8B' : '#B6CD38',
                      fontWeight: 700, fontSize: 12,
                    }}>
                      #{v.ticket_numero}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.vendedor_nombre}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>
                        {fmtDate(v.created_at)}
                        {v.tipo === 'CORTESIA' && <span style={{ color: '#E72D8B', marginLeft: 6, fontWeight: 600 }}>· Cortesía</span>}
                      </p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: v.tipo === 'CORTESIA' ? '#E72D8B' : '#B6CD38', flexShrink: 0 }}>
                      {fmt(v.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bajo stock */}
          <div className="fade-in" style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>Bajo stock</h2>
              {bajoStock.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: 'rgba(231,45,139,0.12)', color: '#E72D8B' }}>
                  {bajoStock.length} productos
                </span>
              )}
            </div>
            <div style={{ padding: '8px 0' }}>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: '10px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1, height: 12, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                    <div style={{ width: 50, height: 12, borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                  </div>
                ))
              ) : bajoStock.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>
                  ✓ Todo el inventario en orden
                </div>
              ) : (
                bajoStock.map((p, i) => (
                  <div key={p.id} style={{
                    padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i < bajoStock.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(35,122,170,0.06)' : 'rgba(29,84,125,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: p.stock_actual === 0 ? '#E72D8B' : '#f59e0b',
                    }}/>
                    <span style={{ flex: 1, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nombre}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: C.subtext }}>mín {p.stock_minimo}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: p.stock_actual === 0 ? 'rgba(231,45,139,0.12)' : 'rgba(245,158,11,0.12)',
                        color: p.stock_actual === 0 ? '#E72D8B' : '#f59e0b',
                      }}>
                        {p.stock_actual} pzs
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Resumen financiero del día */}
        {!loading && resumen && (
          <div className="fade-in" style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: '20px 24px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 20,
            boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
          }}>
            {[
              { label: 'Gastos del día', value: fmt(resumen.total_gastos), color: '#E72D8B' },
              { label: 'Utilidad estimada', value: fmt(resumen.utilidad), color: resumen.utilidad >= 0 ? '#B6CD38' : '#E72D8B' },
              { label: 'Núm. ventas', value: resumen.num_ventas, color: '#8A6A4A' },
              { label: 'Valor cortesías', value: fmt(resumen.total_cortesias), color: '#E72D8B' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
                  {label}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700, color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}