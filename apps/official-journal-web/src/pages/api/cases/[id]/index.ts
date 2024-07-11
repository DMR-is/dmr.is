import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class GetCaseHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).json({ message: 'Case ID is required' })
    }

    const caseResponse = await dmrClient.getCase({
      id,
    })

    return res.status(200).json(caseResponse)
  }
}

const instance = new GetCaseHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
