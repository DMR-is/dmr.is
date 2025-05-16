import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'

class GetCommuniationStatusesHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const statuses = await this.client.getCommunicationStatuses()

    return res.status(200).json(statuses)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetCommuniationStatusesHandler)
