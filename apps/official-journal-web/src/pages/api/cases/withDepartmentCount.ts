import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { OJOIWebException } from '../../..//lib/constants'
import { DepartmentEnum } from '../../../gen/fetch'
import { createDmrClient } from '../../../lib/api/createClient'
import { getStringFromQueryString } from '../../../lib/types'

class GetCasesWithDepartmentCountHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const dmrClient = createDmrClient()

      const page = getStringFromQueryString(req.query.page)
      const pageSize = getStringFromQueryString(req.query.pageSize)

      const department = req.query.department as DepartmentEnum

      const cases = await dmrClient.getCasesWithDepartmentCount({
        department: department,
        search: getStringFromQueryString(req.query.search),
        category: getStringFromQueryString(req.query.category),
        type: getStringFromQueryString(req.query.type),
        status: req.query.status as string,
        page: page ? parseInt(page) : undefined,
        pageSize: pageSize ? parseInt(pageSize) : undefined,
      })

      return void res.status(200).json(cases)
    } catch (error) {
      logger.error(`Exception occured in GetCasesWithDepartmentCountHandler`, {
        context: 'GetCasesWithDepartmentCountHandler',
        category: 'api-route',
        error,
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }
}

const instance = new GetCasesWithDepartmentCountHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
