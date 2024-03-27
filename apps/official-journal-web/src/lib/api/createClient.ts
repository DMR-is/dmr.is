import { Configuration, DefaultApi } from '../../gen/fetch'
import { createEnhancedFetch } from './createEnhancedFetch'

const config: Configuration = new Configuration({
  fetchApi: createEnhancedFetch(),
  basePath:
    process.env.NODE_ENV === 'production'
      ? process.env.DMR_BASE_PATH
      : `http://localhost:${process.env.ADMIN_PORT ?? 4000}`,
})

export const createDmrClient = () => new DefaultApi(config)
