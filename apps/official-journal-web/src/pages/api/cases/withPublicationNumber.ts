import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, TimeLog } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { OJOIWebException } from '../../..//lib/constants'
import { createDmrClient } from '../../../lib/api/createClient'
import { transformQueryToCaseWithDepartmentCountParams } from '../../../lib/utils'

class GetCasesWithPublicationNumberHandler {
  @HandleApiException()
  @TimeLog()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const dmrClient = createDmrClient()

      const params = transformQueryToCaseWithDepartmentCountParams(req.query)

      const cases = await dmrClient.getCasesWithPublicationNumber(params)

      return void res.status(200).json(cases)
    } catch (error) {
      logger.error(
        `Exception occured in GetCasesWithPublicationNumberHandler`,
        {
          context: 'GetCasesWithPublicationNumberHandler',
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

const instance = new GetCasesWithPublicationNumberHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)