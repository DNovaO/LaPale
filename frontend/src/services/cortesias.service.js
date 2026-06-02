import client from '@/api/client'

export const cortesiasService = {
  getReglas: async () => {
    const { data } = await client.get('/cortesias/reglas')
    return data.data || []
  },

  getRegla: async (id) => {
    const { data } = await client.get(`/cortesias/reglas/${id}`)
    return data.data
  },

  createRegla: async (regla) => {
    const { data } = await client.post('/cortesias/reglas', regla)
    return data.data
  },

  updateRegla: async (id, regla) => {
    const { data } = await client.put(`/cortesias/reglas/${id}`, regla)
    return data.data
  },

  deleteRegla: async (id) => {
    const { data } = await client.delete(`/cortesias/reglas/${id}`)
    return data.data
  },

  toggleRegla: async (id, activa) => {
    const { data } = await client.patch(`/cortesias/reglas/${id}/toggle`, { activa })
    return data.data
  },

  getDashboard: async () => {
    const { data } = await client.get('/cortesias/dashboard')
    return data.data
  },

  getHistorial: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    const { data } = await client.get(`/cortesias/historial${query ? '?' + query : ''}`)
    return data.data || []
  },

  previewCortesia: async (monto) => {
    const { data } = await client.get(`/cortesias/preview?monto=${monto}`)
    return data.data
  },
}
