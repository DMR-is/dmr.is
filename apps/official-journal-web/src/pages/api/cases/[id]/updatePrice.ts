import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdatePriceHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    const { caseId, price } = req.body

    if (!caseId || !price) {
      console.log(`caseId: ${caseId}, price: ${price}`)
      logger.warn(`UpdatePriceHandler: caseId or price is missing`)
      return res.status(400).end()
    }

    if (!id || id !== caseId) {
      console.log(`id: ${id}, caseId: ${caseId}`)
      logger.warn(`UpdatePriceHandler: caseId does not match id in path`)
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updatePrice({
      id: caseId,
      updateCasePriceBody: {
        price: price,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdatePriceHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
