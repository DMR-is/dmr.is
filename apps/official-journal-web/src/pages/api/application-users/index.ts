import { NextApiRequest, NextApiResponse } from 'next'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'

class ApplicationUsersHandler {
  private readonly client = createDmrClient()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void (await this.get(req, res))
        case 'POST':
          return void (await this.create(req, res))
        default:
          return void res.status(405).end()
      }
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const involvedPartyId = req.query.involvedPartyId as string

    const applicationUser = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getApplicationUsers({
        involvedParty: involvedPartyId,
      })

    return res.status(200).json(applicationUser)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    const applicationUser = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createInstitution(req.body)

    return res.status(201).json(applicationUser)
  }
}

const instance = new ApplicationUsersHandler()

export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
