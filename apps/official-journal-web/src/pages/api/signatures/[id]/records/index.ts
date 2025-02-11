import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../lib/api/createClient'

class SignatureRecordsHandler {
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

    const dmrClient = createDmrClient()
    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createSignatureRecord({ signatureId: id })

    return res.status(204).end()
  }
}

const instance = new SignatureRecordsHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
