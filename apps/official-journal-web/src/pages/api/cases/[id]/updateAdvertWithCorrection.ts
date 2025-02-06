import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../lib/constants'

const correctionSchema = z.object({
  caseId: z.string(),
  title: z.string(),
  description: z.string(),
  advertHtml: z.string(),
})

class CreateCorrectionHandler {
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

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateCaseAndAddCorrection({
        id: caseId,
        updateAdvertHtmlCorrection: rest,
      })

    return void res.status(204).end()
  }
}

const instance = new CreateCorrectionHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
