import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { SearchParams } from '../../../lib/types'

class GetDepartmentsHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { page, pageSize, search } = req.query as SearchParams

    const departments = await this.client.getDepartments({
      page: page,
      pageSize: pageSize,
      search: search,
    })

    return res.status(200).json(departments)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetDepartmentsHandler)
