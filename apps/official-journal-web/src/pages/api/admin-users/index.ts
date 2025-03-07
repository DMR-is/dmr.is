import type { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '@dmr.is/logging'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'

class UsersHandler extends RouteHandler {
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
      logger.error('Error in UsersHandler', {
        context: 'UsersHandler',
        category: 'UsersHandler',
        error: error,
      })
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const users = await this.client.getUsers()

    return res.status(200).json(users)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    await this.client.createUser({
      createAdminUser: req.body,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, UsersHandler)
