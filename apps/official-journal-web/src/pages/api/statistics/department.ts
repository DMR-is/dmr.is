import type { NextApiRequest, NextApiResponse } from 'next/types'
import { LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'
import { isResponse } from '@dmr.is/utils/client'

import { GetStatisticsForDepartmentSlugEnum } from '../../../gen/fetch'
import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'

class GetStatisticsForDepartmentHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void (await this.get(req, res))
        case 'POST':
          return void res.status(405).end(OJOIWebException.methodNotAllowed())
      }
    } catch (error) {
      if (isResponse(error)) {
        const parsed = await error.json()
        return res.status(error.status).json(parsed)
      }

      return void res.status(500).end(OJOIWebException.serverError())
    }
  }

  @LogMethod(false)
  private async get(req: NextApiRequest, res: NextApiResponse) {
    const slug = req.query?.slug as GetStatisticsForDepartmentSlugEnum

    const statistics = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getStatisticsForDepartment({
        slug: slug,
      })

    return res.status(200).json(statistics)
  }
}

const instance = new GetStatisticsForDepartmentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
