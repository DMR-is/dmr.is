import { NextApiRequest, NextApiResponse } from 'next'
import { getLogger } from '@dmr.is/logging'

import { getDmrClient } from './createClient'

export class RouteHandler {
  public readonly client
  public readonly logger

  constructor(token: string, logCategory: string) {
    this.client = getDmrClient(token)
    this.logger = getLogger(logCategory)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handler(_req: NextApiRequest, res: NextApiResponse): Promise<any> {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

export async function handlerWrapper(
  req: NextApiRequest,
  res: NextApiResponse,
  Class: new (token: string, logCategory: string) => RouteHandler, // Expect a constructor that takes a token
) {
  // Get the token from the Authorization header
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).end()
  }

  // Create an instance of the passed class, initializing it with the token
  const routeClass = new Class(token, String(Class.name))

  // Call the handle method on the handler instance
  return routeClass.handler(req, res)
}
