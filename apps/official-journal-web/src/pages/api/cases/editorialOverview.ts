import { NextApiRequest, NextApiResponse } from 'next'

import { createDmrClient } from '../../../lib/api/createClient'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const extract = (key: string | string[] | undefined) =>
    Array.isArray(key) ? key[0] : key

  const dmrClient = createDmrClient()

  const { status, department, page, pageSize } = req.query

  const currentPage = extract(page) ?? 1
  const currentPageSize = extract(pageSize)
    ? Math.min(Number(extract(pageSize)), 100)
    : 10

  try {
    const cases = await dmrClient.getEditorialOverview({
      status: extract(status),
      department: extract(department),
      page: `${currentPage}`,
      pageSize: `${currentPageSize}`,
    })

    return res.status(200).json(cases)
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
