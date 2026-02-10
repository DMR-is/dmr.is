import type { NextApiRequest, NextApiResponse } from 'next/types'

import { isUUID } from 'class-validator'

import { LogMethod } from '@dmr.is/decorators'
import { isResponse } from '@dmr.is/utils/client/clientUtils'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../lib/constants'
import { getStringFromQueryString } from '../../../lib/types'

class TypeHandler extends RouteHandler {
  @LogMethod(false)
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
    const type = await this.client.getTypeById({
      id: id as string,
    })

    return res.status(200).json(type)
  }

  @LogMethod(false)
  private async update(id: string, req: NextApiRequest, res: NextApiResponse) {
    const response = await this.client.updateType({
      id: id,
      updateAdvertTypeBody: {
        mainTypeId: req.body.mainTypeId,
        title: req.body.title,
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

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, TypeHandler)
