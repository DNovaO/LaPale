import client from '@/api/client'

export const printerService = {
  imprimirTicket: async (ticket) => {
    const { data } = await client.post('/printer/ticket', ticket)
    return data
  },
  abrirCajon: async () => {
    const { data } = await client.post('/printer/cajon')
    return data
  },
}