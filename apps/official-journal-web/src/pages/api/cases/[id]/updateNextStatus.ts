import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'

class UpdateNextStatusHandler extends RouteHandler {
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

    await this.client.updateNextStatus({
      id: id,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UpdateNextStatusHandler)
