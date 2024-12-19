import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Delete, HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../../../lib/api/createClient'

class DeleteMainCategoryCategoryHandler {
  @LogMethod(false)
  @HandleApiException()
  @Delete()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id: mainCategoryId, cid: categoryId } = req.query as {
      id: string
      cid: string
    }

    if (!mainCategoryId || !categoryId) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.deleteMainCategoryCategory({
      mainCategoryId: mainCategoryId,
      categoryId: categoryId,
    })
    return res.status(204).end()
  }
}

const instance = new DeleteMainCategoryCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
