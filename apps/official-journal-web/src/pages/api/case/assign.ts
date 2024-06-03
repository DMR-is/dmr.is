import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const dmrClient = createDmrClient()

    const { id, userId } = JSON.parse(req.body)

    if (!id || !userId) {
      return res.status(400).json({ error: 'Bad Request' })
    }

    await dmrClient.assignEmployee({
      id: id,
      userId: userId,
    })

    return res.status(204).end()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
