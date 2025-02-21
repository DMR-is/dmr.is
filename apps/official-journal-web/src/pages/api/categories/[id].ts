import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'

class CategoryHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'DELETE':
          return void (await this.delete(req, res))
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

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    await this.client.deleteCategory({
      id: req.query.id as string,
    })

    return void res.status(204).end()
  }
}

const instance = new CategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
