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

export const createDmrClient = (token: string) => new DefaultApi(config(token))
