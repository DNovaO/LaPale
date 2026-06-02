import client from '@/api/client'

export const ventasService = {
  getVentas: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const { data } = await client.get(`/ventas${query ? '?' + query : ''}`)
    return data.data || []
  },
  getVenta: async (id) => {
    const { data } = await client.get(`/ventas/${id}`)
    return data.data
  },
  cancelarVenta: async (id, motivo) => {
    const { data } = await client.patch(`/ventas/${id}/cancelar`, { motivo })
    return data.data
  },
  getTopProductos: async (fecha, limite = 5) => {
    const { data } = await client.get(`/ventas/top-productos?fecha=${fecha}&limite=${limite}`)
    return data.data || []
  },
}
