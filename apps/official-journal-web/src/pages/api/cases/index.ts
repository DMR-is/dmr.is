import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'

class GetCasesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { search, category, type, status, department, page, pageSize } =
      req.query as Record<string, string>

    const cases = await dmrClient.getCases({
      search: search,
      category: category,
      type: type,
      status: status,
      department: department,
      page: page,
      pageSize: pageSize,
    })

    return res.status(200).json(cases)
  }
}

const instance = new GetCasesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
