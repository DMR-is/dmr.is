import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'
import { SearchParams } from '../../../lib/types'

class GetDepartmentsHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { page, pageSize, search } = req.query as SearchParams

    const departments = await dmrClient.getDepartments({
      page: page,
      pageSize: pageSize,
      search: search,
    })

    return res.status(200).json(departments)
  }
}

const instance = new GetDepartmentsHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
