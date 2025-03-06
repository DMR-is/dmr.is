import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../lib/constants'
import { transformQueryToCasesWithStatusCountParams } from '../../../lib/utils'

class GetCasesWithStatusCountHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const params = transformQueryToCasesWithStatusCountParams(req.query)

      const cases = await this.client.getCasesWithStatusCount(params)

      return void res.status(200).json(cases)
    } catch (error) {
      logger.error(`Exception occured in GetCasesWithStatusCountHandler`, {
        context: 'GetCasesWithStatusCountHandler',
        category: 'api-route',
        error: error,
      })

      if (error instanceof OJOIWebException) {
        return void res.status(error.status).json(error)
      }

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetCasesWithStatusCountHandler)
