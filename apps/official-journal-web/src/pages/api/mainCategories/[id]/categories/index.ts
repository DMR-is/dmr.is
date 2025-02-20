import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../../lib/constants'

class MainCategoryCategoriesHandler {
  private readonly client = createDmrClient()

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
      logger.error(`Error in MainCategoryCategoriesHandler`, {
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
    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createMainCategoryCategories({
        mainCategoryId: req.query.id as string,
        createMainCategoryCategories: req.body,
      })

    return void res.status(204).end()
  }
}

const instance = new MainCategoryCategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
