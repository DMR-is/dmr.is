import type { NextApiRequest, NextApiResponse } from 'next/types'

import * as z from 'zod'

import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'

const bodySchema = z.object({
  categoryIds: z.array(z.string()),
})

class UpdateCategoryHandler extends RouteHandler {
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

    await this.client.updateCategories({
      id: id,
      updateCategoriesBody: {
        categoryIds: parsed.data.categoryIds,
      },
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UpdateCategoryHandler)
