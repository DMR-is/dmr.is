import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Get, HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../../../lib/api/createClient'

class GetCaseAttachmentHandler {
  @LogMethod(false)
  @HandleApiException()
  @Get()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id, aid } = req.query as { id?: string; aid?: string }

    if (!id || !aid) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    const response = await dmrClient.getCaseAttachment({
      caseId: id,
      attachmentId: aid,
    })

    return res.status(200).json({
      url: response.url,
    })
  }
}

const instance = new GetCaseAttachmentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
