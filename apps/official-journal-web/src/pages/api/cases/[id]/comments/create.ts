import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { LogMethod, HandleApiException, Post } from '@dmr.is/decorators'

import { PostCaseCommentTypeEnum } from '../../../../../gen/fetch'
import { createDmrClient } from '../../../../../lib/api/createClient'

const commentBodySchema = z.object({
  caseId: z.string(),
  internal: z.boolean(),
  comment: z.string(),
  from: z.string(),
  to: z.string().optional(),
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
      postCaseComment: {
        comment: body.comment,
        internal: body.internal,
        to: body.to,
        from: body.from,
        type: body.internal
          ? PostCaseCommentTypeEnum.Message
          : PostCaseCommentTypeEnum.Comment,
      },
    })

    return res.status(200).json(addCommentResponse)
  }
}

const instance = new CreateCommentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
