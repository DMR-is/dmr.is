import { Configuration, DefaultApi } from '../gen/fetch'
import { createEnhancedFetch } from './createEnhancedFetch'

const config: Configuration = new Configuration({
  fetchApi: createEnhancedFetch(),
  basePath: 'http://localhost:3000',
})

export const dmrApi = new DefaultApi(config)
