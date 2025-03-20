import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../../lib/api/routeHandler'

const bodySchema = z.object({
  institution: z.string().optional(),
  signatureDate: z.string().optional(),
  additional: z.string().optional(),
})

class SignatureRecordHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'PUT':
        return void (await this.update(req, res))
      case 'DELETE':
        return void (await this.delete(req, res))
      default:
        return res.status(405).end()
    }
  }

  private async update(req: NextApiRequest, res: NextApiResponse) {
    const { id, recordId } = req.query as { id: string; recordId: string }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).end()
    }

    await this.client.updateSignatureRecord({
      signatureId: id,
      recordId: recordId,
      updateSignatureRecord: parsed.data,
    })

    return res.status(204).end()
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    const { id, recordId } = req.query as { id: string; recordId: string }

    await this.client.deleteSignatureRecord({
      signatureId: id,
      recordId: recordId,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, SignatureRecordHandler)
