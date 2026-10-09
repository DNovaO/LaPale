const DRAFT_KEY = 'pos_draft_v1'
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000
const METODOS_VALIDOS = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']

function sanitizePresentacion(p) {
  if (!p || typeof p !== 'object') return null
  const etiqueta = typeof p.etiqueta === 'string' ? p.etiqueta : ''
  const precio = Number(p.precio)
  const factor = Number(p.factor)
  if (!etiqueta) return null
  return {
    etiqueta,
    precio: Number.isFinite(precio) && precio >= 0 ? precio : 0,
    factor: Number.isFinite(factor) && factor > 0 ? factor : 1,
  }
}

function sanitizeItems(items) {
  const limpios = []
  if (!Array.isArray(items)) return limpios
  for (const it of items) {
    const productoId = it?.producto?.id ?? it?.producto_id
    const cantidad = Number(it?.cantidad)
    if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) continue
    limpios.push({
      producto_id: productoId,
      nombre: typeof (it?.producto?.nombre ?? it?.nombre) === 'string' ? (it.producto?.nombre ?? it.nombre) : '',
      cantidad,
      presentacion: sanitizePresentacion(it?.presentacion),
      esCortesia: !!it?.esCortesia,
    })
  }
  return limpios
}

function sanitizeCuenta(c, idx) {
  const id = typeof c?.id === 'string' && c.id ? c.id : `cuenta-${idx + 1}`
  const nombre = typeof c?.nombre === 'string' && c.nombre.trim()
    ? c.nombre.trim().slice(0, 30)
    : `Cuenta ${idx + 1}`
  return {
    id,
    nombre,
    items: sanitizeItems(c?.items),
    metodo: METODOS_VALIDOS.includes(c?.metodo) ? c.metodo : 'EFECTIVO',
    montoRecibido: typeof c?.montoRecibido === 'string' ? c.montoRecibido : '',
  }
}

export function savePosDraft({ cuentas, cuentaActivaId, user }) {
  try {
    if (!Array.isArray(cuentas)) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const limpias = cuentas.map(sanitizeCuenta).filter(c => c.items.length > 0)
    if (limpias.length === 0) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const draft = {
      version: 2,
      userId: user?.id ?? null,
      sucursalId: user?.sucursal_id ?? null,
      savedAt: Date.now(),
      cuentaActivaId: typeof cuentaActivaId === 'string' ? cuentaActivaId : null,
      cuentas: limpias,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch { /* empty */ }
}

export function loadPosDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (!draft || typeof draft !== 'object') return null
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    // Migrar formato v1 (ticket único) a v2 (arreglo de cuentas)
    if (draft.version === 1 && Array.isArray(draft.items)) {
      const cuentas = [{
        id: 'cuenta-1',
        nombre: 'Cuenta 1',
        items: sanitizeItems(draft.items),
        metodo: METODOS_VALIDOS.includes(draft.metodo) ? draft.metodo : 'EFECTIVO',
        montoRecibido: typeof draft.montoRecibido === 'string' ? draft.montoRecibido : '',
      }].filter(c => c.items.length > 0)
      if (cuentas.length === 0) return null
      return {
        version: 2,
        userId: draft.userId ?? null,
        sucursalId: draft.sucursalId ?? null,
        savedAt: draft.savedAt,
        cuentaActivaId: 'cuenta-1',
        cuentas,
      }
    }
    if (draft.version !== 2 || !Array.isArray(draft.cuentas)) return null
    const cuentas = draft.cuentas.map(sanitizeCuenta).filter(c => c.items.length > 0)
    if (cuentas.length === 0) return null
    return {
      version: 2,
      userId: draft.userId ?? null,
      sucursalId: draft.sucursalId ?? null,
      savedAt: draft.savedAt,
      cuentaActivaId: cuentas.some(c => c.id === draft.cuentaActivaId) ? draft.cuentaActivaId : cuentas[0].id,
      cuentas,
    }
  } catch {
    return null
  }
}

export function clearPosDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch { /* empty */ }
}
