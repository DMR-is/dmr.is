import type { NextApiRequest, NextApiResponse } from 'next/types'
import { z } from 'zod'
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { HandleApiException, LogMethod } from '@dmr.is/decorators'
import { logger } from '@dmr.is/logging'

import { createDmrClient } from '../../../lib/api/createClient'
import { tryParseInt } from '../../../lib/utils'

const createMainTypeSchema = z.object({
  departmentId: z.string(),
  title: z.string(),
})

class GetMainTypesHandler {
  private readonly client = createDmrClient()

  @LogMethod(false)
  @HandleApiException()
  public async handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      switch (req.method) {
        case 'GET':
          return void this.get(req, res)
        case 'POST':
          return void this.create(req, res)
        default:
          return void res.status(405).end()
      }
    } catch (error) {
      logger.error('Failed to handle request', {
        error: error,
        method: req.method,
        url: req.url,
        category: 'api-main-types-handler',
      })
      return void res.status(500).end('Internal server')
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

    const mainTypes = await this.client.getMainTypes({
      id: id,
      slug: slug,
      department: department,
      search: search,
      page: offset,
      pageSize: limit,
    })

    return res.status(200).json(mainTypes)
  }

  @LogMethod(false)
  private async create(req: NextApiRequest, res: NextApiResponse) {
    const parsed = createMainTypeSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid request body' })
    }

    const type = await this.client.createMainType({
      createAdvertMainTypeBody: {
        departmentId: parsed.data.departmentId,
        title: parsed.data.title,
      },
    })

    return res.status(200).json(type)
  }
}

const instance = new GetMainTypesHandler()
export default (req: NextApiRequest, res: NextApiResponse) =>
  instance.handler(req, res)
