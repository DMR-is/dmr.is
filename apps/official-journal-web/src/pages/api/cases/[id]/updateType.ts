import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  typeId: z.string(),
})

class UpdateTypeHandler {
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

    const dmrClient = createDmrClient()

    await dmrClient.updateType({
      id: id,
      updateCaseTypeBody: {
        typeId: parsed.data.typeId,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdateTypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
