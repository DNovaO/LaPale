import client from '@/api/client'

export const inventarioService = {
  getProductos: async (soloActivos = false, tipo = '') => {
    let url = `/inventario/productos?activos=${soloActivos}`
    if (tipo) url += `&tipo=${tipo}`
    const { data } = await client.get(url)
    return data.data || []
  },
  getBajoStock: async () => {
    const { data } = await client.get('/inventario/productos/bajo-stock')
    return data.data || []
  },
  deleteProducto: async (id) => {
    const { data } = await client.post(`/inventario/productos/${id}/eliminar`)
    return data
  },
}