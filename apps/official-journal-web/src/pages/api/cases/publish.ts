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
    const dmrClient = createDmrClient()

    const { caseIds } = req.body

    await dmrClient.publish({
      postCasePublishBody: {
        caseIds,
      },
    })
    return res.status(204).end()
  } catch (error) {
    handleAPIException({ error, res })
  }
}
