import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException } from '@dmr.is/decorators'

import { createDmrClient } from '../../../lib/api/createClient'
import { SearchParams } from '../../../lib/types'

class GetTypesHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const dmrClient = createDmrClient()

    const { page, pageSize, search, department } = req.query as SearchParams & {
      department?: string
    }

    const currentPage = page ?? 1
    const currentPageSize = pageSize ? Math.min(Number(pageSize), 1000) : 10

    const types = await dmrClient.getTypes({
      department: department,
      page: Number(currentPage),
      pageSize: currentPageSize,
      search: search,
    })

    return res.status(200).json(types)
  }
}

const instance = new GetTypesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
