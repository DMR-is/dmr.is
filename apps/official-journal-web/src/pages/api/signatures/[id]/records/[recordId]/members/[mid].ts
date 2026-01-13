import type { NextApiRequest, NextApiResponse } from 'next/types'

import * as z from 'zod'

import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../../../lib/api/routeHandler'

const signatureMemberSchema = z.object({
  name: z.string().optional(),
  textAbove: z.string().optional(),
  textBelow: z.string().optional(),
  textBefore: z.string().optional(),
  textAfter: z.string().optional(),
})

class SignatureMemberHandler extends RouteHandler {
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

    await this.client.updateSignatureMember({
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

    this.client.deleteSignatureMember({
      signatureId: id,
      recordId: recordId,
      memberId: mid,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, SignatureMemberHandler)
