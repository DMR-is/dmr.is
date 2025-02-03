import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { Put } from '@nestjs/common'

import { createDmrClient } from '../../../../lib/api/createClient'

const createMainCategorySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  departmentId: z.string().optional(),
})

class UpdateMainCategoryHandler {
  @LogMethod(false)
  @HandleApiException()
  @Put()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query

    if (!id) {
      return void res.status(400).json({
        message: 'id is required',
      })
    }
    const parsed = createMainCategorySchema.safeParse(req.body)

    if (!parsed.success) {
      return void res.status(400).json(parsed.error)
    }

    const dmrClient = createDmrClient()

    await dmrClient.updateMainCategory({
      id: id as string,
      updateMainCategory: {
        title: parsed.data.title,
        description: parsed.data.description,
        departmentId: parsed.data.departmentId,
      },
    })

    return void res.status(200).end()
  }
}

const instance = new UpdateMainCategoryHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
