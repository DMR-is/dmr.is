import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  price: z.string(),
})

class UpdatePriceHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }
    const { price } = req.body

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse({ price })

    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updatePrice({
      id: id,
      updateCasePriceBody: {
        price: parsed.data.price,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdatePriceHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
