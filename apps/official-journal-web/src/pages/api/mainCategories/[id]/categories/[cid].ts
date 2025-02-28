import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../../lib/constants'

class MainCategoryCategoryHandler {
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
      logger.error(`Error in MainCategoryCategoryHandler`, {
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

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .deleteMainCategoryCategory({
        mainCategoryId: mainCategoryId,
        categoryId: categoryId,
      })
    return res.status(204).end()
  }
}

const instance = new MainCategoryCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
