import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'
import { auditAPIRoute, handleAPIException } from '../../../lib/api/utils'
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  auditAPIRoute({ req })
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
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
    handleAPIException({ error, res })
  }
}
