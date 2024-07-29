import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'
import { getStringFromQueryString } from '../../../lib/types'

class GetNextPublicationNumberHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const departmentId = getStringFromQueryString(req.query.departmentId)

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId is required' })
    }

    const response = await dmrClient.getNextPublicationNumber({
      departmentId,
    })

    return res.status(200).json(response)
  }
}

const instance = new GetNextPublicationNumberHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
