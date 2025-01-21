import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  typeId: z.string(),
})

class UpdateTypeHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }

    const client = createDmrClient()
    const { typeId } = bodySchema.parse(req.body)

    await client.updateCaseType({
      id,
      updateCaseTypeBody: {
        typeId,
      },
    })

    return void res.status(204).end()
  }
}

const instance = new UpdateTypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
