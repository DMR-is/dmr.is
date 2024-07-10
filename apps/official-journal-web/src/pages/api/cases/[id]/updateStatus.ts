import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateStatusHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { caseId, statusId } = req.body

    if (!caseId || !statusId) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const client = createDmrClient()

    await client.updateCaseStatus({
      id: caseId,
      updateCaseStatusBody: {
        status: statusId,
      },
    })

    return res.status(204).end()
  }
}

const instance = new UpdateStatusHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
