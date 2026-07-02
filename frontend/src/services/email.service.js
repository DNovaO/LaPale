import client from '@/api/client'

export const emailService = {
  sendTicket: async (data) => {
    const { data: res } = await client.post('/email/ticket', data)
    return res
  },
}
