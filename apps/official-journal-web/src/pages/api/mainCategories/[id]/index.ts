import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../lib/constants'

const LOG_CATEGORY = 'get-main-categories-handler'

class MainCategoryHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'PUT':
          return void (await this.update(req, res))
        case 'DELETE':
          return void (await this.delete(req, res))
        default:
          return void res.status(405).json(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      logger.error(`Error in MainCategoryHandler`, {
        error,
        category: LOG_CATEGORY,
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .deleteMainCategory({
        id: req.query.id as string,
      })

    return res.status(204).end()
  }

  private async update(req: NextApiRequest, res: NextApiResponse) {
    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateMainCategory({
        id: req.query.id as string,
        updateMainCategory: req.body,
      })

    return void res.status(204).end()
  }
}

const instance = new MainCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
