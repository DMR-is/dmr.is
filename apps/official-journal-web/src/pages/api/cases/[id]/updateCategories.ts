import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'
const bodySchema = z.object({
  categoryIds: z.array(z.string()),
})

class UpdateCategoryHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updateCategories({
      id: id,
      updateCategoriesBody: {
        categoryIds: parsed.data.categoryIds,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdateCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)