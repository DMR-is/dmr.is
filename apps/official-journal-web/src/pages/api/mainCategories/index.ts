import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

const LOG_CATEGORY = 'get-main-categories-handler'

class MainCategoriesHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void (await this.get(req, res))
        case 'POST':
          return void (await this.create(req, res))
        default:
          return void res.status(405).json(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      this.logger.error(`Error in MainCategoriesHandler`, {
        error,
        category: LOG_CATEGORY,
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const { page, pageSize, search } = req.query as SearchParams

    const categories = await this.client.getMainCategories({
      page: page,
      pageSize: pageSize,
      search: search,
    })

    return res.status(200).json(categories)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    await this.client.createMainCategory({
      createMainCategory: req.body,
    })

    return void res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, MainCategoriesHandler)
