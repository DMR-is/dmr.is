import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'
import { SearchParams } from '../../../lib/types'

const LOG_CATEGORY = 'get-main-categories-handler'

class GetMainCategoriesHandler {
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
      logger.error(`Error in GetMainCategoriesHandler`, {
        error,
        category: LOG_CATEGORY,
      })

      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { page, pageSize, search } = req.query as SearchParams

    const categories = await dmrClient.getMainCategories({
      page: page,
      pageSize: pageSize,
      search: search,
    })

    return res.status(200).json(categories)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    const { body } = req

    const category = await this.client.createMainCategory(body)

    return res.status(201).json(category)
  }
}

const instance = new GetMainCategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
