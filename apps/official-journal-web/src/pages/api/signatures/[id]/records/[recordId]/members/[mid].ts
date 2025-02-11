import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../../../../../lib/api/createClient'

const signatureMemberSchema = z.object({
  name: z.string().optional(),
  textAbove: z.string().optional(),
  textBelow: z.string().optional(),
  textBefore: z.string().optional(),
  textAfter: z.string().optional(),
})

class SignatureMemberHandler {
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
    const { id, recordId, mid } = req.query as {
      id: string
      mid: string
      recordId: string
    }

    const parsed = signatureMemberSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateSignatureMember({
        signatureId: id,
        recordId: recordId,
        memberId: mid,
        updateSignatureMember: parsed.data,
      })

    return res.status(204).end()
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    const { id, mid, recordId } = req.query as {
      id: string
      mid: string
      recordId: string
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .deleteSignatureMember({
        signatureId: id,
        recordId: recordId,
        memberId: mid,
      })

    return res.status(204).end()
  }
}

const instance = new SignatureMemberHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
