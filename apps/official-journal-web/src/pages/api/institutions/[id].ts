import { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '@dmr.is/logging'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'

class InstitutionHandler {
  private readonly client = createDmrClient()
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
      logger.error('Error in InstitutionHandler', {
        context: 'InstitutionHandler',
        category: 'InstitutionHandler',
        error: error,
      })
      return void res.status(500).json({ message: 'Internal server error' })
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const institutions = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getInstitution({ id: req.query.id as string })

    return res.status(200).json(institutions)
  }

  private async update(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string

    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .updateInstitution({
        id: id,
        updateInstitution: req.body,
      })

    return res.status(204).end()
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string
    await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .deleteUser({
        id: id,
      })

    return res.status(204).end()
  }
}

const instance = new InstitutionHandler()

export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
