import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Delete, HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class DeleteMainCategoryHandler {
  @LogMethod(false)
  @HandleApiException()
  @Delete()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.deleteMainCategory({
      id: id,
    })
    return res.status(204).end()
  }
}

const instance = new DeleteMainCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
