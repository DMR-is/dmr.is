import nodeFetch from 'node-fetch'

import { buildFetch } from './buildFetch'
import { EnhancedFetchAPI } from './types'

export const createEnhancedFetch = (): EnhancedFetchAPI => {
  const builder = buildFetch(nodeFetch)

  // no options for now

  return builder.getFetch()
}
