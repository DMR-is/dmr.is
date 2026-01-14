import type { NextApiRequest, NextApiResponse } from 'next/types'

import * as z from 'zod'

import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../lib/api/routeHandler'

const commentBodySchema = z.object({
  comment: z.string(),
})

class CreateExternalCommentHandler extends RouteHandler {
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

    const addCommentResponse = await this.client.createExternalComment({
      id: id,
      externalCommentBodyDto: {
        comment: body.comment,
      },
    })

    return res.status(200).json(addCommentResponse)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, CreateExternalCommentHandler)
