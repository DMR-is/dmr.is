import type { NextApiRequest, NextApiResponse } from 'next/types'

import { z } from 'zod'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../lib/constants'

const updatePriceBody = z.object({
  imageTier: z.string().optional(),
  customBaseDocumentCount: z.number().optional(),
  customAdditionalDocCount: z.number().optional(),
  customBodyLengthCount: z.number().optional(),
})

class UpdatePriceHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    const parsed = updatePriceBody.safeParse(req.body)
    if (!parsed.success || !id) {
      return void res
        .status(400)
        .json(OJOIWebException.badRequest('Invalid request body'))
    }
    const body: z.infer<typeof updatePriceBody> = req.body

    await this.client.updatePrice({
      id: id,
      updateCasePriceBody: body,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UpdatePriceHandler)
