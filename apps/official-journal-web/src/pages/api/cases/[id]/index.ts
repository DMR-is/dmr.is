import type { NextApiRequest, NextApiResponse } from 'next/types'
import { LogMethod, HandleApiException } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class GetCaseHandler {
  @LogMethod(false)
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
