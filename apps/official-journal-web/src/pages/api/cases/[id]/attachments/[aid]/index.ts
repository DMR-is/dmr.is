import type { NextApiRequest, NextApiResponse } from 'next/types'

import { z } from 'zod'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { isResponse } from '@dmr.is/utils/client'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../../lib/api/routeHandler'
import { overrideAttachmentSchema } from '../../../../../../lib/types'

class GetCaseAttachmentHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id, aid } = req.query as { id?: string; aid?: string }

    if (!id || !aid) {
      return res.status(400).end()
    }

    if (req.method === 'GET') {
      try {
        return void (await this.fetchAttachment(id, aid, req, res))
      } catch (e) {
        this.logger.warn(`Failed to fetch attachment`, {
          error: e,
          caseId: id,
          attachmentId: aid,
        })

        if (isResponse(e)) {
          const json = await e.json()

          this.logger.warn(`Failed to fetch attachment`, {
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

          this.logger.warn(`Failed to override attachment ${json.message}`)

          return void res
            .status(json.statusCode)
            .json({ message: json.message })
        }

        this.logger.warn(`Failed to overwrite attachment`, {
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
    const parsed = overrideAttachmentSchema.parse(body)

    const response = await this.client.overwriteCaseAttachment({
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
    const response = await this.client.getCaseAttachment({
      caseId: caseId,
      attachmentId: attachmentId,
    })

    return res.status(200).json({
      url: response.url,
    })
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, GetCaseAttachmentHandler)
