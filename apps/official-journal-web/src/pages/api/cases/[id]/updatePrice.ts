import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdatePriceHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    const { caseId, price } = req.body

    if (!caseId || !price) {
      return res.status(400).end()
    }

    if (!id || id !== caseId) {
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
