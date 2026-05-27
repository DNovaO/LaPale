import client from '@/api/client'

export const inventarioService = {
  getProductos: async (soloActivos = false) => {
    const { data } = await client.get(`/inventario/productos?activos=${soloActivos}`)
    return data.data || []
  },
  getBajoStock: async () => {
    const { data } = await client.get('/inventario/productos/bajo-stock')
    return data.data || []
  },
}