import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

class SignatureHandler {
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

    const dmrClient = createDmrClient()

    const signatureResponse = await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getSignature({
        signatureId: id,
      })

    return res.status(200).json(signatureResponse)
  }
}

const instance = new SignatureHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
