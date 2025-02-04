import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  institution: z.string().optional(),
  date: z.string().optional(),
  additionalSignature: z.string().optional(),
})

class SignatureHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'PUT':
        return void (await this.update(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async update(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateSignature({
        id: id,
        updateSignatureBody: parsed.data,
      })

    return res.status(204).end()
  }
}

const instance = new SignatureHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
