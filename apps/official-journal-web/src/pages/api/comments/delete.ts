import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

import { createDmrClient } from '../../../lib/api/createClient'
import { auditAPIRoute, handleAPIException } from '../../../lib/api/utils'

const queryParams = z.object({
  caseId: z.string(),
  commentId: z.string(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  auditAPIRoute({ req })
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    queryParams.parse(req.query)

    const dmrClient = createDmrClient()

    const body = queryParams.parse(req.query)
    await dmrClient.deleteComment({
      id: body.caseId,
      commentId: body.commentId,
    })
    return res.status(204).end()
  } catch (error) {
    handleAPIException({ res, error })
  }
}
