import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  statusId: z.string(),
})

class UpdateStatusHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return void res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return void res.status(400).end()
    }

    const client = createDmrClient()

    await client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateCaseStatus({
        id: id,
        updateCaseStatusBody: {
          status: parsed.data.statusId,
        },
      })

    return void res.status(204).end()
  }
}

const instance = new UpdateStatusHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
