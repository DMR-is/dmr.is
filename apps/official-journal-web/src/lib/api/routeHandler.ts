import { NextApiRequest, NextApiResponse } from 'next'

import { getDmrClient } from './createClient'

export class RouteHandler {
  public readonly client

  constructor(token: string, req?: NextApiRequest) {
    this.client = getDmrClient(token, req)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handler(_req: NextApiRequest, res: NextApiResponse): Promise<any> {
    res.status(401).json({ message: 'Unauthorized' })
  }
}

export async function handlerWrapper(
  req: NextApiRequest,
  res: NextApiResponse,
  Class: new (token: string, req?: NextApiRequest) => RouteHandler,
) {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).end()
  }

  const routeClass = new Class(token, req)
  return routeClass.handler(req, res)
}
