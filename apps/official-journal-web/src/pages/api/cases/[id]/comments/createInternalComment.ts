import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { Post } from '@nestjs/common'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../lib/api/routeHandler'

const commentBodySchema = z.object({
  comment: z.string(),
})

class CreateCommentHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    commentBodySchema.parse(req.body)

    const body: z.infer<typeof commentBodySchema> = req.body

    const addCommentResponse = await this.client.createInternalComment({
      id: id,
      internalCommentBodyDto: {
        comment: body.comment,
      },
    })

    return res.status(200).json(addCommentResponse)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, CreateCommentHandler)
