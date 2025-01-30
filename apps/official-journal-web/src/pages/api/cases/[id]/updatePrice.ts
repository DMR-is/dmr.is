import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

const updatePriceBody = z.object({
  price: z.number(),
})

class UpdatePriceHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const price = updatePriceBody.parse(req.body).price

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updatePrice({
        id: id,
        updateCasePriceBody: {
          price: price,
        },
      })

    return res.status(204).end()
  }
}

const instance = new UpdatePriceHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
