import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { CaseStatusEnum } from '../../../gen/fetch'
import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'
import { getStringFromQueryString } from '../../../lib/types'

class GetCasesWithStatusCountHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const dmrClient = createDmrClient()

      const page = getStringFromQueryString(req.query.page)
      const pageSize = getStringFromQueryString(req.query.pageSize)

      const cases = await dmrClient.getCasesWithStatusCount({
        status: req.query.status as CaseStatusEnum,
        statuses: req.query.statuses as CaseStatusEnum[],
        search: getStringFromQueryString(req.query.search),
        category: getStringFromQueryString(req.query.category),
        type: getStringFromQueryString(req.query.type),
        department: getStringFromQueryString(req.query.department),
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      })

      return void res.status(200).json(cases)
    } catch (error) {
      logger.error(`Exception occured in GetCasesWithStatusCountHandler`, {
        context: 'GetCasesWithStatusCountHandler',
        category: 'api-route',
        error: error,
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }
}

const instance = new GetCasesWithStatusCountHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
