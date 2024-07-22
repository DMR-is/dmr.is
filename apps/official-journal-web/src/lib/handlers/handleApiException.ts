import { logger } from '@dmr.is/logging'

import { HandlerDecorator } from '../types'

export const handleAPIException: HandlerDecorator =
  (handler) => async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      const { method, url, query } = req
      logger.error(`Exception occurred, ${method}: ${url}`, {
        category: 'api',
        error,
        method,
        url,
        query,
      })
      res.status(500).json({ message: 'Internal server error' })
    }
  }

export default handleAPIException
