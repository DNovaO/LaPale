import client from '@/api/client'

export const finanzasService = {
  getResumenDia: async (fecha) => {
    const params = fecha ? `?fecha=${fecha}` : ''
    const { data } = await client.get(`/finanzas/resumen/dia${params}`)
    return data.data
  },
  getResumenPeriodo: async (desde, hasta) => {
    const { data } = await client.get(`/finanzas/resumen/periodo?desde=${desde}&hasta=${hasta}`)
    return data.data
  },
  getGastos: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const { data } = await client.get(`/finanzas/gastos${query ? '?' + query : ''}`)
    return data.data || []
  },
  createGasto: async (gasto) => {
    const { data } = await client.post('/finanzas/gastos', gasto)
    return data.data
  },
  deleteGasto: async (id) => {
    const { data } = await client.delete(`/finanzas/gastos/${id}`)
    return data.data
  },
  getCierres: async (limite = 30) => {
    const { data } = await client.get(`/finanzas/caja/historial?limite=${limite}`)
    return data.data || []
  },
  cerrarCaja: async (notas = '') => {
    const { data } = await client.post('/finanzas/caja/cerrar', { notas })
    return data.data
  },
}