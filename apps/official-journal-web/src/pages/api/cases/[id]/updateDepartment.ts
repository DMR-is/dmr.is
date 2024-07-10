import type { NextApiRequest, NextApiResponse } from 'next/types'
import { Audit, HandleApiException, Post } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateDepartmentHandler {
  @Audit({ logArgs: false })
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    const { caseId, departmentId } = req.body

    if (!caseId || !departmentId) {
      return res.status(400).end()
    }

    if (!id || id !== caseId) {
      return res.status(400).end()
    }

    const dmrClient = createDmrClient()

    await dmrClient.updateDepartment({
      id: caseId,
      updateCaseDepartmentBody: {
        departmentId: departmentId,
      },
    })

    return res.status(200).end()
  }
}

const instance = new UpdateDepartmentHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
