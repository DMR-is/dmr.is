import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'
import { OJOIWebException } from 'apps/official-journal-web/src/lib/constants'

const bodySchema = z.object({
  typeId: z.string(),
})

class UpdateTypeHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }
    const check = bodySchema.safeParse(req.body)

    if(!check.success) {
      return void res.status(400).json(OJOIWebException.badRequest())
    }

    const dmrClient = createDmrClient()

    try {
      await dmrClient
        .withMiddleware(new AuthMiddleware(req.headers.authorization))
        .updateCaseType({
          id: id,
          updateCaseTypeBody: {
            typeId: check.data.typeId,
          },
        })
        return void res.status(200).end()
    }

  }
}

const instance = new UpdateTypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
