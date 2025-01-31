import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'

class GetTagsHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const tags = await dmrClient.getTags()

    return res.status(200).json(tags)
  }
}

const instance = new GetTagsHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
