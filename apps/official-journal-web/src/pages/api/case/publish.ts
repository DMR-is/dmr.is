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

    const { caseIds } = req.body

    try {
      await dmrClient.publish({
        postCasePublishBody: {
          caseIds,
        },
      })
      return res.status(204).end()
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
