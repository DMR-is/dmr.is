import type { NextApiRequest, NextApiResponse } from 'next'
import { LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'

class ApplicationUserHandler extends RouteHandler {
  @LogMethod(false)
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void (await this.get(req, res))
        case 'PUT':
          return void (await this.update(req, res))
        case 'DELETE':
          return void (await this.delete(req, res))
        default:
          return void res.status(405).end()
      }
    } catch (error) {
      logger.error('Error in ApplicationUserHandler', {
        context: 'ApplicationUserHandler',
        category: 'ApplicationUserHandler',
        error: error,
      })
      return void res.status(500).json({ message: 'Internal server error' })
    }
  }

  @LogMethod(false)
  private async get(req: NextApiRequest, res: NextApiResponse) {
    const applicationUser = await this.client.getApplicationUser({
      id: req.query.id as string,
    })

    return res.status(200).json(applicationUser)
  }

  @LogMethod(false)
  private async update(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string

    const applicationUser = await this.client.updateApplicationUser({
      id: id,
      updateApplicationUser: req.body,
    })

    return res.status(200).json(applicationUser)
  }

  @LogMethod(false)
  private async delete(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string
    await this.client.deleteApplicationUser({
      id: id,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, ApplicationUserHandler)
