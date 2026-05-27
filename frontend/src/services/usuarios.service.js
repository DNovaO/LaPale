import client from '@/api/client'

export const usuariosService = {
  getUsuarios: async () => {
    const { data } = await client.get('/usuarios')
    return data.data || []
  },
  getRoles: async () => {
    const { data } = await client.get('/usuarios/roles')
    return data.data || []
  },
  getUsuario: async (id) => {
    const { data } = await client.get(`/usuarios/${id}`)
    return data.data
  },
  createUsuario: async (usuario) => {
    const { data } = await client.post('/usuarios', usuario)
    return data.data
  },
  updateUsuario: async (id, usuario) => {
    const { data } = await client.put(`/usuarios/${id}`, usuario)
    return data.data
  },
  updateEstado: async (id, activo) => {
    const { data } = await client.patch(`/usuarios/${id}/estado`, { activo })
    return data.data
  },
  changePassword: async (id, password) => {
    const { data } = await client.patch(`/usuarios/${id}/password`, { password })
    return data.data
  },
}
