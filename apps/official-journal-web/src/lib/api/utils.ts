import { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '@dmr.is/logging'

type AuditAPIRouteParams = {
  req: NextApiRequest
}

export const auditAPIRoute = ({ req }: AuditAPIRouteParams) => {
  const { method, url } = req
  logger.info(`API request method: ${method} url: ${url}`, {
    category: 'api',
    method,
    url,
  })
}

type HandleAPIExceptionParams = {
  error: unknown
  message?: string
  res: NextApiResponse
}
export const handleAPIException = ({
  error,
  message = 'Internal server error',
  res,
}: HandleAPIExceptionParams) => {
  if (error instanceof Error) {
    logger.error(`Error in /api/cases/[id]: ${error.message}`, {
      category: 'api',
      error: {
        stack: error.stack,
        message: error.message,
      },
    })
  } else {
    logger.error(`Error in /api/cases/[id]: ${message}`, {
      category: 'api',
      error,
    })
  }

  return res.status(500).json({ message: message })
}
