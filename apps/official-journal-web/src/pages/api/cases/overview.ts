import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'
import { getStringFromQueryString } from '../../../lib/types'

class GetEditorialOverviewHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const status = getStringFromQueryString(req.query.status) as string

    const page = getStringFromQueryString(req.query.page)
    const pageSize = getStringFromQueryString(req.query.pageSize)

    const cases = await dmrClient.editorialOverview({
      search: getStringFromQueryString(req.query.search),
      category: getStringFromQueryString(req.query.category),
      type: getStringFromQueryString(req.query.type),
      status: status,
      department: getStringFromQueryString(req.query.department),
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    })

    return res.status(200).json(cases)
  }
}

const instance = new GetEditorialOverviewHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
