import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { AuthMiddleware } from '@dmr.is/middleware'

import { GetFinishedCasesDepartmentSlugEnum } from '../../../gen/fetch'
import { createDmrClient } from '../../../lib/api/createClient'
import { OJOIWebException } from '../../../lib/constants'
class GetPublishedCasesHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    switch (req.method) {
      case 'GET':
        return void (await this.get(req, res))
      default:
        return void res.status(405).json(OJOIWebException.methodNotAllowed())
    }
  }

  private async get(req: NextApiRequest, res: NextApiResponse) {
    const cases = await this.client
      .withMiddleware(new AuthMiddleware(req.headers.authorization))
      .getFinishedCases({
        departmentSlug: req.query
          .departmentSlug as GetFinishedCasesDepartmentSlugEnum,
        page: req.query?.page as number | undefined,
        pageSize: req.query?.pageSize as number | undefined,
      })

    return res.status(200).json(cases)
  }
}

const instance = new GetPublishedCasesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
