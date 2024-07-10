import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateNextStatusHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { caseId } = req.body

    if (!caseId) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const client = createDmrClient()

    await client.updateNextStatus({
      id: caseId,
    })

    return res.status(204).end()
  }
}

const instance = new UpdateNextStatusHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
