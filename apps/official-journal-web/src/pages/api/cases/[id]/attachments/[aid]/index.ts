import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/client'

import { createDmrClient } from '../../../../../../lib/api/createClient'
import { overrideAttachmentSchema } from '../../../../../../lib/types'

class GetCaseAttachmentHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id, aid } = req.query as { id?: string; aid?: string }

    if (!id || !aid) {
      return res.status(400).end()
    }

    if (req.method === 'GET') {
      try {
        return await this.fetchAttachment(id, aid, req, res)
      } catch (e) {
        logger.warn(`Failed to fetch attachment`, {
          error: e,
          caseId: id,
          attachmentId: aid,
        })

        if (isResponse(e)) {
          const json = await e.json()

          logger.warn(`Failed to fetch attachment`, {
            message: json.message,
          })

          return void res
            .status(json.statusCode)
            .json({ message: json.message })
        }

        return void res.status(500).end()
      }
    }

    if (req.method === 'PUT') {
      try {
        return await this.overwriteAttachment(
          id,
          aid,
          JSON.parse(req.body),
          req,
          res,
        )
      } catch (e) {
        if (isResponse(e)) {
          const json = await e.json()

          logger.warn(`Failed to override attachment ${json.message}`)

          return void res
            .status(json.statusCode)
            .json({ message: json.message })
        }

        logger.warn(`Failed to overwrite attachment`, {
          error: e,
          caseId: id,
          attachmentId: aid,
        })
        return void res.status(500).end()
      }
    }
  }

  private async overwriteAttachment(
    caseId: string,
    attachmentId: string,
    body: z.infer<typeof overrideAttachmentSchema>,
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    const dmrClient = createDmrClient()
    const parsed = overrideAttachmentSchema.parse(body)

    const response = await dmrClient.overwriteCaseAttachment({
      caseId: caseId,
      attachmentId: attachmentId,
      postApplicationAttachmentBody: parsed,
    })

    return res.status(200).json({
      url: response.url,
    })
  }

  private async fetchAttachment(
    caseId: string,
    attachmentId: string,
    req: NextApiRequest,
    res: NextApiResponse,
  ) {
    const dmrClient = createDmrClient()

    const response = await dmrClient.getCaseAttachment({
      caseId: caseId,
      attachmentId: attachmentId,
    })

    return res.status(200).json({
      url: response.url,
    })
  }
}

const instance = new GetCaseAttachmentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)