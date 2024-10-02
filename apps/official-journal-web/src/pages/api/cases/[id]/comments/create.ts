import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { CaseCommentSource, CaseCommentType } from '../../../../../gen/fetch'
import { createDmrClient } from '../../../../../lib/api/createClient'

const commentBodySchema = z.object({
  caseId: z.string(),
  internal: z.boolean(),
  comment: z.string(),
  initator: z.string(),
  receiver: z.string().optional(),
})

class CreateCommentHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    commentBodySchema.parse(req.body)

    const dmrClient = createDmrClient()

    const body: z.infer<typeof commentBodySchema> = req.body

    const addCommentResponse = await dmrClient.createComment({
      id: id,
      postCaseCommentBody: {
        comment: body.comment,
        internal: body.internal,
        creator: body.initator,
        receiver: body.receiver,
        source: CaseCommentSource.API,
        storeState: false,
        type: body.internal
          ? CaseCommentType.GerirAthugasemd
          : CaseCommentType.SkráirSkilaboð,
      },
    })

    return res.status(200).json(addCommentResponse)
  }
}

const instance = new CreateCommentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
