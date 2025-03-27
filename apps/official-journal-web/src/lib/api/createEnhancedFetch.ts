import nodeFetch from 'node-fetch'

import { buildFetch } from './buildFetch'
import { createAuthErrorMiddleware } from './handleAuthErrors'
import { EnhancedFetchAPI } from './types'

export const createEnhancedFetch = (): EnhancedFetchAPI => {
  const builder = buildFetch(nodeFetch)

  builder.wrap(createAuthErrorMiddleware, {})
  // add more middleware here if needed ...

  return builder.getFetch()
}
