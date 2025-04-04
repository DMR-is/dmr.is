import type { NextApiRequest, NextApiResponse } from 'next'

import { handlerWrapper, RouteHandler } from '../../../lib/api/routeHandler'

class InstitutionsHandler extends RouteHandler {
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
      this.logger.error('Error in InstitutionsHandler', {
        context: 'InstitutionsHandler',
        category: 'InstitutionsHandler',
        error: error,
      })
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const search = req.query?.search as string | undefined
    const page = parseInt(req.query.page as string) || undefined
    const pageSize = parseInt(req.query.pageSize as string) || undefined

    const institutions = await this.client.getInstitutions({
      search,
      page,
      pageSize,
    })

    return res.status(200).json(institutions)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    const institution = await this.client.createInstitution({
      createInstitution: req.body,
    })

    return res.status(201).json(institution)
  }
}

export default (req: NextApiRequest, res: NextApiResponse) =>
  handlerWrapper(req, res, InstitutionsHandler)
