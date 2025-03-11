import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Delete, HandleApiException, LogMethod } from '@dmr.is/decorators'

import {
  handlerWrapper,
  RouteHandler,
} from '../../../../../../lib/api/routeHandler'

class DeleteCommentHandler extends RouteHandler {
  @LogMethod(false)
  @HandleApiException()
  @Delete()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id, cid } = req.query as { id?: string; cid?: string }

    if (!id || !cid) {
      return res.status(400).end()
    }

    await this.client.deleteComment({
      id: id,
      commentId: cid,
    })
    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, DeleteCommentHandler)
