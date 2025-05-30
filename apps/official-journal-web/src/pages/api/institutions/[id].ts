import type { NextApiRequest, NextApiResponse } from 'next'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'

class InstitutionHandler extends RouteHandler {
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
      this.logger.error('Error in InstitutionHandler', {
        context: 'InstitutionHandler',
        category: 'InstitutionHandler',
        error: error,
      })
      return void res.status(500).json({ message: 'Internal server error' })
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const institutions = await this.client.getInstitution({
      id: req.query.id as string,
    })

    return res.status(200).json(institutions)
  }

  private async update(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string

    await this.client.updateInstitution({
      id: id,
      updateInstitution: req.body,
    })

    return res.status(204).end()
  }

  private async delete(req: NextApiRequest, res: NextApiResponse) {
    const id = req.query.id as string
    await this.client.deleteInstitution({
      id: id,
    })

    return res.status(204).end()
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, InstitutionHandler)
