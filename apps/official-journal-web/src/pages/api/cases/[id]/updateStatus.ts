import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  statusId: z.string(),
})

class UpdateStatusHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    const client = createDmrClient()

    await client.updateCaseStatus({
      id: id,
      updateCaseStatusBody: {
        status: parsed.data.statusId,
      },
    })

    return res.status(204).end()
  }
}

const instance = new UpdateStatusHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
