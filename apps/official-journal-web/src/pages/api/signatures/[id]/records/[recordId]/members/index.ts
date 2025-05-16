import type { NextApiRequest, NextApiResponse } from 'next/types'

import { z } from 'zod'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { CreateSignatureMemberMemberTypeEnum } from '../../../../../../../gen/fetch'
import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../../../lib/api/routeHandler'

const bodyShema = z.object({
  memberType: z.nativeEnum(CreateSignatureMemberMemberTypeEnum),
})

class SignatureMembersHandler extends RouteHandler {
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

    await this.client.createSignatureMember({
      signatureId: id,
      recordId: recordId,
      memberType: parsed.data.memberType,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, SignatureMembersHandler)
