import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../../lib/api/createClient'

const createMainCategoryCategoriesSchema = z.object({
  categoryIds: z.array(z.string()),
})

class CreateMainCategoryCategoriesHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return void res.status(400).end()
    }

    const parsed = createMainCategoryCategoriesSchema.safeParse(req.body)

    if (!parsed.success) {
      return void res.status(400).json(parsed.error)
    }

    const dmrClient = createDmrClient()

    await dmrClient.createMainCategoryCategories({
      mainCategoryId: id,
      createMainCategoryCategories: {
        categories: parsed.data.categoryIds,
      },
    })

    return void res.status(200).end()
  }
}

const instance = new CreateMainCategoryCategoriesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
