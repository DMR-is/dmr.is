import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'
import { getStringFromQueryString } from '../../../lib/types'
class GetCasesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const cases = await dmrClient.getCases({
      id: getStringFromQueryString(req.query.id),
      search: getStringFromQueryString(req.query.search),
      category: getStringFromQueryString(req.query.category),
      type: getStringFromQueryString(req.query.type),
      status: getStringFromQueryString(req.query.status),
      department: getStringFromQueryString(req.query.department),
      page: getStringFromQueryString(req.query.page),
      pageSize: getStringFromQueryString(req.query.pageSize),
    })

    return res.status(200).json(cases)
  }
}

const instance = new GetCasesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
