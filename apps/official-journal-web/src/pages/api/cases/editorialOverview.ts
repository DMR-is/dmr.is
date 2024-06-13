import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'
import { auditAPIRoute, handleAPIException } from '../../../lib/api/utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  auditAPIRoute({ req })

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const extract = (key: string | string[] | undefined) =>
      Array.isArray(key) ? key[0] : key

    const dmrClient = createDmrClient()

    const { status, department, category, type, page, pageSize, search } =
      req.query

    const currentPage = extract(page) ?? 1
    const currentPageSize = extract(pageSize)
      ? Math.min(Number(extract(pageSize)), 100)
      : 10

    const cases = await dmrClient.getEditorialOverview({
      search: extract(search),
      category: extract(category),
      type: extract(type),
      status: extract(status),
      department: extract(department),
      page: `${currentPage}`,
      pageSize: `${currentPageSize}`,
    })

    return res.status(200).json(cases)
  } catch (error) {
    handleAPIException({ error, res })
  }
}
