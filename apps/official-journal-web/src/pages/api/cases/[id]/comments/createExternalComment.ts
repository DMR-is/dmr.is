import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../../lib/constants'

const commentBodySchema = z.object({
  comment: z.string(),
})

class CreateExternalCommentHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'POST':
          return void (await this.create(req, res))
        default:
          return void res.status(405).json(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      this.logger.error(`Error in CreateExternalCommentHandler`, {
        error,
        category: 'create-external-comment-handler',
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }
  private async create(req: NextApiRequest, res: NextApiResponse) {
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
