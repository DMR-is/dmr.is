import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleException } from '@dmr.is/decorators'

class UpdatePriceHandler {
  @Audit()
  @HandleException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Hello from UpdatePriceHandler')
    return res.status(200).json({ message: 'Hello' })
  }
}

const instance = new UpdatePriceHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
