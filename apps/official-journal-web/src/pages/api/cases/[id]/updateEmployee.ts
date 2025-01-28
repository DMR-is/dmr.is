import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  userId: z.string(),
})

class UpdateEmployeeHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .assignEmployee({
        id: id,
        userId: parsed.data.userId,
      })

    return res.status(204).end()
  }
}

const instance = new UpdateEmployeeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
