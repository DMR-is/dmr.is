import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../../../lib/api/createClient'

class SignatureMembersHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'POST':
        return void (await this.post(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async post(req: NextApiRequest, res: NextApiResponse) {
    const { id, recordId } = req.query as {
      id: string
      recordId: string
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createSignatureMember({
        signatureId: id,
        recordId: recordId,
      })

    return res.status(204).end()
  }
}

const instance = new SignatureMembersHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
