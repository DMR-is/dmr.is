import type { NextApiRequest, NextApiResponse } from 'next/types'
import { getToken } from 'next-auth/jwt'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'
import { addAuthHeader } from '../../../../lib/utils'

class GetCaseHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { id } = req.query as { id?: string }
    const auth = await getToken({ req })

    if (!id) {
      return res.status(400).json({ message: 'Case ID is required' })
    }

    const caseResponse = await dmrClient
      .withMiddleware(addAuthHeader(auth?.accessToken))
      .getCase({
        id,
      })

    return res.status(200).json(caseResponse)
  }
}

const instance = new GetCaseHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
