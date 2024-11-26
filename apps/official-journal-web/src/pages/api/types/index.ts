import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'
import { tryParseInt } from '../../../lib/utils'

const createTypeSchema = z.object({
  mainTypeId: z.string(),
  title: z.string(),
})

class TypesHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void (await this.get(req, res))
        case 'POST':
          return void (await this.create(req, res))
        default:
          return void res.status(405).json({ message: 'Method not allowed' })
      }
    } catch (error) {
      logger.error('Failed to handle request', {
        error: error,
        category: 'api-types-handler',
      })

      return void res.status(500).json({ message: 'Internal server error' })
    }
  }

  @LogMethod(false)
  private async get(req: NextApiRequest, res: NextApiResponse) {
    const { page, pageSize, id, slug, search, department } = req.query as {
      page?: string
      pageSize?: string
      search?: string
      id?: string
      slug?: string
      department?: string
    }

    const offset = tryParseInt(page, DEFAULT_PAGE_NUMBER)
    const limit = tryParseInt(pageSize, DEFAULT_PAGE_SIZE)

    const types = await this.client.getTypes({
      id: id,
      slug: slug,
      department: department,
      search: search,
      page: offset,
      pageSize: limit,
    })

    return res.status(200).json(types)
  }

  @LogMethod(false)
  private async create(req: NextApiRequest, res: NextApiResponse) {
    const parsed = createTypeSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request body' })
    }

    const type = await this.client.createType({
      createAdvertTypeBody: parsed.data,
    })

    return res.status(201).json(type)
  }
}

const instance = new TypesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
