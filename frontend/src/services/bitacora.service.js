import client from '@/api/client'

export const bitacoraService = {
  getRegistros: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const { data } = await client.get(`/bitacora${query ? '?' + query : ''}`)
    return data.data || []
  },
}
