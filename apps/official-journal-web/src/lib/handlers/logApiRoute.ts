import { getLogger } from '@dmr.is/logging'

import { HandlerDecorator } from '../types'

export const logApiRoute: HandlerDecorator = (handler) => async (req, res) => {
  const logger = getLogger('api')
  const { method, url, query } = req
  logger.info(`API request method: ${method} url: ${url}`, {
    method,
    url,
    query,
  })
  return handler(req, res)
}

export default logApiRoute
