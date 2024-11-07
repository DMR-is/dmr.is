import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

const createMainCategorySchema = z.object({
  title: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
})

class CreateMainCategoryHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const parsed = createMainCategorySchema.safeParse(req.body)

    if (!parsed.success) {
      return void res.status(400).json(parsed.error)
    }

    const dmrClient = createDmrClient()

    await dmrClient.createMainCategory({
      createMainCategory: {
        title: parsed.data.title,
        description: parsed.data.description,
        categories: parsed.data.categories,
      },
    })

    return void res.status(200).end()
  }
}

const instance = new CreateMainCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
