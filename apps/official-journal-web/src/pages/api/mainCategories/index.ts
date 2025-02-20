import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

const LOG_CATEGORY = 'get-main-categories-handler'

class MainCategoriesHandler {
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
      logger.error(`Error in MainCategoriesHandler`, {
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

const instance = new MainCategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
