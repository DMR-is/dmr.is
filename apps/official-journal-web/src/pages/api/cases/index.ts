import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { transformQueryToCaseParams } from '../../../lib/utils'

class GetCasesHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const params = transformQueryToCaseParams(req.query)

    const cases = await this.client.getCases(params)

    return res.status(200).json(cases)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetCasesHandler)
