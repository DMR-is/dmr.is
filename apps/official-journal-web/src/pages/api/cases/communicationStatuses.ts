import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'

class GetCommuniationStatusesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const statuses = await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getCommunicationStatuses()

    return res.status(200).json(statuses)
  }
}

const instance = new GetCommuniationStatusesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
