import { NextApiRequest, NextApiResponse } from 'next'
import { AuthMiddleware } from '@dmr.is/middleware'

import { createDmrClient } from '../../../lib/api/createClient'

class InstitutionsHandler {
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
    const search = req.query?.search as string
    const page = parseInt(req.query.page as string) || undefined
    const pageSize = parseInt(req.query.pageSize as string) || undefined

    const institutions = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getInstitutions({
        search,
        page,
        pageSize,
      })

    return res.status(200).json(institutions)
  }

  private async create(req: NextApiRequest, res: NextApiResponse) {
    const institution = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .createInstitution(req.body)

    return res.status(201).json(institution)
  }
}

const instance = new InstitutionsHandler()

export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
