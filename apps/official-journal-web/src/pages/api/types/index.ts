import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { isResponse } from '@dmr.is/utils/client'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../lib/constants'

class TypesHandler extends RouteHandler {
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
      if (isResponse(error)) {
        const parsed = await error.json()
        return res.status(error.status).json(parsed)
      }
      return void res.status(500).json(OJOIWebException.serverError())
    }
  }

  @LogMethod(false)
  private async get(req: NextApiRequest, res: NextApiResponse) {
    const {
      page,
      pageSize,
      id,
      slug,
      search,
      department,
      unassigned,
      mainType,
    } = req.query as {
      page?: number
      pageSize?: number
      search?: string
      id?: string
      slug?: string
      department?: string
      unassigned?: boolean
      mainType?: string
    }

    const types = await this.client.getTypes({
      id: id,
      slug: slug,
      unassigned: unassigned,
      department: department,
      search: search,
      mainType: mainType,
      page: page,
      pageSize: pageSize,
    })

    return res.status(200).json(types)
  }

  @LogMethod(false)
  private async create(req: NextApiRequest, res: NextApiResponse) {
    try {
      const type = await this.client.createType({
        createAdvertTypeBody: {
          departmentId: req.body.departmentId,
          mainTypeId: req.body.mainTypeId,
          title: req.body.title,
        },
      })

      return res.status(201).json(type)
    } catch (error) {
      if (isResponse(error)) {
        const parsed = await error.json()

        return res.status(error.status).json(parsed)
      }
      return res.status(500).json(OJOIWebException.serverError())
    }
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, TypesHandler)
