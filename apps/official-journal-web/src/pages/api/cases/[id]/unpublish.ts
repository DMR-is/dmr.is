import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

class UnpublishHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .unpublish({
        id: id,
      })

    return res.status(200).end()
  }
}

const instance = new UnpublishHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
