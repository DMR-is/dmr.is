import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../../lib/constants'

class MainCategoryCategoryHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'DELETE':
          return void (await this.deleteMainCategoryCategory(req, res))
        default:
          return void res.status(405).json(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      this.logger.error(`Error in MainCategoryCategoryHandler`, {
        error,
        category: 'main-category-category-handler',
      })
      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async deleteMainCategoryCategory(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    const { id: mainCategoryId, cid: categoryId } = req.query as {
      id: string
      cid: string
    }

    await this.client.deleteMainCategoryCategory({
      mainCategoryId: mainCategoryId,
      categoryId: categoryId,
    })
    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, MainCategoryCategoryHandler)
