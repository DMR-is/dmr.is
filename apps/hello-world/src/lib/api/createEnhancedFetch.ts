import nodeFetch from 'node-fetch'
import { EnhancedFetchAPI } from './types'
import { buildFetch } from './buildFetch'

export const createEnhancedFetch = (): EnhancedFetchAPI => {
  const builder = buildFetch(nodeFetch)

  // no options for now

  return builder.getFetch()
}
