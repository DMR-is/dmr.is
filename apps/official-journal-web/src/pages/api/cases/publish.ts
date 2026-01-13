import type { NextApiRequest, NextApiResponse } from 'next/types'

import * as z from 'zod'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../lib/constants'

const publishCasesBodySchema = z.object({
  caseIds: z.array(z.string()),
})

class PublishCasesHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const check = publishCasesBodySchema.safeParse(req.body)

      if (!check.success) {
        return res.status(400).json(OJOIWebException.badRequest())
      }

      await this.client.publish({
        postCasePublishBody: {
          caseIds: check.data.caseIds,
        },
      })
      return res.status(204).end()
    } catch (error) {
      this.logger.warn('Failed to publish cases', {
        context: 'PublishCasesHandler',
        error,
      })

      return res.status(500).json(OJOIWebException.serverError())
    }
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, PublishCasesHandler)
