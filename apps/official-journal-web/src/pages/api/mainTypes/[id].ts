import { isUUID } from 'class-validator'
import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/client'

import { createDmrClient } from '../../../lib/api/createClient'
import { getStringFromQueryString } from '../../../lib/types'

class MainTypeHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const id = getStringFromQueryString(req.query.id)
      if (!id || !isUUID(id)) {
        return void res.status(400).json({ message: 'Bad request' })
      }

      switch (req.method) {
        case 'GET':
          return void (await this.get(id, req, res))
        case 'PUT':
          return void (await this.update(id, req, res))
        case 'DELETE':
          return void (await this.delete(id, req, res))
        default:
          return void res.status(405).end()
      }
    } catch (error) {
      logger.error('Failed to handle request', {
        error: error,
        method: req.method,
        url: req.url,
        category: 'api-main-type-handler',
      })

      if (isResponse(error)) {
        const parsed = await error.json()
        return res.status(error.status).json(parsed)
      }

      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  @LogMethod(false)
  private async get(id: string, req: NextApiRequest, res: NextApiResponse) {
    const type = await this.client.getMainTypeById({
      id: id as string,
    })

    return res.status(200).json(type)
  }

  @LogMethod(false)
  private async update(id: string, req: NextApiRequest, res: NextApiResponse) {
    const response = await this.client.updateMainType({
      id: id,
      updateAdvertMainType: {
        title: req.body.title,
      },
    })

    return res.status(200).json(response)
  }

  @LogMethod(false)
  private async delete(id: string, req: NextApiRequest, res: NextApiResponse) {
    await this.client.deleteMainType({
      id: id,
    })

    return res.status(204).end()
  }
}

const instance = new MainTypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
