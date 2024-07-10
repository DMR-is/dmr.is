import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateTitleHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }
    const { title } = req.body

    if (!id || !title) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updateTitle({
      id,
      updateTitleBody: {
        title,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdateTitleHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
