import nodeFetch from 'node-fetch'

import { buildFetch } from './buildFetch'
import { EnhancedFetchAPI } from './types'

export const createEnhancedFetch = (): EnhancedFetchAPI => {
  const builder = buildFetch(nodeFetch)

  // add more middleware here if needed ...

  return builder.getFetch()
}
