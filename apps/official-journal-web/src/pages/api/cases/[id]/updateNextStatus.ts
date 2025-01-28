import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

const updateNextStatusSchema = z.object({
  currentStatus: z.string(),
})

class UpdateNextStatusHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as {
      id?: string
    }

    const { currentStatus } = updateNextStatusSchema.parse(req.body)

    if (!id || !currentStatus) {
      return res.status(400).end()
    }

    const client = createDmrClient()

    await client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateNextStatus({
        id: id,
        updateNextStatusBody: {
          currentStatus: currentStatus,
        },
      })

    return res.status(204).end()
  }
}

const instance = new UpdateNextStatusHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
