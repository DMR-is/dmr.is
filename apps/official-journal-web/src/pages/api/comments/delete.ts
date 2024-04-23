import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'

const LOGGING_CATEGORY = 'ApiCommentsDelete'

const queryParams = z.object({
  caseId: z.string(),
  commentId: z.string(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  logger.info('API request to delete comment', {
    category: LOGGING_CATEGORY,
    route: '/api/comments/delete',
  })

  try {
    queryParams.parse(req.query)
  } catch (error) {
    logger.error('Invalid request body', {
      category: LOGGING_CATEGORY,
    })
    return res.status(400).json({ error: 'Invalid request body' })
  }

  const dmrClient = createDmrClient()

  const body = queryParams.parse(req.query)

  logger.info('Deleting comment', {
    category: LOGGING_CATEGORY,
    caseId: body.caseId,
    commentId: body.commentId,
  })

  try {
    const result = await dmrClient.deleteComment({
      caseId: body.caseId,
      commentId: body.commentId,
    })

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
