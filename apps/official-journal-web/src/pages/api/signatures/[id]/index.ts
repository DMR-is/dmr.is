import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'

class SignatureHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'GET':
        return void (await this.get(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }

    const signatureResponse = await this.client.getSignature({
      signatureId: id,
    })

    return res.status(200).json(signatureResponse)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, SignatureHandler)
