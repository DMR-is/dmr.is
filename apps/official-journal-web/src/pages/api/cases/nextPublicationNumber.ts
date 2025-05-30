import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { getStringFromQueryString } from '../../../lib/types'

class GetNextPublicationNumberHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const departmentId = getStringFromQueryString(req.query.departmentId)

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' })
    }

    const response = await this.client.getNextPublicationNumber({
      departmentId,
    })

    return res.status(200).json(response)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetNextPublicationNumberHandler)
