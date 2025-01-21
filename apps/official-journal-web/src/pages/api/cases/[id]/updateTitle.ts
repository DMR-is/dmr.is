import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  title: z.string(),
})

class UpdateTitleHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updateTitle({
      id,
      updateTitleBody: {
        title: parsed.data.title,
      },
    })

    return res.status(204).end()
  }
}

const instance = new UpdateTitleHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
