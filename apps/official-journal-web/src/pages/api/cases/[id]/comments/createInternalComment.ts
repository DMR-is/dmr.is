import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../lib/api/createClient'

const commentBodySchema = z.object({
  comment: z.string(),
})

class CreateCommentHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    commentBodySchema.parse(req.body)

    const dmrClient = createDmrClient()

    const body: z.infer<typeof commentBodySchema> = req.body

    const addCommentResponse = await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createInternalComment({
        id: id,
        internalCommentBodyDto: {
          comment: body.comment,
        },
      })

    return res.status(200).json(addCommentResponse)
  }
}

const instance = new CreateCommentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
