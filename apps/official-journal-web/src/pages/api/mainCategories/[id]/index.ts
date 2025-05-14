import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../lib/constants'

const LOG_CATEGORY = 'get-main-categories-handler'

class MainCategoryHandler extends RouteHandler {
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
      this.logger.error(`Error in MainCategoryHandler`, {
        error,
        category: LOG_CATEGORY,
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    await this.client.deleteMainCategory({
      id: req.query.id as string,
    })

    return res.status(204).end()
  }

  private async update(req: NextApiRequest, res: NextApiResponse) {
    await this.client.updateMainCategory({
      id: req.query.id as string,
      updateMainCategory: req.body,
    })

    return void res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, MainCategoryHandler)
