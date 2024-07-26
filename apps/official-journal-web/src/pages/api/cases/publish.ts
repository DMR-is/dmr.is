import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'

class PublishCasesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { caseIds } = req.body

    if (!caseIds) {
      return res.status(400).end()
    }

    if (!Array.isArray(caseIds)) {
      return res.status(400).end()
    }

    if (!caseIds.length) {
      return res.status(400).end()
    }

    await dmrClient.publish({
      postCasePublishBody: {
        caseIds: req.body.caseIds.join(','),
      },
    })
    return res.status(204).end()
  }
}

const instance = new PublishCasesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
