import getConfig from 'next/config'

import { Configuration, DefaultApi } from '../../gen/fetch'
import { createEnhancedFetch } from './createEnhancedFetch'

const { publicRuntimeConfig } = getConfig()
const config = (token: string) => {
  return new Configuration({
    fetchApi: createEnhancedFetch(),
    accessToken: token,
    basePath:
      process.env.NODE_ENV === 'production'
        ? process.env.DMR_ADMIN_API_BASE_PATH
        : 'http://localhost:4000',
  })
}

const clientConfig = (token: string, basePath: string) => {
  // Test to see if publicRuntimeConfig is available in new deployment
  // eslint-disable-next-line no-console
  console.log('publicRuntimeConfig', publicRuntimeConfig)
  return new Configuration({
    fetchApi: createEnhancedFetch(),
    accessToken: token,
    basePath: basePath,
  })
}

let dmrClient: DefaultApi | undefined

export const getDmrClient = (token: string, basePath?: string) => {
  if (typeof window === 'undefined') {
    // Server: always make a new dmr client
    return new DefaultApi(config(token))
  }

  // Browser: use singleton pattern to keep the same dmr client
  return (dmrClient ??= new DefaultApi(clientConfig(token, basePath as string)))
}
