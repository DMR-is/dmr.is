import { isUUID } from 'class-validator'
import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'
import { isResponse } from '@dmr.is/utils/client'

import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'
import { getStringFromQueryString } from '../../../lib/types'

class MainTypeHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const id = getStringFromQueryString(req.query.id)
      if (!id || !isUUID(id)) {
        return void res
          .status(400)
          .json(
            OJOIWebException.badRequest(
              `Ógild fyrirspurn, breytan "id" vantar eða er ekki gild`,
            ),
          )
      }

      switch (req.method) {
        case 'GET':
          return void (await this.get(id, req, res))
        case 'PUT':
          return void (await this.update(id, req, res))
        case 'DELETE':
          return void (await this.delete(id, req, res))
        default:
          return void res.status(405).json(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      if (isResponse(error)) {
        const parsed = await error.json()
        return res.status(error.status).json(parsed)
      }

      return res.status(500).json(OJOIWebException.serverError())
    }
  }

  @LogMethod(false)
  private async get(id: string, req: NextApiRequest, res: NextApiResponse) {
    const type = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getMainTypeById({
        id: id,
      })

    return res.status(200).json(type)
  }

  @LogMethod(false)
  private async update(id: string, req: NextApiRequest, res: NextApiResponse) {
    const response = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateMainType({
        id: id,
        updateAdvertMainType: {
          title: req.body.title,
        },
      })

    return res.status(200).json(response)
  }

  @LogMethod(false)
  private async delete(id: string, req: NextApiRequest, res: NextApiResponse) {
    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .deleteMainType({
        id: id,
      })

    return res.status(204).end()
  }
}

const instance = new MainTypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
