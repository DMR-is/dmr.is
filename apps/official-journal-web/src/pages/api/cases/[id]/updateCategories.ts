import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateCategoryHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    const { caseId, categoryIds } = req.body

    if (!caseId || !categoryIds) {
      return res.status(400).end()
    }

    if (!id || id !== caseId) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updateCategories({
      id: caseId,
      updateCategoriesBody: {
        categoryIds,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdateCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
