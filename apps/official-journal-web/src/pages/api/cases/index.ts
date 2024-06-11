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

  const { status, department } = req.query

  try {
    const cases = await dmrClient.getCases({
      status: extract(status),
      department: extract(department),
    })
    return res.status(200).json(cases)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
