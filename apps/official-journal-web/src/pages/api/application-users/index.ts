import { NextApiRequest, NextApiResponse } from 'next'
import { LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'

class ApplicationUsersHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
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
      logger.error('Error in ApplicationUsersHandler', {
        context: 'ApplicationUsersHandler',
        category: 'ApplicationUsersHandler',
        error: error,
      })
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  @LogMethod(false)
  private async get(req: NextApiRequest, res: NextApiResponse) {
    const involvedPartyId = req.query.involvedParty as string | undefined

    const applicationUser = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getApplicationUsers({
        involvedParty: involvedPartyId,
      })

    return res.status(200).json(applicationUser)
  }

  @LogMethod(false)
  private async create(req: NextApiRequest, res: NextApiResponse) {
    const applicationUser = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createApplicationUser({
        createApplicationUser: req.body,
      })

    return res.status(201).json(applicationUser)
  }
}

const instance = new ApplicationUsersHandler()

export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)