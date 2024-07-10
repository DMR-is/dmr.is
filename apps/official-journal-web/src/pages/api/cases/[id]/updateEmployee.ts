import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateEmployeeHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { caseId, userId } = req.body

    if (!caseId || !userId) {
      return res.status(400).json({ error: 'Bad Request' })
    }

    await dmrClient.assignEmployee({
      id: caseId,
      userId: userId,
    })

    return res.status(204).end()
  }
}

const instance = new UpdateEmployeeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
