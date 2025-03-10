import { Configuration, DefaultApi } from '../../gen/fetch'
import { createEnhancedFetch } from './createEnhancedFetch'

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

const clientConfig = (token: string) => {
  return new Configuration({
    fetchApi: createEnhancedFetch(),
    accessToken: token,
    basePath:
      process.env.NEXT_PUBLIC_DMR_ADMIN_API_BASE_PATH ??
      'http://localhost:4000',
  })
}

let dmrClient: DefaultApi | undefined

export const getDmrClient = (token: string) => {
  if (typeof window === 'undefined') {
    // Server: always make a new dmr client
    return new DefaultApi(config(token))
  }

  // Browser: use singleton pattern to keep the same dmr client
  return (dmrClient ??= new DefaultApi(clientConfig(token)))
}
