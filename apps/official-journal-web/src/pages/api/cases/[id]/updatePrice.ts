import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../lib/constants'

const updatePriceBody = z.object({
  imageTier: z.string().optional(),
  customBaseDocumentCount: z.number().optional(),
  customAdditionalDocCount: z.number().optional(),
  customBodyLengthCount: z.number().optional(),
})

class UpdatePriceHandler {
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

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updatePrice({
        id: id,
        updateCasePriceBody: body,
      })

    return res.status(204).end()
  }
}

const instance = new UpdatePriceHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
