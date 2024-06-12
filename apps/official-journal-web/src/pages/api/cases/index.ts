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

    const { status, department, search } = req.query

    console.log('status', status)
    console.log('department', department)
    console.log('search', search)

    const cases = await dmrClient.getCases({
      search: extract(search),
      status: extract(status),
      department: extract(department),
    })
    return res.status(200).json(cases)
  } catch (error) {
    handleAPIException({ error, res })
  }
}
