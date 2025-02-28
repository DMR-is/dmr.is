import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

class CategoriesHandler {
  private readonly client = createDmrClient()

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
      logger.error(`Error in CategoriesHandler`, {
        error,
        category: 'categories-handler',
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const { page, pageSize, search } = req.query as SearchParams

    const categories = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getCategories({
        page: page,
        pageSize: pageSize,
        search: search,
      })

    return res.status(200).json(categories)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createCategory({
        createCategory: req.body,
      })

    return void res.status(204).end()
  }
}

const instance = new CategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
