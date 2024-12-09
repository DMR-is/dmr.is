import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'

class UserHandler {
  private readonly client = createDmrClient()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    return res.status(200).json({ message: 'Hello from the API' })
  }

  private async post(req: NextApiRequest, res: NextApiResponse) {}
}

const instance = new UserHandler()

export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
