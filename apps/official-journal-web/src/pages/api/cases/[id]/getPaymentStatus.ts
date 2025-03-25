import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../lib/constants'

class GetPaymentHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return void res
        .status(400)
        .json(OJOIWebException.badRequest('Invalid request body'))
    }

    const paymentStatus = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getCasePaymentStatus({
        id,
      })

      return res.status(200).json(paymentStatus)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetPaymentHandler)
