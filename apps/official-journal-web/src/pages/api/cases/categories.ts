import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { SearchParams } from '../../../lib/types'

class GetCategoriesHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { page, pageSize, search } = req.query as SearchParams

    const categories = await this.client.getCategories({
      page: page,
      pageSize: pageSize,
      search: search,
    })

    return res.status(200).json(categories)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetCategoriesHandler)
