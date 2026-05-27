import client from '@/api/client'

export const ventasService = {
  getVentas: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const { data } = await client.get(`/ventas${query ? '?' + query : ''}`)
    return data.data || []
  },
}
