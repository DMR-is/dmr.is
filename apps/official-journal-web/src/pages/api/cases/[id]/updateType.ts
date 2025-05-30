import type { NextApiRequest, NextApiResponse } from 'next/types'

import { z } from 'zod'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../lib/constants'

const bodySchema = z.object({
  typeId: z.string(),
})

class UpdateTypeHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }
    const check = bodySchema.safeParse(req.body)

    if (!check.success) {
      return void res.status(400).json(OJOIWebException.badRequest())
    }

    await this.client.updateCaseType({
      id: id,
      updateCaseTypeBody: {
        typeId: check.data.typeId,
      },
    })
    return void res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UpdateTypeHandler)
