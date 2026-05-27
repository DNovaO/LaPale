import client from '@/api/client'

export const finanzasService = {
  getResumenDia: async (fecha) => {
    const params = fecha ? `?fecha=${fecha}` : ''
    const { data } = await client.get(`/finanzas/resumen/dia${params}`)
    return data.data
  },
}