import type { NextApiRequest, NextApiResponse } from 'next/types'

import * as z from 'zod'

import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'

import { handlerWrapper, RouteHandler } from '../../../../lib/api/routeHandler'
import { OJOIWebException } from '../../../../lib/constants'

const uploadAssetSchema = z.object({
  key: z.string(),
  caseId: z.string(),
})

class UploadAssetHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const reqbody = JSON.parse(req.body)
    const parsed = uploadAssetSchema.safeParse(reqbody)

    if (!parsed.success) {
      return void res
        .status(400)
        .json(OJOIWebException.badRequest('Invalid request body'))
    }

    const body: z.infer<typeof uploadAssetSchema> = reqbody

    const { key, caseId } = body

    const response = await this.client.uploadApplicationAttachment({
      caseId: caseId,
      postApplicationAssetBody: {
        key,
      },
    })

    return res.status(200).json({
      url: response.url,
      cdn: process.env.ADVERTS_CDN_URL,
    })
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UploadAssetHandler)
