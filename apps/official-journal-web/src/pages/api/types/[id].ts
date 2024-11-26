import { isUUID } from 'class-validator'
import type { NextApiRequest, NextApiResponse } from 'next/types'
import { LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/client'

import { createDmrClient } from '../../../lib/api/createClient'
import { getStringFromQueryString } from '../../../lib/types'

class TypeHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
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
          return void res.status(405).json({ message: 'Method not allowed' })
      }
    } catch (error) {
      logger.error('Failed to handle request', {
        error: error,
        method: req.method,
        url: req.url,
        category: 'api-type-handler',
      })
      if (isResponse(error)) {
        const parsedError = await error.json()

        return void res
          .status(parsedError.statusCode)
          .json({ message: parsedError.message })
      } else {
        return void res.status(500).json({ message: 'Internal server error' })
      }
    }
  }

  @LogMethod(false)
  private async get(id: string, req: NextApiRequest, res: NextApiResponse) {
    const type = await this.client.getTypeById({
      id: id as string,
    })

    return res.status(200).json(type)
  }

  @LogMethod(false)
  private async update(id: string, req: NextApiRequest, res: NextApiResponse) {
    const title = req.body.title

    if (!title) {
      logger.warn('Failed to update type', {
        id: id,
        title: title,
        category: 'api-type-handler',
      })
      return res.status(400).json({ message: 'Bad request' })
    }

    const response = await this.client.updateType({
      id: id,
      updateAdvertTypeBody: {
        title: title,
      },
    })

    return res.status(200).json(response)
  }

  @LogMethod(false)
  private async delete(id: string, req: NextApiRequest, res: NextApiResponse) {
    await this.client.deleteType({
      id: id,
    })

    return res.status(204).end()
  }
}

const instance = new TypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
