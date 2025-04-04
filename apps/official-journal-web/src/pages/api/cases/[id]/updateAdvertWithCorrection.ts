import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { Post } from '@nestjs/common'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../lib/constants'

const correctionSchema = z.object({
  caseId: z.string(),
  title: z.string(),
  description: z.string(),
  advertHtml: z.string(),
})

class CreateCorrectionHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const parsed = correctionSchema.safeParse(req.body)

    if (!parsed.success) {
      return void res
        .status(400)
        .json(OJOIWebException.badRequest('Invalid request body'))
    }

    const body: z.infer<typeof correctionSchema> = req.body

    const { caseId, ...rest } = body

    await this.client.updateCaseAndAddCorrection({
      id: caseId,
      updateAdvertHtmlCorrection: rest,
    })

    return void res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, CreateCorrectionHandler)
