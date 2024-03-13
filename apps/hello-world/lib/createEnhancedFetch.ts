import nodeFetch from 'node-fetch'
import { EnhancedFetchAPI } from './types'
import { buildFetch } from './buildFetch'

const DEFAULT_TIMEOUT = 1000 * 20 // seconds

export const createEnhancedFetch = (): EnhancedFetchAPI => {
  const builder = buildFetch(nodeFetch)

  // no options for now

  return builder.getFetch()
}
