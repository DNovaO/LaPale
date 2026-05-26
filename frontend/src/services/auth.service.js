import client from '@/api/client'

export const authService = {
  login: async (username, password) => {
    const { data } = await client.post('/auth/login', { username, password })
    return data.data
  },
}