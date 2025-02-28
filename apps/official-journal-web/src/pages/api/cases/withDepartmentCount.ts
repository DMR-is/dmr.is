import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, TimeLog } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { OJOIWebException } from '../../..//lib/constants'
import { createDmrClient } from '../../../lib/api/createClient'
import { transformQueryToCaseWithDepartmentCountParams } from '../../../lib/utils'

class GetCasesWithDepartmentCountHandler {
  @HandleApiException()
  @TimeLog()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const dmrClient = createDmrClient()

      const params = transformQueryToCaseWithDepartmentCountParams(req.query)

      const cases = await dmrClient
        .withMiddleware(new AuthMiddleware(req.headers.authorization))
        .getCasesWithDepartmentCount(params)

      return void res.status(200).json(cases)
    } catch (error) {
      logger.error(`Exception occured in GetCasesWithDepartmentCountHandler`, {
        context: 'GetCasesWithDepartmentCountHandler',
        category: 'api-route',
        error,
      })

      if (error instanceof OJOIWebException) {
        return void res.status(error.status).json(error)
      }

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }
}

const instance = new GetCasesWithDepartmentCountHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
