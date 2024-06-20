import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

class UpdatePriceHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    return res.status(200).json({
      message: 'OK',
    })
  }
}

const instance = new UpdatePriceHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
