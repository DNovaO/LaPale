import { useEffect, useState, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { finanzasService } from '@/services/finanzas.service'
import { inventarioService } from '@/services/inventario.service'
import client from '@/api/client'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const IcPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IcX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IcCash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>
  </svg>
)
const IcCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IcTransfer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)
const IcRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const IcPDF = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
)

const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const fmtDT = d => new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtFull = d => new Date(d).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const TIPOS_GASTO = [
  { value: 'RENTA', label: 'Renta' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'INSUMOS', label: 'Insumos' },
  { value: 'NOMINA', label: 'Nómina' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'OTRO', label: 'Otro' },
]

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

export default function Finanzas() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [tab, setTab] = useState('resumen')
  const [fecha, setFecha] = useState(today())
  const [desde, setDesde] = useState(today())
  const [hasta, setHasta] = useState(today())

  const [resumenDia, setResumenDia] = useState(null)
  const [resumenPeriodo, setResumenPeriodo] = useState(null)
  const [gastos, setGastos] = useState([])
  const [cierres, setCierres] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalGasto, setModalGasto] = useState(false)
  const [formGasto, setFormGasto] = useState({ tipo: 'OTRO', monto: '', descripcion: '', observaciones: '', fecha: today() })
  const [savingGasto, setSavingGasto] = useState(false)
  const [error, setError] = useState('')

  const [modalCerrarCaja, setModalCerrarCaja] = useState(false)
  const [notasCierre, setNotasCierre] = useState('')
  const [tipoCierre, setTipoCierre] = useState('COMPLETO')
  const [cerrando, setCerrando] = useState(false)

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
      if (tab === 'resumen') {
        const [dia, periodo] = await Promise.all([
          finanzasService.getResumenDia(fecha).catch(() => null),
          finanzasService.getResumenPeriodo(desde, hasta).catch(() => null),
        ])
        setResumenDia(dia)
        setResumenPeriodo(periodo)
      } else if (tab === 'gastos') {
        const data = await finanzasService.getGastos({ desde, hasta }).catch(() => [])
        setGastos(data || [])
      } else if (tab === 'caja') {
        const data = await finanzasService.getCierres().catch(() => [])
        setCierres(data || [])
      }
    } finally {
      setLoading(false)
    }
  }, [tab, fecha, desde, hasta])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreateGasto = async () => {
    if (!formGasto.monto || isNaN(formGasto.monto) || Number(formGasto.monto) <= 0)
      return setError('El monto debe ser mayor a 0')
    setSavingGasto(true); setError('')
    try {
      await finanzasService.createGasto({
        tipo: formGasto.tipo,
        monto: Number(formGasto.monto),
        descripcion: formGasto.descripcion,
        observaciones: formGasto.observaciones,
        fecha: formGasto.fecha,
      })
      setModalGasto(false)
      setFormGasto({ tipo: 'OTRO', monto: '', descripcion: '', observaciones: '', fecha: today() })
      fetchData()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al crear gasto')
    } finally {
      setSavingGasto(false)
    }
  }

  const handleDeleteGasto = async (id) => {
    try {
      await finanzasService.deleteGasto(id)
      fetchData()
    } catch { /* empty */ }
  }

  const handleCerrarCaja = async () => {
    setCerrando(true); setError('')
    try {
      const cierre = await finanzasService.cerrarCaja(notasCierre, tipoCierre)
      setModalCerrarCaja(false)
      setNotasCierre('')
      setTipoCierre('COMPLETO')

      const [gastos, productos] = await Promise.all([
        finanzasService.getGastos({ desde: today(), hasta: today() }).catch(() => []),
        inventarioService.getProductos(false).catch(() => []),
      ])
      const blob = generarPDF(cierre, gastos, productos || [])

      const formData = new FormData()
      formData.append('pdf', blob, 'cierre.pdf')
      const token = localStorage.getItem('token')
      await fetch('/api/finanzas/caja/' + cierre.id + '/pdf', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).catch(() => {})

      fetchData()
    } catch (e) {
      setError(e.response?.data?.message || 'Error al cerrar caja')
    } finally {
      setCerrando(false)
    }
  }

  const generarPDF = (cierre, gastos, productos) => {
    const doc = new jsPDF()
    const hoje = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const hour = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

    const DARK  = [51, 51, 51]; const GRAY = [100, 100, 100]
    const LINE  = [220, 220, 220]; const LIGHT = [248, 248, 248]
    const TH = 8.5; const TD = 8; const SM = 7.5
    const ML = 14; const MR = 14; const MW = 182
    const CP = 2.5

    // --- Header compacto ---
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('LA PALE', ML, 14)
    doc.setFontSize(18)
    doc.text('Cierre de Caja', ML, 23)

    doc.setDrawColor(60, 60, 60); doc.setLineWidth(0.7)
    doc.line(ML, 27, ML + MW, 27)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let my = 34
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold')
    doc.text(`Fecha: ${fmtFull(cierre.fecha_cierre)}`, ML, my)
    doc.text(`Tipo: ${cierre.tipo === 'PARCIAL' ? 'Corte parcial' : 'Corte completo'}`, ML + 60, my)
    my += 6
    doc.text(`Responsable: ${cierre.usuario_nombre}`, ML, my)
    doc.text(`Generado: ${hoje}  ${hour}`, ML + 60, my)
    if (cierre.notas) { my += 6; doc.text(`Notas: ${cierre.notas}`, ML, my) }

    let y = my + 8
    doc.setDrawColor(...LINE); doc.setLineWidth(0.15)
    doc.line(ML, y, ML + MW, y)
    y += 7

    // --- Resumen + Utilidad combinados ---
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('Resumen del dia', ML, y)
    y += 1

    const utilidad = cierre.total_ventas - cierre.total_gastos
    autoTable(doc, {
      startY: y,
      head: [['Concepto', 'Importe']],
      body: [
        ['Total de ventas  (' + cierre.num_ventas + ' trans.)', fmt(cierre.total_ventas)],
        ['Efectivo', fmt(cierre.total_efectivo)],
        ['Tarjeta', fmt(cierre.total_tarjeta)],
        ['Transferencia', fmt(cierre.total_transferencia)],
        ['Cortesias otorgadas  (' + cierre.num_cortesias + ' und.)', fmt(cierre.total_cortesias)],
        ['Gastos del dia', fmt(cierre.total_gastos)],
        ['Utilidad neta', fmt(utilidad)],
      ],
      styles: { fontSize: TD, cellPadding: CP, textColor: DARK, lineColor: LINE, lineWidth: 0.1 },
      headStyles: { fillColor: [55, 55, 55], textColor: 255, fontStyle: 'bold', fontSize: TH },
      columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 70 } },
      alternateRowStyles: { fillColor: LIGHT },
      margin: { left: ML, right: MR },
    })
    y = doc.lastAutoTable.finalY + 8

    // --- Gastos ---
    if (gastos.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text('Gastos', ML, y)
      y += 1

      autoTable(doc, {
        startY: y,
        head: [['Descripcion', 'Tipo', 'Monto']],
        body: gastos.map(g => [g.descripcion || g.tipo, g.tipo, fmt(g.monto)]),
        foot: [['', 'Total', fmt(cierre.total_gastos)]],
        styles: { fontSize: SM, cellPadding: CP, textColor: DARK, lineColor: LINE, lineWidth: 0.1 },
        headStyles: { fillColor: [55, 55, 55], textColor: 255, fontStyle: 'bold', fontSize: TH },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40 }, 2: { halign: 'right', cellWidth: 50 } },
        footStyles: { fontStyle: 'bold', fillColor: LIGHT },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: ML, right: MR },
      })
      y = doc.lastAutoTable.finalY + 8
    }

    // --- Inventario en 2 columnas ---
    if (productos.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text(`Inventario final  (${productos.length} productos)`, ML, y)
      y += 1

      const half = Math.ceil(productos.length / 2)
      const left = productos.slice(0, half)
      const right = productos.slice(half)

      const buildInv = (prods) => prods.map(p => [
        p.nombre.length > 22 ? p.nombre.slice(0, 20) + '..' : p.nombre,
        String(p.stock_actual),
        fmt(p.stock_actual * p.precio),
      ])

      const totalInv = productos.reduce((s, p) => s + p.stock_actual * p.precio, 0)

      autoTable(doc, {
        startY: y,
        head: [['Producto', 'Stock', 'Valor']],
        body: buildInv(left),
        styles: { fontSize: 7, cellPadding: 2, textColor: DARK, lineColor: LINE, lineWidth: 0.1 },
        headStyles: { fillColor: [55, 55, 55], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        columnStyles: { 0: { cellWidth: 46 }, 1: { halign: 'center', cellWidth: 14 }, 2: { halign: 'right', cellWidth: 24 } },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: ML, right: MR / 2 + 86 },
        tableWidth: 84,
      })

      const rightStart = y
      autoTable(doc, {
        startY: rightStart,
        head: [['Producto', 'Stock', 'Valor']],
        body: buildInv(right),
        styles: { fontSize: 7, cellPadding: 2, textColor: DARK, lineColor: LINE, lineWidth: 0.1 },
        headStyles: { fillColor: [55, 55, 55], textColor: 255, fontStyle: 'bold', fontSize: 7 },
        columnStyles: { 0: { cellWidth: 46 }, 1: { halign: 'center', cellWidth: 14 }, 2: { halign: 'right', cellWidth: 24 } },
        margin: { left: ML + 94, right: MR },
        tableWidth: 84,
      })

      y = Math.max(doc.lastAutoTable.finalY, rightStart + (half * 8)) + 3

      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      const footY = y + 1
      doc.setFillColor(...LIGHT)
      doc.rect(ML, footY - 3, MW, 6.5, 'F')
      doc.text(`Valor total del inventario:  ${fmt(totalInv)}`, ML + MW / 2, footY + 1.5, { align: 'center' })
    }

    // --- Footer ---
    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setDrawColor(...LINE); doc.setLineWidth(0.15)
      doc.line(ML, doc.internal.pageSize.height - 12, ML + MW, doc.internal.pageSize.height - 12)
      doc.setFontSize(7); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal')
      doc.text(`La Pale  |  Cierre de caja  |  ${hoje}  |  Pagina ${i} de ${pages}`, ML, doc.internal.pageSize.height - 5)
    }

    return doc.output('blob')
  }

  const openPDF = async (id) => {
    try {
      const res = await client.get(`/finanzas/caja/${id}/pdf/view`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
    } catch { /* empty */ }
  }

  const TABS = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'gastos', label: 'Gastos' },
    { key: 'caja', label: 'Caja' },
  ]

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes modalIn { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeIn .4s ease both }
        .finanzas-select {
          -webkit-appearance: none; appearance: none;
          background-image:
            linear-gradient(to right, transparent 85%, ${isDark ? 'rgba(182,205,56,0.08)' : 'rgba(182,205,56,0.15)'} 85%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B6CD38' stroke-width='3'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat, no-repeat;
          background-position: center, right 10px center;
          padding-right: 34px !important;
          cursor: pointer;
        }
        .finanzas-select:hover, .finanzas-select:focus { border-color: #B6CD38 !important; }
        .finanzas-select option {
          background: ${isDark ? '#0a1929' : 'white'};
          color: ${isDark ? '#F1F6F6' : '#0C0F14'};
        }
        @media (max-width: 768px) {
          .finanzas-tabs { width: 100% !important; }
          .finanzas-tabs button { flex: 1; text-align: center; white-space: nowrap; }
          .finanzas-filter { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div className="fade-in" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Finanzas</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.subtext }}>
              {tab === 'resumen' ? 'Reportes financieros' : tab === 'gastos' ? 'Control de gastos' : 'Cierres de caja'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="finanzas-tabs" style={{ display: 'flex', gap: 4, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '6px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
              fontFamily: 'inherit',
              background: tab === t.key ? (isDark ? '#0a1929' : 'white') : 'transparent',
              color: tab === t.key ? '#B6CD38' : C.subtext,
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all .15s', whiteSpace: 'nowrap',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Resumen */}
        {tab === 'resumen' && (
          <>
            <div className="fade-in finanzas-filter" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Día</span>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', background: C.card, color: C.text,
                  border: `1px solid ${C.border}`,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Desde</span>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', background: C.card, color: C.text,
                  border: `1px solid ${C.border}`,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Hasta</span>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', background: C.card, color: C.text,
                  border: `1px solid ${C.border}`,
                }} />
              </div>
              <button onClick={fetchData} style={{
                marginTop: 16, display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card, color: C.subtext,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <IcRefresh /> Actualizar
              </button>
            </div>

            {/* Métricas del día */}
            {!loading && resumenDia && (
              <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Ventas', value: fmt(resumenDia.total_ventas), color: '#B6CD38' },
                  { label: 'Efectivo', value: fmt(resumenDia.total_efectivo), icon: IcCash, accent: '#00753F' },
                  { label: 'Tarjeta', value: fmt(resumenDia.total_tarjeta), icon: IcCard, accent: '#237AAA' },
                  { label: 'Transferencia', value: fmt(resumenDia.total_transferencia), icon: IcTransfer, accent: '#8A6A4A' },
                  { label: 'Cortesías', value: `${resumenDia.num_cortesias} · ${fmt(resumenDia.total_cortesias)}`, color: '#E72D8B' },
                  { label: 'Gastos', value: fmt(resumenDia.total_gastos), color: '#E72D8B' },
                  { label: 'Utilidad', value: fmt(resumenDia.utilidad), color: resumenDia.utilidad >= 0 ? '#B6CD38' : '#E72D8B' },
                  { label: 'Núm. ventas', value: resumenDia.num_ventas, color: '#8A6A4A' },
                ].map(({ label, value, icon: Icon, accent, color }) => (
                  <div key={label} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 16, padding: '16px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
                  }}>
                    {Icon && (
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                        <Icon />
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
                      <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: color || C.text }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Productos más vendidos */}
            {!loading && resumenDia?.productos_mas_vendidos?.length > 0 && (
              <div className="fade-in" style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, overflow: 'hidden', overflowX: 'auto', marginBottom: 24,
                boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
              }}>
                <div style={{ minWidth: 360 }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>Más vendidos hoy</h2>
                </div>
                {resumenDia.productos_mas_vendidos.map((p, i) => (
                  <div key={p.producto_id} style={{
                    padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: i < resumenDia.productos_mas_vendidos.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}>
                    <span style={{ fontSize: 13, color: C.text }}>{p.nombre}</span>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.subtext }}>x{p.cantidad}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#B6CD38' }}>{fmt(p.total)}</span>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Resumen del período */}
            {!loading && resumenPeriodo && (
              <div className="fade-in" style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: '20px 24px',
                boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
              }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: C.text }}>
                  Período: {fmtDT(resumenPeriodo.desde)} — {fmtDT(resumenPeriodo.hasta)}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
                  {[
                    { label: 'Total ventas', value: fmt(resumenPeriodo.total_ventas), color: '#B6CD38' },
                    { label: 'Núm. ventas', value: resumenPeriodo.num_ventas, color: '#8A6A4A' },
                    { label: 'Gastos', value: fmt(resumenPeriodo.total_gastos), color: '#E72D8B' },
                    { label: 'Cortesías', value: fmt(resumenPeriodo.total_cortesias), color: '#E72D8B' },
                    { label: 'Utilidad', value: fmt(resumenPeriodo.utilidad), color: resumenPeriodo.utilidad >= 0 ? '#B6CD38' : '#E72D8B' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 11, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>{label}</p>
                      <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700, color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: 40, color: C.subtext }}>Cargando...</div>
            )}
          </>
        )}

        {/* Tab: Gastos */}
        {tab === 'gastos' && (
          <>
            <div className="fade-in finanzas-filter" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Desde</span>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', background: C.card, color: C.text, border: `1px solid ${C.border}`,
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>Hasta</span>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                  fontFamily: 'inherit', background: C.card, color: C.text, border: `1px solid ${C.border}`,
                }} />
              </div>
              <button onClick={fetchData} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card, color: C.subtext,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <IcRefresh /> Actualizar
              </button>
              <button onClick={() => { setModalGasto(true); setError('') }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #E72D8B 0%, #c0206e 100%)',
                border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px -4px rgba(231,45,139,0.45)',
              }}>
                <IcPlus /> Nuevo gasto
              </button>
            </div>

            {!loading && (
              <div className="fade-in" style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, overflow: 'hidden', overflowX: 'auto',
                boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
              }}>
                <div style={{ minWidth: 520 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 1fr 120px 40px',
                  padding: '10px 20px', borderBottom: `1px solid ${C.border}`,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(29,84,125,0.03)',
                }}>
                  {['Concepto', 'Monto', 'Tipo', 'Fecha', ''].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
                  ))}
                </div>
                {gastos.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>Sin gastos registrados</div>
                ) : (
                  gastos.map((g, i) => (
                    <div key={g.id} style={{
                      display: 'grid', gridTemplateColumns: '1fr 100px 1fr 120px 40px',
                      padding: '12px 20px', alignItems: 'center',
                      borderBottom: i < gastos.length - 1 ? `1px solid ${C.border}` : 'none',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.hover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <span style={{ fontSize: 13, color: C.text }}>{g.descripcion || g.tipo}</span>
                        {g.observaciones && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.subtext }}>{g.observaciones}</p>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#E72D8B' }}>{fmt(g.monto)}</span>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(138,106,74,0.12)', color: '#8A6A4A', width: 'fit-content', fontWeight: 600 }}>
                        {g.tipo}
                      </span>
                      <span style={{ fontSize: 12, color: C.subtext }}>{fmtDT(g.fecha)}</span>
                      <button onClick={() => handleDeleteGasto(g.id)} style={{
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
                  ))
                )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab: Caja */}
        {tab === 'caja' && (
          <>
            <div className="fade-in" style={{ marginBottom: 16 }}>
              <button onClick={() => { setModalCerrarCaja(true); setError(''); setNotasCierre(''); setTipoCierre('COMPLETO') }} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
                border: 'none', color: 'white', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px -4px rgba(0,117,63,0.45)',
              }}>
                <IcLock /> Cerrar caja
              </button>
            </div>

            {!loading && (
              <div className="fade-in" style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 16, overflow: 'hidden', overflowX: 'auto',
                boxShadow: isDark ? '0 4px 20px -4px rgba(0,0,0,0.4)' : '0 4px 16px -4px rgba(29,84,125,0.08)',
              }}>
                <div style={{ minWidth: 860 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '130px 80px 90px 90px 90px 80px 80px 1fr 50px 100px',
                  padding: '10px 20px', borderBottom: `1px solid ${C.border}`,
                  background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(29,84,125,0.03)',
                }}>
                  {['Fecha', 'Tipo', 'Ventas', 'Efectivo', 'Tarjeta', 'Cortesias', 'Gastos', 'Notas', 'PDF', 'Usuario'].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 600, color: C.subtext, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</span>
                  ))}
                </div>
                {cierres.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: C.subtext, fontSize: 13 }}>Sin cierres de caja registrados</div>
                ) : (
                  cierres.map((c, i) => (
                    <div key={c.id} style={{
                      display: 'grid', gridTemplateColumns: '130px 80px 90px 90px 90px 80px 80px 1fr 50px 100px',
                      padding: '12px 20px', alignItems: 'center',
                      borderBottom: i < cierres.length - 1 ? `1px solid ${C.border}` : 'none',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.hover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontSize: 11, color: C.text }}>{fmtFull(c.fecha_cierre)}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                        background: c.tipo === 'PARCIAL' ? 'rgba(245,158,11,0.12)' : 'rgba(0,117,63,0.10)',
                        color: c.tipo === 'PARCIAL' ? '#f59e0b' : '#00753F',
                        width: 'fit-content',
                      }}>{c.tipo === 'PARCIAL' ? 'Parcial' : 'Completo'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#B6CD38' }}>{fmt(c.total_ventas)}</span>
                      <span style={{ fontSize: 12, color: C.text }}>{fmt(c.total_efectivo)}</span>
                      <span style={{ fontSize: 12, color: C.text }}>{fmt(c.total_tarjeta)}</span>
                      <span style={{ fontSize: 12, color: '#E72D8B' }}>{fmt(c.total_cortesias)}</span>
                      <span style={{ fontSize: 12, color: '#E72D8B' }}>{fmt(c.total_gastos)}</span>
                      <span style={{ fontSize: 10, color: C.subtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={c.notas || ''}>{c.notas || '-'}</span>
                      <span style={{ display: 'flex', justifyContent: 'center' }}>
                        {c.pdf_generado ? (
                          <button onClick={() => openPDF(c.id)} title="Ver PDF" style={{
                            padding: '5px', borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: 'rgba(231,45,139,0.10)', color: '#E72D8B',
                            display: 'flex', transition: 'background .15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,45,139,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,45,139,0.10)'}
                          ><IcPDF /></button>
                        ) : <span style={{ fontSize: 10, color: C.subtext }}>—</span>}
                      </span>
                      <span style={{ fontSize: 11, color: C.subtext }}>{c.usuario_nombre}</span>
                    </div>
                  ))
                )}
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: C.subtext }}>Cargando...</div>
        )}
      </div>

      {/* Modal - Crear gasto */}
      <Modal open={modalGasto} onClose={() => setModalGasto(false)} title="Nuevo gasto" isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Tipo">
            <select className="finanzas-select" value={formGasto.tipo} onChange={e => setFormGasto(f => ({ ...f, tipo: e.target.value }))} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', width: '100%',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f0f6f9',
              color: isDark ? '#F1F6F6' : '#0C0F14',
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              cursor: 'pointer',
            }}>
              {TIPOS_GASTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Monto *">
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={formGasto.monto} onChange={e => setFormGasto(f => ({ ...f, monto: e.target.value }))} style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', width: '100%',
                background: C.inputBg, color: C.text,
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              }} />
            </Field>
            <Field label="Fecha">
              <input type="date" value={formGasto.fecha} onChange={e => setFormGasto(f => ({ ...f, fecha: e.target.value }))} style={{
                padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
                fontFamily: 'inherit', width: '100%',
                background: C.inputBg, color: C.text,
                border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              }} />
            </Field>
          </div>

          <Field label="Descripción">
            <input placeholder="Ej: Pago de luz" value={formGasto.descripcion} onChange={e => setFormGasto(f => ({ ...f, descripcion: e.target.value }))} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', width: '100%',
              background: C.inputBg, color: C.text,
              border: `1.5px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
            }} />
          </Field>

          <Field label="Observaciones">
            <textarea placeholder="Notas adicionales..." value={formGasto.observaciones} onChange={e => setFormGasto(f => ({ ...f, observaciones: e.target.value }))} rows={2} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', resize: 'vertical',
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
            <button onClick={() => setModalGasto(false)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={handleCreateGasto} disabled={savingGasto} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #E72D8B 0%, #c0206e 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: savingGasto ? .7 : 1,
              boxShadow: '0 4px 12px -4px rgba(231,45,139,0.4)',
            }}>
              {savingGasto ? 'Guardando...' : 'Registrar gasto'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal - Cerrar caja */}
      <Modal open={modalCerrarCaja} onClose={() => setModalCerrarCaja(false)} title="Cerrar caja" isDark={isDark}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: C.subtext }}>
            Esto consolidara todas las ventas y gastos del dia actual en un cierre.
          </p>

          <Field label="Tipo de corte">
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'COMPLETO', label: 'Corte completo' },
                { key: 'PARCIAL', label: 'Corte parcial' },
              ].map(t => (
                <button key={t.key} onClick={() => setTipoCierre(t.key)} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${tipoCierre === t.key ? '#B6CD38' : (isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)')}`,
                  background: tipoCierre === t.key ? (isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)') : 'transparent',
                  color: tipoCierre === t.key ? '#B6CD38' : C.subtext,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                }}>{t.label}</button>
              ))}
            </div>
          </Field>

          <Field label="Notas (opcional)">
            <textarea placeholder="Notas del cierre..." value={notasCierre} onChange={e => setNotasCierre(e.target.value)} rows={2} style={{
              padding: '9px 12px', borderRadius: 10, fontSize: 13, outline: 'none',
              fontFamily: 'inherit', resize: 'vertical',
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
            <button onClick={() => setModalCerrarCaja(false)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${isDark ? 'rgba(35,122,170,0.3)' : 'rgba(29,84,125,0.2)'}`,
              background: 'transparent', color: isDark ? '#237AAA' : '#1D547D',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancelar
            </button>
            <button onClick={handleCerrarCaja} disabled={cerrando} style={{
              flex: 2, padding: '10px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)',
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', opacity: cerrando ? .7 : 1,
              boxShadow: '0 4px 12px -4px rgba(0,117,63,0.4)',
            }}>
              {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
