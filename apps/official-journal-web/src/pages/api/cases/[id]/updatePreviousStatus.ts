import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'

class UpdatePreviousStatusHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as {
      id?: string
    }

    if (!id) {
      return res.status(400).end()
    }

    await this.client.updatePreviousStatus({
      id: id,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UpdatePreviousStatusHandler)
