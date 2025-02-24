import type { NextApiRequest, NextApiResponse } from 'next/types'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'
import { OJOIWebException } from '../../../../lib/constants'

const uploadAssetSchema = z.object({
  key: z.string(),
  caseId: z.string(),
})

class UploadAssetHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const reqbody = JSON.parse(req.body)
    const parsed = uploadAssetSchema.safeParse(reqbody)
    const auth = await getToken({ req })

    if (!parsed.success) {
      return void res
        .status(400)
        .json(OJOIWebException.badRequest('Invalid request body'))
    }

    const body: z.infer<typeof uploadAssetSchema> = reqbody

    const { key, caseId } = body

    const dmrClient = createDmrClient()

    const response = await dmrClient
      .withMiddleware(new AuthMiddleware(auth?.accessToken))
      .uploadApplicationAttachment({
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

const instance = new UploadAssetHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
