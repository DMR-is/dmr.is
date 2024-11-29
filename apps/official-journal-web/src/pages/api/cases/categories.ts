import type { NextApiRequest, NextApiResponse } from 'next/types'
import { getToken } from 'next-auth/jwt'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'
import { SearchParams } from '../../../lib/types'

class GetCategoriesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { page, pageSize, search } = req.query as SearchParams
    const auth = await getToken({ req })

    const categories = await dmrClient
      .withMiddleware(new AuthMiddleware(auth?.accessToken))
      .getCategories({
        page: page,
        pageSize: pageSize,
        search: search,
      })
      .catch((error) => {
        logger.error('failed to get the categories', { error })
        return void res
          .status(500)
          .json({
            error: 'failed to get the categories: ' + JSON.stringify(error),
          })
      })

    return res.status(200).json(categories)
  }
}

const instance = new GetCategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
