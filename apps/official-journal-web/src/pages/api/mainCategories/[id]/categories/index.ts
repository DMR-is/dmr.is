import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../../lib/constants'

class MainCategoryCategoriesHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'POST':
          return void (await this.addCategoriesToMainCategory(req, res))
        default:
          return void res.status(405).json(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      this.logger.error(`Error in MainCategoryCategoriesHandler`, {
        error,
        category: 'main-category-categories-handler',
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async addCategoriesToMainCategory(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    await this.client.createMainCategoryCategories({
      mainCategoryId: req.query.id as string,
      createMainCategoryCategories: {
        categories: req.body.categories,
      },
    })

    return void res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, MainCategoryCategoriesHandler)
