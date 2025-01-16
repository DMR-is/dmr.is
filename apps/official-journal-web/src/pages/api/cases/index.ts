import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'
import { transformQueryToCaseParams } from '../../../lib/utils'
class GetCasesHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const params = transformQueryToCaseParams(req.query)

    const cases = await dmrClient.getCases(params)

    return res.status(200).json(cases)
  }
}

const instance = new GetCasesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
