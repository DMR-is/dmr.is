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
    const dmrClient = createDmrClient()

    const extract = (key: string | string[] | undefined) =>
      Array.isArray(key) ? key[0] : key

    const { page, pageSize, search } = req.query

    const currentPage = extract(page) ?? 1
    const currentPageSize = extract(pageSize)
      ? Math.min(Number(extract(pageSize)), 1000)
      : 10

    const categories = await dmrClient.getCategories({
      page: Number(currentPage),
      pageSize: currentPageSize,
      search: extract(search),
    })

    return res.status(200).json(categories)
  } catch (error) {
    handleAPIException({ error, res })
  }
}
