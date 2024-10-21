import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { HandleApiException, LogMethod, Post } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'
import { isResponse } from '@dmr.is/utils/client'

import { createDmrClient } from '../../../../lib/api/createClient'

const bodySchema = z.object({
  typeId: z.string(),
})

class UpdateTypeHandler {
  @LogMethod(false)
  @HandleApiException()
  @Post()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id?: string }

    if (!id) {
      return void res.status(400).end()
    }

    const parsed = bodySchema.safeParse(req.body)

    if (!parsed.success) {
      logger.debug(
        `Validation on body failed when updating type on case<${id}>`,
        { body: req.body, caseId: id },
      )
      return void res.status(400).end()
    }

    const dmrClient = createDmrClient()

    try {
      await dmrClient.updateType({
        id: id,
        updateCaseTypeBody: {
          typeId: parsed.data.typeId,
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        logger.debug(`Failed to update type on case<${id}>`, {
          error: {
            message: error.message,
            stack: error.stack,
          },
          caseId: id,
        })
      } else {
        logger.debug(`Failed to update type on case<${id}>`, {
          error: error,
          caseId: id,
        })
      }
      return void res.status(500).end()
    }

    return void res.status(200).end()
  }
}

const instance = new UpdateTypeHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
