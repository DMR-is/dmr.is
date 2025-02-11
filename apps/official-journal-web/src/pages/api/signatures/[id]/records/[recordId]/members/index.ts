import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { CreateSignatureMemberMemberTypeEnum } from '../../../../../../../gen/fetch'
import { createDmrClient } from '../../../../../../../lib/api/createClient'

const bodyShema = z.object({
  memberType: z.nativeEnum(CreateSignatureMemberMemberTypeEnum),
})

class SignatureMembersHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'POST':
        return void (await this.post(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async post(req: NextApiRequest, res: NextApiResponse) {
    const { id, recordId } = req.query as {
      id: string
      recordId: string
    }

    const parsed = bodyShema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createSignatureMember({
        signatureId: id,
        recordId: recordId,
        memberType: parsed.data.memberType,
      })

    return res.status(204).end()
  }
}

const instance = new SignatureMembersHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
