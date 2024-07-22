import type { NextApiRequest, NextApiResponse } from 'next/types'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'

import { createDmrClient } from '../../../../lib/api/createClient'

class UpdateDepartmentHandler {
  @LogMethod(false)
  @HandleApiException()
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
