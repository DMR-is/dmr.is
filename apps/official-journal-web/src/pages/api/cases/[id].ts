import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'
import { auditAPIRoute, handleAPIException } from '../../../lib/api/utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  auditAPIRoute({ req })

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id

    if (!id) return res.status(400).json({ message: 'Id is required' })

    const dmrClient = createDmrClient()

    const caseResponse = await dmrClient.getCase({ id })

    return res.status(200).json(caseResponse)
  } catch (error) {
    handleAPIException({ error, res })
  }
}
