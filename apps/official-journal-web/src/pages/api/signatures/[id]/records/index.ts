import type { NextApiRequest, NextApiResponse } from 'next/types'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../lib/api/routeHandler'

class SignatureRecordsHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'POST':
        return void (await this.create(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }

    await this.client.createSignatureRecord({ signatureId: id })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, SignatureRecordsHandler)
