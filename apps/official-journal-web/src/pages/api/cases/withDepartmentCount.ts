import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, TimeLog } from '@dmr.is/decorators'

import { OJOIWebException } from '../../..//lib/constants'
import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { transformQueryToCaseWithDepartmentCountParams } from '../../../lib/utils'

class GetCasesWithDepartmentCountHandler extends RouteHandler {
  @HandleApiException()
  @TimeLog()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const params = transformQueryToCaseWithDepartmentCountParams(req.query)

      const cases = await this.client.getCasesWithDepartmentCount(params)

      return void res.status(200).json(cases)
    } catch (error) {
      this.logger.error(
        `Exception occured in GetCasesWithDepartmentCountHandler`,
        {
          context: 'GetCasesWithDepartmentCountHandler',
          category: 'api-route',
          error,
        },
      )

      if (error instanceof OJOIWebException) {
        return void res.status(error.status).json(error)
      }

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetCasesWithDepartmentCountHandler)
