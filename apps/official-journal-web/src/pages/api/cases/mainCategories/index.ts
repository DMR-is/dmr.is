import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../../lib/api/createClient'
import { SearchParams } from '../../../../lib/types'

const LOG_CATEGORY = 'get-main-categories-handler'

class GetMainCategoriesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const dmrClient = createDmrClient()

      const { page, pageSize, search } = req.query as SearchParams

      const categories = await dmrClient.getMainCategories({
        page: page,
        pageSize: pageSize,
        search: search,
      })

      return res.status(200).json(categories)
    } catch (error) {
      logger.error(`Error in GetMainCategoriesHandler`, {
        error,
        category: LOG_CATEGORY,
      })

      return void res.status(500).json({ error: 'Internal server error' })
    }
  }
}

const instance = new GetMainCategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
