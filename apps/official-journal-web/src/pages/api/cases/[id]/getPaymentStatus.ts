import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../lib/constants'

class GetPaymentHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return void res
        .status(400)
        .json(OJOIWebException.badRequest('Invalid request body'))
    }

    const dmrClient = createDmrClient()

    const paymentStatus = await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getCasePaymentStatus({
        id,
      })

      return res.status(200).json(paymentStatus)
  }
}

const instance = new GetPaymentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
