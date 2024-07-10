import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdatePublishDateHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string }
    const { date } = req.body

    if (!id || !date) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updatePublishDate({
      id: id,
      updatePublishDateBody: {
        date,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdatePublishDateHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
