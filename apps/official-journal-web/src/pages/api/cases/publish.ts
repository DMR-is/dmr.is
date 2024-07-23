import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { LogMethod, HandleApiException } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'

const schema = z.object({
  caseIds: z.array(z.string()),
})

class PublishCasesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const parsed = schema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json(parsed.error)
    }

    const { caseIds } = parsed.data

    await dmrClient.publish({
      postCasePublishBody: {
        caseIds,
      },
    })
    return res.status(204).end()
  }
}

const instance = new PublishCasesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
