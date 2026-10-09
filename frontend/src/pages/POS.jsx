import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import client from '@/api/client'
import { isSessionExpiredError, registerSessionSnapshot } from '@/session'
import { clearPosDraft, loadPosDraft, savePosDraft } from '@/posDraft'

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
  } catch { /* empty */ }
  return null
}

function orderKey(nombre) {
  const n = nombre.toLowerCase()
  if (n.includes('agua')) return 0
  if (n.includes('temporada') || n.includes('light')) return 1
  if (n.includes('leche')) return 2
  if (n.includes('helado')) return 3
  return 4
}

export default function POS() {
  const { token, user }   = useAuth()
  const { theme }         = useTheme()
  const isDark            = theme === 'dark'
  const searchRef         = useRef(null)
  const [isTouch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0))

  const [productos,    setProductos]    = useState([])
  const [busqueda,     setBusqueda]     = useState('')
  const [cuentas,      setCuentas]      = useState([
    { id: 'cuenta-1', nombre: 'Cuenta 1', items: [], metodo: 'EFECTIVO', montoRecibido: '' },
  ])
  const [cuentaActivaId, setCuentaActivaId] = useState('cuenta-1')
  const [creandoCuenta, setCreandoCuenta] = useState(false)
  const [nombreNueva,  setNombreNueva]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [loadingProds, setLoadingProds] = useState(true)
  const [ventaExitosa, setVentaExitosa] = useState(null)
  const [error,        setError]        = useState('')
  const [presentPanel, setPresentPanel] = useState(null)
  const [previewCortesia, setPreviewCortesia] = useState(null)
  const [forzarEnvio, setForzarEnvio] = useState(false)
  const [draftAviso, setDraftAviso] = useState('')
  const draftRestaurado = useRef(false)

  const enviarACaja = forzarEnvio

  const cuentaActiva = cuentas.find(c => c.id === cuentaActivaId) ?? cuentas[0]
  const ticket = cuentaActiva?.items ?? []
  const metodo = cuentaActiva?.metodo ?? 'EFECTIVO'
  const montoRecibido = cuentaActiva?.montoRecibido ?? ''

  const actualizarCuentaActiva = (parche) => {
    setCuentas(prev => prev.map(c => c.id === cuentaActivaId
      ? { ...c, ...(typeof parche === 'function' ? parche(c) : parche) }
      : c))
  }
  const actualizarItemsCuentaActiva = (fn) => {
    actualizarCuentaActiva(c => ({ items: fn(c.items) }))
  }
  const totalCuenta = (c) => (c?.items ?? []).reduce((s, i) =>
    i.esCortesia ? s : s + (i.presentacion?.precio || i.producto.precio) * i.cantidad, 0)
  const unidadesEnCuentas = (productoId) => cuentas
    .flatMap(c => c.items)
    .filter(i => i.producto.id === productoId)
    .reduce((s, i) => s + i.cantidad, 0)

  const crearCuenta = () => {
    const nombre = (nombreNueva.trim() || `Cuenta ${cuentas.length + 1}`).slice(0, 30)
    const id = `cuenta-${Date.now()}`
    setCuentas(prev => [...prev, { id, nombre, items: [], metodo: 'EFECTIVO', montoRecibido: '' }])
    setCuentaActivaId(id)
    setNombreNueva('')
    setCreandoCuenta(false)
    if (!isTouch) searchRef.current?.focus()
  }

  const [cuentaPorCerrar, setCuentaPorCerrar] = useState(null)

  const cerrarCuenta = (id) => {
    const c = cuentas.find(x => x.id === id)
    if (!c) return
    if (c.items.length > 0) {
      setCuentaPorCerrar(c)
      return
    }
    confirmarCierreCuenta(id)
  }

  const confirmarCierreCuenta = (id) => {
    const objetivo = id ?? cuentaPorCerrar?.id
    const c = cuentas.find(x => x.id === objetivo)
    if (!c) {
      setCuentaPorCerrar(null)
      return
    }
    let rest = cuentas.filter(x => x.id !== c.id)
    if (rest.length === 0) {
      rest = [{ id: `cuenta-${Date.now()}`, nombre: 'Cuenta 1', items: [], metodo: 'EFECTIVO', montoRecibido: '' }]
    }
    const idx = cuentas.findIndex(x => x.id === c.id)
    setCuentas(rest)
    if (cuentaActivaId === c.id || !rest.some(x => x.id === cuentaActivaId)) {
      setCuentaActivaId(rest[Math.min(idx, rest.length - 1)].id)
    }
    setCuentaPorCerrar(null)
    if (!isTouch) searchRef.current?.focus()
  }

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
    let cancelled = false
    client.get('/inventario/productos', { params: { activos: true, tipo: 'VENTA' } })
      .then(({ data }) => {
        if (cancelled) return
        const sorted = (data.data ?? [])
        const expanded = []
        sorted.forEach(p => {
          const pres = parsePresentaciones(p.presentaciones)
          const esPaleta = p.nombre.toLowerCase().includes('paleta')
          if (pres && esPaleta) {
            pres.forEach(pr => {
              expanded.push({
                ...p,
                _virtual: true,
                _nombre: `${p.nombre} de ${pr.etiqueta.toLowerCase()}`,
                _precio: pr.precio || p.precio,
                _presentacion: pr,
                _color: pr.etiqueta.toLowerCase().charCodeAt(0) * 13 % 360,
                imagen: pr.imagen || null,
              })
            })
          } else {
            expanded.push(p)
          }
        })
        expanded.sort((a, b) => {
          const ka = orderKey(a._nombre || a.nombre)
          const kb = orderKey(b._nombre || b.nombre)
          if (ka !== kb) return ka - kb
          return (a._nombre || a.nombre).localeCompare(b._nombre || b.nombre)
        })
        setProductos(expanded)
      })
      .catch((e) => {
        if (cancelled || isSessionExpiredError(e)) return
        setError('Error al cargar productos')
      })
      .finally(() => { if (!cancelled) setLoadingProds(false) })
    return () => { cancelled = true }
  }, [token])

  useEffect(() => registerSessionSnapshot(() => {
    if (ventaExitosa) return
    savePosDraft({ cuentas, cuentaActivaId, user })
  }), [cuentas, cuentaActivaId, user, ventaExitosa])

  useEffect(() => {
    if (!user?.id || ventaExitosa || !draftRestaurado.current) return
    savePosDraft({ cuentas, cuentaActivaId, user })
  }, [cuentas, cuentaActivaId, user, ventaExitosa])

  useEffect(() => {
    if (draftRestaurado.current || ventaExitosa) return
    if (productos.length === 0 || !user?.id) return
    if (cuentas.some(c => c.items.length > 0)) {
      draftRestaurado.current = true
      return
    }
    const draft = loadPosDraft()
    if (!draft) {
      draftRestaurado.current = true
      return
    }
    if ((draft.userId && draft.userId !== user.id) || (draft.sucursalId && draft.sucursalId !== user.sucursal_id)) {
      draftRestaurado.current = true
      return
    }
    const usados = {}
    const restauradas = []
    let omitidos = 0
    for (const dc of draft.cuentas) {
      const items = []
      for (const it of dc.items) {
        const prod = productos.find(p => p.id === it.producto_id)
        if (!prod || prod.stock_actual <= 0) { omitidos += 1; continue }
        const presentacion = it.presentacion ? {
          etiqueta: it.presentacion.etiqueta,
          precio: it.presentacion.precio,
          factor: it.presentacion.factor,
        } : null
        const factor = presentacion?.factor || 1
        const usado = usados[it.producto_id] || 0
        const disponible = Math.max(0, prod.stock_actual - usado)
        const maxUnidades = Math.floor((disponible + 1e-9) / factor)
        const cantidad = Math.min(it.cantidad, maxUnidades)
        if (!Number.isFinite(cantidad) || cantidad <= 0) { omitidos += 1; continue }
        usados[it.producto_id] = usado + cantidad * factor
        items.push({ producto: prod, cantidad, presentacion, esCortesia: !!it.esCortesia })
      }
      restauradas.push({
        id: dc.id,
        nombre: dc.nombre,
        items,
        metodo: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'].includes(dc.metodo) ? dc.metodo : 'EFECTIVO',
        montoRecibido: typeof dc.montoRecibido === 'string' ? dc.montoRecibido : '',
      })
    }
    draftRestaurado.current = true
    const conItems = restauradas.filter(c => c.items.length > 0)
    if (conItems.length > 0) {
      setCuentas(conItems)
      if (conItems.some(c => c.id === draft.cuentaActivaId)) {
        setCuentaActivaId(draft.cuentaActivaId)
      } else {
        setCuentaActivaId(conItems[0].id)
      }
      setDraftAviso(omitidos > 0
        ? 'Se recuperaron cuentas pendientes (algunas líneas ya no tenían stock).'
        : 'Se recuperaron cuentas pendientes.')
    } else {
      clearPosDraft()
    }
  }, [productos, user, cuentas, ventaExitosa])

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const handleClickProducto = (producto) => {
    if (producto.stock_actual <= 0) return
    const enTicket = unidadesEnCuentas(producto.id)
    if (enTicket >= producto.stock_actual) return
    if (producto._virtual) {
      agregarAlTicket(producto, 1, producto._presentacion)
      return
    }
    const pres = parsePresentaciones(producto.presentaciones)
    if (pres) { setPresentPanel({ producto, pres }); return }
    agregarAlTicket(producto, 1, null)
  }

  useEffect(() => {
    if (presentPanel) {
      setTimeout(() => {
        const el = document.querySelector('[data-pres-focus]')
        el?.focus()
      }, 50)
    }
  }, [presentPanel])

  const agregarAlTicket = (producto, cantidad, presentacion) => {
    actualizarItemsCuentaActiva(prev => {
      const key = presentacion ? `${producto.id}_${presentacion.etiqueta}` : producto.id
      const existe = prev.find(i => {
        const ik = i.presentacion ? `${i.producto.id}_${i.presentacion.etiqueta}` : i.producto.id
        return ik === key && !i.esCortesia
      })
      if (existe) {
        return prev.map(i => {
          const ik = i.presentacion ? `${i.producto.id}_${i.presentacion.etiqueta}` : i.producto.id
          return ik === key && !i.esCortesia ? { ...i, cantidad: i.cantidad + cantidad } : i
        })
      }
      return [...prev, { producto, cantidad, presentacion: presentacion || null, esCortesia: false }]
    })
    setPresentPanel(null)
    if (!isTouch) searchRef.current?.focus()
  }

  const toggleCortesiaItem = (itemIdx) => {
    actualizarItemsCuentaActiva(prev => {
      const item = prev[itemIdx]
      if (!item) return prev
      if (item.cantidad > 1) {
        const before = prev.slice(0, itemIdx)
        const after = prev.slice(itemIdx + 1)
        return [
          ...before,
          { ...item, cantidad: 1, esCortesia: !item.esCortesia },
          { ...item, cantidad: item.cantidad - 1, esCortesia: item.esCortesia },
          ...after,
        ]
      }
      const newTicket = [...prev]
      newTicket[itemIdx] = { ...item, esCortesia: !item.esCortesia }
      return newTicket
    })
  }

  const cambiarCantidad = (itemIdx, delta) => {
    actualizarItemsCuentaActiva(prev => {
      const newTicket = [...prev]
      if (!newTicket[itemIdx]) return prev
      newTicket[itemIdx] = { ...newTicket[itemIdx], cantidad: newTicket[itemIdx].cantidad + delta }
      return newTicket.filter(i => i.cantidad > 0)
    })
  }

  const quitarItem = (itemIdx) => actualizarItemsCuentaActiva(prev => prev.filter((_, i) => i !== itemIdx))

  const limpiarTicket = () => {
    actualizarCuentaActiva({ items: [], metodo: 'EFECTIVO', montoRecibido: '' })
    setError('')
    setPreviewCortesia(null)
    setDraftAviso('')
    if (!isTouch) searchRef.current?.focus()
  }

  const subtotal = ticket.reduce((s, i) => {
    if (i.esCortesia) return s
    const precio = i.presentacion?.precio || i.producto.precio
    return s + precio * i.cantidad
  }, 0)
  const total  = subtotal
  const cambio = metodo === 'EFECTIVO' && montoRecibido
    ? Math.max(0, parseFloat(montoRecibido) - total)
    : 0

  const puedeConfirmar = ticket.length > 0 &&
    (enviarACaja || metodo !== 'EFECTIVO' || !montoRecibido || parseFloat(montoRecibido) >= total)

  useEffect(() => {
    if (subtotal <= 0) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const { data } = await client.get('/cortesias/preview', { params: { monto: subtotal } })
        if (!cancelled) setPreviewCortesia(data?.data ?? null)
      } catch (e) {
        if (cancelled || isSessionExpiredError(e)) return
        setPreviewCortesia(null)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [subtotal, token])

  const confirmarVenta = async () => {
    if (!puedeConfirmar) return
    setLoading(true)
    setError('')
    try {
      const body = {
        detalle: ticket.map(i => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          precio_unitario: i.presentacion?.precio || i.producto.precio,
          factor_consumo: i.presentacion?.factor || 1,
          es_cortesia: i.esCortesia || false,
        })),
        pago: enviarACaja
          ? { metodo: 'EFECTIVO', monto_recibido: 0 }
          : { metodo, monto_recibido: metodo === 'EFECTIVO' ? parseFloat(montoRecibido || total) : 0 },
        ...(enviarACaja && { abierta: true }),
      }

      const { data } = await client.post('/ventas', body)

      setVentaExitosa({ ...data.data, cambio, enviadoACaja: enviarACaja })

      const idxCobrada = cuentas.findIndex(c => c.id === cuentaActivaId)
      let restantes = cuentas.filter(c => c.id !== cuentaActivaId)
      if (restantes.length === 0) {
        restantes = [{ id: `cuenta-${Date.now()}`, nombre: 'Cuenta 1', items: [], metodo: 'EFECTIVO', montoRecibido: '' }]
      }
      setCuentas(restantes)
      setCuentaActivaId(restantes[Math.min(Math.max(idxCobrada, 0), restantes.length - 1)].id)

      if (!enviarACaja) {
        setProductos(prev => prev.map(p => {
          const item = ticket.find(i => i.producto.id === p.id)
          if (!item) return p
          const descuento = item.cantidad * (item.presentacion?.factor || 1)
          return { ...p, stock_actual: p.stock_actual - descuento }
        }))

        try {
          await client.post('/printer/ticket', {
            NombreTienda: 'La Pale',
            Folio: `#${data.data.ticket_numero}`,
            Fecha: new Date().toLocaleDateString('es-MX'),
            Vendedor: user?.nombre || '',
            Items: ticket.map(i => ({
              Nombre: i.producto.nombre + (i.esCortesia ? ' (Cortesia)' : ''),
              Cantidad: i.cantidad,
              Precio: i.esCortesia ? 0 : (i.presentacion?.precio || i.producto.precio),
              Subtotal: i.esCortesia ? 0 : (i.presentacion?.precio || i.producto.precio) * i.cantidad,
            })),
            Subtotal: subtotal,
            Descuento: 0,
            Total: total,
            MetodoPago: metodo,
            Efectivo: metodo === 'EFECTIVO' ? parseFloat(montoRecibido || total) : total,
            Cambio: cambio,
          })
        } catch (printErr) {
          if (!isSessionExpiredError(printErr)) {
            console.warn('Error al imprimir:', printErr)
          }
        }
      }
    } catch (e) {
      if (isSessionExpiredError(e)) return
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  if (ventaExitosa) {
    return (
      <TicketModal
        venta={ventaExitosa}
        C={C}
        onNuevaVenta={() => { setVentaExitosa(null) }}
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', position: 'relative' }}>
          <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.subtext, pointerEvents: 'none' }}><IcSearch /></span>
              <input ref={searchRef} autoFocus={!isTouch} value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto o SKU..."
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {user?.rol === 'administrador' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <button disabled onClick={() => setForzarEnvio(f => !f)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${forzarEnvio ? '#f59e0b' : C.border}`, background: forzarEnvio ? 'rgba(245,158,11,0.12)' : 'transparent', color: forzarEnvio ? '#f59e0b' : C.subtext, fontSize: 11, cursor: 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .15s', opacity: 0.5 }}>
                  Envio a caja (deshabilitado)
                </button>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {loadingProds ? (
              <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Cargando productos...</div>
            ) : productosFiltrados.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', paddingTop: 40 }}>{busqueda ? 'Sin resultados para tu búsqueda' : 'No hay productos disponibles'}</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {productosFiltrados.map(p => (
                  <ProductoCard key={p._virtual ? `${p.id}_${p._presentacion.etiqueta}` : p.id} producto={p} isDark={isDark} C={C} enTicket={p._virtual ? ticket.filter(i => i.producto.id === p.id && i.presentacion?.etiqueta === p._presentacion?.etiqueta).reduce((s, i) => s + i.cantidad, 0) : ticket.filter(i => i.producto.id === p.id).reduce((s, i) => s + i.cantidad, 0)} onClick={() => handleClickProducto(p)} />
                ))}
              </div>
            )}
          </div>

          {presentPanel && (
            <div className="fade-in" onClick={() => setPresentPanel(null)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="pop-in" onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}`, minWidth: 300, maxWidth: 420, boxShadow: isDark ? '0 20px 60px -8px rgba(0,0,0,0.8)' : '0 20px 60px -8px rgba(29,84,125,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{presentPanel.producto.nombre}</span>
                  <button onClick={() => setPresentPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.subtext, padding: 4 }}><IcX /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {presentPanel.pres.map((pr, i) => (
                    <button key={i} {...(i === 0 ? { 'data-pres-focus': true } : {})} onClick={() => agregarAlTicket(presentPanel.producto, 1, pr)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, cursor: 'pointer', fontFamily: 'inherit', width: '100%', transition: 'all .15s', textAlign: 'left', outline: 'none' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.background = isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.05)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.inputBg }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{pr.etiqueta}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.lime }}>{fmt(pr.precio || presentPanel.producto.precio)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {cuentaPorCerrar && (
            <div className="fade-in" onClick={() => setCuentaPorCerrar(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div className="pop-in" onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: 16, padding: '20px 24px', border: `1px solid ${C.border}`, width: '100%', maxWidth: 340, boxShadow: isDark ? '0 20px 60px -8px rgba(0,0,0,0.8)' : '0 20px 60px -8px rgba(29,84,125,0.2)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.text }}>Cerrar cuenta</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: C.subtext }}>
                  ¿Cerrar <strong style={{ color: C.text }}>“{cuentaPorCerrar.nombre}”</strong>? Se perderán sus {cuentaPorCerrar.items.reduce((s, i) => s + i.cantidad, 0)} artículo(s).
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setCuentaPorCerrar(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.subtext, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Volver
                  </button>
                  <button onClick={() => confirmarCierreCuenta()} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #E72D8B 0%, #c0206e 100%)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 360, display: 'flex', flexDirection: 'column', background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
            {cuentas.map(c => {
              const activa = c.id === cuentaActivaId
              const n = c.items.reduce((s, i) => s + i.cantidad, 0)
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, borderRadius: 8, border: `1px solid ${activa ? C.lime : C.border}`, background: activa ? (isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)') : 'transparent' }}>
                  <button onClick={() => setCuentaActivaId(c.id)} title={c.nombre} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px 6px 10px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, maxWidth: 130 }}>
                    <span style={{ fontSize: 12, fontWeight: activa ? 700 : 500, color: activa ? C.lime : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</span>
                    {n > 0 && <span style={{ background: activa ? C.lime : C.subtext, color: activa ? '#0C0F14' : C.surface, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '0 6px' }}>{n}</span>}
                  </button>
                  {cuentas.length > 1 && (
                    <button onClick={() => cerrarCuenta(c.id)} title={`Cerrar ${c.nombre}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '6px 8px 6px 2px', fontSize: 12, fontFamily: 'inherit' }}>×</button>
                  )}
                </div>
              )
            })}
            {creandoCuenta ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                <input autoFocus value={nombreNueva} onChange={e => setNombreNueva(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') crearCuenta(); if (e.key === 'Escape') { setCreandoCuenta(false); setNombreNueva('') } }} placeholder="Nombre" maxLength={30}
                  style={{ width: 110, padding: '6px 8px', borderRadius: 8, border: `1px solid ${C.lime}`, background: C.inputBg, color: C.text, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={crearCuenta} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)', color: '#0C0F14', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
              </div>
            ) : (
              <button onClick={() => { setNombreNueva(''); setCreandoCuenta(true) }} title="Nueva cuenta" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: `1px dashed ${C.border}`, background: 'transparent', color: C.subtext, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                <IcPlus /> Nueva
              </button>
            )}
          </div>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcReceipt />
              <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Ticket</span>
              {ticket.length > 0 && <span style={{ background: C.lime, color: '#0C0F14', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>{ticket.reduce((s, i) => s + i.cantidad, 0)}</span>}
            </div>
            {ticket.length > 0 && <button onClick={limpiarTicket} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: 'rgba(231,45,139,0.08)', color: C.pink, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Limpiar</button>}
          </div>

          {draftAviso && (
            <div style={{ margin: '8px 12px 0', padding: '8px 12px', borderRadius: 8, background: isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.06)', border: '1px solid rgba(182,205,56,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.text }}>{draftAviso}</span>
              <button onClick={() => setDraftAviso('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.subtext, fontSize: 12 }}>✕</button>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
            {ticket.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: C.muted }}>
                <IcReceipt /><span style={{ fontSize: 13 }}>Agrega productos al ticket</span>
              </div>
            ) : (
              ticket.map((item, idx) => {
                const precio = item.presentacion?.precio || item.producto.precio
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px', borderBottom: `1px solid ${C.border}`, opacity: item.esCortesia ? 0.7 : 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: item.esCortesia ? C.pink : C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.producto.nombre}</p>
                      {item.presentacion && <p style={{ margin: 0, fontSize: 11, color: C.subtext }}>{item.presentacion.etiqueta}</p>}
                      <p style={{ margin: 0, fontSize: 12, color: item.esCortesia ? C.pink : C.subtext }}>{item.esCortesia ? 'Cortesia' : fmt(precio) + ' c/u'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => toggleCortesiaItem(idx)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0, background: item.esCortesia ? 'rgba(231,45,139,0.15)' : 'transparent', color: item.esCortesia ? C.pink : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .1s', fontSize: 12 }}><IcGift /></button>
                      <CantidadBtn onClick={() => cambiarCantidad(idx, -1)} C={C}><IcMinus /></CantidadBtn>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, minWidth: 20, textAlign: 'center' }}>{item.cantidad}</span>
                      <CantidadBtn onClick={() => cambiarCantidad(idx, 1)} disabled={unidadesEnCuentas(item.producto.id) >= item.producto.stock_actual} C={C}><IcPlus /></CantidadBtn>
                      <CantidadBtn onClick={() => quitarItem(idx)} C={C} danger><IcTrash /></CantidadBtn>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: item.esCortesia ? C.pink : C.lime, minWidth: 60, textAlign: 'right', flexShrink: 0 }}>{item.esCortesia ? '$0.00' : fmt(precio * item.cantidad)}</span>
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

            {previewCortesia?.aplicable && (
              <div style={{ background: 'rgba(231,45,139,0.08)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(231,45,139,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flexShrink: 0, color: C.pink }}><IcGift /></span>
                <div style={{ lineHeight: 1.3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.pink }}>Cortesía incluida: </span>
                  <span style={{ fontSize: 12, color: C.text }}>+{previewCortesia.cortesia.cantidad} {previewCortesia.cortesia.producto_nombre}</span>
                </div>
              </div>
            )}

            {previewCortesia && !previewCortesia.aplicable && subtotal > 0 && (
              <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '4px 0' }}>La compra no alcanza el monto minimo para cortesia</div>
            )}

            {!enviarACaja && (
              <div style={{ display: 'flex', gap: 6 }}>
                {[{ key: 'EFECTIVO', label: 'Efectivo', icon: <IcCash /> }, { key: 'TARJETA', label: 'Tarjeta', icon: <IcCard /> }, { key: 'TRANSFERENCIA', label: 'Transf.', icon: <IcTransfer /> }].map(m => (
                  <button key={m.key} onClick={() => actualizarCuentaActiva({ metodo: m.key, montoRecibido: '' })} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid ${metodo === m.key ? C.lime : C.border}`, background: metodo === m.key ? (isDark ? 'rgba(182,205,56,0.12)' : 'rgba(0,117,63,0.08)') : 'transparent', color: metodo === m.key ? C.lime : C.subtext, fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit', transition: 'all .15s' }}>{m.icon}{m.label}</button>
                ))}
              </div>
            )}

            {!enviarACaja && metodo === 'EFECTIVO' && (
              <div>
                <input type="number" value={montoRecibido} onChange={e => actualizarCuentaActiva({ montoRecibido: e.target.value })} placeholder={`Monto recibido (min. ${fmt(total)})`} min={total}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${montoRecibido && parseFloat(montoRecibido) < total ? C.pink : C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                {montoRecibido && parseFloat(montoRecibido) >= total && (
                  <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.06)' }}>
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

            <button onClick={confirmarVenta} disabled={!puedeConfirmar || loading} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: puedeConfirmar && !loading ? 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)' : C.border, color: puedeConfirmar && !loading ? '#0C0F14' : C.muted, fontWeight: 700, fontSize: 15, cursor: puedeConfirmar && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all .2s', boxShadow: puedeConfirmar && !loading ? '0 4px 16px -4px rgba(0,117,63,0.4)' : 'none' }}>
              {loading ? 'Procesando...' : enviarACaja ? `Enviar a caja ${fmt(total)}` : `Cobrar ${fmt(total)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function ProductoCard({ producto, isDark, C, enTicket, onClick }) {
  const sinStock = producto.stock_actual <= 0
  const tienePres = !producto._virtual && parsePresentaciones(producto.presentaciones)
  const nombre = producto._virtual ? producto._nombre : producto.nombre
  const precio = producto._virtual ? producto._precio : producto.precio
  const colorHSL = producto._color != null ? producto._color : (producto.nombre?.charCodeAt(0) * 7 || 120)
  const inicial = (nombre || '?')[0].toUpperCase()
  return (
    <button onClick={onClick} disabled={sinStock} style={{ padding: 0, borderRadius: 14, border: `1px solid`, borderColor: enTicket > 0 ? C.lime : C.border, background: enTicket > 0 ? (isDark ? 'rgba(182,205,56,0.08)' : 'rgba(0,117,63,0.05)') : (isDark ? 'rgba(35,122,170,0.05)' : 'rgba(29,84,125,0.02)'), cursor: sinStock ? 'not-allowed' : 'pointer', opacity: sinStock ? 0.45 : 1, textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onMouseEnter={e => { if (!sinStock) e.currentTarget.style.borderColor = C.lime }}
      onMouseLeave={e => { if (enTicket === 0) e.currentTarget.style.borderColor = C.border }}>
      {enTicket > 0 && <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, background: C.lime, color: '#0C0F14', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{enTicket}</span>}
      <div style={{ width: '100%', height: 110, overflow: 'hidden', background: producto.imagen ? 'transparent' : `hsl(${colorHSL}, 30%, ${isDark ? '20%' : '90%'})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {producto.imagen ? <img src={producto.imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 40, fontWeight: 800, color: isDark ? 'rgba(182,205,56,0.5)' : 'rgba(0,117,63,0.3)' }}>{inicial}</span>}
      </div>
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{nombre}</span>
        {producto.sku && <span style={{ fontSize: 10, color: C.muted }}>{producto.sku}</span>}
        {tienePres ? <span style={{ fontSize: 12, fontWeight: 600, color: C.subtext, display: 'flex', alignItems: 'center', gap: 4 }}><IcChevron /> {tienePres.length} presentaciones</span> : <span style={{ fontSize: 15, fontWeight: 700, color: C.lime, marginTop: 2 }}>{fmt(precio)}</span>}
        {(producto.medida && producto.medida !== 'UNIDAD' && !tienePres) && <span style={{ fontSize: 9, color: C.subtext, fontWeight: 500 }}>por {producto.medida.toLowerCase()}</span>}
        <span style={{ fontSize: 10, color: producto.stock_actual <= (producto.stock_minimo || 5) ? '#E72D8B' : C.muted, marginTop: 'auto' }}>{sinStock ? 'Sin stock' : `Stock: ${producto.stock_actual}`}</span>
      </div>
    </button>
  )
}

function CantidadBtn({ onClick, disabled, children, C, danger }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: danger ? '#E72D8B' : C.subtext, opacity: disabled ? 0.4 : 1, padding: 0, transition: 'all .1s', fontFamily: 'inherit' }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(231,45,139,0.1)' : C.inputBg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
      {children}
    </button>
  )
}

function TicketModal({ venta, C, onNuevaVenta }) {
  const [emailCliente, setEmailCliente] = useState('')
  const [enviandoCorreo, setEnviandoCorreo] = useState(false)
  const [estadoEmail, setEstadoEmail] = useState(null)
  const [mensajeEmail, setMensajeEmail] = useState('')
  const [qrDataURL, setQrDataURL] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const doc = new jsPDF()

        const fecha = new Date().toLocaleDateString('es-MX')
        const hora = new Date().toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        })

        const items = venta.detalle || []

        const verde = [0, 117, 63]
        const gris = [245, 245, 245]

        let y = 0

        // HEADER
        doc.setFillColor(...verde)
        doc.rect(0, 0, 210, 34, 'F')

        doc.setTextColor(255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(22)
        doc.text('LA PALE', 105, 16, { align: 'center' })

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.text('Ticket de compra', 105, 24, { align: 'center' })

        y = 48

        // Ticket
        doc.setTextColor(...verde)
        doc.setFontSize(10)
        doc.text('TICKET', 105, y, { align: 'center' })

        y += 8

        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text(`#${venta.ticket_numero}`, 105, y, { align: 'center' })

        y += 12

        // Caja información
        doc.setFillColor(...gris)
        doc.roundedRect(18, y, 174, 22, 3, 3, 'F')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(120)
        doc.text('Método de pago', 26, y + 8)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(40)
        doc.text(venta.metodo || 'EFECTIVO', 26, y + 16)

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(120)
        doc.text(fecha, 145, y + 8)
        doc.text(hora, 145, y + 16)

        y += 34

        // Encabezado tabla
        doc.setFillColor(...verde)
        doc.rect(18, y, 174, 9, 'F')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(255)

        doc.text('Producto', 22, y + 6)
        doc.text('Cant', 120, y + 6, { align: 'center' })
        doc.text('Precio', 150, y + 6, { align: 'right' })
        doc.text('Subtotal', 188, y + 6, { align: 'right' })

        y += 9

        // Productos
        items.forEach((item) => {

          doc.setDrawColor(235)
          doc.line(18, y, 192, y)

          y += 7

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(40)

          doc.text(item.producto_nombre, 22, y)

          doc.text(String(item.cantidad), 120, y, {
            align: 'center'
          })

          doc.text(fmt(item.precio_unitario), 150, y, {
            align: 'right'
          })

          doc.setFont('helvetica', 'bold')

          doc.text(fmt(item.subtotal), 188, y, {
            align: 'right'
          })

          y += 4
        })

        doc.setDrawColor(...verde)
        doc.line(18, y + 2, 192, y + 2)

        y += 16

        // Total

        doc.setFillColor(245,250,245)
        doc.roundedRect(18, y-8, 174, 14, 3,3,'F')

        doc.setFont('helvetica','bold')
        doc.setFontSize(15)

        doc.setTextColor(0)

        doc.text('TOTAL',24,y)

        doc.setTextColor(...verde)

        doc.text(fmt(venta.total),188,y,{
          align:'right'
        })

        y += 22

        // Cambio

        if(venta.cambio>0){

            doc.setFontSize(10)
            doc.setTextColor(100)

            doc.setFont('helvetica','normal')

            doc.text('Cambio',24,y)

            doc.text(fmt(venta.cambio),188,y,{
              align:'right'
            })

            y+=12
        }

        // Footer

        doc.setDrawColor(220)
        doc.line(25,y,185,y)

        y+=10

        doc.setTextColor(...verde)
        doc.setFont('helvetica','bold')
        doc.setFontSize(11)

        doc.text('LA PALE',105,y,{
          align:'center'
        })

        y+=6

        doc.setFont('helvetica','normal')
        doc.setTextColor(120)
        doc.setFontSize(8)

        doc.text('C. Ignacio Pérez 87 Norte',105,y,{
          align:'center'
        })

        y+=4

        doc.text('Centro, San Luis Potosí',105,y,{
          align:'center'
        })

        y+=4

        doc.text('Gracias por tu compra',105,y,{
          align:'center'
        })
        const blob = doc.output('blob')
        const formData = new FormData()
        formData.append('pdf', blob, 'ticket.pdf')

        const { data } = await client.post('/tickets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (cancelled) return

        const url = window.location.origin + data.data.url
        const qr = await QRCode.toDataURL(url, { width: 160, margin: 1 })
        if (!cancelled) setQrDataURL(qr)
      } catch (e) {
        console.warn('Error generando QR:', e)
      }
    })()
    return () => { cancelled = true }
  }, [venta])

  const enviarTicketEmail = async () => {
    if (!emailCliente.trim()) return
    setEnviandoCorreo(true)
    setEstadoEmail(null)
    try {
      await client.post('/email/ticket', {
        email: emailCliente.trim(),
        ticket_numero: venta.ticket_numero,
        total: venta.total,
        metodo: venta.metodo || 'EFECTIVO',
        items: venta.detalle?.map(d => ({
          nombre: d.producto_nombre + (d.es_cortesia ? ' (Cortesia)' : ''),
          cantidad: d.cantidad,
          precio: d.precio_unitario,
        })) || [],
      })
      setEstadoEmail('ok')
      setMensajeEmail('Ticket enviado con exito')
    } catch (e) {
      if (isSessionExpiredError(e)) return
      setEstadoEmail('error')
      setMensajeEmail(e.response?.data?.message || e.message || 'Error al enviar')
    } finally {
      setEnviandoCorreo(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 112px)' }}>
      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: '40px 36px', maxWidth: 440, width: '100%', textAlign: 'center', fontFamily: "'Inter', sans-serif", overflowY: 'auto', maxHeight: '90vh' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px', background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px -4px rgba(0,117,63,0.4)' }}>
          <IcCheck />
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.text }}>{venta.enviadoACaja ? 'Cuenta enviada' : 'Venta confirmada'}</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: C.subtext }}>Ticket #{venta.ticket_numero}{venta.enviadoACaja && ' — Pendiente de cobro en caja'}</p>

        {venta.cortesia_aplicada && (
          <div style={{ background: 'rgba(231,45,139,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: `1px solid rgba(231,45,139,0.2)`, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <span style={{ flexShrink: 0 }}><IcGift /></span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.pink }}>Cortesía aplicada</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: C.text }}>+{venta.cortesia_aplicada.cantidad} {venta.cortesia_aplicada.producto_nombre}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: C.subtext }}>Regla: {venta.cortesia_aplicada.regla_nombre}</p>
            </div>
          </div>
        )}

        <div style={{ background: C.surface2, borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
          {venta.detalle?.map(d => (
            <div key={d.id || d.producto_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: d.es_cortesia ? C.pink : C.text, padding: '4px 0', borderBottom: `1px solid ${C.border}`, opacity: d.es_cortesia ? 0.8 : 1 }}>
              <span>{d.producto_nombre} x {d.cantidad}</span>
              <span style={{ fontWeight: 600 }}>{d.es_cortesia ? 'Gratis' : fmt(d.subtotal)}</span>
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

        {qrDataURL && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', background: '#fff', borderRadius: 12, border: `2px solid ${C.border}`, padding: '16px 20px 12px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#00753F', letterSpacing: '.05em' }}>LA PALE</p>
              <p style={{ margin: '0 0 2px', fontSize: 10, color: '#666' }}>Ticket #{venta.ticket_numero}</p>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#333' }}>{fmt(venta.total)}</p>
              <img src={qrDataURL} alt="QR Ticket" style={{ width: 120, height: 120, display: 'block' }} />
              <p style={{ margin: '8px 0 0', fontSize: 9, color: '#999' }}>Escanea para ver tu ticket</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16, textAlign: 'left' }}>
          <input type="email" value={emailCliente} onChange={e => { setEmailCliente(e.target.value); setEstadoEmail(null) }} placeholder="Correo del cliente (opcional)"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 8 }} />
          <button onClick={enviarTicketEmail} disabled={enviandoCorreo || !emailCliente.trim()}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: enviandoCorreo || !emailCliente.trim() ? C.border : '#237AAA', color: enviandoCorreo || !emailCliente.trim() ? C.muted : '#fff', fontWeight: 600, fontSize: 13, cursor: enviandoCorreo || !emailCliente.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
            {enviandoCorreo ? 'Enviando...' : 'Enviar ticket por correo'}
          </button>
          {estadoEmail === 'ok' && <p style={{ margin: '6px 0 0', fontSize: 11, color: '#00753F', textAlign: 'center' }}>{mensajeEmail}</p>}
          {estadoEmail === 'error' && <p style={{ margin: '6px 0 0', fontSize: 11, color: C.pink, textAlign: 'center' }}>{mensajeEmail}</p>}
        </div>

        <button onClick={onNuevaVenta} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #B6CD38 0%, #00753F 100%)', color: '#0C0F14', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px -4px rgba(0,117,63,0.4)' }}>Nueva venta</button>
      </div>
    </div>
  )
}