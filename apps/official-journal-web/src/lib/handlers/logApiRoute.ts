import { getLogger } from '@dmr.is/logging'

import { HandlerDecorator } from '../types'

export const logApiRoute: HandlerDecorator = (handler) => async (req, res) => {
  const logger = getLogger('logApiRoute')
  const { method, url, query } = req
  logger.info(`API request method: ${method} url: ${url}`, {
    category: 'api',
    method,
    url,
    query,
  })
  return handler(req, res)
}

export default logApiRoute
