import type { NextApiRequest, NextApiResponse } from 'next/types'

import { z } from 'zod'

import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'

const bodySchema = z.object({
  statusId: z.string(),
})

class UpdateCommunicationStatus extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    await this.client.updateCommunicationStatus({
      id: id,
      updateCommunicationStatusBody: {
        statusId: parsed.data.statusId,
      },
    })

    return res.status(200).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UpdateCommunicationStatus)
