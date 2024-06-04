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

    const { caseId, status } = req.body

    if (!caseId || !status) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const client = createDmrClient()

    await client.updateCaseStatus({
      id: caseId,
      updateCaseStatusBody: {
        status,
      },
    })

    return res.status(204).end()
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(500).json({ error: 'An unexpected error occurred' })
  }
}
