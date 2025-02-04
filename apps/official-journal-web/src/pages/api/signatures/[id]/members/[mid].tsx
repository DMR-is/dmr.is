import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../lib/api/createClient'

const signatureMemberSchema = z.object({
  text: z.string().optional(),
  textAbove: z.string().optional(),
  textBelow: z.string().optional(),
  textBefore: z.string().optional(),
  textAfter: z.string().optional(),
})

class SignatureMembersHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'PUT':
        return void (await this.udpate(req, res))
      case 'DELETE':
        return void (await this.delete(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async udpate(req: NextApiRequest, res: NextApiResponse) {
    const { id, mid } = req.query as { id?: string; mid?: string }

    if (!id || !mid) {
      return res.status(400).end()
    }

    const parsed = signatureMemberSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateSignatureMemeber({
        signatureId: id,
        memberId: mid,
        updateSignatureMember: req.body,
      })

    return res.status(204).end()
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    const { id, mid } = req.query as { id?: string; mid?: string }

    if (!id || !mid) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .removeMemberFromSignature({
        signatureId: id,
        memberId: mid,
      })

    return res.status(204).end()
  }
}

const instance = new SignatureMembersHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
